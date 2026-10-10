<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ImportController extends Controller
{
    /**
     * POST /api/import/google-sheet { url }
     * The sheet must be shared as "Anyone with the link can view".
     * Only docs.google.com is contacted (no open proxy / SSRF).
     */
    public function googleSheet(Request $request): JsonResponse
    {
        $request->validate(['url' => ['required', 'string', 'max:500']]);
        $url = trim($request->input('url'));

        if (! preg_match('#^https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9_-]{20,})#', $url, $m)) {
            return response()->json(['message' => 'Please paste a Google Sheets link (https://docs.google.com/spreadsheets/d/...).'], 422);
        }
        $id = $m[1];
        $gid = preg_match('/[#&?]gid=(\d+)/', $url, $g) ? $g[1] : '0';
        $export = "https://docs.google.com/spreadsheets/d/{$id}/export?format=csv&gid={$gid}";

        try {
            $res = Http::timeout(15)->withOptions(['allow_redirects' => [
                'max' => 5,
                'on_redirect' => function ($req, $resp, $uri) {
                    $host = $uri->getHost();
                    if (! str_ends_with($host, '.googleusercontent.com') && $host !== 'docs.google.com') {
                        throw new \RuntimeException('Unexpected redirect');
                    }
                },
            ]])->get($export);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Could not reach Google Sheets. Try again.'], 502);
        }

        $type = (string) $res->header('Content-Type');
        if (! $res->ok() || str_contains($type, 'text/html')) {
            return response()->json(['message' => 'The sheet is private. Set sharing to "Anyone with the link can view" and try again.'], 422);
        }

        $rows = [];
        $handle = fopen('php://temp', 'r+');
        fwrite($handle, substr($res->body(), 0, 5_000_000));
        rewind($handle);
        while (($row = fgetcsv($handle, 0, ',', '"', '\\')) !== false && count($rows) < 10000) {
            $rows[] = array_map(fn ($c) => mb_substr(trim((string) $c), 0, 300), array_slice($row, 0, 26));
        }
        fclose($handle);

        return response()->json(['rows' => $rows]);
    }
}
