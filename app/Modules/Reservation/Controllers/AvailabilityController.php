<?php

namespace App\Modules\Reservation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Reservation\Models\BanshirouReservation;
use App\Modules\Reservation\Services\ExternalReservationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AvailabilityController extends Controller
{
    public function __construct(
        protected ExternalReservationService $externalService
    ) {}

    /**
     * Display the availability calendar page
     */
    public function index(Request $request): Response
    {
        $month = $request->input('month', Carbon::now()->format('Y-m'));

        return Inertia::render('Reservations/Availability/Index', [
            'currentMonth' => $month,
        ]);
    }

    /**
     * Get unified availability data for a specific month
     */
    public function getAvailability(Request $request): JsonResponse
    {
        $year = (int) $request->input('year', Carbon::now()->year);
        $month = (int) $request->input('month', Carbon::now()->month);

        // Calculate date range for the month
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        // Initialize availability map
        $availability = [];
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $dateStr = $current->format('Y-m-d');
            $availability[$dateStr] = [
                'status' => 'available',
                'sources' => [],
                'details' => [],
            ];
            $current->addDay();
        }

        // Collect all reservations for the list view
        $reservations = [];

        // 1. Get internal portal reservations (BanshirouReservation)
        $internalReservations = BanshirouReservation::where('status', 'confirmed')
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('checkin_date', [$startDate, $endDate])
                    ->orWhereBetween('checkout_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('checkin_date', '<=', $startDate)
                            ->where('checkout_date', '>=', $endDate);
                    });
            })
            ->orderBy('checkin_date')
            ->get();

        foreach ($internalReservations as $reservation) {
            $checkin = Carbon::parse($reservation->checkin_date);
            $checkout = Carbon::parse($reservation->checkout_date);

            // Add to reservations list
            $reservations[] = [
                'id' => $reservation->id,
                'source' => 'portal',
                'name' => $reservation->name,
                'phone' => $reservation->phone,
                'checkin_date' => $checkin->format('Y-m-d'),
                'checkout_date' => $checkout->format('Y-m-d'),
                'guests' => $reservation->total_guests,
                'meal_option' => $reservation->meal_option,
                'notes' => $reservation->notes,
            ];

            // Mark days as booked
            $current = $checkin->copy();
            while ($current->lt($checkout)) {
                $dateStr = $current->format('Y-m-d');
                if (isset($availability[$dateStr])) {
                    $availability[$dateStr]['status'] = 'booked';
                    $availability[$dateStr]['sources'][] = 'portal';
                    $availability[$dateStr]['details'][] = [
                        'id' => $reservation->id,
                        'source' => 'portal',
                        'name' => $reservation->name,
                        'guests' => $reservation->total_guests,
                        'checkin_date' => $checkin->format('Y-m-d'),
                        'checkout_date' => $checkout->format('Y-m-d'),
                    ];
                }
                $current->addDay();
            }
        }

        // 2. Get form reservations from Google Spreadsheet
        $formReservations = $this->externalService->getFormReservations();
        foreach ($formReservations as $reservation) {
            $checkin = Carbon::parse($reservation['checkin_date']);
            $checkout = $reservation['checkout_date']
                ? Carbon::parse($reservation['checkout_date'])
                : $checkin->copy()->addDay();

            // Check if in range
            if ($checkout->lt($startDate) || $checkin->gt($endDate)) {
                continue;
            }

            // Add to reservations list
            $reservations[] = [
                'id' => null,
                'source' => 'form',
                'name' => $reservation['name'],
                'phone' => null,
                'checkin_date' => $checkin->format('Y-m-d'),
                'checkout_date' => $checkout->format('Y-m-d'),
                'guests' => $reservation['guests'],
                'meal_option' => null,
                'notes' => null,
            ];

            $current = $checkin->copy();
            while ($current->lt($checkout)) {
                $dateStr = $current->format('Y-m-d');
                if (isset($availability[$dateStr])) {
                    $availability[$dateStr]['status'] = 'booked';
                    $availability[$dateStr]['sources'][] = 'form';
                    $availability[$dateStr]['details'][] = [
                        'id' => null,
                        'source' => 'form',
                        'name' => $reservation['name'],
                        'guests' => $reservation['guests'],
                        'checkin_date' => $checkin->format('Y-m-d'),
                        'checkout_date' => $checkout->format('Y-m-d'),
                    ];
                }
                $current->addDay();
            }
        }

        // 3. Get external booking site availability
        $externalAvailability = $this->externalService->getExternalBookingAvailability($year, $month);
        foreach ($externalAvailability as $dateStr => $status) {
            if (isset($availability[$dateStr]) && $status === 'booked') {
                $availability[$dateStr]['status'] = 'booked';
                $availability[$dateStr]['sources'][] = 'external';
                $availability[$dateStr]['details'][] = [
                    'id' => null,
                    'source' => 'external',
                    'name' => '外部サイト予約',
                    'guests' => null,
                    'checkin_date' => $dateStr,
                    'checkout_date' => null,
                ];
            }
        }

        // Deduplicate sources
        foreach ($availability as $dateStr => $data) {
            $availability[$dateStr]['sources'] = array_values(array_unique($data['sources']));
        }

        // Sort reservations by checkin date
        usort($reservations, fn($a, $b) => strcmp($a['checkin_date'], $b['checkin_date']));

        return response()->json([
            'success' => true,
            'year' => $year,
            'month' => $month,
            'data' => $availability,
            'reservations' => $reservations,
        ]);
    }

    /**
     * Force refresh cached external data
     */
    public function refreshCache(): JsonResponse
    {
        $this->externalService->clearCache();

        return response()->json([
            'success' => true,
            'message' => 'キャッシュをクリアしました',
        ]);
    }
}
