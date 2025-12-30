import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { InventoryItem, Location, User } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Props {
    item: InventoryItem;
    locations: Location[];
    auth: { user: User };
}

interface InventoryFormData {
    location_id: number | '';
    name: string;
    unit: string;
    reorder_point: number;
    is_active: boolean;
}

export default function Edit({ auth, item, locations }: Props) {
    // Check URL params for action
    const urlParams = new URLSearchParams(window.location.search);
    const initialAction = urlParams.get('action');

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRestockModal, setShowRestockModal] = useState(
        initialAction === 'restock',
    );
    const [showAdjustModal, setShowAdjustModal] = useState(
        initialAction === 'adjust',
    );

    const { data, setData, put, processing, errors } =
        useForm<InventoryFormData>({
            location_id: item.location_id,
            name: item.name,
            unit: item.unit,
            reorder_point: item.reorder_point,
            is_active: item.is_active,
        });

    // Restock form
    const restockForm = useForm({
        quantity: 0,
    });

    // Adjust form
    const adjustForm = useForm({
        quantity: 0,
        notes: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(route('inventory.update', item.id));
    };

    const handleDelete = () => {
        router.delete(route('inventory.destroy', item.id));
    };

    const handleRestock = (e: FormEvent) => {
        e.preventDefault();
        restockForm.post(route('inventory.restock', item.id), {
            onSuccess: () => {
                setShowRestockModal(false);
                restockForm.reset();
            },
        });
    };

    const handleAdjust = (e: FormEvent) => {
        e.preventDefault();
        adjustForm.post(route('inventory.adjust', item.id), {
            onSuccess: () => {
                setShowAdjustModal(false);
                adjustForm.reset();
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    在庫品目編集
                </h2>
            }
        >
            <Head title="在庫品目編集" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Current Stock Display */}
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">
                                    現在の在庫数
                                </p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {item.current_stock}{' '}
                                    <span className="text-lg font-normal">
                                        {item.unit}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRestockModal(true)}
                                    className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
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
                                    補充
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(true)}
                                    className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                                >
                                    <svg
                                        className="mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                        />
                                    </svg>
                                    調整
                                </button>
                            </div>
                        </div>
                        {item.current_stock <= item.reorder_point && (
                            <p className="mt-2 text-sm text-red-600">
                                在庫が発注点以下です。補充をご検討ください。
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
                            {/* 拠点 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    拠点 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={data.location_id}
                                    onChange={(e) =>
                                        setData(
                                            'location_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">選択してください</option>
                                    {locations.map((location) => (
                                        <option
                                            key={location.id}
                                            value={location.id}
                                        >
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.location_id && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.location_id}
                                    </p>
                                )}
                            </div>

                            {/* 品目名 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    品目名{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="例: コーヒー豆"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* 単位 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    単位 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.unit}
                                    onChange={(e) =>
                                        setData('unit', e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="例: kg, 個, 袋"
                                />
                                {errors.unit && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.unit}
                                    </p>
                                )}
                            </div>

                            {/* 発注点 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    発注点{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.reorder_point}
                                    onChange={(e) =>
                                        setData(
                                            'reorder_point',
                                            Number(e.target.value),
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="在庫がこの数量以下になると通知"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    在庫数がこの数量以下になると通知されます
                                </p>
                                {errors.reorder_point && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.reorder_point}
                                    </p>
                                )}
                            </div>

                            {/* 有効/無効 */}
                            <div>
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-lg font-medium text-gray-700">
                                        有効
                                    </span>
                                </label>
                            </div>

                            {/* ボタン */}
                            <div className="flex justify-between border-t border-gray-200 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                                >
                                    削除
                                </button>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.get(
                                                route('inventory.manage'),
                                            )
                                        }
                                        className="hover:bg-gray-300:bg-gray-600 rounded-md bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {processing ? '保存中...' : '更新する'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {/* 削除確認モーダル */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900">
                            品目を削除しますか？
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            この操作は取り消せません。品目「{item.name}
                            」を削除すると、関連する在庫履歴もすべて削除されます。
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="hover:bg-gray-300:bg-gray-600 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 補充モーダル */}
            {showRestockModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900">
                            在庫補充
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {item.name}の補充数量を入力してください
                        </p>
                        <form onSubmit={handleRestock}>
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    補充数量{' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        value={restockForm.data.quantity}
                                        onChange={(e) =>
                                            restockForm.setData(
                                                'quantity',
                                                Number(e.target.value),
                                            )
                                        }
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="数量を入力"
                                        autoFocus
                                    />
                                    <span className="text-gray-500">
                                        {item.unit}
                                    </span>
                                </div>
                                {restockForm.errors.quantity && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {restockForm.errors.quantity}
                                    </p>
                                )}
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowRestockModal(false);
                                        restockForm.reset();
                                    }}
                                    className="hover:bg-gray-300:bg-gray-600 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={restockForm.processing}
                                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                    {restockForm.processing
                                        ? '処理中...'
                                        : '補充する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 調整モーダル */}
            {showAdjustModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-medium text-gray-900">
                            在庫調整
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {item.name}
                            の調整数量を入力してください（マイナス可）
                        </p>
                        <form onSubmit={handleAdjust}>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        調整数量{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={adjustForm.data.quantity}
                                            onChange={(e) =>
                                                adjustForm.setData(
                                                    'quantity',
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="数量を入力（-10, +5 など）"
                                            autoFocus
                                        />
                                        <span className="text-gray-500">
                                            {item.unit}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        現在: {item.current_stock} {item.unit} →
                                        調整後:{' '}
                                        {item.current_stock +
                                            adjustForm.data.quantity}{' '}
                                        {item.unit}
                                    </p>
                                    {adjustForm.errors.quantity && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {adjustForm.errors.quantity}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        備考
                                    </label>
                                    <textarea
                                        value={adjustForm.data.notes}
                                        onChange={(e) =>
                                            adjustForm.setData(
                                                'notes',
                                                e.target.value,
                                            )
                                        }
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="調整理由を記入（任意）"
                                    />
                                    {adjustForm.errors.notes && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {adjustForm.errors.notes}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdjustModal(false);
                                        adjustForm.reset();
                                    }}
                                    className="hover:bg-gray-300:bg-gray-600 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustForm.processing}
                                    className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                                >
                                    {adjustForm.processing
                                        ? '処理中...'
                                        : '調整する'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
