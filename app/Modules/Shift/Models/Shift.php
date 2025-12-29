<?php

namespace App\Modules\Shift\Models;

use App\Models\Location;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shift extends Model
{
    protected $fillable = [
        'user_id',
        'location_id',
        'date',
        'start_time',
        'end_time',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];

    protected $appends = ['duration_minutes'];

    /**
     * Get the user assigned to this shift.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the location for this shift.
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
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
     * Scope to filter shifts by location ID.
     */
    public function scopeForLocation($query, int $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    /**
     * Get the shift duration in minutes.
     * Returns 0 if end_time <= start_time (invalid data per spec: no day-spanning shifts).
     */
    public function getDurationMinutesAttribute(): int
    {
        if (!$this->start_time || !$this->end_time) {
            return 0;
        }

        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);

        // Day-spanning shifts are not allowed per spec.
        // If end <= start, treat as invalid and return 0.
        if ($end->lte($start)) {
            return 0;
        }

        return $start->diffInMinutes($end);
    }

    /**
     * Check if this shift overlaps with another shift for the same user on the same date.
     * Day-spanning shifts (end <= start) are not allowed per spec and should be rejected
     * by validation before reaching this method.
     *
     * @return bool True if there is an overlap, false otherwise
     */
    public function hasOverlap(): bool
    {
        $start = Carbon::parse($this->start_time);
        $end = Carbon::parse($this->end_time);

        // Day-spanning shifts are invalid per spec - should not check overlap for invalid data
        if ($end->lte($start)) {
            return false; // Let validation handle this case
        }

        $query = static::query()
            ->where('user_id', $this->user_id)
            ->whereDate('date', $this->date);

        // Exclude current shift if it already exists in DB
        if ($this->exists) {
            $query->where('id', '!=', $this->id);
        }

        $existingShifts = $query->get();

        foreach ($existingShifts as $existing) {
            $existingStart = Carbon::parse($existing->start_time);
            $existingEnd = Carbon::parse($existing->end_time);

            // Skip invalid existing shifts (should not exist, but defensive)
            if ($existingEnd->lte($existingStart)) {
                continue;
            }

            // Check for overlap: shifts overlap if one starts before the other ends
            // and ends after the other starts
            if ($start->lt($existingEnd) && $end->gt($existingStart)) {
                return true;
            }
        }

        return false;
    }
}
