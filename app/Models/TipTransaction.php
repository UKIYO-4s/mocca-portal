<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TipTransaction extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'guest_page_id',
        'staff_id',
        'transaction_hash',
        'network',
        'tip_count',
        'ip_address',
        'user_agent',
        'tipped_at',
    ];

    protected function casts(): array
    {
        return [
            'tip_count' => 'integer',
            'tipped_at' => 'datetime',
        ];
    }

    /**
     * Get the guest page for this transaction.
     */
    public function guestPage(): BelongsTo
    {
        return $this->belongsTo(GuestPage::class);
    }

    /**
     * Get the staff member who received the tip.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Get Polygonscan URL for the transaction.
     */
    public function getPolygonscanUrlAttribute(): string
    {
        return "https://polygonscan.com/tx/{$this->transaction_hash}";
    }

    /**
     * Check if tip is from same IP within time limit.
     */
    public static function recentTipCount(string $ipAddress, int $staffId, int $hoursLimit = 24): int
    {
        return static::where('ip_address', $ipAddress)
            ->where('staff_id', $staffId)
            ->where('tipped_at', '>=', now()->subHours($hoursLimit))
            ->count();
    }

    /**
     * Check if user can tip (rate limiting).
     */
    public static function canTip(string $ipAddress, int $staffId, int $maxTips = 5, int $hoursLimit = 24): bool
    {
        return static::recentTipCount($ipAddress, $staffId, $hoursLimit) < $maxTips;
    }

    /**
     * Get remaining tips allowed.
     */
    public static function remainingTips(string $ipAddress, int $staffId, int $maxTips = 5, int $hoursLimit = 24): int
    {
        $count = static::recentTipCount($ipAddress, $staffId, $hoursLimit);
        return max(0, $maxTips - $count);
    }

    /**
     * Scope for tips to a specific staff member.
     */
    public function scopeForStaff($query, int $staffId)
    {
        return $query->where('staff_id', $staffId);
    }

    /**
     * Scope for tips within a date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('tipped_at', [$startDate, $endDate]);
    }

    /**
     * Scope for tips this month.
     */
    public function scopeThisMonth($query)
    {
        return $query->whereMonth('tipped_at', now()->month)
            ->whereYear('tipped_at', now()->year);
    }
}
