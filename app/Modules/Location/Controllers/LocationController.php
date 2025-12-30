<?php

namespace App\Modules\Location\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display a listing of locations.
     */
    public function index(): Response
    {
        $locations = Location::withCount(['inventoryItems', 'shifts'])
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Locations/Index', [
            'locations' => $locations,
        ]);
    }

    /**
     * Show the form for creating a new location.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Locations/Create');
    }

    /**
     * Store a newly created location.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:50|unique:locations,slug|regex:/^[a-z0-9-]+$/',
            'is_active' => 'boolean',
        ], [
            'slug.regex' => 'slugは半角英数字とハイフンのみ使用できます。',
            'slug.unique' => 'このslugは既に使用されています。',
        ]);

        $location = Location::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->activityLog->logCreated('location', $location, "拠点作成: {$location->name}");

        return redirect()
            ->route('admin.locations.index')
            ->with('success', '拠点を作成しました。');
    }

    /**
     * Show the form for editing the specified location.
     */
    public function edit(Location $location): Response
    {
        return Inertia::render('Admin/Locations/Edit', [
            'location' => $location,
        ]);
    }

    /**
     * Update the specified location.
     */
    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => [
                'required',
                'string',
                'max:50',
                'regex:/^[a-z0-9-]+$/',
                Rule::unique('locations', 'slug')->ignore($location->id),
            ],
            'is_active' => 'boolean',
        ], [
            'slug.regex' => 'slugは半角英数字とハイフンのみ使用できます。',
            'slug.unique' => 'このslugは既に使用されています。',
        ]);

        $location->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->activityLog->logUpdated('location', $location, "拠点更新: {$location->name}");

        return redirect()
            ->route('admin.locations.index')
            ->with('success', '拠点を更新しました。');
    }

    /**
     * Remove the specified location.
     */
    public function destroy(Location $location)
    {
        // Check if location has related items
        $inventoryCount = $location->inventoryItems()->count();
        $shiftCount = $location->shifts()->count();

        if ($inventoryCount > 0 || $shiftCount > 0) {
            return redirect()
                ->back()
                ->with('error', "この拠点には関連データがあるため削除できません（備品: {$inventoryCount}件、シフト: {$shiftCount}件）。");
        }

        $locationName = $location->name;
        $this->activityLog->logDeleted('location', $location, "拠点削除: {$locationName}");

        $location->delete();

        return redirect()
            ->route('admin.locations.index')
            ->with('success', '拠点を削除しました。');
    }
}
