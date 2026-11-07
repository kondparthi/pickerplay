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
    // Old "random-…" tool URLs
    'random-country-picker' => '/country-picker', 'random-day-picker' => '/day-picker', 'day-picker-wheel' => '/day-picker',
    'random-number-picker' => '/number-picker', 'random-number-1-100' => '/number-picker-1-100', 'random-number-picker-1-100' => '/number-picker-1-100',
    'random-letter-picker' => '/letter-picker', 'random-color-picker' => '/color-picker', 'random-colour-picker' => '/color-picker',
    'random-us-state-picker' => '/state-picker', 'yes-no-maybe' => '/yes-no-maybe-wheel', 'yes-no-maybe-picker' => '/yes-no-maybe-wheel',
    'what-should-i-eat' => '/what-to-eat-wheel', 'food-picker-wheel' => '/what-to-eat-wheel', 'what-to-eat' => '/what-to-eat-wheel',
    'heads-or-tails' => '/coin-flip-wheel', 'coin-flip' => '/coin-flip-wheel', 'dice-roller' => '/dice-roller-wheel', 'dice-picker' => '/dice-roller-wheel',
    'nfl-team-picker-afc' => '/nfl-team-picker', 'nfl-team-picker-nfc' => '/nfl-team-picker',
    'nba-team-picker-east' => '/nba-team-picker', 'nba-team-picker-west' => '/nba-team-picker', 'nba-team-picker-eastern' => '/nba-team-picker', 'nba-team-picker-western' => '/nba-team-picker',
    'mlb-team-picker-al' => '/mlb-team-picker', 'mlb-team-picker-nl' => '/mlb-team-picker',
    'team-picker-wheel' => '/team-picker', 'random-team-generator' => '/team-picker', 'random-name-picker' => '/', 'spin-the-wheel' => '/',
] as $from => $to) {
    Route::permanentRedirect($from, $to);
}

// Old name-picker variants (random-name-picker-princess, -spanish, -mexican, -strong-female, …) -> the name picker wheel
Route::get('/random-name-picker-{variant}', fn () => redirect('/', 301))->where('variant', '.*');

// Old WordPress blog posts lived at the root with an emoji at the end, e.g.
// /picker-play-add-excitement-to-your-gatherings-with-games-of-chance-🎉 -> /blog/picker-play-add-excitement-…
Route::get('/picker-play-{rest}', function (string $rest) {
    $slug = trim(preg_replace('/-+/', '-', preg_replace('/[^a-z0-9-]/', '', strtolower('picker-play-'.urldecode($rest)))), '-');
    $post = \App\Models\Post::live()->where('slug', $slug)->first()
        ?? \App\Models\Post::live()->where('slug', 'like', $slug.'%')->orderBy('slug')->first();

    return redirect($post ? '/blog/'.$post->slug : '/blog', 301);
})->where('rest', '.*');

// Everything else is handled by the React single-page app
Route::get('/{any?}', SpaController::class)
    ->where('any', '^(?!api/|uploads/|spa/|brand/).*$')
    ->name('spa');
