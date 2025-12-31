<?php

namespace App\Modules\Reservation\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BanshirouReservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_kana',
        'phone',
        'email',
        'address',
        'checkin_date',
        'checkin_time',
        'checkout_date',
        'guest_count_adults',
        'guest_count_children',
        'meal_option',
        'pickup_required',
        'options',
        'payment_method',
        'notes',
        'created_by',
        'status',
    ];

    protected $casts = [
        'checkin_date' => 'date:Y-m-d',
        'checkout_date' => 'date:Y-m-d',
        'pickup_required' => 'boolean',
        'options' => 'array',
    ];

    /**
     * Get the user who created this reservation.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get all assignments for this reservation.
     */
    public function assignments(): HasMany
    {
        return $this->hasMany(ReservationAssignment::class, 'reservation_id');
    }

    /**
     * Get the cleaning assignment.
     */
    public function cleaningAssignment(): HasOne
    {
        return $this->hasOne(ReservationAssignment::class, 'reservation_id')
            ->where('assignment_type', 'cleaning');
    }

    /**
     * Get the setup assignment.
     */
    public function setupAssignment(): HasOne
    {
        return $this->hasOne(ReservationAssignment::class, 'reservation_id')
            ->where('assignment_type', 'setup');
    }

    /**
     * Get related Mocca reservations.
     */
    public function moccaReservations(): HasMany
    {
        return $this->hasMany(MoccaReservation::class, 'banshirou_reservation_id');
    }

    /**
     * Get total guest count.
     */
    public function getTotalGuestsAttribute(): int
    {
        return $this->guest_count_adults + $this->guest_count_children;
    }

    /**
     * Get number of nights.
     */
    public function getNightsAttribute(): int
    {
        return $this->checkin_date->diffInDays($this->checkout_date);
    }

    /**
     * Format phone for display (with hyphens).
     */
    public function getFormattedPhoneAttribute(): string
    {
        $phone = preg_replace('/[^0-9]/', '', $this->phone);

        // Format as Japanese phone number
        if (strlen($phone) === 11 && str_starts_with($phone, '0')) {
            // Mobile: 090-1234-5678
            return substr($phone, 0, 3) . '-' . substr($phone, 3, 4) . '-' . substr($phone, 7);
        } elseif (strlen($phone) === 10 && str_starts_with($phone, '0')) {
            // Landline: 03-1234-5678 or 0123-45-6789
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
    public function getPhoneLinkAttribute(): string
    {
        return 'tel:' . preg_replace('/[^0-9]/', '', $this->phone);
    }

    /**
     * Scope to get confirmed reservations.
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    /**
     * Scope to get reservations checking in on a specific date.
     */
    public function scopeCheckingInOn($query, $date)
    {
        return $query->whereDate('checkin_date', $date);
    }

    /**
     * Scope to get reservations checking out on a specific date.
     */
    public function scopeCheckingOutOn($query, $date)
    {
        return $query->whereDate('checkout_date', $date);
    }

    /**
     * Scope to get reservations within a date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('checkin_date', [$startDate, $endDate])
              ->orWhereBetween('checkout_date', [$startDate, $endDate])
              ->orWhere(function ($q2) use ($startDate, $endDate) {
                  $q2->where('checkin_date', '<=', $startDate)
                     ->where('checkout_date', '>=', $endDate);
              });
        });
    }

    /**
     * Get meal option label in Japanese.
     */
    public function getMealOptionLabelAttribute(): string
    {
        return match($this->meal_option) {
            'with_meals' => '食事付き',
            'seat_only' => '席のみ',
            'no_meals' => '素泊まり',
            default => $this->meal_option,
        };
    }

    /**
     * Get payment method label in Japanese.
     */
    public function getPaymentMethodLabelAttribute(): string
    {
        return match($this->payment_method) {
            'cash' => '現金',
            'credit' => 'クレジットカード',
            'bank_transfer' => '銀行振込',
            default => $this->payment_method,
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
}
