import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, StaffWallet } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { BrowserProvider } from 'ethers';
import { FormEventHandler, useState } from 'react';

interface WalletProps extends PageProps {
    wallet: Omit<StaffWallet, 'id' | 'user_id'> | null;
}

export default function Wallet({ wallet }: WalletProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState<string | null>(null);

    const {
        data,
        setData,
        post,
        delete: destroy,
        processing,
        errors,
    } = useForm({
        wallet_address: wallet?.wallet_address || '',
    });

    // Metamask接続処理
    const connectMetamask = async () => {
        setConnectError(null);
        setIsConnecting(true);

        try {
            // Metamaskがインストールされているか確認
            if (!window.ethereum?.isMetaMask) {
                throw new Error(
                    'Metamaskがインストールされていません。\nhttps://metamask.io からインストールしてください。',
                );
            }

            // Metamaskに接続をリクエスト
            const provider = new BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);

            if (accounts && accounts.length > 0) {
                // アドレスを取得してフォームに設定
                const address = accounts[0] as string;
                setData('wallet_address', address);
            } else {
                throw new Error('アカウントが選択されませんでした');
            }
        } catch (error) {
            if (error instanceof Error) {
                // ユーザーがキャンセルした場合
                if (error.message.includes('User rejected')) {
                    setConnectError('接続がキャンセルされました');
                } else {
                    setConnectError(error.message);
                }
            } else {
                setConnectError('接続中にエラーが発生しました');
            }
        } finally {
            setIsConnecting(false);
        }
    };

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
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    ウォレット設定
                </h2>
            }
        >
            <Head title="ウォレット設定" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="bg-white p-6 shadow sm:rounded-lg">
                        <div className="max-w-xl">
                            <h3 className="text-lg font-medium text-gray-900">
                                イーサリアムウォレットアドレス
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                投げ銭を受け取るためのポリゴン（マティック）ネットワーク対応ウォレットアドレスを登録してください。
                            </p>

                            {/* Metamask接続ボタン */}
                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={connectMetamask}
                                    disabled={isConnecting}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-orange-500 bg-white px-4 py-3 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    {isConnecting ? (
                                        <>
                                            <svg
                                                className="h-5 w-5 animate-spin"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            接続中...
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                className="h-5 w-5"
                                                viewBox="0 0 318.6 318.6"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path fill="#e2761b" stroke="#e2761b" strokeLinecap="round" strokeLinejoin="round" d="m274.1 35.5-99.5 73.9 18.4-43.6z"/>
                                                <path fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" d="m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9 16.2 55.3 56.7-15.6-26.5-40.6z"/>
                                                <path fill="#e4761b" stroke="#e4761b" strokeLinecap="round" strokeLinejoin="round" d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z"/>
                                                <path fill="#d7c1b3" stroke="#d7c1b3" strokeLinecap="round" strokeLinejoin="round" d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z"/>
                                                <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z"/>
                                                <path fill="#cd6116" stroke="#cd6116" strokeLinecap="round" strokeLinejoin="round" d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
                                                <path fill="#e4751f" stroke="#e4751f" strokeLinecap="round" strokeLinejoin="round" d="m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-.9 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z"/>
                                                <path fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8.9-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"/>
                                                <path fill="#c0ad9e" stroke="#c0ad9e" strokeLinecap="round" strokeLinejoin="round" d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"/>
                                                <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"/>
                                                <path fill="#763d16" stroke="#763d16" strokeLinecap="round" strokeLinejoin="round" d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"/>
                                                <path fill="#f6851b" stroke="#f6851b" strokeLinecap="round" strokeLinejoin="round" d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"/>
                                            </svg>
                                            Metamaskで接続
                                        </>
                                    )}
                                </button>

                                {connectError && (
                                    <p className="mt-2 whitespace-pre-line text-sm text-red-600">
                                        {connectError}
                                    </p>
                                )}
                            </div>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-2 text-gray-500">
                                        または手動で入力
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={submit}>
                                <div>
                                    <label
                                        htmlFor="wallet_address"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        ウォレットアドレス
                                    </label>
                                    <input
                                        type="text"
                                        id="wallet_address"
                                        value={data.wallet_address}
                                        onChange={(e) =>
                                            setData(
                                                'wallet_address',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0x..."
                                        className="mt-1 block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                    {errors.wallet_address && (
                                        <p className="mt-2 text-sm text-red-600">
                                            {errors.wallet_address}
                                        </p>
                                    )}
                                </div>

                                {wallet && (
                                    <div className="mt-4 rounded-lg bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    現在のアドレス
                                                </p>
                                                <p className="font-mono text-sm text-gray-500">
                                                    {wallet.short_address}
                                                </p>
                                            </div>
                                            <span
                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    wallet.is_verified
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                            >
                                                {wallet.is_verified
                                                    ? '検証済み'
                                                    : '未検証'}
                                            </span>
                                        </div>
                                        {wallet.connected_at && (
                                            <p className="mt-2 text-xs text-gray-500">
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
