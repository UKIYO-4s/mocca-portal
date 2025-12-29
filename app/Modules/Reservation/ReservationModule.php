<?php

namespace App\Modules\Reservation;

use App\Core\BaseModule;
use Illuminate\Support\Facades\Route;

class ReservationModule extends BaseModule
{
    protected string $name = 'reservation';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('reservations')
            ->name('reservations.')
            ->group(function () {
                // ばんしろう予約
                Route::prefix('banshirou')
                    ->name('banshirou.')
                    ->group(function () {
                        Route::get('/', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'index'])->name('index');
                        Route::get('/create', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'create'])->name('create');
                        Route::post('/', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'store'])->name('store');
                        Route::get('/{reservation}', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'show'])->name('show');
                        Route::get('/{reservation}/edit', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'edit'])->name('edit');
                        Route::put('/{reservation}', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'update'])->name('update');
                        Route::delete('/{reservation}', [\App\Modules\Reservation\Controllers\BanshirouReservationController::class, 'destroy'])
                            ->middleware('role:admin,manager')
                            ->name('destroy');
                    });

                // もっか予約
                Route::prefix('mocca')
                    ->name('mocca.')
                    ->group(function () {
                        Route::get('/', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'index'])->name('index');
                        Route::get('/create', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'create'])->name('create');
                        Route::post('/', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'store'])->name('store');
                        Route::get('/{reservation}', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'show'])->name('show');
                        Route::get('/{reservation}/edit', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'edit'])->name('edit');
                        Route::put('/{reservation}', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'update'])->name('update');
                        Route::delete('/{reservation}', [\App\Modules\Reservation\Controllers\MoccaReservationController::class, 'destroy'])
                            ->middleware('role:admin,manager')
                            ->name('destroy');
                    });

                // 担当割り当て（Manager以上）
                Route::middleware('role:admin,manager')
                    ->prefix('assignments')
                    ->name('assignments.')
                    ->group(function () {
                        Route::post('/{reservation}', [\App\Modules\Reservation\Controllers\AssignmentController::class, 'store'])->name('store');
                        Route::delete('/{assignment}', [\App\Modules\Reservation\Controllers\AssignmentController::class, 'destroy'])->name('destroy');
                    });
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => '予約管理',
                'route' => 'reservations.banshirou.index',
                'icon' => 'calendar',
                'roles' => ['admin', 'manager', 'staff'],
                'children' => [
                    ['label' => 'ばんしろう', 'route' => 'reservations.banshirou.index'],
                    ['label' => 'もっか', 'route' => 'reservations.mocca.index'],
                ],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'reservation.view',
            'reservation.create',
            'reservation.edit',
            'reservation.delete',
            'reservation.assign',
        ];
    }

    public function getDashboardWidgets(): array
    {
        return [
            new Widgets\TodayReservationsWidget(),
            new Widgets\UpcomingCheckinsWidget(),
        ];
    }
}
