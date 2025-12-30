<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Invite extends Model
{
    protected $fillable = [
        'invitee_name',
        'email',
        'role',
        'token',
        'expires_at',
        'used_at',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    /**
     * 招待を作成したAdmin
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * トークンを生成
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('token', $token)->exists());

        return $token;
    }

    /**
     * 有効な招待かチェック
     */
    public function isValid(): bool
    {
        // 使用済み
        if ($this->used_at !== null) {
            return false;
        }

        // 期限切れ
        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * ステータスを取得
     */
    public function getStatusAttribute(): string
    {
        if ($this->used_at !== null) {
            return 'used';
        }

        if ($this->expires_at !== null && $this->expires_at->isPast()) {
            return 'expired';
        }

        return 'active';
    }

    /**
     * ステータスラベルを取得
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            'used' => '使用済み',
            'expired' => '期限切れ',
            'active' => '有効',
            default => '不明',
        };
    }

    /**
     * ロールラベルを取得
     */
    public function getRoleLabelAttribute(): string
    {
        return match ($this->role) {
            'admin' => '管理者',
            'manager' => 'マネージャー',
            'staff' => 'スタッフ',
            default => $this->role,
        };
    }

    /**
     * 招待URLを取得
     */
    public function getInviteUrlAttribute(): string
    {
        return url("/invite/{$this->token}");
    }

    /**
     * 使用済みにする
     */
    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    /**
     * 有効な招待のみを取得
     */
    public function scopeActive($query)
    {
        return $query->whereNull('used_at')
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }
}
