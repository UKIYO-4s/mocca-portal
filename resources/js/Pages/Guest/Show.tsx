import { Head } from '@inertiajs/react';
import { GuestPageData, GuestStaff } from '@/types';
import axios from 'axios';
import { useState } from 'react';

interface GuestShowProps {
    guestData: GuestPageData;
    staffList: GuestStaff[];
    googlePlaceId: string;
    lineOfficialUrl: string;
    contactPhone: string;
}

export default function Show({
    guestData,
    staffList,
    googlePlaceId,
    lineOfficialUrl,
    contactPhone,
}: GuestShowProps) {
    const [reviewError, setReviewError] = useState<string | null>(null);

    const roleLabels: Record<string, string> = {
        cooking: '調理',
        cleaning: '清掃',
        front: 'フロント',
    };

    const handleGoogleReviewClick = async () => {
        setReviewError(null);
        try {
            await axios.post('/api/review/clicked', {
                guest_page_uuid: guestData.uuid,
            });
            // Open Google Review page after recording the click
            window.open(
                `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
                '_blank'
            );
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 410) {
                setReviewError('このページは有効期限が切れています。');
            } else {
                // Still open the review page even if recording fails
                window.open(
                    `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
                    '_blank'
                );
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <Head title={`${guestData.guest_name}様 - ゲストページ`} />

            <div className="mx-auto max-w-lg px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {guestData.guest_name}様
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {guestData.room_number && `お部屋: ${guestData.room_number} | `}
                        {guestData.check_in_date} 〜 {guestData.check_out_date}
                    </p>
                </div>

                {/* Staff List */}
                <div className="mb-8">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                        担当スタッフ
                    </h2>
                    <div className="space-y-4">
                        {staffList.map((staff) => (
                            <div
                                key={staff.id}
                                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                        {staff.avatar ? (
                                            <img
                                                src={staff.avatar}
                                                alt={staff.name}
                                                className="h-12 w-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {staff.name.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {staff.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {roleLabels[staff.role] || staff.role}
                                        </p>
                                    </div>
                                </div>
                                {staff.wallet_address && (
                                    <button
                                        className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-500"
                                        onClick={() => {
                                            // TODO: Web3 tip implementation
                                            alert('投げ銭機能は準備中です');
                                        }}
                                    >
                                        投げ銭
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Google Review */}
                <div className="mb-6">
                    <button
                        onClick={handleGoogleReviewClick}
                        className="flex w-full items-center justify-center rounded-lg bg-white px-6 py-4 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <svg className="mr-3 h-6 w-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">
                            Googleで口コミを書く
                        </span>
                    </button>
                    {reviewError && (
                        <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">
                            {reviewError}
                        </p>
                    )}
                </div>

                {/* Contact Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <a
                        href={lineOfficialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center rounded-lg bg-green-500 px-4 py-3 text-white hover:bg-green-600"
                    >
                        <span className="font-medium">LINE</span>
                    </a>
                    <a
                        href={`tel:${contactPhone}`}
                        className="flex items-center justify-center rounded-lg bg-blue-500 px-4 py-3 text-white hover:bg-blue-600"
                    >
                        <span className="font-medium">電話</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
