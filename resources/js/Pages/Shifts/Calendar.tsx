import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { User, Shift } from '@/types';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    users: User[];
    currentMonth: string; // YYYY-MM format
}

interface DayCell {
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    shifts: Shift[];
}

export default function Calendar({ auth, shifts, users, currentMonth }: Props) {
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

    const calendarDays = generateCalendarDays();

    // Maximum shifts to show before collapsing
    const MAX_VISIBLE_SHIFTS = 4;

    // Count summary
    const workingShifts = shifts.filter(s => s.status === 'working');
    const offShifts = shifts.filter(s => s.status === 'off');

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    シフトカレンダー
                </h2>
            }
        >
            <Head title="シフトカレンダー" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                        <button
                            onClick={() => navigateToMonth(getPrevMonth())}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            前月
                        </button>

                        <h3 className="text-xl font-bold text-gray-900">
                            {formatMonthDisplay()}
                        </h3>

                        <button
                            onClick={() => navigateToMonth(getNextMonth())}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            翌月
                            <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        {/* Week Day Headers */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                            {weekDays.map((day, index) => (
                                <div
                                    key={day}
                                    className={`py-3 text-center text-sm font-semibold ${
                                        index === 5
                                            ? 'text-blue-600' // Saturday
                                            : index === 6
                                            ? 'text-red-600' // Sunday
                                            : 'text-gray-700'
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
                                const workingUsers = day.shifts.filter(s => s.status === 'working');
                                const offUsers = day.shifts.filter(s => s.status === 'off');
                                const visibleWorking = workingUsers.slice(0, MAX_VISIBLE_SHIFTS);
                                const remainingCount = workingUsers.length - MAX_VISIBLE_SHIFTS;

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[100px] border-b border-r border-gray-200 p-2 ${
                                            !day.isCurrentMonth
                                                ? 'bg-gray-50'
                                                : 'bg-white'
                                        } ${day.isToday ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                                    >
                                        {/* Day Number */}
                                        <div
                                            className={`mb-1 text-sm font-medium ${
                                                !day.isCurrentMonth
                                                    ? 'text-gray-400'
                                                    : isSaturday
                                                    ? 'text-blue-600'
                                                    : isSunday
                                                    ? 'text-red-600'
                                                    : 'text-gray-900'
                                            } ${day.isToday ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white' : ''}`}
                                        >
                                            {day.dayNumber}
                                        </div>

                                        {/* Working Users */}
                                        <div className="space-y-0.5">
                                            {visibleWorking.map((shift) => (
                                                <div
                                                    key={shift.id}
                                                    className={`truncate rounded px-1.5 py-0.5 text-xs ${
                                                        day.isCurrentMonth
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                    title={`${shift.user?.name || 'Unknown'}: 出勤`}
                                                >
                                                    {shift.user?.name || 'Unknown'}
                                                </div>
                                            ))}
                                            {remainingCount > 0 && (
                                                <div
                                                    className={`text-center text-xs ${
                                                        day.isCurrentMonth
                                                            ? 'text-green-600'
                                                            : 'text-gray-400'
                                                    }`}
                                                >
                                                    +{remainingCount}名出勤
                                                </div>
                                            )}
                                            {offUsers.length > 0 && day.isCurrentMonth && (
                                                <div className="text-center text-xs text-gray-400">
                                                    {offUsers.length}名休日
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend & Summary */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded bg-green-100"></div>
                                <span>出勤</span>
                            </div>
                            <div className="flex items-center">
                                <div className="mr-2 h-4 w-4 rounded ring-2 ring-blue-500"></div>
                                <span>今日</span>
                            </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <div>
                                <span className="font-bold text-green-600">{workingShifts.length}</span>
                                <span className="ml-1 text-gray-600">件出勤</span>
                            </div>
                            <div>
                                <span className="font-bold text-gray-500">{offShifts.length}</span>
                                <span className="ml-1 text-gray-600">件休日</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
