export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    role: 'admin' | 'manager' | 'staff';
    avatar?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
};

// Guest Page Types
export interface GuestPageData {
    id: number;
    uuid: string;
    guest_name: string;
    room_number: string | null;
    check_in_date: string;
    check_out_date: string;
}

export interface GuestStaff {
    id: number;
    name: string;
    avatar: string | null;
    role: 'cooking' | 'cleaning' | 'front';
    wallet_address: string | null;
}

export interface StaffWallet {
    id: number;
    user_id: number;
    wallet_address: string;
    short_address: string;
    is_verified: boolean;
    connected_at: string | null;
}

// Tip Statistics Types
export interface StaffTipStats {
    id: number;
    name: string;
    role: string;
    has_wallet: boolean;
    total_tips: number;
    monthly_tips: number;
    last_tip_date: string | null;
}

export interface MonthlyTipTrend {
    label: string;
    total: number;
}

export interface RoleStats {
    role: string;
    role_label: string;
    total: number;
}

export interface TipTotals {
    all_time: number;
    this_month: number;
    this_year: number;
}
