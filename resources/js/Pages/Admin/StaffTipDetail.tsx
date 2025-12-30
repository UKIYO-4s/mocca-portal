import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MonthlyTipTrend, PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface StaffDetail {
    id: number;
    name: string;
    email: string;
    role: string;
    total_tips: number;
    monthly_tips: number;
    has_wallet: boolean;
    wallet_address: string | null;
}

interface Transaction {
    id: number;
    tip_count: number;
    tipped_at: string;
    guest_page: {
        guest_name: string;
        room_number: string | null;
    } | null;
}

interface PaginatedTransactions {
    data: Transaction[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface StaffTipDetailProps extends PageProps {
    staff: StaffDetail;
    transactions: PaginatedTransactions;
    monthlyBreakdown: MonthlyTipTrend[];
}

export default function StaffTipDetail({
    staff,
    transactions,
    monthlyBreakdown,
}: StaffTipDetailProps) {
    const roleLabels: Record<string, string> = {
        admin: '管理者',
        manager: 'マネージャー',
        staff: 'スタッフ',
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={route('admin.tips.index')}
                            className="hover:text-gray-700:text-gray-200 text-gray-500"
                        >
                            <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </Link>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {staff.name}の投げ銭詳細
                        </h2>
                    </div>
                </div>
            }
        >
            <Head title={`${staff.name}の投げ銭詳細`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Staff Info Card */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                            <div>
                                <div className="text-sm text-gray-500">
                                    名前
                                </div>
                                <div className="mt-1 font-medium text-gray-900">
                                    {staff.name}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">
                                    役職
                                </div>
                                <div className="mt-1 font-medium text-gray-900">
                                    {roleLabels[staff.role] || staff.role}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">
                                    今月
                                </div>
                                <div className="mt-1 text-2xl font-bold text-blue-600">
                                    {staff.monthly_tips.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-gray-500">
                                    累計
                                </div>
                                <div className="mt-1 text-2xl font-bold text-gray-900">
                                    {staff.total_tips.toLocaleString()}
                                </div>
                            </div>
                        </div>
                        {staff.wallet_address && (
                            <div className="mt-4 rounded-lg bg-gray-50 p-3">
                                <span className="text-sm text-gray-500">
                                    ウォレット:{' '}
                                </span>
                                <code className="font-mono text-sm text-gray-900">
                                    {staff.wallet_address}
                                </code>
                            </div>
                        )}
                    </div>

                    {/* Monthly Breakdown */}
                    <div className="mb-6 overflow-hidden rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            月別推移
                        </h3>
                        <div className="flex h-32 items-end space-x-2">
                            {monthlyBreakdown.map((item) => {
                                const maxTotal = Math.max(
                                    ...monthlyBreakdown.map((t) => t.total),
                                    1,
                                );
                                const height = (item.total / maxTotal) * 100;
                                return (
                                    <div
                                        key={item.label}
                                        className="flex flex-1 flex-col items-center"
                                    >
                                        <div className="text-xs text-gray-600">
                                            {item.total}
                                        </div>
                                        <div
                                            className="mt-1 w-full rounded-t bg-blue-500"
                                            style={{
                                                height: `${height}%`,
                                                minHeight:
                                                    item.total > 0
                                                        ? '4px'
                                                        : '0',
                                            }}
                                        />
                                        <div className="mt-2 text-xs text-gray-500">
                                            {item.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">
                                投げ銭履歴
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                日時
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                ゲスト
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                回数
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {transactions.data.map((tx) => (
                                            <tr key={tx.id}>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {tx.tipped_at}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {tx.guest_page
                                                        ?.guest_name || '不明'}
                                                    {tx.guest_page
                                                        ?.room_number &&
                                                        ` (${tx.guest_page.room_number})`}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {tx.tip_count}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {transactions.data.length === 0 && (
                                    <div className="py-12 text-center text-gray-500">
                                        投げ銭履歴がありません
                                    </div>
                                )}
                            </div>

                            {/* Pagination Info */}
                            {transactions.total > 0 && (
                                <div className="mt-4 text-sm text-gray-500">
                                    {transactions.total}件中{' '}
                                    {(transactions.current_page - 1) *
                                        transactions.per_page +
                                        1}
                                    〜
                                    {Math.min(
                                        transactions.current_page *
                                            transactions.per_page,
                                        transactions.total,
                                    )}
                                    件を表示
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
