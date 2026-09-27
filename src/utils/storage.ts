import { FieldWorkSession, GeofenceSite, LocationMode, PunchRecord, PunchState, UserProfile } from '../types';
import { initialPunches, initialSites, sampleEmployees } from './mockData';

const STORAGE_PUNCHES_KEY = 'sq_attend_punches_v1';
const STORAGE_QUEUE_KEY = 'sq_attend_pending_sync_queue_v1';
const STORAGE_OFFLINE_SIMULATION_KEY = 'sq_attend_simulate_offline_v1';
const STORAGE_LAST_SYNC_KEY = 'sq_attend_last_sync_timestamp_v1';
const STORAGE_FIRM_SITES_KEY = 'sq_attend_firm_sites_v2';
const STORAGE_LOCATION_MODE_KEY = 'sq_attend_location_mode_v1';
const STORAGE_THEME_KEY = 'sq_attend_theme_mode_v1';
const STORAGE_OUTSIDE_SINCE_KEY = 'sq_attend_outside_since_v2';
const STORAGE_FIELD_WORK_KEY = 'sq_attend_field_work_session_v2';
const STORAGE_PUNCH_STATE_KEY = 'sq_attend_punch_state_v2';
const STORAGE_USERS_KEY = 'sq_attend_users_v1';
const STORAGE_ACTIVE_USER_KEY = 'sq_attend_active_user_v1';
const STORAGE_SHIFT_START_KEY = 'sq_attend_shift_start_v1';
const STORAGE_OVERTIME_MINUTES_KEY = 'sq_attend_overtime_minutes_v1';

/**
 * Get all registered users from storage
 */
export function getStoredUsers(): UserProfile[] {
  const users = safeGetJSON<UserProfile[] | null>(STORAGE_USERS_KEY, null);
  if (users && Array.isArray(users) && users.length > 0) {
    // Ensure all 5 admins and initial employees exist
    const existingIds = new Set(users.map(u => u.employeeId || u.id));
    const merged = [...users];
    sampleEmployees.forEach(se => {
      if (!existingIds.has(se.employeeId) && !existingIds.has(se.id)) {
        merged.push(se);
      }
    });

    // Ensure all employees have 10k monthlySalary default, locked 9-6 shift, and late arrivals tracking
    const normalized = merged.map(u => ({
      ...u,
      dailyWorkingHours: u.dailyWorkingHours || 9.0,
      monthlySalary: typeof u.monthlySalary === 'number' && u.monthlySalary > 0 ? u.monthlySalary : 10000,
      monthlyLateArrivalsCount: typeof u.monthlyLateArrivalsCount === 'number' ? u.monthlyLateArrivalsCount : 0,
      halfDaysCount: typeof u.halfDaysCount === 'number' ? u.halfDaysCount : 0,
      shiftWindow: u.shiftWindow && u.shiftWindow.includes('Locked Shift')
        ? u.shiftWindow
        : 'Locked Shift: 09:00 AM – 06:00 PM (Late Cutoff: 09:30 AM)',
      shiftStartTime: u.shiftStartTime || '09:00 AM',
      shiftEndTime: u.shiftEndTime || '06:00 PM',
      lateThresholdTime: u.lateThresholdTime || '09:30 AM',
      maxAllowedLateDaysPerMonth: u.maxAllowedLateDaysPerMonth || 3,
    }));
    return normalized;
  }
  safeSetJSON(STORAGE_USERS_KEY, sampleEmployees);
  return sampleEmployees;
}

/**
 * Save users list to storage
 */
export function saveStoredUsers(users: UserProfile[]): void {
  safeSetJSON(STORAGE_USERS_KEY, users);
}

/**
 * Increment employee late arrival count for the current month.
 * If employee exceeds 3 acceptable days (i.e. newLateCount > 3), it applies a Half Day penalty!
 */
export function incrementEmployeeLateCount(employeeId: string): {
  updatedUsers: UserProfile[];
  newLateCount: number;
  isPenaltyHalfDay: boolean;
  updatedProfile: UserProfile | null;
} {
  const users = getStoredUsers();
  let newLateCount = 1;
  let isPenaltyHalfDay = false;
  let updatedProfile: UserProfile | null = null;

  const updatedUsers = users.map(u => {
    if (u.employeeId === employeeId || u.id === employeeId) {
      const currentCount = u.monthlyLateArrivalsCount || 0;
      newLateCount = currentCount + 1;
      isPenaltyHalfDay = newLateCount > 3; // >3 days acceptable: 4th+ day is Half Day
      const newHalfDays = isPenaltyHalfDay ? (u.halfDaysCount || 0) + 1 : (u.halfDaysCount || 0);

      const modified: UserProfile = {
        ...u,
        monthlyLateArrivalsCount: newLateCount,
        halfDaysCount: newHalfDays,
      };
      updatedProfile = modified;
      return modified;
    }
    return u;
  });

  saveStoredUsers(updatedUsers);

  const active = getActiveUser();
  if (active && (active.employeeId === employeeId || active.id === employeeId) && updatedProfile) {
    saveActiveUser(updatedProfile);
  }

  return {
    updatedUsers,
    newLateCount,
    isPenaltyHalfDay,
    updatedProfile,
  };
}

/**
 * Update an employee's salary and persist to storage
 */
export function updateStoredEmployeeSalary(employeeId: string, newSalary: number): UserProfile[] {
  const users = getStoredUsers();
  const updatedUsers = users.map(u => {
    if (u.employeeId === employeeId || u.id === employeeId) {
      return { ...u, monthlySalary: newSalary };
    }
    return u;
  });
  saveStoredUsers(updatedUsers);

  // If the active user matches, sync active user
  const active = getActiveUser();
  if (active && (active.employeeId === employeeId || active.id === employeeId)) {
    saveActiveUser({ ...active, monthlySalary: newSalary });
  }

  return updatedUsers;
}

/**
 * Get currently logged in employee (or null if on login page)
 */
export function getActiveUser(): UserProfile | null {
  const user = safeGetJSON<UserProfile | null>(STORAGE_ACTIVE_USER_KEY, null);
  return user;
}

/**
 * Save currently logged in employee (or null on logout)
 */
export function saveActiveUser(user: UserProfile | null): void {
  if (user === null) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_ACTIVE_USER_KEY);
    }
  } else {
    safeSetJSON(STORAGE_ACTIVE_USER_KEY, user);
  }
}

/**
 * Get shift start timestamp (epoch ms)
 */
export function getShiftStartTimestamp(): number {
  if (typeof window === 'undefined' || !window.localStorage) return Date.now() - 3.5 * 3600 * 1000;
  const val = window.localStorage.getItem(STORAGE_SHIFT_START_KEY);
  if (!val) {
    // Default: clocked in ~3.5 hours ago for rich realistic interaction
    const defaultTime = Date.now() - 3.5 * 3600 * 1000;
    window.localStorage.setItem(STORAGE_SHIFT_START_KEY, String(defaultTime));
    return defaultTime;
  }
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? Date.now() : parsed;
}

export function saveShiftStartTimestamp(epochMs: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_SHIFT_START_KEY, String(epochMs));
}

/**
 * Get added overtime minutes for today
 */
export function getStoredOvertimeMinutes(): number {
  if (typeof window === 'undefined' || !window.localStorage) return 0;
  const val = window.localStorage.getItem(STORAGE_OVERTIME_MINUTES_KEY);
  return val ? parseInt(val, 10) || 0 : 0;
}

export function saveStoredOvertimeMinutes(mins: number): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_OVERTIME_MINUTES_KEY, String(mins));
}


/**
 * Get outside-of-firm tracking start timestamp (epoch ms)
 */
export function getStoredOutsideSince(): number | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const val = window.localStorage.getItem(STORAGE_OUTSIDE_SINCE_KEY);
  if (!val) return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
}

/**
 * Save outside-of-firm tracking start timestamp
 */
export function saveStoredOutsideSince(val: number | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (val === null) {
    window.localStorage.removeItem(STORAGE_OUTSIDE_SINCE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_OUTSIDE_SINCE_KEY, String(val));
  }
}

/**
 * Get active field work session (out for firm work)
 */
export function getStoredFieldWorkSession(): FieldWorkSession | null {
  return safeGetJSON<FieldWorkSession | null>(STORAGE_FIELD_WORK_KEY, null);
}

/**
 * Save active field work session
 */
export function saveStoredFieldWorkSession(session: FieldWorkSession | null): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (session === null) {
    window.localStorage.removeItem(STORAGE_FIELD_WORK_KEY);
  } else {
    safeSetJSON(STORAGE_FIELD_WORK_KEY, session);
  }
}

/**
 * Get stored punch state
 */
export function getStoredPunchState(): PunchState {
  if (typeof window === 'undefined' || !window.localStorage) return 'Clocked In';
  const val = window.localStorage.getItem(STORAGE_PUNCH_STATE_KEY);
  if (
    val === 'Awaiting Morning' ||
    val === 'Clocked In' ||
    val === 'On Break' ||
    val === 'Field Work' ||
    val === 'Shift Complete'
  ) {
    return val;
  }
  return 'Clocked In';
}

/**
 * Save stored punch state
 */
export function saveStoredPunchState(state: PunchState): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_PUNCH_STATE_KEY, state);
}

/**
 * Get configured theme mode from localStorage ('light' | 'dark' | 'system')
 */
export function getStoredTheme(): 'light' | 'dark' | 'system' {
  if (typeof window === 'undefined' || !window.localStorage) return 'light';
  const val = window.localStorage.getItem(STORAGE_THEME_KEY);
  if (val === 'dark' || val === 'light' || val === 'system') return val;
  return 'light';
}

/**
 * Save theme mode to localStorage
 */
export function saveStoredTheme(theme: 'light' | 'dark' | 'system'): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_THEME_KEY, theme);
}

/**
 * Calculate distance in meters between two GPS coordinates using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Get configured firm sites from localStorage, fallback to initialSites
 */
export function getStoredFirmSites(): GeofenceSite[] {
  const stored = safeGetJSON<GeofenceSite[] | null>(STORAGE_FIRM_SITES_KEY, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    const normalized = stored.map(s => ({
      ...s,
      radiusMeters: 50, // 50m firm radius
    }));
    return normalized;
  }
  safeSetJSON(STORAGE_FIRM_SITES_KEY, initialSites);
  return initialSites;
}

/**
 * Save updated firm sites to localStorage
 */
export function saveStoredFirmSites(sites: GeofenceSite[]): void {
  safeSetJSON(STORAGE_FIRM_SITES_KEY, sites);
}

/**
 * Get location simulation mode ('inside' | 'outside' | 'device')
 */
export function getStoredLocationMode(): LocationMode {
  if (typeof window === 'undefined' || !window.localStorage) return 'inside';
  const mode = window.localStorage.getItem(STORAGE_LOCATION_MODE_KEY);
  if (mode === 'outside' || mode === 'device' || mode === 'inside') {
    return mode;
  }
  return 'inside';
}

/**
 * Set location simulation mode
 */
export function saveStoredLocationMode(mode: LocationMode): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_LOCATION_MODE_KEY, mode);
}

/**
 * Safely parse JSON from localStorage with fallback
 */
function safeGetJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key} from localStorage`, err);
    return fallback;
  }
}

/**
 * Safely set JSON in localStorage
 */
function safeSetJSON<T>(key: string, value: T): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed to write ${key} to localStorage`, err);
    return false;
  }
}

/**
 * Load all stored punches from localStorage. Falls back to initial data.
 */
export function getStoredPunches(): PunchRecord[] {
  const stored = safeGetJSON<PunchRecord[] | null>(STORAGE_PUNCHES_KEY, null);
  if (stored && Array.isArray(stored) && stored.length > 0) {
    return stored;
  }
  // Initialize with seed data
  safeSetJSON(STORAGE_PUNCHES_KEY, initialPunches);
  return initialPunches;
}

/**
 * Persist punch records list to localStorage
 */
export function saveStoredPunches(punches: PunchRecord[]): void {
  safeSetJSON(STORAGE_PUNCHES_KEY, punches);
}

/**
 * Retrieve current pending sync queue (punches cached while offline)
 */
export function getPendingSyncQueue(): PunchRecord[] {
  const queue = safeGetJSON<PunchRecord[]>(STORAGE_QUEUE_KEY, []);
  return Array.isArray(queue) ? queue : [];
}

/**
 * Add an offline punch record to the pending sync queue in localStorage
 */
export function enqueuePendingPunch(punch: PunchRecord): PunchRecord[] {
  const currentQueue = getPendingSyncQueue();
  // Ensure record is marked as unsynced
  const offlinePunch: PunchRecord = {
    ...punch,
    synced: false,
  };

  const updatedQueue = [offlinePunch, ...currentQueue.filter(p => p.id !== punch.id)];
  safeSetJSON(STORAGE_QUEUE_KEY, updatedQueue);
  return updatedQueue;
}

/**
 * Remove an item from the pending sync queue
 */
export function dequeuePendingPunch(punchId: string): PunchRecord[] {
  const currentQueue = getPendingSyncQueue();
  const updatedQueue = currentQueue.filter(p => p.id !== punchId);
  safeSetJSON(STORAGE_QUEUE_KEY, updatedQueue);
  return updatedQueue;
}

/**
 * Clear the entire pending sync queue
 */
export function clearPendingSyncQueue(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_QUEUE_KEY);
  }
}

/**
 * Get simulated offline state (for easy testing without disabling Wi-Fi)
 */
export function getSimulatedOffline(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem(STORAGE_OFFLINE_SIMULATION_KEY) === 'true';
}

/**
 * Set simulated offline state
 */
export function setSimulatedOffline(isOffline: boolean): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_OFFLINE_SIMULATION_KEY, isOffline ? 'true' : 'false');
}

/**
 * Get last sync timestamp string
 */
export function getLastSyncTime(): string {
  if (typeof window === 'undefined' || !window.localStorage) return 'All logs up to date';
  return window.localStorage.getItem(STORAGE_LAST_SYNC_KEY) || 'All logs synced';
}

/**
 * Set last sync timestamp string
 */
export function setLastSyncTime(timeStr: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_LAST_SYNC_KEY, timeStr);
}

/**
 * Synchronize all pending punches from the local queue to cloud/storage.
 * Simulates server network handshake and marks records as synced.
 */
export async function syncPendingQueue(
  currentPunches: PunchRecord[]
): Promise<{ syncedPunches: PunchRecord[]; count: number }> {
  const queue = getPendingSyncQueue();
  if (queue.length === 0) {
    return { syncedPunches: currentPunches, count: 0 };
  }

  // Artificial short network delay to give user visual feedback of the handshake
  await new Promise(resolve => setTimeout(resolve, 600));

  const queueIds = new Set(queue.map(q => q.id));

  // Mark matching punches as synced: true
  const updatedPunches = currentPunches.map(p => {
    if (queueIds.has(p.id) || !p.synced) {
      return {
        ...p,
        synced: true,
      };
    }
    return p;
  });

  // Save updated punches to localStorage
  saveStoredPunches(updatedPunches);

  // Clear pending queue
  clearPendingSyncQueue();

  const now = new Date();
  const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  setLastSyncTime(`Synchronized at ${timeFormatted} (${queue.length} uploaded)`);

  return {
    syncedPunches: updatedPunches,
    count: queue.length,
  };
}
