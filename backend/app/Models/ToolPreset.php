<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToolPreset extends Model
{
    protected $fillable = [
        'slug', 'name', 'heading', 'meta_title', 'meta_description', 'config', 'content',
        'emoji', 'is_active', 'show_in_menu', 'sort_order',
    ];

    protected $casts = ['config' => 'array', 'is_active' => 'boolean', 'show_in_menu' => 'boolean'];

    public function toSummary(): array
    {
        return [
            'slug' => $this->slug,
            'name' => $this->name,
            'emoji' => $this->emoji,
        ];
    }
}
