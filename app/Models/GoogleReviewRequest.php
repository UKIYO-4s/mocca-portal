<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoogleReviewRequest extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'guest_page_id',
        'clicked_at',
        'ip_address',
        'review_submitted',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'clicked_at' => 'datetime',
            'review_submitted' => 'boolean',
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Get the guest page for this review request.
     */
    public function guestPage(): BelongsTo
    {
        return $this->belongsTo(GuestPage::class);
    }

    /**
     * Scope for submitted reviews.
     */
    public function scopeSubmitted($query)
    {
        return $query->where('review_submitted', true);
    }

    /**
     * Scope for pending reviews (clicked but not submitted).
     */
    public function scopePending($query)
    {
        return $query->where('review_submitted', false);
    }

    /**
     * Mark as submitted.
     */
    public function markAsSubmitted(): bool
    {
        return $this->update([
            'review_submitted' => true,
            'submitted_at' => now(),
        ]);
    }
}
