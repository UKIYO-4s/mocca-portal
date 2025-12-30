import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router } from '@inertiajs/react';

interface MonthlyTimeReport {
    user_id: number;
    user_name: string;
    work_days: number;
    total_work_minutes: number;
    total_break_minutes: number;
    average_work_minutes_per_day: number;
}

interface Props extends PageProps {
    reports: MonthlyTimeReport[];
    currentMonth: string;
}

/**
 * Format minutes as Japanese time string (e.g., "8時間30分")
 */
const formatMinutesToJapanese = (totalMinutes: number): string => {
    if (totalMinutes === 0) return '0分';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);

    if (hours === 0) return `${minutes}分`;
    if (minutes === 0) return `${hours}時間`;
    return `${hours}時間${minutes}分`;
};

/**
 * Format minutes as HH:MM format (e.g., "8:30")
 */
const formatMinutesToHHMM = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

export default function Reports({ auth, reports, currentMonth }: Props) {
    // Parse current month for navigation
    const currentDate = new Date(currentMonth + '-01');

    const navigateMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        const newMonth = `${newDate.getFullYear()}-${(newDate.getMonth() + 1).toString().padStart(2, '0')}`;
        router.get(
            route('timecard.reports'),
            { month: newMonth },
            { preserveState: true },
        );
    };

    const goToCurrentMonth = () => {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        router.get(
            route('timecard.reports'),
            { month: thisMonth },
            { preserveState: true },
        );
    };

    // Format month display (e.g., "2025年1月")
    const formatMonthDisplay = (monthString: string): string => {
        const date = new Date(monthString + '-01');
        return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    };

    // Calculate summary totals
    const summaryTotals = reports.reduce(
        (acc, report) => ({
            totalWorkDays: acc.totalWorkDays + report.work_days,
            totalWorkMinutes: acc.totalWorkMinutes + report.total_work_minutes,
            totalBreakMinutes:
                acc.totalBreakMinutes + report.total_break_minutes,
        }),
        { totalWorkDays: 0, totalWorkMinutes: 0, totalBreakMinutes: 0 },
    );

    // Calculate overall average (total work minutes / total work days)
    const overallAverageMinutes =
        summaryTotals.totalWorkDays > 0
            ? summaryTotals.totalWorkMinutes / summaryTotals.totalWorkDays
            : 0;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    月次勤怠レポート
                </h2>
            }
        >
            <Head title="月次勤怠レポート" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Selector */}
                    <div className="mb-6 flex items-center justify-center gap-4">
                        <button
                            onClick={() => navigateMonth(-1)}
                            className="hover:bg-gray-300:bg-gray-600 inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            <svg
                                className="mr-1 h-4 w-4"
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

                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-gray-900">
                                {formatMonthDisplay(currentMonth)}
                            </span>
                            <button
                                onClick={goToCurrentMonth}
                                className="hover:bg-blue-200:bg-blue-800 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                                今月
                            </button>
                        </div>

                        <button
                            onClick={() => navigateMonth(1)}
                            className="hover:bg-gray-300:bg-gray-600 inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            翌月
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
                        </button>
                    </div>

                    {/* Reports Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        {reports.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">
                                    {formatMonthDisplay(currentMonth)}
                                    の勤怠データがありません
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                スタッフ名
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                出勤日数
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                総勤務時間
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                総休憩時間
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                平均勤務時間/日
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {reports.map((report) => (
                                            <tr
                                                key={report.user_id}
                                                className="hover:bg-gray-50:bg-gray-700"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {report.user_name}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                    {report.work_days}日
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                    <span
                                                        title={formatMinutesToHHMM(
                                                            report.total_work_minutes,
                                                        )}
                                                    >
                                                        {formatMinutesToJapanese(
                                                            report.total_work_minutes,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                    <span
                                                        title={formatMinutesToHHMM(
                                                            report.total_break_minutes,
                                                        )}
                                                    >
                                                        {formatMinutesToJapanese(
                                                            report.total_break_minutes,
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                    <span
                                                        title={formatMinutesToHHMM(
                                                            report.average_work_minutes_per_day,
                                                        )}
                                                    >
                                                        {formatMinutesToJapanese(
                                                            report.average_work_minutes_per_day,
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Summary Totals */}
                                    <tfoot className="bg-gray-100">
                                        <tr className="font-semibold">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                合計 / 平均
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                {summaryTotals.totalWorkDays}日
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                <span
                                                    title={formatMinutesToHHMM(
                                                        summaryTotals.totalWorkMinutes,
                                                    )}
                                                >
                                                    {formatMinutesToJapanese(
                                                        summaryTotals.totalWorkMinutes,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                <span
                                                    title={formatMinutesToHHMM(
                                                        summaryTotals.totalBreakMinutes,
                                                    )}
                                                >
                                                    {formatMinutesToJapanese(
                                                        summaryTotals.totalBreakMinutes,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
                                                <span
                                                    title={formatMinutesToHHMM(
                                                        overallAverageMinutes,
                                                    )}
                                                >
                                                    {formatMinutesToJapanese(
                                                        overallAverageMinutes,
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-4 text-sm text-gray-500">
                        <p>* 時間にマウスを合わせるとHH:MM形式で表示されます</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
