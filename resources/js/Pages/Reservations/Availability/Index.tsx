import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

interface ReservationDetail {
    id: number | null;
    source: string;
    name: string;
    guests: number | null;
    checkin_date: string;
    checkout_date: string | null;
}

interface AvailabilityData {
    status: 'available' | 'booked';
    sources: string[];
    details: ReservationDetail[];
}

interface Reservation {
    id: number | null;
    source: string;
    name: string;
    phone: string | null;
    checkin_date: string;
    checkout_date: string;
    guests: number;
    meal_option: string | null;
    notes: string | null;
}

interface ApiResponse {
    success: boolean;
    year: number;
    month: number;
    data: Record<string, AvailabilityData>;
    reservations: Reservation[];
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
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

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
                setReservations(data.reservations);
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
        form: 'フォーム',
        external: '外部サイト',
    };

    const mealLabels: Record<string, string> = {
        with_meals: '食事付き',
        seat_only: '席のみ',
        no_meals: '素泊まり',
    };

    // Get selected date details
    const selectedDetails = selectedDate ? availability[selectedDate] : null;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        予約カレンダー
                    </h2>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <Link
                            href={route('reservations.banshirou.create')}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            + 新規予約
                        </Link>
                        {(auth.user.role === 'admin' || auth.user.role === 'manager') && (
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                </div>
            }
        >
            <Head title="予約カレンダー" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        {/* Mobile: Month title and toggle on top */}
                        <div className="flex flex-col items-center gap-2 sm:hidden">
                            <h3 className="text-xl font-bold text-gray-900">
                                {formatMonthDisplay()}
                            </h3>
                            {/* View Mode Toggle - Mobile */}
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`min-w-[80px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        viewMode === 'calendar'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    カレンダー
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`min-w-[80px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    一覧
                                </button>
                            </div>
                        </div>

                        {/* Mobile: Navigation buttons in row */}
                        <div className="flex items-center justify-between sm:hidden">
                            <button
                                onClick={() => navigateToMonth(getPrevMonth())}
                                className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <svg
                                    className="mr-1 h-5 w-5"
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
                            <button
                                onClick={() => navigateToMonth(getNextMonth())}
                                className="inline-flex min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                翌月
                                <svg
                                    className="ml-1 h-5 w-5"
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

                        {/* Desktop: Original layout */}
                        <button
                            onClick={() => navigateToMonth(getPrevMonth())}
                            className="hidden min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex"
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

                        <div className="hidden items-center gap-4 sm:flex">
                            <h3 className="text-xl font-bold text-gray-900">
                                {formatMonthDisplay()}
                            </h3>
                            {/* View Mode Toggle - Desktop */}
                            <div className="flex rounded-lg bg-gray-100 p-1">
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        viewMode === 'calendar'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    カレンダー
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                        viewMode === 'list'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    一覧
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => navigateToMonth(getNextMonth())}
                            className="hidden min-h-[44px] items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:inline-flex"
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
                    <div className="mb-4 flex flex-col gap-3 rounded-lg bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                        <div className="flex items-center justify-center gap-4 sm:justify-start">
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-green-600">
                                    <span className="text-sm font-bold">O</span>
                                </div>
                                <span className="text-sm text-gray-600">空室</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded bg-red-100 text-red-600">
                                    <span className="text-sm font-bold">X</span>
                                </div>
                                <span className="text-sm text-gray-600">満室</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 sm:ml-auto sm:justify-end">
                            <span className="rounded bg-blue-50 px-2 py-1">ポータル</span>
                            <span className="rounded bg-yellow-50 px-2 py-1">フォーム</span>
                            <span className="rounded bg-purple-50 px-2 py-1">外部サイト</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex h-96 items-center justify-center rounded-lg bg-white shadow-sm">
                            <div className="text-gray-500">読み込み中...</div>
                        </div>
                    ) : viewMode === 'calendar' ? (
                        <>
                            {/* Calendar Grid */}
                            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
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
                                                onClick={() => {
                                                    if (day.isCurrentMonth) {
                                                        setSelectedDate(day.dateStr);
                                                        setShowModal(true);
                                                    }
                                                }}
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
                                                            {isBooked ? 'X' : 'O'}
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
                            </div>

                        </>
                    ) : (
                        /* List View */
                        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                予約元
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                お名前
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                チェックイン
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                チェックアウト
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                人数
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                食事
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                操作
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {reservations.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                                    この月の予約はありません
                                                </td>
                                            </tr>
                                        ) : (
                                            reservations.map((reservation, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                                reservation.source === 'portal'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : reservation.source === 'form'
                                                                      ? 'bg-yellow-100 text-yellow-700'
                                                                      : 'bg-purple-100 text-purple-700'
                                                            }`}
                                                        >
                                                            {sourceLabels[reservation.source]}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                                        {reservation.name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                        {reservation.checkin_date}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                        {reservation.checkout_date}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                        {reservation.guests}名
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                                        {reservation.meal_option
                                                            ? mealLabels[reservation.meal_option] || reservation.meal_option
                                                            : '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3">
                                                        {reservation.id ? (
                                                            <Link
                                                                href={route('reservations.banshirou.show', reservation.id)}
                                                                className="text-blue-600 hover:text-blue-800"
                                                            >
                                                                詳細
                                                            </Link>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Details Modal */}
            {showModal && selectedDate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 p-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedDate} の予約状況
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4">
                            {/* Status Badge */}
                            <div className="mb-4 flex items-center gap-2">
                                <span className="text-sm text-gray-600">状態:</span>
                                {selectedDetails?.status === 'booked' ? (
                                    <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
                                        <span className="mr-1 font-bold">X</span> 満室
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                                        <span className="mr-1 font-bold">O</span> 空室
                                    </span>
                                )}
                            </div>

                            {/* Reservation List */}
                            {selectedDetails && selectedDetails.details.length > 0 ? (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-gray-700">予約一覧:</p>
                                    {selectedDetails.details.map((detail, idx) => (
                                        <div
                                            key={idx}
                                            className={`rounded-lg p-3 ${
                                                detail.source === 'portal'
                                                    ? 'bg-blue-50'
                                                    : detail.source === 'form'
                                                      ? 'bg-yellow-50'
                                                      : 'bg-purple-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <span
                                                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                                            detail.source === 'portal'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : detail.source === 'form'
                                                                  ? 'bg-yellow-100 text-yellow-700'
                                                                  : 'bg-purple-100 text-purple-700'
                                                        }`}
                                                    >
                                                        {sourceLabels[detail.source] || detail.source}
                                                    </span>
                                                    <p className="font-medium text-gray-900">{detail.name}</p>
                                                    {detail.guests && (
                                                        <p className="text-sm text-gray-600">人数: {detail.guests}名</p>
                                                    )}
                                                    {detail.checkin_date && detail.checkout_date && (
                                                        <p className="text-sm text-gray-600">
                                                            期間: {detail.checkin_date} ~ {detail.checkout_date}
                                                        </p>
                                                    )}
                                                </div>
                                                {detail.id && (
                                                    <Link
                                                        href={route('reservations.banshirou.show', detail.id)}
                                                        className="shrink-0 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-600 shadow-sm hover:bg-blue-50"
                                                    >
                                                        詳細
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mt-2 text-gray-500">この日の予約はありません</p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 p-4">
                            <Link
                                href={route('reservations.banshirou.create')}
                                className="block w-full rounded-md bg-blue-600 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
                            >
                                + この日に予約を作成
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
