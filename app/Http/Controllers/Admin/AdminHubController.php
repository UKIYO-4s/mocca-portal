<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\TipTransaction;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminHubController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'users_count' => User::count(),
            'locations_count' => Location::where('is_active', true)->count(),
            'tips_this_month' => TipTransaction::whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->sum('amount'),
        ];

        return Inertia::render('Admin/Hub', [
            'stats' => $stats,
        ]);
    }
}
