import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface TimeRecord {
    id: number;
    user_id: number;
    date: string;
    clock_in: string | null;
    break_start: string | null;
    break_end: string | null;
    clock_out: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    todayRecord: TimeRecord | null;
}

export default function Index({ todayRecord }: Props) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format time string (HH:mm:ss)
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    // Format date string (YYYY年MM月DD日 (曜日))
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
        });
    };

    // Format recorded time for display (HH:mm)
    const formatRecordedTime = (timeString: string | null): string => {
        if (!timeString) return '--:--';
        const date = new Date(timeString);
        if (isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    };

    // Determine button states based on todayRecord
    const getButtonStates = () => {
        if (!todayRecord || !todayRecord.clock_in) {
            // No record or no clock_in: Only clock-in enabled
            return {
                clockIn: true,
                breakStart: false,
                breakEnd: false,
                clockOut: false,
            };
        }

        if (todayRecord.clock_out) {
            // Already clocked out: All disabled
            return {
                clockIn: false,
                breakStart: false,
                breakEnd: false,
                clockOut: false,
            };
        }

        if (todayRecord.break_start && !todayRecord.break_end) {
            // On break: Only break-end enabled
            return {
                clockIn: false,
                breakStart: false,
                breakEnd: true,
                clockOut: false,
            };
        }

        if (todayRecord.break_end) {
            // Break done, not clocked out: Only clock-out enabled
            return {
                clockIn: false,
                breakStart: false,
                breakEnd: false,
                clockOut: true,
            };
        }

        // Clocked in, no break yet, not clocked out: break-start and clock-out enabled
        return {
            clockIn: false,
            breakStart: true,
            breakEnd: false,
            clockOut: true,
        };
    };

    const buttonStates = getButtonStates();
    const isCompleted =
        todayRecord?.clock_out !== null && todayRecord?.clock_out !== undefined;

    const handleAction = (action: string, routeName: string) => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        router.post(
            route(routeName),
            {},
            {
                preserveState: false,
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    打刻
                </h2>
            }
        >
            <Head title="打刻" />

            <div className="py-6">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {/* Current Time Display */}
                    <div className="mb-8 rounded-lg bg-white p-8 text-center shadow-sm">
                        <p className="text-lg text-gray-600">
                            {formatDate(currentTime)}
                        </p>
                        <p className="mt-2 font-mono text-6xl font-bold text-gray-900">
                            {formatTime(currentTime)}
                        </p>
                    </div>

                    {/* Today's Status */}
                    <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-lg font-medium text-gray-900">
                            本日の勤務状況
                        </h3>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <p className="text-sm text-gray-500">
                                    出勤時刻
                                </p>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatRecordedTime(
                                        todayRecord?.clock_in ?? null,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <p className="text-sm text-gray-500">
                                    休憩開始
                                </p>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatRecordedTime(
                                        todayRecord?.break_start ?? null,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <p className="text-sm text-gray-500">
                                    休憩終了
                                </p>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatRecordedTime(
                                        todayRecord?.break_end ?? null,
                                    )}
                                </p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-4 text-center">
                                <p className="text-sm text-gray-500">
                                    退勤時刻
                                </p>
                                <p className="mt-1 text-xl font-semibold text-gray-900">
                                    {formatRecordedTime(
                                        todayRecord?.clock_out ?? null,
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Completed Message */}
                    {isCompleted && (
                        <div className="mb-8 rounded-lg bg-green-50 p-6 text-center">
                            <svg
                                className="mx-auto h-12 w-12 text-green-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <p className="mt-4 text-lg font-medium text-green-700">
                                本日の勤務は完了しました
                            </p>
                            <p className="mt-1 text-sm text-green-600">
                                お疲れ様でした
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {/* Clock In Button */}
                        <button
                            onClick={() =>
                                handleAction('clock-in', 'timecard.clock-in')
                            }
                            disabled={!buttonStates.clockIn || isSubmitting}
                            className={`flex flex-col items-center justify-center rounded-lg p-6 text-white transition-colors ${
                                buttonStates.clockIn && !isSubmitting
                                    ? 'bg-blue-600 hover:bg-blue-700'
                                    : 'cursor-not-allowed bg-gray-400'
                            }`}
                        >
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                />
                            </svg>
                            <span className="mt-2 text-lg font-medium">
                                出勤
                            </span>
                        </button>

                        {/* Break Start Button */}
                        <button
                            onClick={() =>
                                handleAction(
                                    'break-start',
                                    'timecard.break-start',
                                )
                            }
                            disabled={!buttonStates.breakStart || isSubmitting}
                            className={`flex flex-col items-center justify-center rounded-lg p-6 text-white transition-colors ${
                                buttonStates.breakStart && !isSubmitting
                                    ? 'bg-yellow-500 hover:bg-yellow-600'
                                    : 'cursor-not-allowed bg-gray-400'
                            }`}
                        >
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="mt-2 text-lg font-medium">
                                休憩開始
                            </span>
                        </button>

                        {/* Break End Button */}
                        <button
                            onClick={() =>
                                handleAction('break-end', 'timecard.break-end')
                            }
                            disabled={!buttonStates.breakEnd || isSubmitting}
                            className={`flex flex-col items-center justify-center rounded-lg p-6 text-white transition-colors ${
                                buttonStates.breakEnd && !isSubmitting
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'cursor-not-allowed bg-gray-400'
                            }`}
                        >
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <span className="mt-2 text-lg font-medium">
                                休憩終了
                            </span>
                        </button>

                        {/* Clock Out Button */}
                        <button
                            onClick={() =>
                                handleAction('clock-out', 'timecard.clock-out')
                            }
                            disabled={!buttonStates.clockOut || isSubmitting}
                            className={`flex flex-col items-center justify-center rounded-lg p-6 text-white transition-colors ${
                                buttonStates.clockOut && !isSubmitting
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'cursor-not-allowed bg-gray-400'
                            }`}
                        >
                            <svg
                                className="h-8 w-8"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                />
                            </svg>
                            <span className="mt-2 text-lg font-medium">
                                退勤
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
