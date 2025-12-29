<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuestStaffAssignment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'guest_page_id',
        'staff_id',
        'role',
        'assigned_at',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
        ];
    }

    /**
     * Get the guest page this assignment belongs to.
     */
    public function guestPage(): BelongsTo
    {
        return $this->belongsTo(GuestPage::class);
    }

    /**
     * Get the staff member for this assignment.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    /**
     * Get role label in Japanese.
     */
    public function getRoleLabelAttribute(): string
    {
        return match ($this->role) {
            'cooking' => '料理担当',
            'cleaning' => '清掃担当',
            'front' => 'フロント担当',
            default => $this->role,
        };
    }

    /**
     * Scope by role.
     */
    public function scopeOfRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
