<?php

namespace App\Services;

use Illuminate\Validation\ValidationException;

/**
 * Normalises a wheel snapshot coming from the browser / API so that only
 * known keys with safe values are stored.
 *
 * Shape:
 * {
 *   title, description,
 *   entries: [{ id, text, image, color, weight, enabled, message }],
 *   settings: { ...see SETTING_RULES }
 * }
 */
class WheelConfig
{
    /** key => type (bool|int:min:max|float:min:max|string:max|color|url|colors|enum:a,b) */
    public const SETTING_RULES = [
        // During spin
        'sound' => 'string:40',
        'volume' => 'int:0:100',
        'displayDuplicates' => 'bool',
        'spinSlowly' => 'bool',
        'showTitle' => 'bool',
        'spinTime' => 'int:1:60',
        'maxNames' => 'int:4:5000',
        // After spin
        'afterSound' => 'string:40',
        'afterVolume' => 'int:0:100',
        'animateWinner' => 'bool',
        'confetti' => 'bool',
        'autoRemove' => 'bool',
        'showPopup' => 'bool',
        'popupMessage' => 'string:200',
        'showRemove' => 'bool',
        'clickOnRemove' => 'bool',
        // Appearance
        'colorMode' => 'enum:colors,image',
        'bgImage' => 'url',
        'colors' => 'colors',
        'centerImage' => 'url',
        'centerSize' => 'enum:S,M,L,XL',
        'pageGradient' => 'bool',
        'pageBgColor' => 'color',
        'pageBgImage' => 'url',
        'shadow' => 'bool',
        'contours' => 'bool',
        'pointerColor' => 'color',
        'textColor' => 'color',
        'font' => 'string:60',
        'centerText' => 'string:12',
        'textScale' => 'float:0.5:3',
        'boldText' => 'bool',
    ];

    public static function sanitize(array $config): array
    {
        $max = (int) config('pickerplay.max_entries', 5000);
        $entriesIn = $config['entries'] ?? [];
        if (! is_array($entriesIn)) {
            $entriesIn = [];
        }
        if (count($entriesIn) > $max) {
            throw ValidationException::withMessages(['entries' => "A wheel can have at most {$max} entries."]);
        }

        $entries = [];
        foreach (array_values($entriesIn) as $i => $e) {
            if (is_string($e)) {
                $e = ['text' => $e];
            }
            if (! is_array($e)) {
                continue;
            }
            $text = mb_substr(trim((string) ($e['text'] ?? '')), 0, 300);
            $image = self::url($e['image'] ?? null);
            if ($text === '' && ! $image) {
                continue;
            }
            $entries[] = array_filter([
                'id' => mb_substr((string) ($e['id'] ?? 'e'.$i), 0, 40),
                'text' => $text,
                'image' => $image,
                'color' => self::color($e['color'] ?? null),
                'weight' => isset($e['weight']) ? max(0, min(1000, round((float) $e['weight'], 3))) : 1,
                'enabled' => array_key_exists('enabled', $e) ? (bool) $e['enabled'] : true,
                'message' => isset($e['message']) ? mb_substr((string) $e['message'], 0, 6000) : null,
            ], fn ($v) => $v !== null);
        }

        $settings = [];
        $in = is_array($config['settings'] ?? null) ? $config['settings'] : [];
        foreach (self::SETTING_RULES as $key => $rule) {
            if (! array_key_exists($key, $in)) {
                continue;
            }
            $value = self::castSetting($in[$key], $rule);
            if ($value !== null) {
                $settings[$key] = $value;
            }
        }

        return [
            'title' => mb_substr(trim((string) ($config['title'] ?? '')), 0, 150),
            'description' => mb_substr(trim((string) ($config['description'] ?? '')), 0, 1000),
            'entries' => $entries,
            'settings' => (object) $settings,
        ];
    }

    private static function castSetting(mixed $v, string $rule): mixed
    {
        $parts = explode(':', $rule);
        switch ($parts[0]) {
            case 'bool':
                return (bool) $v;
            case 'int':
                return max((int) $parts[1], min((int) $parts[2], (int) $v));
            case 'float':
                return is_numeric($v) ? max((float) $parts[1], min((float) $parts[2], round((float) $v, 2))) : null;
            case 'string':
                return is_scalar($v) ? mb_substr((string) $v, 0, (int) $parts[1]) : null;
            case 'enum':
                return in_array($v, explode(',', $parts[1]), true) ? $v : null;
            case 'color':
                return self::color($v) ?? '';
            case 'url':
                return self::url($v) ?? '';
            case 'colors':
                if (! is_array($v)) {
                    return null;
                }
                $out = [];
                foreach (array_slice($v, 0, 12) as $c) {
                    $hex = self::color(is_array($c) ? ($c['color'] ?? null) : $c);
                    if ($hex) {
                        $out[] = ['color' => $hex, 'enabled' => is_array($c) ? (bool) ($c['enabled'] ?? true) : true];
                    }
                }

                return $out;
        }

        return null;
    }

    public static function color(mixed $v): ?string
    {
        return is_string($v) && preg_match('/^#[0-9a-fA-F]{3,8}$/', $v) ? strtolower($v) : null;
    }

    /** Allow http(s) URLs and site-relative /uploads paths only (no javascript:, no huge data URIs). */
    public static function url(mixed $v): ?string
    {
        if (! is_string($v) || $v === '') {
            return null;
        }
        $v = trim($v);
        if (str_starts_with($v, '/uploads/') || str_starts_with($v, '/brand/') || str_starts_with($v, '/spa/')) {
            return mb_substr($v, 0, 500);
        }
        if (preg_match('#^https?://#i', $v) && filter_var($v, FILTER_VALIDATE_URL)) {
            return mb_substr($v, 0, 1000);
        }
        // small inline images (emoji/pictures pasted while offline) are tolerated up to ~150KB
        if (str_starts_with($v, 'data:image/') && ! str_starts_with($v, 'data:image/svg') && strlen($v) < 200000) {
            return $v;
        }

        return null;
    }
}
