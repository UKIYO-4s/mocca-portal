<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\TimeCard\Models\TimeRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\TimeCard\Models\TimeRecord>
 */
class TimeRecordFactory extends Factory
{
    protected $model = TimeRecord::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'date' => now()->toDateString(),
            'clock_in' => now()->setTime(9, 0),
            'clock_out' => null,
            'break_start' => null,
            'break_end' => null,
            'break_minutes' => 0,
            'notes' => null,
        ];
    }

    public function clockedIn(): static
    {
        return $this->state(fn (array $attributes) => [
            'clock_in' => now()->setTime(9, 0),
            'clock_out' => null,
        ]);
    }

    public function clockedOut(): static
    {
        return $this->state(fn (array $attributes) => [
            'clock_in' => now()->setTime(9, 0),
            'clock_out' => now()->setTime(18, 0),
        ]);
    }

    public function onBreak(): static
    {
        return $this->state(fn (array $attributes) => [
            'clock_in' => now()->setTime(9, 0),
            'break_start' => now()->setTime(12, 0),
            'break_end' => null,
        ]);
    }

    public function breakCompleted(): static
    {
        return $this->state(fn (array $attributes) => [
            'clock_in' => now()->setTime(9, 0),
            'break_start' => now()->setTime(12, 0),
            'break_end' => now()->setTime(13, 0),
            'break_minutes' => 60,
        ]);
    }
}
