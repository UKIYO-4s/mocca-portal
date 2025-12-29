<?php

namespace App\Modules\Inventory;

use App\Core\BaseModule;
use App\Modules\Inventory\Controllers\InventoryController;
use Illuminate\Support\Facades\Route;

class InventoryModule extends BaseModule
{
    protected string $name = 'inventory';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('inventory')
            ->name('inventory.')
            ->group(function () {
                // 使用入力（全員）
                Route::get('/', [InventoryController::class, 'index'])->name('index');
                Route::post('/usage', [InventoryController::class, 'recordUsage'])->name('usage');

                // 在庫管理（Manager以上）
                Route::middleware('role:admin,manager')->group(function () {
                    Route::get('/manage', [InventoryController::class, 'manage'])->name('manage');
                    Route::get('/items/create', [InventoryController::class, 'create'])->name('create');
                    Route::post('/items', [InventoryController::class, 'store'])->name('store');
                    Route::get('/items/{item}/edit', [InventoryController::class, 'edit'])->name('edit');
                    Route::put('/items/{item}', [InventoryController::class, 'update'])->name('update');
                    Route::post('/items/{item}/restock', [InventoryController::class, 'restock'])->name('restock');
                    Route::post('/items/{item}/adjust', [InventoryController::class, 'adjust'])->name('adjust');
                    Route::delete('/items/{item}', [InventoryController::class, 'destroy'])->name('destroy');
                    Route::get('/logs', [InventoryController::class, 'logs'])->name('logs');
                });
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => '備品管理',
                'route' => 'inventory.index',
                'icon' => 'package',
                'roles' => ['admin', 'manager', 'staff'],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'inventory.view',
            'inventory.usage',
            'inventory.manage',
            'inventory.restock',
        ];
    }
}
