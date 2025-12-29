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

interface InventoryItemFormData {
    location_id: number | '';
    name: string;
    unit: string;
    current_stock: number | '';
    reorder_point: number | '';
    is_active: boolean;
}

export default function Create({ locations, auth }: Props) {
    const { data, setData, post, processing, errors } = useForm<InventoryItemFormData>({
        location_id: '',
        name: '',
        unit: '',
        current_stock: '',
        reorder_point: '',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('inventory.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    在庫品目作成
                </h2>
            }
        >
            <Head title="在庫品目作成" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <form onSubmit={submit} className="p-6">
                            {/* 拠点 */}
                            <div>
                                <InputLabel htmlFor="location_id" value="拠点" />
                                <select
                                    id="location_id"
                                    name="location_id"
                                    value={data.location_id}
                                    onChange={(e) => setData('location_id', e.target.value ? Number(e.target.value) : '')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:focus:border-indigo-600 dark:focus:ring-indigo-600"
                                    required
                                >
                                    <option value="">拠点を選択してください</option>
                                    {locations.map((location) => (
                                        <option key={location.id} value={location.id}>
                                            {location.name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.location_id} className="mt-2" />
                            </div>

                            {/* 品目名 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="name" value="品目名" />
                                <TextInput
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="例: コピー用紙A4"
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            {/* 単位 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="unit" value="単位" />
                                <TextInput
                                    id="unit"
                                    name="unit"
                                    value={data.unit}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('unit', e.target.value)}
                                    required
                                    placeholder="例: 枚, 個, 本, 袋, 箱"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    例: 枚, 個, 本, 袋, 箱
                                </p>
                                <InputError message={errors.unit} className="mt-2" />
                            </div>

                            {/* 初期在庫数 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="current_stock" value="初期在庫数" />
                                <TextInput
                                    id="current_stock"
                                    name="current_stock"
                                    type="number"
                                    min="0"
                                    value={data.current_stock}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('current_stock', e.target.value ? Number(e.target.value) : '')}
                                    required
                                    placeholder="0"
                                />
                                <InputError message={errors.current_stock} className="mt-2" />
                            </div>

                            {/* 発注点 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="reorder_point" value="発注点" />
                                <TextInput
                                    id="reorder_point"
                                    name="reorder_point"
                                    type="number"
                                    min="0"
                                    value={data.reorder_point}
                                    className="mt-1 block w-full"
                                    onChange={(e) => setData('reorder_point', e.target.value ? Number(e.target.value) : '')}
                                    required
                                    placeholder="10"
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    在庫がこの数量を下回ると発注が必要になります
                                </p>
                                <InputError message={errors.reorder_point} className="mt-2" />
                            </div>

                            {/* 有効 */}
                            <div className="mt-4">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="is_active"
                                        checked={data.is_active}
                                        onChange={(e) => setData('is_active', e.target.checked)}
                                    />
                                    <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                                        有効にする
                                    </span>
                                </label>
                                <InputError message={errors.is_active} className="mt-2" />
                            </div>

                            {/* ボタン */}
                            <div className="mt-6 flex items-center justify-end gap-4">
                                <Link href={route('inventory.manage')}>
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
