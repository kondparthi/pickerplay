<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Public developer API: send the key as `X-Api-Key: pp_xxx` or `Authorization: Bearer pp_xxx`.
 */
class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $plain = $request->header('X-Api-Key') ?: $request->bearerToken();
        if (! $plain || ! str_starts_with($plain, 'pp_')) {
            return response()->json(['message' => 'Missing API key. Send it in the X-Api-Key header.'], 401);
        }
        $key = ApiKey::findByPlain($plain);
        if (! $key || ! $key->user || ! $key->user->is_active) {
            return response()->json(['message' => 'Invalid or revoked API key.'], 401);
        }
        $key->forceFill(['last_used_at' => now(), 'requests' => $key->requests + 1])->saveQuietly();
        $request->setUserResolver(fn () => $key->user);
        $request->attributes->set('api_key', $key);

        return $next($request);
    }
}
