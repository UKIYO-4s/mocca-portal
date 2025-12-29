import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { PageProps } from '@/types';

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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        予約詳細
                    </h2>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link
                            href={route('reservations.banshirou.edit', reservation.id)}
                            className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
                        >
                            編集
                        </Link>
                        {reservation.status === 'confirmed' && (
                            <button
                                onClick={handleCancel}
                                className="inline-flex w-full items-center justify-center rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 sm:w-auto"
                            >
                                キャンセル
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                className="inline-flex w-full items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 sm:w-auto"
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
                        <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-800">
                            この予約はキャンセルされました
                        </div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* お客様情報 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                お客様情報
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">お名前</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{reservation.name}様</dd>
                                    <dd className="text-sm text-gray-500 dark:text-gray-400">（{reservation.name_kana}）</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">電話番号</dt>
                                    <dd>
                                        <a
                                            href={reservation.phone_link}
                                            className="inline-flex items-center text-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                                        >
                                            <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            {reservation.formatted_phone}
                                        </a>
                                    </dd>
                                </div>
                                {reservation.email && (
                                    <div>
                                        <dt className="text-sm text-gray-500 dark:text-gray-400">メールアドレス</dt>
                                        <dd className="text-gray-900 dark:text-gray-100">{reservation.email}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">住所</dt>
                                    <dd className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                        {reservation.address}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* 宿泊情報 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                宿泊情報
                            </h3>
                            <dl className="space-y-3">
                                <div className="flex gap-8">
                                    <div>
                                        <dt className="text-sm text-gray-500 dark:text-gray-400">チェックイン</dt>
                                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{reservation.checkin_date}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm text-gray-500 dark:text-gray-400">チェックアウト</dt>
                                        <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{reservation.checkout_date}</dd>
                                    </div>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">宿泊日数</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{reservation.nights}泊</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500 dark:text-gray-400">人数</dt>
                                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        {reservation.total_guests}名
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                            （大人{reservation.guest_count_adults}名
                                            {reservation.guest_count_children > 0 && `、子供${reservation.guest_count_children}名`}）
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* お食事・オプション */}
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                お食事・オプション
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm text-gray-500">お食事</dt>
                                    <dd className="text-lg font-medium">{reservation.meal_option_label}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-gray-500">送迎</dt>
                                    <dd className="text-lg font-medium">
                                        {reservation.pickup_required ? 'あり' : 'なし'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* お支払い・その他 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                お支払い・その他
                            </h3>
                            <dl className="space-y-3">
                                <div>
                                    <dt className="text-sm text-gray-500">お支払い方法</dt>
                                    <dd className="text-lg font-medium">{reservation.payment_method_label}</dd>
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
                                <div>
                                    <dt className="text-sm text-gray-500">入力者</dt>
                                    <dd className="text-gray-900 dark:text-gray-100">{reservation.creator.name}</dd>
                                </div>
                            </dl>
                        </div>

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

                        {/* 担当者 */}
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
                            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                担当者
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <dt className="text-sm text-gray-500">掃除担当</dt>
                                    <dd className="mt-1 text-lg font-medium">
                                        {reservation.cleaning_assignment
                                            ? reservation.cleaning_assignment.user.name
                                            : '未割当'}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-gray-200 p-4">
                                    <dt className="text-sm text-gray-500">セット担当</dt>
                                    <dd className="mt-1 text-lg font-medium">
                                        {reservation.setup_assignment
                                            ? reservation.setup_assignment.user.name
                                            : '未割当'}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        {/* 関連する食事予約 */}
                        {reservation.mocca_reservations.length > 0 && (
                            <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 lg:col-span-2">
                                <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                                    関連する食事予約
                                </h3>
                                <div className="space-y-2">
                                    {reservation.mocca_reservations.map((moccaRes) => (
                                        <Link
                                            key={moccaRes.id}
                                            href={route('reservations.mocca.show', moccaRes.id)}
                                            className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium">{moccaRes.reservation_date}</span>
                                                    <span className="ml-2 text-gray-500">{moccaRes.type_label}</span>
                                                </div>
                                                <span className="text-sm text-gray-500">{moccaRes.guest_count}名</span>
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
                            className="inline-flex items-center text-gray-600 hover:text-gray-900"
                        >
                            ← 予約一覧に戻る
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
