<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Checklist\Models\ChecklistItem;
use App\Modules\Checklist\Models\DailyChecklist;
use App\Modules\Checklist\Models\DailyChecklistEntry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Checklist\Models\DailyChecklistEntry>
 */
class DailyChecklistEntryFactory extends Factory
{
    protected $model = DailyChecklistEntry::class;

    public function definition(): array
    {
        return [
            'daily_checklist_id' => DailyChecklist::factory(),
            'checklist_item_id' => ChecklistItem::factory(),
            'completed_at' => null,
            'completed_by' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => now(),
            'completed_by' => User::factory(),
        ]);
    }
}
