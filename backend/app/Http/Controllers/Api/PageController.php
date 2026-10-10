<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\JsonResponse;

class PageController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->firstOrFail();

        return response()->json(['data' => $page->only(['slug', 'title', 'meta_description', 'content', 'updated_at'])]);
    }
}
