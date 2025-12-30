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

// Checklist Types
export interface ChecklistTemplate {
    id: number;
    name: string;
    type: 'lunch_prep' | 'dinner_prep' | 'cleaning' | 'other';
    type_label: string;
    location_id: number | null;
    location?: Location;
    is_active: boolean;
    sort_order: number;
    items: ChecklistItem[];
    items_count?: number;
    created_at: string;
    updated_at: string;
}

export interface ChecklistItem {
    id: number;
    template_id: number;
    description: string;
    sort_order: number;
}

export interface DailyChecklist {
    id: number;
    template_id: number;
    template: ChecklistTemplate;
    date: string;
    created_by: number;
    creator?: User;
    completed_at: string | null;
    completion_rate: number;
    is_completed: boolean;
    entries: DailyChecklistEntry[];
}

export interface DailyChecklistEntry {
    id: number;
    daily_checklist_id: number;
    checklist_item_id: number;
    item?: ChecklistItem;
    completed_at: string | null;
    completed_by: number | null;
    completed_by_user?: User;
    is_completed: boolean;
}

export interface Location {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

// Inventory Types
export interface InventoryItem {
    id: number;
    location_id: number;
    location?: Location;
    name: string;
    unit: string;
    current_stock: number;
    reorder_point: number;
    reorder_notified_at: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface InventoryLog {
    id: number;
    item_id: number;
    item?: InventoryItem;
    type: 'usage' | 'restock' | 'adjustment';
    type_label: string;
    quantity_change: number;
    notes: string | null;
    user_id: number;
    user?: User;
    created_at: string;
}

// TimeCard Types
export interface TimeRecord {
    id: number;
    user_id: number;
    user?: User;
    date: string;
    clock_in: string | null;
    clock_out: string | null;
    break_start: string | null;
    break_end: string | null;
    break_minutes: number;
    notes: string | null;
    modified_by: number | null;
    modified_by_user?: User;
    modified_at: string | null;
    status: 'not_started' | 'working' | 'on_break' | 'completed';
    work_minutes?: number;
    created_at: string;
    updated_at: string;
}

export interface MonthlyTimeReport {
    user_id: number;
    user: User;
    total_work_minutes: number;
    total_break_minutes: number;
    work_days: number;
    records: TimeRecord[];
}

// Announcement Types
export interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: 'normal' | 'important';
    published_at: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    author?: User;
    is_read?: boolean;
}

export interface AnnouncementRead {
    id: number;
    announcement_id: number;
    user_id: number;
    read_at: string;
}

// Shift Types
export interface Shift {
    id: number;
    user_id: number;
    date: string;
    status: 'working' | 'off';
    created_by: number;
    created_at: string;
    updated_at: string;
    user?: User;
    creator?: User;
}

// Shift Management Types
export interface ShiftUserData {
    id: number;
    name: string;
    role: string;
    default_mode: 'working' | 'off';
    exception_dates: string[];
    working_count: number;
    off_count: number;
}

export interface CalendarDay {
    date: string;
    day: number;
    dayOfWeek: number; // 0 = Sunday, 6 = Saturday
}