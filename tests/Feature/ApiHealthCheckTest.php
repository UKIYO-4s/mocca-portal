<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

/**
 * APIヘルスチェックテスト
 *
 * 各エンドポイントが500エラーを返さないことを確認
 * Note: 既存のMySQLデータベースを使用（RefreshDatabaseはSQLite非互換のため使用しない）
 */
class ApiHealthCheckTest extends TestCase
{
    private User $admin;
    private User $staff;

    protected function setUp(): void
    {
        parent::setUp();

        // Use existing test users or create them
        $this->admin = User::where('role', 'admin')->first()
            ?? User::factory()->create([
                'email' => 'test-admin@mocca-portal.local',
                'role' => 'admin',
            ]);

        $this->staff = User::where('role', 'staff')->first()
            ?? User::factory()->create([
                'email' => 'test-staff@mocca-portal.local',
                'role' => 'staff',
            ]);
    }

    // ========================================
    // Public Routes (No Auth Required)
    // ========================================

    public function test_welcome_page_loads(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_login_page_loads(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    // ========================================
    // Dashboard & Profile
    // ========================================

    public function test_dashboard_requires_auth(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    public function test_dashboard_loads_for_authenticated_user(): void
    {
        $response = $this->actingAs($this->staff)->get('/dashboard');
        $response->assertSuccessful();
    }

    public function test_profile_loads(): void
    {
        $response = $this->actingAs($this->staff)->get('/profile');
        $response->assertSuccessful();
    }

    // ========================================
    // Reservation Module (Correct paths: /reservations/mocca, /reservations/banshirou)
    // ========================================

    public function test_mocca_reservations_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/reservations/mocca');
        $response->assertSuccessful();
    }

    public function test_mocca_reservations_with_date_filter(): void
    {
        $response = $this->actingAs($this->staff)->get('/reservations/mocca?date=2026-01-01');
        $response->assertSuccessful();
    }

    public function test_mocca_reservations_with_range_filter(): void
    {
        $response = $this->actingAs($this->staff)
            ->get('/reservations/mocca?view=period&from=2026-01-01&to=2026-01-31');
        $response->assertSuccessful();
    }

    public function test_mocca_create_form(): void
    {
        $response = $this->actingAs($this->staff)->get('/reservations/mocca/create');
        $response->assertSuccessful();
    }

    public function test_banshirou_reservations_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/reservations/banshirou');
        $response->assertSuccessful();
    }

    public function test_banshirou_create_form(): void
    {
        $response = $this->actingAs($this->staff)->get('/reservations/banshirou/create');
        $response->assertSuccessful();
    }

    // ========================================
    // Availability Module
    // ========================================

    public function test_availability_page(): void
    {
        $response = $this->actingAs($this->staff)->get('/reservations/availability');
        $response->assertSuccessful();
    }

    public function test_availability_data_api(): void
    {
        $response = $this->actingAs($this->staff)
            ->get('/reservations/availability/data?date=2026-01-01');
        $response->assertSuccessful();
    }

    // ========================================
    // Checklist Module (Correct path: /checklists)
    // ========================================

    public function test_checklists_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/checklists');
        $response->assertSuccessful();
    }

    public function test_checklist_templates_requires_manager(): void
    {
        // Staff cannot access templates (403 expected)
        $response = $this->actingAs($this->staff)->get('/checklists/templates');
        $response->assertStatus(403);
    }

    public function test_checklist_templates_accessible_by_admin(): void
    {
        $response = $this->actingAs($this->admin)->get('/checklists/templates');
        $response->assertSuccessful();
    }

    // ========================================
    // TimeCard Module
    // ========================================

    public function test_timecard_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/timecard');
        $response->assertSuccessful();
    }

    // ========================================
    // Inventory Module
    // ========================================

    public function test_inventory_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/inventory');
        $response->assertSuccessful();
    }

    // ========================================
    // Shift Module (Correct path: /shifts)
    // ========================================

    public function test_shifts_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/shifts');
        $response->assertSuccessful();
    }

    public function test_shifts_calendar(): void
    {
        $response = $this->actingAs($this->staff)->get('/shifts/calendar');
        $response->assertSuccessful();
    }

    public function test_shifts_my(): void
    {
        $response = $this->actingAs($this->staff)->get('/shifts/my');
        $response->assertSuccessful();
    }

    // ========================================
    // Announcements Module
    // ========================================

    public function test_announcements_index(): void
    {
        $response = $this->actingAs($this->staff)->get('/announcements');
        $response->assertSuccessful();
    }

    // ========================================
    // Admin Routes
    // ========================================

    public function test_admin_invites_requires_admin(): void
    {
        $response = $this->actingAs($this->staff)->get('/admin/invites');
        $response->assertStatus(403);
    }

    public function test_admin_invites_accessible_by_admin(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/invites');
        $response->assertSuccessful();
    }

    public function test_admin_locations(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/locations');
        $response->assertSuccessful();
    }

    public function test_admin_staff_wallets(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/staff-wallets');
        $response->assertSuccessful();
    }

    public function test_admin_tips(): void
    {
        $response = $this->actingAs($this->admin)->get('/admin/tips');
        $response->assertSuccessful();
    }

    // ========================================
    // Guest Pages (Public UUID Routes)
    // ========================================

    public function test_guest_page_with_invalid_uuid_returns_404(): void
    {
        $response = $this->get('/guest/invalid-uuid');
        $response->assertStatus(404);
    }

    // ========================================
    // Wallet (Staff)
    // ========================================

    public function test_wallet_page_loads(): void
    {
        $response = $this->actingAs($this->staff)->get('/profile/wallet');
        $response->assertSuccessful();
    }

    // ========================================
    // API Endpoints
    // ========================================

    public function test_api_tip_can_tip_requires_post(): void
    {
        $response = $this->get('/api/tip/can-tip');
        $response->assertStatus(405); // Method not allowed for GET
    }

    public function test_api_review_requires_post(): void
    {
        $response = $this->get('/api/review/clicked');
        $response->assertStatus(405); // Method not allowed for GET
    }
}
