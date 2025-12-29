<?php

namespace App\Providers;

use App\Modules\Reservation\Models\BanshirouReservation;
use App\Modules\Reservation\Models\MoccaReservation;
use App\Observers\BanshirouReservationObserver;
use App\Observers\MoccaReservationObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\WidgetManager::class);
        $this->app->singleton(\App\Services\ActivityLogService::class);
        $this->app->singleton(\App\Services\ReservationChecklistService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register reservation observers for automatic checklist generation
        BanshirouReservation::observe(BanshirouReservationObserver::class);
        MoccaReservation::observe(MoccaReservationObserver::class);
    }
}
