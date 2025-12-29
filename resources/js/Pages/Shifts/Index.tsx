import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { User, Shift, Location } from '@/types';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    users: User[];
    locations: Location[];
    currentWeek: string; // YYYY-W format like "2025-W01"
    weekStart: string; // YYYY-MM-DD (Monday)
    weekEnd: string; // YYYY-MM-DD (Sunday)
}

// Color palette for users (cycle through these colors)
const USER_COLORS = [
    { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', border: 'border-blue-300 dark:border-blue-700' },
    { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', border: 'border-green-300 dark:border-green-700' },
    { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-300 dark:border-purple-700' },
    { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' },
    { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700' },
    { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-300 dark:border-teal-700' },
    { bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
    { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
];

// Japanese day labels (Monday-Sunday)
const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

export default function Index({ auth, shifts, users, locations, currentWeek, weekStart, weekEnd }: Props) {
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

    // Format time as HH:MM
    const formatTime = (timeString: string): string => {
        const parts = timeString.split(':');
        return `${parts[0]}:${parts[1]}`;
    };

    // Get shifts for a specific user and date
    const getShiftsForUserDate = (userId: number, dateKey: string): Shift[] => {
        return shifts.filter(
            (shift) => shift.user_id === userId && shift.date === dateKey
        );
    };

    // Get user color by index
    const getUserColor = (userIndex: number) => {
        return USER_COLORS[userIndex % USER_COLORS.length];
    };

    // Create a map of user id to color index
    const userColorMap = new Map<number, number>();
    users.forEach((user, index) => {
        userColorMap.set(user.id, index);
    });

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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
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
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => navigateWeek('prev')}
                                className="flex items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {displayWeek}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {weekStart} - {weekEnd}
                                </p>
                            </div>
                            <button
                                onClick={() => navigateWeek('next')}
                                className="flex items-center gap-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                                        スタッフ
                                    </th>
                                    {weekDates.map((date, index) => (
                                        <th
                                            key={index}
                                            className={`min-w-[120px] px-2 py-3 text-center text-sm font-semibold ${
                                                isToday(date)
                                                    ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200'
                                                    : isWeekend(index)
                                                    ? index === 5
                                                        ? 'bg-blue-50/50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                                        : 'bg-red-50/50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                                    : 'text-gray-900 dark:text-gray-100'
                                            }`}
                                        >
                                            <div className="text-xs">{formatDateShort(date)}</div>
                                            <div className={`text-lg ${isWeekend(index) ? '' : ''}`}>
                                                {DAY_LABELS[index]}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {users.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                                        >
                                            スタッフが登録されていません
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => {
                                        const userIndex = userColorMap.get(user.id) || 0;
                                        const color = getUserColor(userIndex);

                                        return (
                                            <tr key={user.id}>
                                                <td className="sticky left-0 z-10 whitespace-nowrap bg-white px-4 py-3 dark:bg-gray-800">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`h-3 w-3 rounded-full ${color.bg} ${color.border} border`}
                                                        ></div>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {user.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                {weekDates.map((date, dayIndex) => {
                                                    const dateKey = formatDateKey(date);
                                                    const dayShifts = getShiftsForUserDate(user.id, dateKey);

                                                    return (
                                                        <td
                                                            key={dayIndex}
                                                            className={`px-2 py-2 align-top ${
                                                                isToday(date)
                                                                    ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                                                    : isWeekend(dayIndex)
                                                                    ? dayIndex === 5
                                                                        ? 'bg-blue-50/30 dark:bg-blue-900/5'
                                                                        : 'bg-red-50/30 dark:bg-red-900/5'
                                                                    : ''
                                                            }`}
                                                        >
                                                            <div className="space-y-1">
                                                                {dayShifts.map((shift) => (
                                                                    <div
                                                                        key={shift.id}
                                                                        className={`cursor-pointer rounded-md border p-2 text-xs transition-opacity hover:opacity-80 ${color.bg} ${color.text} ${color.border}`}
                                                                        onClick={() => {
                                                                            // Future: Open shift detail modal
                                                                            console.log('Shift clicked:', shift);
                                                                        }}
                                                                    >
                                                                        <div className="font-medium">
                                                                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                                        </div>
                                                                        {shift.location && (
                                                                            <div className="mt-1 truncate opacity-80">
                                                                                {shift.location.name}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    {locations.length > 0 && (
                        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                店舗
                            </h4>
                            <div className="flex flex-wrap gap-4">
                                {locations.map((location) => (
                                    <div
                                        key={location.id}
                                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        <span>{location.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Week Summary */}
                    <div className="mt-4 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            今週のシフト
                        </h4>
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {shifts.length}件
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
