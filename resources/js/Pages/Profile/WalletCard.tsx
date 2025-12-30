import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, StaffWallet } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

interface WalletCardProps extends PageProps {
    user: {
        name: string;
        role: string;
    };
    wallet: Omit<StaffWallet, 'id' | 'user_id'> | null;
}

export default function WalletCard({ user, wallet }: WalletCardProps) {
    const roleLabels: Record<string, string> = {
        admin: '管理者',
        manager: 'マネージャー',
        staff: 'スタッフ',
    };

    const copyToClipboard = () => {
        if (wallet?.wallet_address) {
            navigator.clipboard.writeText(wallet.wallet_address);
            alert('アドレスをコピーしました');
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    マイウォレット
                </h2>
            }
        >
            <Head title="マイウォレット" />

            <div className="py-6">
                <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
                    {wallet ? (
                        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 p-1 shadow-xl">
                            <div className="rounded-xl bg-white p-6">
                                {/* Header */}
                                <div className="mb-6 text-center">
                                    <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                                        <span className="text-2xl font-bold text-white">
                                            {user.name.charAt(0)}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                                    <p className="text-sm text-gray-500">{roleLabels[user.role] || user.role}</p>
                                </div>

                                {/* QR Code */}
                                <div className="mb-6 flex justify-center">
                                    <div className="rounded-xl bg-white p-4 shadow-inner ring-1 ring-gray-100">
                                        <QRCodeSVG
                                            value={wallet.wallet_address}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    </div>
                                </div>

                                {/* Wallet Address */}
                                <div className="mb-6">
                                    <p className="mb-2 text-center text-sm font-medium text-gray-500">
                                        ウォレットアドレス (Polygon)
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                        <code className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm text-gray-700">
                                            {wallet.short_address}
                                        </code>
                                        <button
                                            onClick={copyToClipboard}
                                            className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                                            title="コピー"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Status */}
                                <div className="mb-6 flex items-center justify-center gap-2">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                        wallet.is_verified
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {wallet.is_verified ? '検証済み' : '未検証'}
                                    </span>
                                    {wallet.connected_at && (
                                        <span className="text-sm text-gray-500">
                                            登録: {wallet.connected_at}
                                        </span>
                                    )}
                                </div>

                                {/* JPYC Info */}
                                <div className="rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100">
                                            <span className="text-lg font-bold text-purple-600">¥</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">JPYC投げ銭</p>
                                            <p className="text-sm text-gray-600">
                                                このQRコードをスキャンして、Polygon上のJPYCを送金できます。
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 flex justify-center">
                                    <Link
                                        href={route('profile.wallet')}
                                        className="text-sm text-purple-600 hover:text-purple-800"
                                    >
                                        ウォレット設定を変更
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900">
                                ウォレット未登録
                            </h3>
                            <p className="mb-6 text-gray-600">
                                投げ銭を受け取るには、ウォレットアドレスを登録してください。
                            </p>
                            <Link
                                href={route('profile.wallet')}
                                className="inline-flex items-center rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700"
                            >
                                ウォレットを登録
                            </Link>
                        </div>
                    )}

                    {/* External Link */}
                    <div className="mt-6 text-center">
                        <a
                            href="https://jpyc.jp/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            JPYCについて詳しく
                            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
