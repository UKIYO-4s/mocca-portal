<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory;
    use Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'google_id',
        'avatar',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Check if user has 2FA enabled.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return !is_null($this->two_factor_confirmed_at);
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is manager
     */
    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    /**
     * Check if user is staff
     */
    public function isStaff(): bool
    {
        return $this->role === 'staff';
    }

    /**
     * Check if user has at least manager role
     */
    public function isAtLeastManager(): bool
    {
        return in_array($this->role, ['admin', 'manager']);
    }

    /**
     * Get the staff wallet for this user.
     */
    public function wallet(): HasOne
    {
        return $this->hasOne(StaffWallet::class);
    }

    /**
     * Get tips received by this user.
     */
    public function tipTransactions(): HasMany
    {
        return $this->hasMany(TipTransaction::class, 'staff_id');
    }

    /**
     * Get guest page assignments for this user.
     */
    public function guestAssignments(): HasMany
    {
        return $this->hasMany(GuestStaffAssignment::class, 'staff_id');
    }

    /**
     * Check if user has a registered wallet.
     */
    public function hasWallet(): bool
    {
        return $this->wallet()->exists();
    }

    /**
     * Get total tip count for this user.
     */
    public function getTotalTipCount(): int
    {
        return $this->tipTransactions()->sum('tip_count');
    }

    /**
     * Get tip count for current month.
     */
    public function getMonthlyTipCount(): int
    {
        return $this->tipTransactions()
            ->whereMonth('tipped_at', now()->month)
            ->whereYear('tipped_at', now()->year)
            ->sum('tip_count');
    }

    /**
     * Get the avatar URL.
     * Handles both external URLs (Google OAuth) and local file paths.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if (!$this->avatar) {
            return null;
        }

        // If it's already a full URL (Google OAuth), return as-is
        if (filter_var($this->avatar, FILTER_VALIDATE_URL)) {
            return $this->avatar;
        }

        // Otherwise, it's a local file path - return storage URL
        return Storage::disk('public')->url($this->avatar);
    }
}
