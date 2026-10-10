<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Stat extends Model
{
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['key', 'value'];

    public static function bump(string $key, int $by = 1): void
    {
        $affected = static::where('key', $key)->update([
            'value' => DB::raw('value + '.max(0, $by)),
            'updated_at' => now(),
        ]);
        if (! $affected) {
            static::create(['key' => $key, 'value' => max(0, $by)]);
        }
    }

    public static function get(string $key): int
    {
        return (int) (static::find($key)?->value ?? 0);
    }
}
