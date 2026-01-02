<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\TimeCard\Models\TimeRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeCardTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // 正常系テスト
    // ==========================================

    public function test_staff_can_view_timecard_page(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/timecard');

        $response->assertStatus(200);
    }

    public function test_staff_can_clock_in(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/timecard/clock-in');

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('time_records', [
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);
    }

    public function test_staff_can_clock_out_after_clock_in(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->clockedIn()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/clock-out');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_staff_can_start_break(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->clockedIn()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/break-start');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_staff_can_end_break(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->onBreak()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/break-end');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_staff_can_view_history(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/timecard/history');

        $response->assertStatus(200);
    }

    public function test_manager_can_view_manage_page(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/timecard/manage');

        $response->assertStatus(200);
    }

    public function test_manager_can_view_reports(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/timecard/reports');

        $response->assertStatus(200);
    }

    public function test_manager_can_update_time_record(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();
        $record = TimeRecord::factory()->clockedIn()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($manager)->put("/timecard/records/{$record->id}", [
            'clock_in' => '09:00',
            'clock_out' => '18:00',
            'break_minutes' => 60,
            'notes' => '修正しました',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    // ==========================================
    // 境界条件テスト（異常系）
    // ==========================================

    public function test_cannot_clock_in_twice(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->clockedIn()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/clock-in');

        $response->assertSessionHasErrors(['clock_in']);
    }

    public function test_cannot_clock_out_without_clock_in(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/timecard/clock-out');

        $response->assertSessionHasErrors(['clock_out']);
    }

    public function test_cannot_start_break_without_clock_in(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/timecard/break-start');

        $response->assertSessionHasErrors(['break_start']);
    }

    public function test_cannot_start_break_while_on_break(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->onBreak()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/break-start');

        $response->assertSessionHasErrors(['break_start']);
    }

    public function test_cannot_end_break_without_start(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->clockedIn()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/break-end');

        $response->assertSessionHasErrors(['break_end']);
    }

    public function test_cannot_start_break_twice_per_day(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->breakCompleted()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/break-start');

        $response->assertSessionHasErrors(['break_start']);
    }

    public function test_cannot_clock_out_twice(): void
    {
        $staff = User::factory()->staff()->create();
        TimeRecord::factory()->clockedOut()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->post('/timecard/clock-out');

        $response->assertSessionHasErrors(['clock_out']);
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_staff_cannot_access_manage_page(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/timecard/manage');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_access_reports(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/timecard/reports');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_update_time_record(): void
    {
        $staff = User::factory()->staff()->create();
        $record = TimeRecord::factory()->clockedIn()->create([
            'user_id' => $staff->id,
            'date' => now()->toDateString(),
        ]);

        $response = $this->actingAs($staff)->put("/timecard/records/{$record->id}", [
            'clock_in' => '09:00',
        ]);

        $response->assertStatus(403);
    }
}
