<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\GuestPage;
use App\Models\GoogleReviewRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /**
     * Record a Google review click.
     */
    public function recordClick(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_page_uuid' => 'required|string|exists:guest_pages,uuid',
        ]);

        $guestPage = GuestPage::where('uuid', $validated['guest_page_uuid'])->first();

        if (!$guestPage) {
            return response()->json([
                'success' => false,
                'message' => 'Guest page not found.',
            ], 404);
        }

        // Check if guest page is expired
        if ($guestPage->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Guest page has expired.',
            ], 410);
        }

        GoogleReviewRequest::create([
            'guest_page_id' => $guestPage->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Review click recorded.',
        ]);
    }

    /**
     * Mark a review as submitted.
     */
    public function markSubmitted(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'guest_page_uuid' => 'required|string|exists:guest_pages,uuid',
        ]);

        $guestPage = GuestPage::where('uuid', $validated['guest_page_uuid'])->first();

        if (!$guestPage) {
            return response()->json([
                'success' => false,
                'message' => 'Guest page not found.',
            ], 404);
        }

        // Check if guest page is expired
        if ($guestPage->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Guest page has expired.',
            ], 410);
        }

        // Find the most recent click for this guest page
        $reviewRequest = GoogleReviewRequest::where('guest_page_id', $guestPage->id)
            ->where('review_submitted', false)
            ->orderBy('clicked_at', 'desc')
            ->first();

        if ($reviewRequest) {
            $reviewRequest->markAsSubmitted();
        }

        return response()->json([
            'success' => true,
            'message' => 'Review marked as submitted.',
        ]);
    }
}
