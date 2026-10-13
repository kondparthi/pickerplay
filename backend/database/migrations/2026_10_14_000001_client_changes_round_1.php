<?php

use App\Models\ToolPreset;
use App\Services\SiteSettings;
use App\Services\WheelConfig;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Client change round 1 (data only, runs once on deploy):
 *  - brand wheel defaults: 5 names + the 5 logo colours
 *  - hide the "Activity" spin counter for now
 *  - Truth or Dare / Heads or Tails repeated 5×, Truth & Dare questions, bigger bold dice numbers
 *  - NBA / NFL / MLB slices in team colours
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            SiteSettings::set([
                'default_entries' => "Emma\nLiam\nOlivia\nNoah\nAva",
                'default_colors' => '#9cd60c,#ff3269,#fee20a,#7c5afe,#31c0ff',
                'show_stats' => '0',
            ]);
        }

        if (Schema::hasTable('tool_presets')) {
            $presets = require database_path('seeders/content/presets_v2.php');
            foreach ($presets as $slug => $p) {
                $tool = ToolPreset::where('slug', $slug)->first();
                if (! $tool) {
                    continue;
                }
                $cfg = json_decode(json_encode($tool->config), true) ?: [];
                $settings = array_merge((array) ($cfg['settings'] ?? []), $p['settings']);
                $tool->config = WheelConfig::sanitize([
                    'title' => $cfg['title'] ?? $tool->name,
                    'description' => $cfg['description'] ?? '',
                    'entries' => $p['entries'],
                    'settings' => $settings,
                ]);
                $tool->save();
            }
        }

        SiteSettings::flush();
    }

    public function down(): void
    {
        // data change – nothing to roll back
    }
};
