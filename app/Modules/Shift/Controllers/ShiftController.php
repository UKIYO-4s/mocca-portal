<?php

namespace App\Modules\Shift\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Shift\Models\Shift;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display weekly shift view for all users (working/off only).
     */
    public function index(Request $request): Response
    {
        // Parse week parameter (YYYY-W format, e.g., "2025-W01")
        $weekParam = $request->input('week');

        if ($weekParam && preg_match('/^(\d{4})-W(\d{2})$/', $weekParam, $matches)) {
            $year = (int) $matches[1];
            $week = (int) $matches[2];
            $weekStart = Carbon::now()
                ->setISODate($year, $week)
                ->startOfWeek(Carbon::MONDAY);
        } else {
            $weekStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        }

        $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);
        $currentWeek = $weekStart->format('Y-\\WW');

        $shifts = Shift::with(['user'])
            ->forDateRange($weekStart, $weekEnd)
            ->orderBy('date')
            ->get();

        $users = User::orderBy('name')->get(['id', 'name', 'role']);

        return Inertia::render('Shifts/Index', [
            'shifts' => $shifts,
            'users' => $users,
            'currentWeek' => $currentWeek,
            'weekStart' => $weekStart->format('Y-m-d'),
            'weekEnd' => $weekEnd->format('Y-m-d'),
        ]);
    }

    /**
     * Display monthly calendar view (working/off only).
     */
    public function calendar(Request $request): Response
    {
        [$year, $month] = $this->parseYearMonth($request);

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $currentMonth = $monthStart->format('Y-m');

        $shifts = Shift::with(['user'])
            ->forDateRange($monthStart, $monthEnd)
            ->orderBy('date')
            ->get();

        $users = User::orderBy('name')->get(['id', 'name', 'role']);

        return Inertia::render('Shifts/Calendar', [
            'shifts' => $shifts,
            'users' => $users,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Display current user's shifts only (working/off).
     */
    public function myShifts(Request $request): Response
    {
        $user = Auth::user();

        [$year, $month] = $this->parseYearMonth($request);

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $currentMonth = $monthStart->format('Y-m');

        $shifts = Shift::forUser($user->id)
            ->forDateRange($monthStart, $monthEnd)
            ->orderBy('date')
            ->get();

        // Calculate summary
        $workingCount = $shifts->where('status', 'working')->count();
        $offCount = $shifts->where('status', 'off')->count();

        return Inertia::render('Shifts/My', [
            'shifts' => $shifts,
            'currentMonth' => $currentMonth,
            'workingCount' => $workingCount,
            'offCount' => $offCount,
        ]);
    }

    /**
     * Display shift management page with per-user monthly data (Manager+).
     */
    public function manage(Request $request): Response
    {
        [$year, $month] = $this->parseYearMonth($request);

        $monthStart = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $monthEnd = $monthStart->copy()->endOfMonth();
        $currentMonth = $monthStart->format('Y-m');

        $users = User::orderBy('name')->get(['id', 'name', 'role']);

        // Get all shifts for this month
        $allShifts = Shift::forDateRange($monthStart, $monthEnd)
            ->get()
            ->groupBy('user_id');

        // Build per-user data with default mode and exception dates
        $userData = $users->map(function ($user) use ($allShifts, $currentMonth) {
            $userShifts = $allShifts->get($user->id, collect());

            $workingCount = $userShifts->where('status', 'working')->count();
            $offCount = $userShifts->where('status', 'off')->count();

            // Infer default mode based on majority
            if ($workingCount >= $offCount) {
                $defaultMode = 'working';
                $exceptionDates = $userShifts->where('status', 'off')
                    ->pluck('date')
                    ->map(fn($d) => $d->format('Y-m-d'))
                    ->values()
                    ->toArray();
            } else {
                $defaultMode = 'off';
                $exceptionDates = $userShifts->where('status', 'working')
                    ->pluck('date')
                    ->map(fn($d) => $d->format('Y-m-d'))
                    ->values()
                    ->toArray();
            }

            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role,
                'default_mode' => $defaultMode,
                'exception_dates' => $exceptionDates,
                'working_count' => $workingCount,
                'off_count' => $offCount,
            ];
        });

        // Generate calendar days for the month
        $calendarDays = [];
        $current = $monthStart->copy();
        while ($current <= $monthEnd) {
            $calendarDays[] = [
                'date' => $current->format('Y-m-d'),
                'day' => $current->day,
                'dayOfWeek' => $current->dayOfWeek, // 0 = Sunday, 6 = Saturday
            ];
            $current->addDay();
        }

        return Inertia::render('Shifts/Manage', [
            'users' => $userData,
            'currentMonth' => $currentMonth,
            'calendarDays' => $calendarDays,
            'monthStart' => $monthStart->format('Y-m-d'),
            'monthEnd' => $monthEnd->format('Y-m-d'),
        ]);
    }

    /**
     * Bulk update shifts for a user in a month (Manager+).
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'year_month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'default_mode' => ['required', Rule::in(['working', 'off'])],
            'exception_dates' => 'array',
            'exception_dates.*' => 'date',
        ]);

        $userId = $validated['user_id'];
        $yearMonth = $validated['year_month'];
        $defaultMode = $validated['default_mode'];
        $exceptionDates = $validated['exception_dates'] ?? [];

        // Perform bulk update
        Shift::bulkUpdateMonth(
            $userId,
            $yearMonth,
            $defaultMode,
            $exceptionDates,
            Auth::id()
        );

        $user = User::find($userId);
        $this->activityLog->log(
            'shift',
            'bulk_updated',
            null,
            "シフト一括更新: {$user->name} {$yearMonth} 基本:{$defaultMode} 例外:{$this->formatExceptionCount($exceptionDates)}日"
        );

        return redirect()
            ->back()
            ->with('success', 'シフトを更新しました。');
    }

    /**
     * Bulk update shifts for all users in a month (Manager+).
     */
    public function bulkUpdateAll(Request $request)
    {
        $validated = $request->validate([
            'year_month' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'default_mode' => ['required', Rule::in(['working', 'off'])],
            'exception_dates' => 'array',
            'exception_dates.*' => 'date',
            'user_ids' => 'array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $yearMonth = $validated['year_month'];
        $defaultMode = $validated['default_mode'];
        $exceptionDates = $validated['exception_dates'] ?? [];
        $userIds = $validated['user_ids'] ?? User::pluck('id')->toArray();

        foreach ($userIds as $userId) {
            Shift::bulkUpdateMonth(
                $userId,
                $yearMonth,
                $defaultMode,
                $exceptionDates,
                Auth::id()
            );
        }

        $this->activityLog->log(
            'shift',
            'bulk_updated_all',
            null,
            "シフト全員一括更新: {$yearMonth} 基本:{$defaultMode} 対象:" . count($userIds) . "名"
        );

        return redirect()
            ->back()
            ->with('success', '全員のシフトを更新しました。');
    }

    /**
     * Parse year and month from request.
     *
     * @return array{0: int, 1: int} [year, month]
     */
    protected function parseYearMonth(Request $request): array
    {
        $monthParam = $request->input('month');

        if ($monthParam && preg_match('/^(\d{4})-(\d{2})$/', $monthParam, $matches)) {
            return [(int) $matches[1], (int) $matches[2]];
        }

        return [Carbon::now()->year, Carbon::now()->month];
    }

    /**
     * Format exception dates count for logging.
     */
    protected function formatExceptionCount(array $dates): int
    {
        return count($dates);
    }
}
