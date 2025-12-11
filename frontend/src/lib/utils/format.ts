import { format, isValid } from 'date-fns';

function parseDate(date: Date | number | string | null | undefined): Date | null {
  // Handle null, undefined, empty string, or NaN
  if (date === null || date === undefined || date === '') {
    return null;
  }
  
  // Handle NaN explicitly
  if (typeof date === 'number' && isNaN(date)) {
    return null;
  }
  
  let dateObj: Date;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'number') {
    // Check if it's in seconds (Unix timestamp) or milliseconds
    // Unix timestamps are typically 10 digits (seconds) or 13 digits (milliseconds)
    // Also handle 0 as a valid timestamp (epoch)
    const timestamp = date === 0 ? 0 : (date.toString().length <= 10 ? date * 1000 : date);
    dateObj = new Date(timestamp);
  } else if (typeof date === 'string') {
    // Try parsing as number first
    const num = Number(date);
    if (!isNaN(num) && date.trim() !== '') {
      const timestamp = num === 0 ? 0 : (num.toString().length <= 10 ? num * 1000 : num);
      dateObj = new Date(timestamp);
    } else {
      // Try parsing as ISO string or other date format
      dateObj = new Date(date);
    }
  } else {
    return null;
  }
  
  return isValid(dateObj) ? dateObj : null;
}

export function formatDate(date: Date | number | string | null | undefined): string {
  const dateObj = parseDate(date);
  if (!dateObj) return 'Invalid Date';
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatDateTime(date: Date | number | string | null | undefined): string {
  const dateObj = parseDate(date);
  if (!dateObj) return 'Invalid Date';
  return format(dateObj, 'MMM dd, yyyy HH:mm:ss');
}

export function formatTime(date: Date | number | string | null | undefined): string {
  const dateObj = parseDate(date);
  if (!dateObj) return 'Invalid Time';
  return format(dateObj, 'HH:mm:ss');
}

export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

export function generateId(): string {
  // Generate a proper UUID v4
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateImageId(): string {
  return `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function normalizePointCode(code: string): string {
  // Remove leading zeros from numeric codes
  if (isNumeric(code)) {
    return parseInt(code, 10).toString();
  }
  return code;
}

