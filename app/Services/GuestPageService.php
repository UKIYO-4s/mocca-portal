<?php

namespace App\Services;

use App\Models\GuestPage;
use App\Models\GuestStaffAssignment;
use App\Modules\Reservation\Models\BanshirouReservation;
use Illuminate\Support\Str;

class GuestPageService
{
    public function __construct(
        protected QrCodeService $qrCodeService
    ) {}

    /**
     * Create a guest page for a Banshirou reservation.
     */
    public function createForBanshirou(BanshirouReservation $reservation, int $expirationDays = 30): GuestPage
    {
        $uuid = Str::uuid()->toString();

        $guestPage = GuestPage::create([
            'uuid' => $uuid,
            'reservation_id' => $reservation->id,
            'reservation_type' => 'banshirou',
            'guest_name' => $reservation->name,
            'room_number' => null,
            'check_in_date' => $reservation->checkin_date,
            'check_out_date' => $reservation->checkout_date,
            'is_active' => true,
            'expires_at' => $reservation->checkout_date->addDays($expirationDays),
        ]);

        // Generate QR code
        $qrCodePath = $this->qrCodeService->generate($uuid);
        $guestPage->update(['qr_code_path' => $qrCodePath]);

        return $guestPage;
    }

    /**
     * Create a guest page manually.
     */
    public function create(array $data): GuestPage
    {
        $uuid = Str::uuid()->toString();

        $guestPage = GuestPage::create([
            'uuid' => $uuid,
            'guest_name' => $data['guest_name'],
            'room_number' => $data['room_number'] ?? null,
            'check_in_date' => $data['check_in_date'],
            'check_out_date' => $data['check_out_date'],
            'reservation_id' => $data['reservation_id'] ?? null,
            'reservation_type' => $data['reservation_type'] ?? null,
            'is_active' => true,
            'expires_at' => isset($data['expires_at'])
                ? $data['expires_at']
                : \Carbon\Carbon::parse($data['check_out_date'])->addDays(30),
        ]);

        // Generate QR code
        $qrCodePath = $this->qrCodeService->generate($uuid);
        $guestPage->update(['qr_code_path' => $qrCodePath]);

        return $guestPage;
    }

    /**
     * Assign staff to a guest page.
     */
    public function assignStaff(GuestPage $guestPage, int $staffId, string $role): GuestStaffAssignment
    {
        return GuestStaffAssignment::updateOrCreate(
            [
                'guest_page_id' => $guestPage->id,
                'staff_id' => $staffId,
            ],
            [
                'role' => $role,
                'assigned_at' => now(),
            ]
        );
    }

    /**
     * Remove staff from a guest page.
     */
    public function removeStaff(GuestPage $guestPage, int $staffId): bool
    {
        return GuestStaffAssignment::where('guest_page_id', $guestPage->id)
            ->where('staff_id', $staffId)
            ->delete() > 0;
    }

    /**
     * Deactivate a guest page.
     */
    public function deactivate(GuestPage $guestPage): bool
    {
        return $guestPage->update(['is_active' => false]);
    }

    /**
     * Reactivate a guest page.
     */
    public function reactivate(GuestPage $guestPage, ?int $additionalDays = null): bool
    {
        $data = ['is_active' => true];

        if ($additionalDays !== null) {
            $data['expires_at'] = now()->addDays($additionalDays);
        }

        return $guestPage->update($data);
    }

    /**
     * Regenerate QR code for a guest page.
     */
    public function regenerateQrCode(GuestPage $guestPage): string
    {
        $qrCodePath = $this->qrCodeService->regenerate($guestPage->uuid);
        $guestPage->update(['qr_code_path' => $qrCodePath]);

        return $qrCodePath;
    }

    /**
     * Delete a guest page and its QR code.
     */
    public function delete(GuestPage $guestPage): bool
    {
        $this->qrCodeService->delete($guestPage->uuid);
        return $guestPage->delete();
    }

    /**
     * Get all active guest pages.
     */
    public function getActivePages()
    {
        return GuestPage::active()
            ->with(['staffAssignments.staff'])
            ->orderBy('check_in_date', 'desc')
            ->get();
    }

    /**
     * Cleanup expired guest pages.
     */
    public function cleanupExpired(): int
    {
        $expiredPages = GuestPage::expired()->get();
        $count = 0;

        foreach ($expiredPages as $page) {
            $this->qrCodeService->delete($page->uuid);
            $page->delete();
            $count++;
        }

        return $count;
    }
}
