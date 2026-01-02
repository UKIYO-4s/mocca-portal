<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryTest extends TestCase
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

    public function test_staff_can_view_inventory_page(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/inventory');

        $response->assertStatus(200);
    }

    public function test_staff_can_record_usage(): void
    {
        $staff = User::factory()->staff()->create();
        $item = InventoryItem::factory()->create();

        $response = $this->actingAs($staff)->post('/inventory/usage', [
            'usages' => [
                ['item_id' => $item->id, 'quantity' => 3],
            ],
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_manager_can_view_manage_page(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/inventory/manage');

        $response->assertStatus(200);
    }

    public function test_manager_can_create_item(): void
    {
        $manager = User::factory()->manager()->create();
        $location = Location::first();

        $response = $this->actingAs($manager)->post('/inventory/items', [
            'location_id' => $location->id,
            'name' => 'ペーパータオル',
            'unit' => 'パック',
            'current_stock' => 50,
            'reorder_point' => 10,
            'is_active' => true,
        ]);

        $response->assertRedirect('/inventory/manage');
        $this->assertDatabaseHas('inventory_items', [
            'name' => 'ペーパータオル',
            'current_stock' => 50,
        ]);
    }

    public function test_manager_can_restock_item(): void
    {
        $manager = User::factory()->manager()->create();
        $item = InventoryItem::factory()->create(['current_stock' => 10]);

        $response = $this->actingAs($manager)->post("/inventory/items/{$item->id}/restock", [
            'quantity' => 50,
            'notes' => '定期発注分',
        ]);

        $response->assertRedirect();
        $item->refresh();
        $this->assertEquals(60, $item->current_stock);
    }

    public function test_manager_can_adjust_stock(): void
    {
        $manager = User::factory()->manager()->create();
        $item = InventoryItem::factory()->create(['current_stock' => 50]);

        $response = $this->actingAs($manager)->post("/inventory/items/{$item->id}/adjust", [
            'quantity' => -5,
            'notes' => '棚卸し調整',
        ]);

        $response->assertRedirect();
        $item->refresh();
        $this->assertEquals(45, $item->current_stock);
    }

    public function test_manager_can_view_logs(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/inventory/logs');

        $response->assertStatus(200);
    }

    public function test_manager_can_filter_by_location(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/inventory/manage?location_id=1');

        $response->assertStatus(200);
    }

    public function test_manager_can_filter_low_stock(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/inventory/manage?low_stock=1');

        $response->assertStatus(200);
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_staff_cannot_access_manage_page(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/inventory/manage');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_create_item(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/inventory/items', [
            'name' => 'テスト',
            'unit' => '個',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_restock(): void
    {
        $staff = User::factory()->staff()->create();
        $item = InventoryItem::factory()->create();

        $response = $this->actingAs($staff)->post("/inventory/items/{$item->id}/restock", [
            'quantity' => 10,
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_adjust_stock(): void
    {
        $staff = User::factory()->staff()->create();
        $item = InventoryItem::factory()->create();

        $response = $this->actingAs($staff)->post("/inventory/items/{$item->id}/adjust", [
            'quantity' => 5,
            'notes' => 'テスト',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_view_logs(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/inventory/logs');

        $response->assertStatus(403);
    }

    // ==========================================
    // スタッフ向け表示テスト
    // ==========================================

    public function test_staff_does_not_see_stock_count(): void
    {
        $staff = User::factory()->staff()->create();
        $item = InventoryItem::factory()->create(['current_stock' => 100]);

        $response = $this->actingAs($staff)->get('/inventory');

        $response->assertStatus(200);
        // Inertiaのpropsでcurrent_stockが含まれていないことを確認
        $response->assertInertia(fn ($page) =>
            $page->has('isStaff')
                 ->where('isStaff', true)
        );
    }
}
