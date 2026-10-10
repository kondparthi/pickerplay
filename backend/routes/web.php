<?php

use App\Http\Controllers\SitemapController;
use App\Http\Controllers\SpaController;
use Illuminate\Support\Facades\Route;

Route::get('/sitemap.xml', [SitemapController::class, 'sitemap']);
Route::get('/robots.txt', [SitemapController::class, 'robots']);

// Everything else is handled by the React single-page app
Route::get('/{any?}', SpaController::class)
    ->where('any', '^(?!api/|uploads/|spa/|brand/).*$')
    ->name('spa');
