<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Wheel;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Public share links: /{code} snapshots of a wheel. */
class ShareController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'show_title' => ['boolean'],
            'visibility' => ['required', Rule::in(['link_spin', 'link_copy', 'public'])],
            'config' => ['required', 'array'],
            'config.entries' => ['required', 'array', 'min:1'],
        ]);
        if ($data['visibility'] === 'public' && SiteSettings::get('allow_gallery') !== '1') {
            $data['visibility'] = 'link_copy';
        }

        $wheel = new Wheel([
            'user_id' => $request->user('sanctum')?->id,
            'kind' => 'shared',
            'share_code' => Wheel::generateShareCode(),
            'title' => strip_tags($data['title'] ?? '') ?: null,
            'description' => strip_tags($data['description'] ?? '') ?: null,
            'visibility' => $data['visibility'],
            'show_title' => $data['show_title'] ?? true,
            'last_viewed_at' => now(),
            'creator_ip' => $request->ip(),
        ]);
        $wheel->fillConfig($data['config'])->save();
        AuditLog::record('share.created', ['code' => $wheel->share_code], $wheel->user_id);

        return response()->json([
            'data' => $wheel->toShareArray(),
            'url' => rtrim(config('app.url'), '/').'/'.$wheel->share_code,
        ], 201);
    }

    public function show(string $code): JsonResponse
    {
        $wheel = Wheel::where('kind', 'shared')->where('share_code', strtolower($code))->firstOrFail();
        // atomic counter without touching updated_at
        Wheel::whereKey($wheel->id)->update([
            'views' => DB::raw('views + 1'),
            'last_viewed_at' => now(),
        ]);
        $wheel->views++;

        return response()->json(['data' => $wheel->toShareArray()]);
    }

    /** Links created by the signed-in user (Account page). */
    public function mine(Request $request): JsonResponse
    {
        $rows = Wheel::where('kind', 'shared')->where('user_id', $request->user()->id)
            ->latest()->limit(500)->get()
            ->map(fn (Wheel $w) => collect($w->toShareArray(true))->except('config'));

        return response()->json(['data' => $rows]);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $wheel = $this->owned($request, $code);
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:150'],
            'visibility' => ['sometimes', Rule::in(['link_spin', 'link_copy', 'public'])],
            'show_title' => ['sometimes', 'boolean'],
        ]);
        $wheel->update($data);

        return response()->json(['data' => $wheel->toShareArray(true)]);
    }

    public function destroy(Request $request, string $code): JsonResponse
    {
        $this->owned($request, $code)->delete();

        return response()->json(['ok' => true]);
    }

    private function owned(Request $request, string $code): Wheel
    {
        return Wheel::where('kind', 'shared')->where('share_code', $code)
            ->where('user_id', $request->user()->id)->firstOrFail();
    }
}
