<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Analytics;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /** GET /api/admin/analytics?days=30 */
    public function index(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 30);

        return response()->json(Analytics::report(in_array($days, [7, 14, 30, 90, 365], true) ? $days : 30));
    }
}
