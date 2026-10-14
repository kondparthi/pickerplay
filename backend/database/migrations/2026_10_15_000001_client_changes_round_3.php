<?php

use App\Models\ToolPreset;
use App\Models\Wheel;
use App\Services\SiteSettings;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Client change round 3: new default names, Title Case gallery wheel names,
 * Dice Roller gets the dice icon and Truth or Dare its own icon.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            SiteSettings::set(['default_entries' => "Mason\nAntonio\nLuca\nJack\nCarmen\nSophia"]);
        }

        if (Schema::hasTable('wheels')) {
            $titles = [
                'Rainbow colours' => 'Rainbow Colors',
                'Dinner ideas' => 'Dinner Ideas',
                'Classroom jobs' => 'Classroom Jobs',
                'Weekend activity' => 'Weekend Activity',
                'Team names' => 'Team Names',
                'Workout of the day' => 'Workout Of The Day',
            ];
            foreach ($titles as $old => $new) {
                Wheel::where('kind', 'shared')->where('title', $old)->get()->each(function (Wheel $w) use ($new) {
                    $cfg = $w->config ?: [];
                    $cfg['title'] = $new;
                    $w->title = $new;
                    $w->config = $cfg;
                    $w->save();
                });
            }
        }

        if (Schema::hasTable('tool_presets')) {
            ToolPreset::where('slug', 'dice-roller-wheel')->update(['emoji' => '🎲']);
            ToolPreset::where('slug', 'truth-or-dare-wheel')->update(['emoji' => '/brand/tod.svg']);
        }

        SiteSettings::flush();
    }

    public function down(): void
    {
    }
};
