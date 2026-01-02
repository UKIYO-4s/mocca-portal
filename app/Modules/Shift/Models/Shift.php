<?php

namespace App\Modules\Shift\Models;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Shift extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\ShiftFactory::new();
    }
    protected $fillable = [
        'user_id',
        'date',
        'status',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    /**
     * Get the user assigned to this shift.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who created this shift.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to filter shifts by user ID.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter shifts by specific date.
     */
    public function scopeForDate($query, $date)
    {
        $carbonDate = $date instanceof Carbon ? $date : Carbon::parse($date);
        return $query->whereDate('date', $carbonDate);
    }

    /**
     * Scope to filter shifts by date range.
     */
    public function scopeForDateRange($query, $start, $end)
    {
        $startDate = $start instanceof Carbon ? $start : Carbon::parse($start);
        $endDate = $end instanceof Carbon ? $end : Carbon::parse($end);

        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeWorking($query)
    {
        return $query->where('status', 'working');
    }

    /**
     * Scope to filter by off status.
     */
    public function scopeOff($query)
    {
        return $query->where('status', 'off');
    }

    /**
     * Bulk update shifts for a user in a month.
     *
     * @param int $userId Target user ID
     * @param string $yearMonth Year-month in YYYY-MM format
     * @param string $defaultMode Default status ('working' or 'off')
     * @param array $exceptionDates Array of exception dates (YYYY-MM-DD format)
     * @param int $createdBy User ID who is making the update
     */
    public static function bulkUpdateMonth(
        int $userId,
        string $yearMonth,
        string $defaultMode,
        array $exceptionDates,
        int $createdBy
    ): void {
        $month = Carbon::parse($yearMonth . '-01');
        $startOfMonth = $month->copy()->startOfMonth();
        $endOfMonth = $month->copy()->endOfMonth();

        // Determine opposite status
        $oppositeStatus = $defaultMode === 'working' ? 'off' : 'working';

        // Convert exception dates to Carbon for comparison
        $exceptionSet = collect($exceptionDates)->map(fn($d) => Carbon::parse($d)->format('Y-m-d'))->flip();

        DB::transaction(function () use ($userId, $startOfMonth, $endOfMonth, $defaultMode, $oppositeStatus, $exceptionSet, $createdBy) {
            // Delete existing shifts for this user in this month
            static::where('user_id', $userId)
                ->whereBetween('date', [$startOfMonth, $endOfMonth])
                ->delete();

            // Create new shifts for each day in the month
            $shiftsToInsert = [];
            $current = $startOfMonth->copy();
            $now = now();

            while ($current <= $endOfMonth) {
                $dateStr = $current->format('Y-m-d');
                $status = $exceptionSet->has($dateStr) ? $oppositeStatus : $defaultMode;

                $shiftsToInsert[] = [
                    'user_id' => $userId,
                    'date' => $dateStr,
                    'status' => $status,
                    'created_by' => $createdBy,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $current->addDay();
            }

            // Bulk insert
            static::insert($shiftsToInsert);
        });
    }

    /**
     * Get user's shift data for a month with default mode inference.
     *
     * @return array{default_mode: string, exception_dates: array}
     */
    public static function getMonthDataForUser(int $userId, string $yearMonth): array
    {
        $month = Carbon::parse($yearMonth . '-01');
        $startOfMonth = $month->copy()->startOfMonth();
        $endOfMonth = $month->copy()->endOfMonth();

        $shifts = static::where('user_id', $userId)
            ->whereBetween('date', [$startOfMonth, $endOfMonth])
            ->get()
            ->keyBy(fn($s) => $s->date->format('Y-m-d'));

        $workingDays = $shifts->where('status', 'working')->count();
        $offDays = $shifts->where('status', 'off')->count();

        // Infer default mode based on majority
        if ($workingDays >= $offDays) {
            $defaultMode = 'working';
            $exceptionDates = $shifts->where('status', 'off')->keys()->values()->toArray();
        } else {
            $defaultMode = 'off';
            $exceptionDates = $shifts->where('status', 'working')->keys()->values()->toArray();
        }

        return [
            'default_mode' => $defaultMode,
            'exception_dates' => $exceptionDates,
            'working_count' => $workingDays,
            'off_count' => $offDays,
        ];
    }
}
