<?php

namespace App\Modules\Shift;

use App\Core\BaseModule;
use Illuminate\Support\Facades\Route;

class ShiftModule extends BaseModule
{
    protected string $name = 'shift';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        // Controllers not yet implemented - routes will be registered when ready
        // $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('shifts')
            ->name('shifts.')
            ->group(function () {
                // 閲覧（全員）
                Route::get('/', [\App\Modules\Shift\Controllers\ShiftController::class, 'index'])->name('index');
                Route::get('/calendar', [\App\Modules\Shift\Controllers\ShiftController::class, 'calendar'])->name('calendar');
                Route::get('/my', [\App\Modules\Shift\Controllers\ShiftController::class, 'myShifts'])->name('my');

                // 管理（Manager以上）
                Route::middleware('role:admin,manager')->group(function () {
                    Route::get('/manage', [\App\Modules\Shift\Controllers\ShiftController::class, 'manage'])->name('manage');
                    Route::post('/', [\App\Modules\Shift\Controllers\ShiftController::class, 'store'])->name('store');
                    Route::put('/{shift}', [\App\Modules\Shift\Controllers\ShiftController::class, 'update'])->name('update');
                    Route::delete('/{shift}', [\App\Modules\Shift\Controllers\ShiftController::class, 'destroy'])->name('destroy');
                });
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => 'シフト',
                'route' => 'shifts.index',
                'icon' => 'calendar-days',
                'roles' => ['admin', 'manager', 'staff'],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'shift.view',
            'shift.manage',
        ];
    }
}
