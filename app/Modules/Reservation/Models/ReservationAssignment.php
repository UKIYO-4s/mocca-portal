<?php

namespace App\Modules\Reservation\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReservationAssignment extends Model
{
    protected $fillable = [
        'reservation_id',
        'assignment_type',
        'user_id',
        'reminder_sent_day_before',
        'reminder_sent_day_of',
    ];

    protected $casts = [
        'reminder_sent_day_before' => 'boolean',
        'reminder_sent_day_of' => 'boolean',
    ];

    /**
     * Get the reservation this assignment belongs to.
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(BanshirouReservation::class, 'reservation_id');
    }

    /**
     * Get the assigned user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get assignment type label in Japanese.
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->assignment_type) {
            'cleaning' => '掃除',
            'setup' => 'セット',
            default => $this->assignment_type,
        };
    }

    /**
     * Scope to get cleaning assignments.
     */
    public function scopeCleaning($query)
    {
        return $query->where('assignment_type', 'cleaning');
    }

    /**
     * Scope to get setup assignments.
     */
    public function scopeSetup($query)
    {
        return $query->where('assignment_type', 'setup');
    }

    /**
     * Scope to get assignments for a specific user.
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope to get assignments needing day-before reminder.
     */
    public function scopeNeedsDayBeforeReminder($query)
    {
        return $query->where('reminder_sent_day_before', false);
    }

    /**
     * Scope to get assignments needing day-of reminder.
     */
    public function scopeNeedsDayOfReminder($query)
    {
        return $query->where('reminder_sent_day_of', false);
    }

    /**
     * Mark day-before reminder as sent.
     */
    public function markDayBeforeReminderSent(): void
    {
        $this->update(['reminder_sent_day_before' => true]);
    }

    /**
     * Mark day-of reminder as sent.
     */
    public function markDayOfReminderSent(): void
    {
        $this->update(['reminder_sent_day_of' => true]);
    }
}
