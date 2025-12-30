<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Location::updateOrCreate(
            ['slug' => 'mocca'],
            ['name' => 'もっか', 'is_active' => true]
        );

        Location::updateOrCreate(
            ['slug' => 'banshirou'],
            ['name' => 'ばんしろう', 'is_active' => true]
        );

        Location::updateOrCreate(
            ['slug' => 'ajito'],
            ['name' => 'アジト', 'is_active' => true]
        );
    }
}
