import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, FormEvent } from 'react';

interface BanshirouReservation {
    id: number;
    name: string;
    checkin_date: string;
    checkout_date: string;
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
    banshirou_reservation_id: number | null;
}

interface Props extends PageProps {
    reservation: Reservation;
    banshirouReservations: BanshirouReservation[];
}

interface MoccaFormData {
    [key: string]: string | number;
    reservation_type: string;
    reservation_date: string;
    name: string;
    guest_count: number;
    arrival_time: string;
    phone: string;
    advance_menu: string;
    notes: string;
    banshirou_reservation_id: string;
    status: string;
}

export default function Edit({ auth, reservation, banshirouReservations }: Props) {
    const [formData, setFormData] = useState<MoccaFormData>({
        reservation_type: reservation.reservation_type,
        reservation_date: reservation.reservation_date,
        name: reservation.name,
        guest_count: reservation.guest_count,
        arrival_time: reservation.arrival_time?.slice(0, 5) || '',
        phone: reservation.phone || '',
        advance_menu: reservation.advance_menu || '',
        notes: reservation.notes || '',
        banshirou_reservation_id: reservation.banshirou_reservation_id?.toString() || '',
        status: reservation.status,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateField = <K extends keyof MoccaFormData>(field: K, value: MoccaFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // 電話番号の自動フォーマット
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        if (digits.length <= 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        updateField('phone', formatted);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!formData.reservation_type) newErrors.reservation_type = '種別を選択してください';
        if (!formData.reservation_date) newErrors.reservation_date = '日付を選択してください';
        if (!formData.name) newErrors.name = 'お名前を入力してください';
        if (formData.guest_count < 1) newErrors.guest_count = '人数を入力してください';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setProcessing(true);
        router.put(route('reservations.mocca.update', reservation.id), formData, {
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    食事予約編集
                </h2>
            }
        >
            <Head title="食事予約編集" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="rounded-lg bg-white p-6 shadow-sm space-y-6">
                            {/* ステータス */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ステータス
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { value: 'confirmed', label: '確定' },
                                        { value: 'cancelled', label: 'キャンセル' },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-3 ${
                                                formData.status === option.value
                                                    ? option.value === 'confirmed'
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-red-500 bg-red-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="status"
                                                value={option.value}
                                                checked={formData.status === option.value}
                                                onChange={(e) => updateField('status', e.target.value)}
                                                className="sr-only"
                                            />
                                            <span className="font-medium">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* ばんしろう連携 */}
                            {banshirouReservations.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        ばんしろう予約と連携（任意）
                                    </label>
                                    <select
                                        value={formData.banshirou_reservation_id}
                                        onChange={(e) => updateField('banshirou_reservation_id', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">連携しない</option>
                                        {banshirouReservations.map((res) => (
                                            <option key={res.id} value={res.id}>
                                                {res.name}様（{res.checkin_date}〜{res.checkout_date}）
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* 種別選択 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    種別 <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'breakfast', label: '朝食' },
                                        { value: 'lunch', label: '昼食' },
                                        { value: 'dinner', label: '夕食' },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 ${
                                                formData.reservation_type === option.value
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="reservation_type"
                                                value={option.value}
                                                checked={formData.reservation_type === option.value}
                                                onChange={(e) => updateField('reservation_type', e.target.value)}
                                                className="sr-only"
                                            />
                                            <span className="text-lg font-medium">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.reservation_type && <p className="mt-1 text-sm text-red-500">{errors.reservation_type}</p>}
                            </div>

                            {/* 日付 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    日付 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.reservation_date}
                                    onChange={(e) => updateField('reservation_date', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.reservation_date && <p className="mt-1 text-sm text-red-500">{errors.reservation_date}</p>}
                            </div>

                            {/* 到着時間 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    到着予定時間（任意）
                                </label>
                                <input
                                    type="time"
                                    value={formData.arrival_time}
                                    onChange={(e) => updateField('arrival_time', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            {/* お名前 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    お名前 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => updateField('name', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="山田 太郎"
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                            </div>

                            {/* 人数 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    人数 <span className="text-red-500">*</span>
                                </label>
                                <div className="mt-1 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => updateField('guest_count', Math.max(1, formData.guest_count - 1))}
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                                    >
                                        −
                                    </button>
                                    <span className="w-12 text-center text-2xl font-bold">
                                        {formData.guest_count}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => updateField('guest_count', formData.guest_count + 1)}
                                        className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                                    >
                                        +
                                    </button>
                                    <span className="text-gray-500">名</span>
                                </div>
                                {errors.guest_count && <p className="mt-1 text-sm text-red-500">{errors.guest_count}</p>}
                            </div>

                            {/* 電話番号 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    電話番号（任意）
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="090-1234-5678"
                                />
                            </div>

                            {/* 先出メニュー */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    先出メニュー（任意）
                                </label>
                                <textarea
                                    value={formData.advance_menu}
                                    onChange={(e) => updateField('advance_menu', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="先に出すメニューがあれば記載..."
                                />
                            </div>

                            {/* 備考 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    備考（任意）
                                </label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => updateField('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="アレルギー、リクエストなど..."
                                />
                            </div>

                            {/* 送信ボタン */}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="rounded-md bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {processing ? '保存中...' : '更新する'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
