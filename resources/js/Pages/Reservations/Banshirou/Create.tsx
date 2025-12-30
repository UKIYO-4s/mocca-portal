import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useState } from 'react';

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
}

const initialFormData: ReservationFormData = {
    name: '',
    name_kana: '',
    phone: '',
    email: '',
    address: '',
    checkin_date: '',
    checkout_date: '',
    guest_count_adults: 1,
    guest_count_children: 0,
    meal_option: 'with_meals',
    pickup_required: false,
    payment_method: 'cash',
    notes: '',
};

type InputMode = 'wizard' | 'single';

interface FormFieldsProps {
    formData: ReservationFormData;
    errors: Record<string, string>;
    updateField: <K extends keyof ReservationFormData>(
        field: K,
        value: ReservationFormData[K],
    ) => void;
    handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// フォームコンポーネントを親の外に定義（再レンダリング時の再マウントを防止）
function CustomerInfoFields({
    formData,
    errors,
    updateField,
    handlePhoneChange,
}: FormFieldsProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">お客様情報</h3>

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
                {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
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
                {errors.name_kana && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.name_kana}
                    </p>
                )}
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
                {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                )}
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
                {errors.address && (
                    <p className="mt-1 text-sm text-red-500">
                        {errors.address}
                    </p>
                )}
            </div>
        </div>
    );
}

function StayInfoFields({
    formData,
    errors,
    updateField,
}: Omit<FormFieldsProps, 'handlePhoneChange'>) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">宿泊情報</h3>

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        チェックイン <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.checkin_date}
                        onChange={(e) =>
                            updateField('checkin_date', e.target.value)
                        }
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.checkin_date && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.checkin_date}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        チェックアウト <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={formData.checkout_date}
                        onChange={(e) =>
                            updateField('checkout_date', e.target.value)
                        }
                        min={
                            formData.checkin_date ||
                            new Date().toISOString().split('T')[0]
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 text-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {errors.checkout_date && (
                        <p className="mt-1 text-sm text-red-500">
                            {errors.checkout_date}
                        </p>
                    )}
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
                            onClick={() =>
                                updateField(
                                    'guest_count_adults',
                                    Math.max(
                                        1,
                                        formData.guest_count_adults - 1,
                                    ),
                                )
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                        >
                            −
                        </button>
                        <span className="w-12 text-center text-2xl font-bold">
                            {formData.guest_count_adults}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                updateField(
                                    'guest_count_adults',
                                    formData.guest_count_adults + 1,
                                )
                            }
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
                            onClick={() =>
                                updateField(
                                    'guest_count_children',
                                    Math.max(
                                        0,
                                        formData.guest_count_children - 1,
                                    ),
                                )
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                        >
                            −
                        </button>
                        <span className="w-12 text-center text-2xl font-bold">
                            {formData.guest_count_children}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                updateField(
                                    'guest_count_children',
                                    formData.guest_count_children + 1,
                                )
                            }
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold hover:bg-gray-300"
                        >
                            +
                        </button>
                        <span className="text-gray-500">名</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MealOptionsFields({
    formData,
    updateField,
}: Omit<FormFieldsProps, 'handlePhoneChange' | 'errors'>) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
                お食事・オプション
            </h3>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                                onChange={(e) =>
                                    updateField('meal_option', e.target.value)
                                }
                                className="sr-only"
                            />
                            <span className="text-lg font-medium">
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300">
                    <input
                        type="checkbox"
                        checked={formData.pickup_required}
                        onChange={(e) =>
                            updateField('pickup_required', e.target.checked)
                        }
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg font-medium">送迎あり</span>
                </label>
            </div>
        </div>
    );
}

function PaymentNotesFields({
    formData,
    updateField,
}: Omit<FormFieldsProps, 'handlePhoneChange' | 'errors'>) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
                お支払い・備考
            </h3>

            <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
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
                                checked={
                                    formData.payment_method === option.value
                                }
                                onChange={(e) =>
                                    updateField(
                                        'payment_method',
                                        e.target.value,
                                    )
                                }
                                className="sr-only"
                            />
                            <span className="text-lg font-medium">
                                {option.label}
                            </span>
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
    );
}

interface ConfirmationViewProps {
    formData: ReservationFormData;
}

function ConfirmationView({ formData }: ConfirmationViewProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
                予約内容の確認
            </h3>

            <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                        お客様情報
                    </h4>
                    <p className="mt-1 text-lg">
                        {formData.name}（{formData.name_kana}）様
                    </p>
                    <p className="text-sm text-gray-600">{formData.phone}</p>
                    {formData.email && (
                        <p className="text-sm text-gray-600">
                            {formData.email}
                        </p>
                    )}
                    <p className="mt-1 text-sm text-gray-600">
                        {formData.address}
                    </p>
                </div>
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                        宿泊情報
                    </h4>
                    <p className="mt-1 text-lg">
                        {formData.checkin_date} 〜 {formData.checkout_date}
                    </p>
                    <p className="text-sm text-gray-600">
                        大人{formData.guest_count_adults}名
                        {formData.guest_count_children > 0 &&
                            `、子供${formData.guest_count_children}名`}
                    </p>
                </div>
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                        お食事・オプション
                    </h4>
                    <p className="mt-1 text-lg">
                        {formData.meal_option === 'with_meals' && '食事付き'}
                        {formData.meal_option === 'seat_only' && '席のみ'}
                        {formData.meal_option === 'no_meals' && '素泊まり'}
                    </p>
                    {formData.pickup_required && (
                        <p className="text-sm text-gray-600">送迎あり</p>
                    )}
                </div>
                <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-500">
                        お支払い
                    </h4>
                    <p className="mt-1 text-lg">
                        {formData.payment_method === 'cash' && '現金'}
                        {formData.payment_method === 'credit' &&
                            'クレジットカード'}
                        {formData.payment_method === 'bank_transfer' &&
                            '銀行振込'}
                    </p>
                </div>
                {formData.notes && (
                    <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-500">
                            備考
                        </h4>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                            {formData.notes}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

const STORAGE_KEY = 'reservation_input_mode';

export default function Create({ auth }: PageProps) {
    const user = usePage().props.auth.user;
    const isStaff = user.role === 'staff';

    // Staffはデフォルトで一括入力、それ以外はLocalStorageまたはウィザード
    const getDefaultMode = (): InputMode => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'wizard' || saved === 'single') {
                return saved;
            }
        }
        return isStaff ? 'single' : 'wizard';
    };

    const [inputMode, setInputMode] = useState<InputMode>('wizard');
    const [step, setStep] = useState(1);
    const [formData, setFormData] =
        useState<ReservationFormData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        setInputMode(getDefaultMode());
    }, []);

    const handleModeChange = (mode: InputMode) => {
        setInputMode(mode);
        localStorage.setItem(STORAGE_KEY, mode);
        if (mode === 'wizard') {
            setStep(1);
        }
    };

    const totalSteps = 5;

    const updateField = <K extends keyof ReservationFormData>(
        field: K,
        value: ReservationFormData[K],
    ) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    // 電話番号の自動フォーマット
    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 7)
            return `${digits.slice(0, 3)}-${digits.slice(3)}`;
        if (digits.length <= 11)
            return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value);
        updateField('phone', formatted);
    };

    const validateStep = (stepNum: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (stepNum === 1) {
            if (!formData.name) newErrors.name = '名前を入力してください';
            if (!formData.name_kana)
                newErrors.name_kana = 'フリガナを入力してください';
            if (!formData.phone) newErrors.phone = '電話番号を入力してください';
            if (!formData.address) newErrors.address = '住所を入力してください';
        } else if (stepNum === 2) {
            if (!formData.checkin_date)
                newErrors.checkin_date = 'チェックイン日を選択してください';
            if (!formData.checkout_date)
                newErrors.checkout_date = 'チェックアウト日を選択してください';
            if (formData.checkin_date && formData.checkout_date) {
                if (
                    new Date(formData.checkout_date) <=
                    new Date(formData.checkin_date)
                ) {
                    newErrors.checkout_date =
                        'チェックアウト日はチェックイン日より後にしてください';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateAll = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name) newErrors.name = '名前を入力してください';
        if (!formData.name_kana)
            newErrors.name_kana = 'フリガナを入力してください';
        if (!formData.phone) newErrors.phone = '電話番号を入力してください';
        if (!formData.address) newErrors.address = '住所を入力してください';
        if (!formData.checkin_date)
            newErrors.checkin_date = 'チェックイン日を選択してください';
        if (!formData.checkout_date)
            newErrors.checkout_date = 'チェックアウト日を選択してください';
        if (formData.checkin_date && formData.checkout_date) {
            if (
                new Date(formData.checkout_date) <=
                new Date(formData.checkin_date)
            ) {
                newErrors.checkout_date =
                    'チェックアウト日はチェックイン日より後にしてください';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep((prev) => Math.min(prev + 1, totalSteps));
        }
    };

    const prevStep = () => {
        setStep((prev) => Math.max(prev - 1, 1));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (inputMode === 'wizard') {
            if (!validateStep(step)) return;
        } else {
            if (!validateAll()) return;
        }

        setProcessing(true);
        router.post(route('reservations.banshirou.store'), formData, {
            onError: (errors) => {
                setErrors(errors as Record<string, string>);
                setProcessing(false);
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        新規予約
                    </h2>
                    {/* 入力モード切替 */}
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        <button
                            type="button"
                            onClick={() => handleModeChange('wizard')}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                inputMode === 'wizard'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            ステップ入力
                        </button>
                        <button
                            type="button"
                            onClick={() => handleModeChange('single')}
                            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                                inputMode === 'single'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            一括入力
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="新規予約" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {inputMode === 'wizard' ? (
                        <>
                            {/* ステップインジケーター */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <div
                                            key={s}
                                            className="flex flex-col items-center"
                                        >
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                                                    s === step
                                                        ? 'bg-blue-600 text-white'
                                                        : s < step
                                                          ? 'bg-green-500 text-white'
                                                          : 'bg-gray-200 text-gray-600'
                                                }`}
                                            >
                                                {s < step ? '✓' : s}
                                            </div>
                                            <span className="mt-1 text-xs text-gray-500">
                                                {s === 1 && 'お客様情報'}
                                                {s === 2 && '宿泊情報'}
                                                {s === 3 && 'お食事'}
                                                {s === 4 && 'お支払い'}
                                                {s === 5 && '確認'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="rounded-lg bg-white p-6 shadow-sm">
                                    {step === 1 && (
                                        <CustomerInfoFields
                                            formData={formData}
                                            errors={errors}
                                            updateField={updateField}
                                            handlePhoneChange={
                                                handlePhoneChange
                                            }
                                        />
                                    )}
                                    {step === 2 && (
                                        <StayInfoFields
                                            formData={formData}
                                            errors={errors}
                                            updateField={updateField}
                                        />
                                    )}
                                    {step === 3 && (
                                        <MealOptionsFields
                                            formData={formData}
                                            updateField={updateField}
                                        />
                                    )}
                                    {step === 4 && (
                                        <PaymentNotesFields
                                            formData={formData}
                                            updateField={updateField}
                                        />
                                    )}
                                    {step === 5 && (
                                        <ConfirmationView formData={formData} />
                                    )}

                                    {/* ナビゲーションボタン */}
                                    <div className="mt-6 flex justify-between">
                                        {step > 1 ? (
                                            <button
                                                type="button"
                                                onClick={prevStep}
                                                className="rounded-md bg-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-300"
                                            >
                                                戻る
                                            </button>
                                        ) : (
                                            <div />
                                        )}

                                        {step < totalSteps ? (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
                                            >
                                                次へ
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {processing
                                                    ? '保存中...'
                                                    : '予約を確定'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* 一括入力モード */
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                <div className="rounded-lg bg-white p-6 shadow-sm">
                                    <CustomerInfoFields
                                        formData={formData}
                                        errors={errors}
                                        updateField={updateField}
                                        handlePhoneChange={handlePhoneChange}
                                    />
                                </div>

                                <div className="rounded-lg bg-white p-6 shadow-sm">
                                    <StayInfoFields
                                        formData={formData}
                                        errors={errors}
                                        updateField={updateField}
                                    />
                                </div>

                                <div className="rounded-lg bg-white p-6 shadow-sm">
                                    <MealOptionsFields
                                        formData={formData}
                                        updateField={updateField}
                                    />
                                </div>

                                <div className="rounded-lg bg-white p-6 shadow-sm">
                                    <PaymentNotesFields
                                        formData={formData}
                                        updateField={updateField}
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
                                        className="rounded-md bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {processing
                                            ? '保存中...'
                                            : '予約を確定'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
