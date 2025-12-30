import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { PageProps, StaffTipStats, MonthlyTipTrend, RoleStats, TipTotals } from '@/types';

interface TipStatisticsProps extends PageProps {
    staffStats: StaffTipStats[];
    monthlyTrend: MonthlyTipTrend[];
    roleStats: RoleStats[];
    totals: TipTotals;
    filters: {
        year: number;
        month: number | null;
    };
}

export default function TipStatistics({
    staffStats,
    monthlyTrend,
    roleStats,
    totals,
}: TipStatisticsProps) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        投げ銭統計
                    </h2>
                    <a
                        href={route('tips.export')}
                        className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        データ出力
                    </a>
                </div>
            }
        >
            <Head title="投げ銭統計" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Summary Cards */}
                    <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                今月の投げ銭
                            </div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">
                                {totals.this_month.toLocaleString()}
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                今年の投げ銭
                            </div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">
                                {totals.this_year.toLocaleString()}
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                累計投げ銭
                            </div>
                            <div className="mt-2 text-3xl font-bold text-gray-900">
                                {totals.all_time.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Monthly Trend */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            月別推移（過去12ヶ月）
                        </h3>
                        <div className="flex h-48 items-end space-x-2">
                            {monthlyTrend.map((item) => {
                                const maxTotal = Math.max(...monthlyTrend.map((t) => t.total), 1);
                                const height = (item.total / maxTotal) * 100;
                                return (
                                    <div key={item.label} className="flex flex-1 flex-col items-center">
                                        <div
                                            className="w-full rounded-t bg-blue-500"
                                            style={{ height: `${height}%`, minHeight: item.total > 0 ? '4px' : '0' }}
                                        />
                                        <div className="mt-2 text-xs text-gray-500">
                                            {item.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Role Stats */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            役職別集計
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {roleStats.map((stat) => (
                                <div
                                    key={stat.role}
                                    className="rounded-lg bg-gray-50 p-4 text-center"
                                >
                                    <div className="text-sm text-gray-500">
                                        {stat.role_label}
                                    </div>
                                    <div className="mt-1 text-2xl font-bold text-gray-900">
                                        {stat.total.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Staff Rankings */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                スタッフ別ランキング
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                順位
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                スタッフ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                今月
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                累計
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                最終受取日
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                詳細
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {staffStats.map((staff, index) => (
                                            <tr key={staff.id}>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {index + 1}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div>
                                                            <div className="font-medium text-gray-900">
                                                                {staff.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {staff.has_wallet ? (
                                                                    <span className="text-green-600">
                                                                        ウォレット登録済
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">
                                                                        ウォレット未登録
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {staff.monthly_tips.toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                                                    {staff.total_tips.toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {staff.last_tip_date || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <Link
                                                        href={route('tips.show', staff.id)}
                                                        className="text-indigo-600 hover:text-indigo-900:text-indigo-300"
                                                    >
                                                        詳細
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {staffStats.length === 0 && (
                                    <div className="py-12 text-center text-gray-500">
                                        データがありません
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
