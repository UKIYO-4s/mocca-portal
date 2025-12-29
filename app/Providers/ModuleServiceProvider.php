<?php

namespace App\Providers;

use App\Contracts\ModuleInterface;
use Illuminate\Support\ServiceProvider;

class ModuleServiceProvider extends ServiceProvider
{
    /**
     * Available modules and their class names.
     */
    protected array $modules = [
        'reservation' => \App\Modules\Reservation\ReservationModule::class,
        'checklist' => \App\Modules\Checklist\ChecklistModule::class,
        'inventory' => \App\Modules\Inventory\InventoryModule::class,
        'timecard' => \App\Modules\TimeCard\TimeCardModule::class,
        'announcement' => \App\Modules\Announcement\AnnouncementModule::class,
        'shift' => \App\Modules\Shift\ShiftModule::class,
    ];

    /**
     * Loaded module instances.
     */
    protected array $loadedModules = [];

    /**
     * Register services.
     */
    public function register(): void
    {
        foreach ($this->modules as $name => $class) {
            if ($this->isModuleEnabled($name) && class_exists($class)) {
                $this->app->singleton("module.{$name}", fn() => new $class());
                $this->loadedModules[$name] = $class;
            }
        }

        // Register a collection of all loaded modules
        $this->app->singleton('modules', function () {
            $modules = [];
            foreach ($this->loadedModules as $name => $class) {
                $modules[$name] = app("module.{$name}");
            }
            return $modules;
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        foreach ($this->loadedModules as $name => $class) {
            /** @var ModuleInterface $module */
            $module = app("module.{$name}");
            $module->boot();
        }
    }

    /**
     * Check if a module is enabled in config.
     */
    protected function isModuleEnabled(string $name): bool
    {
        return config("modules.enabled.{$name}", false);
    }

    /**
     * Get all loaded modules.
     */
    public function getLoadedModules(): array
    {
        return $this->loadedModules;
    }
}
