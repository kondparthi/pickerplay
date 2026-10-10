<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $table = 'feedback';
    protected $fillable = ['user_id', 'name', 'email', 'type', 'message', 'page_url', 'ip', 'is_read'];
    protected $casts = ['is_read' => 'boolean'];
}
