import { useEffect, useMemo, useState } from 'react';
import { FieldWorkSession, GeofenceSite, LocationMode, NotificationItem, PunchRecord, ThemeMode, UserProfile } from './types';
import { initialNotifications, initialProfile, initialSites } from './utils/mockData';
import {
  calculateDistanceMeters,
  enqueuePendingPunch,
  getActiveUser,
  getLastSyncTime,
  getPendingSyncQueue,
  getShiftStartTimestamp,
  getSimulatedOffline,
  getStoredFieldWorkSession,
  getStoredFirmSites,
  getStoredLocationMode,
  getStoredOutsideSince,
  getStoredOvertimeMinutes,
  getStoredPunches,
  getStoredPunchState,
  getStoredTheme,
  getStoredUsers,
  saveActiveUser,
  saveShiftStartTimestamp,
  saveStoredFieldWorkSession,
  saveStoredFirmSites,
  saveStoredLocationMode,
  saveStoredOutsideSince,
  saveStoredOvertimeMinutes,
  saveStoredPunches,
  saveStoredPunchState,
  saveStoredTheme,
  setSimulatedOffline,
  syncPendingQueue,
  updateStoredEmployeeSalary,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { PunchScreen } from './components/PunchScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AdminScreen } from './components/AdminScreen';
import { PunchSuccessModal } from './components/PunchSuccessModal';
import { PunchDetailModal } from './components/PunchDetailModal';
import { GeofenceMapModal } from './components/GeofenceMapModal';
import { ShiftDetailModal } from './components/ShiftDetailModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ExportModal } from './components/ExportModal';
import { ReEnrollModal } from './components/ReEnrollModal';
import { LocationDeniedModal } from './components/LocationDeniedModal';
import { FieldWorkModal } from './components/FieldWorkModal';
import { ShiftEndAlarmModal } from './components/ShiftEndAlarmModal';
import { AuthModal } from './components/AuthModal';
import { WorkingHoursModal } from './components/WorkingHoursModal';
import { SalaryCustomizationModal } from './components/SalaryCustomizationModal';
import { EmployeeDataDetailModal } from './components/EmployeeDataDetailModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'punch' | 'history' | 'admin' | 'profile'>('punch');
  const [allEmployees, setAllEmployees] = useState<UserProfile[]>(() => getStoredUsers());
  const [profile, setProfile] = useState<UserProfile>(() => getActiveUser() || initialProfile);
  const [sites, setSites] = useState<GeofenceSite[]>(() => getStoredFirmSites());
  const [activeSite, setActiveSite] = useState<GeofenceSite>(() => {
    const stored = getStoredFirmSites();
    return stored.find(s => s.isActive) || stored[0] || initialSites[0];
  });
  const [locationMode, setLocationMode] = useState<LocationMode>(() => getStoredLocationMode());
  const [deviceCoords, setDeviceCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationDeniedModalOpen, setIsLocationDeniedModalOpen] = useState<boolean>(false);
  const [punches, setPunches] = useState<PunchRecord[]>(() => getStoredPunches());
  const [pendingQueue, setPendingQueue] = useState<PunchRecord[]>(() => getPendingSyncQueue());
  const [punchState, setPunchState] = useState<'Awaiting Morning' | 'Clocked In' | 'On Break' | 'Shift Complete'>(() => {
    const s = getStoredPunchState();
    return s === 'Field Work' ? 'Clocked In' : s;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState<boolean>(false);

  // Field Work state (~2 hours outside limit, counted in working time)
  const [fieldWorkSession, setFieldWorkSession] = useState<FieldWorkSession | null>(() =>
    getStoredFieldWorkSession()
  );

  // Outside firm tracking state
  const [outsideSince, setOutsideSince] = useState<number | null>(() => getStoredOutsideSince());
  const [outsideMinutes, setOutsideMinutes] = useState<number>(0);

  // Shift working hours & continuous alarm state
  const [shiftStartMs, setShiftStartMs] = useState<number>(() => getShiftStartTimestamp());
  const [overtimeMinutes, setOvertimeMinutes] = useState<number>(() => getStoredOvertimeMinutes());
  const [isOvertimeAlarmPhase, setIsOvertimeAlarmPhase] = useState<boolean>(false);
  const [alarmTriggeredForShift, setAlarmTriggeredForShift] = useState<boolean>(false);

  // Theme & Dark Mode State (Light / Dark / System)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredTheme());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemPrefersDark);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      document.body.classList.toggle('dark', isDark);
    }
  }, [isDark]);

  const handleSelectThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    saveStoredTheme(mode);
  };

  // Network & localStorage Sync State
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedOffline, setIsSimulatedOfflineState] = useState<boolean>(() =>
    getSimulatedOffline()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTimeState] = useState<string>(() => getLastSyncTime());

  const effectiveOnline = isBrowserOnline && !isSimulatedOffline;

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSiteMapOpen, setIsSiteMapOpen] = useState(false);
  const [isShiftDetailsOpen, setIsShiftDetailsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isReEnrollOpen, setIsReEnrollOpen] = useState(false);
  const [selectedAuditPunch, setSelectedAuditPunch] = useState<PunchRecord | null>(null);
  const [lastVerifiedPunch, setLastVerifiedPunch] = useState<PunchRecord | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isFieldWorkOpen, setIsFieldWorkOpen] = useState(false);
  const [isShiftAlarmOpen, setIsShiftAlarmOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWorkingHoursOpen, setIsWorkingHoursOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryTargetEmployee, setSalaryTargetEmployee] = useState<UserProfile | null>(null);
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<UserProfile | null>(null);

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Real-time GPS Watcher when in device mode
  useEffect(() => {
    if (locationMode === 'device' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setDeviceCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => console.warn('GPS initial error', err),
        { enableHighAccuracy: true, timeout: 10000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        pos => {
          setDeviceCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        err => console.warn('GPS watch error', err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [locationMode]);

  // Compute live proximity distance to the firm location
  const { distanceMeters, isInsideGeofence } = useMemo(() => {
    if (locationMode === 'inside') {
      const lat = activeSite.coordinates.lat + 0.0001;
      const lng = activeSite.coordinates.lng + 0.0001;
      const dist = calculateDistanceMeters(lat, lng, activeSite.coordinates.lat, activeSite.coordinates.lng);
      return {
        distanceMeters: dist,
        isInsideGeofence: dist <= activeSite.radiusMeters,
      };
    } else if (locationMode === 'outside') {
      const lat = activeSite.coordinates.lat + 0.0028;
      const lng = activeSite.coordinates.lng + 0.0028;
      const dist = calculateDistanceMeters(lat, lng, activeSite.coordinates.lat, activeSite.coordinates.lng);
      return {
        distanceMeters: dist,
        isInsideGeofence: false,
      };
    } else {
      if (deviceCoords) {
        const dist = calculateDistanceMeters(
          deviceCoords.lat,
          deviceCoords.lng,
          activeSite.coordinates.lat,
          activeSite.coordinates.lng
        );
        return {
          distanceMeters: dist,
          isInsideGeofence: dist <= activeSite.radiusMeters,
        };
      }
      return {
        distanceMeters: 14,
        isInsideGeofence: true,
      };
    }
  }, [locationMode, activeSite, deviceCoords]);

  // Check if current time is within afternoon break (1:00 PM – 2:00 PM, 13:00 - 13:59:59)
  const isAfternoonBreak = useMemo(() => {
    const now = new Date();
    return now.getHours() === 13;
  }, []);

  // Calculate completed working minutes for today
  const completedMinutes = useMemo(() => {
    if (punchState === 'Awaiting Morning') return 0;
    const elapsedMs = Math.max(0, Date.now() - shiftStartMs);
    return Math.floor(elapsedMs / (1000 * 60));
  }, [punchState, shiftStartMs]);

  // Target working minutes: employee customizable dailyWorkingHours + any overtime
  const targetWorkingMinutes = useMemo(() => {
    const baseHours = profile.dailyWorkingHours || 8.0;
    return Math.floor(baseHours * 60) + overtimeMinutes;
  }, [profile.dailyWorkingHours, overtimeMinutes]);

  // Real-time Shift Hours Checker & Auto Punch-Out Monitoring Loop
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentIsBreak = currentHour === 13;

      // 1. Outside firm tracking logic
      if (punchState === 'Clocked In' && !isInsideGeofence && !fieldWorkSession?.isActive) {
        if (currentIsBreak) {
          // 1:00 PM to 2:00 PM is official break time: going outside is calculated in break!
          // Do not accumulate unauthorized outside time.
          setOutsideMinutes(0);
        } else {
          // Accumulate outside time
          let startTime = outsideSince;
          if (!startTime) {
            startTime = Date.now();
            setOutsideSince(startTime);
            saveStoredOutsideSince(startTime);
          }
          const mins = Math.floor((Date.now() - startTime) / (1000 * 60));
          setOutsideMinutes(mins);

          // REQUIREMENT: If employee forgets to punch out, then after 1 hour outside of firm automatic punch out at/after 7:00 PM (19:00)
          if (mins >= 60 && currentHour >= 19) {
            handleAutoPunchOut(
              'Automatic Punch-Out: Employee outside firm over 1 hour after 7:00 PM evening without manual punch-out.'
            );
          }
        }
      } else {
        if (outsideSince !== null) {
          setOutsideSince(null);
          saveStoredOutsideSince(null);
          setOutsideMinutes(0);
        }
      }

      // 2. Working hours completion check (triggers continuous beeping alarm)
      if (
        punchState === 'Clocked In' &&
        completedMinutes >= targetWorkingMinutes &&
        !alarmTriggeredForShift &&
        !isShiftAlarmOpen
      ) {
        setAlarmTriggeredForShift(true);
        setIsOvertimeAlarmPhase(overtimeMinutes > 0);
        setIsShiftAlarmOpen(true);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [
    punchState,
    isInsideGeofence,
    fieldWorkSession,
    outsideSince,
    completedMinutes,
    targetWorkingMinutes,
    alarmTriggeredForShift,
    isShiftAlarmOpen,
    overtimeMinutes,
  ]);

  const handleChangeLocationMode = (mode: LocationMode) => {
    setLocationMode(mode);
    saveStoredLocationMode(mode);
  };

  const handleUpdateFirmSite = (updatedSite: GeofenceSite) => {
    const updated = sites.map(s => (s.id === updatedSite.id ? updatedSite : s));
    setSites(updated);
    setActiveSite(updatedSite);
    saveStoredFirmSites(updated);
  };

  const handleSelectSite = (site: GeofenceSite) => {
    setActiveSite(site);
    const updated = sites.map(s => ({ ...s, isActive: s.id === site.id }));
    setSites(updated);
    saveStoredFirmSites(updated);
  };

  const handleToggleSimulateOffline = () => {
    const nextVal = !isSimulatedOffline;
    setIsSimulatedOfflineState(nextVal);
    setSimulatedOffline(nextVal);
  };

  // Sync queued offline punches to cloud
  const handleSyncPending = async () => {
    if (isSyncing || pendingQueue.length === 0 || !effectiveOnline) return;
    setIsSyncing(true);
    try {
      const result = await syncPendingQueue(punches);
      setPunches(result.syncedPunches);
      setPendingQueue([]);
      const updatedTime = getLastSyncTime();
      setLastSyncTimeState(updatedTime);

      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Cloud Sync Completed',
        message: `Successfully uploaded ${result.count} offline punch${
          result.count > 1 ? 'es' : ''
        } to SQ Attend server.`,
        timeAgo: 'Just now',
        type: 'system',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
    } catch (err) {
      console.error('Failed to sync queue', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (effectiveOnline && pendingQueue.length > 0 && !isSyncing) {
      handleSyncPending();
    }
  }, [effectiveOnline]);

  const handlePunchComplete = (
    newRecord: PunchRecord,
    nextState: 'Awaiting Morning' | 'Clocked In' | 'On Break' | 'Shift Complete'
  ) => {
    const isOnlineNow = effectiveOnline;
    const finalizedRecord: PunchRecord = {
      ...newRecord,
      synced: isOnlineNow,
    };

    const updatedPunches = [finalizedRecord, ...punches];
    setPunches(updatedPunches);
    saveStoredPunches(updatedPunches);

    if (!isOnlineNow) {
      const updatedQueue = enqueuePendingPunch(finalizedRecord);
      setPendingQueue(updatedQueue);
    }

    if (newRecord.type === 'clock-in') {
      const nowMs = Date.now();
      setShiftStartMs(nowMs);
      saveShiftStartTimestamp(nowMs);
      setAlarmTriggeredForShift(false);
      setOvertimeMinutes(0);
      saveStoredOvertimeMinutes(0);
    }

    setPunchState(nextState);
    saveStoredPunchState(nextState);
    setLastVerifiedPunch(finalizedRecord);
    setIsSuccessModalOpen(true);

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: isOnlineNow
        ? `${newRecord.type.toUpperCase().replace('-', ' ')} Registered`
        : `${newRecord.type.toUpperCase().replace('-', ' ')} Cached Offline`,
      message: isOnlineNow
        ? `Verified at ${newRecord.siteName} (${newRecord.accuracy}) via SQ Attend security telemetry.`
        : `Stored in localStorage (offline). Will automatically upload when back online.`,
      timeAgo: 'Just now',
      type: isOnlineNow ? 'shift' : 'system',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Automatic punch-out handler when outside > 1 hour after 7:00 PM
  const handleAutoPunchOut = (reason: string) => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    const timeFormatted = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateOnly = now.toLocaleDateString('en-US', options);

    const autoPunch: PunchRecord = {
      id: `punch-auto-${Date.now()}`,
      type: 'auto-clock-out',
      timestamp: now.toISOString(),
      timeFormatted,
      dateFormatted: `Today • ${dateOnly}`,
      siteId: activeSite.code,
      siteName: activeSite.name,
      zone: activeSite.zone,
      accuracy: '±4.2m',
      coordinates: activeSite.coordinates,
      isInsideGeofence: false,
      distanceMeters,
      statusTag: 'Approved',
      hash: `sha256-auto-${Date.now().toString(16)}`,
      synced: effectiveOnline,
      isAutoPunchOut: true,
      autoPunchReason: reason,
    };

    const updatedPunches = [autoPunch, ...punches];
    setPunches(updatedPunches);
    saveStoredPunches(updatedPunches);

    if (!effectiveOnline) {
      const updatedQueue = enqueuePendingPunch(autoPunch);
      setPendingQueue(updatedQueue);
    }

    setPunchState('Shift Complete');
    saveStoredPunchState('Shift Complete');
    setOutsideSince(null);
    saveStoredOutsideSince(null);
    setOutsideMinutes(0);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Automatic Punch-Out Executed',
      message: `${reason} Clocked out at ${timeFormatted}.`,
      timeAgo: 'Just now',
      type: 'shift',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);

    setLastVerifiedPunch(autoPunch);
    setIsSuccessModalOpen(true);
  };

  // Start official field work (~2 hours limit, counted in working time)
  const handleStartFieldWork = (purpose: string) => {
    const session: FieldWorkSession = {
      isActive: true,
      startedAt: new Date().toISOString(),
      purpose,
      allowedMinutes: 120, // ~2 hours limit
    };
    setFieldWorkSession(session);
    saveStoredFieldWorkSession(session);

    const now = new Date();
    const punch: PunchRecord = {
      id: `punch-fw-start-${Date.now()}`,
      type: 'field-work-start',
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: 'Today • Field Work Outing',
      siteId: activeSite.code,
      siteName: `${activeSite.name} (Field Duty)`,
      zone: 'Official Off-Site Assignment',
      accuracy: '±3.8m',
      coordinates: activeSite.coordinates,
      isInsideGeofence: false,
      distanceMeters: 350,
      statusTag: 'Approved',
      hash: `sha256-fw-${Date.now().toString(16)}`,
      synced: effectiveOnline,
      isFieldWork: true,
      fieldWorkPurpose: purpose,
      countsAsWorkTime: true,
    };

    setPunches(prev => [punch, ...prev]);
    saveStoredPunches([punch, ...punches]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Official Field Work Started',
      message: `Going out for "${purpose}". Time is counted in official working hours (~2h limit).`,
      timeAgo: 'Just now',
      type: 'shift',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // End official field work upon return to office
  const handleEndFieldWork = () => {
    setFieldWorkSession(null);
    saveStoredFieldWorkSession(null);

    const now = new Date();
    const punch: PunchRecord = {
      id: `punch-fw-end-${Date.now()}`,
      type: 'field-work-end',
      timestamp: now.toISOString(),
      timeFormatted: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: 'Today • Returned to Firm',
      siteId: activeSite.code,
      siteName: activeSite.name,
      zone: activeSite.zone,
      accuracy: '±3.8m',
      coordinates: activeSite.coordinates,
      isInsideGeofence: true,
      distanceMeters: 14,
      statusTag: 'Approved',
      hash: `sha256-fw-ret-${Date.now().toString(16)}`,
      synced: effectiveOnline,
      isFieldWork: true,
      countsAsWorkTime: true,
    };

    setPunches(prev => [punch, ...prev]);
    saveStoredPunches([punch, ...punches]);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Field Work Concluded',
      message: 'Returned to office perimeter. Full outdoor assignment duration credited to work time.',
      timeAgo: 'Just now',
      type: 'shift',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Shift End Alarm confirmation: Employee chose "Shift End" -> Punch out now
  const handleConfirmShiftEndFromAlarm = () => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    const timeFormatted = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const dateOnly = now.toLocaleDateString('en-US', options);

    const clockOutRecord: PunchRecord = {
      id: `punch-shift-end-${Date.now()}`,
      type: 'clock-out',
      timestamp: now.toISOString(),
      timeFormatted,
      dateFormatted: `Today • ${dateOnly}`,
      siteId: activeSite.code,
      siteName: activeSite.name,
      zone: activeSite.zone,
      accuracy: '±3.8m',
      coordinates: activeSite.coordinates,
      isInsideGeofence: isInsideGeofence || !!fieldWorkSession?.isActive,
      distanceMeters,
      verificationMethod: 'gps_geofence',
      statusTag: 'On Time',
      hash: `sha256-se-${Date.now().toString(16)}`,
      synced: effectiveOnline,
    };

    handlePunchComplete(clockOutRecord, 'Shift Complete');
  };

  // Shift End Alarm Overtime option: Employee chose "Overtime" -> Set extra hours and beep again
  const handleSetOvertimeFromAlarm = (extraMinutes: number) => {
    const totalExtra = overtimeMinutes + extraMinutes;
    setOvertimeMinutes(totalExtra);
    saveStoredOvertimeMinutes(totalExtra);
    setAlarmTriggeredForShift(false);
    setIsOvertimeAlarmPhase(true);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Overtime Hours Scheduled',
      message: `Added +${extraMinutes} minutes of authorized overtime. App will alert with continuous beep once overtime completes.`,
      timeAgo: 'Just now',
      type: 'shift',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Save employee's customized daily working hours
  const handleSaveWorkingHours = (hours: number) => {
    const updated = {
      ...profile,
      dailyWorkingHours: hours,
      weeklyTargetHours: hours * 5,
    };
    setProfile(updated);
    saveActiveUser(updated);

    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Daily Working Hours Updated',
      message: `Shift target set to ${hours} hours/day. Continuous alarm will signal when completed.`,
      timeAgo: 'Just now',
      type: 'system',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Salary Customization Handler (Admin and Owner)
  const handleOpenSalaryCustomization = (target?: UserProfile) => {
    setSalaryTargetEmployee(target || allEmployees[0] || profile);
    setIsSalaryModalOpen(true);
  };

  const handleUpdateSalary = (employeeId: string, newSalary: number) => {
    const updated = updateStoredEmployeeSalary(employeeId, newSalary);
    setAllEmployees(updated);
    if (profile.employeeId === employeeId || profile.id === employeeId) {
      setProfile(prev => ({ ...prev, monthlySalary: newSalary }));
    }
    const emp = updated.find(e => e.employeeId === employeeId);
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Salary Customized',
      message: `${emp ? emp.name : 'Employee'} monthly salary updated to $${newSalary.toLocaleString()} (Guaranteed 26 Working Days + 4 Paid Sundays).`,
      timeAgo: 'Just now',
      type: 'system',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleViewEmployeeDetails = (emp: UserProfile) => {
    setSelectedEmployeeForDetail(emp);
    setIsEmployeeDetailModalOpen(true);
  };

  // Auth: Login with mobile number & password or email & password
  const handleLoginSuccess = (user: UserProfile) => {
    setProfile(user);
    saveActiveUser(user);
    setAllEmployees(getStoredUsers());
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Employee Authenticated',
      message: `Welcome, ${user.name} (${user.employeeId}). Signed in with ${user.phone || user.email}.`,
      timeAgo: 'Just now',
      type: 'system',
      read: false,
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const handleLogout = () => {
    saveActiveUser(null);
    setIsAuthModalOpen(true);
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleEnrollSuccess = () => {
    setProfile(prev => {
      const next = {
        ...prev,
        biometricEnrolledDate: 'Just now • Calibrated 3D Mesh',
        biometricConfidence: 99.8,
      };
      saveActiveUser(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start sm:py-6 transition-colors">
      {/* Container simulating mobile phone viewport */}
      <div
        className={`w-full max-w-[430px] min-h-screen sm:min-h-[890px] sm:max-h-[920px] sm:rounded-[36px] relative flex flex-col overflow-y-auto no-scrollbar transition-colors duration-200 ${
          isDark
            ? 'dark bg-[#0a0f1d] text-slate-100 border border-slate-800 shadow-[0_20px_60px_rgba(0,0,0,0.85)]'
            : 'bg-[#f8f9ff] text-[#0d1c2e] border border-slate-700/60 sm:border-slate-800 shadow-2xl'
        }`}
      >
        {/* Device Notch / Dynamic Island Bar */}
        <div className="hidden sm:flex items-center justify-between px-6 pt-2 pb-1 text-[11px] font-mono-jb text-[#444651] dark:text-slate-400 z-50 select-none">
          <span className="font-bold text-[#0d1c2e] dark:text-white">09:41</span>
          <div className="w-20 h-4 bg-slate-900 dark:bg-black rounded-full flex items-center justify-center border border-slate-800/80">
            <div className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-900 mr-2"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-800"></div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <span className="material-symbols-outlined text-[13px]">signal_cellular_4_bar</span>
            <span className="material-symbols-outlined text-[13px]">
              {effectiveOnline ? 'wifi' : 'wifi_off'}
            </span>
            <span className="material-symbols-outlined text-[15px]">battery_full</span>
          </div>
        </div>

        {/* Top App Header: SQ Attend */}
        <Header
          currentTab={currentTab}
          unreadCount={unreadCount}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setCurrentTab('profile')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          userName={profile.name}
          avatarUrl={profile.avatarUrl}
          isOnline={effectiveOnline}
          pendingQueueCount={pendingQueue.length}
          onToggleOffline={handleToggleSimulateOffline}
        />

        {/* Dynamic Offline / Cloud Sync Status Banner */}
        {!effectiveOnline ? (
          <div className="bg-amber-500/15 dark:bg-amber-950/60 border-b border-amber-400/30 dark:border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200 shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600 dark:bg-amber-400"></span>
              </span>
              <span className="font-medium truncate text-[11px]">
                Offline • localStorage Cache Active ({pendingQueue.length} queued)
              </span>
            </div>
            <button
              onClick={handleToggleSimulateOffline}
              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-mono-jb text-[10px] font-bold shrink-0 transition-colors shadow-xs"
            >
              Go Online
            </button>
          </div>
        ) : pendingQueue.length > 0 ? (
          <div className="bg-blue-500/15 dark:bg-blue-950/60 border-b border-blue-400/30 dark:border-blue-800/60 px-4 py-2 flex items-center justify-between text-xs text-blue-950 dark:text-blue-200 shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className={`material-symbols-outlined text-[16px] text-[#00236f] dark:text-[#82f5c1] ${isSyncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span className="font-medium truncate text-[11px]">
                {isSyncing
                  ? `Syncing ${pendingQueue.length} offline punch${pendingQueue.length > 1 ? 'es' : ''}...`
                  : `Online: ${pendingQueue.length} offline record${pendingQueue.length > 1 ? 's' : ''} queued.`}
              </span>
            </div>
            <button
              onClick={handleSyncPending}
              disabled={isSyncing}
              className="px-2.5 py-0.5 rounded bg-[#00236f] dark:bg-[#1e3a8a] hover:bg-[#1e3a8a] dark:hover:bg-[#254ab3] text-white font-mono-jb text-[10px] font-bold shrink-0 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        ) : null}

        {/* Main Screen Content */}
        <main className="flex-1 w-full pt-3">
          {currentTab === 'punch' && (
            <PunchScreen
              activeSite={activeSite}
              punchState={punchState}
              onPunchComplete={handlePunchComplete}
              onOpenSiteMap={() => setIsSiteMapOpen(true)}
              onOpenShiftDetails={() => setIsShiftDetailsOpen(true)}
              isBiometricEnabled={isBiometricEnabled}
              onToggleBiometric={setIsBiometricEnabled}
              isOnline={effectiveOnline}
              pendingQueueCount={pendingQueue.length}
              locationMode={locationMode}
              onChangeLocationMode={handleChangeLocationMode}
              distanceMeters={distanceMeters}
              isInsideGeofence={isInsideGeofence}
              onTriggerDeniedModal={() => setIsLocationDeniedModalOpen(true)}
              user={profile}
              fieldWorkSession={fieldWorkSession}
              onOpenFieldWork={() => setIsFieldWorkOpen(true)}
              onEndFieldWork={handleEndFieldWork}
              onOpenWorkingHours={() => setIsWorkingHoursOpen(true)}
              onTriggerTestAlarm={() => setIsShiftAlarmOpen(true)}
              onSimulateAutoPunchOut={() =>
                handleAutoPunchOut('Simulated 1-Hour Outside Firm at 7:00 PM evening automatic exit.')
              }
              outsideMinutes={outsideMinutes}
              isAfternoonBreak={isAfternoonBreak}
              completedMinutes={completedMinutes}
            />
          )}

          {currentTab === 'history' && (
            <HistoryScreen
              punches={punches}
              onSelectPunch={punch => setSelectedAuditPunch(punch)}
              onOpenExport={() => setIsExportOpen(true)}
              pendingQueueCount={pendingQueue.length}
              onSyncNow={handleSyncPending}
              isSyncing={isSyncing}
              isOnline={effectiveOnline}
            />
          )}

          {currentTab === 'admin' && (
            <AdminScreen
              employees={allEmployees}
              allPunches={punches}
              activeSite={activeSite}
              currentUserId={profile.id}
              currentUserRole={profile.role || 'admin'}
              onSwitchToEmployee={emp => {
                setProfile(emp);
                saveActiveUser(emp);
                setCurrentTab('punch');
              }}
              onOpenAuditPunch={punch => setSelectedAuditPunch(punch)}
              onOpenSalaryCustomization={handleOpenSalaryCustomization}
              onViewEmployeeDetails={handleViewEmployeeDetails}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileScreen
              profile={profile}
              sites={sites}
              activeSite={activeSite}
              onSelectSite={handleSelectSite}
              onOpenSiteMap={() => setIsSiteMapOpen(true)}
              onReEnrollBiometrics={() => setIsReEnrollOpen(true)}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenWorkingHours={() => setIsWorkingHoursOpen(true)}
              onOpenSalaryCustomization={() => handleOpenSalaryCustomization(profile)}
              isBiometricEnabled={isBiometricEnabled}
              onToggleBiometric={setIsBiometricEnabled}
              isOnline={effectiveOnline}
              pendingQueueCount={pendingQueue.length}
              onSyncNow={handleSyncPending}
              isSyncing={isSyncing}
              isSimulatedOffline={isSimulatedOffline}
              onToggleSimulateOffline={handleToggleSimulateOffline}
              lastSyncTime={lastSyncTime}
              themeMode={themeMode}
              onSelectThemeMode={handleSelectThemeMode}
              isDark={isDark}
            />
          )}
        </main>

        {/* Bottom Fixed Navigation Bar */}
        <BottomNav
          activeTab={currentTab}
          onChangeTab={tab => setCurrentTab(tab)}
        />

        {/* Modals & Overlays */}
        <PunchSuccessModal
          punch={lastVerifiedPunch}
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
          onViewHistory={() => {
            setIsSuccessModalOpen(false);
            setCurrentTab('history');
          }}
        />

        <PunchDetailModal
          punch={selectedAuditPunch}
          isOpen={!!selectedAuditPunch}
          onClose={() => setSelectedAuditPunch(null)}
        />

        <GeofenceMapModal
          isOpen={isSiteMapOpen}
          onClose={() => setIsSiteMapOpen(false)}
          sites={sites}
          activeSite={activeSite}
          onSelectSite={handleSelectSite}
          locationMode={locationMode}
          onChangeLocationMode={handleChangeLocationMode}
          distanceMeters={distanceMeters}
          isInsideGeofence={isInsideGeofence}
          onUpdateSite={handleUpdateFirmSite}
        />

        <LocationDeniedModal
          isOpen={isLocationDeniedModalOpen}
          onClose={() => setIsLocationDeniedModalOpen(false)}
          activeSite={activeSite}
          distanceMeters={distanceMeters}
          onOpenRadar={() => {
            setIsLocationDeniedModalOpen(false);
            setIsSiteMapOpen(true);
          }}
          onSimulateInside={() => {
            handleChangeLocationMode('inside');
            setIsLocationDeniedModalOpen(false);
          }}
        />

        <ShiftDetailModal
          isOpen={isShiftDetailsOpen}
          onClose={() => setIsShiftDetailsOpen(false)}
        />

        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
        />

        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          punches={punches}
          profile={profile}
        />

        <ReEnrollModal
          isOpen={isReEnrollOpen}
          onClose={() => setIsReEnrollOpen(false)}
          onEnrollSuccess={handleEnrollSuccess}
        />

        {/* Field Work Modal (~2 hours limit, counted in work time) */}
        <FieldWorkModal
          isOpen={isFieldWorkOpen}
          onClose={() => setIsFieldWorkOpen(false)}
          onStartFieldWork={handleStartFieldWork}
          isFieldWorkActive={!!fieldWorkSession?.isActive}
          onEndFieldWork={handleEndFieldWork}
          elapsedMinutes={
            fieldWorkSession?.startedAt
              ? Math.floor((Date.now() - new Date(fieldWorkSession.startedAt).getTime()) / (1000 * 60))
              : 0
          }
          remainingMinutes={
            fieldWorkSession?.startedAt
              ? Math.max(
                  0,
                  120 - Math.floor((Date.now() - new Date(fieldWorkSession.startedAt).getTime()) / (1000 * 60))
                )
              : 120
          }
        />

        {/* Continuous Beeping Shift End Alarm Modal with 2 Options (Shift End vs Overtime) */}
        <ShiftEndAlarmModal
          isOpen={isShiftAlarmOpen}
          onClose={() => setIsShiftAlarmOpen(false)}
          onConfirmShiftEnd={handleConfirmShiftEndFromAlarm}
          onSetOvertime={handleSetOvertimeFromAlarm}
          isOvertimeAlarm={isOvertimeAlarmPhase}
          workingHoursTarget={profile.dailyWorkingHours || 8.0}
          completedMinutes={completedMinutes}
        />

        {/* Auth / Login Modal with Mobile Number & Password or Email & Password */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={profile}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />

        {/* Customizable Working Hours Modal */}
        <WorkingHoursModal
          isOpen={isWorkingHoursOpen}
          onClose={() => setIsWorkingHoursOpen(false)}
          user={profile}
          onSaveWorkingHours={handleSaveWorkingHours}
          onTriggerTestAlarm={() => setIsShiftAlarmOpen(true)}
          completedMinutes={completedMinutes}
        />

        {/* Salary Customization Modal (Admin and Owner) */}
        <SalaryCustomizationModal
          isOpen={isSalaryModalOpen}
          onClose={() => setIsSalaryModalOpen(false)}
          employees={allEmployees}
          targetEmployee={salaryTargetEmployee}
          onUpdateSalary={handleUpdateSalary}
          currentUserRole={profile.role || 'admin'}
        />

        {/* Master Employee Data & Telemetry Detail Modal */}
        <EmployeeDataDetailModal
          isOpen={isEmployeeDetailModalOpen}
          onClose={() => setIsEmployeeDetailModalOpen(false)}
          employee={selectedEmployeeForDetail}
          allPunches={punches}
          activeSite={activeSite}
          onCustomizeSalary={emp => handleOpenSalaryCustomization(emp)}
          onSwitchToEmployee={emp => {
            setProfile(emp);
            saveActiveUser(emp);
            setCurrentTab('punch');
          }}
          currentUserRole={profile.role || 'admin'}
        />
      </div>
    </div>
  );
}
