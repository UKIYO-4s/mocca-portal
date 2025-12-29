<?php

namespace App\Modules\Checklist;

use App\Core\BaseModule;
use Illuminate\Support\Facades\Route;

class ChecklistModule extends BaseModule
{
    protected string $name = 'checklist';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        // Controllers not yet implemented - routes will be registered when ready
        // $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('checklists')
            ->name('checklists.')
            ->group(function () {
                // テンプレート管理（Manager以上）
                Route::middleware('role:admin,manager')
                    ->prefix('templates')
                    ->name('templates.')
                    ->group(function () {
                        Route::get('/', [\App\Modules\Checklist\Controllers\TemplateController::class, 'index'])->name('index');
                        Route::get('/create', [\App\Modules\Checklist\Controllers\TemplateController::class, 'create'])->name('create');
                        Route::post('/', [\App\Modules\Checklist\Controllers\TemplateController::class, 'store'])->name('store');
                        Route::get('/{template}/edit', [\App\Modules\Checklist\Controllers\TemplateController::class, 'edit'])->name('edit');
                        Route::put('/{template}', [\App\Modules\Checklist\Controllers\TemplateController::class, 'update'])->name('update');
                        Route::delete('/{template}', [\App\Modules\Checklist\Controllers\TemplateController::class, 'destroy'])->name('destroy');
                    });

                // 日次チェックリスト
                Route::get('/', [\App\Modules\Checklist\Controllers\DailyChecklistController::class, 'index'])->name('index');
                Route::get('/{checklist}', [\App\Modules\Checklist\Controllers\DailyChecklistController::class, 'show'])->name('show');
                Route::post('/{checklist}/entries/{item}', [\App\Modules\Checklist\Controllers\DailyChecklistController::class, 'toggleEntry'])->name('toggle');
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => 'チェックリスト',
                'route' => 'checklists.index',
                'icon' => 'check-square',
                'roles' => ['admin', 'manager', 'staff'],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'checklist.view',
            'checklist.check',
            'checklist.template.manage',
        ];
    }
}
