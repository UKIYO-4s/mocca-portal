<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Redirect to Google OAuth.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle Google OAuth callback.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            return redirect()->route('login')
                ->with('error', 'Google認証に失敗しました。もう一度お試しください。');
        }

        // Check if user already exists with this Google ID
        $user = User::where('google_id', $googleUser->getId())->first();

        if ($user) {
            // Existing Google user - log them in
            Auth::login($user, true);

            $this->activityLog->log(
                'auth',
                'login',
                $user,
                "Google認証でログイン: {$user->email}"
            );

            return redirect()->intended(route('dashboard'));
        }

        // Check if user exists with this email (link accounts)
        $existingUser = User::where('email', $googleUser->getEmail())->first();

        if ($existingUser) {
            // Link Google account to existing user
            $existingUser->update([
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
            ]);

            Auth::login($existingUser, true);

            $this->activityLog->log(
                'auth',
                'google_linked',
                $existingUser,
                "Googleアカウント連携: {$existingUser->email}"
            );

            return redirect()->intended(route('dashboard'))
                ->with('success', 'Googleアカウントを連携しました。');
        }

        // New user - this is an invite-only system, so we can't create new accounts
        // Store the Google user info in session and redirect to a registration page
        // For now, we'll show an error since new registrations should be invite-only
        return redirect()->route('login')
            ->with('error', 'このメールアドレスはシステムに登録されていません。管理者に招待を依頼してください。');
    }
}
