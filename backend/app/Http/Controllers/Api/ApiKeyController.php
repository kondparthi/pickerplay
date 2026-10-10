<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json(['data' => $request->user()->apiKeys()->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:100']]);
        if ($request->user()->apiKeys()->count() >= 10) {
            return response()->json(['message' => 'You can have at most 10 API keys.'], 422);
        }
        [$key, $plain] = ApiKey::issue($request->user(), strip_tags($data['name']));
        AuditLog::record('api_key.created', ['id' => $key->id]);

        return response()->json(['data' => $key, 'plain_key' => $plain], 201);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $request->user()->apiKeys()->findOrFail($id)->delete();
        AuditLog::record('api_key.revoked', ['id' => $id]);

        return response()->json(['ok' => true]);
    }
}
