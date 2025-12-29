import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';

interface User {
    id: number;
    name: string;
}

interface BanshirouReservation {
    id: number;
    name: string;
    checkin_date: string;
    checkout_date: string;
    guest_count_adults: number;
    guest_count_children: number;
}

interface Reservation {
    id: number;
    reservation_type: string;
    reservation_date: string;
    name: string;
    guest_count: number;
    arrival_time: string | null;
    phone: string | null;
    advance_menu: string | null;
    notes: string | null;
    status: string;
    created_at: string;
    type_label: string;
    status_label: string;
    formatted_phone: string | null;
    phone_link: string | null;
    formatted_arrival_time: string | null;
    creator: User;
    banshirou_reservation: BanshirouReservation | null;
}

interface Props extends PageProps {
    reservation: Reservation;
}

export default function Show({ auth, reservation }: Props) {
    const canDelete = auth.user.role === 'admin' || auth.user.role === 'manager';

    const handleDelete = () => {
        if (confirm('この予約を削除してもよろしいですか？')) {
            router.delete(route('reservations.mocca.destroy', reservation.id));
        }
    };

    const handleCancel = () => {
        if (confirm('この予約をキャンセルしてもよろしいですか？')) {
            router.put(route('reservations.mocca.update', reservation.id), {
                ...reservation,
                status: 'cancelled',
            });
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'breakfast':
                return 'bg-yellow-100 text-yellow-800';
            case 'lunch':
                return 'bg-orange-100 text-orange-800';
            case 'dinner':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        食事予約詳細
                    </h2>
                    <div className="flex gap-2">
                        <Link
                            href={route('reservations.mocca.edit', reservation.id)}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            編集
                        </Link>
                        {reservation.status === 'confirmed' && (
                            <button
                                onClick={handleCancel}
                                className="inline-flex items-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                            >
                                キャンセル
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                削除
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${reservation.name}様の食事予約`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* ステータスバナー */}
                    {reservation.status === 'cancelled' && (
                        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800">
                            この予約はキャンセルされました
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* 予約情報 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                予約情報
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm text-gray-500">種別</dt>
                                    <dd>
                                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getTypeColor(reservation.reservation_type)}`}>
                                            {reservation.type_label}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">日付</dt>
                                    <dd className="text-lg font-medium">{reservation.reservation_date}</dd>
                                </div>
                                {reservation.formatted_arrival_time && (
                                    <div>
                                        <dt className="text-sm text-gray-500">到着予定時間</dt>
                                        <dd className="text-lg font-medium">{reservation.formatted_arrival_time}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm text-gray-500">人数</dt>
                                    <dd className="text-lg font-medium">{reservation.guest_count}名</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">ステータス</dt>
                                    <dd>
                                        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                                            reservation.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {reservation.status_label}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* お客様情報 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                お客様情報
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm text-gray-500">お名前</dt>
                                    <dd className="text-lg font-medium">{reservation.name}様</dd>
                                </div>
                                {reservation.phone_link && (
                                    <div>
                                        <dt className="text-sm text-gray-500">電話番号</dt>
                                        <dd>
                                            <a
                                                href={reservation.phone_link}
                                                className="inline-flex items-center text-lg font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {reservation.formatted_phone}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm text-gray-500">入力者</dt>
                                    <dd className="text-gray-900 dark:text-gray-100">{reservation.creator.name}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* 先出メニュー */}
                        {reservation.advance_menu && (
                            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
                                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                    先出メニュー
                                </h3>
                                <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                    {reservation.advance_menu}
                                </p>
                            </div>
                        )}

                        {/* 備考 */}
                        {reservation.notes && (
                            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
                                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                    備考
                                </h3>
                                <p className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                                    {reservation.notes}
                                </p>
                            </div>
                        )}

                        {/* 関連するばんしろう予約 */}
                        {reservation.banshirou_reservation && (
                            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
                                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                    関連するばんしろう予約
                                </h3>
                                <Link
                                    href={route('reservations.banshirou.show', reservation.banshirou_reservation.id)}
                                    className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{reservation.banshirou_reservation.name}様</span>
                                            <span className="ml-2 text-gray-500">
                                                {reservation.banshirou_reservation.checkin_date} 〜 {reservation.banshirou_reservation.checkout_date}
                                            </span>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {reservation.banshirou_reservation.guest_count_adults}名
                                            {reservation.banshirou_reservation.guest_count_children > 0 && `（子供${reservation.banshirou_reservation.guest_count_children}名）`}
                                        </span>
                                    </div>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* 戻るボタン */}
                    <div className="mt-6">
                        <Link
                            href={route('reservations.mocca.index')}
                            className="inline-flex items-center text-gray-600 hover:text-gray-900"
                        >
                            ← 食事予約一覧に戻る
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
