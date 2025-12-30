import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AdminHubStats {
    users_count: number;
    locations_count: number;
    tips_this_month: number;
}

interface Props extends PageProps {
    stats: AdminHubStats;
}

export default function Hub({ stats }: Props) {
    const menuItems = [
        {
            title: 'ユーザー管理',
            description: 'ユーザーの追加・権限変更・削除',
            route: 'users.index',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            stat: `${stats.users_count}名`,
            color: 'blue',
        },
        {
            title: '拠点管理',
            description: '拠点の追加・編集・削除',
            route: 'admin.locations.index',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            stat: `${stats.locations_count}拠点`,
            color: 'green',
        },
        {
            title: '投げ銭統計',
            description: 'スタッフ別・月別の投げ銭統計',
            route: 'admin.tips.index',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            stat: `今月 ${stats.tips_this_month.toLocaleString()}`,
            color: 'yellow',
        },
        {
            title: 'ウォレット管理',
            description: 'スタッフのウォレット登録状況',
            route: 'admin.staff-wallets',
            icon: (
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            stat: null,
            color: 'purple',
        },
    ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; hover: string; icon: string }> = {
            blue: {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                hover: 'hover:bg-blue-100',
                icon: 'text-blue-600',
            },
            green: {
                bg: 'bg-green-50',
                text: 'text-green-700',
                hover: 'hover:bg-green-100',
                icon: 'text-green-600',
            },
            yellow: {
                bg: 'bg-yellow-50',
                text: 'text-yellow-700',
                hover: 'hover:bg-yellow-100',
                icon: 'text-yellow-600',
            },
            purple: {
                bg: 'bg-purple-50',
                text: 'text-purple-700',
                hover: 'hover:bg-purple-100',
                icon: 'text-purple-600',
            },
        };
        return colors[color] || colors.blue;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-900">
                    管理ハブ
                </h2>
            }
        >
            <Head title="管理ハブ" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-sm text-gray-600">
                            管理者専用のコントロールパネルです。各管理機能にアクセスできます。
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {menuItems.map((item) => {
                            const colors = getColorClasses(item.color);
                            return (
                                <Link
                                    key={item.route}
                                    href={route(item.route)}
                                    className={`flex items-start gap-4 rounded-lg ${colors.bg} ${colors.hover} p-5 transition-colors`}
                                >
                                    <div className={`flex-shrink-0 ${colors.icon}`}>
                                        {item.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className={`text-lg font-semibold ${colors.text}`}>
                                                {item.title}
                                            </h3>
                                            {item.stat && (
                                                <span className={`text-sm font-medium ${colors.text}`}>
                                                    {item.stat}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">
                                            {item.description}
                                        </p>
                                    </div>
                                    <svg
                                        className={`h-5 w-5 flex-shrink-0 ${colors.icon}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-6 rounded-lg bg-gray-50 p-4">
                        <h3 className="text-sm font-medium text-gray-700">権限について</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            このページは管理者（Admin）のみアクセス可能です。マネージャー・スタッフには表示されません。
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
