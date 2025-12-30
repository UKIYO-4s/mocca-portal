/**
 * Date utility functions for consistent date formatting across the application.
 */

/**
 * Format a date string to YYYY-MM-DD format.
 * Handles ISO 8601 strings (2026-01-01T00:00:00.000000Z) and other date formats.
 * Returns empty string for null/undefined/empty input.
 *
 * @param dateString - The date string to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateYmd(dateString: string | null | undefined): string {
    if (!dateString) {
        return '';
    }

    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Parse the date string and extract YYYY-MM-DD
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        // If parsing fails, try to extract YYYY-MM-DD from the string
        const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : dateString;
    }

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
