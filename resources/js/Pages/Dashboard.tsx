import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Widget {
    name: string;
    component: string;
    data: Record<string, unknown>;
}

interface NavigationItem {
    label: string;
    route: string;
    icon?: string;
    children?: NavigationItem[];
}

interface DashboardProps extends PageProps {
    widgets: Widget[];
    navigation: NavigationItem[];
}

export default function Dashboard({
    auth,
    widgets,
    navigation,
}: DashboardProps) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-900">
                    ダッシュボード
                </h2>
            }
        >
            <Head title="ダッシュボード" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* クイックアクション */}
                    <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        <Link
                            href={route('reservations.banshirou.create')}
                            className="flex min-h-[80px] flex-col items-center justify-center rounded-lg bg-blue-600 p-4 text-white shadow-sm hover:bg-blue-700"
                        >
                            <svg
                                className="mb-2 h-8 w-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            <span className="text-base font-medium">
                                新規予約
                            </span>
                        </Link>

                        <Link
                            href={route('reservations.availability.index')}
                            className="flex min-h-[80px] flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50"
                        >
                            <svg
                                className="mb-2 h-8 w-8 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            <span className="text-base font-medium text-gray-900">
                                予約カレンダー
                            </span>
                        </Link>

                        <Link
                            href={route('profile.edit')}
                            className="flex min-h-[80px] flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50"
                        >
                            <svg
                                className="mb-2 h-8 w-8 text-gray-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                            </svg>
                            <span className="text-base font-medium text-gray-900">
                                プロフィール
                            </span>
                        </Link>

                        {/* Admin only: User Management */}
                        {auth.user.role === 'admin' && (
                            <Link
                                href={route('users.index')}
                                className="flex min-h-[80px] flex-col items-center justify-center rounded-lg bg-red-50 p-4 shadow-sm hover:bg-red-100"
                            >
                                <svg
                                    className="mb-2 h-8 w-8 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                                <span className="text-base font-medium text-red-700">
                                    ユーザー管理
                                </span>
                            </Link>
                        )}
                    </div>

                    {/* ウェルカムメッセージ */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                こんにちは、{auth.user.name}さん
                            </h3>
                            <p className="mt-1 text-base text-gray-600">
                                ロール:{' '}
                                {auth.user.role === 'admin'
                                    ? '管理者'
                                    : auth.user.role === 'manager'
                                      ? 'マネージャー'
                                      : 'スタッフ'}
                            </p>
                        </div>
                    </div>

                    {/* ウィジェット（将来的に動的に読み込む） */}
                    {widgets && widgets.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {widgets.map((widget) => (
                                <div
                                    key={widget.name}
                                    className="overflow-hidden rounded-lg bg-white shadow-sm"
                                >
                                    <div className="p-6">
                                        <h4 className="text-sm font-medium text-gray-600">
                                            {widget.name}
                                        </h4>
                                        {/* ウィジェットコンテンツ */}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
