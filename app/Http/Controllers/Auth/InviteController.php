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
                'invitee_name' => $invite->invitee_name,
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

        // バリデーションルール（emailは招待に無い場合のみ必須）
        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ];

        $messages = [
            'name.required' => '名前を入力してください',
            'password.required' => 'パスワードを入力してください',
            'password.confirmed' => 'パスワードが一致しません',
        ];

        // 招待にメールが無い場合はフォームから取得
        if (!$invite->email) {
            $rules['email'] = ['required', 'string', 'email', 'max:255', 'unique:users,email'];
            $messages['email.required'] = 'メールアドレスを入力してください';
            $messages['email.email'] = '正しいメールアドレスを入力してください';
            $messages['email.unique'] = 'このメールアドレスは既に登録されています';
        }

        $validated = $request->validate($rules, $messages);

        // トランザクションでユーザー作成と招待更新を行う
        $user = \DB::transaction(function () use ($validated, $invite) {
            // ユーザー作成（メールは招待から取得、無ければフォームから）
            $user = User::create([
                'name' => $validated['name'],
                'email' => $invite->email ?? $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $invite->role,
            ]);

            // 招待を使用済みにする
            $invite->markAsUsed();

            return $user;
        });

        event(new Registered($user));

        // ログインしてからアクティビティログを記録（Auth::id()が必要なため）
        Auth::login($user);

        $this->activityLog->log(
            'user',
            'registered_via_invite',
            $user,
            "招待から登録: {$user->name} ({$invite->role_label})"
        );

        return redirect()->route('dashboard')->with('success', '登録が完了しました。ようこそ！');
    }
}
