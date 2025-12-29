<?php

namespace App\Core;

use App\Contracts\ModuleInterface;

abstract class BaseModule implements ModuleInterface
{
    /**
     * The module name (should match config key).
     */
    protected string $name;

    /**
     * The module version.
     */
    protected string $version = '1.0.0';

    /**
     * Get the module name.
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Get the module version.
     */
    public function getVersion(): string
    {
        return $this->version;
    }

    /**
     * Check if the module is enabled.
     */
    public function isEnabled(): bool
    {
        return config("modules.enabled.{$this->name}", false);
    }

    /**
     * Get dashboard widgets (override in subclass).
     */
    public function getDashboardWidgets(): array
    {
        return [];
    }

    /**
     * Get navigation items (override in subclass).
     */
    public function getNavigation(): array
    {
        return [];
    }

    /**
     * Get permissions (override in subclass).
     */
    public function getPermissions(): array
    {
        return [];
    }

    /**
     * Boot the module (override in subclass).
     */
    abstract public function boot(): void;

    /**
     * Get the module's base path.
     */
    protected function getBasePath(): string
    {
        $reflection = new \ReflectionClass($this);
        return dirname($reflection->getFileName());
    }

    /**
     * Load routes from the module's routes file.
     */
    protected function loadRoutes(): void
    {
        $routesFile = $this->getBasePath() . '/routes.php';
        if (file_exists($routesFile)) {
            require $routesFile;
        }
    }
}
