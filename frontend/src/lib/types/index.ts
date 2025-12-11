// User and Authentication Types
export interface UserModel {
  userId: number;
  guardName: string;
  email: string;
  password?: string;
  uid: string;
  permissions: string[];
  updatedAt: number;
  actions: string[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthState {
  user: UserModel | null;
  token: string | null;
  isAuthenticated: boolean;
  serverStatus: boolean;
}

// Patrol Record Types
export interface PatrolRecord {
  id: string;
  point: string;
  guardname: string;
  time: number; // Unix timestamp (seconds)
  servertime: number;
  imageid: string;
  note: string;
}

export interface CreatePatrolRecordRequest {
  id: string;
  point: string;
  guardname: string;
  time: string;
  servertime: string;
  imageid: string;
  note: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  records: T[];
  total: number;
  total_pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Filter Types
export interface FilterOptions {
  point?: string;
  guardName?: string;
  startDate?: Date;
  endDate?: Date;
  hasNotes?: boolean;
}

// Scanner Types
export type ScannerStatus = 'initial' | 'loading' | 'success' | 'error' | 'noInternet';

export interface ScanResult {
  success: boolean;
  serverSuccess: boolean;
  message: string;
  turnOffCamera: boolean;
  skipFeedback: boolean;
  point?: string;
  locationName?: string;
}

export interface PatrolPoint {
  id: string;
  number: number;
  isScanned: boolean;
}

// Report Types
export interface ReportSummary {
  totalScans: number;
  uniquePoints: number;
  uniqueGuards: number;
}

export interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface PatrolPointStats {
  point: string;
  totalScans: number;
  uniqueGuards: number;
  lastScanTime: number;
  guards: string[];
}

// Feedback Types
export interface FeedbackConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  sound?: boolean;
}

// Server Status Types
export interface ServerStatusState {
  isServerOnline: boolean;
  lastChecked: Date | null;
}

