<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = User::query()
            ->select('id', 'name', 'username', 'job_title', 'role', 'status', 'created_at')
            ->orderByDesc('id')
            ->paginate(15);
        $employees->getCollection()->transform(
            fn (User $employee) => $this->employeePayload($employee)
        );

        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100', 'alpha_dash', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'employee', 'supervisor', 'viewer'])],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')->where('guard_name', 'web')],
            'status' => ['sometimes', Rule::in(['Active', 'Inactive'])],
        ]);
        abort_unless(
            ! isset($data['role']) || $data['role'] === 'employee' || $request->user()->hasRole('admin'),
            403,
            'تعيين الأدوار متاح لمدير النظام فقط.'
        );
        abort_unless(
            ! array_key_exists('permissions', $data) || $request->user()->hasRole('admin'),
            403,
            'تعيين الصلاحيات متاح لمدير النظام فقط.'
        );
        if (($data['role'] ?? 'employee') === 'viewer') {
            abort_if(
                array_diff($data['permissions'] ?? [], [
                    'drivers.view',
                    'badges.view',
                    'vehicles.view',
                ]),
                422,
                'دور المستخدم للعرض فقط ولا يقبل صلاحيات التعديل.'
            );
        }

        $data['role'] = $data['role'] ?? 'employee';
        $data['status'] = $data['status'] ?? 'Active';

        $role = $data['role'];
        $permissions = $data['permissions'] ?? [];
        unset($data['permissions']);
        $employee = User::create($data);
        $employee->syncRoles($role);
        $employee->syncPermissions($permissions);

        return response()->json([
            'message' => 'تمت إضافة الموظف بنجاح.',
            'employee' => $this->employeePayload($employee),
        ], 201);
    }

    public function show(Request $request, string $id)
    {
        $employee = User::query()
            ->select('id', 'name', 'username', 'job_title', 'role', 'status', 'created_at')
            ->findOrFail($id);

        return response()->json(['employee' => $this->employeePayload($employee)]);
    }

    public function update(Request $request, string $id)
    {
        $employee = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => [
                'sometimes', 'required', 'string', 'max:100', 'alpha_dash',
                Rule::unique('users', 'username')->ignore($employee->id),
            ],
            'password' => ['sometimes', 'required', 'string', 'min:8'],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'role' => ['sometimes', Rule::in(['admin', 'employee', 'supervisor', 'viewer'])],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', Rule::exists('permissions', 'name')->where('guard_name', 'web')],
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

        if (isset($data['role'])) {
            abort_unless(
                $request->user()->hasRole('admin'),
                403,
                'تغيير أدوار المستخدمين متاح لمدير النظام فقط.'
            );
        }
        if (array_key_exists('permissions', $data)) {
            abort_unless(
                $request->user()->hasRole('admin'),
                403,
                'تغيير صلاحيات المستخدمين متاح لمدير النظام فقط.'
            );
        }
        if (($data['role'] ?? $employee->role) === 'viewer') {
            $effectivePermissions = $data['permissions']
                ?? $employee->permissions()->pluck('name')->all();
            abort_if(
                array_diff($effectivePermissions, [
                    'drivers.view',
                    'badges.view',
                    'vehicles.view',
                ]),
                422,
                'دور المستخدم للعرض فقط ولا يقبل صلاحيات التعديل.'
            );
        }
        $role = $data['role'] ?? null;
        $permissions = $data['permissions'] ?? null;
        unset($data['permissions']);
        $employee->update($data);
        if ($role !== null) {
            $employee->syncRoles($role);
        }
        if ($permissions !== null) {
            $employee->syncPermissions($permissions);
        }

        return response()->json([
            'message' => 'تم تحديث بيانات الموظف بنجاح.',
            'employee' => $this->employeePayload($employee),
        ]);
    }

    public function destroy(Request $request, string $id)
    {
        $employee = User::findOrFail($id);

        if ($employee->id === $request->user()->id) {
            return response()->json([
                'message' => 'لا يمكنك حذف حسابك الحالي.',
            ], 422);
        }

        if ($employee->hasRole('admin')) {
            return response()->json([
                'message' => 'لا يمكن حذف حساب مدير النظام من هذه الواجهة.',
            ], 422);
        }

        $employee->delete();

        return response()->json([
            'message' => 'تم حذف الموظف بنجاح.',
        ]);
    }

    private function employeePayload(User $employee): array
    {
        return [
            ...$employee->only([
                'id', 'name', 'username', 'job_title', 'role', 'status', 'created_at',
            ]),
            'permissions' => $employee->permissions()->pluck('name')->sort()->values()->all(),
        ];
    }
}
