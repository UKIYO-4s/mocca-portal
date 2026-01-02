<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Shift\Models\Shift;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShiftTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // 正常系テスト
    // ==========================================

    public function test_staff_can_view_shift_index(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/shifts');

        $response->assertStatus(200);
    }

    public function test_staff_can_view_shift_calendar(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/shifts/calendar');

        $response->assertStatus(200);
    }

    public function test_staff_can_view_my_shifts(): void
    {
        $staff = User::factory()->staff()->create();
        Shift::factory()->working()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->get('/shifts/my');

        $response->assertStatus(200);
    }

    public function test_manager_can_view_manage_page(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/shifts/manage');

        $response->assertStatus(200);
    }

    public function test_manager_can_bulk_update_shifts(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();
        $yearMonth = now()->format('Y-m');

        $response = $this->actingAs($manager)->post('/shifts/bulk-update', [
            'user_id' => $staff->id,
            'year_month' => $yearMonth,
            'default_mode' => 'working',
            'exception_dates' => [
                now()->startOfMonth()->addDays(5)->toDateString(),
                now()->startOfMonth()->addDays(12)->toDateString(),
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verify shifts were created
        $this->assertDatabaseHas('shifts', [
            'user_id' => $staff->id,
            'date' => now()->startOfMonth()->toDateString(),
            'status' => 'working',
        ]);
    }

    public function test_manager_can_bulk_update_all_users(): void
    {
        $manager = User::factory()->manager()->create();
        $staff1 = User::factory()->staff()->create();
        $staff2 = User::factory()->staff()->create();
        $yearMonth = now()->format('Y-m');

        $response = $this->actingAs($manager)->post('/shifts/bulk-update-all', [
            'year_month' => $yearMonth,
            'default_mode' => 'off',
            'exception_dates' => [],
            'user_ids' => [$staff1->id, $staff2->id],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Verify shifts were created for both users
        $this->assertDatabaseHas('shifts', [
            'user_id' => $staff1->id,
            'status' => 'off',
        ]);
        $this->assertDatabaseHas('shifts', [
            'user_id' => $staff2->id,
            'status' => 'off',
        ]);
    }

    // ==========================================
    // フィルタリングテスト
    // ==========================================

    public function test_can_filter_by_week(): void
    {
        $staff = User::factory()->staff()->create();
        $week = now()->format('Y-\\WW');

        $response = $this->actingAs($staff)->get("/shifts?week={$week}");

        $response->assertStatus(200);
    }

    public function test_can_filter_by_month(): void
    {
        $staff = User::factory()->staff()->create();
        $month = now()->format('Y-m');

        $response = $this->actingAs($staff)->get("/shifts/calendar?month={$month}");

        $response->assertStatus(200);
    }

    public function test_my_shifts_filter_by_month(): void
    {
        $staff = User::factory()->staff()->create();
        $month = now()->format('Y-m');

        $response = $this->actingAs($staff)->get("/shifts/my?month={$month}");

        $response->assertStatus(200);
    }

    public function test_manage_filter_by_month(): void
    {
        $manager = User::factory()->manager()->create();
        $month = now()->format('Y-m');

        $response = $this->actingAs($manager)->get("/shifts/manage?month={$month}");

        $response->assertStatus(200);
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_staff_cannot_access_manage_page(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/shifts/manage');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_bulk_update_shifts(): void
    {
        $staff = User::factory()->staff()->create();
        $targetStaff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/shifts/bulk-update', [
            'user_id' => $targetStaff->id,
            'year_month' => now()->format('Y-m'),
            'default_mode' => 'working',
            'exception_dates' => [],
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_bulk_update_all_users(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/shifts/bulk-update-all', [
            'year_month' => now()->format('Y-m'),
            'default_mode' => 'working',
            'exception_dates' => [],
        ]);

        $response->assertStatus(403);
    }

    public function test_guest_cannot_access_shifts(): void
    {
        $response = $this->get('/shifts');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_bulk_update_requires_valid_user_id(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/shifts/bulk-update', [
            'user_id' => 99999,
            'year_month' => now()->format('Y-m'),
            'default_mode' => 'working',
            'exception_dates' => [],
        ]);

        $response->assertSessionHasErrors(['user_id']);
    }

    public function test_bulk_update_requires_valid_year_month(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($manager)->post('/shifts/bulk-update', [
            'user_id' => $staff->id,
            'year_month' => 'invalid',
            'default_mode' => 'working',
            'exception_dates' => [],
        ]);

        $response->assertSessionHasErrors(['year_month']);
    }

    public function test_bulk_update_requires_valid_default_mode(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($manager)->post('/shifts/bulk-update', [
            'user_id' => $staff->id,
            'year_month' => now()->format('Y-m'),
            'default_mode' => 'invalid',
            'exception_dates' => [],
        ]);

        $response->assertSessionHasErrors(['default_mode']);
    }

    // ==========================================
    // シフト更新ロジックテスト
    // ==========================================

    public function test_bulk_update_replaces_existing_shifts(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();
        $yearMonth = now()->format('Y-m');
        $monthStart = Carbon::now()->startOfMonth();

        // Create existing shifts
        Shift::factory()->working()->create([
            'user_id' => $staff->id,
            'date' => $monthStart->toDateString(),
            'created_by' => $manager->id,
        ]);

        // Bulk update with 'off' mode
        $this->actingAs($manager)->post('/shifts/bulk-update', [
            'user_id' => $staff->id,
            'year_month' => $yearMonth,
            'default_mode' => 'off',
            'exception_dates' => [],
        ]);

        // Verify old shifts were replaced with new status
        $this->assertDatabaseHas('shifts', [
            'user_id' => $staff->id,
            'date' => $monthStart->toDateString(),
            'status' => 'off',
        ]);
    }

    public function test_exception_dates_get_opposite_status(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();
        $yearMonth = now()->format('Y-m');
        $exceptionDate = now()->startOfMonth()->addDays(5)->toDateString();

        $this->actingAs($manager)->post('/shifts/bulk-update', [
            'user_id' => $staff->id,
            'year_month' => $yearMonth,
            'default_mode' => 'working',
            'exception_dates' => [$exceptionDate],
        ]);

        // Regular day should be 'working'
        $this->assertDatabaseHas('shifts', [
            'user_id' => $staff->id,
            'date' => now()->startOfMonth()->toDateString(),
            'status' => 'working',
        ]);

        // Exception day should be 'off'
        $this->assertDatabaseHas('shifts', [
            'user_id' => $staff->id,
            'date' => $exceptionDate,
            'status' => 'off',
        ]);
    }
}
