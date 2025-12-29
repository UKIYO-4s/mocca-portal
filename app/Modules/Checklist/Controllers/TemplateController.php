<?php

namespace App\Modules\Checklist\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Modules\Checklist\Models\ChecklistItem;
use App\Modules\Checklist\Models\ChecklistTemplate;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TemplateController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {
        // Middleware is defined in routes (ChecklistModule.php)
    }

    /**
     * Display a listing of templates with items count.
     */
    public function index(Request $request): Response
    {
        $query = ChecklistTemplate::withCount('items')
            ->with('location')
            ->orderBy('sort_order')
            ->orderBy('name');

        // Filter by type
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by location
        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        $templates = $query->get();

        return Inertia::render('Checklists/Templates/Index', [
            'templates' => $templates,
            'filters' => $request->only(['type', 'is_active', 'location_id']),
            'types' => ChecklistTemplate::TYPE_LABELS,
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new template.
     */
    public function create(): Response
    {
        return Inertia::render('Checklists/Templates/Create', [
            'types' => ChecklistTemplate::TYPE_LABELS,
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created template with items.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:lunch_prep,dinner_prep,cleaning,other',
            'location_id' => 'nullable|exists:locations,id',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.description' => 'required|string|max:500',
            'items.*.sort_order' => 'nullable|integer|min:0',
        ]);

        $template = DB::transaction(function () use ($validated, $request) {
            $template = ChecklistTemplate::create([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'location_id' => $validated['location_id'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            // Create items
            $items = $request->input('items', []);
            foreach ($items as $index => $itemData) {
                ChecklistItem::create([
                    'template_id' => $template->id,
                    'description' => $itemData['description'],
                    'sort_order' => $itemData['sort_order'] ?? $index,
                ]);
            }

            return $template;
        });

        $this->activityLog->logCreated('checklist', $template, "テンプレート作成: {$template->name}");

        return redirect()
            ->route('checklists.templates.index')
            ->with('success', 'テンプレートを作成しました。');
    }

    /**
     * Show the form for editing the specified template with items.
     */
    public function edit(ChecklistTemplate $template): Response
    {
        $template->load('items');

        return Inertia::render('Checklists/Templates/Edit', [
            'template' => $template,
            'types' => ChecklistTemplate::TYPE_LABELS,
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified template and items.
     */
    public function update(Request $request, ChecklistTemplate $template)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:lunch_prep,dinner_prep,cleaning,other',
            'location_id' => 'nullable|exists:locations,id',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'items' => 'nullable|array',
            'items.*.id' => 'nullable|integer|exists:checklist_items,id',
            'items.*.description' => 'required|string|max:500',
            'items.*.sort_order' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($validated, $request, $template) {
            $template->update([
                'name' => $validated['name'],
                'type' => $validated['type'],
                'location_id' => $validated['location_id'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            // Sync items
            $items = $request->input('items', []);
            $existingItemIds = [];

            foreach ($items as $index => $itemData) {
                if (!empty($itemData['id'])) {
                    // Update existing item
                    $item = ChecklistItem::find($itemData['id']);
                    if ($item && $item->template_id === $template->id) {
                        $item->update([
                            'description' => $itemData['description'],
                            'sort_order' => $itemData['sort_order'] ?? $index,
                        ]);
                        $existingItemIds[] = $item->id;
                    }
                } else {
                    // Create new item
                    $newItem = ChecklistItem::create([
                        'template_id' => $template->id,
                        'description' => $itemData['description'],
                        'sort_order' => $itemData['sort_order'] ?? $index,
                    ]);
                    $existingItemIds[] = $newItem->id;
                }
            }

            // Delete items that are no longer in the list
            $template->items()
                ->whereNotIn('id', $existingItemIds)
                ->delete();
        });

        $this->activityLog->logUpdated('checklist', $template, "テンプレート更新: {$template->name}");

        return redirect()
            ->route('checklists.templates.index')
            ->with('success', 'テンプレートを更新しました。');
    }

    /**
     * Remove the specified template.
     */
    public function destroy(ChecklistTemplate $template)
    {
        $name = $template->name;

        DB::transaction(function () use ($template) {
            // Delete associated items first
            $template->items()->delete();
            $template->delete();
        });

        $this->activityLog->log('checklist', 'deleted', null, "テンプレート削除: {$name}");

        return redirect()
            ->route('checklists.templates.index')
            ->with('success', 'テンプレートを削除しました。');
    }
}
