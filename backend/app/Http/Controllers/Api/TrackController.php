<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Analytics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackController extends Controller
{
    /** POST /api/track { path } - one page view, sent by the SPA on every route change. */
    public function view(Request $request): JsonResponse
    {
        $data = $request->validate(['path' => ['required', 'string', 'max:300']]);
        if (! Analytics::isBot($request) && $request->header('DNT') !== '1') {
            try {
                Analytics::view($request, $data['path']);
            } catch (\Throwable $e) {
                report($e); // analytics must never break the site
            }
        }

        return response()->json(['ok' => true]);
    }
}
