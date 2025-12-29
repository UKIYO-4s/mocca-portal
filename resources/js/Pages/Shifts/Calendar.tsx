import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { User, Shift } from '@/types';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    currentMonth: string; // YYYY-MM format
}

interface DayCell {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    shifts: Shift[];
}

export default function Calendar({ auth, shifts, currentMonth }: Props) {
    const weekDays = ['月', '火', '水', '木', '金', '土', '日'];

    // Parse current month from props
    const [year, month] = currentMonth.split('-').map(Number);

    // Format month display
    const formatMonthDisplay = (): string => {
        return `${year}年${String(month).padStart(2, '0')}月`;
    };

    // Get previous month URL
    const getPrevMonth = (): string => {
        const prevDate = new Date(year, month - 2, 1);
        const prevYear = prevDate.getFullYear();
        const prevMonth = prevDate.getMonth() + 1;
        return `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    };

    // Get next month URL
    const getNextMonth = (): string => {
        const nextDate = new Date(year, month, 1);
        const nextYear = nextDate.getFullYear();
        const nextMonth = nextDate.getMonth() + 1;
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    };

    // Navigate to month
    const navigateToMonth = (monthStr: string) => {
        router.get(route('shifts.calendar', { month: monthStr }));
    };

    // Generate calendar grid
    const generateCalendarDays = (): DayCell[] => {
        const days: DayCell[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // First day of the month
        const firstDayOfMonth = new Date(year, month - 1, 1);
        // Last day of the month
        const lastDayOfMonth = new Date(year, month, 0);

        // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
        // Convert to Monday-based (0 = Monday, 6 = Sunday)
        let startDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6; // Sunday becomes 6

        // Add days from previous month
        const prevMonth = new Date(year, month - 2, 1);
        const lastDayOfPrevMonth = new Date(year, month - 1, 0).getDate();

        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNumber = lastDayOfPrevMonth - i;
            const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dayNumber);
            days.push({
                date,
                dayNumber,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
                shifts: getShiftsForDate(date),
            });
        }

        // Add days of current month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month - 1, day);
            days.push({
                date,
                dayNumber: day,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                shifts: getShiftsForDate(date),
            });
        }

        // Add days from next month to complete the grid (always show 6 rows = 42 cells)
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month, day);
            days.push({
                date,
                dayNumber: day,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
                shifts: getShiftsForDate(date),
            });
        }

        return days;
    };

    // Get shifts for a specific date
    const getShiftsForDate = (date: Date): Shift[] => {
        const dateStr = formatDateToString(date);
        return shifts.filter(shift => shift.date === dateStr);
    };

    // Format date to YYYY-MM-DD string
    const formatDateToString = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    // Format time for display (HH:mm)
    const formatTime = (timeStr: string): string => {
        // If it's already in HH:mm or HH:mm:ss format
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            return `${parts[0]}:${parts[1]}`;
        }
        return timeStr;
    };

    // Format shift time range
    const formatShiftTimeRange = (shift: Shift): string => {
        return `${formatTime(shift.start_time)}-${formatTime(shift.end_time)}`;
    };

    const calendarDays = generateCalendarDays();

    // Maximum shifts to show before collapsing
    const MAX_VISIBLE_SHIFTS = 3;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    シフトカレンダー
                </h2>
            }
        >
            <Head title="シフトカレンダー" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <button
                            onClick={() => navigateToMonth(getPrevMonth())}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            前月
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {formatMonthDisplay()}
                        </h3>

                        <button
                            onClick={() => navigateToMonth(getNextMonth())}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                            翌月
                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        {/* Week Day Headers */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                            {weekDays.map((day, index) => (
                                <div
                                    key={day}
                                    className={`py-3 text-center text-sm font-semibold ${
                                        index === 5
                                            ? 'text-blue-600 dark:text-blue-400' // Saturday
                                            : index === 6
                                            ? 'text-red-600 dark:text-red-400' // Sunday
                                            : 'text-gray-700 dark:text-gray-300'
                                    }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7">
                            {calendarDays.map((day, index) => {
                                const dayOfWeek = index % 7;
                                const isSaturday = dayOfWeek === 5;
                                const isSunday = dayOfWeek === 6;
                                const visibleShifts = day.shifts.slice(0, MAX_VISIBLE_SHIFTS);
                                const remainingCount = day.shifts.length - MAX_VISIBLE_SHIFTS;

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[120px] border-b border-r border-gray-200 p-2 dark:border-gray-700 ${
                                            !day.isCurrentMonth
                                                ? 'bg-gray-50 dark:bg-gray-900'
                                                : 'bg-white dark:bg-gray-800'
                                        } ${day.isToday ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                                    >
                                        {/* Day Number */}
                                        <div
                                            className={`mb-1 text-sm font-medium ${
                                                !day.isCurrentMonth
                                                    ? 'text-gray-400 dark:text-gray-600'
                                                    : isSaturday
                                                    ? 'text-blue-600 dark:text-blue-400'
                                                    : isSunday
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-gray-900 dark:text-gray-100'
                                            } ${day.isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white' : ''}`}
                                        >
                                            {day.dayNumber}
                                        </div>

                                        {/* Shifts */}
                                        <div className="space-y-1">
                                            {visibleShifts.map((shift) => (
                                                <div
                                                    key={shift.id}
                                                    className={`truncate rounded px-1.5 py-0.5 text-xs ${
                                                        day.isCurrentMonth
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-500'
                                                    }`}
                                                    title={`${shift.user?.name || 'Unknown'}: ${formatShiftTimeRange(shift)}`}
                                                >
                                                    <span className="font-medium">{shift.user?.name || 'Unknown'}</span>
                                                    <span className="ml-1">{formatShiftTimeRange(shift)}</span>
                                                </div>
                                            ))}
                                            {remainingCount > 0 && (
                                                <div
                                                    className={`text-center text-xs ${
                                                        day.isCurrentMonth
                                                            ? 'text-gray-600 dark:text-gray-400'
                                                            : 'text-gray-400 dark:text-gray-600'
                                                    }`}
                                                >
                                                    +{remainingCount}件
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-end space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 rounded bg-green-100 dark:bg-green-900/50"></div>
                            <span>シフト</span>
                        </div>
                        <div className="flex items-center">
                            <div className="mr-2 h-4 w-4 rounded ring-2 ring-blue-500"></div>
                            <span>今日</span>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
