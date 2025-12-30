<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Invite;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class InviteController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * 招待ページを表示
     */
    public function show(string $token): Response
    {
        $invite = Invite::where('token', $token)->first();

        // 招待が存在しない
        if (!$invite) {
            return Inertia::render('Auth/InviteExpired', [
                'reason' => 'not_found',
                'message' => '招待リンクが見つかりません',
            ]);
        }

        // 既に使用済み
        if ($invite->used_at !== null) {
            return Inertia::render('Auth/InviteExpired', [
                'reason' => 'used',
                'message' => 'この招待リンクは既に使用されています',
            ]);
        }

        // 期限切れ
        if ($invite->expires_at !== null && $invite->expires_at->isPast()) {
            return Inertia::render('Auth/InviteExpired', [
                'reason' => 'expired',
                'message' => 'この招待リンクは期限切れです',
            ]);
        }

        return Inertia::render('Auth/InviteRegister', [
            'invite' => [
                'email' => $invite->email,
                'role' => $invite->role,
                'role_label' => $invite->role_label,
                'token' => $invite->token,
            ],
        ]);
    }

    /**
     * 招待から登録
     */
    public function store(Request $request, string $token)
    {
        $invite = Invite::where('token', $token)->first();

        // 招待の有効性を再チェック
        if (!$invite || !$invite->isValid()) {
            return back()->withErrors([
                'token' => '招待リンクが無効です。管理者に再発行を依頼してください。',
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'name.required' => '名前を入力してください',
            'password.required' => 'パスワードを入力してください',
            'password.confirmed' => 'パスワードが一致しません',
        ]);

        // ユーザー作成（メールとロールは招待から固定）
        $user = User::create([
            'name' => $validated['name'],
            'email' => $invite->email,
            'password' => Hash::make($validated['password']),
            'role' => $invite->role,
        ]);

        // 招待を使用済みにする
        $invite->markAsUsed();

        $this->activityLog->log(
            'user',
            'registered_via_invite',
            $user,
            "招待から登録: {$user->name} ({$invite->role_label})"
        );

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route('dashboard');
    }
}
