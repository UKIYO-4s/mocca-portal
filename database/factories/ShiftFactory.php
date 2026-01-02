<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Shift\Models\Shift;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Shift\Models\Shift>
 */
class ShiftFactory extends Factory
{
    protected $model = Shift::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => fake()->dateTimeBetween('now', '+1 month'),
            'status' => 'working',
            'created_by' => User::factory(),
        ];
    }

    public function working(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'working',
        ]);
    }

    public function off(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'off',
        ]);
    }

    public function forDate(string $date): static
    {
        return $this->state(fn (array $attributes) => [
            'date' => $date,
        ]);
    }
}
