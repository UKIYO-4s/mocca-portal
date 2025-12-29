<?php

namespace App\Modules\Inventory;

use App\Core\BaseModule;
use Illuminate\Support\Facades\Route;

class InventoryModule extends BaseModule
{
    protected string $name = 'inventory';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        // Controllers not yet implemented - routes will be registered when ready
        // $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('inventory')
            ->name('inventory.')
            ->group(function () {
                // 使用入力（全員）
                Route::get('/', [\App\Modules\Inventory\Controllers\InventoryController::class, 'index'])->name('index');
                Route::post('/usage', [\App\Modules\Inventory\Controllers\InventoryController::class, 'recordUsage'])->name('usage');

                // 在庫管理（Manager以上）
                Route::middleware('role:admin,manager')->group(function () {
                    Route::get('/manage', [\App\Modules\Inventory\Controllers\InventoryController::class, 'manage'])->name('manage');
                    Route::get('/items/create', [\App\Modules\Inventory\Controllers\InventoryController::class, 'create'])->name('create');
                    Route::post('/items', [\App\Modules\Inventory\Controllers\InventoryController::class, 'store'])->name('store');
                    Route::get('/items/{item}/edit', [\App\Modules\Inventory\Controllers\InventoryController::class, 'edit'])->name('edit');
                    Route::put('/items/{item}', [\App\Modules\Inventory\Controllers\InventoryController::class, 'update'])->name('update');
                    Route::post('/items/{item}/restock', [\App\Modules\Inventory\Controllers\InventoryController::class, 'restock'])->name('restock');
                    Route::post('/items/{item}/adjust', [\App\Modules\Inventory\Controllers\InventoryController::class, 'adjust'])->name('adjust');
                    Route::get('/logs', [\App\Modules\Inventory\Controllers\InventoryController::class, 'logs'])->name('logs');
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
