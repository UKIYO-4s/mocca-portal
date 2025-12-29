<?php

namespace App\Http\Controllers;

use App\Services\WidgetManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected WidgetManager $widgetManager
    ) {}

    /**
     * Display the dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $widgets = $this->widgetManager->getWidgetsForUser($user);

        // Get navigation items from all enabled modules
        $navigation = $this->getNavigationItems($user);

        return Inertia::render('Dashboard', [
            'widgets' => $widgets,
            'navigation' => $navigation,
        ]);
    }

    /**
     * Get navigation items for the user.
     */
    protected function getNavigationItems($user): array
    {
        $modules = app('modules');
        $navigation = [];

        foreach ($modules as $module) {
            foreach ($module->getNavigation() as $item) {
                // Check if user has required role
                if (isset($item['roles']) && !in_array($user->role, $item['roles'])) {
                    continue;
                }
                $navigation[] = $item;
            }
        }

        return $navigation;
    }
}
