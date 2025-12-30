import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { formatDateYmd } from '@/utils/date';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

interface Reservation {
    id: number;
    name: string;
    name_kana: string;
    phone: string;
    checkin_date: string;
    checkout_date: string;
    guest_count_adults: number;
    guest_count_children: number;
    meal_option: string;
    status: string;
    formatted_phone: string;
    phone_link: string;
    total_guests: number;
    nights: number;
    meal_option_label: string;
    status_label: string;
    mocca_reservations_count: number;
    cleaning_assignment?: { user: { name: string } };
    setup_assignment?: { user: { name: string } };
}

interface PaginatedData {
    data: Reservation[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props extends PageProps {
    reservations: PaginatedData;
    filters: {
        from?: string;
        to?: string;
        status?: string;
        view?: string;
    };
}

type ViewMode = 'day' | 'week' | 'month';

// 電話番号からハイフンを除去してtel:リンクを生成
const createTelLink = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    return `tel:${digits}`;
};

// 日付をYYYY-MM-DD形式で取得
const getDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// 週の開始日（月曜日）を取得
const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
};

// 週の終了日（日曜日）を取得
const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return end;
};

// 月の開始日を取得
const getMonthStart = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

// 月の終了日を取得
const getMonthEnd = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export default function Index({ auth, reservations, filters }: Props) {
    const [viewMode, setViewMode] = useState<ViewMode>(
        (filters.view as ViewMode) || 'week',
    );
    const [status, setStatus] = useState(filters.status || '');
    const [baseDate, setBaseDate] = useState(() => new Date());

    // 表示期間を計算
    const { fromDate, toDate, periodLabel } = useMemo(() => {
        let from: Date, to: Date, label: string;

        switch (viewMode) {
            case 'day':
                from = new Date(baseDate);
                to = new Date(baseDate);
                label = `${from.getFullYear()}年${from.getMonth() + 1}月${from.getDate()}日`;
                break;
            case 'week':
                from = getWeekStart(baseDate);
                to = getWeekEnd(baseDate);
                label = `${from.getMonth() + 1}/${from.getDate()} 〜 ${to.getMonth() + 1}/${to.getDate()}`;
                break;
            case 'month':
            default:
                from = getMonthStart(baseDate);
                to = getMonthEnd(baseDate);
                label = `${from.getFullYear()}年${from.getMonth() + 1}月`;
                break;
        }

        return {
            fromDate: getDateString(from),
            toDate: getDateString(to),
            periodLabel: label,
        };
    }, [viewMode, baseDate]);

    // 表示モード変更
    const handleViewChange = (mode: ViewMode) => {
        setViewMode(mode);
        router.get(
            route('reservations.banshirou.index'),
            {
                view: mode,
                from: fromDate,
                to: toDate,
                status: status || undefined,
            },
            { preserveState: true },
        );
    };

    // 前の期間へ
    const goPrev = () => {
        const newDate = new Date(baseDate);
        switch (viewMode) {
            case 'day':
                newDate.setDate(newDate.getDate() - 1);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() - 7);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() - 1);
                break;
        }
        setBaseDate(newDate);
    };

    // 次の期間へ
    const goNext = () => {
        const newDate = new Date(baseDate);
        switch (viewMode) {
            case 'day':
                newDate.setDate(newDate.getDate() + 1);
                break;
            case 'week':
                newDate.setDate(newDate.getDate() + 7);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + 1);
                break;
        }
        setBaseDate(newDate);
    };

    // 今日へ戻る
    const goToday = () => {
        setBaseDate(new Date());
    };

    // フィルター適用
    const handleFilter = () => {
        router.get(
            route('reservations.banshirou.index'),
            {
                view: viewMode,
                from: fromDate,
                to: toDate,
                status: status || undefined,
            },
            { preserveState: true },
        );
    };

    // 人数表示を統一形式に（total_guestsではなく個別に計算）
    const formatGuestCount = (reservation: Reservation): string => {
        const adults = reservation.guest_count_adults || 0;
        const children = reservation.guest_count_children || 0;
        const total = adults + children;
        return `${total}名（大人${adults}・子供${children}）`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-900">
                        ばんしろう予約一覧
                    </h2>
                    <Link
                        href={route('reservations.banshirou.create')}
                        className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700"
                    >
                        新規予約
                    </Link>
                </div>
            }
        >
            <Head title="ばんしろう予約一覧" />

            <div className="py-4">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* 表示切替タブ */}
                    <div className="mb-4 flex items-center justify-center">
                        <div className="inline-flex rounded-lg bg-gray-100 p-1">
                            {[
                                { key: 'day', label: '日' },
                                { key: 'week', label: '週' },
                                { key: 'month', label: '月' },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() =>
                                        handleViewChange(tab.key as ViewMode)
                                    }
                                    className={`min-h-[44px] min-w-[60px] rounded-md px-4 py-2 text-base font-medium transition-colors ${
                                        viewMode === tab.key
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 期間ナビゲーション */}
                    <div className="mb-4 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                        <button
                            onClick={goPrev}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-900">
                                {periodLabel}
                            </span>
                            <button
                                onClick={goToday}
                                className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
                            >
                                今日
                            </button>
                        </div>
                        <button
                            onClick={goNext}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
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

                    {/* ステータスフィルター */}
                    <div className="mb-4 flex items-center gap-2">
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="min-h-[44px] rounded-md border-gray-300 text-base shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">すべて</option>
                            <option value="confirmed">確定</option>
                            <option value="cancelled">キャンセル</option>
                        </select>
                        <button
                            onClick={handleFilter}
                            className="min-h-[44px] rounded-md bg-gray-600 px-4 py-2 text-base font-medium text-white hover:bg-gray-700"
                        >
                            絞込
                        </button>
                    </div>

                    {/* 予約リスト（カード表示） */}
                    <div className="space-y-3">
                        {reservations.data.length === 0 ? (
                            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                                <p className="text-gray-600">
                                    この期間に予約はありません
                                </p>
                            </div>
                        ) : (
                            reservations.data.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className="rounded-lg bg-white p-4 shadow-sm"
                                >
                                    {/* ヘッダー行: 名前とステータス */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={route(
                                                        'reservations.banshirou.show',
                                                        reservation.id,
                                                    )}
                                                    className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                                                >
                                                    {reservation.name}様
                                                </Link>
                                                {/* 施設バッジ */}
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        reservation.mocca_reservations_count >
                                                        0
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    {reservation.mocca_reservations_count >
                                                    0
                                                        ? '両方'
                                                        : 'ばんしろう'}
                                                </span>
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        reservation.status ===
                                                        'confirmed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}
                                                >
                                                    {reservation.status_label}
                                                </span>
                                            </div>

                                            {/* 日程 */}
                                            <p className="mt-2 text-base text-gray-900">
                                                {formatDateYmd(
                                                    reservation.checkin_date,
                                                )}{' '}
                                                〜{' '}
                                                {formatDateYmd(
                                                    reservation.checkout_date,
                                                )}
                                            </p>

                                            {/* 人数・食事 */}
                                            <p className="mt-1 text-base text-gray-600">
                                                {formatGuestCount(reservation)}{' '}
                                                ・{' '}
                                                {reservation.meal_option_label}
                                            </p>

                                            {/* 担当者 */}
                                            {(reservation.cleaning_assignment ||
                                                reservation.setup_assignment) && (
                                                <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                                                    {reservation.cleaning_assignment && (
                                                        <span>
                                                            掃除:{' '}
                                                            {
                                                                reservation
                                                                    .cleaning_assignment
                                                                    .user.name
                                                            }
                                                        </span>
                                                    )}
                                                    {reservation.setup_assignment && (
                                                        <span>
                                                            セット:{' '}
                                                            {
                                                                reservation
                                                                    .setup_assignment
                                                                    .user.name
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* アクションボタン */}
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {/* 電話ボタン（大きなタップ領域） */}
                                        <a
                                            href={createTelLink(
                                                reservation.phone,
                                            )}
                                            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-base font-medium text-white hover:bg-green-700 sm:flex-none"
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
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>
                                            電話
                                        </a>
                                        <Link
                                            href={route(
                                                'reservations.banshirou.show',
                                                reservation.id,
                                            )}
                                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-200 sm:flex-none"
                                        >
                                            詳細
                                        </Link>
                                        <Link
                                            href={route(
                                                'reservations.banshirou.edit',
                                                reservation.id,
                                            )}
                                            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-md bg-blue-100 px-4 py-2 text-base font-medium text-blue-700 hover:bg-blue-200 sm:flex-none"
                                        >
                                            編集
                                        </Link>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* ページネーション */}
                    {reservations.last_page > 1 && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex items-center gap-2">
                                {reservations.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`min-h-[44px] rounded-md px-4 py-2 text-base font-medium ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                  ? 'bg-white text-gray-900 hover:bg-gray-50'
                                                  : 'cursor-not-allowed bg-gray-100 text-gray-400'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
