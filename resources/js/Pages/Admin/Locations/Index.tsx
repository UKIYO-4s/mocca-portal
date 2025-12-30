import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';

interface Location {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    inventory_items_count: number;
    shifts_count: number;
    created_at: string;
}

interface Props extends PageProps {
    locations: Location[];
}

export default function Index({ locations }: Props) {
    const handleDelete = (location: Location) => {
        if (location.inventory_items_count > 0 || location.shifts_count > 0) {
            alert(`この拠点には関連データがあるため削除できません（備品: ${location.inventory_items_count}件、シフト: ${location.shifts_count}件）`);
            return;
        }

        if (confirm(`「${location.name}」を削除してもよろしいですか？`)) {
            router.delete(route('admin.locations.destroy', location.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-900">
                        拠点管理
                    </h2>
                    <Link
                        href={route('admin.locations.create')}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
                    >
                        新規拠点
                    </Link>
                </div>
            }
        >
            <Head title="拠点管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {locations.length === 0 ? (
                        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                            <p className="text-gray-600">拠点が登録されていません</p>
                            <Link
                                href={route('admin.locations.create')}
                                className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                                最初の拠点を作成する
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {locations.map((location) => (
                                <div
                                    key={location.id}
                                    className="rounded-lg bg-white p-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-lg font-semibold text-gray-900">
                                                    {location.name}
                                                </span>
                                                <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-600">
                                                    {location.slug}
                                                </span>
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                    location.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {location.is_active ? '有効' : '無効'}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-600">
                                                備品: {location.inventory_items_count}件 / シフト: {location.shifts_count}件
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={route('admin.locations.edit', location.id)}
                                                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-100 px-4 py-2 text-base font-medium text-blue-700 hover:bg-blue-200"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(location)}
                                                disabled={location.inventory_items_count > 0 || location.shifts_count > 0}
                                                className={`inline-flex min-h-[44px] items-center justify-center rounded-md px-4 py-2 text-base font-medium ${
                                                    location.inventory_items_count > 0 || location.shifts_count > 0
                                                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                }`}
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
