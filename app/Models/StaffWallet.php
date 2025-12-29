<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffWallet extends Model
{
    protected $fillable = [
        'user_id',
        'wallet_address',
        'is_verified',
        'verification_tx_hash',
        'connected_at',
    ];

    protected function casts(): array
    {
        return [
            'is_verified' => 'boolean',
            'connected_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the wallet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for verified wallets.
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Get shortened wallet address for display.
     */
    public function getShortAddressAttribute(): string
    {
        if (strlen($this->wallet_address) < 10) {
            return $this->wallet_address;
        }

        return substr($this->wallet_address, 0, 6) . '...' . substr($this->wallet_address, -4);
    }

    /**
     * Validate Ethereum address format.
     */
    public static function isValidAddress(string $address): bool
    {
        return preg_match('/^0x[a-fA-F0-9]{40}$/', $address) === 1;
    }
}
