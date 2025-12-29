<?php

namespace App\Modules\TimeCard\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class TimeRecord extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'clock_in',
        'clock_out',
        'break_start',
        'break_end',
        'break_minutes',
        'notes',
        'modified_by',
        'modified_at',
    ];

    protected $casts = [
        'date' => 'date',
        'clock_in' => 'datetime',
        'clock_out' => 'datetime',
        'break_start' => 'datetime',
        'break_end' => 'datetime',
        'break_minutes' => 'integer',
        'modified_at' => 'datetime',
    ];

    protected $appends = ['status', 'work_minutes', 'modified_by_user'];

    /**
     * Get the user that owns this time record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the user who last modified this record.
     */
    public function modifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'modified_by');
    }

    /**
     * Scope to filter records by user ID.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to filter records by specific date.
     */
    public function scopeForDate($query, $date)
    {
        $carbonDate = $date instanceof Carbon ? $date : Carbon::parse($date);
        return $query->whereDate('date', $carbonDate);
    }

    /**
     * Scope to filter records by year and month.
     */
    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->whereYear('date', $year)
                     ->whereMonth('date', $month);
    }

    /**
     * Check if clock in has been recorded.
     */
    public function isClockInDone(): bool
    {
        return $this->clock_in !== null;
    }

    /**
     * Check if currently on break.
     */
    public function isOnBreak(): bool
    {
        return $this->break_start !== null && $this->break_end === null;
    }

    /**
     * Check if clock out has been recorded.
     */
    public function isClockOutDone(): bool
    {
        return $this->clock_out !== null;
    }

    /**
     * Calculate total work minutes (clock_out - clock_in - break_minutes).
     * Returns 0 if clock_in or clock_out is not set.
     */
    public function calculateWorkMinutes(): int
    {
        if (!$this->clock_in || !$this->clock_out) {
            return 0;
        }

        $totalMinutes = $this->clock_in->diffInMinutes($this->clock_out);
        $breakMinutes = $this->break_minutes ?? 0;

        return max(0, $totalMinutes - $breakMinutes);
    }

    /**
     * Get work minutes as an attribute (for JSON serialization).
     */
    public function getWorkMinutesAttribute(): int
    {
        return $this->calculateWorkMinutes();
    }

    /**
     * Get the current status of the time record.
     *
     * @return string 'not_started', 'working', 'on_break', 'completed'
     */
    public function getStatusAttribute(): string
    {
        if (!$this->isClockInDone()) {
            return 'not_started';
        }

        if ($this->isClockOutDone()) {
            return 'completed';
        }

        if ($this->isOnBreak()) {
            return 'on_break';
        }

        return 'working';
    }

    /**
     * Get the modified by user for JSON serialization.
     * Returns the user who last modified this record.
     */
    public function getModifiedByUserAttribute(): ?User
    {
        return $this->modifiedBy;
    }
}
