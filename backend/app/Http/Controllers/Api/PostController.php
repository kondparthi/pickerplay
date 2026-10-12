<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Public blog API */
class PostController extends Controller
{
    /** GET /api/posts?q=&category=&page= */
    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => ['nullable', 'string', 'max:100'], 'category' => ['nullable', 'string', 'max:80']]);
        $q = Post::live()->with('author:id,name');
        if ($s = trim((string) $request->query('q'))) {
            $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $s).'%';
            $q->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('excerpt', 'like', $like)->orWhere('tags', 'like', $like));
        }
        if ($c = $request->query('category')) {
            $q->where('category', $c);
        }
        $page = $q->orderByDesc('is_featured')->orderByDesc('published_at')->orderByDesc('id')->paginate(12);

        return response()->json([
            'data' => collect($page->items())->map->toCard(),
            'total' => $page->total(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'categories' => Post::live()->whereNotNull('category')->select('category', DB::raw('count(*) as total'))
                ->groupBy('category')->orderBy('category')->get(),
        ]);
    }

    /** GET /api/posts/{slug} */
    public function show(string $slug): JsonResponse
    {
        $post = Post::live()->with('author:id,name')->where('slug', $slug)->firstOrFail();
        Post::whereKey($post->id)->update(['views' => DB::raw('views + 1')]);

        $related = Post::live()->where('id', '!=', $post->id)
            ->when($post->category, fn ($q) => $q->orderByRaw('category = ? desc', [$post->category]))
            ->orderByDesc('published_at')->limit(3)->get()->map->toCard();

        return response()->json(['data' => $post->toFull(), 'related' => $related]);
    }
}
