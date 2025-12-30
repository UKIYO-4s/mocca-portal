import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { TimeRecord, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface Props {
    records: TimeRecord[];
    users: User[];
    selectedUserId: number | null;
    currentMonth: string;
    auth: { user: User };
}

export default function Manage({
    auth,
    records,
    users,
    selectedUserId,
    currentMonth,
}: Props) {
    const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        clock_in: '',
        clock_out: '',
        break_minutes: 0,
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Parse the current month for navigation
    const [year, month] = currentMonth.split('-').map(Number);
    const currentDate = new Date(year, month - 1, 1);

    const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const userId = value ? parseInt(value, 10) : null;

        router.get(
            route('timecard.manage'),
            {
                user_id: userId ?? undefined,
                month: currentMonth,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleMonthChange = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (direction === 'prev') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }

        const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;

        router.get(
            route('timecard.manage'),
            {
                user_id: selectedUserId ?? undefined,
                month: newMonth,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const openEditModal = (record: TimeRecord) => {
        setEditingRecord(record);
        setFormData({
            clock_in: record.clock_in
                ? formatTimeForInput(record.clock_in)
                : '',
            clock_out: record.clock_out
                ? formatTimeForInput(record.clock_out)
                : '',
            break_minutes: record.break_minutes,
            notes: record.notes ?? '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRecord(null);
        setFormData({
            clock_in: '',
            clock_out: '',
            break_minutes: 0,
            notes: '',
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;

        setIsSubmitting(true);
        router.put(
            route('timecard.update', editingRecord.id),
            {
                clock_in: formData.clock_in || null,
                clock_out: formData.clock_out || null,
                break_minutes: formData.break_minutes,
                notes: formData.notes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    // Format datetime string for display
    const formatTime = (datetime: string | null): string => {
        if (!datetime) return '-';
        const date = new Date(datetime);
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Format datetime string for input (HH:MM)
    const formatTimeForInput = (datetime: string): string => {
        const date = new Date(datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Format date for display
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        return `${date.getMonth() + 1}/${date.getDate()} (${dayOfWeek})`;
    };

    // Format minutes to hours and minutes
    const formatMinutesToTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}分`;
        if (mins === 0) return `${hours}時間`;
        return `${hours}時間${mins}分`;
    };

    // Get status badge
    const getStatusBadge = (status: TimeRecord['status']) => {
        const statusConfig = {
            not_started: {
                label: '未出勤',
                className: 'bg-gray-100 text-gray-800',
            },
            working: {
                label: '勤務中',
                className: 'bg-green-100 text-green-800',
            },
            on_break: {
                label: '休憩中',
                className: 'bg-yellow-100 text-yellow-800',
            },
            completed: {
                label: '退勤済',
                className: 'bg-blue-100 text-blue-800',
            },
        };

        const config = statusConfig[status];
        return (
            <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${config.className}`}
            >
                {config.label}
            </span>
        );
    };

    // Format month for display
    const formatMonthDisplay = (): string => {
        return `${year}年${month}月`;
    };

    // Calculate total work minutes for display
    const calculateTotalWorkMinutes = (): number => {
        return records.reduce((total, record) => {
            return total + (record.work_minutes ?? 0);
        }, 0);
    };

    // Calculate total work days
    const calculateWorkDays = (): number => {
        return records.filter((record) => record.status === 'completed').length;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    勤怠管理
                </h2>
            }
        >
            <Head title="勤怠管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="p-6">
                            {/* Filters */}
                            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                {/* User Filter */}
                                <div className="flex items-center gap-2">
                                    <label
                                        htmlFor="user-filter"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        スタッフ:
                                    </label>
                                    <select
                                        id="user-filter"
                                        value={selectedUserId ?? ''}
                                        onChange={handleUserChange}
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">すべて</option>
                                        {users.map((user) => (
                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {user.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Month Selector */}
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleMonthChange('prev')
                                        }
                                        className="hover:bg-gray-200:bg-gray-600 rounded-md bg-gray-100 p-2 text-gray-600"
                                    >
                                        <svg
                                            className="h-5 w-5"
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
                                    </button>
                                    <span className="min-w-[120px] text-center text-sm font-medium text-gray-900">
                                        {formatMonthDisplay()}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleMonthChange('next')
                                        }
                                        className="hover:bg-gray-200:bg-gray-600 rounded-md bg-gray-100 p-2 text-gray-600"
                                    >
                                        <svg
                                            className="h-5 w-5"
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

                            {/* Summary Stats */}
                            {selectedUserId && records.length > 0 && (
                                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-3">
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            出勤日数
                                        </div>
                                        <div className="text-xl font-semibold text-gray-900">
                                            {calculateWorkDays()}日
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">
                                            合計勤務時間
                                        </div>
                                        <div className="text-xl font-semibold text-gray-900">
                                            {formatMinutesToTime(
                                                calculateTotalWorkMinutes(),
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <div className="text-sm text-gray-500">
                                            レコード数
                                        </div>
                                        <div className="text-xl font-semibold text-gray-900">
                                            {records.length}件
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Records Table */}
                            {records.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    日付
                                                </th>
                                                {!selectedUserId && (
                                                    <th
                                                        scope="col"
                                                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                    >
                                                        スタッフ
                                                    </th>
                                                )}
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    出勤
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    退勤
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    休憩
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    勤務時間
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    ステータス
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                                                >
                                                    備考
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {records.map((record) => (
                                                <tr
                                                    key={record.id}
                                                    onClick={() =>
                                                        openEditModal(record)
                                                    }
                                                    className="hover:bg-gray-50:bg-gray-700/50 cursor-pointer transition-colors"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                                                        {formatDate(
                                                            record.date,
                                                        )}
                                                    </td>
                                                    {!selectedUserId && (
                                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                                                            {record.user
                                                                ?.name ?? '-'}
                                                        </td>
                                                    )}
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {formatTime(
                                                            record.clock_in,
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {formatTime(
                                                            record.clock_out,
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {record.break_minutes >
                                                        0
                                                            ? formatMinutesToTime(
                                                                  record.break_minutes,
                                                              )
                                                            : '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700">
                                                        {record.work_minutes
                                                            ? formatMinutesToTime(
                                                                  record.work_minutes,
                                                              )
                                                            : '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center">
                                                        {getStatusBadge(
                                                            record.status,
                                                        )}
                                                    </td>
                                                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-500">
                                                        {record.notes ?? '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        勤怠記録がありません
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        選択された条件に一致する勤怠記録が見つかりませんでした。
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                        <p className="font-medium">勤怠管理について:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>
                                テーブルの行をクリックすると、勤怠記録を編集できます
                            </li>
                            <li>
                                出勤・退勤時刻、休憩時間、備考を修正できます
                            </li>
                            <li>修正履歴は自動的に記録されます</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                        勤怠記録の編集
                    </h3>

                    {editingRecord && (
                        <div className="mt-2 text-sm text-gray-500">
                            {editingRecord.user?.name} -{' '}
                            {formatDate(editingRecord.date)}
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        {/* Clock In */}
                        <div>
                            <label
                                htmlFor="clock_in"
                                className="block text-sm font-medium text-gray-700"
                            >
                                出勤時刻
                            </label>
                            <input
                                type="time"
                                id="clock_in"
                                value={formData.clock_in}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        clock_in: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        {/* Clock Out */}
                        <div>
                            <label
                                htmlFor="clock_out"
                                className="block text-sm font-medium text-gray-700"
                            >
                                退勤時刻
                            </label>
                            <input
                                type="time"
                                id="clock_out"
                                value={formData.clock_out}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        clock_out: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        {/* Break Minutes */}
                        <div>
                            <label
                                htmlFor="break_minutes"
                                className="block text-sm font-medium text-gray-700"
                            >
                                休憩時間（分）
                            </label>
                            <input
                                type="number"
                                id="break_minutes"
                                min="0"
                                max="480"
                                value={formData.break_minutes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        break_minutes:
                                            parseInt(e.target.value, 10) || 0,
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label
                                htmlFor="notes"
                                className="block text-sm font-medium text-gray-700"
                            >
                                備考
                            </label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        notes: e.target.value,
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="修正理由など..."
                            />
                        </div>
                    </div>

                    {/* Modified Info */}
                    {editingRecord?.modified_at && (
                        <div className="mt-4 text-xs text-gray-500">
                            最終修正:{' '}
                            {new Date(editingRecord.modified_at).toLocaleString(
                                'ja-JP',
                            )}
                            {editingRecord.modified_by_user && (
                                <span>
                                    {' '}
                                    ({editingRecord.modified_by_user.name})
                                </span>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="focus:ring-offset-2:bg-gray-600 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg
                                        className="-ml-1 mr-2 h-4 w-4 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    保存中...
                                </>
                            ) : (
                                '保存'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
