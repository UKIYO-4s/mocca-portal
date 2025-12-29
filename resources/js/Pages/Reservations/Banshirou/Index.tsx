import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState } from 'react';

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
    };
}

export default function Index({ auth, reservations, filters }: Props) {
    const [fromDate, setFromDate] = useState(filters.from || '');
    const [toDate, setToDate] = useState(filters.to || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleFilter = () => {
        router.get(route('reservations.banshirou.index'), {
            from: fromDate || undefined,
            to: toDate || undefined,
            status: status || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setFromDate('');
        setToDate('');
        setStatus('');
        router.get(route('reservations.banshirou.index'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        ばんしろう予約一覧
                    </h2>
                    <Link
                        href={route('reservations.banshirou.create')}
                        className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        新規予約
                    </Link>
                </div>
            }
        >
            <Head title="ばんしろう予約一覧" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* フィルター */}
                    <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
                        <div className="grid gap-4 sm:grid-cols-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    開始日
                                </label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    終了日
                                </label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    ステータス
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                    <option value="">すべて</option>
                                    <option value="confirmed">確定</option>
                                    <option value="cancelled">キャンセル</option>
                                </select>
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    onClick={handleFilter}
                                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                                >
                                    検索
                                </button>
                                <button
                                    onClick={clearFilters}
                                    className="rounded-md bg-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-400"
                                >
                                    クリア
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 予約リスト */}
                    <div className="space-y-4">
                        {reservations.data.length === 0 ? (
                            <div className="rounded-lg bg-white p-8 text-center shadow-sm">
                                <p className="text-gray-500">予約がありません</p>
                            </div>
                        ) : (
                            reservations.data.map((reservation) => (
                                <div
                                    key={reservation.id}
                                    className="rounded-lg bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('reservations.banshirou.show', reservation.id)}
                                                    className="text-lg font-medium text-gray-900 hover:text-blue-600"
                                                >
                                                    {reservation.name}様
                                                </Link>
                                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                    reservation.status === 'confirmed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {reservation.status_label}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {reservation.checkin_date} 〜 {reservation.checkout_date}
                                                （{reservation.nights}泊）
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                {reservation.total_guests}名（大人{reservation.guest_count_adults}名
                                                {reservation.guest_count_children > 0 && `、子供${reservation.guest_count_children}名`}）
                                                ・{reservation.meal_option_label}
                                            </p>
                                            <div className="mt-2 flex items-center gap-4">
                                                <a
                                                    href={reservation.phone_link}
                                                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                                                >
                                                    <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {reservation.formatted_phone}
                                                </a>
                                                {reservation.cleaning_assignment && (
                                                    <span className="text-sm text-gray-500">
                                                        掃除: {reservation.cleaning_assignment.user.name}
                                                    </span>
                                                )}
                                                {reservation.setup_assignment && (
                                                    <span className="text-sm text-gray-500">
                                                        セット: {reservation.setup_assignment.user.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-4 flex flex-col gap-2">
                                            <Link
                                                href={route('reservations.banshirou.show', reservation.id)}
                                                className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
                                            >
                                                詳細
                                            </Link>
                                            <Link
                                                href={route('reservations.banshirou.edit', reservation.id)}
                                                className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
                                            >
                                                編集
                                            </Link>
                                        </div>
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
                                        className={`rounded-md px-3 py-2 text-sm font-medium ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                ? 'bg-white text-gray-700 hover:bg-gray-50'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
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
