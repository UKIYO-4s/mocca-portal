<?php

namespace App\Http\Controllers;

use App\Models\StaffWallet;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StaffWalletController extends Controller
{
    /**
     * Show the wallet edit form.
     */
    public function edit(): Response
    {
        $user = Auth::user();
        $wallet = $user->wallet;

        return Inertia::render('Profile/Wallet', [
            'wallet' => $wallet ? [
                'wallet_address' => $wallet->wallet_address,
                'short_address' => $wallet->short_address,
                'is_verified' => $wallet->is_verified,
                'connected_at' => $wallet->connected_at?->format('Y-m-d H:i'),
            ] : null,
        ]);
    }

    /**
     * Update the wallet address.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'wallet_address' => [
                'required',
                'string',
                'size:42',
                'regex:/^0x[a-fA-F0-9]{40}$/',
                function ($attribute, $value, $fail) {
                    $existingWallet = StaffWallet::where('wallet_address', strtolower($value))
                        ->where('user_id', '!=', Auth::id())
                        ->first();
                    if ($existingWallet) {
                        $fail('This wallet address is already registered by another user.');
                    }
                },
            ],
        ], [
            'wallet_address.required' => 'ウォレットアドレスを入力してください。',
            'wallet_address.size' => 'ウォレットアドレスは42文字である必要があります。',
            'wallet_address.regex' => '有効なEthereumアドレスを入力してください。',
        ]);

        $user = Auth::user();

        $wallet = StaffWallet::updateOrCreate(
            ['user_id' => $user->id],
            [
                'wallet_address' => strtolower($validated['wallet_address']),
                'is_verified' => false,
                'connected_at' => now(),
            ]
        );

        return redirect()
            ->route('profile.wallet')
            ->with('success', 'ウォレットアドレスを更新しました。');
    }

    /**
     * Remove the wallet.
     */
    public function destroy(): RedirectResponse
    {
        $user = Auth::user();

        if ($user->wallet) {
            $user->wallet->delete();
        }

        return redirect()
            ->route('profile.wallet')
            ->with('success', 'ウォレットアドレスを削除しました。');
    }

    /**
     * Admin view of all staff wallets.
     */
    public function adminIndex(): Response
    {
        $staffWithWallets = User::with('wallet')
            ->whereIn('role', ['staff', 'manager', 'admin'])
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'wallet' => $user->wallet ? [
                        'wallet_address' => $user->wallet->wallet_address,
                        'short_address' => $user->wallet->short_address,
                        'is_verified' => $user->wallet->is_verified,
                        'connected_at' => $user->wallet->connected_at?->format('Y-m-d H:i'),
                    ] : null,
                ];
            });

        return Inertia::render('Admin/StaffWallets', [
            'staff' => $staffWithWallets,
        ]);
    }
}
