import { Head } from '@inertiajs/react';

interface ExpiredProps {
    guestName: string;
}

export default function Expired({ guestName }: ExpiredProps) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
            <Head title="ページ期限切れ" />

            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                    <svg
                        className="h-8 w-8 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>

                <h1 className="mb-2 text-xl font-bold text-gray-900">
                    ページの有効期限が切れました
                </h1>

                <p className="mb-6 text-gray-600">
                    {guestName}様のゲストページは有効期限が過ぎています。
                </p>

                <p className="text-sm text-gray-500">
                    ご不明な点がございましたら、フロントまでお問い合わせください。
                </p>
            </div>
        </div>
    );
}
