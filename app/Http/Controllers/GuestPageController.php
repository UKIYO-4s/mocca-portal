<?php

namespace App\Http\Controllers;

use App\Models\GuestPage;
use Inertia\Inertia;
use Inertia\Response;

class GuestPageController extends Controller
{
    /**
     * Display the guest page.
     */
    public function show(string $uuid): Response
    {
        $guestPage = GuestPage::where('uuid', $uuid)->first();

        if (!$guestPage) {
            abort(404);
        }

        if ($guestPage->isExpired()) {
            return Inertia::render('Guest/Expired', [
                'guestName' => $guestPage->guest_name,
            ]);
        }

        $staffList = $guestPage->getAssignedStaffWithWallets();

        // Select Google Place ID based on reservation type
        $googlePlaceId = $guestPage->reservation_type === 'mocca'
            ? config('services.google.place_id_mocca')
            : config('services.google.place_id_banshirou');

        return Inertia::render('Guest/Show', [
            'guestData' => [
                'id' => $guestPage->id,
                'uuid' => $guestPage->uuid,
                'guest_name' => $guestPage->guest_name,
                'room_number' => $guestPage->room_number,
                'check_in_date' => $guestPage->check_in_date->format('Y-m-d'),
                'check_out_date' => $guestPage->check_out_date->format('Y-m-d'),
            ],
            'staffList' => $staffList,
            'googlePlaceId' => $googlePlaceId,
            'lineOfficialUrl' => config('services.line.official_url'),
            'contactPhone' => config('services.contact.phone'),
        ]);
    }
}
