<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()?->role === 'admin', 403, 'غير مصرح لك بتنفيذ هذه العملية.');
    }

    public function index(Request $request)
    {
        $this->ensureAdmin($request);

        $employees = User::query()
            ->select('id', 'name', 'email', 'username', 'job_title', 'role', 'status', 'created_at')
            ->orderByDesc('id')
            ->paginate(15);

        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $this->ensureAdmin($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'employee'])],
            'status' => ['sometimes', Rule::in(['Active', 'Inactive'])],
        ]);

        $data['email'] = $data['email'] ?? null;
        $data['role'] = $data['role'] ?? 'employee';
        $data['status'] = $data['status'] ?? 'Active';

        $employee = User::create($data);

        return response()->json([
            'message' => 'تمت إضافة الموظف بنجاح.',
            'employee' => $employee->only([
                'id', 'name', 'email', 'username', 'job_title', 'role', 'status',
            ]),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $employee = User::query()
            ->select('id', 'name', 'email', 'username', 'job_title', 'role', 'status', 'created_at')
            ->findOrFail($id);

        return response()->json(['employee' => $employee]);
    }

    public function update(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $employee = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => [
                'sometimes', 'required', 'string', 'max:100', 'alpha_dash',
                Rule::unique('users', 'username')->ignore($employee->id),
            ],
            'email' => [
                'sometimes', 'nullable', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($employee->id),
            ],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'employee'])],
            'status' => ['sometimes', Rule::in(['Active', 'Inactive'])],
        ]);

        if ($employee->id === $request->user()->id) {
            abort_if(
                isset($data['role']) && $data['role'] !== 'admin',
                422,
                'لا يمكنك تغيير صلاحية حسابك الحالي.'
            );

            abort_if(
                isset($data['status']) && $data['status'] !== 'Active',
                422,
                'لا يمكنك تعطيل حسابك الحالي.'
            );
        }

        $employee->update($data);

        return response()->json([
            'message' => 'تم تحديث بيانات الموظف بنجاح.',
            'employee' => $employee->only([
                'id', 'name', 'email', 'username', 'job_title', 'role', 'status',
            ]),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $this->ensureAdmin($request);

        $employee = User::findOrFail($id);

        if ($employee->id === $request->user()->id) {
            return response()->json([
                'message' => 'لا يمكنك حذف حسابك الحالي.',
            ], 422);
        }

        if ($employee->role === 'admin') {
            return response()->json([
                'message' => 'لا يمكن حذف حساب مدير النظام من هذه الواجهة.',
            ], 422);
        }

        $employee->delete();

        return response()->json([
            'message' => 'تم حذف الموظف بنجاح.',
        ]);
    }
}