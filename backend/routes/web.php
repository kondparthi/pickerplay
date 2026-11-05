<?php

use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SitemapController::class, 'sitemap']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);
Route::get('/ads.txt', [SitemapController::class, 'adsTxt']);

// Old WordPress URLs (and common guesses) -> their pages on the new site, so nothing returns 404
foreach ([
    'privacy-policy' => '/page/privacy', 'privacy' => '/page/privacy',
    'terms-and-conditions' => '/page/terms', 'terms-conditions' => '/page/terms', 'terms' => '/page/terms', 'terms-of-service' => '/page/terms', 'terms-of-use' => '/page/terms',
    'about' => '/page/about', 'about-us' => '/page/about',
    'disclaimer' => '/page/disclaimer', 'cookie-policy' => '/page/cookie-policy', 'cookies' => '/page/cookie-policy',
    'contact-us' => '/contact', 'feedback' => '/contact', 'support' => '/contact',
    'blogs' => '/blog', 'news' => '/blog', 'faq' => '/page/faq', 'faqs' => '/page/faq',
    'truth-or-dare' => '/truth-or-dare-wheel', 'truth-or-dare-picker' => '/truth-or-dare-wheel', 'truth-or-dare-picker-wheel' => '/truth-or-dare-wheel',
    'mlb' => '/mlb-team-picker', 'mlb-american-league' => '/mlb-team-picker', 'mlb-national-league' => '/mlb-team-picker', 'mlb-picker' => '/mlb-team-picker', 'mlb-picker-wheel' => '/mlb-team-picker', 'mlb-team-picker-wheel' => '/mlb-team-picker',
    'nba' => '/nba-team-picker', 'nba-picker' => '/nba-team-picker', 'nba-picker-wheel' => '/nba-team-picker', 'nba-team-picker-wheel' => '/nba-team-picker',
    'nfl' => '/nfl-team-picker', 'nfl-picker' => '/nfl-team-picker', 'nfl-picker-wheel' => '/nfl-team-picker', 'nfl-team-picker-wheel' => '/nfl-team-picker',
    'state-picker-wheel' => '/state-picker', 'us-state-picker' => '/state-picker', 'random-state-picker' => '/state-picker',
    'country-picker-wheel' => '/country-picker', 'yes-no-picker' => '/yes-no-wheel', 'yes-or-no-wheel' => '/yes-no-wheel', 'yes-no-picker-wheel' => '/yes-no-wheel',
    'number-picker-wheel' => '/number-picker', 'letter-picker-wheel' => '/letter-picker', 'color-picker-wheel' => '/color-picker',
    'team-picker-wheel' => '/team-picker', 'random-team-generator' => '/team-picker', 'random-name-picker' => '/', 'spin-the-wheel' => '/',
] as $from => $to) {
    Route::permanentRedirect($from, $to);
}

// Everything else is handled by the React single-page app
Route::get('/{any?}', SpaController::class)
    ->where('any', '^(?!api/|uploads/|spa/|brand/).*$')
    ->name('spa');
