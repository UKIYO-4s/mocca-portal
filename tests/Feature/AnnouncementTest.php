<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Announcement\Models\Announcement;
use App\Modules\Announcement\Models\AnnouncementRead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    use RefreshDatabase;

    // ==========================================
    // 正常系テスト
    // ==========================================

    public function test_staff_can_view_announcements_list(): void
    {
        $staff = User::factory()->staff()->create();
        Announcement::factory()->published()->create();

        $response = $this->actingAs($staff)->get('/announcements');

        $response->assertStatus(200);
    }

    public function test_staff_can_view_published_announcement(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->published()->create();

        $response = $this->actingAs($staff)->get("/announcements/{$announcement->id}");

        $response->assertStatus(200);
    }

    public function test_staff_can_mark_announcement_as_read(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->published()->create();

        $response = $this->actingAs($staff)->post("/announcements/{$announcement->id}/read");

        $response->assertRedirect();
        $this->assertDatabaseHas('announcement_reads', [
            'announcement_id' => $announcement->id,
            'user_id' => $staff->id,
        ]);
    }

    public function test_manager_can_view_create_form(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/announcements/create');

        $response->assertStatus(200);
    }

    public function test_manager_can_create_announcement(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/announcements', [
            'title' => '重要なお知らせ',
            'content' => 'これは重要なお知らせの内容です。',
            'priority' => 'important',
            'published_at' => now()->toDateTimeString(),
        ]);

        $response->assertRedirect('/announcements');
        $this->assertDatabaseHas('announcements', [
            'title' => '重要なお知らせ',
            'priority' => 'important',
        ]);
    }

    public function test_manager_can_create_draft_announcement(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/announcements', [
            'title' => '下書きのお知らせ',
            'content' => '下書き内容です。',
            'priority' => 'normal',
            'published_at' => null,
        ]);

        $response->assertRedirect('/announcements');
        $this->assertDatabaseHas('announcements', [
            'title' => '下書きのお知らせ',
            'published_at' => null,
        ]);
    }

    public function test_manager_can_edit_announcement(): void
    {
        $manager = User::factory()->manager()->create();
        $announcement = Announcement::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->get("/announcements/{$announcement->id}/edit");

        $response->assertStatus(200);
    }

    public function test_manager_can_update_announcement(): void
    {
        $manager = User::factory()->manager()->create();
        $announcement = Announcement::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->put("/announcements/{$announcement->id}", [
            'title' => '更新されたタイトル',
            'content' => '更新された内容です。',
            'priority' => 'important',
            'published_at' => now()->toDateTimeString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('announcements', [
            'id' => $announcement->id,
            'title' => '更新されたタイトル',
            'priority' => 'important',
        ]);
    }

    public function test_manager_can_delete_announcement(): void
    {
        $manager = User::factory()->manager()->create();
        $announcement = Announcement::factory()->create(['created_by' => $manager->id]);

        $response = $this->actingAs($manager)->delete("/announcements/{$announcement->id}");

        $response->assertRedirect('/announcements');
        $this->assertDatabaseMissing('announcements', ['id' => $announcement->id]);
    }

    public function test_manager_can_view_draft_announcements(): void
    {
        $manager = User::factory()->manager()->create();
        Announcement::factory()->draft()->create();

        $response = $this->actingAs($manager)->get('/announcements');

        $response->assertStatus(200);
    }

    public function test_manager_can_view_draft_announcement_detail(): void
    {
        $manager = User::factory()->manager()->create();
        $announcement = Announcement::factory()->draft()->create();

        $response = $this->actingAs($manager)->get("/announcements/{$announcement->id}");

        $response->assertStatus(200);
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_staff_cannot_access_create_form(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/announcements/create');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_create_announcement(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/announcements', [
            'title' => 'テスト',
            'content' => 'テスト内容',
            'priority' => 'normal',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_edit_announcement(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->create();

        $response = $this->actingAs($staff)->get("/announcements/{$announcement->id}/edit");

        $response->assertStatus(403);
    }

    public function test_staff_cannot_update_announcement(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->create();

        $response = $this->actingAs($staff)->put("/announcements/{$announcement->id}", [
            'title' => '更新',
            'content' => '更新内容',
            'priority' => 'normal',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_delete_announcement(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->create();

        $response = $this->actingAs($staff)->delete("/announcements/{$announcement->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('announcements', ['id' => $announcement->id]);
    }

    public function test_staff_cannot_view_draft_announcement(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->draft()->create();

        $response = $this->actingAs($staff)->get("/announcements/{$announcement->id}");

        $response->assertStatus(403);
    }

    public function test_guest_cannot_access_announcements(): void
    {
        $response = $this->get('/announcements');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_announcement_requires_title_and_content(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/announcements', [
            'title' => '',
            'content' => '',
            'priority' => 'normal',
        ]);

        $response->assertSessionHasErrors(['title', 'content']);
    }

    public function test_priority_must_be_valid(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/announcements', [
            'title' => 'テスト',
            'content' => 'テスト内容',
            'priority' => 'invalid',
        ]);

        $response->assertSessionHasErrors(['priority']);
    }

    // ==========================================
    // 既読機能テスト
    // ==========================================

    public function test_marking_as_read_is_idempotent(): void
    {
        $staff = User::factory()->staff()->create();
        $announcement = Announcement::factory()->published()->create();

        // Mark as read twice
        $this->actingAs($staff)->post("/announcements/{$announcement->id}/read");
        $this->actingAs($staff)->post("/announcements/{$announcement->id}/read");

        $readCount = AnnouncementRead::where([
            'announcement_id' => $announcement->id,
            'user_id' => $staff->id,
        ])->count();

        $this->assertEquals(1, $readCount);
    }

    public function test_read_status_is_per_user(): void
    {
        $staff1 = User::factory()->staff()->create();
        $staff2 = User::factory()->staff()->create();
        $announcement = Announcement::factory()->published()->create();

        // Staff1 marks as read
        $this->actingAs($staff1)->post("/announcements/{$announcement->id}/read");

        // Check staff1 has read
        $this->assertDatabaseHas('announcement_reads', [
            'announcement_id' => $announcement->id,
            'user_id' => $staff1->id,
        ]);

        // Check staff2 has not read
        $this->assertDatabaseMissing('announcement_reads', [
            'announcement_id' => $announcement->id,
            'user_id' => $staff2->id,
        ]);
    }
}
