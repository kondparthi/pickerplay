<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Page extends Model
{
    protected $fillable = ['slug', 'title', 'meta_description', 'content', 'icon', 'show_in_footer', 'is_published', 'sort_order'];
    protected $casts = ['show_in_footer' => 'boolean', 'is_published' => 'boolean'];
}
