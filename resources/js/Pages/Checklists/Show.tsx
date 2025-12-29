import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps, DailyChecklist, DailyChecklistEntry, User } from '@/types';

interface ChecklistItemWithEntry {
    id: number;
    description: string;
    sort_order: number;
    entry: DailyChecklistEntry | null;
}

interface Props extends PageProps {
    checklist: DailyChecklist;
    items: ChecklistItemWithEntry[];
}

export default function Show({ auth, checklist, items }: Props) {
    const completedCount = items.filter(item => item.entry?.is_completed).length;
    const totalCount = items.length;
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isAllCompleted = completedCount === totalCount && totalCount > 0;

    const handleToggle = (itemId: number) => {
        router.post(
            `/checklists/${checklist.id}/entries/${itemId}/toggle`,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const formatDateTime = (dateTimeString: string | null) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleString('ja-JP', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {checklist.template.name}
                        </h2>
                        {isAllCompleted && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                完了
                            </span>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${checklist.template.name} - ${checklist.date}`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* チェックリスト情報 */}
                    <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{checklist.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span>{checklist.template.type_label}</span>
                            </div>
                            {checklist.template.location && (
                                <div className="flex items-center gap-2">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{checklist.template.location.name}</span>
                                </div>
                            )}
                        </div>

                        {/* 進捗バー */}
                        <div className="mt-6">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    進捗状況
                                </span>
                                <span className="text-sm font-medium text-gray-700">
                                    {completedCount} / {totalCount} ({progressPercentage}%)
                                </span>
                            </div>
                            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                                <div
                                    className={`h-4 rounded-full transition-all duration-300 ${
                                        isAllCompleted
                                            ? 'bg-green-500'
                                            : progressPercentage > 0
                                            ? 'bg-blue-500'
                                            : 'bg-gray-300'
                                    }`}
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* チェックリストアイテム */}
                    <div className="rounded-lg bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                チェック項目
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {sortedItems.map((item) => {
                                const isCompleted = item.entry?.is_completed ?? false;
                                const completedBy = item.entry?.completed_by_user;
                                const completedAt = item.entry?.completed_at;

                                return (
                                    <li key={item.id} className="px-6 py-4">
                                        <div className="flex items-start gap-4">
                                            <button
                                                onClick={() => handleToggle(item.id)}
                                                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                                                    isCompleted
                                                        ? 'border-green-500 bg-green-500 text-white'
                                                        : 'border-gray-300 bg-white hover:border-blue-500'
                                                }`}
                                                aria-label={isCompleted ? 'チェック解除' : 'チェック'}
                                            >
                                                {isCompleted && (
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-base ${
                                                    isCompleted
                                                        ? 'text-gray-500 line-through'
                                                        : 'text-gray-900'
                                                }`}>
                                                    {item.description}
                                                </p>
                                                {isCompleted && completedBy && (
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {completedBy.name} が {formatDateTime(completedAt ?? null)} に完了
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        {sortedItems.length === 0 && (
                            <div className="px-6 py-12 text-center text-gray-500">
                                チェック項目がありません
                            </div>
                        )}
                    </div>

                    {/* 戻るボタン */}
                    <div className="mt-6">
                        <Link
                            href={route('checklists.index')}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900:text-gray-200"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            チェックリスト一覧に戻る
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
