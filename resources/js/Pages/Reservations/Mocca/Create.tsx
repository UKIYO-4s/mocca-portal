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

interface Props extends PageProps {
    banshirouReservations: BanshirouReservation[];
    linkedReservationId?: string;
}

interface FormData {
    reservation_type: string;
    reservation_date: string;
    name: string;
    guest_count: number;
    arrival_time: string;
    phone: string;
    advance_menu: string;
    notes: string;
    banshirou_reservation_id: string;
}

export default function Create({ auth, banshirouReservations, linkedReservationId }: Props) {
    const linkedReservation = linkedReservationId
        ? banshirouReservations.find(r => r.id === parseInt(linkedReservationId))
        : null;

    const [formData, setFormData] = useState<FormData>({
        reservation_type: 'dinner',
        reservation_date: '',
        name: linkedReservation?.name || '',
        guest_count: 1,
        arrival_time: '',
        phone: '',
        advance_menu: '',
        notes: '',
        banshirou_reservation_id: linkedReservationId || '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
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

    const handleBanshirouSelect = (id: string) => {
        updateField('banshirou_reservation_id', id);
        if (id) {
            const selected = banshirouReservations.find(r => r.id === parseInt(id));
            if (selected && !formData.name) {
                updateField('name', selected.name);
            }
        }
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
        router.post(route('reservations.mocca.store'), formData, {
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    新規食事予約
                </h2>
            }
        >
            <Head title="新規食事予約" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800 space-y-6">
                            {/* ばんしろう連携 */}
                            {banshirouReservations.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        ばんしろう予約と連携（任意）
                                    </label>
                                    <select
                                        value={formData.banshirou_reservation_id}
                                        onChange={(e) => handleBanshirouSelect(e.target.value)}
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    種別 <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { value: 'breakfast', label: '朝食', color: 'yellow' },
                                        { value: 'lunch', label: '昼食', color: 'orange' },
                                        { value: 'dinner', label: '夕食', color: 'purple' },
                                    ].map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex cursor-pointer items-center justify-center rounded-lg border-2 p-4 ${
                                                formData.reservation_type === option.value
                                                    ? `border-${option.color}-500 bg-${option.color}-50`
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    日付 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.reservation_date}
                                    onChange={(e) => updateField('reservation_date', e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                                {errors.reservation_date && <p className="mt-1 text-sm text-red-500">{errors.reservation_date}</p>}
                            </div>

                            {/* 到着時間 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                                    {processing ? '保存中...' : '予約を作成'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
