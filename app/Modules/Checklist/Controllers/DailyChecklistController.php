<?php

namespace App\Modules\Checklist\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Checklist\Models\ChecklistItem;
use App\Modules\Checklist\Models\ChecklistTemplate;
use App\Modules\Checklist\Models\DailyChecklist;
use App\Modules\Checklist\Models\DailyChecklistEntry;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DailyChecklistController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display a listing of daily checklists with filters.
     */
    public function index(Request $request): Response
    {
        $query = DailyChecklist::with(['template', 'creator', 'entries.completedBy'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc');

        // Filter by date
        if ($request->filled('date')) {
            $query->forDate($request->date);
        }

        // Filter by type (via template)
        if ($request->filled('type')) {
            $query->whereHas('template', function ($q) use ($request) {
                $q->where('type', $request->type);
            });
        }

        $dailyChecklists = $query->get();

        return Inertia::render('Checklists/Index', [
            'checklists' => $dailyChecklists,
            'filters' => $request->only(['date', 'type']),
            'typeOptions' => ChecklistTemplate::TYPE_LABELS,
        ]);
    }

    /**
     * Display the specified daily checklist with entries and items.
     */
    public function show(DailyChecklist $dailyChecklist): Response
    {
        $dailyChecklist->load([
            'template.items',
            'creator',
            'entries.item',
            'entries.completedBy',
        ]);

        // 防御的プログラミング: templateが存在しない場合は404
        if (!$dailyChecklist->template) {
            abort(404, 'チェックリストのテンプレートが見つかりません。');
        }

        // Build a map of item_id => entry for easy lookup
        $entriesMap = $dailyChecklist->entries->keyBy('checklist_item_id');

        // Prepare items with their completion status
        $itemsWithStatus = $dailyChecklist->template->items->map(function ($item) use ($entriesMap) {
            $entry = $entriesMap->get($item->id);
            return [
                'id' => $item->id,
                'description' => $item->description,
                'sort_order' => $item->sort_order,
                'entry' => $entry ? [
                    'id' => $entry->id,
                    'completed_at' => $entry->completed_at,
                    'completed_by_user' => $entry->completedBy,
                    'is_completed' => $entry->completed_at !== null,
                ] : null,
            ];
        });

        return Inertia::render('Checklists/Show', [
            'checklist' => $dailyChecklist,
            'items' => $itemsWithStatus,
        ]);
    }

    /**
     * Toggle the completion status of a checklist entry.
     */
    public function toggleEntry(DailyChecklist $dailyChecklist, ChecklistItem $item)
    {
        // Verify the item belongs to the checklist's template
        if ($item->template_id !== $dailyChecklist->template_id) {
            abort(404, 'Item does not belong to this checklist template.');
        }

        $userId = Auth::id();

        DB::transaction(function () use ($dailyChecklist, $item, $userId) {
            // Find or create the entry
            $entry = DailyChecklistEntry::firstOrCreate(
                [
                    'daily_checklist_id' => $dailyChecklist->id,
                    'checklist_item_id' => $item->id,
                ],
                [
                    'completed_at' => null,
                    'completed_by' => null,
                ]
            );

            // Toggle completion status
            $entry->toggle($userId);

            // Check if all items are complete and update daily_checklist.completed_at
            $dailyChecklist->checkCompletion();
        });

        $this->activityLog->logUpdated(
            'checklist',
            $dailyChecklist,
            "チェックリスト項目を更新: {$item->description}"
        );

        return back()->with('success', 'チェック状態を更新しました。');
    }

    /**
     * Generate daily checklists from active templates for a given date.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
        ]);

        $date = Carbon::parse($validated['date'])->toDateString();
        $userId = Auth::id();

        $createdCount = 0;

        DB::transaction(function () use ($date, $userId, &$createdCount) {
            // Get all active templates
            $templates = ChecklistTemplate::active()
                ->with('items')
                ->orderBy('sort_order')
                ->get();

            foreach ($templates as $template) {
                // Check if a daily checklist already exists for this template and date
                $exists = DailyChecklist::forDate($date)
                    ->forTemplate($template->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                // Create the daily checklist
                $dailyChecklist = DailyChecklist::create([
                    'template_id' => $template->id,
                    'date' => $date,
                    'created_by' => $userId,
                    'completed_at' => null,
                ]);

                // Create entries for each item (initialized as not completed)
                foreach ($template->items as $item) {
                    DailyChecklistEntry::create([
                        'daily_checklist_id' => $dailyChecklist->id,
                        'checklist_item_id' => $item->id,
                        'completed_at' => null,
                        'completed_by' => null,
                    ]);
                }

                $createdCount++;
            }
        });

        if ($createdCount > 0) {
            $this->activityLog->log(
                'checklist',
                'generated',
                null,
                "日次チェックリストを生成: {$date} ({$createdCount}件)"
            );

            return back()->with('success', "{$createdCount}件のチェックリストを生成しました。");
        }

        return back()->with('info', '生成対象のチェックリストがありませんでした。');
    }
}
