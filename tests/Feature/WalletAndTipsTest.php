<?php

namespace Tests\Feature;

use App\Models\GuestPage;
use App\Models\StaffWallet;
use App\Models\TipTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class WalletAndTipsTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // ウォレット表示テスト (全ユーザー)
    // ==========================================

    public function test_staff_can_view_wallet_card(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/my-wallet');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Profile/WalletCard')
                 ->has('user')
                 ->has('wallet')
        );
    }

    public function test_staff_can_view_wallet_edit_page(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/profile/wallet');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Profile/Wallet')
        );
    }

    public function test_staff_can_register_wallet(): void
    {
        $staff = User::factory()->staff()->create();
        $walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8bEba';

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => $walletAddress,
            'connected_via_metamask' => false,
        ]);

        $response->assertRedirect('/profile/wallet');
        $response->assertSessionHas('success');
        $this->assertDatabaseHas('staff_wallets', [
            'user_id' => $staff->id,
            'wallet_address' => strtolower($walletAddress),
            'is_verified' => false,
        ]);
    }

    public function test_staff_can_register_wallet_via_metamask(): void
    {
        $staff = User::factory()->staff()->create();
        $walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8bEba';

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => $walletAddress,
            'connected_via_metamask' => true,
        ]);

        $response->assertRedirect('/profile/wallet');
        $this->assertDatabaseHas('staff_wallets', [
            'user_id' => $staff->id,
            'wallet_address' => strtolower($walletAddress),
            'is_verified' => true,
        ]);
    }

    public function test_staff_can_update_wallet(): void
    {
        $staff = User::factory()->staff()->create();
        StaffWallet::create([
            'user_id' => $staff->id,
            'wallet_address' => '0x1234567890123456789012345678901234567890',
            'is_verified' => true,
            'connected_at' => now(),
        ]);

        $newAddress = '0xaBcDeF1234567890123456789012345678901234';

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => $newAddress,
            'connected_via_metamask' => false,
        ]);

        $response->assertRedirect('/profile/wallet');
        $this->assertDatabaseHas('staff_wallets', [
            'user_id' => $staff->id,
            'wallet_address' => strtolower($newAddress),
        ]);
    }

    public function test_staff_can_delete_wallet(): void
    {
        $staff = User::factory()->staff()->create();
        StaffWallet::create([
            'user_id' => $staff->id,
            'wallet_address' => '0x1234567890123456789012345678901234567890',
            'is_verified' => true,
            'connected_at' => now(),
        ]);

        $response = $this->actingAs($staff)->delete('/profile/wallet');

        $response->assertRedirect('/profile/wallet');
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('staff_wallets', ['user_id' => $staff->id]);
    }

    public function test_wallet_address_must_be_unique(): void
    {
        $staff1 = User::factory()->staff()->create();
        $staff2 = User::factory()->staff()->create();
        $walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f8bEba';

        // Staff1 registers the wallet
        StaffWallet::create([
            'user_id' => $staff1->id,
            'wallet_address' => strtolower($walletAddress),
            'connected_at' => now(),
        ]);

        // Staff2 tries to use the same address
        $response = $this->actingAs($staff2)->post('/profile/wallet', [
            'wallet_address' => $walletAddress,
        ]);

        $response->assertSessionHasErrors(['wallet_address']);
    }

    // ==========================================
    // ウォレットバリデーションテスト
    // ==========================================

    public function test_wallet_address_is_required(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => '',
        ]);

        $response->assertSessionHasErrors(['wallet_address']);
    }

    public function test_wallet_address_must_be_42_characters(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => '0x123',
        ]);

        $response->assertSessionHasErrors(['wallet_address']);
    }

    public function test_wallet_address_must_match_ethereum_format(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',
        ]);

        $response->assertSessionHasErrors(['wallet_address']);
    }

    public function test_wallet_address_must_start_with_0x(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/profile/wallet', [
            'wallet_address' => '1x742d35Cc6634C0532925a3b844Bc9e7595f8bEba',
        ]);

        $response->assertSessionHasErrors(['wallet_address']);
    }

    // ==========================================
    // Admin: スタッフウォレット一覧
    // ==========================================

    public function test_admin_can_view_staff_wallets(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->staff()->create();
        StaffWallet::create([
            'user_id' => $staff->id,
            'wallet_address' => '0x1234567890123456789012345678901234567890',
            'is_verified' => true,
            'connected_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get('/admin/staff-wallets');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/StaffWallets')
                 ->has('staff')
        );
    }

    public function test_manager_cannot_view_staff_wallets(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/admin/staff-wallets');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_view_staff_wallets(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/admin/staff-wallets');

        $response->assertStatus(403);
    }

    // ==========================================
    // Admin: チップ統計
    // ==========================================

    public function test_admin_can_view_tip_statistics(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/tips');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/TipStatistics')
                 ->has('staffStats')
                 ->has('monthlyTrend')
                 ->has('roleStats')
                 ->has('totals')
                 ->has('filters')
        );
    }

    public function test_admin_can_view_staff_tip_detail(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($admin)->get("/admin/tips/staff/{$staff->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/StaffTipDetail')
                 ->has('staff')
                 ->has('transactions')
                 ->has('monthlyBreakdown')
        );
    }

    public function test_admin_can_export_tip_statistics(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/tips/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_admin_can_export_tip_statistics_with_filters(): void
    {
        $admin = User::factory()->admin()->create();
        $year = now()->year;
        $month = now()->month;

        $response = $this->actingAs($admin)->get("/admin/tips/export?year={$year}&month={$month}");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_admin_can_filter_tip_statistics_by_year(): void
    {
        $admin = User::factory()->admin()->create();
        $year = now()->year;

        $response = $this->actingAs($admin)->get("/admin/tips?year={$year}");

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('filters', fn ($filters) =>
                $filters->where('year', (string) $year)
                        ->etc()
            )
        );
    }

    // ==========================================
    // Admin: チップ統計 権限テスト
    // ==========================================

    public function test_manager_cannot_view_tip_statistics(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/admin/tips');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_view_tip_statistics(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/admin/tips');

        $response->assertStatus(403);
    }

    public function test_manager_cannot_view_staff_tip_detail(): void
    {
        $manager = User::factory()->manager()->create();
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($manager)->get("/admin/tips/staff/{$staff->id}");

        $response->assertStatus(403);
    }

    public function test_staff_cannot_view_staff_tip_detail(): void
    {
        $staff1 = User::factory()->staff()->create();
        $staff2 = User::factory()->staff()->create();

        $response = $this->actingAs($staff1)->get("/admin/tips/staff/{$staff2->id}");

        $response->assertStatus(403);
    }

    public function test_manager_cannot_export_tip_statistics(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/admin/tips/export');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_export_tip_statistics(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/admin/tips/export');

        $response->assertStatus(403);
    }

    public function test_guest_cannot_access_tip_statistics(): void
    {
        $response = $this->get('/admin/tips');

        $response->assertRedirect('/login');
    }

    public function test_guest_cannot_access_wallet_page(): void
    {
        $response = $this->get('/my-wallet');

        $response->assertRedirect('/login');
    }

    public function test_guest_cannot_access_wallet_edit(): void
    {
        $response = $this->get('/profile/wallet');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // StaffWalletモデルテスト
    // ==========================================

    public function test_short_address_attribute(): void
    {
        $staff = User::factory()->staff()->create();
        $wallet = StaffWallet::create([
            'user_id' => $staff->id,
            'wallet_address' => '0x742d35cc6634c0532925a3b844bc9e7595f8beba',
            'connected_at' => now(),
        ]);

        $this->assertEquals('0x742d...beba', $wallet->short_address);
    }

    public function test_is_valid_address_static_method(): void
    {
        // Valid addresses
        $this->assertTrue(StaffWallet::isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f8bEba'));
        $this->assertTrue(StaffWallet::isValidAddress('0x0000000000000000000000000000000000000000'));
        $this->assertTrue(StaffWallet::isValidAddress('0xffffffffffffffffffffffffffffffffffffffff'));

        // Invalid addresses
        $this->assertFalse(StaffWallet::isValidAddress('0x123')); // Too short
        $this->assertFalse(StaffWallet::isValidAddress('742d35Cc6634C0532925a3b844Bc9e7595f8bEba')); // Missing 0x
        $this->assertFalse(StaffWallet::isValidAddress('0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG')); // Invalid chars
    }

    public function test_verified_scope(): void
    {
        $staff1 = User::factory()->staff()->create();
        $staff2 = User::factory()->staff()->create();

        StaffWallet::create([
            'user_id' => $staff1->id,
            'wallet_address' => '0x1234567890123456789012345678901234567890',
            'is_verified' => true,
            'connected_at' => now(),
        ]);

        StaffWallet::create([
            'user_id' => $staff2->id,
            'wallet_address' => '0xabcdef1234567890123456789012345678901234',
            'is_verified' => false,
            'connected_at' => now(),
        ]);

        $verifiedWallets = StaffWallet::verified()->get();
        $this->assertCount(1, $verifiedWallets);
        $this->assertEquals($staff1->id, $verifiedWallets->first()->user_id);
    }

    // ==========================================
    // TipTransactionモデルテスト
    // ==========================================

    public function test_can_tip_rate_limiting(): void
    {
        $staff = User::factory()->staff()->create();
        $ipAddress = '192.168.1.1';

        // Create a guest page for tip transactions
        $guestPage = GuestPage::create([
            'guest_name' => 'テストゲスト',
            'check_in_date' => now(),
            'check_out_date' => now()->addDays(1),
            'is_active' => true,
        ]);

        // Initially should be able to tip
        $this->assertTrue(TipTransaction::canTip($ipAddress, $staff->id, 5, 24));
        $this->assertEquals(5, TipTransaction::remainingTips($ipAddress, $staff->id, 5, 24));

        // Create tip transactions
        for ($i = 0; $i < 5; $i++) {
            TipTransaction::create([
                'guest_page_id' => $guestPage->id,
                'staff_id' => $staff->id,
                'transaction_hash' => '0x' . Str::random(64),
                'tip_count' => 1,
                'ip_address' => $ipAddress,
                'tipped_at' => now(),
            ]);
        }

        // Should not be able to tip now
        $this->assertFalse(TipTransaction::canTip($ipAddress, $staff->id, 5, 24));
        $this->assertEquals(0, TipTransaction::remainingTips($ipAddress, $staff->id, 5, 24));
    }

    public function test_tip_transaction_scopes(): void
    {
        $staff = User::factory()->staff()->create();

        // Create a guest page for tip transactions
        $guestPage = GuestPage::create([
            'guest_name' => 'テストゲスト',
            'check_in_date' => now(),
            'check_out_date' => now()->addDays(1),
            'is_active' => true,
        ]);

        TipTransaction::create([
            'guest_page_id' => $guestPage->id,
            'staff_id' => $staff->id,
            'transaction_hash' => '0x' . Str::random(64),
            'tip_count' => 3,
            'tipped_at' => now(),
        ]);

        TipTransaction::create([
            'guest_page_id' => $guestPage->id,
            'staff_id' => $staff->id,
            'transaction_hash' => '0x' . Str::random(64),
            'tip_count' => 2,
            'tipped_at' => now()->subMonth(),
        ]);

        $thisMonthTips = TipTransaction::thisMonth()->forStaff($staff->id)->sum('tip_count');
        $allTips = TipTransaction::forStaff($staff->id)->sum('tip_count');

        $this->assertEquals(3, $thisMonthTips);
        $this->assertEquals(5, $allTips);
    }
}
