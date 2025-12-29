<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\Storage;

class QrCodeService
{
    /**
     * Generate a QR code for a guest page.
     */
    public function generate(string $uuid): string
    {
        $url = route('guest.page', ['uuid' => $uuid]);
        $filename = "qrcodes/{$uuid}.png";

        $qrCode = QrCode::format('png')
            ->size(300)
            ->margin(2)
            ->generate($url);

        Storage::disk('public')->put($filename, $qrCode);

        return $filename;
    }

    /**
     * Regenerate a QR code.
     */
    public function regenerate(string $uuid): string
    {
        $this->delete($uuid);
        return $this->generate($uuid);
    }

    /**
     * Delete a QR code.
     */
    public function delete(string $uuid): bool
    {
        $filename = "qrcodes/{$uuid}.png";
        return Storage::disk('public')->delete($filename);
    }

    /**
     * Get the URL of a QR code.
     */
    public function getUrl(string $uuid): ?string
    {
        $filename = "qrcodes/{$uuid}.png";

        if (Storage::disk('public')->exists($filename)) {
            return Storage::disk('public')->url($filename);
        }

        return null;
    }

    /**
     * Check if a QR code exists.
     */
    public function exists(string $uuid): bool
    {
        $filename = "qrcodes/{$uuid}.png";
        return Storage::disk('public')->exists($filename);
    }
}
