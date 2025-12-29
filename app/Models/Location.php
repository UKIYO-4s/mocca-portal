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

    /**
     * Get shifts for this location.
     */
    public function shifts(): HasMany
    {
        return $this->hasMany(\App\Modules\Shift\Models\Shift::class);
    }

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
