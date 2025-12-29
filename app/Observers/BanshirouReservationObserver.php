<?php

namespace App\Observers;

use App\Modules\Reservation\Models\BanshirouReservation;
use App\Services\ReservationChecklistService;

class BanshirouReservationObserver
{
    public function __construct(
        protected ReservationChecklistService $checklistService
    ) {}

    /**
     * Handle the BanshirouReservation "created" event.
     * Generate checklists for check-in and check-out dates.
     */
    public function created(BanshirouReservation $reservation): void
    {
        $this->checklistService->generateForBanshirou($reservation);
    }

    /**
     * Handle the BanshirouReservation "updated" event.
     * Regenerate checklists if dates changed or status changed.
     */
    public function updated(BanshirouReservation $reservation): void
    {
        // If cancelled, try to remove empty checklists
        if ($reservation->status === 'cancelled' && $reservation->wasChanged('status')) {
            $this->checklistService->removeForBanshirou($reservation);
            return;
        }

        // If dates changed, regenerate checklists for new dates
        if ($reservation->wasChanged('checkin_date') || $reservation->wasChanged('checkout_date')) {
            $this->checklistService->generateForBanshirou($reservation);
        }
    }
}
