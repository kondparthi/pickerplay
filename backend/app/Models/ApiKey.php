<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    protected $fillable = ['user_id', 'name', 'prefix', 'key_hash', 'last_used_at', 'requests', 'is_active'];
    protected $hidden = ['key_hash'];
    protected $casts = ['last_used_at' => 'datetime', 'is_active' => 'boolean'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return array{0: ApiKey, 1: string} model + plain key (shown once) */
    public static function issue(User $user, string $name): array
    {
        $plain = 'pp_'.Str::random(40);
        $key = static::create([
            'user_id' => $user->id,
            'name' => $name,
            'prefix' => substr($plain, 0, 10),
            'key_hash' => hash('sha256', $plain),
        ]);

        return [$key, $plain];
    }

    public static function findByPlain(string $plain): ?self
    {
        return static::where('key_hash', hash('sha256', $plain))->where('is_active', true)->first();
    }
}
