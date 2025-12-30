<?php

namespace App\Modules\Reservation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reservation\Models\BanshirouReservation;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class BanshirouReservationController extends Controller
{
    public function __construct(
        protected ActivityLogService $activityLog
    ) {}

    /**
     * Display a listing of reservations.
     */
    public function index(Request $request): Response
    {
        $query = BanshirouReservation::with(['creator', 'cleaningAssignment.user', 'setupAssignment.user'])
            ->withCount('moccaReservations')
            ->orderBy('checkin_date', 'desc');

        // Filter by date range
        if ($request->filled('from')) {
            $query->where('checkin_date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('checkin_date', '<=', $request->to);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $reservations = $query->paginate(20)->withQueryString();

        return Inertia::render('Reservations/Banshirou/Index', [
            'reservations' => $reservations,
            'filters' => $request->only(['from', 'to', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new reservation.
     */
    public function create(): Response
    {
        return Inertia::render('Reservations/Banshirou/Create');
    }

    /**
     * Store a newly created reservation.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_kana' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string',
            'checkin_date' => 'required|date|after_or_equal:today',
            'checkout_date' => 'required|date|after:checkin_date',
            'guest_count_adults' => 'required|integer|min:1',
            'guest_count_children' => 'nullable|integer|min:0',
            'meal_option' => 'required|in:with_meals,seat_only,no_meals',
            'pickup_required' => 'boolean',
            'options' => 'nullable|array',
            'payment_method' => 'required|in:cash,credit,bank_transfer',
            'notes' => 'nullable|string',
        ]);

        // Normalize phone number (remove hyphens for storage)
        $validated['phone'] = preg_replace('/[^0-9]/', '', $validated['phone']);
        $validated['created_by'] = Auth::id();
        $validated['guest_count_children'] = $validated['guest_count_children'] ?? 0;
        $validated['pickup_required'] = $validated['pickup_required'] ?? false;

        $reservation = BanshirouReservation::create($validated);

        $this->activityLog->logCreated('reservation', $reservation, "予約作成: {$reservation->name}様");

        return redirect()
            ->route('reservations.banshirou.show', $reservation)
            ->with('success', '予約を作成しました。');
    }

    /**
     * Display the specified reservation.
     */
    public function show(BanshirouReservation $reservation): Response
    {
        $reservation->load([
            'creator',
            'cleaningAssignment.user',
            'setupAssignment.user',
            'moccaReservations.creator',
        ]);

        return Inertia::render('Reservations/Banshirou/Show', [
            'reservation' => $reservation,
        ]);
    }

    /**
     * Show the form for editing the specified reservation.
     */
    public function edit(BanshirouReservation $reservation): Response
    {
        return Inertia::render('Reservations/Banshirou/Edit', [
            'reservation' => $reservation,
        ]);
    }

    /**
     * Update the specified reservation.
     */
    public function update(Request $request, BanshirouReservation $reservation)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'name_kana' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string',
            'checkin_date' => 'required|date',
            'checkout_date' => 'required|date|after:checkin_date',
            'guest_count_adults' => 'required|integer|min:1',
            'guest_count_children' => 'nullable|integer|min:0',
            'meal_option' => 'required|in:with_meals,seat_only,no_meals',
            'pickup_required' => 'boolean',
            'options' => 'nullable|array',
            'payment_method' => 'required|in:cash,credit,bank_transfer',
            'notes' => 'nullable|string',
            'status' => 'sometimes|in:confirmed,cancelled',
        ]);

        // Normalize phone number
        $validated['phone'] = preg_replace('/[^0-9]/', '', $validated['phone']);
        $validated['guest_count_children'] = $validated['guest_count_children'] ?? 0;
        $validated['pickup_required'] = $validated['pickup_required'] ?? false;

        $reservation->update($validated);

        $this->activityLog->logUpdated('reservation', $reservation, "予約更新: {$reservation->name}様");

        return redirect()
            ->route('reservations.banshirou.show', $reservation)
            ->with('success', '予約を更新しました。');
    }

    /**
     * Remove the specified reservation.
     */
    public function destroy(BanshirouReservation $reservation)
    {
        $name = $reservation->name;
        $reservation->delete();

        $this->activityLog->log('reservation', 'deleted', null, "予約削除: {$name}様");

        return redirect()
            ->route('reservations.banshirou.index')
            ->with('success', '予約を削除しました。');
    }
}
