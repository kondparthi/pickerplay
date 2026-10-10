<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Wheel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Developer REST API (header: X-Api-Key).
 *
 *   GET    /api/v1/wheels                list your saved wheels
 *   POST   /api/v1/wheels                create a saved wheel
 *   GET    /api/v1/wheels/{id}           read one
 *   PUT    /api/v1/wheels/{id}           update
 *   DELETE /api/v1/wheels/{id}           delete
 *   POST   /api/v1/shares                create a share link from a config
 *   GET    /api/v1/shares/{code}         read any shared wheel
 *   DELETE /api/v1/shares/{code}         delete one of your shares
 */
class WheelApiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rows = $request->user()->wheels()->where('kind', 'saved')->latest('updated_at')->paginate(50);

        return response()->json([
            'data' => collect($rows->items())->map(fn (Wheel $w) => $w->toSavedArray(false)),
            'meta' => ['total' => $rows->total(), 'page' => $rows->currentPage(), 'last_page' => $rows->lastPage()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $wheel = new Wheel([
            'user_id' => $request->user()->id, 'kind' => 'saved', 'visibility' => 'private',
            'title' => $data['title'], 'description' => $data['description'] ?? null,
        ]);
        $wheel->fillConfig($this->config($data))->save();

        return response()->json(['data' => $wheel->toSavedArray()], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->owned($request, $id)->toSavedArray()]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $wheel = $this->owned($request, $id);
        $data = $this->validated($request);
        $wheel->title = $data['title'];
        $wheel->description = $data['description'] ?? $wheel->description;
        $wheel->fillConfig($this->config($data))->save();

        return response()->json(['data' => $wheel->toSavedArray()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->owned($request, $id)->delete();

        return response()->json(['ok' => true]);
    }

    public function createShare(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $request->validate(['visibility' => ['nullable', Rule::in(['link_spin', 'link_copy', 'public'])]]);
        $wheel = new Wheel([
            'user_id' => $request->user()->id, 'kind' => 'shared', 'share_code' => Wheel::generateShareCode(),
            'title' => $data['title'], 'description' => $data['description'] ?? null,
            'visibility' => $request->input('visibility', 'link_copy'), 'last_viewed_at' => now(),
            'creator_ip' => $request->ip(),
        ]);
        $wheel->fillConfig($this->config($data))->save();
        $base = rtrim(config('app.url'), '/');

        return response()->json([
            'data' => $wheel->toShareArray(),
            'url' => $base.'/'.$wheel->share_code,
            'embed_url' => $base.'/embed/'.$wheel->share_code,
        ], 201);
    }

    public function showShare(string $code): JsonResponse
    {
        $wheel = Wheel::where('kind', 'shared')->where('share_code', $code)->firstOrFail();

        return response()->json(['data' => $wheel->toShareArray()]);
    }

    public function destroyShare(Request $request, string $code): JsonResponse
    {
        Wheel::where('kind', 'shared')->where('share_code', $code)
            ->where('user_id', $request->user()->id)->firstOrFail()->delete();

        return response()->json(['ok' => true]);
    }

    private function owned(Request $request, int $id): Wheel
    {
        return $request->user()->wheels()->where('kind', 'saved')->findOrFail($id);
    }

    /** Accepts either { config: {...} } or a shorthand { entries: ["a","b"], settings: {} } */
    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'config' => ['required_without:entries', 'array'],
            'entries' => ['required_without:config', 'array'],
            'settings' => ['nullable', 'array'],
        ]);
    }

    private function config(array $data): array
    {
        return $data['config'] ?? ['entries' => $data['entries'] ?? [], 'settings' => $data['settings'] ?? []];
    }
}
