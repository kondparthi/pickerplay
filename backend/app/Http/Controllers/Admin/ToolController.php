<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ToolPreset;
use App\Services\SiteSettings;
use App\Services\WheelConfig;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Preset picker SEO pages, e.g. /yes-no-wheel, /number-picker */
class ToolController extends Controller
{
    /** Paths the SPA already uses — a tool slug must not collide with them. */
    public const RESERVED = ['admin', 'api', 'gallery', 'account', 'page', 'embed', 'reset-password', 'uploads', 'brand', 'spa', 'sitemap', 'robots', 'up', 'storage', 'team-picker', 'blog'];

    public function index(): JsonResponse
    {
        return response()->json(['data' => ToolPreset::orderBy('sort_order')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $tool = ToolPreset::create($this->validated($request));
        SiteSettings::flush();
        AuditLog::record('admin.tool_created', ['slug' => $tool->slug]);

        return response()->json(['data' => $tool], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $tool = ToolPreset::findOrFail($id);
        $tool->update($this->validated($request, $tool->id));
        SiteSettings::flush();

        return response()->json(['data' => $tool]);
    }

    public function destroy(int $id): JsonResponse
    {
        ToolPreset::findOrFail($id)->delete();
        SiteSettings::flush();

        return response()->json(['ok' => true]);
    }

    private function validated(Request $request, ?int $ignore = null): array
    {
        $data = $request->validate([
            'slug' => ['required', 'alpha_dash', 'max:120', Rule::notIn(self::RESERVED),
                'not_regex:/^[a-z0-9]{3}-[a-z0-9]{3}$/', Rule::unique('tool_presets', 'slug')->ignore($ignore)],
            'name' => ['required', 'string', 'max:120'],
            'heading' => ['nullable', 'string', 'max:200'],
            'meta_title' => ['nullable', 'string', 'max:200'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'config' => ['required', 'array'],
            'content' => ['nullable', 'string'],
            'emoji' => ['nullable', 'string', 'max:16'],
            'is_active' => ['boolean'],
            'show_in_menu' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);
        $data['config'] = WheelConfig::sanitize($data['config']);

        return $data;
    }
}
