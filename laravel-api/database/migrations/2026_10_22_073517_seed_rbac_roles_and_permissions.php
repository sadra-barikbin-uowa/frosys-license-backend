<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private const PERMISSIONS = [
        'drivers.view',
        'drivers.create',
        'drivers.edit',
        'drivers.delete',
        'badges.view',
        'badges.create',
        'badges.edit',
        'badges.delete',
        'badges.print',
        'vehicles.view',
        'vehicles.manage',
        'users.manage',
    ];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect(self::PERMISSIONS)
            ->map(fn (string $name) => Permission::findOrCreate($name, 'web'));

        foreach (['admin', 'employee', 'supervisor', 'viewer'] as $name) {
            Role::findOrCreate($name, 'web');
        }

        Role::findByName('admin', 'web')->syncPermissions($permissions);
        Role::findByName('employee', 'web')->syncPermissions([
            'drivers.view',
            'badges.create',
        ]);
        Role::findByName('supervisor', 'web')->syncPermissions([]);
        Role::findByName('viewer', 'web')->syncPermissions([
            'drivers.view',
            'badges.view',
            'vehicles.view',
        ]);

        User::query()
            ->whereIn('role', ['admin', 'employee', 'supervisor', 'viewer'])
            ->each(fn (User $user) => $user->syncRoles($user->role));
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        User::query()
            ->whereIn('role', ['admin', 'employee', 'supervisor', 'viewer'])
            ->each(fn (User $user) => $user->syncRoles([]));

        Role::query()->whereIn('name', ['admin', 'employee', 'supervisor', 'viewer'])->delete();
        Permission::query()->whereIn('name', self::PERMISSIONS)->delete();
    }
};
