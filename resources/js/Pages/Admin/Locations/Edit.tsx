import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { PageProps } from '@/types';
import { FormEventHandler } from 'react';

interface Location {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}

interface Props extends PageProps {
    location: Location;
}

export default function Edit({ location }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: location.name,
        slug: location.slug,
        is_active: location.is_active,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.locations.update', location.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-900">
                    拠点編集: {location.name}
                </h2>
            }
        >
            <Head title={`拠点編集: ${location.name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
                        <div>
                            <label htmlFor="name" className="block text-base font-medium text-gray-900">
                                拠点名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="mt-1 block w-full min-h-[44px] rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-base font-medium text-gray-900">
                                Slug（半角英数字・ハイフン） <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="mt-1 block w-full min-h-[44px] rounded-md border-gray-300 font-mono text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="mt-1 text-sm text-gray-600">
                                URLなどに使用されます。変更すると既存のリンクが無効になる場合があります。
                            </p>
                            {errors.slug && (
                                <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="is_active" className="ml-3 text-base text-gray-900">
                                有効にする
                            </label>
                        </div>

                        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-end">
                            <Link
                                href={route('admin.locations.index')}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-200"
                            >
                                キャンセル
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? '保存中...' : '更新'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
