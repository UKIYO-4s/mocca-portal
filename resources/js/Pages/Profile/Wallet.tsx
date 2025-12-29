import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { PageProps, StaffWallet } from '@/types';
import { FormEventHandler } from 'react';

interface WalletProps extends PageProps {
    wallet: Omit<StaffWallet, 'id' | 'user_id'> | null;
}

export default function Wallet({ wallet }: WalletProps) {
    const { data, setData, post, delete: destroy, processing, errors } = useForm({
        wallet_address: wallet?.wallet_address || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.wallet.update'));
    };

    const handleDelete = () => {
        if (confirm('ウォレットアドレスを削除しますか？')) {
            destroy(route('profile.wallet.destroy'));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    ウォレット設定
                </h2>
            }
        >
            <Head title="ウォレット設定" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
                        <div className="max-w-xl">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Ethereumウォレットアドレス
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                投げ銭を受け取るためのPolygon（MATIC）ネットワーク対応ウォレットアドレスを登録してください。
                            </p>

                            <form onSubmit={submit} className="mt-6">
                                <div>
                                    <label
                                        htmlFor="wallet_address"
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                                    >
                                        ウォレットアドレス
                                    </label>
                                    <input
                                        type="text"
                                        id="wallet_address"
                                        value={data.wallet_address}
                                        onChange={(e) => setData('wallet_address', e.target.value)}
                                        placeholder="0x..."
                                        className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                    />
                                    {errors.wallet_address && (
                                        <p className="mt-2 text-sm text-red-600">{errors.wallet_address}</p>
                                    )}
                                </div>

                                {wallet && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    現在のアドレス
                                                </p>
                                                <p className="font-mono text-sm text-gray-500 dark:text-gray-400">
                                                    {wallet.short_address}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    wallet.is_verified
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}
                                            >
                                                {wallet.is_verified ? '検証済み' : '未検証'}
                                            </span>
                                        </div>
                                        {wallet.connected_at && (
                                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                登録日: {wallet.connected_at}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6 flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                    >
                                        {wallet ? '更新' : '登録'}
                                    </button>

                                    {wallet && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={processing}
                                            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            削除
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
