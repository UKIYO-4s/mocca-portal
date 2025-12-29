import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Announcement, User } from '@/types';

interface Props {
    announcements: Announcement[];
    auth: { user: User };
}

export default function Index({ auth, announcements }: Props) {
    const isAdminOrManager = auth.user.role === 'admin' || auth.user.role === 'manager';

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        お知らせ
                    </h2>
                    {isAdminOrManager && (
                        <Link
                            href={route('announcements.create')}
                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            新規作成
                        </Link>
                    )}
                </div>
            }
        >
            <Head title="お知らせ" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {announcements.length === 0 ? (
                        <div className="rounded-lg bg-white p-8 text-center shadow-sm dark:bg-gray-800">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                                />
                            </svg>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">
                                お知らせはありません
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className="relative rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
                                >
                                    {/* Unread indicator */}
                                    {!announcement.is_read && (
                                        <span className="absolute right-4 top-4 h-3 w-3 rounded-full bg-blue-500" />
                                    )}

                                    <div className="flex items-start gap-3">
                                        {/* Draft badge (Manager+ only) */}
                                        {!announcement.published_at && (
                                            <span className="inline-flex shrink-0 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                下書き
                                            </span>
                                        )}

                                        {/* Priority badge */}
                                        <span
                                            className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                                                announcement.priority === 'important'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                            }`}
                                        >
                                            {announcement.priority === 'important' ? '重要' : '通常'}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            {/* Title */}
                                            <Link
                                                href={route('announcements.show', announcement.id)}
                                                className="block text-lg font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
                                            >
                                                {announcement.title}
                                            </Link>

                                            {/* Meta info */}
                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                <span>{formatDate(announcement.published_at)}</span>
                                                {announcement.author && (
                                                    <>
                                                        <span>|</span>
                                                        <span>{announcement.author.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
