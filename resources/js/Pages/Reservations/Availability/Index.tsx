import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

interface AvailabilityData {
    status: 'available' | 'booked';
    sources: string[];
    details: {
        source: string;
        name: string;
        guests: number | null;
    }[];
}

interface ApiResponse {
    success: boolean;
    year: number;
    month: number;
    data: Record<string, AvailabilityData>;
}

interface DayCell {
    date: Date;
    dayNumber: number;
    dateStr: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    availability: AvailabilityData | null;
}

interface Props extends PageProps {
    currentMonth: string;
}

export default function Index({ auth, currentMonth }: Props) {
    const weekDays = ['月', '火', '水', '木', '金', '土', '日'];
    const [year, month] = currentMonth.split('-').map(Number);

    const [availability, setAvailability] = useState<Record<string, AvailabilityData>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Fetch availability data
    const fetchAvailability = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(
                route('reservations.availability.data', { year, month }),
            );
            const data: ApiResponse = await response.json();
            if (data.success) {
                setAvailability(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch availability:', error);
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    // Refresh cache
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch(route('reservations.availability.refresh'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });
            await fetchAvailability();
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

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
        router.get(route('reservations.availability.index', { month: monthStr }));
    };

    // Generate calendar grid
    const generateCalendarDays = (): DayCell[] => {
        const days: DayCell[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);

        let startDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startDayOfWeek < 0) startDayOfWeek = 6;

        const prevMonth = new Date(year, month - 2, 1);
        const lastDayOfPrevMonth = new Date(year, month - 1, 0).getDate();

        // Previous month days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNumber = lastDayOfPrevMonth - i;
            const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), dayNumber);
            const dateStr = formatDateToString(date);
            days.push({
                date,
                dayNumber,
                dateStr,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
                availability: availability[dateStr] || null,
            });
        }

        // Current month days
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = formatDateToString(date);
            days.push({
                date,
                dayNumber: day,
                dateStr,
                isCurrentMonth: true,
                isToday: date.getTime() === today.getTime(),
                availability: availability[dateStr] || null,
            });
        }

        // Next month days to complete 6 rows
        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDateToString(date);
            days.push({
                date,
                dayNumber: day,
                dateStr,
                isCurrentMonth: false,
                isToday: date.getTime() === today.getTime(),
                availability: availability[dateStr] || null,
            });
        }

        return days;
    };

    const formatDateToString = (date: Date): string => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const calendarDays = generateCalendarDays();

    // Source label mapping
    const sourceLabels: Record<string, string> = {
        portal: 'ポータル',
        form: 'Googleフォーム',
        external: '外部サイト',
    };

    // Get selected date details
    const selectedDetails = selectedDate ? availability[selectedDate] : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        空室カレンダー
                    </h2>
                    {(auth.user.role === 'admin' || auth.user.role === 'manager') && (
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <svg
                                className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {refreshing ? '更新中...' : '外部データ更新'}
                        </button>
                    )}
                </div>
            }
        >
            <Head title="空室カレンダー" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
                        <button
                            onClick={() => navigateToMonth(getPrevMonth())}
                            className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <svg
                                className="mr-2 h-5 w-5"
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
                            前月
                        </button>

                        <h3 className="text-xl font-bold text-gray-900">
                            {formatMonthDisplay()}
                        </h3>

                        <button
                            onClick={() => navigateToMonth(getNextMonth())}
                            className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            翌月
                            <svg
                                className="ml-2 h-5 w-5"
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

                    {/* Legend */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-green-600">
                                <span className="text-sm font-bold">○</span>
                            </div>
                            <span className="text-sm text-gray-600">空室</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-600">
                                <span className="text-sm font-bold">×</span>
                            </div>
                            <span className="text-sm text-gray-600">満室</span>
                        </div>
                        <div className="ml-auto flex gap-2 text-xs text-gray-500">
                            <span className="rounded bg-blue-50 px-2 py-1">ポータル</span>
                            <span className="rounded bg-yellow-50 px-2 py-1">フォーム</span>
                            <span className="rounded bg-purple-50 px-2 py-1">外部サイト</span>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        {loading ? (
                            <div className="flex h-96 items-center justify-center">
                                <div className="text-gray-500">読み込み中...</div>
                            </div>
                        ) : (
                            <>
                                {/* Week Day Headers */}
                                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                                    {weekDays.map((day, index) => (
                                        <div
                                            key={day}
                                            className={`py-3 text-center text-sm font-semibold ${
                                                index === 5
                                                    ? 'text-blue-600'
                                                    : index === 6
                                                      ? 'text-red-600'
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
                                        const isBooked =
                                            day.availability?.status === 'booked';
                                        const sources = day.availability?.sources || [];

                                        return (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    day.isCurrentMonth &&
                                                    setSelectedDate(
                                                        selectedDate === day.dateStr
                                                            ? null
                                                            : day.dateStr,
                                                    )
                                                }
                                                className={`relative min-h-[80px] border-b border-r border-gray-200 p-2 text-left transition-colors ${
                                                    !day.isCurrentMonth
                                                        ? 'bg-gray-50'
                                                        : isBooked
                                                          ? 'bg-red-50 hover:bg-red-100'
                                                          : 'bg-green-50 hover:bg-green-100'
                                                } ${day.isToday ? 'ring-2 ring-inset ring-blue-500' : ''} ${
                                                    selectedDate === day.dateStr
                                                        ? 'ring-2 ring-inset ring-blue-600'
                                                        : ''
                                                }`}
                                            >
                                                {/* Day Number */}
                                                <div
                                                    className={`text-sm font-medium ${
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

                                                {/* Availability Status */}
                                                {day.isCurrentMonth && (
                                                    <div className="mt-1 flex flex-col items-center">
                                                        <span
                                                            className={`text-2xl font-bold ${
                                                                isBooked
                                                                    ? 'text-red-500'
                                                                    : 'text-green-500'
                                                            }`}
                                                        >
                                                            {isBooked ? '×' : '○'}
                                                        </span>

                                                        {/* Source indicators */}
                                                        {sources.length > 0 && (
                                                            <div className="mt-1 flex gap-0.5">
                                                                {sources.includes('portal') && (
                                                                    <div className="h-2 w-2 rounded-full bg-blue-400" />
                                                                )}
                                                                {sources.includes('form') && (
                                                                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                                                                )}
                                                                {sources.includes('external') && (
                                                                    <div className="h-2 w-2 rounded-full bg-purple-400" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Selected Date Details */}
                    {selectedDate && selectedDetails && (
                        <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                            <h4 className="mb-3 font-semibold text-gray-900">
                                {selectedDate} の予約詳細
                            </h4>
                            {selectedDetails.details.length > 0 ? (
                                <ul className="space-y-2">
                                    {selectedDetails.details.map((detail, idx) => (
                                        <li
                                            key={idx}
                                            className={`flex items-center gap-3 rounded-md p-2 ${
                                                detail.source === 'portal'
                                                    ? 'bg-blue-50'
                                                    : detail.source === 'form'
                                                      ? 'bg-yellow-50'
                                                      : 'bg-purple-50'
                                            }`}
                                        >
                                            <span
                                                className={`rounded px-2 py-1 text-xs font-medium ${
                                                    detail.source === 'portal'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : detail.source === 'form'
                                                          ? 'bg-yellow-100 text-yellow-700'
                                                          : 'bg-purple-100 text-purple-700'
                                                }`}
                                            >
                                                {sourceLabels[detail.source] || detail.source}
                                            </span>
                                            <span className="text-gray-900">{detail.name}</span>
                                            {detail.guests && (
                                                <span className="text-sm text-gray-500">
                                                    {detail.guests}名
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">予約情報はありません</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
