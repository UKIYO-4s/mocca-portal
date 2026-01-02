<?php

namespace App\Modules\Checklist\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DailyChecklist extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\DailyChecklistFactory::new();
    }
    protected $fillable = [
        'template_id',
        'date',
        'created_by',
        'completed_at',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
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
        // 防御的プログラミング: templateがnullの場合は100%を返す
        $totalItems = $this->template?->items()->count() ?? 0;
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
        // 防御的プログラミング: templateがnullの場合は何もしない
        $totalItems = $this->template?->items()->count() ?? 0;
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
