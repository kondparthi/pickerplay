<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Older MySQL / MariaDB on shared hosting: keep indexed strings under 767 bytes
        Schema::defaultStringLength(191);

        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(120)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('auth', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
        RateLimiter::for('writes', fn (Request $r) => Limit::perMinute(30)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('uploads', fn (Request $r) => Limit::perMinute(20)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('feedback', fn (Request $r) => Limit::perMinute(5)->by($r->ip()));
        // offices/schools share one IP, so votes allow a generous per-IP rate
        RateLimiter::for('votes', fn (Request $r) => Limit::perMinute(300)->by($r->ip()));
        RateLimiter::for('stats', fn (Request $r) => Limit::perMinute(60)->by($r->ip()));
        RateLimiter::for('developer', fn (Request $r) => Limit::perMinute(60)->by(optional($r->attributes->get('api_key'))->id ?: $r->ip()));
    }
}
