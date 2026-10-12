<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Post;
use App\Models\ToolPreset;
use App\Models\Wheel;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function sitemap(): Response
    {
        $xml = Cache::remember('pickerplay.sitemap', 3600, function () {
            $base = rtrim(config('app.url'), '/');
            $urls = [[$base.'/', now(), '1.0'], [$base.'/team-picker', now(), '0.9'], [$base.'/gallery', now(), '0.7']];
            foreach (ToolPreset::where('is_active', true)->orderBy('sort_order')->get() as $t) {
                $urls[] = [$base.'/'.$t->slug, $t->updated_at, '0.9'];
            }
            $urls[] = [$base.'/blog', now(), '0.7'];
            foreach (Post::live()->orderByDesc('published_at')->limit(2000)->get(['slug', 'updated_at']) as $post) {
                $urls[] = [$base.'/blog/'.$post->slug, $post->updated_at, '0.6'];
            }
            foreach (Page::where('is_published', true)->get() as $p) {
                $urls[] = [$base.'/page/'.$p->slug, $p->updated_at, '0.4'];
            }
            foreach (Wheel::where('kind', 'shared')->where('visibility', 'public')->orderByDesc('views')->limit(5000)->get(['share_code', 'updated_at']) as $w) {
                $urls[] = [$base.'/'.$w->share_code, $w->updated_at, '0.5'];
            }
            $out = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            foreach ($urls as [$loc, $mod, $prio]) {
                $out .= '<url><loc>'.htmlspecialchars($loc).'</loc><lastmod>'.optional($mod)->toDateString().'</lastmod><priority>'.$prio.'</priority></url>';
            }

            return $out.'</urlset>';
        });

        return response($xml, 200, ['Content-Type' => 'application/xml']);
    }

    public function robots(): Response
    {
        $base = rtrim(config('app.url'), '/');
        $txt = "User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /api/\nDisallow: /embed/\n\nSitemap: {$base}/sitemap.xml\n";

        return response($txt, 200, ['Content-Type' => 'text/plain']);
    }
}
