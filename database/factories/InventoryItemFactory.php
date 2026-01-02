<?php

namespace Database\Factories;

use App\Models\Location;
use App\Modules\Inventory\Models\InventoryItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Modules\Inventory\Models\InventoryItem>
 */
class InventoryItemFactory extends Factory
{
    protected $model = InventoryItem::class;

    public function definition(): array
    {
        return [
            'location_id' => Location::first()?->id ?? 1,
            'name' => fake()->word() . 'タオル',
            'unit' => fake()->randomElement(['枚', '個', '本', 'パック']),
            'current_stock' => fake()->numberBetween(10, 100),
            'reorder_point' => fake()->numberBetween(5, 20),
            'is_active' => true,
        ];
    }

    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_stock' => 3,
            'reorder_point' => 10,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
