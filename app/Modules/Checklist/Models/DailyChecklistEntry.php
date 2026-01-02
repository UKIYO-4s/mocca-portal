<?php

namespace App\Modules\Checklist\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyChecklistEntry extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\DailyChecklistEntryFactory::new();
    }
    protected $fillable = [
        'daily_checklist_id',
        'checklist_item_id',
        'completed_at',
        'completed_by',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function dailyChecklist(): BelongsTo
    {
        return $this->belongsTo(DailyChecklist::class, 'daily_checklist_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(ChecklistItem::class, 'checklist_item_id');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function getIsCompletedAttribute(): bool
    {
        return $this->completed_at !== null;
    }

    public function toggle(int $userId): void
    {
        if ($this->completed_at) {
            $this->update([
                'completed_at' => null,
                'completed_by' => null,
            ]);
        } else {
            $this->update([
                'completed_at' => now(),
                'completed_by' => $userId,
            ]);
        }
    }
}
