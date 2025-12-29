<?php

namespace App\Contracts;

interface ModuleInterface
{
    /**
     * Get the module name.
     */
    public function getName(): string;

    /**
     * Get the module version.
     */
    public function getVersion(): string;

    /**
     * Check if the module is enabled.
     */
    public function isEnabled(): bool;

    /**
     * Get dashboard widgets provided by this module.
     *
     * @return array<DashboardWidgetInterface>
     */
    public function getDashboardWidgets(): array;

    /**
     * Get navigation items for this module.
     *
     * @return array<array{label: string, route: string, icon?: string, roles?: array}>
     */
    public function getNavigation(): array;

    /**
     * Get permissions defined by this module.
     *
     * @return array<string>
     */
    public function getPermissions(): array;

    /**
     * Boot the module (register routes, views, etc.).
     */
    public function boot(): void;
}
