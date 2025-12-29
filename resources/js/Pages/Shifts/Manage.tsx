import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, useForm, router } from '@inertiajs/react';
import { Shift, User, Location } from '@/types';
import { FormEvent, useState, useMemo } from 'react';

interface Props {
    auth: { user: User };
    shifts: Shift[];
    users: User[];
    locations: Location[];
}

interface ShiftFormData {
    user_id: number | '';
    date: string;
    start_time: string;
    end_time: string;
    location_id: number | '' | null;
    notes: string;
}

export default function Manage({ auth, shifts, users, locations }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingShift, setDeletingShift] = useState<Shift | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<ShiftFormData>({
        user_id: '',
        date: '',
        start_time: '',
        end_time: '',
        location_id: '',
        notes: '',
    });

    // Sort shifts by date
    const sortedShifts = useMemo(() => {
        return [...shifts].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        });
    }, [shifts, sortDirection]);

    const toggleSortDirection = () => {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };

    const openCreateModal = () => {
        setEditingShift(null);
        reset();
        clearErrors();
        setIsModalOpen(true);
    };

    const openEditModal = (shift: Shift) => {
        setEditingShift(shift);
        setData({
            user_id: shift.user_id,
            date: shift.date,
            start_time: shift.start_time,
            end_time: shift.end_time,
            location_id: shift.location_id ?? '',
            notes: shift.notes ?? '',
        });
        clearErrors();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingShift(null);
        reset();
        clearErrors();
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Set location_id to null if empty before submission
        if (data.location_id === '') {
            setData('location_id', null);
        }

        if (editingShift) {
            put(route('shifts.update', editingShift.id), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        } else {
            post(route('shifts.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const openDeleteConfirm = (shift: Shift) => {
        setDeletingShift(shift);
        setShowDeleteConfirm(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setDeletingShift(null);
    };

    const handleDelete = () => {
        if (!deletingShift) return;

        router.delete(route('shifts.destroy', deletingShift.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeDeleteConfirm();
            },
        });
    };

    // Format date for display
    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayOfWeek = dayNames[date.getDay()];
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${dayOfWeek})`;
    };

    // Format time for display (HH:MM)
    const formatTime = (time: string): string => {
        return time.substring(0, 5);
    };

    // Get location name or default
    const getLocationName = (shift: Shift): string => {
        if (shift.location) {
            return shift.location.name;
        }
        return '全店舗';
    };

    // Validate end time is after start time
    const isEndTimeValid = (): boolean => {
        if (!data.start_time || !data.end_time) return true;
        return data.end_time > data.start_time;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    シフト管理
                </h2>
            }
        >
            <Head title="シフト管理" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="p-6">
                            {/* Header with Add Button */}
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    シフト一覧
                                </h3>
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    <svg
                                        className="-ml-1 mr-2 h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                        />
                                    </svg>
                                    新規シフト追加
                                </button>
                            </div>

                            {/* Shifts Table */}
                            {sortedShifts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    スタッフ
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="cursor-pointer px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
                                                    onClick={toggleSortDirection}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        日付
                                                        <svg
                                                            className={`h-4 w-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 9l-7 7-7-7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    開始
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    終了
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    拠点
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    備考
                                                </th>
                                                <th
                                                    scope="col"
                                                    className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                >
                                                    操作
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                                            {sortedShifts.map((shift) => (
                                                <tr
                                                    key={shift.id}
                                                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {shift.user?.name ?? '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {formatDate(shift.date)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                                                        {formatTime(shift.start_time)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                                                        {formatTime(shift.end_time)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {getLocationName(shift)}
                                                    </td>
                                                    <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                        {shift.notes ?? '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(shift)}
                                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                title="編集"
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
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteConfirm(shift)}
                                                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                                title="削除"
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
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
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
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                                        シフトがありません
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        「新規シフト追加」ボタンからシフトを登録してください。
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        <p className="font-medium">シフト管理について:</p>
                        <ul className="mt-2 list-inside list-disc space-y-1">
                            <li>シフトは日付・時間・スタッフを指定して登録できます</li>
                            <li>同じスタッフの時間が重複するシフトは登録できません</li>
                            <li>拠点を指定しない場合は「全店舗」扱いになります</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="lg">
                <form onSubmit={handleSubmit} className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {editingShift ? 'シフト編集' : '新規シフト追加'}
                    </h3>

                    <div className="mt-6 space-y-4">
                        {/* User */}
                        <div>
                            <label
                                htmlFor="user_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                スタッフ <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="user_id"
                                value={data.user_id}
                                onChange={(e) =>
                                    setData('user_id', e.target.value ? Number(e.target.value) : '')
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                                required
                            >
                                <option value="">選択してください</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && (
                                <p className="mt-1 text-sm text-red-500">{errors.user_id}</p>
                            )}
                        </div>

                        {/* Date */}
                        <div>
                            <label
                                htmlFor="date"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                日付 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                                required
                            />
                            {errors.date && (
                                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
                            )}
                        </div>

                        {/* Start Time */}
                        <div>
                            <label
                                htmlFor="start_time"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                開始時刻 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                id="start_time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                                required
                            />
                            {errors.start_time && (
                                <p className="mt-1 text-sm text-red-500">{errors.start_time}</p>
                            )}
                        </div>

                        {/* End Time */}
                        <div>
                            <label
                                htmlFor="end_time"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                終了時刻 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                id="end_time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                                required
                            />
                            {errors.end_time && (
                                <p className="mt-1 text-sm text-red-500">{errors.end_time}</p>
                            )}
                            {!isEndTimeValid() && (
                                <p className="mt-1 text-sm text-red-500">
                                    終了時刻は開始時刻より後にしてください
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div>
                            <label
                                htmlFor="location_id"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                拠点
                            </label>
                            <select
                                id="location_id"
                                value={data.location_id ?? ''}
                                onChange={(e) =>
                                    setData('location_id', e.target.value ? Number(e.target.value) : '')
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                            >
                                <option value="">全店舗</option>
                                {locations.map((location) => (
                                    <option key={location.id} value={location.id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                            {errors.location_id && (
                                <p className="mt-1 text-sm text-red-500">{errors.location_id}</p>
                            )}
                        </div>

                        {/* Notes */}
                        <div>
                            <label
                                htmlFor="notes"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                備考
                            </label>
                            <textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:text-sm"
                                placeholder="メモなど..."
                            />
                            {errors.notes && (
                                <p className="mt-1 text-sm text-red-500">{errors.notes}</p>
                            )}
                        </div>
                    </div>

                    {/* General Error Message (for overlap errors etc.) */}
                    {Object.keys(errors).some(key => !['user_id', 'date', 'start_time', 'end_time', 'location_id', 'notes'].includes(key)) && (
                        <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        {Object.entries(errors)
                                            .filter(([key]) => !['user_id', 'date', 'start_time', 'end_time', 'location_id', 'notes'].includes(key))
                                            .map(([, value]) => value)
                                            .join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !isEndTimeValid()}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {processing ? (
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
                            ) : editingShift ? (
                                '更新'
                            ) : (
                                '追加'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deletingShift && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            シフトを削除しますか?
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            {deletingShift.user?.name}さんの{formatDate(deletingShift.date)}のシフト（
                            {formatTime(deletingShift.start_time)} - {formatTime(deletingShift.end_time)}
                            ）を削除します。この操作は取り消せません。
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                                キャンセル
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                削除する
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
