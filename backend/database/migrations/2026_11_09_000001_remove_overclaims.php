<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * AdSense content audit (9 Nov 2026): site-wide clean-up of wording left over from the old
 * WordPress site – unproven view counts ("300M+ views"), rankings ("#1"), absolute fairness
 * ("100% fair", "truly random", "no algorithm bias") and "your data never leaves your browser".
 * Runs over tool pages, CMS pages and blog posts. Only these phrases are changed; everything
 * else stays exactly as edited in Admin. A summary is written to storage/logs/laravel.log.
 */
return new class extends Migration
{
    private function rules(): array
    {
        return [
            // unproven usage numbers: drop the whole sentence that contains them
            '/[^.!?<>]*\b\d[\d,.]*\s*[MK]\+?\s*(?:views|users|spins|plays|people)\b[^.!?<>]*[.!?]?/iu' => '',
            '/no favou?rites?,?\s*no repeats?\s*[–—-]\s*just pure luck\.?/iu' => 'Each spin is independent, so the same result can come up again.',
            '/no favou?ritism,?\s*no algorithm tricks?\.?/iu' => 'Every entry with an equal slice has the same chance.',
            '/\b100\s*%\s*fair(?:\s*(?:and|&amp;|&)\s*(?:truly random|unbiased))?/iu' => 'Equal chances for every entry',
            '/\btrue random algorithm\b/iu' => 'secure browser-based random selection',
            '/\btrue randomness\b/iu' => 'randomness',
            '/\btruly random\b/iu' => 'random',
            '/\btrue random\b/iu' => 'random',
            '/\bno algorithm bias\b/iu' => 'equal chances for equal slices',
            '/\bpicks purely on luck\b/iu' => 'picks at random',
            '/\bpure luck\b/iu' => 'chance',
            '/\bthe fairest way\b/iu' => 'a fair way',
            '/\bthe #1 (tool|app|wheel|picker|website|site)\b/iu' => 'a handy $1',
            '/\b#1\s+(tool|app|wheel|picker)\b/iu' => 'handy $1',
            '/\bfree forever\b/iu' => 'free',
            '/\b100\s*%\s*unbiased\b/iu' => 'random',
            '/\bunbiased\b/iu' => 'random',
            '/\bno repeats\b/iu' => 'optional repeat removal',
            '/your data never leaves your browser\.?/iu' => 'Your wheel stays in your browser unless you save or share it.',
            '/we (?:do not|don\'t|never) (?:save|store)(?:,| or)? (?:store|save|share)?[^.<]*names[^.<]*\./iu' => 'If you save, download or share a wheel, its entries are included in that file or link – see our Privacy Policy.',
            // tidy up list items emptied by the rules above
            '#<li>\s*(?:<strong>\s*</strong>)?\s*</li>#i' => '',
        ];
    }

    private function clean(?string $text): ?string
    {
        if ($text === null || $text === '') {
            return $text;
        }
        foreach ($this->rules() as $pattern => $replacement) {
            // keep a capital letter at the start of a sentence ("The #1 tool…" -> "A handy tool…")
            $text = preg_replace_callback($pattern, function ($m) use ($replacement) {
                $out = preg_replace_callback('/\$(\d)/', fn ($g) => $m[(int) $g[1]] ?? '', $replacement);
                $first = mb_substr(ltrim($m[0]), 0, 1);

                return ($out !== '' && $first !== '' && mb_strtoupper($first) === $first && mb_strtolower($first) !== $first)
                    ? mb_strtoupper(mb_substr($out, 0, 1)).mb_substr($out, 1) : $out;
            }, $text) ?? $text;
        }

        return $text;
    }

    public function up(): void
    {
        $targets = [
            'tool_presets' => ['heading', 'content', 'meta_title', 'meta_description'],
            'pages' => ['content', 'meta_description'],
            'posts' => ['title', 'content', 'excerpt', 'meta_title', 'meta_description'],
        ];
        $changed = [];

        foreach ($targets as $table => $columns) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            $columns = array_values(array_filter($columns, fn ($c) => Schema::hasColumn($table, $c)));
            if (! $columns) {
                continue;
            }
            foreach (DB::table($table)->get(array_merge(['id'], $columns)) as $row) {
                $update = [];
                foreach ($columns as $col) {
                    $new = $this->clean($row->{$col});
                    if ($new !== $row->{$col}) {
                        $update[$col] = $new;
                    }
                }
                if ($update) {
                    DB::table($table)->where('id', $row->id)->update($update);
                    $changed[] = "{$table}#{$row->id} (".implode(', ', array_keys($update)).')';
                }
            }
        }

        Log::info('AdSense wording clean-up: '.(count($changed) ? implode('; ', $changed) : 'nothing to change'));
        Cache::forget('pickerplay.sitemap');
        Cache::forget('pp.ssr.links');
        if (class_exists(\App\Services\SiteSettings::class)) {
            \App\Services\SiteSettings::flush();
        }
    }

    public function down(): void
    {
        // wording fix only – nothing to undo
    }
};
