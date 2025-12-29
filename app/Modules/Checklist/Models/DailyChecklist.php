<?php

namespace App\Modules\Checklist\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyChecklist extends Model
{
    protected $fillable = [
        'template_id',
        'date',
        'created_by',
        'completed_at',
    ];

    protected $casts = [
        'date' => 'date',
        'completed_at' => 'datetime',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DailyChecklistEntry::class, 'daily_checklist_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getCompletionRateAttribute(): float
    {
        $totalItems = $this->template->items()->count();
        if ($totalItems === 0) {
            return 100.0;
        }

        $completedItems = $this->entries()->whereNotNull('completed_at')->count();
        return round(($completedItems / $totalItems) * 100, 1);
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }

    public function checkCompletion(): void
    {
        $totalItems = $this->template->items()->count();
        $completedItems = $this->entries()->whereNotNull('completed_at')->count();

        if ($totalItems > 0 && $completedItems === $totalItems) {
            $this->update(['completed_at' => now()]);
        } else {
            $this->update(['completed_at' => null]);
        }
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('date', $date);
    }

    public function scopeForTemplate($query, int $templateId)
    {
        return $query->where('template_id', $templateId);
    }
}
