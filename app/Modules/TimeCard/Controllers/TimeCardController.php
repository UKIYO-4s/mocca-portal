<?php

namespace App\Modules\TimeCard\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\TimeCard\Models\TimeRecord;
use App\Services\ActivityLogService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TimeCardController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display the time card punch screen (打刻画面).
     */
    public function index(): Response
    {
        $user = Auth::user();
        $today = Carbon::today();

        $todayRecord = TimeRecord::forUser($user->id)
            ->forDate($today)
            ->first();

        return Inertia::render('TimeCard/Index', [
            'todayRecord' => $todayRecord,
        ]);
    }

    /**
     * Record clock in (出勤).
     */
    public function clockIn(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        // Check if already clocked in today (1日1回のみ打刻可能)
        $existingRecord = TimeRecord::forUser($user->id)
            ->forDate($today)
            ->first();

        if ($existingRecord && $existingRecord->clock_in) {
            throw ValidationException::withMessages([
                'clock_in' => '本日は既に出勤打刻済みです。',
            ]);
        }

        DB::transaction(function () use ($user, $today, $now, $existingRecord) {
            if ($existingRecord) {
                $existingRecord->update([
                    'clock_in' => $now,
                ]);
            } else {
                TimeRecord::create([
                    'user_id' => $user->id,
                    'date' => $today,
                    'clock_in' => $now,
                ]);
            }

            $this->activityLog->logClockIn("出勤打刻: {$now->format('H:i')}");
        });

        return redirect()
            ->back()
            ->with('success', '出勤を記録しました。');
    }

    /**
     * Record clock out (退勤).
     */
    public function clockOut(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        $record = TimeRecord::forUser($user->id)
            ->forDate($today)
            ->first();

        // Validation: clock_in must exist before clock_out
        if (!$record || !$record->clock_in) {
            throw ValidationException::withMessages([
                'clock_out' => '出勤打刻がされていません。',
            ]);
        }

        if ($record->clock_out) {
            throw ValidationException::withMessages([
                'clock_out' => '本日は既に退勤打刻済みです。',
            ]);
        }

        // If on break, end break first
        if ($record->isOnBreak()) {
            $breakMinutes = $record->break_start->diffInMinutes($now);
            $record->update([
                'break_end' => $now,
                'break_minutes' => $breakMinutes,
            ]);
        }

        DB::transaction(function () use ($record, $now) {
            $record->update([
                'clock_out' => $now,
            ]);

            $this->activityLog->logClockOut("退勤打刻: {$now->format('H:i')}");
        });

        return redirect()
            ->back()
            ->with('success', '退勤を記録しました。');
    }

    /**
     * Record break start (休憩開始).
     */
    public function breakStart(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        $record = TimeRecord::forUser($user->id)
            ->forDate($today)
            ->first();

        // Validation: clock_in must exist before break_start
        if (!$record || !$record->clock_in) {
            throw ValidationException::withMessages([
                'break_start' => '出勤打刻がされていません。',
            ]);
        }

        if ($record->clock_out) {
            throw ValidationException::withMessages([
                'break_start' => '既に退勤済みです。',
            ]);
        }

        if ($record->isOnBreak()) {
            throw ValidationException::withMessages([
                'break_start' => '既に休憩中です。',
            ]);
        }

        // Block second break (1日1回のみ)
        if ($record->break_end) {
            throw ValidationException::withMessages([
                'break_start' => '本日は既に休憩を取得済みです。',
            ]);
        }

        DB::transaction(function () use ($record, $now) {
            $record->update([
                'break_start' => $now,
                'break_end' => null,
            ]);

            $this->activityLog->log('timecard', 'break_start', $record, "休憩開始: {$now->format('H:i')}");
        });

        return redirect()
            ->back()
            ->with('success', '休憩を開始しました。');
    }

    /**
     * Record break end (休憩終了).
     */
    public function breakEnd(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();
        $now = Carbon::now();

        $record = TimeRecord::forUser($user->id)
            ->forDate($today)
            ->first();

        // Validation: break_start must exist before break_end
        if (!$record || !$record->break_start) {
            throw ValidationException::withMessages([
                'break_end' => '休憩開始が記録されていません。',
            ]);
        }

        if ($record->break_end) {
            throw ValidationException::withMessages([
                'break_end' => '既に休憩終了済みです。',
            ]);
        }

        DB::transaction(function () use ($record, $now) {
            $breakMinutes = $record->break_start->diffInMinutes($now);

            $record->update([
                'break_end' => $now,
                'break_minutes' => $breakMinutes,
            ]);

            $this->activityLog->log('timecard', 'break_end', $record, "休憩終了: {$now->format('H:i')} ({$breakMinutes}分)");
        });

        return redirect()
            ->back()
            ->with('success', '休憩を終了しました。');
    }

    /**
     * Display user's time record history (履歴画面).
     */
    public function history(Request $request): Response
    {
        $user = Auth::user();

        // Parse month parameter (accepts YYYY-MM format or separate year/month)
        [$year, $month] = $this->parseYearMonth($request);

        $records = TimeRecord::forUser($user->id)
            ->forMonth($year, $month)
            ->orderBy('date', 'desc')
            ->get();

        $currentMonth = sprintf('%04d-%02d', $year, $month);

        return Inertia::render('TimeCard/History', [
            'records' => $records,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Display time record management screen (管理画面 - Manager+).
     */
    public function manage(Request $request): Response
    {
        // Parse month parameter (accepts YYYY-MM format or separate year/month)
        [$year, $month] = $this->parseYearMonth($request);
        $userId = $request->input('user_id');

        $query = TimeRecord::with('user', 'modifiedBy')
            ->forMonth($year, $month)
            ->orderBy('date', 'desc')
            ->orderBy('user_id');

        if ($userId) {
            $query->forUser($userId);
        }

        $records = $query->get();

        // Get all users for filter dropdown
        $users = User::orderBy('name')->get(['id', 'name', 'role']);

        $currentMonth = sprintf('%04d-%02d', $year, $month);

        return Inertia::render('TimeCard/Manage', [
            'records' => $records,
            'users' => $users,
            'selectedUserId' => $userId ? (int) $userId : null,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Display time record reports (レポート画面 - Manager+).
     */
    public function reports(Request $request): Response
    {
        // Parse month parameter (accepts YYYY-MM format or separate year/month)
        [$year, $month] = $this->parseYearMonth($request);

        // Get all time records for the month grouped by user
        $records = TimeRecord::with('user')
            ->forMonth($year, $month)
            ->get();

        // Calculate monthly reports by user
        $reports = $records->groupBy('user_id')->map(function ($userRecords) {
            $user = $userRecords->first()->user;
            $totalWorkMinutes = 0;
            $totalBreakMinutes = 0;
            $workDays = 0;

            foreach ($userRecords as $record) {
                if ($record->clock_in && $record->clock_out) {
                    $totalWorkMinutes += $record->calculateWorkMinutes();
                    $totalBreakMinutes += $record->break_minutes ?? 0;
                    $workDays++;
                }
            }

            return [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'work_days' => $workDays,
                'total_work_minutes' => $totalWorkMinutes,
                'total_break_minutes' => $totalBreakMinutes,
                'average_work_minutes_per_day' => $workDays > 0 ? round($totalWorkMinutes / $workDays) : 0,
            ];
        })->values();

        $currentMonth = sprintf('%04d-%02d', $year, $month);

        return Inertia::render('TimeCard/Reports', [
            'reports' => $reports,
            'currentMonth' => $currentMonth,
        ]);
    }

    /**
     * Update a time record (Manager+).
     */
    public function update(Request $request, TimeRecord $timeRecord)
    {
        $validated = $request->validate([
            'clock_in' => 'nullable|date_format:H:i',
            'clock_out' => 'nullable|date_format:H:i',
            'break_minutes' => 'nullable|integer|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        // Convert HH:MM times to full datetime using the record's date
        $recordDate = $timeRecord->date->format('Y-m-d');
        $clockIn = isset($validated['clock_in'])
            ? Carbon::parse("{$recordDate} {$validated['clock_in']}")
            : null;
        $clockOut = isset($validated['clock_out'])
            ? Carbon::parse("{$recordDate} {$validated['clock_out']}")
            : null;

        // Validation: clock_in must exist before clock_out
        if ($clockOut && !$clockIn && !$timeRecord->clock_in) {
            throw ValidationException::withMessages([
                'clock_out' => '出勤時刻を先に設定してください。',
            ]);
        }

        // Validation: clock_out must be after clock_in
        $effectiveClockIn = $clockIn ?? $timeRecord->clock_in;
        if ($clockOut && $effectiveClockIn && $clockOut->lessThan($effectiveClockIn)) {
            throw ValidationException::withMessages([
                'clock_out' => '退勤時刻は出勤時刻より後に設定してください。',
            ]);
        }

        $now = Carbon::now();
        $modifier = Auth::user();

        DB::transaction(function () use ($timeRecord, $validated, $clockIn, $clockOut, $now, $modifier) {
            $updateData = [
                'modified_by' => $modifier->id,
                'modified_at' => $now,
            ];

            if ($clockIn !== null) {
                $updateData['clock_in'] = $clockIn;
            }
            if ($clockOut !== null) {
                $updateData['clock_out'] = $clockOut;
            }
            if (isset($validated['break_minutes'])) {
                $updateData['break_minutes'] = $validated['break_minutes'];
            }
            if (array_key_exists('notes', $validated)) {
                $updateData['notes'] = $validated['notes'];
            }

            $timeRecord->update($updateData);

            $this->activityLog->logUpdated(
                'timecard',
                $timeRecord,
                "勤怠記録を修正: {$timeRecord->user->name} {$timeRecord->date->format('Y-m-d')}"
            );
        });

        return redirect()
            ->back()
            ->with('success', '勤怠記録を更新しました。');
    }

    /**
     * Parse year and month from request.
     * Accepts both YYYY-MM format (month param) or separate year/month params.
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

        // Fall back to separate year/month parameters
        $year = $request->input('year', Carbon::now()->year);
        $month = $request->input('month', Carbon::now()->month);

        return [(int) $year, (int) $month];
    }
}
