import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { User } from '@/types';

interface Props {
    auth: { user: User };
    qrCodeSvg: string;
    secret: string;
    enabled: boolean;
}

export default function Setup({ auth, qrCodeSvg, secret, enabled }: Props) {
    const { flash } = usePage().props as { flash?: { success?: string; recoveryCodes?: string[] } };
    const [showSecret, setShowSecret] = useState(false);
    const [showRecoveryCodes, setShowRecoveryCodes] = useState(!!flash?.recoveryCodes);

    const enableForm = useForm({
        code: '',
    });

    const disableForm = useForm({
        password: '',
    });

    const regenerateForm = useForm({
        password: '',
    });

    const handleEnable: FormEventHandler = (e) => {
        e.preventDefault();
        enableForm.post(route('two-factor.enable'), {
            preserveScroll: true,
            onSuccess: () => {
                enableForm.reset();
                setShowRecoveryCodes(true);
            },
        });
    };

    const handleDisable: FormEventHandler = (e) => {
        e.preventDefault();
        if (confirm('二要素認証を無効にしますか？アカウントのセキュリティが低下します。')) {
            disableForm.post(route('two-factor.disable'), {
                preserveScroll: true,
                onSuccess: () => disableForm.reset(),
            });
        }
    };

    const handleRegenerate: FormEventHandler = (e) => {
        e.preventDefault();
        if (confirm('新しいリカバリーコードを生成しますか？古いコードは使用できなくなります。')) {
            regenerateForm.post(route('two-factor.regenerate'), {
                preserveScroll: true,
                onSuccess: () => {
                    regenerateForm.reset();
                    setShowRecoveryCodes(true);
                },
            });
        }
    };


    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    二要素認証設定
                </h2>
            }
        >
            <Head title="二要素認証設定" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Success Message */}
                    {flash?.success && (
                        <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
                            {flash.success}
                        </div>
                    )}

                    {/* Status Card */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        ステータス
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        二要素認証の現在の状態
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                        enabled
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {enabled ? '有効' : '無効'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {!enabled ? (
                        /* Setup Card */
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                            <div className="p-6">
                                <h3 className="mb-4 text-lg font-medium text-gray-900">
                                    二要素認証を設定する
                                </h3>

                                <div className="mb-6">
                                    <p className="mb-4 text-sm text-gray-600">
                                        1. Google Authenticator、Authy、または他の認証アプリをスマートフォンにインストールしてください。
                                    </p>
                                    <p className="mb-4 text-sm text-gray-600">
                                        2. アプリで以下のQRコードをスキャンしてください。
                                    </p>
                                </div>

                                {/* QR Code */}
                                <div className="mb-6 flex justify-center">
                                    <div
                                        className="rounded-lg bg-white p-4"
                                        dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
                                    />
                                </div>

                                {/* Manual Entry */}
                                <div className="mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="text-sm text-blue-600 hover:text-blue-500"
                                    >
                                        {showSecret ? 'シークレットキーを隠す' : 'QRコードをスキャンできない場合'}
                                    </button>
                                    {showSecret && (
                                        <div className="mt-2 rounded-md bg-gray-100 p-3">
                                            <p className="mb-1 text-xs text-gray-500">
                                                手動でこのキーを入力してください:
                                            </p>
                                            <code className="font-mono text-sm text-gray-900">
                                                {secret}
                                            </code>
                                        </div>
                                    )}
                                </div>

                                {/* Verification Form */}
                                <form onSubmit={handleEnable}>
                                    <div className="mb-4">
                                        <label
                                            htmlFor="code"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            認証コード
                                        </label>
                                        <input
                                            id="code"
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            value={enableForm.data.code}
                                            onChange={(e) => enableForm.setData('code', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="6桁のコードを入力"
                                            maxLength={6}
                                        />
                                        {enableForm.errors.code && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {enableForm.errors.code}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={enableForm.processing}
                                        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50:ring-offset-gray-800"
                                    >
                                        {enableForm.processing ? '確認中...' : '二要素認証を有効にする'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        /* Enabled Card */
                        <div className="space-y-6">
                            {/* Recovery Codes */}
                            {(showRecoveryCodes && flash?.recoveryCodes) && (
                                <div className="overflow-hidden rounded-lg bg-yellow-50 shadow-sm">
                                    <div className="p-6">
                                        <h3 className="mb-2 text-lg font-medium text-yellow-800">
                                            リカバリーコード
                                        </h3>
                                        <p className="mb-4 text-sm text-yellow-700">
                                            これらのコードは安全な場所に保管してください。認証アプリにアクセスできなくなった場合に使用できます。各コードは1回のみ使用できます。
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 rounded-md bg-white p-4 font-mono text-sm">
                                            {flash.recoveryCodes.map((code, index) => (
                                                <div key={index} className="text-gray-900">
                                                    {code}
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowRecoveryCodes(false)}
                                            className="mt-4 text-sm text-yellow-700 hover:text-yellow-600"
                                        >
                                            コードを非表示にする
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Regenerate Recovery Codes */}
                            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                                <div className="p-6">
                                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                                        リカバリーコードを再生成
                                    </h3>
                                    <p className="mb-4 text-sm text-gray-600">
                                        リカバリーコードを紛失した場合、新しいコードを生成できます。
                                    </p>
                                    <form onSubmit={handleRegenerate}>
                                        <div className="mb-4">
                                            <label
                                                htmlFor="regenerate-password"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                パスワード確認
                                            </label>
                                            <input
                                                id="regenerate-password"
                                                type="password"
                                                value={regenerateForm.data.password}
                                                onChange={(e) => regenerateForm.setData('password', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            {regenerateForm.errors.password && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {regenerateForm.errors.password}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={regenerateForm.processing}
                                            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50:ring-offset-gray-800"
                                        >
                                            {regenerateForm.processing ? '生成中...' : 'リカバリーコードを再生成'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Disable 2FA */}
                            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                                <div className="p-6">
                                    <h3 className="mb-2 text-lg font-medium text-red-600">
                                        二要素認証を無効にする
                                    </h3>
                                    <p className="mb-4 text-sm text-gray-600">
                                        二要素認証を無効にすると、アカウントのセキュリティが低下します。
                                    </p>
                                    <form onSubmit={handleDisable}>
                                        <div className="mb-4">
                                            <label
                                                htmlFor="disable-password"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                パスワード確認
                                            </label>
                                            <input
                                                id="disable-password"
                                                type="password"
                                                value={disableForm.data.password}
                                                onChange={(e) => disableForm.setData('password', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                                            />
                                            {disableForm.errors.password && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {disableForm.errors.password}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={disableForm.processing}
                                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50:ring-offset-gray-800"
                                        >
                                            {disableForm.processing ? '処理中...' : '二要素認証を無効にする'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
