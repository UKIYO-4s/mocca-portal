<?php

namespace App\Http\Controllers;

use App\Models\Invite;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display a listing of users (Admin only).
     */
    public function index(): Response
    {
        $users = User::orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'avatar', 'created_at']);

        $invites = Invite::with('creator:id,name')
            ->latest()
            ->get()
            ->map(function ($invite) {
                $roleLabels = [
                    'admin' => '管理者',
                    'manager' => 'マネージャー',
                    'staff' => 'スタッフ',
                ];

                $statusLabels = [
                    'active' => '有効',
                    'used' => '使用済み',
                    'expired' => '期限切れ',
                ];

                $status = 'active';
                if ($invite->used_at) {
                    $status = 'used';
                } elseif ($invite->expires_at && $invite->expires_at->isPast()) {
                    $status = 'expired';
                }

                return [
                    'id' => $invite->id,
                    'email' => $invite->email,
                    'role' => $invite->role,
                    'role_label' => $roleLabels[$invite->role] ?? $invite->role,
                    'token' => $invite->token,
                    'invite_url' => route('invite.show', $invite->token),
                    'expires_at' => $invite->expires_at?->format('Y-m-d H:i'),
                    'used_at' => $invite->used_at?->format('Y-m-d H:i'),
                    'status' => $status,
                    'status_label' => $statusLabels[$status],
                    'creator' => $invite->creator,
                    'created_at' => $invite->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('Users/Index', [
            'users' => $users,
            'invites' => $invites,
        ]);
    }

    /**
     * Update the specified user's role (Admin only).
     */
    public function updateRole(Request $request, User $user)
    {
        // Prevent admin from demoting themselves
        if ($user->id === Auth::id()) {
            return back()->with('error', '自分自身の権限は変更できません。');
        }

        $validated = $request->validate([
            'role' => ['required', Rule::in(['admin', 'manager', 'staff'])],
        ]);

        $oldRole = $user->role;
        $user->update(['role' => $validated['role']]);

        $this->activityLog->log(
            'user',
            'role_changed',
            $user,
            "権限変更: {$user->name} ({$oldRole} → {$validated['role']})"
        );

        return back()->with('success', '権限を変更しました。');
    }

    /**
     * Remove the specified user (Admin only).
     */
    public function destroy(User $user)
    {
        // Prevent admin from deleting themselves
        if ($user->id === Auth::id()) {
            return back()->with('error', '自分自身は削除できません。');
        }

        $userName = $user->name;
        $userEmail = $user->email;

        $user->delete();

        $this->activityLog->log(
            'user',
            'deleted',
            null,
            "ユーザー削除: {$userName} ({$userEmail})"
        );

        return back()->with('success', 'ユーザーを削除しました。');
    }
}
