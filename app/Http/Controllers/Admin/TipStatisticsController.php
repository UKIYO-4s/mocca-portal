<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TipStatisticsController extends Controller
{
    /**
     * Display tip statistics dashboard.
     */
    public function index(Request $request): Response
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month');

        // Staff tip summary
        $staffStats = User::with('wallet')
            ->whereIn('role', ['staff', 'manager', 'admin'])
            ->withCount(['tipTransactions as total_tips' => function ($query) {
                $query->select(DB::raw('COALESCE(SUM(tip_count), 0)'));
            }])
            ->withCount(['tipTransactions as monthly_tips' => function ($query) {
                $query->select(DB::raw('COALESCE(SUM(tip_count), 0)'))
                    ->whereMonth('tipped_at', now()->month)
                    ->whereYear('tipped_at', now()->year);
            }])
            ->get()
            ->map(function ($user) {
                $lastTip = $user->tipTransactions()->latest('tipped_at')->first();
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'role' => $user->role,
                    'has_wallet' => $user->wallet !== null,
                    'total_tips' => $user->total_tips ?? 0,
                    'monthly_tips' => $user->monthly_tips ?? 0,
                    'last_tip_date' => $lastTip?->tipped_at?->format('Y-m-d H:i'),
                ];
            })
            ->sortByDesc('total_tips')
            ->values();

        // Monthly trend data (last 12 months)
        $monthlyTrend = TipTransaction::select(
            DB::raw('YEAR(tipped_at) as year'),
            DB::raw('MONTH(tipped_at) as month'),
            DB::raw('SUM(tip_count) as total')
        )
            ->where('tipped_at', '>=', now()->subMonths(12))
            ->groupBy('year', 'month')
            ->orderBy('year')
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'label' => sprintf('%d/%02d', $item->year, $item->month),
                    'total' => $item->total,
                ];
            });

        // Role-based summary
        $roleStats = User::select('role', DB::raw('SUM(tip_count) as total'))
            ->leftJoin('tip_transactions', 'users.id', '=', 'tip_transactions.staff_id')
            ->whereIn('role', ['staff', 'manager', 'admin'])
            ->groupBy('role')
            ->get()
            ->map(function ($item) {
                return [
                    'role' => $item->role,
                    'role_label' => match ($item->role) {
                        'admin' => '管理者',
                        'manager' => 'マネージャー',
                        'staff' => 'スタッフ',
                        default => $item->role,
                    },
                    'total' => $item->total ?? 0,
                ];
            });

        // Overall totals
        $totals = [
            'all_time' => TipTransaction::sum('tip_count'),
            'this_month' => TipTransaction::whereMonth('tipped_at', now()->month)
                ->whereYear('tipped_at', now()->year)
                ->sum('tip_count'),
            'this_year' => TipTransaction::whereYear('tipped_at', now()->year)
                ->sum('tip_count'),
        ];

        return Inertia::render('Admin/TipStatistics', [
            'staffStats' => $staffStats,
            'monthlyTrend' => $monthlyTrend,
            'roleStats' => $roleStats,
            'totals' => $totals,
            'filters' => [
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    /**
     * Show detailed statistics for a specific staff member.
     */
    public function show(User $user): Response
    {
        $transactions = $user->tipTransactions()
            ->with('guestPage')
            ->orderBy('tipped_at', 'desc')
            ->paginate(20);

        // Monthly breakdown for this staff member
        $monthlyBreakdown = $user->tipTransactions()
            ->select(
                DB::raw('YEAR(tipped_at) as year'),
                DB::raw('MONTH(tipped_at) as month'),
                DB::raw('SUM(tip_count) as total')
            )
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->take(12)
            ->get()
            ->map(function ($item) {
                return [
                    'label' => sprintf('%d/%02d', $item->year, $item->month),
                    'total' => $item->total,
                ];
            });

        return Inertia::render('Admin/StaffTipDetail', [
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'total_tips' => $user->getTotalTipCount(),
                'monthly_tips' => $user->getMonthlyTipCount(),
                'has_wallet' => $user->hasWallet(),
                'wallet_address' => $user->wallet?->short_address,
            ],
            'transactions' => $transactions,
            'monthlyBreakdown' => $monthlyBreakdown,
        ]);
    }

    /**
     * Export tip statistics as CSV.
     */
    public function export(Request $request): StreamedResponse
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month');

        $filename = $month
            ? "tip_statistics_{$year}_{$month}.csv"
            : "tip_statistics_{$year}.csv";

        return response()->streamDownload(function () use ($year, $month) {
            $handle = fopen('php://output', 'w');

            // BOM for Excel UTF-8
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header
            fputcsv($handle, [
                'スタッフ名',
                '役職',
                '投げ銭回数',
                '最終受取日',
            ]);

            $query = TipTransaction::select(
                'staff_id',
                DB::raw('SUM(tip_count) as total'),
                DB::raw('MAX(tipped_at) as last_tip')
            )
                ->whereYear('tipped_at', $year);

            if ($month) {
                $query->whereMonth('tipped_at', $month);
            }

            $stats = $query->groupBy('staff_id')
                ->with('staff')
                ->get();

            foreach ($stats as $stat) {
                fputcsv($handle, [
                    $stat->staff?->name ?? '不明',
                    match ($stat->staff?->role) {
                        'admin' => '管理者',
                        'manager' => 'マネージャー',
                        'staff' => 'スタッフ',
                        default => $stat->staff?->role ?? '不明',
                    },
                    $stat->total,
                    $stat->last_tip,
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
