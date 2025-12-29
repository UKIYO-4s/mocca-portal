<?php

namespace App\Modules\Announcement;

use App\Core\BaseModule;
use Illuminate\Support\Facades\Route;

class AnnouncementModule extends BaseModule
{
    protected string $name = 'announcement';
    protected string $version = '1.0.0';

    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web', 'auth'])
            ->prefix('announcements')
            ->name('announcements.')
            ->group(function () {
                // 閲覧（全員）
                Route::get('/', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'index'])->name('index');

                // 投稿・編集（Manager以上）- /create を先に定義
                Route::middleware('role:admin,manager')->group(function () {
                    Route::get('/create', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'create'])->name('create');
                    Route::post('/', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'store'])->name('store');
                    Route::get('/{announcement}/edit', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'edit'])->name('edit');
                    Route::put('/{announcement}', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'update'])->name('update');
                    Route::delete('/{announcement}', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'destroy'])->name('destroy');
                });

                // 詳細・既読（全員）- {announcement} を後に定義
                Route::get('/{announcement}', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'show'])->name('show');
                Route::post('/{announcement}/read', [\App\Modules\Announcement\Controllers\AnnouncementController::class, 'markAsRead'])->name('read');
            });
    }

    public function getNavigation(): array
    {
        return [
            [
                'label' => 'お知らせ',
                'route' => 'announcements.index',
                'icon' => 'bell',
                'roles' => ['admin', 'manager', 'staff'],
            ],
        ];
    }

    public function getPermissions(): array
    {
        return [
            'announcement.view',
            'announcement.create',
            'announcement.edit',
            'announcement.delete',
        ];
    }
}
