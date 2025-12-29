import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';

interface StaffWithWallet {
    id: number;
    name: string;
    email: string;
    role: string;
    wallet: {
        wallet_address: string;
        short_address: string;
        is_verified: boolean;
        connected_at: string | null;
    } | null;
}

interface StaffWalletsProps extends PageProps {
    staff: StaffWithWallet[];
}

export default function StaffWallets({ staff }: StaffWalletsProps) {
    const roleLabels: Record<string, string> = {
        admin: '管理者',
        manager: 'マネージャー',
        staff: 'スタッフ',
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    スタッフウォレット一覧
                </h2>
            }
        >
            <Head title="スタッフウォレット一覧" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                スタッフ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                役職
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                ウォレット
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                ステータス
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                登録日
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                        {staff.map((member) => (
                                            <tr key={member.id}>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {member.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {roleLabels[member.role] || member.role}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {member.wallet ? (
                                                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-700">
                                                            {member.wallet.short_address}
                                                        </code>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">未登録</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {member.wallet ? (
                                                        <span
                                                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                                member.wallet.is_verified
                                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            }`}
                                                        >
                                                            {member.wallet.is_verified ? '検証済み' : '未検証'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {member.wallet?.connected_at || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {staff.length === 0 && (
                                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                                        スタッフが登録されていません
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
