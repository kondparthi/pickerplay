<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;

class BootstrapController extends Controller
{
    /** GET /api/bootstrap — white-label settings, footer pages and picker tools menu. */
    public function show(): JsonResponse
    {
        return response()->json(SiteSettings::bootstrap())
            ->header('Cache-Control', 'public, max-age=60');
    }
}
