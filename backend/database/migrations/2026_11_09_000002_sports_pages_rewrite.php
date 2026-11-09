<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * AdSense retest (9 Nov 2026): the NBA / NFL / MLB picker pages still held old wording
 * ("True random algorithm with zero bias", "No favorites, no repeats", "Free Forever") and
 * betting-style uses ("sweepstakes", "pools", "bets", "Super Bowl squares").
 * Replaces the text of these three pages with sports_v2.php when it contains any of that wording.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tool_presets')) {
            return;
        }
        $pages = require database_path('seeders/content/sports_v2.php');
        $old = '/zero bias|true random|free forever|no repeats|no favou?rites|fast\s*(?:&|&amp;|and)\s*fair|100\s*%|sweepstake|\bpools?\b|\bbets?\b|betting|squares|views/i';

        foreach ($pages as $slug => $fields) {
            $row = DB::table('tool_presets')->where('slug', $slug)->first();
            if (! $row) {
                continue;
            }
            $text = ($row->content ?? '').' '.($row->meta_description ?? '').' '.($row->heading ?? '');
            if (preg_match($old, $text)) {
                $update = ['content' => $fields['content'], 'meta_description' => $fields['meta_description']];
                foreach (['heading', 'meta_title'] as $col) {
                    if (Schema::hasColumn('tool_presets', $col)) {
                        $update[$col] = $fields[$col];
                    }
                }
                DB::table('tool_presets')->where('slug', $slug)->update($update);
                Log::info("Sports page rewritten: {$slug}");
            }
        }

        Cache::forget('pickerplay.sitemap');
        if (class_exists(\App\Services\SiteSettings::class)) {
            \App\Services\SiteSettings::flush();
        }
    }

    public function down(): void
    {
    }
};
