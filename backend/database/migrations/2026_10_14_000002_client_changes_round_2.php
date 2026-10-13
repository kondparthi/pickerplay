<?php

use App\Models\ToolPreset;
use App\Services\SiteSettings;
use App\Services\WheelConfig;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Client change round 2: default Random Name wheel has 6 names,
 * Yes or No wheel has 6 slices (Yes/No ×3).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            SiteSettings::set(['default_entries' => "Emma\nLiam\nOlivia\nNoah\nAva\nEthan"]);
        }

        if (Schema::hasTable('tool_presets')) {
            $presets = require database_path('seeders/content/presets_v2.php');
            $tool = ToolPreset::where('slug', 'yes-no-wheel')->first();
            if ($tool && isset($presets['yes-no-wheel'])) {
                $p = $presets['yes-no-wheel'];
                $cfg = json_decode(json_encode($tool->config), true) ?: [];
                $tool->config = WheelConfig::sanitize([
                    'title' => $cfg['title'] ?? $tool->name,
                    'description' => $cfg['description'] ?? '',
                    'entries' => $p['entries'],
                    'settings' => array_merge((array) ($cfg['settings'] ?? []), $p['settings']),
                ]);
                $tool->save();
            }
        }

        SiteSettings::flush();
    }

    public function down(): void
    {
    }
};
