<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\SystemSetting;
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
        $ownedDriver = $this->createDriver($employee);
        $otherDriver = $this->createDriver($otherEmployee);

        Sanctum::actingAs($employee);

        $this->getJson('/api/drivers')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $ownedDriver->id);

        $this->getJson('/api/drivers/' . $otherDriver->id)->assertNotFound();
        $this->putJson('/api/drivers/' . $otherDriver->id, [
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

    private function createDriver(User $creator): Driver
    {
        return Driver::create([
            'public_id' => (string) Str::uuid(),
            'full_name' => fake()->name(),
            'person_type' => 'employee',
            'phone' => fake()->phoneNumber(),
            'license_number' => (string) Str::uuid(),
            'license_expiry' => now()->addYear()->toDateString(),
            'created_by' => $creator->id,
        ]);
    }
}
