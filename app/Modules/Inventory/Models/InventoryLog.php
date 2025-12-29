<?php

namespace App\Modules\Inventory\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLog extends Model
{
    /**
     * Type label constants for Japanese localization.
     */
    public const TYPE_LABELS = [
        'usage' => '使用',
        'restock' => '補充',
        'adjustment' => '調整',
    ];

    protected $fillable = [
        'item_id',
        'type',
        'quantity_change',
        'notes',
        'user_id',
    ];

    protected $casts = [
        'type' => 'string',
        'quantity_change' => 'integer',
    ];

    /**
     * Get the inventory item this log belongs to.
     */
    public function item(): BelongsTo
    {
        return $this->belongsTo(InventoryItem::class, 'item_id');
    }

    /**
     * Get the user who made this log entry.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the Japanese label for the log type.
     */
    public function getTypeLabelAttribute(): string
    {
        return self::TYPE_LABELS[$this->type] ?? $this->type;
    }

    /**
     * Scope to filter by log type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter by inventory item.
     */
    public function scopeForItem($query, int $itemId)
    {
        return $query->where('item_id', $itemId);
    }

    /**
     * Scope to get recent logs, ordered by created_at descending.
     */
    public function scopeRecent($query)
    {
        return $query->orderByDesc('created_at');
    }
}
