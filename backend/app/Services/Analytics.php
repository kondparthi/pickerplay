<?php

namespace App\Services;

use App\Models\Page;
use App\Models\Post;
use App\Models\ToolPreset;
use App\Models\Wheel;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Privacy-friendly first-party analytics: page views, unique visitors (salted daily hash of IP + browser,
 * never stored raw) and spins per page / game.
 */
class Analytics
{
    public const SITE = '__site';
    private const BOTS = '/bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|java\/|go-http|axios/i';

    public static function isBot(Request $r): bool
    {
        $ua = (string) $r->userAgent();

        return $ua === '' || preg_match(self::BOTS, $ua) === 1;
    }

    /** Normalise a browser path and classify it. Returns [path, type] or null for paths we don't track. */
    public static function classify(string $path): ?array
    {
        $path = '/'.trim(strtolower(parse_url($path, PHP_URL_PATH) ?: '/'), '/');
        $path = mb_substr($path, 0, 180);
        if (preg_match('#^/(admin|api|account|reset-password)(/|$)#', $path)) {
            return null;
        }

        return match (true) {
            $path === '/' => [$path, 'home'],
            $path === '/team-picker' => [$path, 'team'],
            $path === '/gallery' => [$path, 'gallery'],
            $path === '/blog' => [$path, 'blog_list'],
            str_starts_with($path, '/blog/') => [$path, 'blog'],
            str_starts_with($path, '/page/') => [$path, 'page'],
            (bool) preg_match('#^/embed/[a-z0-9]{3}-[a-z0-9]{3}$#', $path) => [$path, 'embed'],
            (bool) preg_match('#^/[a-z0-9]{3}-[a-z0-9]{3}$#', $path) => [$path, 'share'],
            (bool) preg_match('#^/[a-z0-9_-]+$#', $path) => [$path, 'tool'],
            default => [$path, 'other'],
        };
    }

    public static function label(string $path, string $type): ?string
    {
        $slug = ltrim(preg_replace('#^/(blog|page|embed)/#', '/', $path), '/');

        return match ($type) {
            'home' => 'Wheel spinner (home)',
            'team' => 'Team Picker',
            'gallery' => 'Gallery',
            'blog_list' => 'Blog',
            'blog' => Post::where('slug', $slug)->value('title'),
            'page' => Page::where('slug', $slug)->value('title'),
            'share', 'embed' => Wheel::where('share_code', $slug)->value('title') ?: 'Shared wheel '.$slug,
            'tool' => ToolPreset::where('slug', $slug)->value('name'),
            default => null,
        };
    }

    public static function visitorHash(Request $r): string
    {
        $salt = config('app.key').'|'.now()->toDateString();

        return sha1($salt.'|'.$r->ip().'|'.$r->userAgent().'|'.$r->header('Accept-Language'));
    }

    /** Record a page view. */
    public static function view(Request $r, string $rawPath): void
    {
        $c = self::classify($rawPath);
        if (! $c) {
            return;
        }
        [$path, $type] = $c;
        if ($type === 'tool' && ! ToolPreset::where('slug', ltrim($path, '/'))->where('is_active', true)->exists()) {
            return; // unknown slug (404) - don't create junk rows
        }
        $date = now()->toDateString();
        $hash = self::visitorHash($r);

        DB::transaction(function () use ($date, $path, $type, $hash) {
            self::bump($date, $path, $type, 'views');
            if (self::firstVisit($date, $path, $hash)) {
                self::bump($date, $path, $type, 'visitors', 0);
            }
            // site-wide totals
            self::bump($date, self::SITE, 'site', 'views');
            if (self::firstVisit($date, self::SITE, $hash)) {
                self::bump($date, self::SITE, 'site', 'visitors', 0);
            }
        });
    }

    /** Record spins / team generations against the page they happened on. */
    public static function spin(string $rawPath, int $count = 1): void
    {
        $c = self::classify($rawPath ?: '/');
        if (! $c) {
            return;
        }
        [$path, $type] = $c;
        $date = now()->toDateString();
        self::bump($date, $path, $type, 'spins', 0, $count);
        self::bump($date, self::SITE, 'site', 'spins', 0, $count);
    }

    private static function firstVisit(string $date, string $path, string $hash): bool
    {
        return DB::table('analytics_visitors')->insertOrIgnore(['date' => $date, 'path' => $path, 'hash' => $hash]) > 0;
    }

    private static function bump(string $date, string $path, string $type, string $col, int $_ = 0, int $by = 1): void
    {
        $affected = DB::table('analytics_daily')->where('date', $date)->where('path', $path)->increment($col, $by);
        if (! $affected) {
            $label = $path === self::SITE ? 'Whole site' : self::label($path, $type);
            DB::table('analytics_daily')->insertOrIgnore([
                'date' => $date, 'path' => $path, 'type' => $type, 'label' => $label ? mb_substr($label, 0, 200) : null,
                'views' => 0, 'visitors' => 0, 'spins' => 0,
            ]);
            DB::table('analytics_daily')->where('date', $date)->where('path', $path)->increment($col, $by);
        }
    }

    /* ------------------------------------------------------------------ reports */

    public static function report(int $days): array
    {
        $days = max(1, min(365, $days));
        $from = now()->subDays($days - 1)->toDateString();
        $prevFrom = now()->subDays($days * 2 - 1)->toDateString();
        $prevTo = now()->subDays($days)->toDateString();

        $site = DB::table('analytics_daily')->where('path', self::SITE)->whereBetween('date', [$from, now()->toDateString()])
            ->get()->keyBy(fn ($r) => Carbon::parse($r->date)->toDateString());
        $series = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $d = now()->subDays($i)->toDateString();
            $row = $site[$d] ?? null;
            $series[] = ['date' => $d, 'views' => (int) ($row->views ?? 0), 'visitors' => (int) ($row->visitors ?? 0), 'spins' => (int) ($row->spins ?? 0)];
        }
        $sum = fn ($k) => array_sum(array_column($series, $k));
        $prev = DB::table('analytics_daily')->where('path', self::SITE)->whereBetween('date', [$prevFrom, $prevTo])
            ->selectRaw('COALESCE(SUM(views),0) v, COALESCE(SUM(visitors),0) u, COALESCE(SUM(spins),0) s')->first();

        $pages = DB::table('analytics_daily')->where('path', '!=', self::SITE)->where('date', '>=', $from)
            ->groupBy('path', 'type')
            ->selectRaw('path, type, MAX(label) label, SUM(views) views, SUM(visitors) visitors, SUM(spins) spins, MAX(date) last_date')
            ->orderByDesc('views')->get();

        // every game, including ones nobody opened in this period ("rarely used")
        $byPath = $pages->keyBy('path');
        $games = collect([['/', 'Wheel spinner (home)', '🎡'], ['/team-picker', 'Team Picker', '👥']])
            ->merge(ToolPreset::where('is_active', true)->orderBy('sort_order')->get()->map(fn ($t) => ['/'.$t->slug, $t->name, $t->emoji]))
            ->map(function ($g) use ($byPath) {
                $r = $byPath[$g[0]] ?? null;

                return [
                    'path' => $g[0], 'label' => $g[1], 'emoji' => $g[2],
                    'views' => (int) ($r->views ?? 0), 'visitors' => (int) ($r->visitors ?? 0), 'spins' => (int) ($r->spins ?? 0),
                    'last_date' => $r->last_date ?? null,
                ];
            })->sortByDesc('views')->values();
        $lastSeen = DB::table('analytics_daily')->whereIn('path', $games->pluck('path'))->groupBy('path')->selectRaw('path, MAX(date) d')->pluck('d', 'path');
        $games = $games->map(fn ($g) => $g + ['last_ever' => $lastSeen[$g['path']] ?? null]);

        $byType = $pages->groupBy('type')->map(fn ($rows, $t) => ['type' => $t, 'views' => (int) $rows->sum('views'), 'visitors' => (int) $rows->sum('visitors')])->values()->sortByDesc('views')->values();

        return [
            'days' => $days,
            'totals' => [
                'views' => $sum('views'), 'visitors' => $sum('visitors'), 'spins' => $sum('spins'),
                'prev_views' => (int) $prev->v, 'prev_visitors' => (int) $prev->u, 'prev_spins' => (int) $prev->s,
                'pages_per_visitor' => $sum('visitors') ? round($sum('views') / $sum('visitors'), 1) : 0,
            ],
            'series' => $series,
            'games' => $games,
            'by_type' => $byType,
            'pages' => $pages->take(100)->map(fn ($r) => [
                'path' => $r->path, 'type' => $r->type, 'label' => $r->label,
                'views' => (int) $r->views, 'visitors' => (int) $r->visitors, 'spins' => (int) $r->spins, 'last_date' => $r->last_date,
            ])->values(),
        ];
    }

    public static function prune(): int
    {
        return DB::table('analytics_visitors')->where('date', '<', now()->subDays(35)->toDateString())->delete();
    }
}
