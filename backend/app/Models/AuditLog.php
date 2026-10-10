<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;
    protected $fillable = ['user_id', 'action', 'metadata', 'ip', 'created_at'];
    protected $casts = ['metadata' => 'array', 'created_at' => 'datetime'];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(string $action, array $metadata = [], ?int $userId = null): void
    {
        static::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'metadata' => $metadata,
            'ip' => request()?->ip(),
            'created_at' => now(),
        ]);
    }
}
