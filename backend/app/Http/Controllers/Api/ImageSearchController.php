<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/** Optional Unsplash image search (admin adds an Access Key in settings). */
class ImageSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'max:80']]);
        $key = SiteSettings::get('unsplash_access_key');
        if (! $key) {
            return response()->json(['enabled' => false, 'results' => []]);
        }
        $q = mb_strtolower(trim($request->query('q')));

        $results = Cache::remember('unsplash:'.md5($q), 3600, function () use ($key, $q) {
            $res = Http::timeout(10)->withHeaders(['Authorization' => 'Client-ID '.$key])
                ->get('https://api.unsplash.com/search/photos', ['query' => $q, 'per_page' => 24, 'content_filter' => 'high']);
            if (! $res->ok()) {
                return [];
            }

            return collect($res->json('results', []))->map(fn ($p) => [
                'thumb' => $p['urls']['thumb'] ?? null,
                'url' => $p['urls']['small'] ?? null,
                'author' => $p['user']['name'] ?? null,
                'link' => ($p['links']['html'] ?? '').'?utm_source=pickerplay&utm_medium=referral',
            ])->filter(fn ($p) => $p['url'])->values()->all();
        });

        return response()->json(['enabled' => true, 'results' => $results]);
    }
}
