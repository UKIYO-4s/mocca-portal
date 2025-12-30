<?php

namespace App\Modules\Reservation\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class ExternalReservationService
{
    // Google Apps Script API (external booking sites like 楽天, じゃらん)
    private const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzqDFmCwVBeGDdi8YufAvWTpW4xS41JriE-JXxg0jUmi31dsIuOw9pcmoq-Jn0gg7RI/exec';

    // Google Spreadsheet ID for form reservations
    private const SPREADSHEET_ID = '1ng_34VIV6r6RoeYSTAMteZQtgf7pIMb2irw-p3DexWY';

    // Cache TTL in seconds (5 minutes for real-time feel)
    private const CACHE_TTL = 300;

    /**
     * Get availability from external booking sites via Google Apps Script API
     *
     * @param int $year
     * @param int $month
     * @return array<string, string> Date => status ('available'|'booked')
     */
    public function getExternalBookingAvailability(int $year, int $month): array
    {
        $cacheKey = "external_availability_{$year}_{$month}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($year, $month) {
            try {
                $response = Http::timeout(10)->get(self::GAS_API_URL, [
                    'year' => $year,
                    'month' => $month,
                ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (isset($data['success']) && $data['success'] && isset($data['data'])) {
                        return $data['data'];
                    }
                }

                Log::warning('Failed to fetch external booking availability', [
                    'year' => $year,
                    'month' => $month,
                    'response' => $response->body(),
                ]);

                return [];
            } catch (\Exception $e) {
                Log::error('Error fetching external booking availability', [
                    'error' => $e->getMessage(),
                    'year' => $year,
                    'month' => $month,
                ]);

                return [];
            }
        });
    }

    /**
     * Get approved reservations from Google Forms spreadsheet
     *
     * @return array<int, array{date: string, name: string, guests: int, status: string}>
     */
    public function getFormReservations(): array
    {
        $cacheKey = 'form_reservations';

        return Cache::remember($cacheKey, self::CACHE_TTL, function () {
            try {
                // Fetch as CSV from public spreadsheet
                // Format: https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={SHEET_ID}
                $csvUrl = 'https://docs.google.com/spreadsheets/d/' . self::SPREADSHEET_ID . '/export?format=csv&gid=477553713';

                $response = Http::timeout(15)->get($csvUrl);

                if (!$response->successful()) {
                    Log::warning('Failed to fetch form reservations spreadsheet', [
                        'status' => $response->status(),
                    ]);
                    return [];
                }

                return $this->parseSpreadsheetCsv($response->body());
            } catch (\Exception $e) {
                Log::error('Error fetching form reservations', [
                    'error' => $e->getMessage(),
                ]);

                return [];
            }
        });
    }

    /**
     * Parse CSV data from Google Spreadsheet
     *
     * @param string $csvContent
     * @return array
     */
    private function parseSpreadsheetCsv(string $csvContent): array
    {
        $reservations = [];
        $lines = explode("\n", $csvContent);

        if (count($lines) < 2) {
            return [];
        }

        // Parse header to find column indices
        $header = str_getcsv($lines[0]);
        $columnMap = $this->findColumnIndices($header);

        if (!$columnMap) {
            Log::warning('Could not find required columns in spreadsheet', [
                'header' => $header,
            ]);
            return [];
        }

        // Parse data rows
        for ($i = 1; $i < count($lines); $i++) {
            $line = trim($lines[$i]);
            if (empty($line)) {
                continue;
            }

            $row = str_getcsv($line);

            // Get status - only include approved reservations
            $status = $row[$columnMap['status']] ?? '';
            if (mb_strpos($status, '承認') === false) {
                continue;
            }

            // Parse check-in date
            $checkinDate = $this->parseJapaneseDate($row[$columnMap['checkin']] ?? '');
            if (!$checkinDate) {
                continue;
            }

            // Parse check-out date if available
            $checkoutDate = null;
            if (isset($columnMap['checkout']) && !empty($row[$columnMap['checkout']])) {
                $checkoutDate = $this->parseJapaneseDate($row[$columnMap['checkout']]);
            }

            $reservations[] = [
                'checkin_date' => $checkinDate,
                'checkout_date' => $checkoutDate,
                'name' => $row[$columnMap['name']] ?? '',
                'guests' => (int) ($row[$columnMap['guests']] ?? 1),
                'source' => 'google_form',
            ];
        }

        return $reservations;
    }

    /**
     * Find column indices based on header names
     *
     * @param array $header
     * @return array|null
     */
    private function findColumnIndices(array $header): ?array
    {
        $columnMap = [];

        foreach ($header as $index => $name) {
            $name = trim($name);

            // Status column (ステータス)
            if (mb_strpos($name, 'ステータス') !== false || mb_strpos($name, '承認') !== false) {
                $columnMap['status'] = $index;
            }
            // Check-in date (チェックイン, 宿泊日, 日付)
            elseif (mb_strpos($name, 'チェックイン') !== false || mb_strpos($name, '宿泊日') !== false || $name === '日付') {
                $columnMap['checkin'] = $index;
            }
            // Check-out date (チェックアウト)
            elseif (mb_strpos($name, 'チェックアウト') !== false) {
                $columnMap['checkout'] = $index;
            }
            // Guest name (お名前, 氏名, 名前)
            elseif (mb_strpos($name, '名前') !== false || mb_strpos($name, '氏名') !== false) {
                $columnMap['name'] = $index;
            }
            // Guest count (人数)
            elseif (mb_strpos($name, '人数') !== false) {
                $columnMap['guests'] = $index;
            }
        }

        // Require at least status and checkin
        if (!isset($columnMap['status']) || !isset($columnMap['checkin'])) {
            return null;
        }

        // Set defaults
        $columnMap['name'] = $columnMap['name'] ?? 0;
        $columnMap['guests'] = $columnMap['guests'] ?? 0;

        return $columnMap;
    }

    /**
     * Parse Japanese date format to Y-m-d
     *
     * @param string $dateStr
     * @return string|null
     */
    private function parseJapaneseDate(string $dateStr): ?string
    {
        $dateStr = trim($dateStr);

        if (empty($dateStr)) {
            return null;
        }

        // Try standard formats first
        foreach (['Y-m-d', 'Y/m/d', 'Y年m月d日'] as $format) {
            try {
                $date = Carbon::createFromFormat($format, $dateStr);
                if ($date) {
                    return $date->format('Y-m-d');
                }
            } catch (\Exception $e) {
                // Continue to next format
            }
        }

        // Try parsing with regex for Japanese format (2024年12月30日)
        if (preg_match('/(\d{4})年(\d{1,2})月(\d{1,2})日/', $dateStr, $matches)) {
            return sprintf('%04d-%02d-%02d', $matches[1], $matches[2], $matches[3]);
        }

        // Try parsing generic date
        try {
            return Carbon::parse($dateStr)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get all dates that are booked from form reservations
     *
     * @return array<string> Array of Y-m-d dates
     */
    public function getFormReservationDates(): array
    {
        $reservations = $this->getFormReservations();
        $bookedDates = [];

        foreach ($reservations as $reservation) {
            $checkin = Carbon::parse($reservation['checkin_date']);
            $checkout = $reservation['checkout_date']
                ? Carbon::parse($reservation['checkout_date'])
                : $checkin;

            // Add all dates between checkin and checkout (exclusive of checkout day)
            $current = $checkin->copy();
            while ($current->lt($checkout)) {
                $bookedDates[] = $current->format('Y-m-d');
                $current->addDay();
            }
        }

        return array_unique($bookedDates);
    }

    /**
     * Clear cached data
     */
    public function clearCache(): void
    {
        Cache::forget('form_reservations');

        // Clear availability cache for recent months
        $now = Carbon::now();
        for ($i = -1; $i <= 3; $i++) {
            $date = $now->copy()->addMonths($i);
            Cache::forget("external_availability_{$date->year}_{$date->month}");
        }
    }
}
