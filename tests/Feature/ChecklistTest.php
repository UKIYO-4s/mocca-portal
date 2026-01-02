<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Checklist\Models\ChecklistItem;
use App\Modules\Checklist\Models\ChecklistTemplate;
use App\Modules\Checklist\Models\DailyChecklist;
use App\Modules\Checklist\Models\DailyChecklistEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChecklistTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\LocationSeeder::class);
    }

    // ==========================================
    // テンプレート管理テスト（マネージャー権限）
    // ==========================================

    public function test_manager_can_view_templates_list(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/checklists/templates');

        $response->assertStatus(200);
    }

    public function test_manager_can_view_create_template_form(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->get('/checklists/templates/create');

        $response->assertStatus(200);
    }

    public function test_manager_can_create_template(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/checklists/templates', [
            'name' => 'ランチ仕込みチェックリスト',
            'type' => 'lunch_prep',
            'is_active' => true,
            'sort_order' => 1,
            'items' => [
                ['description' => '野菜の準備', 'sort_order' => 0],
                ['description' => 'スープの準備', 'sort_order' => 1],
            ],
        ]);

        $response->assertRedirect('/checklists/templates');
        $this->assertDatabaseHas('checklist_templates', [
            'name' => 'ランチ仕込みチェックリスト',
            'type' => 'lunch_prep',
        ]);
        $this->assertDatabaseHas('checklist_items', [
            'description' => '野菜の準備',
        ]);
    }

    public function test_manager_can_edit_template(): void
    {
        $manager = User::factory()->manager()->create();
        $template = ChecklistTemplate::factory()->lunchPrep()->create();

        $response = $this->actingAs($manager)->get("/checklists/templates/{$template->id}/edit");

        $response->assertStatus(200);
    }

    public function test_manager_can_update_template(): void
    {
        $manager = User::factory()->manager()->create();
        $template = ChecklistTemplate::factory()->lunchPrep()->create();

        $response = $this->actingAs($manager)->put("/checklists/templates/{$template->id}", [
            'name' => '更新されたテンプレート',
            'type' => 'dinner_prep',
            'is_active' => true,
            'sort_order' => 2,
        ]);

        $response->assertRedirect('/checklists/templates');
        $this->assertDatabaseHas('checklist_templates', [
            'id' => $template->id,
            'name' => '更新されたテンプレート',
            'type' => 'dinner_prep',
        ]);
    }

    public function test_manager_can_delete_template(): void
    {
        $manager = User::factory()->manager()->create();
        $template = ChecklistTemplate::factory()->create();

        $response = $this->actingAs($manager)->delete("/checklists/templates/{$template->id}");

        $response->assertRedirect('/checklists/templates');
        $this->assertDatabaseMissing('checklist_templates', ['id' => $template->id]);
    }

    // ==========================================
    // 日次チェックリストテスト（全スタッフ）
    // ==========================================

    public function test_staff_can_view_daily_checklists(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/checklists');

        $response->assertStatus(200);
    }

    public function test_staff_can_generate_daily_checklists(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create(['is_active' => true]);
        ChecklistItem::factory()->count(3)->create(['template_id' => $template->id]);

        $response = $this->actingAs($staff)->post('/checklists/generate', [
            'date' => now()->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('daily_checklists', [
            'template_id' => $template->id,
            'date' => now()->toDateString(),
        ]);
    }

    public function test_staff_can_view_daily_checklist_detail(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create();
        $dailyChecklist = DailyChecklist::factory()->create([
            'template_id' => $template->id,
            'created_by' => $staff->id,
        ]);

        $response = $this->actingAs($staff)->get("/checklists/{$dailyChecklist->id}");

        $response->assertStatus(200);
    }

    public function test_staff_can_toggle_checklist_item(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create();
        $item = ChecklistItem::factory()->create(['template_id' => $template->id]);
        $dailyChecklist = DailyChecklist::factory()->create([
            'template_id' => $template->id,
            'created_by' => $staff->id,
        ]);
        DailyChecklistEntry::factory()->create([
            'daily_checklist_id' => $dailyChecklist->id,
            'checklist_item_id' => $item->id,
        ]);

        $response = $this->actingAs($staff)->post("/checklists/{$dailyChecklist->id}/entries/{$item->id}/toggle");

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_daily_checklist_filters_by_date(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create();
        $today = now()->toDateString();
        DailyChecklist::factory()->create([
            'template_id' => $template->id,
            'date' => $today,
        ]);

        $response = $this->actingAs($staff)->get("/checklists?date={$today}");

        $response->assertStatus(200);
    }

    public function test_daily_checklist_filters_by_type(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->lunchPrep()->create();
        DailyChecklist::factory()->create([
            'template_id' => $template->id,
        ]);

        $response = $this->actingAs($staff)->get('/checklists?type=lunch_prep');

        $response->assertStatus(200);
    }

    // ==========================================
    // 権限テスト
    // ==========================================

    public function test_staff_cannot_access_templates_list(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->get('/checklists/templates');

        $response->assertStatus(403);
    }

    public function test_staff_cannot_create_template(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/checklists/templates', [
            'name' => 'テスト',
            'type' => 'lunch_prep',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_update_template(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create();

        $response = $this->actingAs($staff)->put("/checklists/templates/{$template->id}", [
            'name' => '更新テスト',
            'type' => 'lunch_prep',
        ]);

        $response->assertStatus(403);
    }

    public function test_staff_cannot_delete_template(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create();

        $response = $this->actingAs($staff)->delete("/checklists/templates/{$template->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('checklist_templates', ['id' => $template->id]);
    }

    public function test_guest_cannot_access_checklists(): void
    {
        $response = $this->get('/checklists');

        $response->assertRedirect('/login');
    }

    // ==========================================
    // バリデーションテスト
    // ==========================================

    public function test_template_requires_name_and_type(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/checklists/templates', [
            'name' => '',
            'type' => '',
        ]);

        $response->assertSessionHasErrors(['name', 'type']);
    }

    public function test_template_type_must_be_valid(): void
    {
        $manager = User::factory()->manager()->create();

        $response = $this->actingAs($manager)->post('/checklists/templates', [
            'name' => 'テスト',
            'type' => 'invalid_type',
        ]);

        $response->assertSessionHasErrors(['type']);
    }

    public function test_generate_requires_valid_date(): void
    {
        $staff = User::factory()->staff()->create();

        $response = $this->actingAs($staff)->post('/checklists/generate', [
            'date' => '',
        ]);

        $response->assertSessionHasErrors(['date']);
    }

    // ==========================================
    // 境界条件テスト
    // ==========================================

    public function test_cannot_generate_duplicate_daily_checklist(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create(['is_active' => true]);
        ChecklistItem::factory()->count(2)->create(['template_id' => $template->id]);
        $today = now()->toDateString();

        // First generation
        $this->actingAs($staff)->post('/checklists/generate', ['date' => $today]);

        // Count before second attempt
        $countBefore = DailyChecklist::where('template_id', $template->id)
            ->where('date', $today)
            ->count();

        // Second generation attempt (should not create duplicate)
        $this->actingAs($staff)->post('/checklists/generate', ['date' => $today]);

        $countAfter = DailyChecklist::where('template_id', $template->id)
            ->where('date', $today)
            ->count();

        $this->assertEquals($countBefore, $countAfter);
    }

    public function test_toggle_item_not_in_template_returns_404(): void
    {
        $staff = User::factory()->staff()->create();
        $template1 = ChecklistTemplate::factory()->create();
        $template2 = ChecklistTemplate::factory()->create();
        $itemFromOtherTemplate = ChecklistItem::factory()->create(['template_id' => $template2->id]);
        $dailyChecklist = DailyChecklist::factory()->create([
            'template_id' => $template1->id,
            'created_by' => $staff->id,
        ]);

        $response = $this->actingAs($staff)
            ->post("/checklists/{$dailyChecklist->id}/entries/{$itemFromOtherTemplate->id}/toggle");

        $response->assertStatus(404);
    }

    public function test_checklist_marks_completed_when_all_items_checked(): void
    {
        $staff = User::factory()->staff()->create();
        $template = ChecklistTemplate::factory()->create();
        $item = ChecklistItem::factory()->create(['template_id' => $template->id]);
        $dailyChecklist = DailyChecklist::factory()->create([
            'template_id' => $template->id,
            'created_by' => $staff->id,
        ]);
        DailyChecklistEntry::factory()->create([
            'daily_checklist_id' => $dailyChecklist->id,
            'checklist_item_id' => $item->id,
            'completed_at' => null,
        ]);

        $this->actingAs($staff)->post("/checklists/{$dailyChecklist->id}/entries/{$item->id}/toggle");

        $dailyChecklist->refresh();
        $this->assertNotNull($dailyChecklist->completed_at);
    }
}
