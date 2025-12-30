import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';

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
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    スタッフウォレット一覧
                </h2>
            }
        >
            <Head title="スタッフウォレット一覧" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                スタッフ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                役職
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                ウォレット
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                ステータス
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                登録日
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {staff.map((member) => (
                                            <tr key={member.id}>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {member.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {roleLabels[member.role] ||
                                                        member.role}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {member.wallet ? (
                                                        <code className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                                                            {
                                                                member.wallet
                                                                    .short_address
                                                            }
                                                        </code>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">
                                                            未登録
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">
                                                    {member.wallet ? (
                                                        <span
                                                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                                                member.wallet
                                                                    .is_verified
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                        >
                                                            {member.wallet
                                                                .is_verified
                                                                ? '検証済み'
                                                                : '未検証'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">
                                                            -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {member.wallet
                                                        ?.connected_at || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {staff.length === 0 && (
                                    <div className="py-12 text-center text-gray-500">
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
