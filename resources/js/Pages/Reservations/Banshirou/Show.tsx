import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { formatDateYmd } from '@/utils/date';

// 電話番号からハイフンを除去してtel:リンクを生成
const createTelLink = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    return `tel:${digits}`;
};

interface User {
    id: number;
    name: string;
}

interface Assignment {
    id: number;
    assignment_type: string;
    user: User;
    type_label: string;
}

interface MoccaReservation {
    id: number;
    reservation_type: string;
    reservation_date: string;
    name: string;
    guest_count: number;
    type_label: string;
    status_label: string;
}

interface Reservation {
    id: number;
    name: string;
    name_kana: string;
    phone: string;
    email: string | null;
    address: string;
    checkin_date: string;
    checkout_date: string;
    guest_count_adults: number;
    guest_count_children: number;
    meal_option: string;
    pickup_required: boolean;
    payment_method: string;
    notes: string | null;
    status: string;
    created_at: string;
    formatted_phone: string;
    phone_link: string;
    total_guests: number;
    nights: number;
    meal_option_label: string;
    payment_method_label: string;
    status_label: string;
    creator: User;
    cleaning_assignment: Assignment | null;
    setup_assignment: Assignment | null;
    mocca_reservations: MoccaReservation[];
}

interface Props extends PageProps {
    reservation: Reservation;
}

export default function Show({ auth, reservation }: Props) {
    const canManageAssignments = auth.user.role === 'admin' || auth.user.role === 'manager';
    const canDelete = auth.user.role === 'admin' || auth.user.role === 'manager';

    const handleDelete = () => {
        if (confirm('この予約を削除してもよろしいですか？')) {
            router.delete(route('reservations.banshirou.destroy', reservation.id));
        }
    };

    const handleCancel = () => {
        if (confirm('この予約をキャンセルしてもよろしいですか？')) {
            router.put(route('reservations.banshirou.update', reservation.id), {
                status: 'cancelled',
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold leading-tight text-gray-900">
                        予約詳細
                    </h2>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link
                            href={route('reservations.banshirou.edit', reservation.id)}
                            className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-base font-medium text-white hover:bg-blue-700 sm:w-auto sm:py-2"
                        >
                            編集
                        </Link>
                        {reservation.status === 'confirmed' && (
                            <button
                                onClick={handleCancel}
                                className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-yellow-600 px-4 py-3 text-base font-medium text-white hover:bg-yellow-700 sm:w-auto sm:py-2"
                            >
                                キャンセル
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="flex min-h-[44px] w-full items-center justify-center rounded-md bg-red-600 px-4 py-3 text-base font-medium text-white hover:bg-red-700 sm:w-auto sm:py-2"
                            >
                                削除
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`${reservation.name}様の予約`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* ステータスバナー */}
                    {reservation.status === 'cancelled' && (
                        <div className="mb-6 rounded-lg bg-red-100 p-4 text-base font-medium text-red-800">
                            この予約はキャンセルされました
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* お客様情報 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                お客様情報
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">お名前</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">{reservation.name}様</dd>
                                    <dd className="text-sm text-gray-600">（{reservation.name_kana}）</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">電話番号</dt>
                                    <dd className="mt-1">
                                        <a
                                            href={createTelLink(reservation.phone)}
                                            className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-base font-medium text-white hover:bg-green-700"
                                        >
                                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {reservation.formatted_phone}
                                        </a>
                                    </dd>
                                </div>
                                {reservation.email && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-600">メールアドレス</dt>
                                        <dd className="mt-1 text-base text-gray-900">{reservation.email}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">住所</dt>
                                    <dd className="mt-1 whitespace-pre-wrap text-base leading-relaxed text-gray-900">
                                        {reservation.address}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* 宿泊情報 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                宿泊情報
                            </h3>
                            <dl className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-600">チェックイン</dt>
                                        <dd className="mt-1 text-lg font-semibold text-gray-900">{formatDateYmd(reservation.checkin_date)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-600">チェックアウト</dt>
                                        <dd className="mt-1 text-lg font-semibold text-gray-900">{formatDateYmd(reservation.checkout_date)}</dd>
                                    </div>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">宿泊日数</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">{reservation.nights}泊</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">人数</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                                        {reservation.total_guests}名
                                        <span className="ml-2 text-base font-normal text-gray-600">
                                            （大人{reservation.guest_count_adults}・子供{reservation.guest_count_children}）
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* お食事・オプション */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                お食事・オプション
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">お食事</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">{reservation.meal_option_label}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">送迎</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                                        {reservation.pickup_required ? 'あり' : 'なし'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* お支払い・その他 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                お支払い・その他
                            </h3>
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">お支払い方法</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">{reservation.payment_method_label}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">ステータス</dt>
                                    <dd className="mt-1">
                                        <span className={`inline-flex rounded-full px-3 py-1 text-base font-medium ${
                                            reservation.status === 'confirmed'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {reservation.status_label}
                                        </span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-gray-600">入力者</dt>
                                    <dd className="mt-1 text-base text-gray-900">{reservation.creator.name}</dd>
                                </div>
                            </dl>
                        </div>

                        {/* 備考 */}
                        {reservation.notes && (
                            <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    備考
                                </h3>
                                <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-900">
                                    {reservation.notes}
                                </p>
                            </div>
                        )}

                        {/* 担当者 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
                            <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                担当者
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <dt className="text-sm font-medium text-gray-600">掃除担当</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                                        {reservation.cleaning_assignment
                                            ? reservation.cleaning_assignment.user.name
                                            : '未割当'}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <dt className="text-sm font-medium text-gray-600">セット担当</dt>
                                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                                        {reservation.setup_assignment
                                            ? reservation.setup_assignment.user.name
                                            : '未割当'}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        {/* 関連する食事予約 */}
                        {reservation.mocca_reservations.length > 0 && (
                            <div className="rounded-lg bg-white p-6 shadow-sm lg:col-span-2">
                                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                                    関連する食事予約
                                </h3>
                                <div className="space-y-3">
                                    {reservation.mocca_reservations.map((moccaRes) => (
                                        <Link
                                            key={moccaRes.id}
                                            href={route('reservations.mocca.show', moccaRes.id)}
                                            className="block min-h-[44px] rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-base font-semibold text-gray-900">{formatDateYmd(moccaRes.reservation_date)}</span>
                                                    <span className="ml-2 text-base text-gray-600">{moccaRes.type_label}</span>
                                                </div>
                                                <span className="text-base text-gray-600">{moccaRes.guest_count}名</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 戻るボタン */}
                    <div className="mt-6">
                        <Link
                            href={route('reservations.banshirou.index')}
                            className="inline-flex min-h-[44px] items-center text-base font-medium text-gray-600 hover:text-gray-900"
                        >
                            ← 予約一覧に戻る
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
