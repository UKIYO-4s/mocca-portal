<?php

namespace App\Services;

use App\Modules\Checklist\Models\ChecklistTemplate;
use App\Modules\Checklist\Models\DailyChecklist;
use App\Modules\Checklist\Models\DailyChecklistEntry;
use App\Modules\Reservation\Models\BanshirouReservation;
use App\Modules\Reservation\Models\MoccaReservation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReservationChecklistService
{
    /**
     * Generate checklists for a Banshirou reservation.
     * Creates cleaning checklists for check-in and check-out dates.
     */
    public function generateForBanshirou(BanshirouReservation $reservation): void
    {
        if ($reservation->status === 'cancelled') {
            return;
        }

        // Generate checklist for check-in date (room setup/preparation)
        $this->generateChecklistForDate(
            $reservation->checkin_date,
            'cleaning',
            $reservation->created_by
        );

        // Generate checklist for check-out date (post-checkout cleaning)
        $this->generateChecklistForDate(
            $reservation->checkout_date,
            'cleaning',
            $reservation->created_by
        );
    }

    /**
     * Generate checklists for a Mocca reservation.
     * Creates meal preparation checklist based on reservation type.
     */
    public function generateForMocca(MoccaReservation $reservation): void
    {
        if ($reservation->status === 'cancelled') {
            return;
        }

        // Map reservation type to checklist template type
        $checklistType = match($reservation->reservation_type) {
            'breakfast', 'lunch' => 'lunch_prep',
            'dinner' => 'dinner_prep',
            default => null,
        };

        if ($checklistType === null) {
            return;
        }

        $this->generateChecklistForDate(
            $reservation->reservation_date,
            $checklistType,
            $reservation->created_by
        );
    }

    /**
     * Remove checklists for a Banshirou reservation when cancelled.
     */
    public function removeForBanshirou(BanshirouReservation $reservation): void
    {
        // Only remove empty checklists (no completed items)
        $this->removeEmptyChecklistsForDate($reservation->checkin_date, 'cleaning');
        $this->removeEmptyChecklistsForDate($reservation->checkout_date, 'cleaning');
    }

    /**
     * Remove checklists for a Mocca reservation when cancelled.
     */
    public function removeForMocca(MoccaReservation $reservation): void
    {
        $checklistType = match($reservation->reservation_type) {
            'breakfast', 'lunch' => 'lunch_prep',
            'dinner' => 'dinner_prep',
            default => null,
        };

        if ($checklistType !== null) {
            $this->removeEmptyChecklistsForDate($reservation->reservation_date, $checklistType);
        }
    }

    /**
     * Generate checklists for a specific date and type.
     */
    protected function generateChecklistForDate(
        Carbon $date,
        string $templateType,
        ?int $createdBy = null
    ): void {
        $dateString = $date->toDateString();

        DB::transaction(function () use ($dateString, $templateType, $createdBy) {
            // Get all active templates of this type
            $templates = ChecklistTemplate::active()
                ->ofType($templateType)
                ->with('items')
                ->orderBy('sort_order')
                ->get();

            foreach ($templates as $template) {
                // Check if checklist already exists for this template and date
                $exists = DailyChecklist::forDate($dateString)
                    ->forTemplate($template->id)
                    ->exists();

                if ($exists) {
                    continue;
                }

                // Create the daily checklist
                $dailyChecklist = DailyChecklist::create([
                    'template_id' => $template->id,
                    'date' => $dateString,
                    'created_by' => $createdBy,
                    'completed_at' => null,
                ]);

                // Create entries for each item
                foreach ($template->items as $item) {
                    DailyChecklistEntry::create([
                        'daily_checklist_id' => $dailyChecklist->id,
                        'checklist_item_id' => $item->id,
                        'completed_at' => null,
                        'completed_by' => null,
                    ]);
                }
            }
        });
    }

    /**
     * Remove empty checklists for a specific date and type.
     * Only removes checklists with no completed entries.
     */
    protected function removeEmptyChecklistsForDate(Carbon $date, string $templateType): void
    {
        $dateString = $date->toDateString();

        DB::transaction(function () use ($dateString, $templateType) {
            $checklists = DailyChecklist::forDate($dateString)
                ->whereHas('template', function ($q) use ($templateType) {
                    $q->where('type', $templateType);
                })
                ->get();

            foreach ($checklists as $checklist) {
                // Only delete if no entries are completed
                $hasCompletedEntries = $checklist->entries()
                    ->whereNotNull('completed_at')
                    ->exists();

                if (!$hasCompletedEntries) {
                    $checklist->entries()->delete();
                    $checklist->delete();
                }
            }
        });
    }
}
