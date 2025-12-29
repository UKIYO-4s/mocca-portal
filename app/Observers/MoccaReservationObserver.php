<?php

namespace App\Observers;

use App\Modules\Reservation\Models\MoccaReservation;
use App\Services\ReservationChecklistService;

class MoccaReservationObserver
{
    public function __construct(
        protected ReservationChecklistService $checklistService
    ) {}

    /**
     * Handle the MoccaReservation "created" event.
     * Generate meal preparation checklist for the reservation date.
     */
    public function created(MoccaReservation $reservation): void
    {
        $this->checklistService->generateForMocca($reservation);
    }

    /**
     * Handle the MoccaReservation "updated" event.
     * Regenerate checklists if date or type changed, or remove if cancelled.
     */
    public function updated(MoccaReservation $reservation): void
    {
        // If cancelled, try to remove empty checklists
        if ($reservation->status === 'cancelled' && $reservation->wasChanged('status')) {
            $this->checklistService->removeForMocca($reservation);
            return;
        }

        // If date or type changed, regenerate checklists
        if ($reservation->wasChanged('reservation_date') || $reservation->wasChanged('reservation_type')) {
            $this->checklistService->generateForMocca($reservation);
        }
    }
}
