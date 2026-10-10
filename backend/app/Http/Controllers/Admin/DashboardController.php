<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Feedback;
use App\Models\Stat;
use App\Models\User;
use App\Models\Wheel;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $year = date('Y');
        $days = collect(range(13, 0))->map(fn ($d) => now()->subDays($d)->toDateString());
        $sharesPerDay = Wheel::where('kind', 'shared')->where('created_at', '>=', now()->subDays(14)->startOfDay())
            ->get(['created_at'])->groupBy(fn ($w) => $w->created_at->toDateString())->map->count();

        return response()->json([
            'counts' => [
                'users' => User::count(),
                'saved_wheels' => Wheel::where('kind', 'saved')->count(),
                'shared_wheels' => Wheel::where('kind', 'shared')->count(),
                'public_wheels' => Wheel::where('kind', 'shared')->where('visibility', 'public')->count(),
                'unread_feedback' => Feedback::where('is_read', false)->count(),
                'spins_year' => Stat::get("spins_{$year}"),
                'spins_total' => Stat::get('spins_total'),
                'hours_year' => intdiv(Stat::get("seconds_{$year}"), 3600),
            ],
            'shares_per_day' => $days->map(fn ($d) => ['date' => $d, 'count' => $sharesPerDay[$d] ?? 0])->values(),
            'top_wheels' => Wheel::where('kind', 'shared')->orderByDesc('views')->limit(8)
                ->get(['share_code', 'title', 'views', 'visibility', 'created_at']),
            'recent_activity' => AuditLog::latest('created_at')->limit(15)->get(),
        ]);
    }
}
