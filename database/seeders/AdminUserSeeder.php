<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@mocca-portal.local'],
            [
                'name' => '管理者',
                'password' => Hash::make('password'),
                'role' => 'admin',
            ]
        );

        User::updateOrCreate(
            ['email' => 'manager@mocca-portal.local'],
            [
                'name' => 'マネージャー',
                'password' => Hash::make('password'),
                'role' => 'manager',
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@mocca-portal.local'],
            [
                'name' => 'スタッフ',
                'password' => Hash::make('password'),
                'role' => 'staff',
            ]
        );
    }
}
