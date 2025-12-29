<?php

namespace App\Modules\Checklist;

use App\Core\BaseModule;
use App\Modules\Checklist\Controllers\DailyChecklistController;
use App\Modules\Checklist\Controllers\TemplateController;
use Illuminate\Support\Facades\Route;

class ChecklistModule extends BaseModule
{
    protected string $name = 'checklist';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('checklists')
            ->name('checklists.')
            ->group(function () {
                // テンプレート管理（Admin/Manager only）
                Route::middleware('role:admin,manager')
                    ->prefix('templates')
                    ->name('templates.')
                    ->group(function () {
                        Route::get('/', [TemplateController::class, 'index'])->name('index');
                        Route::get('/create', [TemplateController::class, 'create'])->name('create');
                        Route::post('/', [TemplateController::class, 'store'])->name('store');
                        Route::get('/{template}/edit', [TemplateController::class, 'edit'])->name('edit');
                        Route::put('/{template}', [TemplateController::class, 'update'])->name('update');
                        Route::delete('/{template}', [TemplateController::class, 'destroy'])->name('destroy');
                    });

                // 日次チェックリスト
                Route::get('/', [DailyChecklistController::class, 'index'])->name('index');
                Route::post('/generate', [DailyChecklistController::class, 'generate'])->name('generate');
                Route::get('/{dailyChecklist}', [DailyChecklistController::class, 'show'])->name('show');
                Route::post('/{dailyChecklist}/entries/{item}/toggle', [DailyChecklistController::class, 'toggleEntry'])->name('toggle');
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
