<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invite;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InvitesController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * 招待一覧
     */
    public function index(): Response
    {
        $invites = Invite::with('creator:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($invite) {
                return [
                    'id' => $invite->id,
                    'invitee_name' => $invite->invitee_name,
                    'email' => $invite->email,
                    'role' => $invite->role,
                    'role_label' => $invite->role_label,
                    'token' => $invite->token,
                    'invite_url' => $invite->invite_url,
                    'expires_at' => $invite->expires_at?->format('Y-m-d H:i'),
                    'used_at' => $invite->used_at?->format('Y-m-d H:i'),
                    'status' => $invite->status,
                    'status_label' => $invite->status_label,
                    'creator' => $invite->creator,
                    'created_at' => $invite->created_at->format('Y-m-d H:i'),
                ];
            });

        return Inertia::render('Admin/Invites/Index', [
            'invites' => $invites,
        ]);
    }

    /**
     * 招待を発行
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invitee_name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'role' => ['required', Rule::in(['admin', 'manager', 'staff'])],
            'expires_in' => ['required', Rule::in(['7', '30', 'never'])],
        ], [
            'invitee_name.required' => '招待者名を入力してください',
            'email.email' => '正しいメールアドレスを入力してください',
            'role.required' => 'ロールを選択してください',
            'role.in' => '正しいロールを選択してください',
            'expires_in.required' => '有効期限を選択してください',
        ]);

        // 有効期限を計算
        $expiresAt = match ($validated['expires_in']) {
            '7' => now()->addDays(7),
            '30' => now()->addDays(30),
            'never' => null,
        };

        $invite = Invite::create([
            'invitee_name' => $validated['invitee_name'],
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'],
            'token' => Invite::generateToken(),
            'expires_at' => $expiresAt,
            'created_by' => Auth::id(),
        ]);

        $this->activityLog->logCreated(
            'invite',
            $invite,
            "招待リンク発行: {$validated['invitee_name']} ({$invite->role_label})"
        );

        return back()->with([
            'success' => '招待リンクを発行しました',
            'created_invite' => [
                'id' => $invite->id,
                'invitee_name' => $invite->invitee_name,
                'invite_url' => $invite->invite_url,
                'role_label' => $invite->role_label,
            ],
        ]);
    }

    /**
     * 招待を無効化
     */
    public function destroy(Invite $invite)
    {
        // 既に使用済みの場合は削除不可
        if ($invite->used_at !== null) {
            return back()->with('error', '使用済みの招待は削除できません');
        }

        $inviteeName = $invite->invitee_name;
        $invite->delete();

        $this->activityLog->log(
            'invite',
            'deleted',
            null,
            "招待リンク無効化: {$inviteeName}"
        );

        return back()->with('success', '招待リンクを無効化しました');
    }
}
