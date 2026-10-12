<?php

use Illuminate\Support\Facades\Schedule;

// Delete share links nobody has opened for SHARE_EXPIRY_DAYS (default 365)
Schedule::command('pickerplay:prune-shares')->dailyAt('03:15');

// Forget hashed visitor fingerprints older than 35 days (only daily totals are kept)
Schedule::call(fn () => \App\Services\Analytics::prune())->dailyAt('03:30')->name('analytics-prune');
