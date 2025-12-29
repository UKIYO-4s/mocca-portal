import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useState, FormEvent } from 'react';

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
}

interface Props extends PageProps {
    reservation: Reservation;
}

interface ReservationFormData {
    [key: string]: string | number | boolean;
    name: string;
    name_kana: string;
    phone: string;
    email: string;
    address: string;
    checkin_date: string;
    checkout_date: string;
    guest_count_adults: number;
    guest_count_children: number;
    meal_option: string;
    pickup_required: boolean;
    payment_method: string;
    notes: string;
    status: string;
}

export default function Edit({ auth, reservation }: Props) {
    const [formData, setFormData] = useState<ReservationFormData>({
        name: reservation.name,
        name_kana: reservation.name_kana,
        phone: reservation.phone,
        email: reservation.email || '',
        address: reservation.address,
        checkin_date: reservation.checkin_date,
        checkout_date: reservation.checkout_date,
        guest_count_adults: reservation.guest_count_adults,
        guest_count_children: reservation.guest_count_children,
        meal_option: reservation.meal_option,
        pickup_required: reservation.pickup_required,
        payment_method: reservation.payment_method,
        notes: reservation.notes || '',
        status: reservation.status,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const updateField = <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => {
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

        if (!formData.name) newErrors.name = '名前を入力してください';
        if (!formData.name_kana) newErrors.name_kana = 'フリガナを入力してください';
        if (!formData.phone) newErrors.phone = '電話番号を入力してください';
        if (!formData.address) newErrors.address = '住所を入力してください';
        if (!formData.checkin_date) newErrors.checkin_date = 'チェックイン日を選択してください';
        if (!formData.checkout_date) newErrors.checkout_date = 'チェックアウト日を選択してください';
        if (formData.checkin_date && formData.checkout_date) {
            if (new Date(formData.checkout_date) <= new Date(formData.checkin_date)) {
                newErrors.checkout_date = 'チェックアウト日はチェックイン日より後にしてください';
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setProcessing(true);
        router.put(route('reservations.banshirou.update', reservation.id), formData, {
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
                    予約編集
                </h2>
            }
        >
            <Head title="予約編集" />

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

                            {/* お客様情報 */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    お客様情報
                                </h3>

                                <div className="space-y-4">
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

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            フリガナ <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name_kana}
                                            onChange={(e) => updateField('name_kana', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="ヤマダ タロウ"
                                        />
                                        {errors.name_kana && <p className="mt-1 text-sm text-red-500">{errors.name_kana}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            電話番号 <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="090-1234-5678"
                                        />
                                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            メールアドレス（任意）
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => updateField('email', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="example@email.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            住所 <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => updateField('address', e.target.value)}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="〒123-4567&#10;東京都..."
                                        />
                                        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* 宿泊情報 */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    宿泊情報
                                </h3>

                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                チェックイン <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.checkin_date}
                                                onChange={(e) => updateField('checkin_date', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            {errors.checkin_date && <p className="mt-1 text-sm text-red-500">{errors.checkin_date}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                チェックアウト <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.checkout_date}
                                                onChange={(e) => updateField('checkout_date', e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            {errors.checkout_date && <p className="mt-1 text-sm text-red-500">{errors.checkout_date}</p>}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                大人
                                            </label>
                                            <div className="mt-1 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('guest_count_adults', Math.max(1, formData.guest_count_adults - 1))}
                                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                                                >
                                                    −
                                                </button>
                                                <span className="w-12 text-center text-2xl font-bold">
                                                    {formData.guest_count_adults}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('guest_count_adults', formData.guest_count_adults + 1)}
                                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                                <span className="text-gray-500">名</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                子供
                                            </label>
                                            <div className="mt-1 flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('guest_count_children', Math.max(0, formData.guest_count_children - 1))}
                                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                                                >
                                                    −
                                                </button>
                                                <span className="w-12 text-center text-2xl font-bold">
                                                    {formData.guest_count_children}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateField('guest_count_children', formData.guest_count_children + 1)}
                                                    className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                                                >
                                                    +
                                                </button>
                                                <span className="text-gray-500">名</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* お食事・オプション */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    お食事・オプション
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            お食事
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'with_meals', label: '食事付き' },
                                                { value: 'seat_only', label: '席のみ' },
                                                { value: 'no_meals', label: '素泊まり' },
                                            ].map((option) => (
                                                <label
                                                    key={option.value}
                                                    className={`flex cursor-pointer items-center rounded-lg border-2 p-4 ${
                                                        formData.meal_option === option.value
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="meal_option"
                                                        value={option.value}
                                                        checked={formData.meal_option === option.value}
                                                        onChange={(e) => updateField('meal_option', e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-lg font-medium">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={formData.pickup_required}
                                                onChange={(e) => updateField('pickup_required', e.target.checked)}
                                                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-lg font-medium">送迎あり</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* お支払い・備考 */}
                            <div className="border-t border-gray-200 pt-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    お支払い・備考
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            お支払い方法
                                        </label>
                                        <div className="space-y-2">
                                            {[
                                                { value: 'cash', label: '現金' },
                                                { value: 'credit', label: 'クレジットカード' },
                                                { value: 'bank_transfer', label: '銀行振込' },
                                            ].map((option) => (
                                                <label
                                                    key={option.value}
                                                    className={`flex cursor-pointer items-center rounded-lg border-2 p-4 ${
                                                        formData.payment_method === option.value
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        value={option.value}
                                                        checked={formData.payment_method === option.value}
                                                        onChange={(e) => updateField('payment_method', e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <span className="text-lg font-medium">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            備考
                                        </label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={(e) => updateField('notes', e.target.value)}
                                            rows={4}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="アレルギー、リクエストなど..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 送信ボタン */}
                            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
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
