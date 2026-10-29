<?php

use App\Services\SiteSettings;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/** Feedback form submissions are emailed to support@pickerplay.com (unless an address is already set). */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('settings') && ! \App\Models\Setting::where('key', 'feedback_notify_email')->whereNotNull('value')->where('value', '!=', '')->exists()) {
            SiteSettings::set(['feedback_notify_email' => 'support@pickerplay.com']);
        }
    }

    public function down(): void
    {
    }
};
