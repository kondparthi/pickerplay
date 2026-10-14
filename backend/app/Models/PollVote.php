<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PollVote extends Model
{
    protected $fillable = ['poll_id', 'option_id', 'voter_hash', 'name'];

    protected $hidden = ['voter_hash'];
}
