import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'staff';
    avatar: string | null;
    created_at: string;
}

interface Props extends PageProps {
    users: User[];
}

export default function Index({ auth, users }: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);

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

    const handleRoleChange = (userId: number, newRole: string) => {
        setProcessingId(userId);
        router.patch(route('users.updateRole', userId), {
            role: newRole,
        }, {
            onFinish: () => setProcessingId(null),
        });
    };

    const handleDelete = (user: User) => {
        if (confirm(`${user.name} さんを削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
            setProcessingId(user.id);
            router.delete(route('users.destroy', user.id), {
                onFinish: () => setProcessingId(null),
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    ユーザー管理
                </h2>
            }
        >
            <Head title="ユーザー管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="p-6">
                            <div className="mb-4 text-sm text-gray-500">
                                登録ユーザー: {users.length}名
                            </div>

                            <div className="space-y-4">
                                {users.map((user) => (
                                    <div
                                        key={user.id}
                                        className={`flex items-center justify-between rounded-lg border border-gray-200 p-4 ${
                                            processingId === user.id ? 'opacity-50' : ''
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-medium text-gray-600">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt={user.name}
                                                        className="h-12 w-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>

                                            {/* User Info */}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {user.name}
                                                    </span>
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                                        {getRoleLabel(user.role)}
                                                    </span>
                                                    {user.id === auth.user.id && (
                                                        <span className="text-xs text-gray-400">(自分)</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {user.id !== auth.user.id && (
                                            <div className="flex items-center gap-3">
                                                {/* Role Selector */}
                                                <select
                                                    value={user.role}
                                                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                    disabled={processingId === user.id}
                                                    className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="admin">管理者</option>
                                                    <option value="manager">マネージャー</option>
                                                    <option value="staff">スタッフ</option>
                                                </select>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    disabled={processingId === user.id}
                                                    className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                                                >
                                                    削除
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {users.length === 0 && (
                                <div className="text-center text-gray-500 py-8">
                                    ユーザーがいません
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        <p className="font-medium">権限の説明:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li><strong>管理者:</strong> 全機能へのアクセス、ユーザー管理、システム設定</li>
                            <li><strong>マネージャー:</strong> 予約管理、担当割り当て、レポート閲覧</li>
                            <li><strong>スタッフ:</strong> 予約閲覧・入力、チェックリスト入力</li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
