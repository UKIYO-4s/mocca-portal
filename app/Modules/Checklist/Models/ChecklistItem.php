<?php

namespace App\Modules\Checklist\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChecklistItem extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\ChecklistItemFactory::new();
    }
    protected $fillable = [
        'template_id',
        'description',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(ChecklistTemplate::class, 'template_id');
    }

    public function entries(): HasMany
    {
        return $this->hasMany(DailyChecklistEntry::class, 'checklist_item_id');
    }
}
