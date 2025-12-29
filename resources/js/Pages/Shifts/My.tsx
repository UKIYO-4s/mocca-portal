import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { User, Shift } from '@/types';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    currentMonth: string; // YYYY-MM format
}

export default function My({ auth, shifts, currentMonth }: Props) {
    const [year, month] = currentMonth.split('-');

    const navigateMonth = (direction: 'prev' | 'next') => {
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        if (direction === 'prev') {
            date.setMonth(date.getMonth() - 1);
        } else {
            date.setMonth(date.getMonth() + 1);
        }
        const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        router.get(route('shifts.my'), { month: newMonth }, { preserveState: true });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}年${m}月${d}日 (${dayOfWeek})`;
    };

    const formatTimeRange = (startTime: string, endTime: string): string => {
        const formatTime = (time: string): string => {
            // Handle HH:mm:ss or HH:mm format
            const parts = time.split(':');
            return `${parts[0]}:${parts[1]}`;
        };
        return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    };

    const formatDuration = (minutes: number): string => {
        if (minutes === 0) return '0分';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}分`;
        if (mins === 0) return `${hours}時間`;
        return `${hours}時間${mins}分`;
    };

    // Group shifts by date
    const groupedShifts = shifts.reduce<Record<string, Shift[]>>((acc, shift) => {
        if (!acc[shift.date]) {
            acc[shift.date] = [];
        }
        acc[shift.date].push(shift);
        return acc;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedShifts).sort();

    // Calculate totals
    const totalShifts = shifts.length;
    const totalMinutes = shifts.reduce((sum, shift) => sum + shift.duration_minutes, 0);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalMins = totalMinutes % 60;

    const displayMonth = `${year}年${month}月`;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    マイシフト
                </h2>
            }
        >
            <Head title="マイシフト" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                前月
                            </button>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {displayMonth}
                            </h3>
                            <button
                                onClick={() => navigateMonth('next')}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                            >
                                翌月
                            </button>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                シフト回数
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalShifts}回
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                合計勤務時間
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalHours}時間{totalMins > 0 && `${totalMins}分`}
                            </div>
                        </div>
                    </div>

                    {/* Shifts List */}
                    <div className="rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        {shifts.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400">
                                    この月のシフトがありません
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedDates.map((date) => (
                                    <div key={date} className="p-4">
                                        <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {formatDate(date)}
                                        </h4>
                                        <div className="space-y-3">
                                            {groupedShifts[date].map((shift) => (
                                                <div
                                                    key={shift.id}
                                                    className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                                                >
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                                                {formatTimeRange(shift.start_time, shift.end_time)}
                                                            </span>
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                ({formatDuration(shift.duration_minutes)})
                                                            </span>
                                                        </div>
                                                        {shift.location && (
                                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                {shift.location.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {shift.notes && (
                                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                            {shift.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
