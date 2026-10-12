<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Post extends Model
{
    protected $fillable = [
        'author_id', 'title', 'slug', 'excerpt', 'content', 'cover_image', 'category', 'tags',
        'meta_title', 'meta_description', 'status', 'published_at', 'is_featured', 'reading_minutes', 'views',
    ];

    protected $casts = ['published_at' => 'datetime', 'is_featured' => 'boolean'];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /** Published and not scheduled for the future. */
    public function scopeLive(Builder $q): Builder
    {
        return $q->where('status', 'published')->where(fn ($w) => $w->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    public static function uniqueSlug(string $text, ?int $ignoreId = null): string
    {
        $base = Str::slug($text) ?: 'post';
        $slug = $base;
        $i = 2;
        while (static::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    public static function readingMinutes(?string $html): int
    {
        return max(1, (int) ceil(str_word_count(strip_tags((string) $html)) / 200));
    }

    public function tagList(): array
    {
        return array_values(array_filter(array_map('trim', explode(',', (string) $this->tags))));
    }

    public function toCard(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt ?: Str::limit(strip_tags((string) $this->content), 160),
            'cover_image' => $this->cover_image,
            'category' => $this->category,
            'reading_minutes' => $this->reading_minutes,
            'is_featured' => $this->is_featured,
            'published_at' => ($this->published_at ?? $this->created_at)?->toIso8601String(),
            'author' => $this->author?->name,
        ];
    }

    public function toFull(): array
    {
        return $this->toCard() + [
            'content' => $this->content,
            'tags' => $this->tagList(),
            'meta_title' => $this->meta_title,
            'meta_description' => $this->meta_description,
            'views' => $this->views,
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
