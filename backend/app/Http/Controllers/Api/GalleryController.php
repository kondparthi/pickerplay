<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wheel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GalleryController extends Controller
{
    /** GET /api/gallery?q=color&sort=popular|new&page=1 */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'in:popular,new,featured'],
        ]);
        $query = Wheel::query()->where('kind', 'shared')->where('visibility', 'public');

        if ($q = trim((string) $request->query('q'))) {
            $terms = array_slice(array_filter(preg_split('/\s+/', $q)), 0, 5);
            foreach ($terms as $term) {
                $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
                $query->where(fn ($w) => $w->where('title', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('entries_text', 'like', $like));
            }
        }

        match ($request->query('sort', 'popular')) {
            'new' => $query->latest(),
            'featured' => $query->orderByDesc('is_featured')->orderByDesc('views'),
            default => $query->orderByDesc('is_featured')->orderByDesc('views')->latest(),
        };

        $page = $query->paginate(24);

        return response()->json([
            'total' => $page->total(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'data' => collect($page->items())->map(fn (Wheel $w) => [
                'code' => $w->share_code,
                'title' => $w->title,
                'views' => $w->views,
                'entries_count' => $w->entries_count,
                'is_featured' => $w->is_featured,
                'created_at' => $w->created_at?->toIso8601String(),
                // trimmed config: enough to draw a thumbnail
                'config' => [
                    'entries' => array_slice($w->config['entries'] ?? [], 0, 120),
                    'settings' => $w->config['settings'] ?? [],
                ],
            ]),
        ]);
    }
}
