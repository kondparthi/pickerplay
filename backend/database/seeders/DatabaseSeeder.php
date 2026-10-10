<?php

namespace Database\Seeders;

use App\Models\Stat;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => strtolower(config('pickerplay.admin_email'))],
            ['name' => 'Administrator', 'password' => config('pickerplay.admin_password'), 'is_admin' => true, 'is_active' => true]
        );

        foreach (['spins_total', 'spins_'.date('Y'), 'seconds_'.date('Y')] as $k) {
            Stat::firstOrCreate(['key' => $k], ['value' => 0]);
        }

        $this->call([
            PageSeeder::class,
            ToolPresetSeeder::class,
            GallerySeeder::class,
        ]);
    }
}
