<?php

namespace App\Modules\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Modules\Inventory\Models\InventoryItem;
use App\Modules\Inventory\Models\InventoryLog;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display the staff usage input page.
     * Staff users cannot see stock counts.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isStaff = $user->role === 'staff';

        $query = InventoryItem::active()
            ->with('location')
            ->orderBy('name');

        // Filter by location
        if ($request->filled('location_id')) {
            $query->forLocation($request->location_id);
        }

        $items = $query->get();

        // Hide stock counts for staff role
        if ($isStaff) {
            $items = $items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'location' => $item->location,
                    'location_id' => $item->location_id,
                ];
            });
        }

        return Inertia::render('Inventory/Index', [
            'items' => $items,
            'filters' => $request->only(['location_id']),
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
            'isStaff' => $isStaff,
        ]);
    }

    /**
     * Record item usage (all authenticated users).
     * Accepts multiple usages: { usages: [{ item_id, quantity }, ...] }
     */
    public function recordUsage(Request $request)
    {
        $validated = $request->validate([
            'usages' => 'required|array|min:1',
            'usages.*.item_id' => 'required|exists:inventory_items,id',
            'usages.*.quantity' => 'required|integer|min:1',
        ]);

        $usageMessages = [];

        DB::transaction(function () use ($validated, &$usageMessages) {
            foreach ($validated['usages'] as $usage) {
                $item = InventoryItem::findOrFail($usage['item_id']);
                $item->adjustStock(
                    $usage['quantity'],
                    'usage',
                    auth()->id(),
                    null
                );
                $usageMessages[] = "{$item->name} x {$usage['quantity']}";
                $this->activityLog->log('inventory', 'usage', $item, "備品使用: {$item->name} x {$usage['quantity']}");
            }
        });

        return redirect()
            ->back()
            ->with('success', '使用を記録しました: ' . implode(', ', $usageMessages));
    }

    /**
     * Display full inventory management page (Manager/Admin only).
     */
    public function manage(Request $request): Response
    {
        $query = InventoryItem::with('location')
            ->orderBy('name');

        // Filter by location
        if ($request->filled('location_id')) {
            $query->forLocation($request->location_id);
        }

        // Filter by active status
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by low stock
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        }

        $items = $query->get();

        return Inertia::render('Inventory/Manage', [
            'items' => $items,
            'filters' => $request->only(['location_id', 'is_active', 'low_stock']),
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new inventory item.
     */
    public function create(): Response
    {
        return Inertia::render('Inventory/Create', [
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created inventory item.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'current_stock' => 'required|integer|min:0',
            'reorder_point' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $item = InventoryItem::create([
            'location_id' => $validated['location_id'],
            'name' => $validated['name'],
            'unit' => $validated['unit'],
            'current_stock' => $validated['current_stock'],
            'reorder_point' => $validated['reorder_point'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->activityLog->logCreated('inventory', $item, "備品作成: {$item->name}");

        return redirect()
            ->route('inventory.manage')
            ->with('success', '備品を作成しました。');
    }

    /**
     * Show the form for editing the specified inventory item.
     */
    public function edit(InventoryItem $item): Response
    {
        return Inertia::render('Inventory/Edit', [
            'item' => $item->load('location'),
            'locations' => Location::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Update the specified inventory item.
     */
    public function update(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'reorder_point' => 'required|integer|min:0',
            'is_active' => 'boolean',
        ]);

        $item->update([
            'location_id' => $validated['location_id'],
            'name' => $validated['name'],
            'unit' => $validated['unit'],
            'reorder_point' => $validated['reorder_point'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $this->activityLog->logUpdated('inventory', $item, "備品更新: {$item->name}");

        return redirect()
            ->route('inventory.manage')
            ->with('success', '備品を更新しました。');
    }

    /**
     * Add stock to an inventory item (positive quantity only).
     */
    public function restock(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($item, $validated) {
            $item->adjustStock(
                $validated['quantity'],
                'restock',
                auth()->id(),
                $validated['notes'] ?? null
            );
        });

        $this->activityLog->log('inventory', 'restock', $item, "備品入荷: {$item->name} +{$validated['quantity']}");

        return redirect()
            ->back()
            ->with('success', '入荷を記録しました。');
    }

    /**
     * Adjust stock of an inventory item (can be positive or negative).
     */
    public function adjust(Request $request, InventoryItem $item)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer',
            'notes' => 'required|string|max:500',
        ]);

        DB::transaction(function () use ($item, $validated) {
            $item->adjustStock(
                $validated['quantity'],
                'adjustment',
                auth()->id(),
                $validated['notes']
            );
        });

        $sign = $validated['quantity'] >= 0 ? '+' : '';
        $this->activityLog->log('inventory', 'adjustment', $item, "在庫調整: {$item->name} {$sign}{$validated['quantity']}");

        return redirect()
            ->back()
            ->with('success', '在庫を調整しました。');
    }

    /**
     * Remove the specified inventory item.
     */
    public function destroy(InventoryItem $item)
    {
        $itemName = $item->name;

        // Log before deletion to capture target_id
        $this->activityLog->logDeleted('inventory', $item, "備品削除: {$itemName}");

        $item->delete();

        return redirect()
            ->route('inventory.manage')
            ->with('success', '備品を削除しました。');
    }

    /**
     * Display inventory operation history (logs).
     */
    public function logs(Request $request): Response
    {
        $query = InventoryLog::with(['item', 'user'])
            ->orderByDesc('created_at');

        // Filter by item
        if ($request->filled('item_id')) {
            $query->forItem($request->item_id);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->get();

        return Inertia::render('Inventory/Logs', [
            'logs' => $logs,
            'filters' => $request->only(['item_id', 'type', 'date_from', 'date_to']),
            'items' => InventoryItem::orderBy('name')->get(['id', 'name']),
            'types' => InventoryLog::TYPE_LABELS,
        ]);
    }
}
