<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wheel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Wheels saved in the signed-in user's account (toolbar Save / Open). */
class WheelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = $request->user()->wheels()->where('kind', 'saved')->latest('updated_at');
        if ($s = $request->query('q')) {
            $q->where('title', 'like', '%'.$s.'%');
        }

        return response()->json([
            'data' => $q->limit(500)->get()->map(fn (Wheel $w) => $w->toSavedArray(false)),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $wheel = new Wheel([
            'user_id' => $request->user()->id,
            'kind' => 'saved',
            'visibility' => 'private',
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
        ]);
        $wheel->fillConfig($data['config'])->save();

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
        $wheel->description = $data['description'] ?? null;
        $wheel->fillConfig($data['config'])->save();

        return response()->json(['data' => $wheel->toSavedArray()]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->owned($request, $id)->delete();

        return response()->json(['ok' => true]);
    }

    private function owned(Request $request, int $id): Wheel
    {
        return $request->user()->wheels()->where('kind', 'saved')->findOrFail($id);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:1000'],
            'config' => ['required', 'array'],
            'config.entries' => ['present', 'array'],
        ]);
    }
}
