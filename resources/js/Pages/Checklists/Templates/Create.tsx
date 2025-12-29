import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Location, User } from '@/types';

interface Props {
    locations: Location[];
    auth: { user: User };
}

interface ChecklistItemInput {
    description: string;
}

interface FormData {
    name: string;
    type: 'lunch_prep' | 'dinner_prep' | 'cleaning' | 'other';
    location_id: number | null;
    is_active: boolean;
    items: ChecklistItemInput[];
}

const typeOptions = [
    { value: 'lunch_prep', label: 'ランチ準備' },
    { value: 'dinner_prep', label: 'ディナー準備' },
    { value: 'cleaning', label: '清掃' },
    { value: 'other', label: 'その他' },
] as const;

export default function Create({ locations, auth }: Props) {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        type: 'lunch_prep',
        location_id: null,
        is_active: true,
        items: [],
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/checklists/templates');
    };

    const addItem = () => {
        setData('items', [...data.items, { description: '' }]);
    };

    const removeItem = (index: number) => {
        const newItems = data.items.filter((_, i) => i !== index);
        setData('items', newItems);
    };

    const updateItem = (index: number, description: string) => {
        const newItems = [...data.items];
        newItems[index] = { description };
        setData('items', newItems);
    };

    const moveItemUp = (index: number) => {
        if (index === 0) return;
        const newItems = [...data.items];
        [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        setData('items', newItems);
    };

    const moveItemDown = (index: number) => {
        if (index === data.items.length - 1) return;
        const newItems = [...data.items];
        [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        setData('items', newItems);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    チェックリストテンプレート作成
                </h2>
            }
        >
            <Head title="チェックリストテンプレート作成" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            {/* テンプレート名 */}
                            <div>
                                <InputLabel htmlFor="name" value="テンプレート名" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="例: ランチ前の準備チェック"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* タイプ */}
                            <div className="mt-4">
                                <InputLabel htmlFor="type" value="タイプ" />
                                <select
                                    id="type"
                                    name="type"
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value as FormData['type'])}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500:border-indigo-600:ring-indigo-600"
                                    required
                                >
                                    {typeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.type} className="mt-2" />
                            </div>

                            {/* 拠点 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="location_id" value="拠点" />
                                <select
                                    id="location_id"
                                    name="location_id"
                                    value={data.location_id ?? ''}
                                    onChange={(e) => setData('location_id', e.target.value ? Number(e.target.value) : null)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500:border-indigo-600:ring-indigo-600"
                                >
                                    <option value="">全拠点共通</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.location_id} className="mt-2" />
                            </div>

                            {/* 有効/無効 */}
                            <div className="mt-4">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                    <span className="ms-2 text-sm text-gray-600">
                                        有効にする
                                    </span>
                                </label>
                                <InputError message={errors.is_active} className="mt-2" />
                            </div>

                            {/* チェック項目 */}
                            <div className="mt-6">
                                <div className="flex items-center justify-between">
                                    <InputLabel value="チェック項目" />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white transition duration-150 ease-in-out hover:bg-indigo-700 focus:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:bg-indigo-900:ring-offset-gray-800"
                                    >
                                        項目を追加
                                    </button>
                                </div>

                                {data.items.length === 0 ? (
                                    <p className="mt-3 text-sm text-gray-500">
                                        まだ項目がありません。「項目を追加」ボタンをクリックして追加してください。
                                    </p>
                                ) : (
                                    <div className="mt-3 space-y-3">
                                        {data.items.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
                                            >
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                                                    {index + 1}
                                                </span>
                                                <TextInput
                                                    value={item.description}
                                                    onChange={(e) => updateItem(index, e.target.value)}
                                                    className="flex-1"
                                                    placeholder="項目の内容を入力"
                                                    required
                                                />
                                                <div className="flex shrink-0 gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveItemUp(index)}
                                                        disabled={index === 0}
                                                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50:bg-gray-700:text-gray-300"
                                                        title="上に移動"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveItemDown(index)}
                                                        disabled={index === data.items.length - 1}
                                                        className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50:bg-gray-700:text-gray-300"
                                                        title="下に移動"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600:bg-red-900:text-red-300"
                                                        title="削除"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <InputError message={errors.items} className="mt-2" />
                            </div>

                            {/* ボタン */}
                            <div className="mt-6 flex items-center justify-end gap-4">
                                <Link href="/checklists/templates">
                                    <SecondaryButton type="button">
                                        キャンセル
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? '保存中...' : '作成'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
