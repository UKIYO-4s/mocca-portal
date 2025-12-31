<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get inventory items for this location.
     */
    public function inventoryItems(): HasMany
    {
        return $this->hasMany(\App\Modules\Inventory\Models\InventoryItem::class);
    }

    // Note: shifts() relationship removed - shifts table no longer has location_id
    // as of migration 2025_12_30_020405_simplify_shifts_table

    /**
     * Scope to get only active locations.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get the route key name for model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
