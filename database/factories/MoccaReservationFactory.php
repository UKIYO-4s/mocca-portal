<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Reservation\Models\MoccaReservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Reservation\Models\MoccaReservation>
 */
class MoccaReservationFactory extends Factory
{
    protected $model = MoccaReservation::class;

    public function definition(): array
    {
        return [
            'reservation_type' => [fake()->randomElement(['breakfast', 'lunch', 'dinner'])],
            'reservation_date' => fake()->dateTimeBetween('+1 day', '+2 weeks'),
            'name' => fake()->name(),
            'guest_count' => fake()->numberBetween(1, 8),
            'arrival_time' => fake()->time('H:i'),
            'phone' => '08012345678',
            'advance_menu' => fake()->optional()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'banshirou_reservation_id' => null,
            'status' => 'confirmed',
            'created_by' => User::factory(),
        ];
    }

    public function breakfast(): static
    {
        return $this->state(fn (array $attributes) => [
            'reservation_type' => ['breakfast'],
        ]);
    }

    public function lunch(): static
    {
        return $this->state(fn (array $attributes) => [
            'reservation_type' => ['lunch'],
        ]);
    }

    public function dinner(): static
    {
        return $this->state(fn (array $attributes) => [
            'reservation_type' => ['dinner'],
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
