import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { User, Shift } from '@/types';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    users: User[];
    currentWeek: string; // YYYY-W format like "2025-W01"
    weekStart: string; // YYYY-MM-DD (Monday)
    weekEnd: string; // YYYY-MM-DD (Sunday)
}

// Japanese day labels (Monday-Sunday)
const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

export default function Index({ auth, shifts, users, currentWeek, weekStart, weekEnd }: Props) {
    // Parse week string (YYYY-W format)
    const parseWeek = (weekString: string): { year: number; week: number } => {
        const [yearPart, weekPart] = weekString.split('-W');
        return { year: parseInt(yearPart), week: parseInt(weekPart) };
    };

    const { year, week } = parseWeek(currentWeek);

    // Navigate to previous/next week
    const navigateWeek = (direction: 'prev' | 'next') => {
        let newYear = year;
        let newWeek = week;

        if (direction === 'prev') {
            newWeek -= 1;
            if (newWeek < 1) {
                newYear -= 1;
                // Get last week of previous year (ISO week)
                newWeek = getISOWeeksInYear(newYear);
            }
        } else {
            newWeek += 1;
            const maxWeeks = getISOWeeksInYear(newYear);
            if (newWeek > maxWeeks) {
                newYear += 1;
                newWeek = 1;
            }
        }

        const newWeekString = `${newYear}-W${String(newWeek).padStart(2, '0')}`;
        router.get(route('shifts.index'), { week: newWeekString }, { preserveState: true });
    };

    // Get number of ISO weeks in a year
    const getISOWeeksInYear = (year: number): number => {
        const dec28 = new Date(year, 11, 28);
        const dayOfDec28 = dec28.getDay() || 7;
        dec28.setDate(dec28.getDate() + (4 - dayOfDec28));
        const yearStart = new Date(dec28.getFullYear(), 0, 1);
        return Math.ceil((((dec28.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Generate array of 7 dates for the week (Monday-Sunday)
    const getWeekDates = (): Date[] => {
        const dates: Date[] = [];
        const startDate = new Date(weekStart + 'T00:00:00');
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const weekDates = getWeekDates();

    // Format date as YYYY-MM-DD
    const formatDateKey = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Format date for display (M/D)
    const formatDateShort = (date: Date): string => {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    // Get shift status for a specific user and date
    const getShiftStatus = (userId: number, dateKey: string): 'working' | 'off' | null => {
        const shift = shifts.find(
            (s) => s.user_id === userId && s.date === dateKey
        );
        return shift ? shift.status : null;
    };

    // Check if user can manage shifts
    const canManage = auth.user.role === 'admin' || auth.user.role === 'manager';

    // Display week as "YYYY年 第W週"
    const displayWeek = `${year}年 第${week}週`;

    // Check if a date is today
    const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth() &&
            date.getDate() === today.getDate()
        );
    };

    // Check if a date is weekend (Saturday or Sunday)
    const isWeekend = (dayIndex: number): boolean => {
        return dayIndex >= 5; // 5 = Saturday (土), 6 = Sunday (日)
    };

    // Count working/off for summary
    const workingCount = shifts.filter(s => s.status === 'working').length;
    const offCount = shifts.filter(s => s.status === 'off').length;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        シフト表
                    </h2>
                    {canManage && (
                        <Link
                            href={route('shifts.manage')}
                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            シフト管理
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="シフト表" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Week Navigation */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="flex items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                <svg
                                    className="h-4 w-4"
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
                                前週
                            </button>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {displayWeek}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {weekStart} - {weekEnd}
                                </p>
                            </div>
                            <button
                                onClick={() => navigateWeek('next')}
                                className="flex items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                翌週
                                <svg
                                    className="h-4 w-4"
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
                            </button>
                        </div>
                    </div>

                    {/* Shift Grid */}
                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900">
                                        スタッフ
                                    </th>
                                    {weekDates.map((date, index) => (
                                        <th
                                            key={index}
                                            className={`min-w-[80px] px-2 py-3 text-center text-sm font-semibold ${
                                                isToday(date)
                                                    ? 'bg-blue-50 text-blue-900'
                                                    : isWeekend(index)
                                                    ? index === 5
                                                        ? 'bg-blue-50/50 text-blue-700'
                                                        : 'bg-red-50/50 text-red-700'
                                                    : 'text-gray-900'
                                            }`}
                                        >
                                            <div className="text-xs">{formatDateShort(date)}</div>
                                            <div>{DAY_LABELS[index]}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-gray-500"
                                        >
                                            スタッフが登録されていません
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id}>
                                            <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </span>
                                            </td>
                                            {weekDates.map((date, dayIndex) => {
                                                const dateKey = formatDateKey(date);
                                                const status = getShiftStatus(user.id, dateKey);

                                                return (
                                                    <td
                                                        key={dayIndex}
                                                        className={`px-2 py-2 text-center ${
                                                            isToday(date)
                                                                ? 'bg-blue-50/50'
                                                                : isWeekend(dayIndex)
                                                                ? dayIndex === 5
                                                                    ? 'bg-blue-50/30'
                                                                    : 'bg-red-50/30'
                                                                : ''
                                                        }`}
                                                    >
                                                        {status === 'working' ? (
                                                            <span className="inline-flex items-center justify-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                                出勤
                                                            </span>
                                                        ) : status === 'off' ? (
                                                            <span className="inline-flex items-center justify-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                                                                休日
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Week Summary */}
                    <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                        <h4 className="mb-2 text-sm font-medium text-gray-700">
                            今週のシフト
                        </h4>
                        <div className="flex gap-6">
                            <div>
                                <span className="text-2xl font-bold text-green-600">{workingCount}</span>
                                <span className="ml-1 text-sm text-gray-600">件出勤</span>
                            </div>
                            <div>
                                <span className="text-2xl font-bold text-gray-500">{offCount}</span>
                                <span className="ml-1 text-sm text-gray-600">件休日</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
