<?php

namespace App\Services;

use App\Contracts\DashboardWidgetInterface;
use App\Models\User;

class WidgetManager
{
    /**
     * Registered widgets.
     */
    protected array $widgets = [];

    /**
     * Register a widget.
     */
    public function register(DashboardWidgetInterface $widget): void
    {
        $this->widgets[$widget->getName()] = $widget;
    }

    /**
     * Register multiple widgets.
     */
    public function registerMany(array $widgets): void
    {
        foreach ($widgets as $widget) {
            $this->register($widget);
        }
    }

    /**
     * Get all widgets visible to a user.
     */
    public function getWidgetsForUser(User $user): array
    {
        return collect($this->widgets)
            ->filter(fn($widget) => $widget->canView($user))
            ->sortBy(fn($widget) => $widget->getOrder())
            ->map(fn($widget) => [
                'name' => $widget->getName(),
                'component' => $widget->getComponent(),
                'data' => $widget->getData(),
            ])
            ->values()
            ->toArray();
    }

    /**
     * Get a specific widget by name.
     */
    public function getWidget(string $name): ?DashboardWidgetInterface
    {
        return $this->widgets[$name] ?? null;
    }

    /**
     * Get all registered widgets.
     */
    public function getAllWidgets(): array
    {
        return $this->widgets;
    }
}
