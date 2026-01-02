<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Reservation\Models\BanshirouReservation;
use App\Modules\Reservation\Models\MoccaReservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MoccaReservationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\LocationSeeder::class);
    }

    // ==========================================
    // 正常系テスト
    // ==========================================

    public function test_staff_can_view_reservation_list(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/reservations/mocca');

        $response->assertStatus(200);
    }

    public function test_staff_can_view_create_form(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/reservations/mocca/create');

        $response->assertStatus(200);
    }

    public function test_staff_can_create_reservation(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/mocca', [
            'reservation_type' => ['lunch'],
            'reservation_date' => now()->addWeek()->toDateString(),
            'name' => '山田太郎',
            'guest_count' => 4,
            'arrival_time' => '12:00',
            'phone' => '09012345678',
            'notes' => 'テスト予約',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mocca_reservations', [
            'name' => '山田太郎',
            'guest_count' => 4,
        ]);
    }

    public function test_staff_can_create_reservation_with_multiple_types(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/mocca', [
            'reservation_type' => ['lunch', 'dinner'],
            'reservation_date' => now()->addWeek()->toDateString(),
            'name' => '鈴木一郎',
            'guest_count' => 2,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mocca_reservations', [
            'name' => '鈴木一郎',
        ]);
    }

    public function test_staff_can_view_reservation_detail(): void
    {
        $staff = User::factory()->staff()->create();
        $reservation = MoccaReservation::factory()->create(['created_by' => $staff->id]);

        $response = $this->actingAs($staff)->get("/reservations/mocca/{$reservation->id}");

        $response->assertStatus(200);
    }

    public function test_staff_can_edit_reservation(): void
    {
        $staff = User::factory()->staff()->create();
        $reservation = MoccaReservation::factory()->create(['created_by' => $staff->id]);

        $response = $this->actingAs($staff)->put("/reservations/mocca/{$reservation->id}", [
            'reservation_type' => ['dinner'],
            'reservation_date' => $reservation->reservation_date->toDateString(),
            'name' => '更新された名前',
            'guest_count' => 6,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mocca_reservations', [
            'id' => $reservation->id,
            'name' => '更新された名前',
            'guest_count' => 6,
        ]);
    }

    public function test_manager_can_delete_reservation(): void
    {
        $manager = User::factory()->manager()->create();
        $reservation = MoccaReservation::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->delete("/reservations/mocca/{$reservation->id}");

        $response->assertRedirect('/reservations/mocca');
        $this->assertDatabaseMissing('mocca_reservations', ['id' => $reservation->id]);
    }

    public function test_manager_can_cancel_reservation(): void
    {
        $manager = User::factory()->manager()->create();
        $reservation = MoccaReservation::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->put("/reservations/mocca/{$reservation->id}", [
            'reservation_type' => $reservation->reservation_type,
            'reservation_date' => $reservation->reservation_date->toDateString(),
            'name' => $reservation->name,
            'guest_count' => $reservation->guest_count,
            'status' => 'cancelled',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mocca_reservations', [
            'id' => $reservation->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_can_link_to_banshirou_reservation(): void
    {
        $staff = User::factory()->staff()->create();
        $banshirou = BanshirouReservation::factory()->create([
            'created_by' => $staff->id,
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($staff)->post('/reservations/mocca', [
            'reservation_type' => ['breakfast'],
            'reservation_date' => $banshirou->checkin_date->addDay()->toDateString(),
            'name' => $banshirou->name,
            'guest_count' => $banshirou->guest_count_adults,
            'banshirou_reservation_id' => $banshirou->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('mocca_reservations', [
            'banshirou_reservation_id' => $banshirou->id,
        ]);
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_staff_cannot_delete_reservation(): void
    {
        $staff = User::factory()->staff()->create();
        $reservation = MoccaReservation::factory()->create();

        $response = $this->actingAs($staff)->delete("/reservations/mocca/{$reservation->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('mocca_reservations', ['id' => $reservation->id]);
    }

    public function test_guest_cannot_access_reservations(): void
    {
        $response = $this->get('/reservations/mocca');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // フィルタリングテスト
    // ==========================================

    public function test_can_filter_by_date(): void
    {
        $staff = User::factory()->staff()->create();
        $targetDate = now()->addDays(3)->toDateString();
        MoccaReservation::factory()->create([
            'reservation_date' => $targetDate,
        ]);

        $response = $this->actingAs($staff)->get("/reservations/mocca?date={$targetDate}");

        $response->assertStatus(200);
    }

    public function test_can_filter_by_date_range(): void
    {
        $staff = User::factory()->staff()->create();
        $from = now()->addDays(1)->toDateString();
        $to = now()->addDays(7)->toDateString();

        $response = $this->actingAs($staff)->get("/reservations/mocca?from={$from}&to={$to}");

        $response->assertStatus(200);
    }

    public function test_can_filter_by_type(): void
    {
        $staff = User::factory()->staff()->create();
        MoccaReservation::factory()->lunch()->create();

        $response = $this->actingAs($staff)->get('/reservations/mocca?type=lunch');

        $response->assertStatus(200);
    }

    public function test_can_filter_by_status(): void
    {
        $staff = User::factory()->staff()->create();
        MoccaReservation::factory()->cancelled()->create();

        $response = $this->actingAs($staff)->get('/reservations/mocca?status=cancelled');

        $response->assertStatus(200);
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_reservation_requires_mandatory_fields(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/mocca', [
            'reservation_type' => [],
            'reservation_date' => '',
            'name' => '',
            'guest_count' => '',
        ]);

        $response->assertSessionHasErrors([
            'reservation_type',
            'reservation_date',
            'name',
            'guest_count',
        ]);
    }

    public function test_reservation_type_must_be_valid(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/mocca', [
            'reservation_type' => ['brunch'],
            'reservation_date' => now()->addWeek()->toDateString(),
            'name' => 'テスト',
            'guest_count' => 1,
        ]);

        $response->assertSessionHasErrors(['reservation_type.0']);
    }

    public function test_guest_count_must_be_positive(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/mocca', [
            'reservation_type' => ['lunch'],
            'reservation_date' => now()->addWeek()->toDateString(),
            'name' => 'テスト',
            'guest_count' => 0,
        ]);

        $response->assertSessionHasErrors(['guest_count']);
    }
}
