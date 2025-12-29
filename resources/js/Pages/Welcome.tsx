import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';

export default function Welcome({
    auth,
}: PageProps) {
    return (
        <>
            <Head title="ようこそ" />
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
                <div className="relative flex min-h-screen flex-col items-center justify-center">
                    <div className="relative w-full max-w-2xl px-6">
                        <header className="flex items-center justify-between py-10">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Mocca Portal
                                </h1>
                            </div>
                            <nav className="flex gap-4">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        ダッシュボード
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            ログイン
                                        </Link>
                                        <Link
                                            href={route('register')}
                                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                        >
                                            新規登録
                                        </Link>
                                    </>
                                )}
                            </nav>
                        </header>

                        <main className="py-12 text-center">
                            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
                                ようこそ
                            </h2>
                            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-400">
                                施設管理をスマートに。予約管理、スタッフ管理を一元管理できるポータルサイトです。
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                {!auth.user && (
                                    <Link
                                        href={route('login')}
                                        className="rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                    >
                                        はじめる
                                    </Link>
                                )}
                            </div>
                        </main>

                        <footer className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
                            © {new Date().getFullYear()} Mocca Portal
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
