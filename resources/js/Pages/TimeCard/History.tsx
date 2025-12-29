import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';

interface TimeRecord {
    id: number;
    user_id: number;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    break_minutes: number;
    work_minutes: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Props extends PageProps {
    records: TimeRecord[];
    currentMonth: string;
}

export default function History({ records, currentMonth }: Props) {
    const [selectedYear, setSelectedYear] = useState(currentMonth.split('-')[0]);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth.split('-')[1]);

    // Generate year options (current year and 2 years back)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

    // Generate month options
    const months = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString().padStart(2, '0');
        return { value: month, label: `${i + 1}月` };
    });

    const handleMonthChange = () => {
        const month = `${selectedYear}-${selectedMonth}`;
        router.get(route('timecard.history'), { month }, { preserveState: true });
    };

    const formatTime = (timeString: string | null): string => {
        if (!timeString) return '-';
        // If it's already in HH:mm format, return as is
        if (/^\d{2}:\d{2}$/.test(timeString)) {
            return timeString;
        }
        // If it's a datetime string, extract the time
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        return `${date.getMonth() + 1}/${date.getDate()} (${dayOfWeek})`;
    };

    const formatMinutes = (minutes: number): string => {
        if (minutes === 0) return '-';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}分`;
        if (mins === 0) return `${hours}時間`;
        return `${hours}時間${mins}分`;
    };

    // Calculate total work hours for the month
    const totalWorkMinutes = records.reduce((sum, record) => sum + record.work_minutes, 0);
    const totalWorkHours = Math.floor(totalWorkMinutes / 60);
    const totalWorkMins = totalWorkMinutes % 60;

    // Calculate total break time for the month
    const totalBreakMinutes = records.reduce((sum, record) => sum + record.break_minutes, 0);

    // Count working days
    const workingDays = records.filter(record => record.work_minutes > 0).length;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    勤務履歴
                </h2>
            }
        >
            <Head title="勤務履歴" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Selector */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    年月選択:
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>
                                            {year}年
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    {months.map((month) => (
                                        <option key={month.value} value={month.value}>
                                            {month.label}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleMonthChange}
                                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                                >
                                    表示
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                合計勤務時間
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900">
                                {totalWorkHours}時間{totalWorkMins > 0 && `${totalWorkMins}分`}
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                出勤日数
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900">
                                {workingDays}日
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                合計休憩時間
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-900">
                                {formatMinutes(totalBreakMinutes)}
                            </div>
                        </div>
                    </div>

                    {/* Time Records Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        {records.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">
                                    この月の勤務記録がありません
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                日付
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                出勤
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                退勤
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                休憩時間
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                勤務時間
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                備考
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {records.map((record) => (
                                            <tr
                                                key={record.id}
                                                className="hover:bg-gray-50:bg-gray-700"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {formatDate(record.date)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {formatTime(record.clock_in)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {formatTime(record.clock_out)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {formatMinutes(record.break_minutes)}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {formatMinutes(record.work_minutes)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {record.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
