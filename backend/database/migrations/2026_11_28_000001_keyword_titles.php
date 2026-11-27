<?php

use App\Services\SiteSettings;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Keyword report (Nov 2026): home page title targets "spin the wheel" + "random name picker wheel",
 * and the number picker targets "random number generator". Only changed while the old starter text is
 * still in place – anything edited in Admin is left alone.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('settings')) {
            $title = SiteSettings::all()['meta_title'] ?? '';
            if ($title === '' || $title === 'PickerPlay – Random Name Picker Wheel & Spinner') {
                SiteSettings::set(['meta_title' => 'Spin the Wheel – Random Name Picker Wheel | PickerPlay']);
            }
        }

        if (Schema::hasTable('tool_presets')) {
            $row = DB::table('tool_presets')->where('slug', 'number-picker')->first();
            if ($row) {
                $update = [];
                if (in_array($row->heading ?? '', ['', 'Number Picker – Random Number Wheel'], true)) {
                    $update['heading'] = 'Random Number Generator – Number Picker Wheel';
                }
                if (Schema::hasColumn('tool_presets', 'meta_title')
                    && in_array($row->meta_title ?? '', ['', 'Random Number Picker Wheel – Pick a Number 1-10 | PickerPlay'], true)) {
                    $update['meta_title'] = 'Random Number Generator – Free Number Picker Wheel | PickerPlay';
                }
                if ($update) {
                    DB::table('tool_presets')->where('id', $row->id)->update($update);
                }
            }
        }

        Cache::forget('pp.ssr.links');
    }

    public function down(): void
    {
    }
};
