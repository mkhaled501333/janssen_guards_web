export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Janssen Guard';
export const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Janssen';

export const TOTAL_PATROL_POINTS = 12;

export const SCAN_DEBOUNCE_TIME = 5000; // 5 seconds

export const SERVER_CHECK_INTERVAL = 30000; // 30 seconds

export const PAGINATION_LIMIT = 20;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SCANNED_POINTS: 'scanned_points',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  SCAN: '/scan',
  LOGS: '/logs',
  REPORTS: '/reports',
  PATROL_REPORT: '/patrol-report',
} as const;

export const SOUND_FILES = {
  SUCCESS: '/sounds/success.mp3',
  ERROR: '/sounds/error.mp3',
} as const;

