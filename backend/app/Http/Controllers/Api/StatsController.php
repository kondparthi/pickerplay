<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stat;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatsController extends Controller
{
    /** Year-to-date activity shown on the home page. */
    public function show(): JsonResponse
    {
        $year = date('Y');
        $spins = Stat::get("spins_{$year}") + (int) SiteSettings::get('stats_offset_spins', 0);
        $seconds = Stat::get("seconds_{$year}");
        $hours = intdiv($seconds, 3600) + (int) SiteSettings::get('stats_offset_hours', 0);

        return response()->json(['year' => (int) $year, 'spins' => $spins, 'hours' => $hours]);
    }

    /** Fire-and-forget counter from the browser after each spin. */
    public function spin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'seconds' => ['nullable', 'numeric', 'min:0', 'max:120'],
            'wheels' => ['nullable', 'integer', 'min:1', 'max:20'],
        ]);
        $year = date('Y');
        $count = (int) ($data['wheels'] ?? 1);
        Stat::bump("spins_{$year}", $count);
        Stat::bump('spins_total', $count);
        Stat::bump("seconds_{$year}", (int) round(($data['seconds'] ?? 10) * $count));

        return response()->json(['ok' => true]);
    }
}
