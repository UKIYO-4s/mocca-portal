<?php

namespace App\Contracts;

use App\Models\User;

interface DashboardWidgetInterface
{
    /**
     * Get the widget name/identifier.
     */
    public function getName(): string;

    /**
     * Get the React component name for this widget.
     */
    public function getComponent(): string;

    /**
     * Get the data to pass to the widget component.
     */
    public function getData(): array;

    /**
     * Check if the given user can view this widget.
     */
    public function canView(User $user): bool;

    /**
     * Get the display order (lower = first).
     */
    public function getOrder(): int;
}
