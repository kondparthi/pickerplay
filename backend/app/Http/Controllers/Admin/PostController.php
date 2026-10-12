<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = Post::query()->with('author:id,name');
        if ($s = $request->query('q')) {
            $q->where(fn ($w) => $w->where('title', 'like', "%{$s}%")->orWhere('slug', 'like', "%{$s}%"));
        }
        if (in_array($request->query('status'), ['draft', 'published'], true)) {
            $q->where('status', $request->query('status'));
        }
        $page = $q->latest('updated_at')->paginate(20);

        return response()->json([
            'data' => collect($page->items())->map(fn (Post $p) => $p->toCard() + [
                'status' => $p->status, 'views' => $p->views, 'updated_at' => $p->updated_at?->toIso8601String(),
            ]),
            'total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
            'categories' => Post::whereNotNull('category')->distinct()->orderBy('category')->pluck('category'),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $p = Post::findOrFail($id);

        return response()->json(['data' => $p->toFull() + ['status' => $p->status, 'tags' => $p->tags]]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['author_id'] = $request->user()->id;
        $post = Post::create($data);
        $this->flush();
        AuditLog::record('admin.post_created', ['id' => $post->id, 'title' => $post->title]);

        return response()->json(['data' => $post], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $post->update($this->validated($request, $post));
        $this->flush();
        AuditLog::record('admin.post_updated', ['id' => $post->id]);

        return response()->json(['data' => $post]);
    }

    public function destroy(int $id): JsonResponse
    {
        $post = Post::findOrFail($id);
        AuditLog::record('admin.post_deleted', ['id' => $id, 'title' => $post->title]);
        $post->delete();
        $this->flush();

        return response()->json(['ok' => true]);
    }

    private function validated(Request $request, ?Post $post = null): array
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'alpha_dash', 'max:191', Rule::unique('posts', 'slug')->ignore($post?->id)],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'category' => ['nullable', 'string', 'max:80'],
            'tags' => ['nullable', 'string', 'max:300'],
            'meta_title' => ['nullable', 'string', 'max:200'],
            'meta_description' => ['nullable', 'string', 'max:300'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
            'is_featured' => ['boolean'],
        ]);
        $data['slug'] = $data['slug'] ?: Post::uniqueSlug($data['title'], $post?->id);
        $data['reading_minutes'] = Post::readingMinutes($data['content'] ?? '');
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = $post?->published_at ?? now();
        }

        return $data;
    }

    private function flush(): void
    {
        Cache::forget('pickerplay.sitemap');
    }
}
