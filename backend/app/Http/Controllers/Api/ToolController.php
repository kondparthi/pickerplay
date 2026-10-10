<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ToolPreset;
use Illuminate\Http\JsonResponse;

/** Preset picker landing pages (Yes/No wheel, Number picker, ...). */
class ToolController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => ToolPreset::where('is_active', true)->orderBy('sort_order')->get()->map->toSummary(),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $tool = ToolPreset::where('slug', $slug)->where('is_active', true)->firstOrFail();

        return response()->json(['data' => $tool->only([
            'slug', 'name', 'heading', 'meta_title', 'meta_description', 'config', 'content', 'emoji',
        ])]);
    }
}
