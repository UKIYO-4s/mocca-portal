<?php

namespace Database\Factories;

use App\Modules\Checklist\Models\ChecklistTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Checklist\Models\ChecklistTemplate>
 */
class ChecklistTemplateFactory extends Factory
{
    protected $model = ChecklistTemplate::class;

    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'type' => fake()->randomElement(['lunch_prep', 'dinner_prep', 'cleaning', 'other']),
            'location_id' => null,
            'is_active' => true,
            'sort_order' => fake()->numberBetween(1, 10),
        ];
    }

    public function lunchPrep(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'lunch_prep',
            'name' => 'ランチ仕込みチェックリスト',
        ]);
    }

    public function dinnerPrep(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'dinner_prep',
            'name' => 'ディナー仕込みチェックリスト',
        ]);
    }

    public function cleaning(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'cleaning',
            'name' => '掃除チェックリスト',
        ]);
    }
}
