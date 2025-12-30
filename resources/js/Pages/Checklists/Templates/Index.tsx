import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ChecklistTemplate, User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    templates: ChecklistTemplate[];
    auth: { user: User };
}

export default function Index({ auth, templates }: Props) {
    const [processingId, setProcessingId] = useState<number | null>(null);

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'lunch_prep':
                return 'bg-orange-100 text-orange-800';
            case 'dinner_prep':
                return 'bg-purple-100 text-purple-800';
            case 'cleaning':
                return 'bg-green-100 text-green-800';
            case 'other':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'lunch_prep':
                return 'ランチ仕込み';
            case 'dinner_prep':
                return 'ディナー仕込み';
            case 'cleaning':
                return '掃除';
            case 'other':
                return 'その他';
            default:
                return type;
        }
    };

    const handleDelete = (template: ChecklistTemplate) => {
        if (
            confirm(
                `「${template.name}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`,
            )
        ) {
            setProcessingId(template.id);
            router.delete(route('checklists.templates.destroy', template.id), {
                onFinish: () => setProcessingId(null),
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        チェックリストテンプレート管理
                    </h2>
                    <Link
                        href={route('checklists.templates.create')}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        新規作成
                    </Link>
                </div>
            }
        >
            <Head title="チェックリストテンプレート管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Back Link */}
                    <div className="mb-4">
                        <Link
                            href={route('checklists.index')}
                            className="hover:text-gray-900:text-gray-200 inline-flex items-center text-sm text-gray-600"
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
                            日次チェックリストへ戻る
                        </Link>
                    </div>

                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            <div className="mb-4 text-sm text-gray-500">
                                登録テンプレート: {templates.length}件
                            </div>

                            {/* Template List */}
                            <div className="space-y-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`flex items-center justify-between rounded-lg border border-gray-200 p-4 ${
                                            processingId === template.id
                                                ? 'opacity-50'
                                                : ''
                                        } ${!template.is_active ? 'bg-gray-50' : ''}`}
                                    >
                                        <div className="flex flex-1 items-center gap-4">
                                            {/* Template Info */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium text-gray-900">
                                                        {template.name}
                                                    </span>
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getTypeBadgeColor(
                                                            template.type,
                                                        )}`}
                                                    >
                                                        {getTypeLabel(
                                                            template.type,
                                                        )}
                                                    </span>
                                                    {!template.is_active && (
                                                        <span className="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                                                            無効
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                    <span>
                                                        拠点:{' '}
                                                        {template.location
                                                            ? template.location
                                                                  .name
                                                            : '全拠点共通'}
                                                    </span>
                                                    <span>
                                                        項目数:{' '}
                                                        {template.items_count ??
                                                            template.items
                                                                ?.length ??
                                                            0}
                                                        件
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Indicator */}
                                            <div className="flex items-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                                        template.is_active
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${
                                                            template.is_active
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-400'
                                                        }`}
                                                    ></span>
                                                    {template.is_active
                                                        ? '有効'
                                                        : '無効'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="ml-4 flex items-center gap-2">
                                            <Link
                                                href={route(
                                                    'checklists.templates.edit',
                                                    template.id,
                                                )}
                                                className="hover:bg-gray-200:bg-gray-600 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700"
                                            >
                                                編集
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    handleDelete(template)
                                                }
                                                disabled={
                                                    processingId === template.id
                                                }
                                                className="rounded-md bg-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {templates.length === 0 && (
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
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        テンプレートがありません
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        新しいチェックリストテンプレートを作成してください。
                                    </p>
                                    <div className="mt-6">
                                        <Link
                                            href={route(
                                                'checklists.templates.create',
                                            )}
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
                                            新規作成
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="font-medium">テンプレートについて:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>
                                テンプレートは日次チェックリストの雛形として使用されます
                            </li>
                            <li>
                                拠点を指定すると、その拠点専用のテンプレートになります
                            </li>
                            <li>
                                無効にしたテンプレートは日次チェックリスト作成時に選択できなくなります
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
