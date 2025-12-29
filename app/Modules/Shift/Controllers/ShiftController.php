<?php

namespace App\Modules\Shift\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Models\User;
use App\Modules\Shift\Models\Shift;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display weekly shift view for all users.
     */
    public function index(Request $request): Response
    {
        // Parse week parameter (YYYY-W format, e.g., "2025-W01")
        $weekParam = $request->input('week');

        if ($weekParam && preg_match('/^(\d{4})-W(\d{2})$/', $weekParam, $matches)) {
            $year = (int) $matches[1];
            $week = (int) $matches[2];
            // Get Monday of the specified ISO week
            $weekStart = Carbon::now()
                ->setISODate($year, $week)
                ->startOfWeek(Carbon::MONDAY);
        } else {
            // Default to current week (start on Monday)
            $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        }

        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);
        $currentWeek = $weekStart->format('Y-\\WW');

        $shifts = Shift::with(['user', 'location'])
            ->forDateRange($weekStart, $weekEnd)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $users = User::orderBy('name')->get(['id', 'name', 'role']);
        $locations = Location::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'users' => $users,
            'locations' => $locations,
            'currentWeek' => $currentWeek,
            'weekStart' => $weekStart->format('Y-m-d'),
            'weekEnd' => $weekEnd->format('Y-m-d'),
        ]);
    }

    /**
     * Display monthly calendar view.
     */
    public function calendar(Request $request): Response
    {
        // Parse month parameter (YYYY-MM format)
        [$year, $month] = $this->parseYearMonth($request);

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $currentMonth = $monthStart->format('Y-m');

        $shifts = Shift::with(['user', 'location'])
            ->forDateRange($monthStart, $monthEnd)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $users = User::orderBy('name')->get(['id', 'name', 'role']);
        $locations = Location::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Shifts/Calendar', [
            'shifts' => $shifts,
            'users' => $users,
            'locations' => $locations,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Display current user's shifts only.
     */
    public function myShifts(Request $request): Response
    {
        $user = Auth::user();

        // Parse month parameter (YYYY-MM format)
        [$year, $month] = $this->parseYearMonth($request);

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $currentMonth = $monthStart->format('Y-m');

        $shifts = Shift::with(['location'])
            ->forUser($user->id)
            ->forDateRange($monthStart, $monthEnd)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Shifts/My', [
            'shifts' => $shifts,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Display shift management page (Manager+).
     */
    public function manage(Request $request): Response
    {
        // Parse month parameter (YYYY-MM format)
        [$year, $month] = $this->parseYearMonth($request);

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $currentMonth = $monthStart->format('Y-m');

        $shifts = Shift::with(['user', 'location', 'creator'])
            ->forDateRange($monthStart, $monthEnd)
            ->orderBy('date')
            ->orderBy('start_time')
            ->get();

        $users = User::orderBy('name')->get(['id', 'name', 'role']);
        $locations = Location::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return Inertia::render('Shifts/Manage', [
            'shifts' => $shifts,
            'users' => $users,
            'locations' => $locations,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Store a newly created shift (Manager+).
     * Uses transaction + lockForUpdate to prevent concurrent overlap issues.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'location_id' => 'nullable|exists:locations,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'notes' => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($validated) {
            // Lock existing shifts for this user/date to prevent concurrent inserts
            Shift::where('user_id', $validated['user_id'])
                ->whereDate('date', $validated['date'])
                ->lockForUpdate()
                ->get();

            // Create a temporary shift instance to check for overlaps
            $shift = new Shift([
                'user_id' => $validated['user_id'],
                'location_id' => $validated['location_id'] ?? null,
                'date' => $validated['date'],
                'start_time' => $validated['start_time'],
                'end_time' => $validated['end_time'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id(),
            ]);

            // Check for overlapping shifts
            if ($shift->hasOverlap()) {
                throw ValidationException::withMessages([
                    'start_time' => '指定された時間帯に既存のシフトが存在します。',
                ]);
            }

            $shift->save();

            $user = User::find($validated['user_id']);
            $this->activityLog->logCreated(
                'shift',
                $shift,
                "シフト作成: {$user->name} {$shift->date->format('Y-m-d')} {$validated['start_time']}-{$validated['end_time']}"
            );

            return redirect()
                ->back()
                ->with('success', 'シフトを作成しました。');
        });
    }

    /**
     * Update the specified shift (Manager+).
     * Uses transaction + lockForUpdate to prevent concurrent overlap issues.
     */
    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'location_id' => 'nullable|exists:locations,id',
            'date' => 'required|date',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'notes' => 'nullable|string|max:1000',
        ]);

        return DB::transaction(function () use ($validated, $shift) {
            // Lock existing shifts for this user/date to prevent concurrent updates
            Shift::where('user_id', $validated['user_id'])
                ->whereDate('date', $validated['date'])
                ->lockForUpdate()
                ->get();

            // Update shift attributes for overlap check
            $shift->user_id = $validated['user_id'];
            $shift->location_id = $validated['location_id'] ?? null;
            $shift->date = $validated['date'];
            $shift->start_time = $validated['start_time'];
            $shift->end_time = $validated['end_time'];
            $shift->notes = $validated['notes'] ?? null;

            // Check for overlapping shifts (hasOverlap excludes current shift since it exists)
            if ($shift->hasOverlap()) {
                throw ValidationException::withMessages([
                    'start_time' => '指定された時間帯に既存のシフトが存在します。',
                ]);
            }

            $shift->save();

            $user = User::find($validated['user_id']);
            $this->activityLog->logUpdated(
                'shift',
                $shift,
                "シフト更新: {$user->name} {$shift->date->format('Y-m-d')} {$validated['start_time']}-{$validated['end_time']}"
            );

            return redirect()
                ->back()
                ->with('success', 'シフトを更新しました。');
        });
    }

    /**
     * Remove the specified shift (Manager+).
     */
    public function destroy(Shift $shift)
    {
        $userName = $shift->user->name;
        $shiftDate = $shift->date->format('Y-m-d');
        $shiftTime = "{$shift->start_time}-{$shift->end_time}";

        // Log before deletion to capture target_id
        $this->activityLog->logDeleted(
            'shift',
            $shift,
            "シフト削除: {$userName} {$shiftDate} {$shiftTime}"
        );

        $shift->delete();

        return redirect()
            ->back()
            ->with('success', 'シフトを削除しました。');
    }

    /**
     * Parse year and month from request.
     * Accepts YYYY-MM format (month param) or defaults to current month.
     *
     * @return array{0: int, 1: int} [year, month]
     */
    protected function parseYearMonth(Request $request): array
    {
        $monthParam = $request->input('month');

        // If month is in YYYY-MM format, parse it
        if ($monthParam && preg_match('/^(\d{4})-(\d{2})$/', $monthParam, $matches)) {
            return [(int) $matches[1], (int) $matches[2]];
        }

        // Default to current month
        return [Carbon::now()->year, Carbon::now()->month];
    }
}
