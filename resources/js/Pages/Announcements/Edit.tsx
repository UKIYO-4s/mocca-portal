import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Announcement, User } from '@/types';

interface Props {
    announcement: Announcement;
    auth: { user: User };
}

interface AnnouncementFormData {
    title: string;
    content: string;
    priority: 'normal' | 'important';
    published_at: string;
}

/**
 * Format a date string to datetime-local input format (YYYY-MM-DDTHH:mm)
 */
function formatDateTimeLocal(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function Edit({ announcement, auth }: Props) {
    const { data, setData, put, processing, errors } = useForm<AnnouncementFormData>({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority,
        published_at: formatDateTimeLocal(announcement.published_at),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('announcements.update', announcement.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    お知らせ編集
                </h2>
            }
        >
            <Head title="お知らせ編集" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            {/* タイトル */}
                            <div>
                                <InputLabel htmlFor="title" value="タイトル" />
                                <TextInput
                                    id="title"
                                    name="title"
                                    value={data.title}
                                    className="mt-1 block w-full"
                                    isFocused={true}
                                    onChange={(e) => setData('title', e.target.value)}
                                    required
                                    placeholder="お知らせのタイトルを入力"
                                />
                                <InputError message={errors.title} className="mt-2" />
                            </div>

                            {/* 内容 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="content" value="内容" />
                                <textarea
                                    id="content"
                                    name="content"
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500:border-indigo-600:ring-indigo-600"
                                    rows={6}
                                    required
                                    placeholder="お知らせの内容を入力"
                                />
                                <InputError message={errors.content} className="mt-2" />
                            </div>

                            {/* 優先度 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="priority" value="優先度" />
                                <select
                                    id="priority"
                                    name="priority"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value as 'normal' | 'important')}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500:border-indigo-600:ring-indigo-600"
                                    required
                                >
                                    <option value="normal">通常</option>
                                    <option value="important">重要</option>
                                </select>
                                <InputError message={errors.priority} className="mt-2" />
                            </div>

                            {/* 公開日時 */}
                            <div className="mt-4">
                                <InputLabel htmlFor="published_at" value="公開日時" />
                                <input
                                    type="datetime-local"
                                    id="published_at"
                                    name="published_at"
                                    value={data.published_at}
                                    onChange={(e) => setData('published_at', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500:border-indigo-600:ring-indigo-600"
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    公開日時を空にすると下書きとして保存されます
                                </p>
                                <InputError message={errors.published_at} className="mt-2" />
                            </div>

                            {/* ボタン */}
                            <div className="mt-6 flex items-center justify-end gap-4">
                                <Link href={route('announcements.index')}>
                                    <SecondaryButton type="button">
                                        キャンセル
                                    </SecondaryButton>
                                </Link>
                                <PrimaryButton disabled={processing}>
                                    {processing ? '更新中...' : '更新'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
