<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Api;
use App\Http\Controllers\Api\V1\WheelApiController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public (no login)
|--------------------------------------------------------------------------
*/
Route::get('/bootstrap', [Api\BootstrapController::class, 'show']);
Route::get('/stats', [Api\StatsController::class, 'show']);
Route::post('/stats/spin', [Api\StatsController::class, 'spin'])->middleware('throttle:stats');
Route::post('/track', [Api\TrackController::class, 'view'])->middleware('throttle:stats');
Route::get('/gallery', [Api\GalleryController::class, 'index']);
Route::get('/shares/{code}', [Api\ShareController::class, 'show'])->where('code', '[a-z0-9]{3}-[a-z0-9]{3}');
Route::post('/shares', [Api\ShareController::class, 'store'])->middleware('throttle:writes');
Route::post('/uploads', [Api\UploadController::class, 'store'])->middleware('throttle:uploads');
Route::post('/import/google-sheet', [Api\ImportController::class, 'googleSheet'])->middleware('throttle:writes');
Route::get('/images/search', [Api\ImageSearchController::class, 'index'])->middleware('throttle:writes');
Route::post('/feedback', [Api\FeedbackController::class, 'store'])->middleware('throttle:feedback');
Route::get('/pages/{slug}', [Api\PageController::class, 'show']);
Route::get('/tools', [Api\ToolController::class, 'index']);
Route::get('/tools/{slug}', [Api\ToolController::class, 'show']);
Route::get('/posts', [Api\PostController::class, 'index']);
Route::get('/posts/{slug}', [Api\PostController::class, 'show']);

// Polling Wheel
Route::post('/polls', [Api\PollController::class, 'store'])->middleware('throttle:writes');
Route::get('/polls/{code}', [Api\PollController::class, 'show'])->where('code', '[a-z0-9]{7}');
Route::post('/polls/{code}/vote', [Api\PollController::class, 'vote'])->where('code', '[a-z0-9]{7}')->middleware('throttle:votes');
Route::get('/polls/{code}/results', [Api\PollController::class, 'results'])->where('code', '[a-z0-9]{7}');
Route::patch('/polls/{code}', [Api\PollController::class, 'update'])->where('code', '[a-z0-9]{7}')->middleware('throttle:writes');
Route::delete('/polls/{code}', [Api\PollController::class, 'destroy'])->where('code', '[a-z0-9]{7}')->middleware('throttle:writes');

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::prefix('auth')->middleware('throttle:auth')->group(function () {
    Route::post('/register', [Api\AuthController::class, 'register']);
    Route::post('/login', [Api\AuthController::class, 'login']);
    Route::post('/forgot-password', [Api\AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [Api\AuthController::class, 'resetPassword']);
});

/*
|--------------------------------------------------------------------------
| Signed-in user (Bearer token from /auth/login)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [Api\AuthController::class, 'me']);
    Route::post('/auth/logout', [Api\AuthController::class, 'logout']);
    Route::put('/auth/profile', [Api\AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [Api\AuthController::class, 'changePassword']);
    Route::delete('/auth/account', [Api\AuthController::class, 'deleteAccount']);

    Route::get('/wheels', [Api\WheelController::class, 'index']);
    Route::post('/wheels', [Api\WheelController::class, 'store'])->middleware('throttle:writes');
    Route::get('/wheels/{id}', [Api\WheelController::class, 'show'])->whereNumber('id');
    Route::put('/wheels/{id}', [Api\WheelController::class, 'update'])->whereNumber('id');
    Route::delete('/wheels/{id}', [Api\WheelController::class, 'destroy'])->whereNumber('id');

    Route::get('/my/shares', [Api\ShareController::class, 'mine']);
    Route::put('/my/shares/{code}', [Api\ShareController::class, 'update']);
    Route::delete('/my/shares/{code}', [Api\ShareController::class, 'destroy']);

    Route::get('/api-keys', [Api\ApiKeyController::class, 'index']);
    Route::post('/api-keys', [Api\ApiKeyController::class, 'store']);
    Route::delete('/api-keys/{id}', [Api\ApiKeyController::class, 'destroy'])->whereNumber('id');
});

/*
|--------------------------------------------------------------------------
| Admin panel  (/admin in the SPA)
|--------------------------------------------------------------------------
*/
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/dashboard', [Admin\DashboardController::class, 'index']);
    Route::get('/analytics', [Admin\AnalyticsController::class, 'index']);

    Route::get('/settings', [Admin\SettingsController::class, 'index']);
    Route::put('/settings', [Admin\SettingsController::class, 'update']);
    Route::post('/settings/asset', [Admin\SettingsController::class, 'uploadAsset']);
    Route::post('/settings/test-email', [Admin\SettingsController::class, 'testEmail'])->middleware('throttle:feedback');

    Route::get('/wheels', [Admin\WheelController::class, 'index']);
    Route::patch('/wheels/{id}', [Admin\WheelController::class, 'update']);
    Route::delete('/wheels/{id}', [Admin\WheelController::class, 'destroy']);

    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::post('/users', [Admin\UserController::class, 'store']);
    Route::patch('/users/{id}', [Admin\UserController::class, 'update']);
    Route::delete('/users/{id}', [Admin\UserController::class, 'destroy']);

    Route::get('/feedback', [Admin\FeedbackController::class, 'index']);
    Route::patch('/feedback/{id}', [Admin\FeedbackController::class, 'update']);
    Route::delete('/feedback/{id}', [Admin\FeedbackController::class, 'destroy']);

    Route::apiResource('pages', Admin\PageController::class)->except('show')->parameters(['pages' => 'id']);
    Route::apiResource('tools', Admin\ToolController::class)->except('show')->parameters(['tools' => 'id']);

    Route::get('/posts', [Admin\PostController::class, 'index']);
    Route::post('/posts', [Admin\PostController::class, 'store']);
    Route::get('/posts/{id}', [Admin\PostController::class, 'show'])->whereNumber('id');
    Route::put('/posts/{id}', [Admin\PostController::class, 'update'])->whereNumber('id');
    Route::delete('/posts/{id}', [Admin\PostController::class, 'destroy'])->whereNumber('id');

    Route::get('/audit-logs', [Admin\AuditLogController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Developer API v1  (header X-Api-Key: pp_...)
|--------------------------------------------------------------------------
*/
Route::prefix('v1')->middleware(['apikey', 'throttle:developer'])->group(function () {
    Route::get('/wheels', [WheelApiController::class, 'index']);
    Route::post('/wheels', [WheelApiController::class, 'store']);
    Route::get('/wheels/{id}', [WheelApiController::class, 'show'])->whereNumber('id');
    Route::put('/wheels/{id}', [WheelApiController::class, 'update'])->whereNumber('id');
    Route::delete('/wheels/{id}', [WheelApiController::class, 'destroy'])->whereNumber('id');
    Route::post('/shares', [WheelApiController::class, 'createShare']);
    Route::get('/shares/{code}', [WheelApiController::class, 'showShare']);
    Route::delete('/shares/{code}', [WheelApiController::class, 'destroyShare']);
});
