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
                                                viewBox="0 0 35 33"
                                                fill="none"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z"
                                                    fill="#E17726"
                                                    stroke="#E17726"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M2.04858 1L15.0707 10.809L12.7403 4.99099L2.04858 1Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M28.2295 23.5334L24.7346 28.872L32.2173 30.9323L34.3886 23.6501L28.2295 23.5334Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M0.625 23.6501L2.78876 30.9323L10.2639 28.872L6.77646 23.5334L0.625 23.6501Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M9.86281 14.5765L7.75195 17.6912L15.1823 18.0171L14.9246 10.0938L9.86281 14.5765Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M25.1438 14.5765L20.0068 10.0029L19.8242 18.0171L27.2545 17.6912L25.1438 14.5765Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M10.2639 28.872L14.7163 26.6947L10.8757 23.7002L10.2639 28.872Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
                                                <path
                                                    d="M20.29 26.6947L24.7349 28.872L24.1306 23.7002L20.29 26.6947Z"
                                                    fill="#E27625"
                                                    stroke="#E27625"
                                                    strokeWidth="0.25"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                />
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
