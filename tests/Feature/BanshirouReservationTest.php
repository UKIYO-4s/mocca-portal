<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Reservation\Models\BanshirouReservation;
use Database\Factories\BanshirouReservationFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BanshirouReservationTest extends TestCase
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

        $response = $this->actingAs($staff)->get('/reservations/banshirou');

        $response->assertStatus(200);
    }

    public function test_staff_can_view_create_form(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/reservations/banshirou/create');

        $response->assertStatus(200);
    }

    public function test_staff_can_create_reservation(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/banshirou', [
            'name' => '山田太郎',
            'name_kana' => 'ヤマダタロウ',
            'phone' => '09012345678',
            'email' => 'yamada@example.com',
            'address' => '東京都渋谷区1-2-3',
            'checkin_date' => now()->addWeek()->toDateString(),
            'checkout_date' => now()->addWeek()->addDays(2)->toDateString(),
            'guest_count_adults' => 2,
            'guest_count_children' => 1,
            'meal_option' => 'with_meals',
            'pickup_required' => true,
            'payment_method' => 'cash',
            'notes' => '窓側希望',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('banshirou_reservations', [
            'name' => '山田太郎',
            'name_kana' => 'ヤマダタロウ',
        ]);
    }

    public function test_staff_can_view_reservation_detail(): void
    {
        $staff = User::factory()->staff()->create();
        $reservation = BanshirouReservation::factory()->create(['created_by' => $staff->id]);

        $response = $this->actingAs($staff)->get("/reservations/banshirou/{$reservation->id}");

        $response->assertStatus(200);
    }

    public function test_staff_can_edit_reservation(): void
    {
        $staff = User::factory()->staff()->create();
        $reservation = BanshirouReservation::factory()->create(['created_by' => $staff->id]);

        $response = $this->actingAs($staff)->put("/reservations/banshirou/{$reservation->id}", [
            'name' => '更新された名前',
            'name_kana' => 'コウシンサレタナマエ',
            'phone' => '09012345678',
            'address' => '東京都渋谷区1-2-3',
            'checkin_date' => $reservation->checkin_date->toDateString(),
            'checkout_date' => $reservation->checkout_date->toDateString(),
            'guest_count_adults' => 3,
            'meal_option' => 'with_meals',
            'payment_method' => 'cash',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('banshirou_reservations', [
            'id' => $reservation->id,
            'name' => '更新された名前',
            'guest_count_adults' => 3,
        ]);
    }

    public function test_manager_can_delete_reservation(): void
    {
        $manager = User::factory()->manager()->create();
        $reservation = BanshirouReservation::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->delete("/reservations/banshirou/{$reservation->id}");

        $response->assertRedirect('/reservations/banshirou');
        $this->assertDatabaseMissing('banshirou_reservations', ['id' => $reservation->id]);
    }

    public function test_manager_can_cancel_reservation(): void
    {
        $manager = User::factory()->manager()->create();
        $reservation = BanshirouReservation::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->put("/reservations/banshirou/{$reservation->id}", [
            'name' => $reservation->name,
            'name_kana' => $reservation->name_kana,
            'phone' => $reservation->phone,
            'address' => $reservation->address,
            'checkin_date' => $reservation->checkin_date->toDateString(),
            'checkout_date' => $reservation->checkout_date->toDateString(),
            'guest_count_adults' => $reservation->guest_count_adults,
            'meal_option' => $reservation->meal_option,
            'payment_method' => $reservation->payment_method,
            'status' => 'cancelled',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('banshirou_reservations', [
            'id' => $reservation->id,
            'status' => 'cancelled',
        ]);
    }

    // ==========================================
    // 権限テスト（異常系）
    // ==========================================

    public function test_staff_cannot_delete_reservation(): void
    {
        $staff = User::factory()->staff()->create();
        $reservation = BanshirouReservation::factory()->create();

        $response = $this->actingAs($staff)->delete("/reservations/banshirou/{$reservation->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('banshirou_reservations', ['id' => $reservation->id]);
    }

    public function test_guest_cannot_access_reservations(): void
    {
        $response = $this->get('/reservations/banshirou');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_reservation_requires_mandatory_fields(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/banshirou', [
            'name' => '',
        ]);

        $response->assertSessionHasErrors([
            'name',
            'name_kana',
            'phone',
            'address',
            'checkin_date',
            'checkout_date',
            'guest_count_adults',
            'meal_option',
            'payment_method',
        ]);
    }

    public function test_checkout_date_must_be_after_checkin_date(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/reservations/banshirou', [
            'name' => '山田太郎',
            'name_kana' => 'ヤマダタロウ',
            'phone' => '09012345678',
            'address' => '東京都渋谷区1-2-3',
            'checkin_date' => now()->addWeek()->toDateString(),
            'checkout_date' => now()->addDays(3)->toDateString(), // チェックインより前
            'guest_count_adults' => 1,
            'meal_option' => 'no_meals',
            'payment_method' => 'cash',
        ]);

        $response->assertSessionHasErrors(['checkout_date']);
    }
}
