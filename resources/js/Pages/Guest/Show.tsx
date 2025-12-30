import { GuestPageData, GuestStaff } from '@/types';
import {
    getMetaMaskDownloadUrl,
    getPolygonscanUrl,
    isMetaMaskInstalled,
    sendJpycTip,
    TIP_AMOUNT,
} from '@/utils/web3';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

interface GuestShowProps {
    guestData: GuestPageData;
    staffList: GuestStaff[];
    googlePlaceId: string;
    lineOfficialUrl: string;
    contactPhone: string;
}

interface TipStatus {
    loading: boolean;
    success: boolean;
    txHash?: string;
    error?: string;
}

export default function Show({
    guestData,
    staffList,
    googlePlaceId,
    lineOfficialUrl,
    contactPhone,
}: GuestShowProps) {
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [tipStatuses, setTipStatuses] = useState<Record<number, TipStatus>>(
        {},
    );

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
            window.open(
                `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
                '_blank',
            );
        } catch (error: unknown) {
            if (axios.isAxiosError(error) && error.response?.status === 410) {
                setReviewError('このページは有効期限が切れています。');
            } else {
                window.open(
                    `https://search.google.com/local/writereview?placeid=${googlePlaceId}`,
                    '_blank',
                );
            }
        }
    };

    // Map API reason codes to Japanese error messages
    const getReasonMessage = (
        reason: string,
        message?: string,
        remainingTips?: number,
    ): string => {
        switch (reason) {
            case 'guest_page_expired':
                return 'このページは有効期限が切れています。';
            case 'staff_not_assigned':
                return 'このスタッフは現在投げ銭を受け付けていません。';
            case 'no_wallet':
                return 'このスタッフはまだウォレットを登録していません。';
            case 'rate_limit':
                return `このスタッフへの投げ銭は24時間以内に5回まで可能です（残り: ${remainingTips ?? 0}回）`;
            default:
                return message || '投げ銭できません。';
        }
    };

    const handleTip = async (staff: GuestStaff) => {
        if (!staff.wallet_address) return;

        // Check MetaMask first
        if (!isMetaMaskInstalled()) {
            const downloadUrl = getMetaMaskDownloadUrl();
            if (
                confirm(
                    'MetaMaskがインストールされていません。ダウンロードページを開きますか？',
                )
            ) {
                window.open(downloadUrl, '_blank');
            }
            return;
        }

        // Check can-tip first (rate limit, assignment, etc.)
        try {
            const canTipResponse = await axios.post('/api/tip/can-tip', {
                guest_page_uuid: guestData.uuid,
                staff_id: staff.id,
            });
            if (!canTipResponse.data.can_tip) {
                const errorMessage = getReasonMessage(
                    canTipResponse.data.reason,
                    canTipResponse.data.message,
                    canTipResponse.data.remaining_tips,
                );
                setTipStatuses((prev) => ({
                    ...prev,
                    [staff.id]: {
                        loading: false,
                        success: false,
                        error: errorMessage,
                    },
                }));
                return;
            }
        } catch {
            // If can-tip API fails, do NOT proceed with tip
            setTipStatuses((prev) => ({
                ...prev,
                [staff.id]: {
                    loading: false,
                    success: false,
                    error: '接続エラーが発生しました。時間をおいて再度お試しください。',
                },
            }));
            return;
        }

        // Set loading state
        setTipStatuses((prev) => ({
            ...prev,
            [staff.id]: { loading: true, success: false },
        }));

        // Send JPYC tip
        const result = await sendJpycTip(staff.wallet_address);

        if (result.success && result.txHash) {
            // Record tip in database
            try {
                await axios.post('/api/tip/record', {
                    guest_page_uuid: guestData.uuid,
                    staff_id: staff.id,
                    transaction_hash: result.txHash,
                    network: 'polygon',
                });
            } catch {
                // Even if recording fails, tip was sent
                console.error('Failed to record tip');
            }

            setTipStatuses((prev) => ({
                ...prev,
                [staff.id]: {
                    loading: false,
                    success: true,
                    txHash: result.txHash,
                },
            }));
        } else {
            setTipStatuses((prev) => ({
                ...prev,
                [staff.id]: {
                    loading: false,
                    success: false,
                    error: result.errorMessage,
                },
            }));
        }
    };

    const renderTipButton = (staff: GuestStaff) => {
        if (!staff.wallet_address) return null;

        const status = tipStatuses[staff.id];

        // Loading state
        if (status?.loading) {
            return (
                <button
                    disabled
                    className="rounded-full bg-gray-300 px-4 py-2 text-sm font-medium text-gray-600"
                >
                    送信中...
                </button>
            );
        }

        // Success state
        if (status?.success && status.txHash) {
            return (
                <div className="text-right">
                    <span className="text-sm text-green-600">送信完了</span>
                    <a
                        href={getPolygonscanUrl(status.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-blue-500 underline"
                    >
                        確認
                    </a>
                </div>
            );
        }

        // Default or error state - show button
        return (
            <div className="text-right">
                <button
                    className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white hover:from-purple-600 hover:to-pink-600"
                    onClick={() => handleTip(staff)}
                >
                    投げ銭（{TIP_AMOUNT}円）
                </button>
                {status?.error && (
                    <p className="mt-1 text-xs text-red-500">{status.error}</p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <Head title={`${guestData.guest_name}様 - ゲストページ`} />

            <div className="mx-auto max-w-lg px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {guestData.guest_name}様
                    </h1>
                    <p className="mt-2 text-sm text-gray-600">
                        {guestData.room_number &&
                            `お部屋: ${guestData.room_number} | `}
                        {guestData.check_in_date} 〜 {guestData.check_out_date}
                    </p>
                </div>

                {/* Staff List */}
                <div className="mb-8">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">
                        担当スタッフ
                    </h2>
                    <div className="space-y-4">
                        {staffList.map((staff) => (
                            <div
                                key={staff.id}
                                className="rounded-lg bg-white p-4 shadow-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                            {staff.avatar ? (
                                                <img
                                                    src={staff.avatar}
                                                    alt={staff.name}
                                                    className="h-12 w-12 rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-bold text-blue-600">
                                                    {staff.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {staff.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {roleLabels[staff.role] ||
                                                    staff.role}
                                            </p>
                                        </div>
                                    </div>
                                    {renderTipButton(staff)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Google Review */}
                <div className="mb-6">
                    <button
                        onClick={handleGoogleReviewClick}
                        className="hover:bg-gray-50:bg-gray-700 flex w-full items-center justify-center rounded-lg bg-white px-6 py-4 shadow-sm"
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
                        <span className="font-medium text-gray-900">
                            Googleで口コミを書く
                        </span>
                    </button>
                    {reviewError && (
                        <p className="mt-2 text-center text-sm text-red-600">
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
                        <span className="font-medium">ライン</span>
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
