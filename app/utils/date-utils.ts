import { format, parseISO } from 'date-fns';

/**
 * Format date as "dd MMM" (e.g., "16 Apr")
 */
export function formatDateShort(date: Date | string | null | undefined): string {
    if (!date) return '';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'dd MMM');
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

/**
 * Format date as "dd MMM yyyy" (e.g., "16 Apr 2024")
 */
export function formatDateFull(date: Date | string | null | undefined): string {
    if (!date) return '';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'dd MMM yyyy');
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
    if (!date) return '';
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
        console.error('Error formatting date for input:', error);
        return '';
    }
}

/**
 * Parse flexible date input (handles various formats)
 */
export function parseFlexibleDate(input: string): Date | null {
    if (!input || input.trim() === '') return null;
    try {
        // Try parsing ISO format first
        return parseISO(input);
    } catch (error) {
        console.error('Error parsing date:', error);
        return null;
    }
}
