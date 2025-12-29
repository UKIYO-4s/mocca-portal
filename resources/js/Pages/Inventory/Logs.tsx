import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, User } from '@/types';
import { useState } from 'react';

interface InventoryItem {
    id: number;
    name: string;
    unit: string;
}

interface InventoryLog {
    id: number;
    item_id: number;
    type: 'usage' | 'restock' | 'adjustment';
    quantity_change: number;
    notes: string | null;
    created_at: string;
    item: InventoryItem;
    user: User;
}

interface Props extends PageProps {
    logs: InventoryLog[];
    items: InventoryItem[];
    filters: {
        item_id?: number;
        type?: string;
        date_from?: string;
        date_to?: string;
    };
}

const typeLabels: Record<string, string> = {
    usage: '使用',
    restock: '補充',
    adjustment: '調整',
};

const typeColors: Record<string, string> = {
    usage: 'bg-blue-100 text-blue-800',
    restock: 'bg-green-100 text-green-800',
    adjustment: 'bg-yellow-100 text-yellow-800',
};

export default function Logs({ auth, logs, items, filters }: Props) {
    const [itemId, setItemId] = useState(filters.item_id?.toString() || '');
    const [type, setType] = useState(filters.type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(route('inventory.logs'), {
            item_id: itemId || undefined,
            type: type || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setItemId('');
        setType('');
        setDateFrom('');
        setDateTo('');
        router.get(route('inventory.logs'));
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatQuantityChange = (change: number, unit: string) => {
        const sign = change > 0 ? '+' : '';
        return `${sign}${change} ${unit}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        在庫操作履歴
                    </h2>
                    <Link
                        href={route('inventory.index')}
                        className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        在庫管理に戻る
                    </Link>
                </div>
            }
        >
            <Head title="在庫操作履歴" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* フィルター */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    品目
                                </label>
                                <select
                                    value={itemId}
                                    onChange={(e) => setItemId(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">すべて</option>
                                    {items.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    操作タイプ
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="usage">使用</option>
                                    <option value="restock">補充</option>
                                    <option value="adjustment">調整</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    開始日
                                </label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    終了日
                                </label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleFilter}
                                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                                >
                                    検索
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
                                >
                                    クリア
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 操作履歴テーブル */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        {logs.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">操作履歴がありません</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                日時
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                品目
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                操作タイプ
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                数量変動
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                備考
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                操作者
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {logs.map((log) => (
                                            <tr key={log.id} className="hover:bg-gray-50:bg-gray-700">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {formatDateTime(log.created_at)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {log.item.name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${typeColors[log.type]}`}>
                                                        {typeLabels[log.type]}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <span className={`font-medium ${log.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {formatQuantityChange(log.quantity_change, log.item.unit)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {log.notes || '-'}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {log.user.name}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
