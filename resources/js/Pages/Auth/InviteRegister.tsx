import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

interface Invite {
    email: string;
    role: string;
    role_label: string;
    token: string;
}

interface Props {
    invite: Invite;
}

export default function InviteRegister({ invite }: Props) {
    const { errors: pageErrors } = usePage().props as { errors: Record<string, string> };
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('invite.store', invite.token));
    };

    return (
        <GuestLayout>
            <Head title="招待からの登録" />

            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900">アカウント登録</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Mocca Portalへようこそ
                </p>
            </div>

            {/* 招待情報 */}
            <div className="mb-6 rounded-lg bg-blue-50 p-4">
                <div className="text-sm text-gray-700">
                    <p>メールアドレス: <span className="font-medium text-gray-900">{invite.email}</span></p>
                    <p className="mt-1">ロール: <span className="font-medium text-gray-900">{invite.role_label}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                        名前 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="mt-1 block w-full min-h-[44px] rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="山田 太郎"
                        autoFocus
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        パスワード <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        id="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        className="mt-1 block w-full min-h-[44px] rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700">
                        パスワード（確認） <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="password"
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                        className="mt-1 block w-full min-h-[44px] rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {pageErrors.token && (
                    <div className="rounded-md bg-red-50 p-4">
                        <p className="text-sm text-red-600">{pageErrors.token}</p>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full min-h-[44px] rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {processing ? '登録中...' : '登録する'}
                </button>
            </form>
        </GuestLayout>
    );
}
