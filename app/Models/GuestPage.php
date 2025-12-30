<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GuestPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'reservation_id',
        'reservation_type',
        'guest_name',
        'room_number',
        'check_in_date',
        'check_out_date',
        'qr_code_path',
        'is_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date:Y-m-d',
            'check_out_date' => 'date:Y-m-d',
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid()->toString();
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Get staff assignments for this guest page.
     */
    public function staffAssignments(): HasMany
    {
        return $this->hasMany(GuestStaffAssignment::class);
    }

    /**
     * Get tip transactions for this guest page.
     */
    public function tipTransactions(): HasMany
    {
        return $this->hasMany(TipTransaction::class);
    }

    /**
     * Get google review requests for this guest page.
     */
    public function googleReviewRequests(): HasMany
    {
        return $this->hasMany(GoogleReviewRequest::class);
    }

    /**
     * Get the associated Banshirou reservation.
     */
    public function banshirouReservation(): BelongsTo
    {
        return $this->belongsTo(
            \App\Modules\Reservation\Models\BanshirouReservation::class,
            'reservation_id'
        )->where('reservation_type', 'banshirou');
    }

    /**
     * Get the associated Mocca reservation.
     */
    public function moccaReservation(): BelongsTo
    {
        return $this->belongsTo(
            \App\Modules\Reservation\Models\MoccaReservation::class,
            'reservation_id'
        )->where('reservation_type', 'mocca');
    }

    /**
     * Scope for active pages.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /**
     * Scope for expired pages.
     */
    public function scopeExpired($query)
    {
        return $query->where(function ($q) {
            $q->where('is_active', false)
                ->orWhere('expires_at', '<=', now());
        });
    }

    /**
     * Check if the page is expired.
     */
    public function isExpired(): bool
    {
        if (!$this->is_active) {
            return true;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            return true;
        }

        return false;
    }

    /**
     * Get assigned staff with their wallet information.
     */
    public function getAssignedStaffWithWallets()
    {
        return $this->staffAssignments()
            ->with(['staff.wallet'])
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->staff->id,
                    'name' => $assignment->staff->name,
                    'avatar' => $assignment->staff->avatar_url,
                    'role' => $assignment->role,
                    'wallet_address' => $assignment->staff->wallet?->wallet_address,
                ];
            });
    }
}
