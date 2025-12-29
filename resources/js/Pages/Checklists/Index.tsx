import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { DailyChecklist, User } from '@/types';
import { useState } from 'react';

interface Props {
    checklists: DailyChecklist[];
    filters: {
        date: string;
        type: string;
    };
    auth: { user: User };
}

const typeLabels: Record<string, string> = {
    lunch_prep: 'ランチ準備',
    dinner_prep: 'ディナー準備',
    cleaning: '清掃',
    other: 'その他',
};

const typeBadgeColors: Record<string, string> = {
    lunch_prep: 'bg-yellow-100 text-yellow-800',
    dinner_prep: 'bg-orange-100 text-orange-800',
    cleaning: 'bg-blue-100 text-blue-800',
    other: 'bg-gray-100 text-gray-800',
};

export default function Index({ auth, checklists, filters }: Props) {
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedType, setSelectedType] = useState(filters.type);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFilter = () => {
        router.get(route('checklists.index'), {
            date: selectedDate || undefined,
            type: selectedType || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        setSelectedType('');
        router.get(route('checklists.index'), {
            date: today,
        });
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        router.post(route('checklists.generate'), {
            date: selectedDate,
        }, {
            preserveState: true,
            onFinish: () => setIsGenerating(false),
        });
    };

    const isAdminOrManager = auth.user.role === 'admin' || auth.user.role === 'manager';

    const getCompletedCount = (checklist: DailyChecklist): number => {
        return checklist.entries?.filter(entry => entry.is_completed).length ?? 0;
    };

    const getTotalCount = (checklist: DailyChecklist): number => {
        return checklist.entries?.length ?? checklist.template?.items_count ?? 0;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        デイリーチェックリスト
                    </h2>
                    <div className="flex items-center gap-2">
                        {isAdminOrManager && (
                            <Link
                                href={route('checklists.templates.index')}
                                className="inline-flex items-center rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                            >
                                テンプレート管理
                            </Link>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    生成中...
                                </>
                            ) : (
                                '本日分を生成'
                            )}
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="デイリーチェックリスト" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* フィルター */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    日付
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    タイプ
                                </label>
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="lunch_prep">ランチ準備</option>
                                    <option value="dinner_prep">ディナー準備</option>
                                    <option value="cleaning">清掃</option>
                                    <option value="other">その他</option>
                                </select>
                            </div>
                            <div className="flex items-end gap-2 sm:col-span-2">
                                <button
                                    onClick={handleFilter}
                                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                                >
                                    検索
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400:bg-gray-500"
                                >
                                    クリア
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* チェックリスト一覧 */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {checklists.length === 0 ? (
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
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                    />
                                </svg>
                                <p className="mt-4 text-gray-500">
                                    チェックリストがありません
                                </p>
                                <p className="mt-2 text-sm text-gray-400">
                                    「本日分を生成」ボタンでチェックリストを作成してください
                                </p>
                            </div>
                        ) : (
                            checklists.map((checklist) => {
                                const completedCount = getCompletedCount(checklist);
                                const totalCount = getTotalCount(checklist);
                                const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                                return (
                                    <Link
                                        key={checklist.id}
                                        href={route('checklists.show', checklist.id)}
                                        className="block rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="truncate text-lg font-medium text-gray-900">
                                                    {checklist.template?.name ?? 'チェックリスト'}
                                                </h3>
                                                <span
                                                    className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        typeBadgeColors[checklist.template?.type ?? 'other'] ?? typeBadgeColors.other
                                                    }`}
                                                >
                                                    {checklist.template?.type_label ?? typeLabels[checklist.template?.type ?? 'other'] ?? 'その他'}
                                                </span>
                                            </div>
                                            {checklist.is_completed && (
                                                <span className="ml-2 flex-shrink-0 rounded-full bg-green-100 p-1 text-green-600">
                                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>

                                        {/* 進捗バー */}
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">
                                                    {completedCount}/{totalCount} 完了
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {completionRate}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${
                                                        completionRate === 100
                                                            ? 'bg-green-500'
                                                            : completionRate >= 50
                                                            ? 'bg-blue-500'
                                                            : 'bg-yellow-500'
                                                    }`}
                                                    style={{ width: `${completionRate}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* 詳細リンクヒント */}
                                        <div className="mt-4 flex items-center justify-end text-sm text-blue-600">
                                            <span>詳細を見る</span>
                                            <svg
                                                className="ml-1 h-4 w-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M9 5l7 7-7 7"
                                                />
                                            </svg>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
