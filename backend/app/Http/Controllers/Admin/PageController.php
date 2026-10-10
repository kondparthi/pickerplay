<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Page;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PageController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Page::orderBy('sort_order')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $page = Page::create($this->validated($request));
        SiteSettings::flush();
        AuditLog::record('admin.page_created', ['slug' => $page->slug]);

        return response()->json(['data' => $page], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $page = Page::findOrFail($id);
        $page->update($this->validated($request, $page->id));
        SiteSettings::flush();
        AuditLog::record('admin.page_updated', ['slug' => $page->slug]);

        return response()->json(['data' => $page]);
    }

    public function destroy(int $id): JsonResponse
    {
        Page::findOrFail($id)->delete();
        SiteSettings::flush();

        return response()->json(['ok' => true]);
    }

    private function validated(Request $request, ?int $ignore = null): array
    {
        return $request->validate([
            'slug' => ['required', 'alpha_dash', 'max:120', Rule::unique('pages', 'slug')->ignore($ignore)],
            'title' => ['required', 'string', 'max:200'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'content' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:40'],
            'show_in_footer' => ['boolean'],
            'is_published' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);
    }
}
