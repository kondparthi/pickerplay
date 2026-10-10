<?php

namespace App\Models;

use App\Services\WheelConfig;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Wheel extends Model
{
    protected $fillable = [
        'user_id', 'kind', 'share_code', 'title', 'description', 'visibility', 'show_title',
        'is_featured', 'config', 'entries_text', 'entries_count', 'views', 'last_viewed_at', 'creator_ip',
    ];

    protected function casts(): array
    {
        return [
            'config' => 'array',
            'show_title' => 'boolean',
            'is_featured' => 'boolean',
            'last_viewed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Apply a (sanitised) config + keep the search columns in sync. */
    public function fillConfig(array $config): static
    {
        $config = WheelConfig::sanitize($config);
        $texts = collect($config['entries'])->pluck('text')->filter()->values();
        $this->config = $config;
        $this->entries_count = count($config['entries']);
        $this->entries_text = Str::limit($texts->implode(' | '), 60000, '');
        if (! $this->title && ! empty($config['title'])) {
            $this->title = Str::limit($config['title'], 150, '');
        }

        return $this;
    }

    public static function generateShareCode(): string
    {
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
        do {
            $code = '';
            for ($i = 0; $i < 6; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
                if ($i === 2) {
                    $code .= '-';
                }
            }
        } while (static::where('share_code', $code)->exists());

        return $code;
    }

    /** What visitors of a shared link receive. Hidden-entry wheels still ship entries (needed to spin). */
    public function toShareArray(bool $includeOwner = false): array
    {
        $data = [
            'code' => $this->share_code,
            'title' => $this->title,
            'description' => $this->description,
            'visibility' => $this->visibility,
            'show_title' => $this->show_title,
            'can_copy' => in_array($this->visibility, ['link_copy', 'public'], true),
            'config' => $this->config,
            'entries_count' => $this->entries_count,
            'views' => $this->views,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
        if ($includeOwner) {
            $data['id'] = $this->id;
            $data['user_id'] = $this->user_id;
            $data['last_viewed_at'] = $this->last_viewed_at?->toIso8601String();
        }

        return $data;
    }

    public function toSavedArray(bool $withConfig = true): array
    {
        $data = [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'entries_count' => $this->entries_count,
            'share_code' => $this->share_code,
            'visibility' => $this->visibility,
            'updated_at' => $this->updated_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
        if ($withConfig) {
            $data['config'] = $this->config;
        }

        return $data;
    }
}
