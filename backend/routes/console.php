<?php

use Illuminate\Support\Facades\Schedule;

// Delete share links nobody has opened for SHARE_EXPIRY_DAYS (default 365)
Schedule::command('pickerplay:prune-shares')->dailyAt('03:15');
