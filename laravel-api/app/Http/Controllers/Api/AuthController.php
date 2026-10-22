<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Permission;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('username', $credentials['username'])->first();

        if (
            ! $user ||
            ! Hash::check($credentials['password'], $user->password)
        ) {
            throw ValidationException::withMessages([
                'username' => ['اسم المستخدم أو كلمة المرور غير صحيحة.'],
            ]);
        }

        if ($user->status !== 'Active') {
            return response()->json([
                'message' => 'هذا الحساب غير مفعّل.',
            ], 403);
        }

        $token = $user->createToken('frosys-license')->plainTextToken;

        return response()->json([
            'message' => 'تم تسجيل الدخول بنجاح.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'jobTitle' => $user->job_title,
                'role' => $user->role,
                'roles' => $user->getRoleNames()->values(),
                'permissions' => $this->permissionsFor($user),
                'status' => $user->status,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'jobTitle' => $user->job_title,
                'role' => $user->role,
                'roles' => $user->getRoleNames()->values(),
                'permissions' => $this->permissionsFor($user),
                'status' => $user->status,
            ],
        ]);
    }

    private function permissionsFor(User $user): array
    {
        if ($user->hasRole('admin')) {
            return Permission::query()
                ->where('guard_name', 'web')
                ->orderBy('name')
                ->pluck('name')
                ->all();
        }

        return $user->getAllPermissions()->pluck('name')->sort()->values()->all();
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'تم تسجيل الخروج بنجاح.',
        ]);
    }
}
