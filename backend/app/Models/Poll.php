<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poll extends Model
{
    protected $fillable = [
        'code', 'admin_token', 'user_id', 'question', 'options', 'settings', 'is_closed',
        'votes_count', 'views', 'creator_ip', 'expires_at',
    ];

    protected $hidden = ['admin_token', 'creator_ip'];

    protected function casts(): array
    {
        return [
            'options' => 'array',
            'settings' => 'array',
            'is_closed' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PollVote::class);
    }

    public static function generateCode(): string
    {
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
        do {
            $code = '';
            for ($i = 0; $i < 7; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }
        } while (static::where('code', $code)->exists());

        return $code;
    }

    public function isOpen(): bool
    {
        return ! $this->is_closed && (! $this->expires_at || $this->expires_at->isFuture());
    }

    public function setting(string $key, mixed $default = null): mixed
    {
        return ($this->settings ?? [])[$key] ?? $default;
    }

    public function checkToken(?string $token): bool
    {
        return is_string($token) && $token !== '' && hash_equals($this->admin_token, hash('sha256', $token));
    }

    /** Option list with vote counts and percentages. */
    public function tally(): array
    {
        $counts = $this->votes()->selectRaw('option_id, COUNT(*) as c')->groupBy('option_id')->pluck('c', 'option_id');
        $total = (int) $counts->sum();

        return [
            'total' => $total,
            'options' => collect($this->options)->map(fn ($o) => $o + [
                'votes' => (int) ($counts[$o['id']] ?? 0),
                'percent' => $total ? round(($counts[$o['id']] ?? 0) * 100 / $total, 1) : 0,
            ])->values()->all(),
        ];
    }

    public function toPublicArray(): array
    {
        return [
            'code' => $this->code,
            'question' => $this->question,
            'options' => $this->options,
            'settings' => [
                'show_results' => (bool) $this->setting('show_results', true),
                'ask_name' => (bool) $this->setting('ask_name', false),
                'allow_change' => (bool) $this->setting('allow_change', false),
            ],
            'is_open' => $this->isOpen(),
            'votes_count' => $this->votes_count,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
