<?php

namespace Database\Factories;

use App\Models\User;
use App\Modules\Reservation\Models\BanshirouReservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Reservation\Models\BanshirouReservation>
 */
class BanshirouReservationFactory extends Factory
{
    protected $model = BanshirouReservation::class;

    public function definition(): array
    {
        $checkinDate = fake()->dateTimeBetween('+1 week', '+1 month');
        $checkoutDate = (clone $checkinDate)->modify('+2 days');

        return [
            'name' => fake()->name(),
            'name_kana' => 'テストゲスト',
            'phone' => '09012345678',
            'email' => fake()->safeEmail(),
            'address' => fake()->address(),
            'checkin_date' => $checkinDate,
            'checkout_date' => $checkoutDate,
            'guest_count_adults' => fake()->numberBetween(1, 4),
            'guest_count_children' => fake()->numberBetween(0, 2),
            'meal_option' => fake()->randomElement(['with_meals', 'seat_only', 'no_meals']),
            'pickup_required' => fake()->boolean(),
            'options' => [],
            'payment_method' => fake()->randomElement(['cash', 'credit', 'bank_transfer']),
            'notes' => fake()->optional()->sentence(),
            'status' => 'confirmed',
            'created_by' => User::factory(),
        ];
    }

    public function confirmed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'confirmed',
        ]);
    }

    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
        ]);
    }
}
