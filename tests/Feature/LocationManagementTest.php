<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\User;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocationManagementTest extends TestCase
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

    public function test_admin_can_view_locations_index(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/locations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Locations/Index')
                 ->has('locations')
        );
    }

    public function test_admin_can_view_create_form(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/locations/create');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Locations/Create')
        );
    }

    public function test_admin_can_create_location(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => '新店舗',
            'slug' => 'new-shop',
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/locations');
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('locations', [
            'name' => '新店舗',
            'slug' => 'new-shop',
            'is_active' => true,
        ]);
    }

    public function test_admin_can_create_inactive_location(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => '休業店舗',
            'slug' => 'closed-shop',
            'is_active' => false,
        ]);

        $response->assertRedirect('/admin/locations');
        $this->assertDatabaseHas('locations', [
            'name' => '休業店舗',
            'slug' => 'closed-shop',
            'is_active' => false,
        ]);
    }

    public function test_admin_can_view_edit_form(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::first();

        $response = $this->actingAs($admin)->get("/admin/locations/{$location->slug}/edit");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Locations/Edit')
                 ->has('location')
        );
    }

    public function test_admin_can_update_location(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::first();

        $response = $this->actingAs($admin)->put("/admin/locations/{$location->slug}", [
            'name' => '更新された店舗名',
            'slug' => 'updated-shop',
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/locations');
        $response->assertSessionHas('success');
        $location->refresh();
        $this->assertEquals('更新された店舗名', $location->name);
        $this->assertEquals('updated-shop', $location->slug);
    }

    public function test_admin_can_deactivate_location(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::where('is_active', true)->first();

        $response = $this->actingAs($admin)->put("/admin/locations/{$location->slug}", [
            'name' => $location->name,
            'slug' => $location->slug,
            'is_active' => false,
        ]);

        $response->assertRedirect('/admin/locations');
        $location->refresh();
        $this->assertFalse($location->is_active);
    }

    public function test_admin_can_delete_location_without_related_data(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::create([
            'name' => '削除用店舗',
            'slug' => 'to-delete',
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/locations/{$location->slug}");

        $response->assertRedirect('/admin/locations');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('locations', ['id' => $location->id]);
    }

    public function test_admin_cannot_delete_location_with_inventory_items(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::create([
            'name' => '備品あり店舗',
            'slug' => 'has-inventory',
            'is_active' => true,
        ]);

        // Create inventory item for this location
        InventoryItem::factory()->create(['location_id' => $location->id]);

        $response = $this->actingAs($admin)->delete("/admin/locations/{$location->slug}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('locations', ['id' => $location->id]);
    }

    public function test_locations_index_shows_inventory_count(): void
    {
        $admin = User::factory()->admin()->create();
        // Locations are ordered by name. Get the first one alphabetically (アジト)
        $location = Location::orderBy('name')->first();

        // Create some inventory items
        InventoryItem::factory()->count(3)->create(['location_id' => $location->id]);

        $response = $this->actingAs($admin)->get('/admin/locations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('locations')
                 ->where('locations.0.inventory_items_count', 3)
        );
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_manager_cannot_access_locations_index(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/admin/locations');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_access_locations_index(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/admin/locations');

        $response->assertStatus(403);
    }

    public function test_manager_cannot_create_location(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/admin/locations', [
            'name' => 'テスト',
            'slug' => 'test',
            'is_active' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_create_location(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/admin/locations', [
            'name' => 'テスト',
            'slug' => 'test',
            'is_active' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_manager_cannot_update_location(): void
    {
        $manager = User::factory()->manager()->create();
        $location = Location::first();

        $response = $this->actingAs($manager)->put("/admin/locations/{$location->slug}", [
            'name' => '更新テスト',
            'slug' => 'update-test',
            'is_active' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_update_location(): void
    {
        $staff = User::factory()->staff()->create();
        $location = Location::first();

        $response = $this->actingAs($staff)->put("/admin/locations/{$location->slug}", [
            'name' => '更新テスト',
            'slug' => 'update-test',
            'is_active' => true,
        ]);

        $response->assertStatus(403);
    }

    public function test_manager_cannot_delete_location(): void
    {
        $manager = User::factory()->manager()->create();
        $location = Location::create([
            'name' => '削除テスト',
            'slug' => 'delete-test',
            'is_active' => true,
        ]);

        $response = $this->actingAs($manager)->delete("/admin/locations/{$location->slug}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('locations', ['id' => $location->id]);
    }

    public function test_staff_cannot_delete_location(): void
    {
        $staff = User::factory()->staff()->create();
        $location = Location::create([
            'name' => '削除テスト',
            'slug' => 'delete-test',
            'is_active' => true,
        ]);

        $response = $this->actingAs($staff)->delete("/admin/locations/{$location->slug}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('locations', ['id' => $location->id]);
    }

    public function test_manager_cannot_access_create_form(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/admin/locations/create');

        $response->assertStatus(403);
    }

    public function test_manager_cannot_access_edit_form(): void
    {
        $manager = User::factory()->manager()->create();
        $location = Location::first();

        $response = $this->actingAs($manager)->get("/admin/locations/{$location->slug}/edit");

        $response->assertStatus(403);
    }

    public function test_guest_cannot_access_locations(): void
    {
        $response = $this->get('/admin/locations');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_location_requires_name(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => '',
            'slug' => 'test',
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['name']);
    }

    public function test_location_requires_slug(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => 'テスト',
            'slug' => '',
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_location_slug_must_be_unique(): void
    {
        $admin = User::factory()->admin()->create();
        $existingLocation = Location::first();

        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => '新店舗',
            'slug' => $existingLocation->slug,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_location_slug_format_must_be_valid(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => 'テスト',
            'slug' => 'Invalid Slug!',
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    public function test_location_slug_only_allows_lowercase_alphanumeric_and_hyphen(): void
    {
        $admin = User::factory()->admin()->create();

        // Valid slug
        $response = $this->actingAs($admin)->post('/admin/locations', [
            'name' => 'テスト',
            'slug' => 'valid-slug-123',
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/locations');
        $this->assertDatabaseHas('locations', ['slug' => 'valid-slug-123']);
    }

    public function test_location_update_slug_unique_ignores_current(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::first();

        // Should be able to keep the same slug
        $response = $this->actingAs($admin)->put("/admin/locations/{$location->slug}", [
            'name' => '更新名',
            'slug' => $location->slug,
            'is_active' => true,
        ]);

        $response->assertRedirect('/admin/locations');
        $response->assertSessionDoesntHaveErrors(['slug']);
    }

    public function test_location_update_slug_must_be_unique_from_others(): void
    {
        $admin = User::factory()->admin()->create();
        $location1 = Location::first();
        $location2 = Location::skip(1)->first();

        // Should not be able to use another location's slug
        $response = $this->actingAs($admin)->put("/admin/locations/{$location1->slug}", [
            'name' => '更新名',
            'slug' => $location2->slug,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['slug']);
    }

    // ==========================================
    // モデルスコープテスト
    // ==========================================

    public function test_active_scope_filters_inactive_locations(): void
    {
        // Deactivate one location
        $location = Location::first();
        $location->update(['is_active' => false]);

        $activeLocations = Location::active()->get();
        $allLocations = Location::all();

        $this->assertCount(2, $activeLocations);
        $this->assertCount(3, $allLocations);
        $this->assertFalse($activeLocations->contains('id', $location->id));
    }

    // ==========================================
    // ルートキーネームテスト
    // ==========================================

    public function test_location_uses_slug_for_route_binding(): void
    {
        $admin = User::factory()->admin()->create();
        $location = Location::first();

        // Access by slug should work
        $response = $this->actingAs($admin)->get("/admin/locations/{$location->slug}/edit");
        $response->assertStatus(200);

        // Access by id should not work (404)
        $response = $this->actingAs($admin)->get("/admin/locations/{$location->id}/edit");
        $response->assertStatus(404);
    }
}
