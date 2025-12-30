import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link } from '@inertiajs/react';

interface Props {
    reason: 'not_found' | 'used' | 'expired';
    message: string;
}

export default function InviteExpired({ reason, message }: Props) {
    const getIcon = () => {
        switch (reason) {
            case 'used':
                return (
                    <svg className="h-16 w-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case 'expired':
                return (
                    <svg className="h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                );
        }
    };

    return (
        <GuestLayout>
            <Head title="招待リンク無効" />

            <div className="text-center">
                <div className="mb-6 flex justify-center">
                    {getIcon()}
                </div>

                <h1 className="text-xl font-bold text-gray-900">
                    招待リンクが無効です
                </h1>

                <p className="mt-4 text-gray-600">
                    {message}
                </p>

                <div className="mt-6 space-y-3">
                    <p className="text-sm text-gray-600">
                        管理者に連絡して新しい招待リンクを発行してもらってください。
                    </p>

                    <Link
                        href={route('login')}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-100 px-6 py-2 text-base font-medium text-gray-700 hover:bg-gray-200"
                    >
                        ログインページへ
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
