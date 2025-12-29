<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuestPage;
use App\Models\GuestStaffAssignment;
use App\Models\TipTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TipController extends Controller
{
    /**
     * Record a tip transaction.
     */
    public function record(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_page_uuid' => 'required|string|exists:guest_pages,uuid',
            'staff_id' => 'required|integer|exists:users,id',
            'transaction_hash' => 'required|string|size:66|unique:tip_transactions,transaction_hash',
            'network' => 'string|in:polygon,polygon-mumbai',
        ]);

        $guestPage = GuestPage::where('uuid', $validated['guest_page_uuid'])->first();

        if (!$guestPage || $guestPage->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Guest page is expired or invalid.',
            ], 400);
        }

        $staff = User::find($validated['staff_id']);
        if (!$staff || !$staff->hasWallet()) {
            return response()->json([
                'success' => false,
                'message' => 'Staff wallet not found.',
            ], 400);
        }

        // Verify staff is assigned to this guest page
        $isAssigned = GuestStaffAssignment::where('guest_page_id', $guestPage->id)
            ->where('staff_id', $validated['staff_id'])
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'success' => false,
                'message' => 'Staff is not assigned to this guest page.',
            ], 403);
        }

        $ipAddress = $request->ip();

        // Rate limiting check
        if (!TipTransaction::canTip($ipAddress, $validated['staff_id'])) {
            $remaining = TipTransaction::remainingTips($ipAddress, $validated['staff_id']);
            return response()->json([
                'success' => false,
                'message' => 'Tip limit reached. Please try again later.',
                'remaining_tips' => $remaining,
            ], 429);
        }

        $transaction = TipTransaction::create([
            'guest_page_id' => $guestPage->id,
            'staff_id' => $validated['staff_id'],
            'transaction_hash' => $validated['transaction_hash'],
            'network' => $validated['network'] ?? 'polygon',
            'tip_count' => 1,
            'ip_address' => $ipAddress,
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tip recorded successfully.',
            'transaction_id' => $transaction->id,
            'remaining_tips' => TipTransaction::remainingTips($ipAddress, $validated['staff_id']),
        ]);
    }

    /**
     * Check if user can tip a staff member.
     */
    public function canTip(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_page_uuid' => 'required|string|exists:guest_pages,uuid',
            'staff_id' => 'required|integer|exists:users,id',
        ]);

        // Check guest page validity
        $guestPage = GuestPage::where('uuid', $validated['guest_page_uuid'])->first();

        if (!$guestPage || $guestPage->isExpired()) {
            return response()->json([
                'can_tip' => false,
                'reason' => 'guest_page_expired',
                'message' => 'Guest page is expired or invalid.',
            ]);
        }

        // Check staff is assigned to this guest page
        $isAssigned = GuestStaffAssignment::where('guest_page_id', $guestPage->id)
            ->where('staff_id', $validated['staff_id'])
            ->exists();

        if (!$isAssigned) {
            return response()->json([
                'can_tip' => false,
                'reason' => 'staff_not_assigned',
                'message' => 'Staff is not assigned to this guest page.',
            ]);
        }

        // Check staff has wallet
        $staff = User::find($validated['staff_id']);
        if (!$staff || !$staff->hasWallet()) {
            return response()->json([
                'can_tip' => false,
                'reason' => 'no_wallet',
                'message' => 'Staff wallet not found.',
            ]);
        }

        $ipAddress = $request->ip();
        $canTip = TipTransaction::canTip($ipAddress, $validated['staff_id']);
        $remaining = TipTransaction::remainingTips($ipAddress, $validated['staff_id']);

        return response()->json([
            'can_tip' => $canTip,
            'remaining_tips' => $remaining,
            'reason' => $canTip ? null : 'rate_limit',
        ]);
    }
}
