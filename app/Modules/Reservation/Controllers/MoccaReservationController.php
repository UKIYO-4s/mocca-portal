<?php

namespace App\Modules\Reservation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reservation\Models\BanshirouReservation;
use App\Modules\Reservation\Models\MoccaReservation;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MoccaReservationController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display a listing of reservations.
     */
    public function index(Request $request): Response
    {
        $query = MoccaReservation::with(['creator', 'banshirouReservation'])
            ->orderBy('reservation_date', 'desc')
            ->orderBy('reservation_type');

        // Filter by date
        if ($request->filled('date')) {
            $query->forDate($request->date);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->ofType($request->type);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reservations = $query->paginate(20)->withQueryString();

        return Inertia::render('Reservations/Mocca/Index', [
            'reservations' => $reservations,
            'filters' => $request->only(['date', 'type', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new reservation.
     */
    public function create(Request $request): Response
    {
        // Get Banshirou reservations for linking
        $banshirouReservations = BanshirouReservation::confirmed()
            ->where('checkout_date', '>=', now())
            ->orderBy('checkin_date')
            ->get(['id', 'name', 'checkin_date', 'checkout_date']);

        return Inertia::render('Reservations/Mocca/Create', [
            'banshirouReservations' => $banshirouReservations,
            'linkedReservationId' => $request->query('banshirou_id'),
        ]);
    }

    /**
     * Store a newly created reservation.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'reservation_type' => 'required|in:breakfast,lunch,dinner',
            'reservation_date' => 'required|date',
            'name' => 'required|string|max:255',
            'guest_count' => 'required|integer|min:1',
            'arrival_time' => 'nullable|date_format:H:i',
            'phone' => 'nullable|string|max:20',
            'advance_menu' => 'nullable|string',
            'notes' => 'nullable|string',
            'banshirou_reservation_id' => 'nullable|exists:banshirou_reservations,id',
        ]);

        // Normalize phone number
        if (!empty($validated['phone'])) {
            $validated['phone'] = preg_replace('/[^0-9]/', '', $validated['phone']);
        }
        $validated['created_by'] = Auth::id();

        $reservation = MoccaReservation::create($validated);

        $this->activityLog->logCreated('reservation', $reservation, "食事予約作成: {$reservation->name}様 ({$reservation->type_label})");

        return redirect()
            ->route('reservations.mocca.show', $reservation)
            ->with('success', '食事予約を作成しました。');
    }

    /**
     * Display the specified reservation.
     */
    public function show(MoccaReservation $reservation): Response
    {
        $reservation->load(['creator', 'banshirouReservation']);

        return Inertia::render('Reservations/Mocca/Show', [
            'reservation' => $reservation,
        ]);
    }

    /**
     * Show the form for editing the specified reservation.
     */
    public function edit(MoccaReservation $reservation): Response
    {
        $banshirouReservations = BanshirouReservation::confirmed()
            ->where('checkout_date', '>=', now())
            ->orderBy('checkin_date')
            ->get(['id', 'name', 'checkin_date', 'checkout_date']);

        return Inertia::render('Reservations/Mocca/Edit', [
            'reservation' => $reservation,
            'banshirouReservations' => $banshirouReservations,
        ]);
    }

    /**
     * Update the specified reservation.
     */
    public function update(Request $request, MoccaReservation $reservation)
    {
        $validated = $request->validate([
            'reservation_type' => 'required|in:breakfast,lunch,dinner',
            'reservation_date' => 'required|date',
            'name' => 'required|string|max:255',
            'guest_count' => 'required|integer|min:1',
            'arrival_time' => 'nullable|date_format:H:i',
            'phone' => 'nullable|string|max:20',
            'advance_menu' => 'nullable|string',
            'notes' => 'nullable|string',
            'banshirou_reservation_id' => 'nullable|exists:banshirou_reservations,id',
            'status' => 'sometimes|in:confirmed,cancelled',
        ]);

        // Normalize phone number
        if (!empty($validated['phone'])) {
            $validated['phone'] = preg_replace('/[^0-9]/', '', $validated['phone']);
        }

        $reservation->update($validated);

        $this->activityLog->logUpdated('reservation', $reservation, "食事予約更新: {$reservation->name}様");

        return redirect()
            ->route('reservations.mocca.show', $reservation)
            ->with('success', '食事予約を更新しました。');
    }

    /**
     * Remove the specified reservation.
     */
    public function destroy(MoccaReservation $reservation)
    {
        $name = $reservation->name;
        $reservation->delete();

        $this->activityLog->log('reservation', 'deleted', null, "食事予約削除: {$name}様");

        return redirect()
            ->route('reservations.mocca.index')
            ->with('success', '食事予約を削除しました。');
    }
}
