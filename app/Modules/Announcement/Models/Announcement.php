<?php

namespace App\Modules\Announcement\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Auth;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'content',
        'priority',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'priority' => 'string',
    ];

    protected $appends = ['is_read'];

    /**
     * Get the author who created this announcement.
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the read records for this announcement.
     */
    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    /**
     * Scope to get only published announcements.
     */
    public function scopePublished($query)
    {
        return $query->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * Scope to filter by priority.
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Check if the announcement is published.
     */
    public function isPublished(): bool
    {
        return $this->published_at !== null && $this->published_at->lte(now());
    }

    /**
     * Check if the announcement is a draft.
     */
    public function isDraft(): bool
    {
        return $this->published_at === null;
    }

    /**
     * Check if the announcement has been read by a specific user.
     */
    public function isReadBy(User $user): bool
    {
        return $this->reads()->where('user_id', $user->id)->exists();
    }

    /**
     * Get the is_read attribute for the authenticated user.
     * Uses pre-loaded value from withExists if available to avoid N+1.
     */
    public function getIsReadAttribute(): bool
    {
        // If already loaded via withExists, use that value
        if (array_key_exists('is_read', $this->attributes)) {
            return (bool) $this->attributes['is_read'];
        }

        // Fallback for single model access (e.g., show page)
        $user = Auth::user();

        if (!$user) {
            return false;
        }

        return $this->isReadBy($user);
    }
}
