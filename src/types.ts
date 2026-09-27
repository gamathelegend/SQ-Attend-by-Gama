export type PunchType =
  | 'clock-in'
  | 'clock-out'
  | 'break-start'
  | 'break-end'
  | 'field-work-start'
  | 'field-work-end'
  | 'half-day'
  | 'auto-clock-out';

export type PunchState = 'Awaiting Morning' | 'Clocked In' | 'On Break' | 'Field Work' | 'Shift Complete';

export type VerificationMethod = 'gps_geofence' | 'face_biometric';

export type LocationMode = 'inside' | 'outside' | 'device';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface FieldWorkSession {
  isActive: boolean;
  startedAt: string; // ISO timestamp
  purpose: string;
  allowedMinutes: number; // 120 minutes (~2 hours)
}

export interface PunchRecord {
  id: string;
  employeeId?: string;
  employeeName?: string;
  type: PunchType;
  timestamp: string;
  timeFormatted: string;
  dateFormatted: string;
  siteId: string;
  siteName: string;
  zone: string;
  accuracy: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  isInsideGeofence?: boolean;
  distanceMeters?: number;
  verificationMethod?: VerificationMethod;
  confidence?: number;
  photoUrl?: string;
  statusTag: 'On Time' | 'Early' | 'Late' | 'Half Day' | 'Overtime' | 'Approved' | 'Holiday Duty';
  hash: string;
  synced: boolean;
  isAutoPunchOut?: boolean;
  autoPunchReason?: string;
  isFieldWork?: boolean;
  fieldWorkPurpose?: string;
  countsAsWorkTime?: boolean;
  isSundayHoliday?: boolean;
  isLateArrival?: boolean;
  lateArrivalMinutes?: number;
  monthlyLateIndex?: number;
  isHalfDayDeduction?: boolean;
  halfDayReason?: string;
}

export interface GeofenceSite {
  id: string;
  code: string;
  name: string;
  zone: string;
  address: string;
  radiusMeters: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  isActive: boolean;
}

export interface UserProfile {
  id?: string;
  role?: 'admin' | 'owner' | 'employee';
  name: string;
  email: string;
  phone: string;
  password?: string;
  title: string;
  employeeId: string;
  department: string;
  shiftWindow: string;
  dailyWorkingHours: number; // e.g. 8.0, 9.0 hours customizable by employee
  monthlySalary: number; // Default: 10,000 (10k), customizable by Admin and Owner
  weeklyTargetHours: number;
  hoursCompletedThisWeek: number;
  monthlyLateArrivalsCount: number; // Allowed: max 3 days per month; 4th+ counts as Half Day
  halfDaysCount: number; // Count of days penalized as Half Day due to >3 late arrivals
  shiftStartTime?: string; // "09:00 AM" (9 at morning)
  shiftEndTime?: string; // "06:00 PM" (6 at evening)
  lateThresholdTime?: string; // "09:30 AM" (cutoff for late arrival)
  maxAllowedLateDaysPerMonth?: number; // 3 days acceptable
  avatarUrl: string;
  biometricEnrolledDate: string;
  biometricConfidence: number;
  biometricHash: string;
  biometricOptional: boolean;
  biometricEnabled: boolean;
  isGeofenceEnforced: boolean;
}

export interface ShiftAlarmState {
  isOpen: boolean;
  isBeeping: boolean;
  isMuted: boolean;
  isOvertimePhase: boolean;
  targetWorkingHours: number;
  completedMinutes: number;
  overtimeMinutesAllocated: number;
}


export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  type: 'geofence' | 'shift' | 'system' | 'approval';
  read: boolean;
}
