import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex min-h-[44px] w-full items-start border-l-4 py-3 pe-4 ps-3 ${
                active
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 focus:border-indigo-700 focus:bg-indigo-100 focus:text-indigo-800'
                    : 'border-transparent text-gray-700 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:border-gray-300 focus:bg-gray-50 focus:text-gray-900'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
