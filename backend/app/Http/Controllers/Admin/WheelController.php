<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Wheel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class WheelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Wheel::query()->with('user:id,name,email');
        match ($request->query('filter')) {
            'saved' => $q->where('kind', 'saved'),
            'shared' => $q->where('kind', 'shared'),
            'public' => $q->where('kind', 'shared')->where('visibility', 'public'),
            'featured' => $q->where('is_featured', true),
            default => null,
        };
        if ($s = $request->query('q')) {
            $q->where(fn ($w) => $w->where('title', 'like', "%{$s}%")->orWhere('share_code', $s)
                ->orWhere('entries_text', 'like', "%{$s}%"));
        }
        $sort = $request->query('sort') === 'views' ? 'views' : 'created_at';
        $page = $q->orderByDesc($sort)->paginate(25);

        return response()->json([
            'data' => collect($page->items())->map(fn (Wheel $w) => [
                'id' => $w->id, 'kind' => $w->kind, 'share_code' => $w->share_code, 'title' => $w->title,
                'visibility' => $w->visibility, 'is_featured' => $w->is_featured, 'views' => $w->views,
                'entries_count' => $w->entries_count, 'user' => $w->user?->only(['id', 'name', 'email']),
                'created_at' => $w->created_at?->toIso8601String(),
                'last_viewed_at' => $w->last_viewed_at?->toIso8601String(),
                'entries_preview' => \Illuminate\Support\Str::limit((string) $w->entries_text, 160),
            ]),
            'total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $wheel = Wheel::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes', 'nullable', 'string', 'max:150'],
            'visibility' => ['sometimes', Rule::in(['private', 'link_spin', 'link_copy', 'public'])],
            'is_featured' => ['sometimes', 'boolean'],
        ]);
        $wheel->update($data);
        AuditLog::record('admin.wheel_updated', ['id' => $id] + $data);

        return response()->json(['ok' => true]);
    }

    public function destroy(int $id): JsonResponse
    {
        $wheel = Wheel::findOrFail($id);
        AuditLog::record('admin.wheel_deleted', ['id' => $id, 'code' => $wheel->share_code, 'title' => $wheel->title]);
        $wheel->delete();

        return response()->json(['ok' => true]);
    }
}
