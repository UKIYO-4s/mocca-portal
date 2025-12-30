<?php

use App\Http\Controllers\Admin\TipStatisticsController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TipController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GuestPageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StaffWalletController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // User management (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::patch('/users/{user}/role', [UserController::class, 'updateRole'])->name('users.updateRole');
        Route::delete('/users/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});

// Google OAuth routes
Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
Route::get('/auth/google/callback', [GoogleController::class, 'callback'])->name('auth.google.callback');

// Guest page (no authentication required)
Route::get('/guest/{uuid}', [GuestPageController::class, 'show'])->name('guest.page');

// API endpoints (no authentication required, for guest page interactions)
Route::prefix('api')->group(function () {
    Route::post('/tip/record', [TipController::class, 'record'])->name('api.tip.record');
    Route::post('/tip/can-tip', [TipController::class, 'canTip'])->name('api.tip.can-tip');
    Route::post('/review/clicked', [ReviewController::class, 'recordClick'])->name('api.review.clicked');
    Route::post('/review/submitted', [ReviewController::class, 'markSubmitted'])->name('api.review.submitted');
});

// Staff wallet management (authenticated)
Route::middleware('auth')->group(function () {
    Route::get('/profile/wallet', [StaffWalletController::class, 'edit'])->name('profile.wallet');
    Route::post('/profile/wallet', [StaffWalletController::class, 'update'])->name('profile.wallet.update');
    Route::delete('/profile/wallet', [StaffWalletController::class, 'destroy'])->name('profile.wallet.destroy');
});

// Admin routes
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [App\Http\Controllers\Admin\AdminHubController::class, 'index'])->name('hub');
    Route::get('/tips', [TipStatisticsController::class, 'index'])->name('tips.index');
    Route::get('/tips/staff/{user}', [TipStatisticsController::class, 'show'])->name('tips.show');
    Route::get('/tips/export', [TipStatisticsController::class, 'export'])->name('tips.export');
    Route::get('/staff-wallets', [StaffWalletController::class, 'adminIndex'])->name('staff-wallets');
});

require __DIR__.'/auth.php';
