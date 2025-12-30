<?php

namespace App\Modules\Location;

use App\Core\BaseModule;
use App\Modules\Location\Controllers\LocationController;
use Illuminate\Support\Facades\Route;

class LocationModule extends BaseModule
{
    protected string $name = 'location';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth', 'role:admin'])
            ->prefix('admin/locations')
            ->name('admin.locations.')
            ->group(function () {
                Route::get('/', [LocationController::class, 'index'])->name('index');
                Route::get('/create', [LocationController::class, 'create'])->name('create');
                Route::post('/', [LocationController::class, 'store'])->name('store');
                Route::get('/{location}/edit', [LocationController::class, 'edit'])->name('edit');
                Route::put('/{location}', [LocationController::class, 'update'])->name('update');
                Route::delete('/{location}', [LocationController::class, 'destroy'])->name('destroy');
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => '拠点管理',
                'route' => 'admin.locations.index',
                'icon' => 'building',
                'roles' => ['admin'],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'locations.view',
            'locations.create',
            'locations.edit',
            'locations.delete',
        ];
    }
}
