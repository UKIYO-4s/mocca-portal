import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

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

export default function Dashboard({ auth, widgets, navigation }: DashboardProps) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
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
                            className="flex flex-col items-center justify-center rounded-lg bg-blue-600 p-4 text-white shadow-sm hover:bg-blue-700"
                        >
                            <svg className="mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="text-sm font-medium">新規予約</span>
                        </Link>

                        <Link
                            href={route('reservations.banshirou.index')}
                            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            <svg className="mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">予約一覧</span>
                        </Link>

                        <Link
                            href={route('reservations.mocca.index')}
                            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            <svg className="mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">食事予約</span>
                        </Link>

                        <Link
                            href={route('profile.edit')}
                            className="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                        >
                            <svg className="mb-2 h-8 w-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">プロフィール</span>
                        </Link>
                    </div>

                    {/* ウェルカムメッセージ */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                こんにちは、{auth.user.name}さん
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                ロール: {auth.user.role === 'admin' ? '管理者' : auth.user.role === 'manager' ? 'マネージャー' : 'スタッフ'}
                            </p>
                        </div>
                    </div>

                    {/* ウィジェット（将来的に動的に読み込む） */}
                    {widgets && widgets.length > 0 && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {widgets.map((widget) => (
                                <div key={widget.name} className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                                    <div className="p-6">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
