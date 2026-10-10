<?php

namespace App\Services;

use App\Models\Page;
use App\Models\Setting;
use App\Models\ToolPreset;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * White-label settings. Every brand-specific value lives in the `settings`
 * table and is editable from /admin -> Branding & Settings.
 */
class SiteSettings
{
    public const CACHE_KEY = 'pickerplay.settings.v1';

    /** Defaults used when a key has never been saved. [value, is_public] */
    public const DEFAULTS = [
        // Branding
        'site_name' => ['PickerPlay', true],
        'tagline' => ['Free Random Name and Team Picker Tool', true],
        'logo_url' => ['/brand/logo.webp', true],
        'logo_dark_url' => ['', true],
        'logo_height' => ['44', true],
        'favicon_url' => ['/brand/favicon.png', true],
        'primary_color' => ['#5546c9', true],
        'secondary_color' => ['#29a3e3', true],
        'accent_color' => ['#7cc22c', true],
        'page_bg_from' => ['#dcebfa', true],
        'page_bg_to' => ['#efe4f6', true],
        'font_family' => ['Quicksand', true],
        'copyright' => ['© {year} PickerPlay. All rights reserved.', true],
        'contact_email' => ['support@pickerplay.com', true],
        'version' => ['1.0.0', true],
        // Wheel defaults for brand-new visitors
        'default_entries' => ["Ali\nBeatriz\nCharles\nDiya\nEric\nFatima\nGabriel\nHanna", true],
        'default_colors' => ['#33a5e8,#7cd992,#f8d85b,#b67fd6', true],
        'default_spin_time' => ['10', true],
        'default_popup_message' => ['We have a winner!', true],
        // Home page
        'show_info_cards' => ['1', true],
        'show_stats' => ['1', true],
        'stats_offset_spins' => ['0', true],
        'stats_offset_hours' => ['0', true],
        'gallery_tags' => ['yes no,numbers,names,food,team,classroom,games,truth or dare,countries,colors', true],
        // Ads
        'ads_enabled' => ['0', true],
        'ad_code' => ['', true],
        'ad_code_mobile' => ['', true],
        'ad_report_email' => ['support@pickerplay.com', true],
        // SEO / tracking
        'meta_title' => ['PickerPlay – Random Name Picker Wheel & Spinner', true],
        'meta_description' => ['Spin the wheel to pick a random name, winner or decision. Free, fast, customizable wheel spinner with sounds, images, sharing and multiple wheels.', true],
        'og_image' => ['/brand/logo.webp', true],
        'google_analytics_id' => ['', true],
        'custom_head_html' => ['', true],
        'custom_css' => ['', true],
        // Features
        'allow_registration' => ['1', true],
        'allow_gallery' => ['1', true],
        'allow_uploads' => ['1', true],
        'enabled_languages' => ['en,hi,te,ta,es,fr', true],
        // Private (never sent to browsers)
        'unsplash_access_key' => ['', false],
        'feedback_notify_email' => ['', false],
    ];

    public static function all(): array
    {
        return Cache::rememberForever(self::CACHE_KEY, function () {
            $values = [];
            foreach (self::DEFAULTS as $k => [$v]) {
                $values[$k] = $v;
            }
            if (Schema::hasTable('settings')) {
                foreach (Setting::all() as $row) {
                    $values[$row->key] = $row->value;
                }
            }

            return $values;
        });
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return self::all()[$key] ?? $default;
    }

    public static function isPublic(string $key): bool
    {
        return self::DEFAULTS[$key][1] ?? false;
    }

    public static function publicSettings(): array
    {
        $out = [];
        foreach (self::all() as $k => $v) {
            if (self::isPublic($k)) {
                $out[$k] = $v;
            }
        }
        $out['copyright'] = str_replace('{year}', date('Y'), (string) ($out['copyright'] ?? ''));

        return $out;
    }

    public static function set(array $pairs): void
    {
        foreach ($pairs as $key => $value) {
            if (! array_key_exists($key, self::DEFAULTS)) {
                continue;
            }
            Setting::updateOrCreate(['key' => $key], [
                'value' => is_bool($value) ? ($value ? '1' : '0') : (string) ($value ?? ''),
                'is_public' => self::isPublic($key),
            ]);
        }
        self::flush();
    }

    public static function flush(): void
    {
        Cache::forget(self::CACHE_KEY);
        Cache::forget('pickerplay.bootstrap.v1');
    }

    /** Everything the SPA needs on first paint (settings + footer pages + tools menu). */
    public static function bootstrap(): array
    {
        return Cache::remember('pickerplay.bootstrap.v1', 600, function () {
            $pages = Schema::hasTable('pages')
                ? Page::where('is_published', true)->where('show_in_footer', true)->orderBy('sort_order')
                    ->get(['slug', 'title', 'icon'])->toArray()
                : [];
            $tools = Schema::hasTable('tool_presets')
                ? ToolPreset::where('is_active', true)->where('show_in_menu', true)->orderBy('sort_order')
                    ->get()->map->toSummary()->all()
                : [];

            return [
                'settings' => self::publicSettings(),
                'pages' => $pages,
                'tools' => $tools,
            ];
        });
    }
}
