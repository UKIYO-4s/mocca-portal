import { useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import { Transition } from '@headlessui/react';

export default function UpdateAvatarForm({
    avatarUrl,
    className = '',
}: {
    avatarUrl?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user;
    const fileInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const { data, setData, post, delete: destroy, processing, errors, recentlySuccessful } =
        useForm<{ avatar: File | null }>({
            avatar: null,
        });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('avatar', file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.avatar.update'), {
            forceFormData: true,
            onSuccess: () => {
                setPreview(null);
                setData('avatar', null);
                if (fileInput.current) {
                    fileInput.current.value = '';
                }
            },
        });
    };

    const handleDelete = () => {
        if (confirm('プロフィール画像を削除してもよろしいですか？')) {
            destroy(route('profile.avatar.destroy'));
        }
    };

    const currentAvatar = preview || avatarUrl;

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    プロフィール画像
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    プロフィール画像を設定します。この画像はゲストページに表示されます。
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex items-center gap-6">
                    {/* Avatar Preview */}
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                        {currentAvatar ? (
                            <img
                                src={currentAvatar}
                                alt={user.name}
                                className="h-20 w-20 rounded-full object-cover"
                            />
                        ) : (
                            <span className="text-2xl font-bold text-blue-600">
                                {user.name.charAt(0)}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <input
                            type="file"
                            ref={fileInput}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => fileInput.current?.click()}
                                className="min-h-[44px] rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                画像を選択
                            </button>
                            {avatarUrl && !preview && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="min-h-[44px] rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                >
                                    削除
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            JPEG, PNG, GIF形式 (最大2MB)
                        </p>
                    </div>
                </div>

                <InputError message={errors.avatar} className="mt-2" />

                {preview && (
                    <div className="flex items-center gap-4">
                        <PrimaryButton disabled={processing}>
                            {processing ? '保存中...' : '保存'}
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={() => {
                                setPreview(null);
                                setData('avatar', null);
                                if (fileInput.current) {
                                    fileInput.current.value = '';
                                }
                            }}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            キャンセル
                        </button>
                    </div>
                )}

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out"
                    enterFrom="opacity-0"
                    leave="transition ease-in-out"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-gray-600">保存しました。</p>
                </Transition>
            </form>
        </section>
    );
}
