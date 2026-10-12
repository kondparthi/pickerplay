<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

/**
 * Create an admin or reset an existing user's password:
 *   php artisan pickerplay:admin you@example.com "NewStrongPass123"
 */
class MakeAdmin extends Command
{
    protected $signature = 'pickerplay:admin {email} {password} {--name=Administrator}';
    protected $description = 'Create an administrator account or reset its password';

    public function handle(): int
    {
        $email = strtolower(trim($this->argument('email')));
        $password = (string) $this->argument('password');
        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            $this->error('Give a valid email and a password of at least 8 characters.');

            return self::FAILURE;
        }
        $user = User::where('email', $email)->first();
        if ($user) {
            $user->forceFill(['password' => $password, 'is_admin' => true, 'is_active' => true])->save();
            $user->tokens()->delete();
            $this->info("Password reset and admin access granted for {$email}.");
        } else {
            User::create(['name' => $this->option('name'), 'email' => $email, 'password' => $password, 'is_admin' => true, 'is_active' => true]);
            $this->info("Administrator {$email} created.");
        }
        $this->line('Sign in at '.rtrim(config('app.url'), '/').'/admin');

        return self::SUCCESS;
    }
}
