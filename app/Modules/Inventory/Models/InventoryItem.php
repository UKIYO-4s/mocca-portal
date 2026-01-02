<?php

namespace App\Modules\Inventory\Models;

use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    use HasFactory;

    protected static function newFactory()
    {
        return \Database\Factories\InventoryItemFactory::new();
    }

    protected $fillable = [
        'location_id',
        'name',
        'unit',
        'current_stock',
        'reorder_point',
        'reorder_notified_at',
        'is_active',
    ];

    protected $casts = [
        'current_stock' => 'integer',
        'reorder_point' => 'integer',
        'reorder_notified_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function logs(): HasMany
    {
        return $this->hasMany(InventoryLog::class, 'item_id')->orderByDesc('created_at');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForLocation($query, ?int $locationId)
    {
        return $query->where('location_id', $locationId);
    }

    public function scopeLowStock($query)
    {
        return $query->whereColumn('current_stock', '<=', 'reorder_point');
    }

    /**
     * Check if the item needs to be reordered.
     */
    public function needsReorder(): bool
    {
        return $this->current_stock <= $this->reorder_point;
    }

    /**
     * Adjust stock and create a log entry.
     *
     * @param int $quantity The quantity to adjust (positive or negative based on type)
     * @param string $type The type of adjustment: 'usage', 'restock', or 'adjustment'
     * @param int $userId The ID of the user making the adjustment
     * @param string|null $notes Optional notes for the log entry
     * @return InventoryLog
     */
    public function adjustStock(int $quantity, string $type, int $userId, ?string $notes = null): InventoryLog
    {
        // Determine quantity change based on type
        $quantityChange = match ($type) {
            'usage' => -abs($quantity),
            'restock' => abs($quantity),
            'adjustment' => $quantity,
            default => $quantity,
        };

        // Update current stock
        $this->current_stock += $quantityChange;
        $this->save();

        // Create log entry
        return $this->logs()->create([
            'type' => $type,
            'quantity_change' => $quantityChange,
            'notes' => $notes,
            'user_id' => $userId,
        ]);
    }
}
