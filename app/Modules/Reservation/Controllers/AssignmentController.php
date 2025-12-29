<?php

namespace App\Modules\Reservation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Reservation\Models\BanshirouReservation;
use App\Modules\Reservation\Models\ReservationAssignment;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Store a new assignment.
     */
    public function store(Request $request, BanshirouReservation $reservation)
    {
        $validated = $request->validate([
            'assignment_type' => 'required|in:cleaning,setup',
            'user_id' => 'required|exists:users,id',
        ]);

        // Check if assignment already exists
        $existingAssignment = $reservation->assignments()
            ->where('assignment_type', $validated['assignment_type'])
            ->first();

        if ($existingAssignment) {
            // Update existing assignment
            $existingAssignment->update(['user_id' => $validated['user_id']]);
            $assignment = $existingAssignment;
        } else {
            // Create new assignment
            $assignment = $reservation->assignments()->create($validated);
        }

        $user = User::find($validated['user_id']);
        $typeLabel = $validated['assignment_type'] === 'cleaning' ? '掃除' : 'セット';

        $this->activityLog->log(
            'reservation',
            'assigned',
            $assignment,
            $assignment->id,
            "{$typeLabel}担当割り当て: {$user->name} → {$reservation->name}様"
        );

        return back()->with('success', '担当者を割り当てました。');
    }

    /**
     * Remove an assignment.
     */
    public function destroy(ReservationAssignment $assignment)
    {
        $reservation = $assignment->reservation;
        $user = $assignment->user;
        $typeLabel = $assignment->type_label;

        $assignment->delete();

        $this->activityLog->log(
            'reservation',
            'unassigned',
            null,
            null,
            "{$typeLabel}担当解除: {$user->name} → {$reservation->name}様"
        );

        return back()->with('success', '担当者の割り当てを解除しました。');
    }

    /**
     * Get users available for assignment.
     */
    public function getAvailableUsers()
    {
        $users = User::orderBy('name')
            ->get(['id', 'name', 'role']);

        return response()->json($users);
    }
}
