import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    avatar_url: string | null; // バックエンドから正しいURLを受け取る
    created_at: string;
}

interface Invite {
    id: number;
    email: string;
    role: string;
    role_label: string;
    token: string;
    invite_url: string;
    expires_at: string | null;
    used_at: string | null;
    status: 'active' | 'used' | 'expired';
    status_label: string;
    creator: { id: number; name: string };
    created_at: string;
}

interface Props extends PageProps {
    users: User[];
    invites: Invite[];
}

type TabType = 'users' | 'invites';

export default function Index({ auth, users, invites }: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('users');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        role: 'staff',
        expires_in: '7',
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'manager':
                return 'bg-blue-100 text-blue-800';
            case 'staff':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return '管理者';
            case 'manager':
                return 'マネージャー';
            case 'staff':
                return 'スタッフ';
            default:
                return role;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'used':
                return 'bg-blue-100 text-blue-800';
            case 'expired':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleRoleChange = (userId: number, newRole: string) => {
        setProcessingId(userId);
        router.patch(
            route('users.updateRole', userId),
            {
                role: newRole,
            },
            {
                onFinish: () => setProcessingId(null),
            },
        );
    };

    const handleDeleteUser = (user: User) => {
        if (
            confirm(
                `${user.name} さんを削除してもよろしいですか？\n\nこの操作は取り消せません。`,
            )
        ) {
            setProcessingId(user.id);
            router.delete(route('users.destroy', user.id), {
                onFinish: () => setProcessingId(null),
            });
        }
    };

    const handleInviteSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.invites.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleDeleteInvite = (invite: Invite) => {
        if (
            confirm(
                `${invite.email}への招待リンクを無効化してもよろしいですか？`,
            )
        ) {
            router.delete(route('admin.invites.destroy', invite.id));
        }
    };

    const copyToClipboard = async (invite: Invite) => {
        try {
            await navigator.clipboard.writeText(invite.invite_url);
            setCopiedId(invite.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            alert('コピーに失敗しました');
        }
    };

    const activeInvitesCount = invites.filter(
        (i) => i.status === 'active',
    ).length;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    ユーザー管理
                </h2>
            }
        >
            <Head title="ユーザー管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* タブ */}
                    <div className="mb-6 border-b border-gray-200">
                        <nav className="-mb-px flex gap-6">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                                    activeTab === 'users'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                ユーザー一覧
                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                    {users.length}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('invites')}
                                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${
                                    activeTab === 'invites'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                }`}
                            >
                                招待リンク
                                {activeInvitesCount > 0 && (
                                    <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">
                                        {activeInvitesCount}件有効
                                    </span>
                                )}
                            </button>
                        </nav>
                    </div>

                    {/* ユーザー一覧タブ */}
                    {activeTab === 'users' && (
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                            <div className="p-6">
                                <div className="mb-4 text-sm text-gray-500">
                                    登録ユーザー: {users.length}名
                                </div>

                                <div className="space-y-3">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className={`overflow-hidden rounded-lg border border-gray-200 p-4 ${
                                                processingId === user.id ? 'opacity-50' : ''
                                            }`}
                                        >
                                            {/* ユーザー情報行 */}
                                            <div className="flex min-w-0 items-center gap-3">
                                                {/* アバター - 条件レンダリングで404を防止 */}
                                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-base font-medium text-gray-600">
                                                    {user.avatar_url ? (
                                                        <img
                                                            src={user.avatar_url}
                                                            alt={user.name}
                                                            className="h-10 w-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        user.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>

                                                {/* 名前・メール */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="max-w-[150px] truncate font-medium text-gray-900 sm:max-w-none">
                                                            {user.name}
                                                        </span>
                                                        <span
                                                            className={`inline-flex flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getRoleBadgeColor(user.role)}`}
                                                        >
                                                            {getRoleLabel(user.role)}
                                                        </span>
                                                        {user.id === auth.user.id && (
                                                            <span className="flex-shrink-0 text-xs text-gray-400">
                                                                (自分)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="max-w-full truncate text-sm text-gray-500">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 操作ボタン行 - 縦積み固定 */}
                                            {user.id !== auth.user.id && (
                                                <div className="mt-3 flex w-full flex-col gap-2 border-t border-gray-100 pt-3">
                                                    <select
                                                        value={user.role}
                                                        onChange={(e) =>
                                                            handleRoleChange(user.id, e.target.value)
                                                        }
                                                        disabled={processingId === user.id}
                                                        className="w-full rounded-md border-gray-300 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="admin">管理者</option>
                                                        <option value="manager">マネージャー</option>
                                                        <option value="staff">スタッフ</option>
                                                    </select>

                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        disabled={processingId === user.id}
                                                        className="w-full rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                                                    >
                                                        削除
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {users.length === 0 && (
                                    <div className="py-8 text-center text-gray-500">
                                        ユーザーがいません
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 招待リンクタブ */}
                    {activeTab === 'invites' && (
                        <div className="space-y-6">
                            {/* 招待発行フォーム */}
                            <div className="rounded-lg bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    新規招待リンク発行
                                </h3>
                                <form
                                    onSubmit={handleInviteSubmit}
                                    className="space-y-4"
                                >
                                    <div>
                                        <label
                                            htmlFor="email"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            招待先メールアドレス{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                            className="mt-1 block min-h-[44px] w-full rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="example@email.com"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="role"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                ロール{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                id="role"
                                                value={data.role}
                                                onChange={(e) =>
                                                    setData(
                                                        'role',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 block min-h-[44px] w-full rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="staff">
                                                    スタッフ
                                                </option>
                                                <option value="manager">
                                                    マネージャー
                                                </option>
                                                <option value="admin">
                                                    管理者
                                                </option>
                                            </select>
                                            {errors.role && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.role}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="expires_in"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                有効期限{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                id="expires_in"
                                                value={data.expires_in}
                                                onChange={(e) =>
                                                    setData(
                                                        'expires_in',
                                                        e.target.value,
                                                    )
                                                }
                                                className="mt-1 block min-h-[44px] w-full rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                                <option value="7">7日間</option>
                                                <option value="30">
                                                    30日間
                                                </option>
                                                <option value="never">
                                                    無期限
                                                </option>
                                            </select>
                                            {errors.expires_in && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.expires_in}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {processing
                                                ? '発行中...'
                                                : '招待リンクを発行'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* 招待一覧 */}
                            <div className="rounded-lg bg-white shadow-sm">
                                <div className="border-b border-gray-200 px-6 py-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        発行済み招待リンク
                                    </h3>
                                </div>

                                {invites.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-600">
                                            招待リンクはまだ発行されていません
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200">
                                        {invites.map((invite) => (
                                            <div
                                                key={invite.id}
                                                className="p-4 sm:p-6"
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="truncate text-base font-medium text-gray-900">
                                                                {invite.email}
                                                            </span>
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(invite.role)}`}
                                                            >
                                                                {
                                                                    invite.role_label
                                                                }
                                                            </span>
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(invite.status)}`}
                                                            >
                                                                {
                                                                    invite.status_label
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                            <p>
                                                                発行:{' '}
                                                                {
                                                                    invite.created_at
                                                                }{' '}
                                                                by{' '}
                                                                {
                                                                    invite
                                                                        .creator
                                                                        .name
                                                                }
                                                            </p>
                                                            {invite.expires_at && (
                                                                <p>
                                                                    有効期限:{' '}
                                                                    {
                                                                        invite.expires_at
                                                                    }
                                                                </p>
                                                            )}
                                                            {invite.used_at && (
                                                                <p>
                                                                    使用日時:{' '}
                                                                    {
                                                                        invite.used_at
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {invite.status ===
                                                        'active' && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        invite,
                                                                    )
                                                                }
                                                                className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                                            >
                                                                {copiedId ===
                                                                invite.id ? (
                                                                    <>
                                                                        <svg
                                                                            className="h-4 w-4 text-green-600"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                        コピー済
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg
                                                                            className="h-4 w-4"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={
                                                                                    2
                                                                                }
                                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                                            />
                                                                        </svg>
                                                                        URLコピー
                                                                    </>
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteInvite(
                                                                        invite,
                                                                    )
                                                                }
                                                                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200"
                                                            >
                                                                無効化
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {invite.status === 'active' && (
                                                    <div className="mt-3 rounded-md bg-gray-50 p-3">
                                                        <p className="break-all text-xs text-gray-600">
                                                            {invite.invite_url}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        <p className="font-medium">権限の説明:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>
                                <strong>管理者:</strong>{' '}
                                全機能へのアクセス、ユーザー管理、システム設定
                            </li>
                            <li>
                                <strong>マネージャー:</strong>{' '}
                                予約管理、担当割り当て、レポート閲覧
                            </li>
                            <li>
                                <strong>スタッフ:</strong>{' '}
                                予約閲覧・入力、チェックリスト入力
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
