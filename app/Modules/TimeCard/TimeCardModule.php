<?php

namespace App\Modules\TimeCard;

use App\Core\BaseModule;
use Illuminate\Support\Facades\Route;

class TimeCardModule extends BaseModule
{
    protected string $name = 'timecard';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        // Controllers not yet implemented - routes will be registered when ready
        // $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('timecard')
            ->name('timecard.')
            ->group(function () {
                // 打刻（全員）
                Route::get('/', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'index'])->name('index');
                Route::post('/clock-in', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'clockIn'])->name('clock-in');
                Route::post('/clock-out', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'clockOut'])->name('clock-out');
                Route::get('/history', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'history'])->name('history');

                // 管理（Manager以上）
                Route::middleware('role:admin,manager')->group(function () {
                    Route::get('/manage', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'manage'])->name('manage');
                    Route::get('/reports', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'reports'])->name('reports');
                    Route::put('/records/{record}', [\App\Modules\TimeCard\Controllers\TimeCardController::class, 'update'])->name('update');
                });
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => 'タイムカード',
                'route' => 'timecard.index',
                'icon' => 'clock',
                'roles' => ['admin', 'manager', 'staff'],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'timecard.punch',
            'timecard.view_own',
            'timecard.manage',
            'timecard.reports',
        ];
    }
}
