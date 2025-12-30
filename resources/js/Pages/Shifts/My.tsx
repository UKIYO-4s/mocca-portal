import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { User, Shift } from '@/types';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    currentMonth: string; // YYYY-MM format
    workingCount: number;
    offCount: number;
}

export default function My({ auth, shifts, currentMonth, workingCount, offCount }: Props) {
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
        const date = new Date(dateString + 'T00:00:00');
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}年${m}月${d}日 (${dayOfWeek})`;
    };

    // Sort shifts by date
    const sortedShifts = [...shifts].sort((a, b) => a.date.localeCompare(b.date));

    const displayMonth = `${year}年${month}月`;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    マイシフト
                </h2>
            }
        >
            <Head title="マイシフト" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Month Navigation */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                前月
                            </button>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {displayMonth}
                            </h3>
                            <button
                                onClick={() => navigateMonth('next')}
                                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                                翌月
                            </button>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                出勤日数
                            </div>
                            <div className="mt-1 text-2xl font-bold text-green-600">
                                {workingCount}日
                            </div>
                        </div>
                        <div className="rounded-lg bg-white p-4 shadow-sm">
                            <div className="text-sm font-medium text-gray-500">
                                休日日数
                            </div>
                            <div className="mt-1 text-2xl font-bold text-gray-500">
                                {offCount}日
                            </div>
                        </div>
                    </div>

                    {/* Shifts List */}
                    <div className="rounded-lg bg-white shadow-sm">
                        {shifts.length === 0 ? (
                            <div className="p-8 text-center">
                                <p className="text-gray-500">
                                    この月のシフトがありません
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {sortedShifts.map((shift) => (
                                    <div key={shift.id} className="flex items-center justify-between p-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {formatDate(shift.date)}
                                        </div>
                                        <div>
                                            {shift.status === 'working' ? (
                                                <span className="inline-flex items-center rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                    出勤
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                                                    休日
                                                </span>
                                            )}
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
