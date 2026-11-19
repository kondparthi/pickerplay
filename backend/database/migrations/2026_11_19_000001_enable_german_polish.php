<?php

use App\Services\SiteSettings;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/** Client request (19 Nov 2026): add German (de) and Polish (pl) to the language menu. */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('settings')) {
            return;
        }
        $current = SiteSettings::all()['enabled_languages'] ?? 'en';
        $codes = array_values(array_filter(array_map('trim', explode(',', (string) $current))));
        foreach (['de', 'pl'] as $code) {
            if (! in_array($code, $codes, true)) {
                $codes[] = $code;
            }
        }
        SiteSettings::set(['enabled_languages' => implode(',', $codes)]);
    }

    public function down(): void
    {
    }
};
