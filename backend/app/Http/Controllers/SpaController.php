<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Post;
use App\Models\ToolPreset;
use App\Models\Wheel;
use App\Services\SiteSettings;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

/**
 * Serves the built React app (public/spa/index.html) for every non-API URL and
 * injects SEO meta tags + white-label settings so the first paint is branded
 * and crawlers see per-page titles (shared wheels, picker tools, CMS pages).
 */
class SpaController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $indexFile = public_path(trim(config('pickerplay.spa_path', 'spa'), '/').'/index.html');
        if (! is_file($indexFile)) {
            return response('<h1>Frontend not built</h1><p>Run <code>npm run build</code> inside /frontend (it outputs to backend/public/spa).</p>', 503);
        }

        $boot = SiteSettings::bootstrap();
        $s = $boot['settings'];
        $site = $s['site_name'] ?? 'PickerPlay';
        $base = rtrim(config('app.url') ?: $request->getSchemeAndHttpHost(), '/');
        $path = trim($request->path(), '/');

        $meta = [
            'title' => $s['meta_title'] ?: $site,
            'description' => $s['meta_description'] ?? '',
            'image' => $this->abs($s['og_image'] ?? '', $base),
            'robots' => 'index,follow',
            'canonical' => $base.($path === '' ? '/' : '/'.$path),
        ];
        $status = 200;
        $preload = null;

        if (preg_match('#^page/([a-z0-9_-]+)$#i', $path, $m)) {
            $page = Page::where('slug', $m[1])->where('is_published', true)->first();
            if ($page) {
                $meta['title'] = "{$page->title} | {$site}";
                $meta['description'] = $page->meta_description ?: Str::limit(strip_tags((string) $page->content), 155);
            } else {
                $status = 404;
            }
        } elseif (preg_match('#^(embed/)?([a-z0-9]{3}-[a-z0-9]{3})$#i', $path, $m)) {
            $wheel = Wheel::where('kind', 'shared')->where('share_code', strtolower($m[2]))->first();
            if ($wheel) {
                $names = collect($wheel->config['entries'] ?? [])->pluck('text')->filter()->take(8)->implode(', ');
                $title = $wheel->title ?: 'Shared wheel';
                $meta['title'] = "{$title} | {$site}";
                $meta['description'] = $wheel->visibility === 'link_spin'
                    ? "Spin the {$title} wheel on {$site}."
                    : Str::limit("Spin the wheel: {$names}", 155);
                $meta['robots'] = ($wheel->visibility === 'public' && ! $m[1]) ? 'index,follow' : 'noindex,follow';
            } else {
                $status = 404;
            }
        } elseif ($path === 'blog') {
            $meta['title'] = "Blog – Tips, Ideas & Guides | {$site}";
            $meta['description'] = "Ideas, guides and tips for using random pickers, spinning wheels and team generators in class, at work, at parties and on stream.";
        } elseif (preg_match('#^blog/([a-z0-9_-]+)$#i', $path, $m)) {
            $post = Post::live()->where('slug', $m[1])->first();
            if ($post) {
                $meta['title'] = ($post->meta_title ?: $post->title)." | {$site}";
                $meta['description'] = $post->meta_description ?: ($post->excerpt ?: Str::limit(strip_tags((string) $post->content), 155));
                if ($post->cover_image) {
                    $meta['image'] = $this->abs($post->cover_image, $base);
                }
            } else {
                $status = 404;
                $meta['robots'] = 'noindex';
            }
        } elseif ($path === 'team-picker') {
            $meta['title'] = "Team Picker – Random Team Generator | {$site}";
            $meta['description'] = 'Split names into random, fair teams or groups in one click. Pick team leaders, balance by gender or skill, copy or download the result. Free.';
        } elseif ($path !== '' && preg_match('#^[a-z0-9_-]+$#i', $path)
            && ! in_array($path, ['gallery', 'account', 'admin', 'reset-password'], true)) {
            $tool = ToolPreset::where('slug', $path)->where('is_active', true)->first();
            if ($tool) {
                $meta['title'] = $tool->meta_title ?: "{$tool->name} | {$site}";
                $meta['description'] = $tool->meta_description ?: $meta['description'];
                $preload = ['tool' => $tool->only(['slug', 'name', 'heading', 'meta_title', 'meta_description', 'config', 'content', 'emoji'])];
            } else {
                $status = 404;
                $meta['robots'] = 'noindex';
            }
        } elseif (str_starts_with($path, 'admin') || str_starts_with($path, 'account') || str_starts_with($path, 'reset-password')) {
            $meta['robots'] = 'noindex,nofollow';
        } elseif ($path === 'gallery') {
            $meta['title'] = "Wheel Gallery | {$site}";
        }

        $e = fn ($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');
        $favicon = $s['favicon_url'] ?? '';
        $head = implode("\n    ", array_filter([
            '<meta name="description" content="'.$e($meta['description']).'">',
            '<meta name="robots" content="'.$e($meta['robots']).'">',
            '<link rel="canonical" href="'.$e($meta['canonical']).'">',
            '<meta property="og:type" content="website">',
            '<meta property="og:site_name" content="'.$e($site).'">',
            '<meta property="og:title" content="'.$e($meta['title']).'">',
            '<meta property="og:description" content="'.$e($meta['description']).'">',
            '<meta property="og:url" content="'.$e($meta['canonical']).'">',
            $meta['image'] ? '<meta property="og:image" content="'.$e($meta['image']).'">' : null,
            '<meta name="twitter:card" content="summary_large_image">',
            '<meta name="theme-color" content="'.$e($s['primary_color'] ?? '#5546c9').'">',
            $favicon ? '<link rel="icon" href="'.$e($favicon).'">' : null,
            $favicon ? '<link rel="apple-touch-icon" href="'.$e($favicon).'">' : null,
            '<script>window.__PP_BOOT__='.json_encode($boot + ['preload' => $preload], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE).';</script>',
            ! empty($s['google_analytics_id']) ? $this->analytics($s['google_analytics_id']) : null,
            ! empty($s['custom_css']) ? '<style id="pp-custom-css">'.str_ireplace('</style', '', $s['custom_css']).'</style>' : null,
            $s['custom_head_html'] ?? null,
        ]));

        $html = file_get_contents($indexFile);
        $html = preg_replace('#<title>.*?</title>#s', '<title>'.$e($meta['title']).'</title>', $html, 1);
        $html = preg_replace('#<link rel="icon"[^>]*>#', '', $html);
        $html = str_replace('</head>', "    {$head}\n  </head>", $html);
        $html = str_replace('<html lang="en">', '<html lang="'.$e(app()->getLocale()).'">', $html);

        $response = response($html, $status)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Cache-Control', 'no-cache, private');
        // Only /embed/{code} may be framed by other sites (OBS, LMS, client websites)
        if (! str_starts_with($path, 'embed/')) {
            $response->header('X-Frame-Options', 'SAMEORIGIN');
        }

        return $response;
    }

    private function abs(string $url, string $base): string
    {
        if ($url === '') {
            return '';
        }

        return preg_match('#^https?://#', $url) ? $url : $base.'/'.ltrim($url, '/');
    }

    private function analytics(string $id): string
    {
        $id = preg_replace('/[^A-Za-z0-9_-]/', '', $id);

        return "<script async src=\"https://www.googletagmanager.com/gtag/js?id={$id}\"></script>"
            ."<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','{$id}');</script>";
    }
}
