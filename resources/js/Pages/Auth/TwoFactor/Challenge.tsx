import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function Challenge() {
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('two-factor.verify'), {
            onFinish: () => reset('code'),
        });
    };

    return (
        <GuestLayout>
            <Head title="二要素認証" />

            <div className="mb-4 text-sm text-gray-600">
                {useRecoveryCode ? (
                    <p>
                        リカバリーコードを入力して、アカウントへのアクセスを確認してください。
                    </p>
                ) : (
                    <p>
                        認証アプリに表示されている6桁のコードを入力して、アカウントへのアクセスを確認してください。
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div>
                    <label
                        htmlFor="code"
                        className="block text-sm font-medium text-gray-700"
                    >
                        {useRecoveryCode ? 'リカバリーコード' : '認証コード'}
                    </label>
                    <input
                        id="code"
                        type="text"
                        inputMode={useRecoveryCode ? 'text' : 'numeric'}
                        autoComplete={useRecoveryCode ? 'off' : 'one-time-code'}
                        autoFocus
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder={
                            useRecoveryCode ? 'xxxxx-xxxxx' : '6桁のコード'
                        }
                    />
                    {errors.code && (
                        <p className="mt-1 text-sm text-red-600">
                            {errors.code}
                        </p>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => {
                            setUseRecoveryCode(!useRecoveryCode);
                            reset('code');
                        }}
                        className="hover:text-gray-900:text-gray-100 text-sm text-gray-600"
                    >
                        {useRecoveryCode
                            ? '認証コードを使用する'
                            : 'リカバリーコードを使用する'}
                    </button>
                </div>

                <div className="mt-6">
                    <button
                        type="submit"
                        disabled={processing}
                        className="disabled:opacity-50:ring-offset-gray-800 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        {processing ? '確認中...' : '確認'}
                    </button>
                </div>
            </form>

            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={() => router.post(route('logout'))}
                    className="hover:text-gray-900:text-gray-100 text-sm text-gray-600"
                >
                    ログアウト
                </button>
            </div>
        </GuestLayout>
    );
}
