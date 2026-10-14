<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poll;
use App\Models\PollVote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Polling Wheel.
 *  POST   /polls                       create  -> returns the public code + a secret results key (shown once)
 *  GET    /polls/{code}?device=        poll for voters (+ results when the creator allows it)
 *  POST   /polls/{code}/vote           one vote per device (optionally changeable)
 *  GET    /polls/{code}/results?key=   creator: live results + voter list
 *  PATCH  /polls/{code}?key=           creator: close / reopen / change settings
 *  DELETE /polls/{code}?key=           creator: delete poll and votes
 */
class PollController extends Controller
{
    private const COLORS = ['#9cd60c', '#ff3269', '#fee20a', '#7c5afe', '#31c0ff', '#fb8c00', '#00b894', '#e84393', '#0984e3', '#fdcb6e', '#6c5ce7', '#d63031'];

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:300'],
            'options' => ['required', 'array', 'min:2', 'max:12'],
            'options.*' => ['required'],
            'settings' => ['nullable', 'array'],
            'settings.show_results' => ['nullable', 'boolean'],
            'settings.ask_name' => ['nullable', 'boolean'],
            'settings.allow_change' => ['nullable', 'boolean'],
            'days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        $options = [];
        foreach (array_values($data['options']) as $i => $o) {
            $text = trim((string) (is_array($o) ? ($o['text'] ?? '') : $o));
            if ($text === '') {
                continue;
            }
            $color = is_array($o) && preg_match('/^#[0-9a-f]{6}$/i', $o['color'] ?? '') ? strtolower($o['color']) : self::COLORS[count($options) % count(self::COLORS)];
            $options[] = ['id' => count($options) + 1, 'text' => mb_substr($text, 0, 80), 'color' => $color];
        }
        if (count($options) < 2) {
            return response()->json(['message' => 'Add at least two answers.', 'errors' => ['options' => ['Add at least two answers.']]], 422);
        }

        $key = Str::random(32);
        $poll = Poll::create([
            'code' => Poll::generateCode(),
            'admin_token' => hash('sha256', $key),
            'user_id' => $request->user('sanctum')?->id,
            'question' => trim($data['question']),
            'options' => $options,
            'settings' => [
                'show_results' => (bool) ($data['settings']['show_results'] ?? true),
                'ask_name' => (bool) ($data['settings']['ask_name'] ?? false),
                'allow_change' => (bool) ($data['settings']['allow_change'] ?? false),
            ],
            'creator_ip' => hash('sha256', (string) $request->ip()),
            'expires_at' => now()->addDays((int) ($data['days'] ?? 30)),
        ]);

        return response()->json(['data' => $poll->toPublicArray(), 'key' => $key], 201);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $poll = Poll::where('code', $code)->firstOrFail();
        $poll->increment('views');
        $out = ['data' => $poll->toPublicArray()];

        $mine = $this->myVote($poll, $request->query('device'));
        $out['my_vote'] = $mine?->option_id;
        $isOwner = $poll->checkToken($request->query('key'));
        if ($isOwner || ($poll->setting('show_results', true) && ($mine || ! $poll->isOpen()))) {
            $out['results'] = $poll->tally();
        }
        $out['is_owner'] = $isOwner;

        return response()->json($out);
    }

    public function vote(Request $request, string $code): JsonResponse
    {
        $poll = Poll::where('code', $code)->firstOrFail();
        $data = $request->validate([
            'option_id' => ['required', 'integer'],
            'device' => ['required', 'string', 'min:8', 'max:80'],
            'name' => [$poll->setting('ask_name') ? 'required' : 'nullable', 'string', 'max:80'],
        ]);
        if (! $poll->isOpen()) {
            return response()->json(['message' => 'This poll is closed.'], 422);
        }
        if (! collect($poll->options)->contains('id', (int) $data['option_id'])) {
            return response()->json(['message' => 'Unknown answer.'], 422);
        }

        $hash = hash('sha256', $poll->id.'|'.$data['device']);
        $existing = PollVote::where('poll_id', $poll->id)->where('voter_hash', $hash)->first();
        if ($existing && ! $poll->setting('allow_change')) {
            return response()->json(['message' => 'You have already voted in this poll.', 'my_vote' => $existing->option_id] + $this->resultsFor($poll), 409);
        }

        DB::transaction(function () use ($poll, $existing, $hash, $data) {
            if ($existing) {
                $existing->update(['option_id' => (int) $data['option_id'], 'name' => $data['name'] ?? $existing->name]);
            } else {
                PollVote::create(['poll_id' => $poll->id, 'option_id' => (int) $data['option_id'], 'voter_hash' => $hash, 'name' => isset($data['name']) ? trim($data['name']) : null]);
                $poll->increment('votes_count');
            }
        });

        return response()->json(['ok' => true, 'my_vote' => (int) $data['option_id']] + $this->resultsFor($poll->fresh()));
    }

    public function results(Request $request, string $code): JsonResponse
    {
        $poll = Poll::where('code', $code)->firstOrFail();
        abort_unless($poll->checkToken($request->query('key')), 403, 'Wrong results key.');

        $names = collect($poll->options)->pluck('text', 'id');
        $voters = $poll->votes()->latest('updated_at')->limit(300)->get(['option_id', 'name', 'updated_at'])
            ->map(fn ($v) => ['name' => $v->name, 'option' => $names[$v->option_id] ?? '?', 'option_id' => $v->option_id, 'at' => $v->updated_at?->toIso8601String()]);

        return response()->json([
            'data' => $poll->toPublicArray() + ['views' => $poll->views, 'expires_at' => $poll->expires_at?->toIso8601String()],
            'results' => $poll->tally(),
            'voters' => $voters,
        ]);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $poll = Poll::where('code', $code)->firstOrFail();
        abort_unless($poll->checkToken($request->query('key') ?? $request->input('key')), 403, 'Wrong results key.');
        $data = $request->validate([
            'is_closed' => ['nullable', 'boolean'],
            'settings' => ['nullable', 'array'],
            'settings.show_results' => ['nullable', 'boolean'],
            'settings.allow_change' => ['nullable', 'boolean'],
            'reset' => ['nullable', 'boolean'],
        ]);
        if (array_key_exists('is_closed', $data) && $data['is_closed'] !== null) {
            $poll->is_closed = (bool) $data['is_closed'];
            if (! $poll->is_closed && $poll->expires_at && $poll->expires_at->isPast()) {
                $poll->expires_at = now()->addDays(30);
            }
        }
        if (! empty($data['settings'])) {
            $poll->settings = array_merge($poll->settings ?? [], array_map('boolval', array_filter($data['settings'], fn ($v) => $v !== null)));
        }
        if (! empty($data['reset'])) {
            $poll->votes()->delete();
            $poll->votes_count = 0;
        }
        $poll->save();

        return response()->json(['data' => $poll->toPublicArray(), 'results' => $poll->tally()]);
    }

    public function destroy(Request $request, string $code): JsonResponse
    {
        $poll = Poll::where('code', $code)->firstOrFail();
        abort_unless($poll->checkToken($request->query('key')), 403, 'Wrong results key.');
        $poll->delete();

        return response()->json(['ok' => true]);
    }

    private function myVote(Poll $poll, mixed $device): ?PollVote
    {
        if (! is_string($device) || strlen($device) < 8) {
            return null;
        }

        return PollVote::where('poll_id', $poll->id)->where('voter_hash', hash('sha256', $poll->id.'|'.$device))->first();
    }

    private function resultsFor(Poll $poll): array
    {
        return $poll->setting('show_results', true) ? ['results' => $poll->tally()] : [];
    }
}
