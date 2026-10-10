<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = User::query()->withCount('wheels');
        if ($s = $request->query('q')) {
            $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%"));
        }
        $page = $q->latest()->paginate(25);

        return response()->json([
            'data' => collect($page->items())->map(fn (User $u) => $u->only([
                'id', 'name', 'email', 'is_admin', 'is_active', 'wheels_count', 'created_at', 'last_login_at',
            ])),
            'total' => $page->total(), 'current_page' => $page->currentPage(), 'last_page' => $page->lastPage(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', Password::min(8)],
            'is_admin' => ['boolean'],
        ]);
        $user = User::create($data);
        AuditLog::record('admin.user_created', ['id' => $user->id]);

        return response()->json(['data' => $user], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'is_admin' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['sometimes', Password::min(8)],
        ]);
        if ($user->id === $request->user()->id && (($data['is_admin'] ?? true) === false || ($data['is_active'] ?? true) === false)) {
            return response()->json(['message' => 'You cannot remove your own admin access.'], 422);
        }
        $user->update($data);
        if (($data['is_active'] ?? true) === false) {
            $user->tokens()->delete();
        }
        AuditLog::record('admin.user_updated', ['id' => $id] + collect($data)->except('password')->all());

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if ($id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 422);
        }
        $user = User::findOrFail($id);
        $user->tokens()->delete();
        $user->delete();
        AuditLog::record('admin.user_deleted', ['id' => $id, 'email' => $user->email]);

        return response()->json(['ok' => true]);
    }
}
