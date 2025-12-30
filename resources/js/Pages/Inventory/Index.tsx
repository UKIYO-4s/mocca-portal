import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { InventoryItem, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    items: Omit<InventoryItem, 'current_stock'>[];
    auth: { user: User };
}

interface UsageEntry {
    item_id: number;
    quantity: number;
    [key: string]: number;
}

export default function Index({ auth, items }: Props) {
    const [usageData, setUsageData] = useState<Record<number, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdminOrManager =
        auth.user.role === 'admin' || auth.user.role === 'manager';

    const handleQuantityChange = (itemId: number, value: string) => {
        const quantity = parseInt(value, 10);
        if (isNaN(quantity) || quantity < 0) {
            setUsageData((prev) => {
                const next = { ...prev };
                delete next[itemId];
                return next;
            });
        } else {
            setUsageData((prev) => ({
                ...prev,
                [itemId]: quantity,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const usageEntries: UsageEntry[] = Object.entries(usageData)
            .filter(([, quantity]) => quantity > 0)
            .map(([itemId, quantity]) => ({
                item_id: parseInt(itemId, 10),
                quantity,
            }));

        if (usageEntries.length === 0) {
            alert('使用数量を入力してください');
            return;
        }

        setIsSubmitting(true);
        router.post(
            route('inventory.usage'),
            { usages: usageEntries },
            {
                preserveState: false,
                onSuccess: () => {
                    setUsageData({});
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const hasEntries = Object.values(usageData).some((q) => q > 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        備品使用入力
                    </h2>
                    {isAdminOrManager && (
                        <Link
                            href={route('inventory.manage')}
                            className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            管理画面
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="備品使用入力" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        {/* 備品一覧 */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {items.length === 0 ? (
                                <div className="col-span-full rounded-lg bg-white p-8 text-center shadow-sm">
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
                                    <p className="mt-4 text-gray-500">
                                        備品が登録されていません
                                    </p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg bg-white p-4 shadow-sm"
                                    >
                                        <div className="mb-3">
                                            <h3 className="text-lg font-medium text-gray-900">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                単位: {item.unit}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <label
                                                htmlFor={`quantity-${item.id}`}
                                                className="text-sm font-medium text-gray-700"
                                            >
                                                使用数量
                                            </label>
                                            <input
                                                type="number"
                                                id={`quantity-${item.id}`}
                                                min="0"
                                                step="1"
                                                value={usageData[item.id] ?? ''}
                                                onChange={(e) =>
                                                    handleQuantityChange(
                                                        item.id,
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="0"
                                                className="block w-24 rounded-md border-gray-300 text-right shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-500">
                                                {item.unit}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* 送信ボタン */}
                        {items.length > 0 && (
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !hasEntries}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="mr-2 h-4 w-4 animate-spin"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                    fill="none"
                                                />
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                />
                                            </svg>
                                            送信中...
                                        </>
                                    ) : (
                                        '使用を記録'
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
