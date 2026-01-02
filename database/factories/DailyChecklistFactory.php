<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Checklist\Models\ChecklistTemplate;
use App\Modules\Checklist\Models\DailyChecklist;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Checklist\Models\DailyChecklist>
 */
class DailyChecklistFactory extends Factory
{
    protected $model = DailyChecklist::class;

    public function definition(): array
    {
        return [
            'template_id' => ChecklistTemplate::factory(),
            'date' => now()->toDateString(),
            'created_by' => User::factory(),
            'completed_at' => null,
        ];
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => now(),
        ]);
    }

    public function forDate(string $date): static
    {
        return $this->state(fn (array $attributes) => [
            'date' => $date,
        ]);
    }
}
