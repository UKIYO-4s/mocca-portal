import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { InventoryItem, Location, User } from '@/types';
import { useState } from 'react';

interface Props {
    items: InventoryItem[];
    locations: Location[];
    filters: { location_id?: number };
    auth: { user: User };
}

export default function Manage({ auth, items, locations, filters }: Props) {
    const [selectedLocation, setSelectedLocation] = useState<number | undefined>(
        filters.location_id
    );

    const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const locationId = value ? parseInt(value, 10) : undefined;
        setSelectedLocation(locationId);

        router.get(
            route('inventory.manage'),
            locationId ? { location_id: locationId } : {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const getStatusBadge = (item: InventoryItem) => {
        if (item.current_stock <= item.reorder_point) {
            return (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                    <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    要発注
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                正常
            </span>
        );
    };

    const lowStockCount = items.filter(
        (item) => item.current_stock <= item.reorder_point
    ).length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        在庫管理
                    </h2>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('inventory.logs')}
                            className="inline-flex items-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200:bg-gray-600"
                        >
                            <svg
                                className="-ml-1 mr-2 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                />
                            </svg>
                            履歴
                        </Link>
                        <Link
                            href={route('inventory.create')}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                            <svg
                                className="-ml-1 mr-2 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            新規登録
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="在庫管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Back Link */}
                    <div className="mb-4">
                        <Link
                            href={route('inventory.index')}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900:text-gray-200"
                        >
                            <svg
                                className="mr-1 h-4 w-4"
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
                            在庫一覧へ戻る
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            {/* Filter and Stats */}
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="text-sm text-gray-500">
                                        登録品目: {items.length}件
                                    </div>
                                    {lowStockCount > 0 && (
                                        <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                                            <svg
                                                className="h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                />
                                            </svg>
                                            要発注: {lowStockCount}件
                                        </div>
                                    )}
                                </div>

                                {/* Location Filter */}
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="location-filter"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        拠点:
                                    </label>
                                    <select
                                        id="location-filter"
                                        value={selectedLocation ?? ''}
                                        onChange={handleLocationChange}
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">すべて</option>
                                        {locations.map((location) => (
                                            <option key={location.id} value={location.id}>
                                                {location.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Items Table */}
                            {items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    品目名
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    単位
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    現在在庫
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    発注点
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    ステータス
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    操作
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className={`${
                                                        !item.is_active
                                                            ? 'bg-gray-50'
                                                            : ''
                                                    } ${
                                                        item.current_stock <= item.reorder_point
                                                            ? 'bg-yellow-50'
                                                            : ''
                                                    }`}
                                                >
                                                    <td className="whitespace-nowrap px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">
                                                                {item.name}
                                                            </span>
                                                            {!item.is_active && (
                                                                <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                                    無効
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.location && (
                                                            <div className="text-sm text-gray-500">
                                                                {item.location.name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {item.unit}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                                        <span
                                                            className={`text-sm font-medium ${
                                                                item.current_stock <= item.reorder_point
                                                                    ? 'text-yellow-600'
                                                                    : 'text-gray-900'
                                                            }`}
                                                        >
                                                            {item.current_stock}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                                                        {item.reorder_point}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-center">
                                                        {getStatusBadge(item)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={route('inventory.edit', item.id)}
                                                                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200:bg-gray-600"
                                                            >
                                                                編集
                                                            </Link>
                                                            <Link
                                                                href={route('inventory.edit', item.id) + '?action=restock'}
                                                                className="rounded-md bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-200:bg-green-900/50"
                                                            >
                                                                補充
                                                            </Link>
                                                            <Link
                                                                href={route('inventory.edit', item.id) + '?action=adjust'}
                                                                className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200:bg-blue-900/50"
                                                            >
                                                                調整
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        在庫品目がありません
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        新しい在庫品目を登録してください。
                                    </p>
                                    <div className="mt-6">
                                        <Link
                                            href={route('inventory.create')}
                                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            <svg
                                                className="-ml-1 mr-2 h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M12 4v16m8-8H4"
                                                />
                                            </svg>
                                            新規登録
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="font-medium">在庫管理について:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>
                                「要発注」は現在在庫が発注点以下になった品目です
                            </li>
                            <li>
                                「補充」で入荷・仕入れを記録できます
                            </li>
                            <li>
                                「調整」で棚卸し結果などの在庫調整ができます
                            </li>
                            <li>
                                履歴から過去の在庫変動を確認できます
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
