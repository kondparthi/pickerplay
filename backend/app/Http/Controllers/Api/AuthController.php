<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\SiteSettings;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        if (SiteSettings::get('allow_registration') !== '1') {
            return response()->json(['message' => 'Registration is currently closed.'], 403);
        }
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);
        $user = User::create([
            'name' => strip_tags($data['name']),
            'email' => strtolower($data['email']),
            'password' => $data['password'],
            'last_login_at' => now(),
        ]);
        AuditLog::record('user.registered', [], $user->id);

        return response()->json($this->tokenResponse($user), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);
        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }
        if (! $user->is_active) {
            throw ValidationException::withMessages(['email' => 'This account has been disabled.']);
        }
        $user->forceFill(['last_login_at' => now()])->save();
        AuditLog::record('user.login', [], $user->id);

        return response()->json($this->tokenResponse($user));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->toPublicArray()]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['ok' => true]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email,'.$user->id],
        ]);
        $user->update(['name' => strip_tags($data['name']), 'email' => strtolower($data['email'])]);

        return response()->json(['user' => $user->toPublicArray()]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'Current password is incorrect.']);
        }
        $user->update(['password' => $data['password']]);
        // sign out other devices
        $user->tokens()->where('id', '!=', $user->currentAccessToken()?->id)->delete();
        AuditLog::record('user.password_changed');

        return response()->json(['ok' => true]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        try {
            Password::sendResetLink(['email' => strtolower($request->email)]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json(['message' => 'Email could not be sent. Please contact support.'], 500);
        }

        // Same answer whether or not the address exists (no account enumeration)
        return response()->json(['message' => 'If that email is registered, a reset link is on its way.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            }
        );
        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return response()->json(['message' => 'Password updated. You can sign in now.']);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $request->validate(['password' => ['required', 'string']]);
        $user = $request->user();
        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages(['password' => 'Password is incorrect.']);
        }
        AuditLog::record('user.deleted', ['email' => $user->email]);
        $user->tokens()->delete();
        $user->wheels()->where('kind', 'saved')->delete();
        $user->delete(); // shared links stay alive anonymously (user_id -> null)

        return response()->json(['ok' => true]);
    }

    private function tokenResponse(User $user): array
    {
        return [
            'token' => $user->createToken('spa')->plainTextToken,
            'user' => $user->toPublicArray(),
        ];
    }
}
