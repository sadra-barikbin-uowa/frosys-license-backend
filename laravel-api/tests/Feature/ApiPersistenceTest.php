<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_employee_driver_queries_are_limited_to_owned_records(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $otherEmployee = User::factory()->create(['role' => 'employee']);
        $employee->syncRoles('employee');
        $otherEmployee->syncRoles('employee');
        $ownedDriver = $this->createDriver($employee);
        $otherDriver = $this->createDriver($otherEmployee);

        Sanctum::actingAs($employee);

        $this->getJson('/api/drivers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownedDriver->id);

        $this->getJson('/api/drivers/'.$otherDriver->id)->assertNotFound();
        $this->putJson('/api/drivers/'.$otherDriver->id, [
            'full_name' => 'Unauthorized update',
        ])->assertNotFound();
    }

    public function test_system_settings_are_persisted_and_only_admins_can_update_them(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $employee = User::factory()->create(['role' => 'employee']);

        Sanctum::actingAs($admin);
        $this->putJson('/api/settings', [
            'system_name' => 'Database-backed settings',
            'badge_color' => '#123456',
        ])
            ->assertOk()
            ->assertJsonPath('settings.system_name', 'Database-backed settings')
            ->assertJsonPath('settings.badge_color', '#123456');

        $this->assertDatabaseHas('system_settings', [
            'id' => 1,
            'system_name' => 'Database-backed settings',
            'badge_color' => '#123456',
        ]);

        Sanctum::actingAs($employee);
        $this->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('settings.system_name', 'Database-backed settings');

        $this->putJson('/api/settings', ['system_name' => 'Not allowed'])
            ->assertForbidden();
    }

    public function test_employee_role_can_view_drivers_and_create_badges_but_cannot_manage_other_resources(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $employee->syncRoles('employee');
        $driver = $this->createDriver($employee);

        Sanctum::actingAs($employee);

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.role', 'employee')
            ->assertJsonPath('user.permissions.0', 'badges.create');

        $this->getJson('/api/drivers')->assertOk();
        $this->postJson('/api/drivers')->assertForbidden();
        $this->getJson('/api/badges')->assertForbidden();
        $this->postJson('/api/vehicles')->assertForbidden();

        $this->postJson('/api/badges', [
            'driver_id' => $driver->id,
            'issue_date' => now()->toDateString(),
            'expiry_date' => now()->addYear()->toDateString(),
        ])->assertCreated();
    }

    public function test_viewer_can_read_but_cannot_write(): void
    {
        $viewer = User::factory()->create(['role' => 'viewer']);
        $viewer->syncRoles('viewer');

        Sanctum::actingAs($viewer);

        $this->getJson('/api/drivers')->assertOk();
        $this->getJson('/api/badges')->assertOk();
        $this->getJson('/api/vehicles')->assertOk();
        $this->postJson('/api/badges')->assertForbidden();
        $this->postJson('/api/badges/1/print')->assertForbidden();
        $this->deleteJson('/api/drivers/1')->assertForbidden();
    }

    public function test_employee_cannot_assign_roles_or_permissions(): void
    {
        $employee = User::factory()->create(['role' => 'employee']);
        $target = User::factory()->create(['role' => 'employee']);
        $employee->syncRoles('employee');
        $target->syncRoles('employee');

        Sanctum::actingAs($employee);

        $this->putJson('/api/employees/'.$target->id, [
            'role' => 'admin',
        ])->assertForbidden();
        $this->putJson('/api/employees/'.$target->id, [
            'permissions' => ['drivers.delete'],
        ])->assertForbidden();
    }

    public function test_admin_can_assign_a_fine_grained_permission_to_a_supervisor(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $supervisor = User::factory()->create(['role' => 'supervisor']);
        $admin->syncRoles('admin');
        $supervisor->syncRoles('supervisor');

        Sanctum::actingAs($admin);

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.permissions.1', 'badges.delete')
            ->assertJsonPath('user.permissions.6', 'drivers.delete')
            ->assertJsonPath('user.permissions.9', 'users.manage');

        $this->putJson('/api/employees/'.$supervisor->id, [
            'permissions' => ['drivers.view', 'badges.print'],
        ])
            ->assertOk()
            ->assertJsonPath('employee.permissions', ['badges.print', 'drivers.view']);

        Sanctum::actingAs($supervisor);
        $this->getJson('/api/drivers')->assertOk();
        $this->getJson('/api/badges')->assertForbidden();
        $this->postJson('/api/badges')->assertForbidden();
    }

    public function test_viewer_role_rejects_write_permissions_even_when_assigned_by_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $viewer = User::factory()->create(['role' => 'viewer']);
        $admin->syncRoles('admin');
        $viewer->syncRoles('viewer');

        Sanctum::actingAs($admin);

        $this->putJson('/api/employees/'.$viewer->id, [
            'permissions' => ['drivers.delete'],
        ])->assertUnprocessable();

        $viewer->syncPermissions(['drivers.delete']);
        $this->putJson('/api/employees/'.$viewer->id, [
            'role' => 'viewer',
        ])->assertUnprocessable();
    }

    public function test_employee_can_be_created_without_an_email_address(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $admin->syncRoles('admin');

        Sanctum::actingAs($admin);

        $this->postJson('/api/employees', [
            'name' => 'Employee without email',
            'username' => 'employee-no-email',
            'password' => 'password123',
            'role' => 'viewer',
            'permissions' => ['drivers.view'],
        ])
            ->assertCreated()
            ->assertJsonPath('employee.role', 'viewer')
            ->assertJsonPath('employee.permissions', ['drivers.view'])
            ->assertJsonMissingPath('employee.email');

        $this->assertDatabaseHas('users', [
            'username' => 'employee-no-email',
            'email' => null,
        ]);
    }

    private function createDriver(User $creator): Driver
    {
        return Driver::create([
            'public_id' => (string) Str::uuid(),
            'full_name' => fake()->name(),
            'person_type' => 'employee',
            'phone' => fake()->phoneNumber(),
            'created_by' => $creator->id,
        ]);
    }
}
