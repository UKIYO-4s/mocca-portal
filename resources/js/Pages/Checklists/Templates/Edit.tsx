import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { ChecklistTemplate, ChecklistItem, Location, User } from '@/types';
import { FormEvent, useState } from 'react';

interface Props {
    template: ChecklistTemplate;
    locations: Location[];
    auth: { user: User };
}

interface ItemFormData {
    id?: number;
    description: string;
    sort_order: number;
}

interface FormData {
    name: string;
    type: 'lunch_prep' | 'dinner_prep' | 'cleaning' | 'other';
    location_id: number | '';
    is_active: boolean;
    items: ItemFormData[];
}

export default function Edit({ auth, template, locations }: Props) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: template.name,
        type: template.type,
        location_id: template.location_id ?? '',
        is_active: template.is_active,
        items: template.items.map((item) => ({
            id: item.id,
            description: item.description,
            sort_order: item.sort_order,
        })),
    });

    const typeOptions = [
        { value: 'lunch_prep', label: 'ランチ準備' },
        { value: 'dinner_prep', label: 'ディナー準備' },
        { value: 'cleaning', label: '清掃' },
        { value: 'other', label: 'その他' },
    ];

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                description: '',
                sort_order: data.items.length + 1,
            },
        ]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        // Re-assign sort_order
        const reorderedItems = newItems.map((item, i) => ({
            ...item,
            sort_order: i + 1,
        }));
        setData('items', reorderedItems);
    };

    const updateItem = (index: number, description: string) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], description };
        setData('items', newItems);
    };

    const moveItemUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...data.items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        // Re-assign sort_order
        const reorderedItems = newItems.map((item, i) => ({
            ...item,
            sort_order: i + 1,
        }));
        setData('items', reorderedItems);
    };

    const moveItemDown = (index: number) => {
        if (index === data.items.length - 1) return;
        const newItems = [...data.items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        // Re-assign sort_order
        const reorderedItems = newItems.map((item, i) => ({
            ...item,
            sort_order: i + 1,
        }));
        setData('items', reorderedItems);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        put(route('checklists.templates.update', template.id));
    };

    const handleDelete = () => {
        router.delete(route('checklists.templates.destroy', template.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    テンプレート編集
                </h2>
            }
        >
            <Head title="テンプレート編集" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="rounded-lg bg-white p-6 shadow-sm space-y-6">
                            {/* テンプレート名 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    テンプレート名 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="例: 朝の清掃チェックリスト"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>

                            {/* タイプ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    タイプ <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {typeOptions.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 ${
                                                data.type === option.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={option.value}
                                                checked={data.type === option.value}
                                                onChange={(e) =>
                                                    setData('type', e.target.value as FormData['type'])
                                                }
                                                className="sr-only"
                                            />
                                            <span className="font-medium text-gray-700">
                                                {option.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {errors.type && (
                                    <p className="mt-1 text-sm text-red-500">{errors.type}</p>
                                )}
                            </div>

                            {/* 拠点 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    拠点
                                </label>
                                <select
                                    value={data.location_id}
                                    onChange={(e) =>
                                        setData(
                                            'location_id',
                                            e.target.value ? Number(e.target.value) : ''
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">選択してください</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.location_id && (
                                    <p className="mt-1 text-sm text-red-500">{errors.location_id}</p>
                                )}
                            </div>

                            {/* 有効/無効 */}
                            <div>
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-lg font-medium text-gray-700">
                                        有効
                                    </span>
                                </label>
                            </div>

                            {/* チェック項目 */}
                            <div className="border-t border-gray-200 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">
                                        チェック項目
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
                                                d="M12 4v16m8-8H4"
                                            />
                                        </svg>
                                        項目追加
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {data.items.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">
                                            項目がありません。「項目追加」ボタンで追加してください。
                                        </p>
                                    ) : (
                                        data.items.map((item, index) => (
                                            <div
                                                key={item.id ?? `new-${index}`}
                                                className="flex items-center gap-2 rounded-lg border border-gray-200 p-3"
                                            >
                                                <span className="flex-shrink-0 w-8 text-center text-sm font-medium text-gray-500">
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, e.target.value)}
                                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="チェック項目を入力"
                                                />
                                                <div className="flex-shrink-0 flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveItemUp(index)}
                                                        disabled={index === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="上へ移動"
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
                                                                d="M5 15l7-7 7 7"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveItemDown(index)}
                                                        disabled={index === data.items.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title="下へ移動"
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
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="p-1 text-red-400 hover:text-red-600"
                                                        title="削除"
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
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {errors.items && (
                                    <p className="mt-2 text-sm text-red-500">{errors.items}</p>
                                )}
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
                                            router.get(route('checklists.templates.index'))
                                        }
                                        className="rounded-md bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300:bg-gray-600"
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
                            テンプレートを削除しますか？
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            この操作は取り消せません。テンプレート「{template.name}
                            」を削除すると、関連するチェック項目もすべて削除されます。
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300:bg-gray-600"
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
        </AuthenticatedLayout>
    );
}
