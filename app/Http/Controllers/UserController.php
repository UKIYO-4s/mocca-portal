<?php

namespace App\Http\Controllers;

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

        return Inertia::render('Users/Index', [
            'users' => $users,
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
            $user->id,
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
            null,
            "ユーザー削除: {$userName} ({$userEmail})"
        );

        return back()->with('success', 'ユーザーを削除しました。');
    }
}
