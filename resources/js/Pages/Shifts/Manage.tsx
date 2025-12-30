import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { PageProps, ShiftUserData, CalendarDay } from '@/types';
import { useState, FormEvent } from 'react';

interface Props extends PageProps {
    users: ShiftUserData[];
    currentMonth: string;
    calendarDays: CalendarDay[];
    monthStart: string;
    monthEnd: string;
}

export default function Manage({ users, currentMonth, calendarDays }: Props) {
    const [expandedUser, setExpandedUser] = useState<number | null>(null);
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Parse current month for display
    const [year, month] = currentMonth.split('-').map(Number);
    const monthLabel = `${year}年${month}月`;

    // Navigation helpers
    const navigateMonth = (direction: 'prev' | 'next') => {
        const date = new Date(year, month - 1, 1);
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get(route('shifts.manage', { month: newMonth }));
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin': return '管理者';
            case 'manager': return 'マネージャー';
            case 'staff': return 'スタッフ';
            default: return role;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        シフト管理
                    </h2>
                </div>
            }
        >
            <Head title="シフト管理" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                        <button
                            onClick={() => navigateMonth('prev')}
                            className="flex min-h-[44px] items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            前月
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900">{monthLabel}</h3>
                        <button
                            onClick={() => navigateMonth('next')}
                            className="flex min-h-[44px] items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            次月
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Bulk All Button */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex min-h-[44px] items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            全員一括設定
                        </button>
                    </div>

                    {/* Staff List */}
                    <div className="space-y-3">
                        {users.map((user) => (
                            <UserShiftCard
                                key={user.id}
                                user={user}
                                currentMonth={currentMonth}
                                calendarDays={calendarDays}
                                isExpanded={expandedUser === user.id}
                                onToggle={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                                getRoleLabel={getRoleLabel}
                            />
                        ))}
                    </div>

                    {users.length === 0 && (
                        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                            <p className="text-gray-500">ユーザーがいません</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="mt-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
                        <p className="font-medium">使い方:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li><strong>基本出勤:</strong> その月は基本的に出勤。例外日（休み）を選択</li>
                            <li><strong>基本休日:</strong> その月は基本的に休み。例外日（出勤）を選択</li>
                            <li>カレンダーの日付をタップして例外日を切り替え</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bulk All Modal */}
            {showBulkModal && (
                <BulkAllModal
                    currentMonth={currentMonth}
                    calendarDays={calendarDays}
                    users={users}
                    onClose={() => setShowBulkModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}

// User Shift Card Component
function UserShiftCard({
    user,
    currentMonth,
    calendarDays,
    isExpanded,
    onToggle,
    getRoleLabel,
}: {
    user: ShiftUserData;
    currentMonth: string;
    calendarDays: CalendarDay[];
    isExpanded: boolean;
    onToggle: () => void;
    getRoleLabel: (role: string) => string;
}) {
    const { data, setData, post, processing } = useForm({
        user_id: user.id,
        year_month: currentMonth,
        default_mode: user.default_mode,
        exception_dates: user.exception_dates,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('shifts.bulk-update'), {
            onSuccess: () => onToggle(),
        });
    };

    const toggleExceptionDate = (date: string) => {
        const newDates = data.exception_dates.includes(date)
            ? data.exception_dates.filter(d => d !== date)
            : [...data.exception_dates, date];
        setData('exception_dates', newDates);
    };

    const exceptionSummary = user.exception_dates.length > 0
        ? user.exception_dates.map(d => new Date(d).getDate()).sort((a, b) => a - b).join(', ') + '日'
        : 'なし';

    return (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            {/* Header */}
            <button
                onClick={onToggle}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{user.name}</span>
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {getRoleLabel(user.role)}
                            </span>
                        </div>
                        <div className="mt-0.5 text-sm text-gray-500">
                            基本: {user.default_mode === 'working' ? '出勤' : '休日'} |
                            例外日: {exceptionSummary}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                        <span className="text-green-600">{user.working_count}日出勤</span>
                        <span className="mx-1 text-gray-400">/</span>
                        <span className="text-gray-500">{user.off_count}日休</span>
                    </div>
                    <svg
                        className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded Form */}
            {isExpanded && (
                <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
                    {/* Default Mode */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">基本設定</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`mode-${user.id}`}
                                    checked={data.default_mode === 'working'}
                                    onChange={() => {
                                        setData('default_mode', 'working');
                                        setData('exception_dates', []);
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">基本出勤</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name={`mode-${user.id}`}
                                    checked={data.default_mode === 'off'}
                                    onChange={() => {
                                        setData('default_mode', 'off');
                                        setData('exception_dates', []);
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">基本休日</span>
                            </label>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            例外日を選択 ({data.default_mode === 'working' ? '休日' : '出勤'}にする日)
                        </label>
                        <ShiftCalendar
                            calendarDays={calendarDays}
                            exceptionDates={data.exception_dates}
                            onToggle={toggleExceptionDate}
                            defaultMode={data.default_mode}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onToggle}
                            className="min-h-[44px] rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? '保存中...' : '保存'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// Shift Calendar Component
function ShiftCalendar({
    calendarDays,
    exceptionDates,
    onToggle,
    defaultMode,
}: {
    calendarDays: CalendarDay[];
    exceptionDates: string[];
    onToggle: (date: string) => void;
    defaultMode: 'working' | 'off';
}) {
    // Group days by week
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    // Add padding for first week (Monday = 1, Sunday = 0)
    const firstDayOfWeek = calendarDays[0]?.dayOfWeek || 1;
    const paddingDays = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < paddingDays; i++) {
        currentWeek.push({ date: '', day: 0, dayOfWeek: i + 1 });
    }

    calendarDays.forEach((day) => {
        const adjustedDayOfWeek = day.dayOfWeek === 0 ? 7 : day.dayOfWeek;
        currentWeek.push(day);
        if (adjustedDayOfWeek === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    // Add remaining days
    if (currentWeek.length > 0) {
        while (currentWeek.length < 7) {
            currentWeek.push({ date: '', day: 0, dayOfWeek: currentWeek.length + 1 });
        }
        weeks.push(currentWeek);
    }

    const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];

    return (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-7 bg-gray-50">
                {dayLabels.map((label, i) => (
                    <div
                        key={label}
                        className={`py-2 text-center text-xs font-medium ${
                            i === 5 ? 'text-blue-600' : i === 6 ? 'text-red-600' : 'text-gray-600'
                        }`}
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Days */}
            {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 border-t border-gray-200">
                    {week.map((day, dayIndex) => {
                        if (!day.date) {
                            return <div key={dayIndex} className="p-2 bg-gray-50" />;
                        }

                        const isException = exceptionDates.includes(day.date);
                        const isWorking = defaultMode === 'working' ? !isException : isException;
                        const isSaturday = dayIndex === 5;
                        const isSunday = dayIndex === 6;

                        return (
                            <button
                                key={day.date}
                                type="button"
                                onClick={() => onToggle(day.date)}
                                className={`min-h-[44px] p-2 text-center transition-colors ${
                                    isWorking
                                        ? 'bg-green-100 hover:bg-green-200'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                <span className={`text-sm font-medium ${
                                    isSaturday ? 'text-blue-600' : isSunday ? 'text-red-600' : 'text-gray-700'
                                }`}>
                                    {day.day}
                                </span>
                                <div className="mt-0.5">
                                    {isWorking ? (
                                        <span className="text-xs text-green-700">出</span>
                                    ) : (
                                        <span className="text-xs text-gray-500">休</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

// Bulk All Modal Component
function BulkAllModal({
    currentMonth,
    calendarDays,
    users,
    onClose,
}: {
    currentMonth: string;
    calendarDays: CalendarDay[];
    users: ShiftUserData[];
    onClose: () => void;
}) {
    const { data, setData, post, processing } = useForm({
        year_month: currentMonth,
        default_mode: 'working' as 'working' | 'off',
        exception_dates: [] as string[],
        user_ids: users.map(u => u.id),
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('shifts.bulk-update-all'), {
            onSuccess: () => onClose(),
        });
    };

    const toggleExceptionDate = (date: string) => {
        const newDates = data.exception_dates.includes(date)
            ? data.exception_dates.filter(d => d !== date)
            : [...data.exception_dates, date];
        setData('exception_dates', newDates);
    };

    const toggleUser = (userId: number) => {
        const newIds = data.user_ids.includes(userId)
            ? data.user_ids.filter(id => id !== userId)
            : [...data.user_ids, userId];
        setData('user_ids', newIds);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
                <form onSubmit={handleSubmit}>
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h3 className="text-lg font-semibold text-gray-900">全員一括設定</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* User Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">対象スタッフ</label>
                            <div className="flex flex-wrap gap-2">
                                {users.map((user) => (
                                    <label
                                        key={user.id}
                                        className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1 text-sm ${
                                            data.user_ids.includes(user.id)
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.user_ids.includes(user.id)}
                                            onChange={() => toggleUser(user.id)}
                                            className="sr-only"
                                        />
                                        {user.name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Default Mode */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">基本設定</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="bulk-mode"
                                        checked={data.default_mode === 'working'}
                                        onChange={() => {
                                            setData('default_mode', 'working');
                                            setData('exception_dates', []);
                                        }}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">基本出勤</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="bulk-mode"
                                        checked={data.default_mode === 'off'}
                                        onChange={() => {
                                            setData('default_mode', 'off');
                                            setData('exception_dates', []);
                                        }}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">基本休日</span>
                                </label>
                            </div>
                        </div>

                        {/* Calendar */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                例外日を選択 ({data.default_mode === 'working' ? '休日' : '出勤'}にする日)
                            </label>
                            <ShiftCalendar
                                calendarDays={calendarDays}
                                exceptionDates={data.exception_dates}
                                onToggle={toggleExceptionDate}
                                defaultMode={data.default_mode}
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={processing || data.user_ids.length === 0}
                            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? '保存中...' : `${data.user_ids.length}名に適用`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
