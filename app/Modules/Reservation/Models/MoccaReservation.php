<?php

namespace App\Modules\Reservation\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MoccaReservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'reservation_type',
        'reservation_date',
        'name',
        'guest_count',
        'arrival_time',
        'phone',
        'advance_menu',
        'notes',
        'banshirou_reservation_id',
        'created_by',
        'status',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'arrival_time' => 'datetime:H:i',
    ];

    /**
     * Get the user who created this reservation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the linked Banshirou reservation (if any).
     */
    public function banshirouReservation(): BelongsTo
    {
        return $this->belongsTo(BanshirouReservation::class, 'banshirou_reservation_id');
    }

    /**
     * Check if this is linked to a Banshirou reservation.
     */
    public function isLinkedToBanshirou(): bool
    {
        return $this->banshirou_reservation_id !== null;
    }

    /**
     * Get reservation type label in Japanese.
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->reservation_type) {
            'breakfast' => '朝食',
            'lunch' => '昼食',
            'dinner' => '夕食',
            default => $this->reservation_type,
        };
    }

    /**
     * Get status label in Japanese.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'confirmed' => '確定',
            'cancelled' => 'キャンセル',
            default => $this->status,
        };
    }

    /**
     * Format phone for display (with hyphens).
     */
    public function getFormattedPhoneAttribute(): ?string
    {
        if (!$this->phone) {
            return null;
        }

        $phone = preg_replace('/[^0-9]/', '', $this->phone);

        if (strlen($phone) === 11 && str_starts_with($phone, '0')) {
            return substr($phone, 0, 3) . '-' . substr($phone, 3, 4) . '-' . substr($phone, 7);
        } elseif (strlen($phone) === 10 && str_starts_with($phone, '0')) {
            if (in_array(substr($phone, 0, 2), ['03', '06', '04'])) {
                return substr($phone, 0, 2) . '-' . substr($phone, 2, 4) . '-' . substr($phone, 6);
            }
            return substr($phone, 0, 4) . '-' . substr($phone, 4, 2) . '-' . substr($phone, 6);
        }

        return $this->phone;
    }

    /**
     * Get phone link for click-to-call.
     */
    public function getPhoneLinkAttribute(): ?string
    {
        if (!$this->phone) {
            return null;
        }
        return 'tel:' . preg_replace('/[^0-9]/', '', $this->phone);
    }

    /**
     * Format arrival time for display.
     */
    public function getFormattedArrivalTimeAttribute(): ?string
    {
        if (!$this->arrival_time) {
            return null;
        }
        return $this->arrival_time->format('H:i');
    }

    /**
     * Scope to get confirmed reservations.
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Scope to get reservations for a specific date.
     */
    public function scopeForDate($query, $date)
    {
        return $query->whereDate('reservation_date', $date);
    }

    /**
     * Scope to get reservations by type.
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('reservation_type', $type);
    }

    /**
     * Scope to get reservations within a date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('reservation_date', [$startDate, $endDate]);
    }
}
