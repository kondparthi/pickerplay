<?php

use App\Models\Page;
use App\Models\ToolPreset;
use App\Services\SiteSettings;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

/**
 * AdSense readiness audit (Nov 2026) – data fixes on the live site:
 *  1. Trust pages: About, Disclaimer, Cookie Policy created if missing;
 *     Privacy Policy and Terms replaced only if they still hold the original starter text.
 *  2. Absolute "100% fair / truly random" claims softened on tool pages.
 *  3. Truth or Dare prompts reviewed (privacy / age-appropriate) + a "Play safely" note.
 * Pages edited in Admin are never overwritten.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('pages')) {
            $legal = require database_path('seeders/content/legal.php');
            // text that only the original starter pages contain
            $starter = [
                'privacy' => 'You can close ads for your session at any time.',
                'terms' => 'Continued use after an update means you accept the new terms.',
            ];
            foreach ($legal as $slug => [$title, $icon, $sort, $meta, $html]) {
                $page = Page::where('slug', $slug)->first();
                $fields = ['title' => $title, 'icon' => $icon, 'sort_order' => $sort, 'meta_description' => $meta,
                    'content' => $html, 'show_in_footer' => true, 'is_published' => true];
                if (! $page) {
                    Page::create(['slug' => $slug] + $fields);
                } elseif (isset($starter[$slug]) && str_contains((string) $page->content, $starter[$slug])) {
                    $page->update($fields);
                }
            }
        }

        if (Schema::hasTable('tool_presets')) {
            $fixes = require database_path('seeders/content/claims_fix.php');
            $tod = [
                'Who was your first crush?' => 'Who is your favourite teacher or mentor, and why?',
                'What is the last lie you told?' => 'What is the funniest excuse you have ever given for being late?',
                'What is something you have never told your parents?' => 'What is your favourite family tradition?',
                'Let the person on your left send one emoji to anyone in your contacts.' => 'Give a genuine compliment to every person in the group.',
                'Show the most recent photo in your camera roll.' => 'Do your best impression of a famous cartoon character.',
            ];
            $safe = '<h2>Play safely</h2><p>Keep it fun for everyone: anyone can skip any question or dare, only take on challenges that are safe, legal and comfortable, and younger players should play with an adult. You can edit every question and dare in the entries box to suit your group.</p>';

            foreach (ToolPreset::all() as $tool) {
                $content = str_replace(array_keys($fixes), array_values($fixes), (string) $tool->content);
                $meta = str_replace(array_keys($fixes), array_values($fixes), (string) $tool->meta_description);
                $config = $tool->config;

                if ($tool->slug === 'truth-or-dare-wheel') {
                    if (! str_contains($content, 'Play safely')) {
                        $content .= "\n".$safe;
                    }
                    $cfg = json_decode(json_encode($config), true) ?: [];
                    foreach ($cfg['entries'] ?? [] as $i => $e) {
                        if (! empty($e['message'])) {
                            $cfg['entries'][$i]['message'] = str_replace(array_keys($tod), array_values($tod), $e['message']);
                        }
                    }
                    $config = $cfg;
                }

                $tool->content = $content;
                $tool->meta_description = $meta;
                $tool->config = $config;
                if ($tool->isDirty()) {
                    $tool->save();
                }
            }
        }

        Cache::forget('pickerplay.sitemap');
        SiteSettings::flush();
    }

    public function down(): void
    {
    }
};
