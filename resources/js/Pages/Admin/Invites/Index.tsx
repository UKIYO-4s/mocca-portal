import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

interface Invite {
    id: number;
    invitee_name: string;
    email: string | null;
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

interface CreatedInvite {
    id: number;
    invitee_name: string;
    invite_url: string;
    role_label: string;
}

interface Props extends PageProps {
    invites: Invite[];
}

export default function Index({ invites }: Props) {
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [createdInvite, setCreatedInvite] = useState<CreatedInvite | null>(
        null,
    );
    const [modalCopied, setModalCopied] = useState(false);

    const { props } = usePage<
        Props & { flash: { created_invite?: CreatedInvite } }
    >();

    const { data, setData, post, processing, errors, reset } = useForm({
        invitee_name: '',
        email: '',
        role: 'staff',
        expires_in: '7',
    });

    // Check for created_invite in flash data
    useEffect(() => {
        if (props.flash?.created_invite) {
            setCreatedInvite(props.flash.created_invite);
        }
    }, [props.flash]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.invites.store'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    const handleDelete = (invite: Invite) => {
        if (
            confirm(
                `${invite.invitee_name}さんへの招待リンクを無効化してもよろしいですか？`,
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

    const copyModalUrl = async () => {
        if (!createdInvite) return;
        try {
            await navigator.clipboard.writeText(createdInvite.invite_url);
            setModalCopied(true);
            setTimeout(() => setModalCopied(false), 2000);
        } catch {
            alert('コピーに失敗しました');
        }
    };

    const closeModal = () => {
        setCreatedInvite(null);
        setModalCopied(false);
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-purple-100 text-purple-800';
            case 'manager':
                return 'bg-orange-100 text-orange-800';
            case 'staff':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-900">
                    招待リンク管理
                </h2>
            }
        >
            <Head title="招待リンク管理" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* 招待発行フォーム */}
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-semibold text-gray-900">
                            新規招待リンク発行
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="invitee_name"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    招待者名{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="invitee_name"
                                    value={data.invitee_name}
                                    onChange={(e) =>
                                        setData('invitee_name', e.target.value)
                                    }
                                    className="mt-1 block min-h-[44px] w-full rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="山田太郎"
                                />
                                {errors.invitee_name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.invitee_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    メールアドレス{' '}
                                    <span className="text-gray-400">
                                        (任意)
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
                                <p className="mt-1 text-xs text-gray-500">
                                    未入力の場合、登録時に本人が入力します
                                </p>
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
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="role"
                                        value={data.role}
                                        onChange={(e) =>
                                            setData('role', e.target.value)
                                        }
                                        className="mt-1 block min-h-[44px] w-full rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="staff">スタッフ</option>
                                        <option value="manager">
                                            マネージャー
                                        </option>
                                        <option value="admin">管理者</option>
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
                                        <span className="text-red-500">*</span>
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
                                        <option value="30">30日間</option>
                                        <option value="never">無期限</option>
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
                                    <div key={invite.id} className="p-4 sm:p-6">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-base font-medium text-gray-900">
                                                        {invite.invitee_name}
                                                    </span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleColor(invite.role)}`}
                                                    >
                                                        {invite.role_label}
                                                    </span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(invite.status)}`}
                                                    >
                                                        {invite.status_label}
                                                    </span>
                                                </div>
                                                <div className="mt-2 space-y-1 text-sm text-gray-600">
                                                    {invite.email && (
                                                        <p>
                                                            メール:{' '}
                                                            {invite.email}
                                                        </p>
                                                    )}
                                                    <p>
                                                        発行:{' '}
                                                        {invite.created_at} by{' '}
                                                        {invite.creator.name}
                                                    </p>
                                                    {invite.expires_at && (
                                                        <p>
                                                            有効期限:{' '}
                                                            {invite.expires_at}
                                                        </p>
                                                    )}
                                                    {invite.used_at && (
                                                        <p>
                                                            使用日時:{' '}
                                                            {invite.used_at}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {invite.status === 'active' && (
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
                                                            handleDelete(invite)
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
            </div>

            {/* 作成完了モーダル */}
            {createdInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                招待リンクを発行しました
                            </h3>
                            <button
                                onClick={closeModal}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 rounded-lg bg-green-50 p-4">
                            <p className="text-sm text-green-800">
                                <span className="font-medium">
                                    {createdInvite.invitee_name}
                                </span>
                                さん（{createdInvite.role_label}
                                ）への招待リンクを発行しました。
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                招待URL
                            </label>
                            <div className="rounded-md bg-gray-100 p-3">
                                <p className="break-all text-sm text-gray-700">
                                    {createdInvite.invite_url}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={copyModalUrl}
                                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
                            >
                                {modalCopied ? (
                                    <>
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        コピーしました
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="h-5 w-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                        URLをコピー
                                    </>
                                )}
                            </button>
                            <button
                                onClick={closeModal}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-200"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
