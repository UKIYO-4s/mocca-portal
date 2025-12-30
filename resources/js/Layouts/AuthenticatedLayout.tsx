import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

// ルートが存在するかチェックするヘルパー
const routeExists = (name: string): boolean => {
    try {
        route(name);
        return true;
    } catch {
        return false;
    }
};

// 安全にルートを取得するヘルパー
const safeRoute = (name: string): string => {
    try {
        return route(name);
    } catch {
        return '#';
    }
};

// ナビゲーションドロップダウン用コンポーネント
function NavDropdown({
    label,
    active,
    items,
}: {
    label: string;
    active: boolean;
    items: { href: string; label: string }[];
}) {
    return (
        <Dropdown>
            <Dropdown.Trigger>
                <button
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ${
                        active
                            ? 'border-blue-400 text-gray-900 focus:border-blue-700'
                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900 focus:border-gray-300 focus:text-gray-700'
                    }`}
                >
                    {label}
                    <svg
                        className="ml-1 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </Dropdown.Trigger>
            <Dropdown.Content
                align="left"
                contentClasses="py-1 bg-white min-w-[180px]"
            >
                {items.map((item) => (
                    <Dropdown.Link key={item.href} href={item.href}>
                        {item.label}
                    </Dropdown.Link>
                ))}
            </Dropdown.Content>
        </Dropdown>
    );
}

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'admin' || user.role === 'manager';

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(
        null,
    );

    const toggleMobileSubmenu = (menu: string) => {
        setExpandedMobileMenu(expandedMobileMenu === menu ? null : menu);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="border-b border-gray-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href={route('dashboard')}>
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                            <div className="hidden space-x-6 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    ダッシュボード
                                </NavLink>

                                {/* チェックリスト */}
                                <NavDropdown
                                    label="チェックリスト"
                                    active={route().current('checklists.*')}
                                    items={[
                                        {
                                            href: route('checklists.index'),
                                            label: '日次一覧',
                                        },
                                        ...(isManager
                                            ? [
                                                  {
                                                      href: route(
                                                          'checklists.templates.index',
                                                      ),
                                                      label: 'テンプレート管理',
                                                  },
                                              ]
                                            : []),
                                    ]}
                                />

                                {/* 備品管理 */}
                                <NavDropdown
                                    label="備品管理"
                                    active={route().current('inventory.*')}
                                    items={[
                                        {
                                            href: route('inventory.index'),
                                            label: '使用入力',
                                        },
                                        ...(isManager
                                            ? [
                                                  {
                                                      href: route(
                                                          'inventory.manage',
                                                      ),
                                                      label: '在庫管理',
                                                  },
                                                  {
                                                      href: route(
                                                          'inventory.logs',
                                                      ),
                                                      label: '履歴',
                                                  },
                                              ]
                                            : []),
                                    ]}
                                />

                                {/* タイムカード */}
                                <NavDropdown
                                    label="タイムカード"
                                    active={route().current('timecard.*')}
                                    items={[
                                        {
                                            href: route('timecard.index'),
                                            label: '打刻',
                                        },
                                        {
                                            href: route('timecard.history'),
                                            label: '履歴',
                                        },
                                        ...(isManager
                                            ? [
                                                  {
                                                      href: route(
                                                          'timecard.manage',
                                                      ),
                                                      label: '管理',
                                                  },
                                                  {
                                                      href: route(
                                                          'timecard.reports',
                                                      ),
                                                      label: 'レポート',
                                                  },
                                              ]
                                            : []),
                                    ]}
                                />

                                <NavLink
                                    href={route('announcements.index')}
                                    active={route().current('announcements.*')}
                                >
                                    お知らせ
                                </NavLink>

                                <NavLink
                                    href={route('shifts.index')}
                                    active={route().current('shifts.*')}
                                >
                                    シフト
                                </NavLink>

                                {/* 予約カレンダー */}
                                {routeExists('reservations.availability.index') && (
                                    <NavLink
                                        href={safeRoute('reservations.availability.index')}
                                        active={route().current('reservations.*')}
                                    >
                                        予約カレンダー
                                    </NavLink>
                                )}

                                <NavLink
                                    href={route('wallet.show')}
                                    active={route().current('wallet.show')}
                                >
                                    マイウォレット
                                </NavLink>

                                {/* 管理（Admin専用） */}
                                {isAdmin && (
                                    <NavDropdown
                                        label="管理"
                                        active={
                                            route().current('admin.*') ||
                                            route().current('users.*')
                                        }
                                        items={[
                                            {
                                                href: safeRoute('users.index'),
                                                label: 'ユーザー管理',
                                            },
                                            {
                                                href: safeRoute(
                                                    'admin.locations.index',
                                                ),
                                                label: '拠点管理',
                                            },
                                            {
                                                href: safeRoute(
                                                    'admin.tips.index',
                                                ),
                                                label: '投げ銭統計',
                                            },
                                        ]}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center">
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-600 transition duration-150 ease-in-out hover:text-gray-900 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            プロフィール
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            ログアウト
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* モバイルナビゲーション */}
                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            ダッシュボード
                        </ResponsiveNavLink>

                        {/* チェックリスト */}
                        <div>
                            <button
                                onClick={() =>
                                    toggleMobileSubmenu('checklists')
                                }
                                className={`flex w-full items-center justify-between border-l-4 py-2 pe-4 ps-3 text-start text-base font-medium transition duration-150 ease-in-out focus:outline-none ${
                                    route().current('checklists.*')
                                        ? 'border-blue-400 bg-blue-50 text-blue-700 focus:border-blue-700 focus:bg-blue-100 focus:text-blue-800'
                                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800'
                                }`}
                            >
                                チェックリスト
                                <svg
                                    className={`h-5 w-5 transition-transform ${expandedMobileMenu === 'checklists' ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {expandedMobileMenu === 'checklists' && (
                                <div className="bg-gray-50 pl-6">
                                    <ResponsiveNavLink
                                        href={route('checklists.index')}
                                    >
                                        日次一覧
                                    </ResponsiveNavLink>
                                    {isManager && (
                                        <ResponsiveNavLink
                                            href={route(
                                                'checklists.templates.index',
                                            )}
                                        >
                                            テンプレート管理
                                        </ResponsiveNavLink>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* 備品管理 */}
                        <div>
                            <button
                                onClick={() => toggleMobileSubmenu('inventory')}
                                className={`flex w-full items-center justify-between border-l-4 py-2 pe-4 ps-3 text-start text-base font-medium transition duration-150 ease-in-out focus:outline-none ${
                                    route().current('inventory.*')
                                        ? 'border-blue-400 bg-blue-50 text-blue-700 focus:border-blue-700 focus:bg-blue-100 focus:text-blue-800'
                                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800'
                                }`}
                            >
                                備品管理
                                <svg
                                    className={`h-5 w-5 transition-transform ${expandedMobileMenu === 'inventory' ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {expandedMobileMenu === 'inventory' && (
                                <div className="bg-gray-50 pl-6">
                                    <ResponsiveNavLink
                                        href={route('inventory.index')}
                                    >
                                        使用入力
                                    </ResponsiveNavLink>
                                    {isManager && (
                                        <>
                                            <ResponsiveNavLink
                                                href={route('inventory.manage')}
                                            >
                                                在庫管理
                                            </ResponsiveNavLink>
                                            <ResponsiveNavLink
                                                href={route('inventory.logs')}
                                            >
                                                履歴
                                            </ResponsiveNavLink>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* タイムカード */}
                        <div>
                            <button
                                onClick={() => toggleMobileSubmenu('timecard')}
                                className={`flex w-full items-center justify-between border-l-4 py-2 pe-4 ps-3 text-start text-base font-medium transition duration-150 ease-in-out focus:outline-none ${
                                    route().current('timecard.*')
                                        ? 'border-blue-400 bg-blue-50 text-blue-700 focus:border-blue-700 focus:bg-blue-100 focus:text-blue-800'
                                        : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800'
                                }`}
                            >
                                タイムカード
                                <svg
                                    className={`h-5 w-5 transition-transform ${expandedMobileMenu === 'timecard' ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>
                            {expandedMobileMenu === 'timecard' && (
                                <div className="bg-gray-50 pl-6">
                                    <ResponsiveNavLink
                                        href={route('timecard.index')}
                                    >
                                        打刻
                                    </ResponsiveNavLink>
                                    <ResponsiveNavLink
                                        href={route('timecard.history')}
                                    >
                                        履歴
                                    </ResponsiveNavLink>
                                    {isManager && (
                                        <>
                                            <ResponsiveNavLink
                                                href={route('timecard.manage')}
                                            >
                                                管理
                                            </ResponsiveNavLink>
                                            <ResponsiveNavLink
                                                href={route('timecard.reports')}
                                            >
                                                レポート
                                            </ResponsiveNavLink>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <ResponsiveNavLink
                            href={route('announcements.index')}
                            active={route().current('announcements.*')}
                        >
                            お知らせ
                        </ResponsiveNavLink>
                        <ResponsiveNavLink
                            href={route('shifts.index')}
                            active={route().current('shifts.*')}
                        >
                            シフト
                        </ResponsiveNavLink>

                        {/* 予約カレンダー */}
                        {routeExists('reservations.availability.index') && (
                            <ResponsiveNavLink
                                href={safeRoute('reservations.availability.index')}
                                active={route().current('reservations.*')}
                            >
                                予約カレンダー
                            </ResponsiveNavLink>
                        )}

                        <ResponsiveNavLink
                            href={route('wallet.show')}
                            active={route().current('wallet.show')}
                        >
                            マイウォレット
                        </ResponsiveNavLink>

                        {/* 管理（Admin専用） */}
                        {isAdmin && (
                            <div>
                                <button
                                    onClick={() => toggleMobileSubmenu('admin')}
                                    className={`flex w-full items-center justify-between border-l-4 py-2 pe-4 ps-3 text-start text-base font-medium transition duration-150 ease-in-out focus:outline-none ${
                                        route().current('admin.*') ||
                                        route().current('users.*')
                                            ? 'border-blue-400 bg-blue-50 text-blue-700 focus:border-blue-700 focus:bg-blue-100 focus:text-blue-800'
                                            : 'border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-800'
                                    }`}
                                >
                                    管理
                                    <svg
                                        className={`h-5 w-5 transition-transform ${expandedMobileMenu === 'admin' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>
                                {expandedMobileMenu === 'admin' && (
                                    <div className="bg-gray-50 pl-6">
                                        <ResponsiveNavLink
                                            href={safeRoute('users.index')}
                                        >
                                            ユーザー管理
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            href={safeRoute(
                                                'admin.locations.index',
                                            )}
                                        >
                                            拠点管理
                                        </ResponsiveNavLink>
                                        <ResponsiveNavLink
                                            href={safeRoute('admin.tips.index')}
                                        >
                                            投げ銭統計
                                        </ResponsiveNavLink>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-900">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                プロフィール
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                ログアウト
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
