<?php

namespace Tests\Feature;

use App\Models\Invite;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InviteTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // 正常系テスト
    // ==========================================

    public function test_admin_can_view_invites_index(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->get('/admin/invites');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Invites/Index')
                 ->has('invites')
        );
    }

    public function test_admin_can_create_invite_with_7_day_expiry(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => '山田太郎',
            'email' => 'yamada@example.com',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $response->assertSessionHas('created_invite');

        $this->assertDatabaseHas('invites', [
            'invitee_name' => '山田太郎',
            'email' => 'yamada@example.com',
            'role' => 'staff',
            'created_by' => $admin->id,
        ]);

        // Verify expiry is approximately 7 days from now
        $invite = Invite::where('invitee_name', '山田太郎')->first();
        $this->assertNotNull($invite->expires_at);
        $this->assertTrue($invite->expires_at->isFuture());
        $this->assertTrue($invite->expires_at->lessThanOrEqualTo(now()->addDays(7)->addMinutes(1)));
    }

    public function test_admin_can_create_invite_with_30_day_expiry(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => '佐藤花子',
            'email' => null,
            'role' => 'manager',
            'expires_in' => '30',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invites', [
            'invitee_name' => '佐藤花子',
            'role' => 'manager',
        ]);

        $invite = Invite::where('invitee_name', '佐藤花子')->first();
        $this->assertNotNull($invite->expires_at);
        $this->assertTrue($invite->expires_at->isFuture());
        $this->assertTrue($invite->expires_at->lessThanOrEqualTo(now()->addDays(30)->addMinutes(1)));
    }

    public function test_admin_can_create_invite_without_expiry(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => '田中次郎',
            'email' => 'tanaka@example.com',
            'role' => 'admin',
            'expires_in' => 'never',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invites', [
            'invitee_name' => '田中次郎',
            'role' => 'admin',
            'expires_at' => null,
        ]);
    }

    public function test_admin_can_create_invite_without_email(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => '鈴木一郎',
            'email' => null,
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('invites', [
            'invitee_name' => '鈴木一郎',
            'email' => null,
            'role' => 'staff',
        ]);
    }

    public function test_admin_can_delete_unused_invite(): void
    {
        $admin = User::factory()->admin()->create();
        $invite = Invite::create([
            'invitee_name' => 'テストユーザー',
            'email' => 'test@example.com',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/invites/{$invite->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('invites', ['id' => $invite->id]);
    }

    public function test_admin_cannot_delete_used_invite(): void
    {
        $admin = User::factory()->admin()->create();
        $invite = Invite::create([
            'invitee_name' => '使用済みユーザー',
            'email' => 'used@example.com',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'used_at' => now(),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->delete("/admin/invites/{$invite->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('invites', ['id' => $invite->id]);
    }

    public function test_invite_list_shows_all_statuses(): void
    {
        $admin = User::factory()->admin()->create();

        // Create various invites with different statuses
        Invite::create([
            'invitee_name' => 'アクティブ',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'created_by' => $admin->id,
        ]);

        Invite::create([
            'invitee_name' => '期限切れ',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->subDays(1),
            'created_by' => $admin->id,
        ]);

        Invite::create([
            'invitee_name' => '使用済み',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'used_at' => now(),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get('/admin/invites');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->has('invites', 3)
        );
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_manager_cannot_access_invites_index(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/admin/invites');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_access_invites_index(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/admin/invites');

        $response->assertStatus(403);
    }

    public function test_manager_cannot_create_invite(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/admin/invites', [
            'invitee_name' => 'テスト',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_create_invite(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/admin/invites', [
            'invitee_name' => 'テスト',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $response->assertStatus(403);
    }

    public function test_manager_cannot_delete_invite(): void
    {
        $admin = User::factory()->admin()->create();
        $manager = User::factory()->manager()->create();
        $invite = Invite::create([
            'invitee_name' => 'テスト',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($manager)->delete("/admin/invites/{$invite->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('invites', ['id' => $invite->id]);
    }

    public function test_staff_cannot_delete_invite(): void
    {
        $admin = User::factory()->admin()->create();
        $staff = User::factory()->staff()->create();
        $invite = Invite::create([
            'invitee_name' => 'テスト',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($staff)->delete("/admin/invites/{$invite->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('invites', ['id' => $invite->id]);
    }

    public function test_guest_cannot_access_invites(): void
    {
        $response = $this->get('/admin/invites');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_invite_requires_invitee_name(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => '',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $response->assertSessionHasErrors(['invitee_name']);
    }

    public function test_invite_requires_valid_role(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => 'テスト',
            'role' => 'invalid_role',
            'expires_in' => '7',
        ]);

        $response->assertSessionHasErrors(['role']);
    }

    public function test_invite_requires_valid_expires_in(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => 'テスト',
            'role' => 'staff',
            'expires_in' => '999',
        ]);

        $response->assertSessionHasErrors(['expires_in']);
    }

    public function test_invite_email_must_be_valid(): void
    {
        $admin = User::factory()->admin()->create();

        $response = $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => 'テスト',
            'email' => 'invalid-email',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $response->assertSessionHasErrors(['email']);
    }

    // ==========================================
    // 招待トークンテスト
    // ==========================================

    public function test_invite_generates_unique_token(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => 'ユーザー1',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $this->actingAs($admin)->post('/admin/invites', [
            'invitee_name' => 'ユーザー2',
            'role' => 'staff',
            'expires_in' => '7',
        ]);

        $invites = Invite::all();
        $this->assertCount(2, $invites);
        $this->assertNotEquals($invites[0]->token, $invites[1]->token);
    }

    public function test_invite_has_correct_status_attributes(): void
    {
        $admin = User::factory()->admin()->create();

        // Active invite
        $activeInvite = Invite::create([
            'invitee_name' => 'アクティブ',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'created_by' => $admin->id,
        ]);
        $this->assertEquals('active', $activeInvite->status);
        $this->assertEquals('有効', $activeInvite->status_label);
        $this->assertTrue($activeInvite->isValid());

        // Expired invite
        $expiredInvite = Invite::create([
            'invitee_name' => '期限切れ',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->subDays(1),
            'created_by' => $admin->id,
        ]);
        $this->assertEquals('expired', $expiredInvite->status);
        $this->assertEquals('期限切れ', $expiredInvite->status_label);
        $this->assertFalse($expiredInvite->isValid());

        // Used invite
        $usedInvite = Invite::create([
            'invitee_name' => '使用済み',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'expires_at' => now()->addDays(7),
            'used_at' => now(),
            'created_by' => $admin->id,
        ]);
        $this->assertEquals('used', $usedInvite->status);
        $this->assertEquals('使用済み', $usedInvite->status_label);
        $this->assertFalse($usedInvite->isValid());
    }

    public function test_invite_role_label_attribute(): void
    {
        $admin = User::factory()->admin()->create();

        $staffInvite = Invite::create([
            'invitee_name' => 'スタッフ',
            'role' => 'staff',
            'token' => Invite::generateToken(),
            'created_by' => $admin->id,
        ]);
        $this->assertEquals('スタッフ', $staffInvite->role_label);

        $managerInvite = Invite::create([
            'invitee_name' => 'マネージャー',
            'role' => 'manager',
            'token' => Invite::generateToken(),
            'created_by' => $admin->id,
        ]);
        $this->assertEquals('マネージャー', $managerInvite->role_label);

        $adminInvite = Invite::create([
            'invitee_name' => '管理者',
            'role' => 'admin',
            'token' => Invite::generateToken(),
            'created_by' => $admin->id,
        ]);
        $this->assertEquals('管理者', $adminInvite->role_label);
    }
}
