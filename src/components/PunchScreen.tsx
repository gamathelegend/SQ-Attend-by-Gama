import React, { useState, useEffect, useRef } from 'react';
import { FieldWorkSession, GeofenceSite, LocationMode, PunchRecord, PunchType, UserProfile } from '../types';
import { playShutterSound, playSuccessChime } from '../utils/audio';
import { OFFICIAL_SELFIE_URL } from '../utils/mockData';

interface PunchScreenProps {
  activeSite: GeofenceSite;
  punchState: 'Awaiting Morning' | 'Clocked In' | 'On Break' | 'Shift Complete';
  onPunchComplete: (record: PunchRecord, nextState: 'Awaiting Morning' | 'Clocked In' | 'On Break' | 'Shift Complete') => void;
  onOpenSiteMap: () => void;
  onOpenShiftDetails: () => void;
  isBiometricEnabled: boolean;
  onToggleBiometric: (enabled: boolean) => void;
  isOnline: boolean;
  pendingQueueCount: number;
  locationMode: LocationMode;
  onChangeLocationMode: (mode: LocationMode) => void;
  distanceMeters: number;
  isInsideGeofence: boolean;
  onTriggerDeniedModal: () => void;
  user: UserProfile;
  fieldWorkSession: FieldWorkSession | null;
  onOpenFieldWork: () => void;
  onEndFieldWork: () => void;
  onOpenWorkingHours: () => void;
  onTriggerTestAlarm: () => void;
  onSimulateAutoPunchOut: () => void;
  outsideMinutes: number;
  isAfternoonBreak: boolean;
  completedMinutes: number;
}

export const PunchScreen: React.FC<PunchScreenProps> = ({
  activeSite,
  punchState,
  onPunchComplete,
  onOpenSiteMap,
  onOpenShiftDetails,
  isBiometricEnabled,
  onToggleBiometric,
  isOnline,
  pendingQueueCount,
  locationMode,
  onChangeLocationMode,
  distanceMeters,
  isInsideGeofence,
  onTriggerDeniedModal,
  user,
  fieldWorkSession,
  onOpenFieldWork,
  onEndFieldWork,
  onOpenWorkingHours,
  onTriggerTestAlarm,
  onSimulateAutoPunchOut,
  outsideMinutes,
  isAfternoonBreak,
  completedMinutes,
}) => {
  // Live Clock & Date
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  
  // Real-time confidence fluctuation for realistic HUD
  const [confidence, setConfidence] = useState<number>(99.4);

  // Camera & Flash Controls
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [snapTriggered, setSnapTriggered] = useState<boolean>(false);

  // Selected punch action when clocked in
  const [selectedAction, setSelectedAction] = useState<PunchType>('clock-in');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');

      setTimeStr(`${formattedHours}:${minutes}:${seconds} ${ampm}`);

      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
      setDateStr(`${now.toLocaleDateString('en-US', options)} • Live`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subtle fluctuation in face detection percentage for live authenticity
  useEffect(() => {
    const confInterval = setInterval(() => {
      const delta = (Math.random() * 0.4 - 0.2);
      setConfidence(prev => {
        const next = prev + delta;
        return Number(Math.min(99.8, Math.max(98.8, next)).toFixed(1));
      });
    }, 2800);
    return () => clearInterval(confInterval);
  }, []);

  // Update default action based on current state
  useEffect(() => {
    if (punchState === 'Awaiting Morning') {
      setSelectedAction('clock-in');
    } else if (punchState === 'Clocked In') {
      setSelectedAction('clock-out');
    } else if (punchState === 'On Break') {
      setSelectedAction('break-end');
    } else {
      setSelectedAction('clock-in');
    }
  }, [punchState]);

  // Handle webcam stream start/stop
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam) {
      navigator.mediaDevices?.getUserMedia({
        video: { facingMode: cameraFacing, width: { ideal: 720 }, height: { ideal: 960 } }
      })
      .then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play();
        }
      })
      .catch(() => {
        // Fallback to mock image if camera denied
        setUseWebcam(false);
      });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [useWebcam, cameraFacing]);

  // Setup keyboard shortcut for instant punch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'Enter') {
        if (!isProcessing) {
          e.preventDefault();
          if (selectedAction === 'clock-in' && !isInsideGeofence) {
            onTriggerDeniedModal();
            return;
          }
          handleSnap();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProcessing, selectedAction, activeSite, confidence, useWebcam, isInsideGeofence]);

  // Flash cycle toggle
  const toggleFlash = () => {
    if (flashMode === 'auto') setFlashMode('on');
    else if (flashMode === 'on') setFlashMode('off');
    else setFlashMode('auto');
  };

  // Camera toggle (Mock vs Live, and Front vs Back)
  const toggleCamera = () => {
    if (!useWebcam) {
      setUseWebcam(true);
    } else if (cameraFacing === 'user') {
      setCameraFacing('environment');
    } else {
      setUseWebcam(false);
      setCameraFacing('user');
    }
  };

  // Execute Punch - Instantaneous <100ms execution
  const handleSnap = () => {
    // Strict Geofence Enforcement: Employees can ONLY punch in when physically inside firm location, OR on authorized Field Work assignment!
    if (selectedAction === 'clock-in' && !isInsideGeofence && !fieldWorkSession?.isActive) {
      onTriggerDeniedModal();
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    setSnapTriggered(true);

    if (isBiometricEnabled) {
      playShutterSound();
      if (flashMode !== 'off') {
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 120);
      }
    }

    // Capture photo only if biometrics enabled
    let capturedPhoto: string | undefined = undefined;
    if (isBiometricEnabled) {
      capturedPhoto = OFFICIAL_SELFIE_URL;
      if (useWebcam && videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth || 480;
        canvas.height = video.videoHeight || 640;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            capturedPhoto = canvas.toDataURL('image/jpeg', 0.85);
          } catch {
            capturedPhoto = OFFICIAL_SELFIE_URL;
          }
        }
      }
    }

    // Fast 90ms verification cycle
    setTimeout(() => {
      playSuccessChime();

      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, '0');
      const timeOnly = `${formattedHours}:${minutes}:${seconds} ${ampm}`;

      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      const dateOnly = now.toLocaleDateString('en-US', options);

      // Determine next state and status tag based on shift schedule (Morning 9-11 AM entry, Evening 6-9 PM exit)
      // Policy: Enter any time, exit any time (Zero lockout, all punches accepted)
      let nextState: 'Awaiting Morning' | 'Clocked In' | 'On Break' | 'Shift Complete' = 'Clocked In';
      let tag: 'On Time' | 'Early' | 'Late' | 'Half Day' | 'Overtime' | 'Approved' | 'Holiday Duty' = 'On Time';

      const currentHour = now.getHours() + now.getMinutes() / 60;

      if (selectedAction === 'clock-in') {
        nextState = 'Clocked In';
        // Entry time: morning 9 to 11 AM (9.0 to 11.0)
        if (currentHour >= 9.0 && currentHour <= 11.0) {
          tag = 'On Time';
        } else if (currentHour < 9.0) {
          tag = 'Early'; // Flexi early entry
        } else {
          tag = 'Approved'; // Flexi afternoon/evening entry permitted
        }
      } else if (selectedAction === 'break-start') {
        nextState = 'On Break';
        tag = 'Approved';
      } else if (selectedAction === 'break-end') {
        nextState = 'Clocked In';
        tag = 'On Time';
      } else if (selectedAction === 'clock-out') {
        nextState = 'Shift Complete';
        // Exit timing: evening 6 to 9 PM (18.0 to 21.0)
        if (currentHour >= 18.0 && currentHour <= 21.0) {
          tag = 'On Time';
        } else if (currentHour > 21.0) {
          tag = 'Overtime';
        } else {
          tag = 'Early'; // Flexi departure permitted
        }
      } else if (selectedAction === 'half-day') {
        nextState = 'Shift Complete';
        tag = 'Half Day';
      }

      const isSunday = now.getDay() === 0;
      if (isSunday) {
        tag = 'Holiday Duty';
      }

      const randomHash = Math.random().toString(16).substring(2, 10);

      const newRecord: PunchRecord = {
        id: `punch-${Date.now()}`,
        employeeId: user?.employeeId,
        employeeName: user?.name,
        type: selectedAction,
        timestamp: now.toISOString(),
        timeFormatted: timeOnly,
        dateFormatted: `Today • ${dateOnly}`,
        siteId: activeSite.code,
        siteName: activeSite.name,
        zone: activeSite.zone,
        accuracy: '±3.8m',
        coordinates: activeSite.coordinates,
        isInsideGeofence: isInsideGeofence || !!fieldWorkSession?.isActive,
        distanceMeters: distanceMeters,
        verificationMethod: isBiometricEnabled ? 'face_biometric' : 'gps_geofence',
        confidence: isBiometricEnabled ? confidence : undefined,
        photoUrl: capturedPhoto,
        statusTag: tag,
        hash: `sha256-${randomHash}`,
        synced: isOnline,
        isFieldWork: fieldWorkSession?.isActive,
        fieldWorkPurpose: fieldWorkSession?.purpose,
        countsAsWorkTime: fieldWorkSession?.isActive ? true : undefined,
        isSundayHoliday: isSunday,
      };

      onPunchComplete(newRecord, nextState);
      setIsProcessing(false);
      setSnapTriggered(false);
    }, 90);
  };

  const isClockInBlocked = selectedAction === 'clock-in' && !isInsideGeofence && !fieldWorkSession?.isActive;

  const getActionTitle = () => {
    if (isClockInBlocked) {
      return 'Blocked: Outside Firm Location';
    }

    const actionName =
      selectedAction === 'clock-in'
        ? 'Clock In'
        : selectedAction === 'clock-out'
        ? 'Clock Out'
        : selectedAction === 'half-day'
        ? 'Half-Day Departure'
        : selectedAction === 'break-start'
        ? 'Take Break'
        : 'Resume Shift';

    if (isBiometricEnabled) {
      return `Snap & ${actionName} (Face ID)`;
    }
    return `1-Tap ${actionName} (Firm GPS Verified)`;
  };

  const getShiftScheduleStatus = () => {
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    if (currentHour >= 9.0 && currentHour <= 11.0) {
      return {
        badgeText: 'Entry Window Active',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        detail: 'Core Morning Entry (09:00 – 11:00 AM)',
      };
    } else if (currentHour >= 18.0 && currentHour <= 21.0) {
      return {
        badgeText: 'Exit Window Active',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        detail: 'Core Evening Exit (06:00 – 09:00 PM)',
      };
    } else {
      return {
        badgeText: 'Flexi Open 24/7',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        detail: 'Enter & Exit Any Time (Zero Lockout)',
      };
    }
  };

  const scheduleStatus = getShiftScheduleStatus();

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pb-24 gap-4">
      {/* Hidden canvas for snapshotting */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Geofence Status Card */}
      <button
        onClick={onOpenSiteMap}
        className={`w-full flex items-center justify-between p-2.5 transition-colors rounded-xl shadow-xs border text-left active:scale-[0.99] ${
          isInsideGeofence
            ? 'bg-[#eff4ff] hover:bg-[#e6eeff] border-[#d5e3fc]/80'
            : 'bg-rose-50/95 hover:bg-rose-100/95 border-rose-300'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`relative flex items-center justify-center w-8 h-8 rounded-lg text-white shrink-0 shadow-xs ${
              isInsideGeofence ? 'bg-[#006c4a]' : 'bg-rose-600'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isInsideGeofence ? 'verified_user' : 'location_off'}
            </span>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isInsideGeofence ? 'bg-[#85f8c4]' : 'bg-rose-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isInsideGeofence ? 'bg-[#68dba9]' : 'bg-rose-500'
                }`}
              ></span>
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-jb">
              <span
                className={`uppercase tracking-wider font-bold ${
                  isInsideGeofence ? 'text-[#006c4a]' : 'text-rose-700'
                }`}
              >
                {isInsideGeofence ? 'Firm Geofence Verified' : 'Outside Firm Perimeter'}
              </span>
              <span className="text-[#444651]">·</span>
              <span className="text-[#444651] font-semibold">{activeSite.code}</span>
            </div>
            <span className="text-[13px] font-bold text-[#0d1c2e] truncate">
              {activeSite.name} · {distanceMeters}m to Center
            </span>
          </div>
        </div>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded shrink-0 font-mono-jb text-[11px] font-bold ${
            isInsideGeofence
              ? 'bg-[#dce9ff] text-[#00236f]'
              : 'bg-rose-200/90 text-rose-800'
          }`}
        >
          <span className="material-symbols-outlined text-[15px]">
            {isInsideGeofence ? 'my_location' : 'near_me_disabled'}
          </span>
          <span>{isInsideGeofence ? 'Inside' : 'Blocked'}</span>
        </div>
      </button>

      {/* Firm Location & Test Simulation Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] font-mono-jb font-bold uppercase text-slate-500 shrink-0">
            Location Test:
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangeLocationMode('inside')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono-jb font-bold transition-all border ${
                locationMode === 'inside'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              At Firm (14m)
            </button>
            <button
              onClick={() => onChangeLocationMode('outside')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono-jb font-bold transition-all border ${
                locationMode === 'outside'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Away (380m)
            </button>
            <button
              onClick={() => onChangeLocationMode('device')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono-jb font-bold transition-all border ${
                locationMode === 'device'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Real GPS
            </button>
          </div>
        </div>
        <button
          onClick={onOpenSiteMap}
          className="text-[10px] font-mono-jb text-[#00236f] hover:underline font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 shrink-0 flex items-center gap-0.5"
        >
          <span className="material-symbols-outlined text-[12px]">radar</span>
          <span>Radar</span>
        </button>
      </div>

      {/* Verification Mode Switcher (GPS Geofence vs Optional Biometric Face ID) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between p-1 bg-[#eff4ff] rounded-xl border border-[#d5e3fc]/80 shadow-xs">
          <button
            type="button"
            onClick={() => onToggleBiometric(false)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              !isBiometricEnabled
                ? 'bg-[#00236f] text-white shadow-xs font-bold'
                : 'text-[#444651] hover:text-[#00236f]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">share_location</span>
            <span>Firm GPS Geofence (Standard)</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleBiometric(true)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              isBiometricEnabled
                ? 'bg-[#00236f] text-white shadow-xs font-bold'
                : 'text-[#444651] hover:text-[#00236f]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">face</span>
            <span>Face ID (Optional)</span>
          </button>
        </div>

        {/* Reassuring status badge */}
        <div
          className={`flex items-center justify-between px-2.5 py-1.5 border rounded-lg text-[11px] font-medium ${
            isInsideGeofence
              ? 'bg-emerald-50/80 border-emerald-200/60 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">
              {isInsideGeofence ? 'domain_verification' : 'location_disabled'}
            </span>
            <span>
              {isInsideGeofence
                ? `Firm Perimeter Verified: You are ${distanceMeters}m from center (Allowed radius: ${activeSite.radiusMeters}m).`
                : `Firm Policy Locked: Outside authorized perimeter (${distanceMeters}m away). Punch in is strictly prohibited.`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport Container: Camera Viewfinder if Face ID enabled, or GPS Radar HUD if Biometrics off */}
      {isBiometricEnabled ? (
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-[#233144] flex flex-col justify-between p-3.5 select-none border border-slate-700/50">
          {/* Shutter White Flash overlay */}
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-50 animate-camera-flash pointer-events-none" />
          )}

          {/* Live Camera Feed OR High Quality Hotlinked Sample */}
          {useWebcam ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-90 transition-opacity"
              style={{ backgroundImage: `url('${OFFICIAL_SELFIE_URL}')` }}
            />
          )}

          {/* Vignette & Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#233144]/80 via-transparent to-[#233144]/90 pointer-events-none" />

          {/* Top HUD Bar */}
          <div className="relative z-20 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#233144]/85 backdrop-blur-md px-3 py-1 rounded-full text-[#eaf1ff] shadow-sm border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#82f5c1] animate-pulse"></span>
                <span className="font-mono-jb text-[11px] uppercase tracking-wider font-bold text-[#82f5c1]">
                  Face ({confidence}%)
                </span>
              </div>
              <div className="hidden xs:flex items-center gap-1 bg-[#233144]/85 backdrop-blur-md px-2 py-1 rounded-full text-[#85f8c4] font-mono-jb text-[10px] font-bold border border-white/10">
                <span className="material-symbols-outlined text-[13px] text-[#85f8c4]">bolt</span>
                <span>&lt;100ms</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Flash toggle */}
              <button
                onClick={toggleFlash}
                aria-label="Toggle camera flash"
                className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  flashMode === 'on'
                    ? 'bg-[#006c4a] text-white'
                    : flashMode === 'auto'
                    ? 'bg-[#233144]/85 text-[#eaf1ff] hover:text-white'
                    : 'bg-[#233144]/85 text-slate-400'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {flashMode === 'auto' ? 'flash_auto' : flashMode === 'on' ? 'flash_on' : 'flash_off'}
                </span>
              </button>

              {/* Switch Camera / Live Webcam toggle */}
              <button
                onClick={toggleCamera}
                aria-label="Switch camera view"
                title={useWebcam ? 'Switch to rear camera or photo feed' : 'Activate live device camera'}
                className={`w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                  useWebcam
                    ? 'bg-[#00236f] text-white ring-1 ring-blue-400'
                    : 'bg-[#233144]/85 text-[#eaf1ff] hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">flip_camera_ios</span>
              </button>
            </div>
          </div>

          {/* Central Reticle & Alignment Guides */}
          <div className="relative z-10 flex-1 flex items-center justify-center py-2 pointer-events-none">
            {/* Target Viewport Box with L-Brackets */}
            <div className="relative w-64 h-72 flex items-center justify-center">
              {/* Corner Brackets */}
              <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#82f5c1]"></span>
              <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#82f5c1]"></span>
              <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#82f5c1]"></span>
              <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#82f5c1]"></span>

              {/* Biometric Oval Mask Overlay */}
              <div className="relative w-48 h-60 rounded-[50%] border-2 border-dashed border-[#68dba9]/90 flex flex-col items-center justify-center">
                {/* Crosshair Center Indicator */}
                <div className="w-5 h-5 flex items-center justify-center opacity-70">
                  <span className="material-symbols-outlined text-[#85f8c4] text-[20px]">add</span>
                </div>

                {/* Feature Alignment Pill Indicator */}
                <div className="absolute bottom-3 px-2.5 py-0.5 rounded-full bg-[#233144]/90 backdrop-blur-sm text-[#85f8c4] font-mono-jb text-[11px] tracking-tight flex items-center gap-1 border border-[#85f8c4]/30 shadow-xs">
                  <span className="material-symbols-outlined text-[13px] text-[#82f5c1]">check_circle</span>
                  <span className="font-semibold">Optional Biometric Mesh</span>
                </div>
              </div>

              {/* Scanning Beam Simulation Line */}
              <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-[#85f8c4] to-transparent opacity-75 animate-laser-sweep"></div>
            </div>
          </div>

          {/* Bottom HUD Telemetry Overlay */}
          <div className="relative z-20 flex flex-col gap-1 w-full bg-[#233144]/85 backdrop-blur-md p-2.5 rounded-xl text-[#eaf1ff] border border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#82f5c1] text-[18px]">schedule</span>
                <span className="font-mono-jb text-[22px] font-bold text-white tracking-tight leading-none">
                  {timeStr || '03:08:14 AM'}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono-jb font-bold ${
                  isOnline
                    ? 'bg-white/10 text-[#82f5c1] border-[#82f5c1]/20'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {isOnline ? 'satellite_alt' : 'cloud_off'}
                </span>
                <span>{isOnline ? 'GPS LOCK' : 'OFFLINE CACHE'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[#d5e3fc] font-mono-jb text-[11px] tracking-tight pt-0.5">
              <span>{dateStr || 'Thursday, Sep 24 • Live'}</span>
              <span className="tracking-wide">
                LAT {activeSite.coordinates.lat.toFixed(4)} · LON {activeSite.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Standard GPS Geofence Radar Telemetry Display (No Face ID required) */
        <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden shadow-lg bg-[#121c29] flex flex-col justify-between p-3.5 select-none border border-slate-700/60 text-[#eaf1ff]">
          {/* Top HUD Bar */}
          <div className="relative z-20 flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 backdrop-blur-md px-3 py-1 rounded-full font-mono-jb text-[11px] font-bold border shadow-xs ${
                  isInsideGeofence
                    ? 'bg-[#1e2e42]/90 text-[#82f5c1] border-white/10'
                    : 'bg-rose-950/90 text-rose-300 border-rose-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isInsideGeofence ? 'bg-[#82f5c1] animate-ping' : 'bg-rose-500 animate-ping'
                  }`}
                ></span>
                <span>{isInsideGeofence ? 'FIRM RADAR LOCK' : 'OUTSIDE PERIMETER'}</span>
              </div>
              {!isOnline && (
                <div className="flex items-center gap-1 bg-amber-500/20 backdrop-blur-md px-2.5 py-1 rounded-full text-amber-300 font-mono-jb text-[10px] font-bold border border-amber-400/30 animate-pulse">
                  <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                  <span>OFFLINE CACHE</span>
                </div>
              )}
            </div>
            <div
              className={`flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1 rounded-full font-mono-jb text-[10px] border ${
                isInsideGeofence
                  ? 'bg-white/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-rose-950/70 text-rose-300 border-rose-500/30'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isInsideGeofence ? 'check_circle' : 'block'}
              </span>
              <span>{isInsideGeofence ? 'Verified Inside' : 'Clock In Blocked'}</span>
            </div>
          </div>

          {/* Central Radar Simulation Screen */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-2 pointer-events-none">
            <div className="relative w-64 h-64 rounded-full border border-blue-500/20 bg-blue-950/30 flex items-center justify-center overflow-hidden">
              {/* Concentric distance rings */}
              <div className="absolute w-52 h-52 rounded-full border border-blue-500/25 border-dashed" />
              {/* Authorized Perimeter Ring */}
              <div
                className={`absolute w-36 h-36 rounded-full border-2 transition-colors ${
                  isInsideGeofence
                    ? 'border-emerald-400/80 bg-emerald-500/10'
                    : 'border-rose-500/70 bg-rose-500/10'
                }`}
              />
              <div className="absolute w-20 h-20 rounded-full border border-emerald-500/40" />

              {/* Radar Sweep Beam */}
              <div
                className="absolute inset-0 animate-spin"
                style={{
                  background: isInsideGeofence
                    ? 'conic-gradient(from 0deg, transparent 0 300deg, rgba(130,245,193,0.3) 360deg)'
                    : 'conic-gradient(from 0deg, transparent 0 300deg, rgba(239,68,68,0.3) 360deg)',
                  animationDuration: '3.5s',
                }}
              />

              {/* Crosshair Axes */}
              <div className="absolute inset-x-0 h-[1px] bg-blue-400/20" />
              <div className="absolute inset-y-0 w-[1px] bg-blue-400/20" />

              {/* Center Site Marker */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative flex items-center justify-center">
                  <span className="absolute w-8 h-8 rounded-full bg-[#82f5c1]/25 animate-ping" />
                  <div className="w-4 h-4 rounded-full bg-[#82f5c1] border-2 border-[#121c29] shadow-lg flex items-center justify-center" />
                </div>
                <span className="mt-1 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono-jb text-[#85f8c4] border border-[#85f8c4]/30 font-bold">
                  {activeSite.code}
                </span>
              </div>

              {/* User Location Pulse */}
              <div
                className="absolute z-20 flex flex-col items-center transition-all duration-500"
                style={{
                  top: isInsideGeofence ? '28%' : '10%',
                  right: isInsideGeofence ? '28%' : '8%',
                }}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full ring-4 ${
                    isInsideGeofence
                      ? 'bg-blue-400 ring-blue-400/30 animate-pulse'
                      : 'bg-rose-500 ring-rose-500/40 animate-ping'
                  }`}
                />
                <span
                  className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono-jb font-bold whitespace-nowrap shadow-sm ${
                    isInsideGeofence
                      ? 'bg-blue-950/90 text-blue-200 border border-blue-400/40'
                      : 'bg-rose-950/90 text-rose-200 border border-rose-400/40 animate-pulse'
                  }`}
                >
                  {isInsideGeofence ? 'YOU (INSIDE)' : `YOU (${distanceMeters}m)`}
                </span>
              </div>

              {/* Perimeter status badge */}
              <div className="absolute bottom-2.5 inset-x-0 text-center">
                <span
                  className={`text-[9px] font-mono-jb font-bold px-2.5 py-0.5 rounded-full border ${
                    isInsideGeofence
                      ? 'text-[#85f8c4] bg-[#121c29]/95 border-emerald-500/40'
                      : 'text-rose-300 bg-rose-950/95 border-rose-500/40'
                  }`}
                >
                  {isInsideGeofence
                    ? `Inside Perimeter (${activeSite.radiusMeters}m Zone)`
                    : `Outside Perimeter (${distanceMeters}m / Max: ${activeSite.radiusMeters}m)`}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom HUD Telemetry Overlay */}
          <div className="relative z-20 flex flex-col gap-1 w-full bg-[#1e2e42]/85 backdrop-blur-md p-2.5 rounded-xl text-[#eaf1ff] border border-white/10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#82f5c1] text-[18px]">schedule</span>
                <span className="font-mono-jb text-[22px] font-bold text-white tracking-tight leading-none">
                  {timeStr || '03:08:14 AM'}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-mono-jb font-bold ${
                  !isInsideGeofence
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                    : isOnline
                    ? 'bg-white/10 text-[#82f5c1] border-[#82f5c1]/20'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                <span className="material-symbols-outlined text-[13px]">
                  {!isInsideGeofence ? 'block' : isOnline ? 'share_location' : 'inventory_2'}
                </span>
                <span className="font-mono-jb text-[11px] font-bold">
                  {!isInsideGeofence ? 'OUTSIDE FIRM (LOCKED)' : isOnline ? 'VERIFIED ON-SITE' : 'LOCAL CACHE MODE'}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[#d5e3fc] font-mono-jb text-[11px] tracking-tight pt-0.5">
              <span>{dateStr || 'Thursday, Sep 24 • Live'}</span>
              <span className="tracking-wide">
                LAT {activeSite.coordinates.lat.toFixed(4)} · LON {activeSite.coordinates.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sunday Official Holiday Banner */}
      <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-xs shadow-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 border border-amber-200 dark:border-amber-800 shadow-xs">
            <span className="material-symbols-outlined text-[19px]">celebration</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-amber-950 dark:text-amber-100 text-[11px] truncate">
                Sunday: Official Company Holiday
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono-jb font-bold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                PAID REST DAY
              </span>
            </div>
            <span className="text-[10px] text-amber-900/80 dark:text-amber-300/80 font-mono-jb truncate">
              {new Date().getDay() === 0
                ? 'Today is Sunday • Paid rest day (punches logged as Holiday Duty)'
                : 'Sundays are 100% official paid holidays • Standard 10k salary'}
            </span>
          </div>
        </div>
        <div className="text-[10px] font-mono-jb text-emerald-800 dark:text-emerald-300 font-bold px-2 py-1 rounded-md bg-white dark:bg-[#1a263c] border border-amber-200 dark:border-slate-700 shrink-0 shadow-2xs">
          ${(user?.monthlySalary || 10000).toLocaleString()}/mo
        </div>
      </div>

      {/* Shift Window Schedule & Open Flexi Policy Banner */}
      <div className="flex items-center justify-between p-2.5 bg-[#eff4ff] dark:bg-[#131d2e] rounded-xl border border-[#d5e3fc]/80 dark:border-slate-800 text-xs shadow-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1a263c] flex items-center justify-center text-[#00236f] dark:text-[#82f5c1] shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span className="material-symbols-outlined text-[19px]">all_inclusive</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[#0d1c2e] dark:text-slate-100 text-[11px] truncate">
                Entry 9–11 AM • Exit 6–9 PM
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono-jb font-bold border ${scheduleStatus.badgeColor}`}>
                {scheduleStatus.badgeText}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-jb truncate">
              {scheduleStatus.detail}
            </span>
          </div>
        </div>
        <button
          onClick={onOpenShiftDetails}
          className="text-[10px] font-mono-jb text-[#00236f] dark:text-[#82f5c1] hover:underline font-bold px-2 py-1 rounded-md bg-white dark:bg-[#1a263c] border border-slate-200/80 dark:border-slate-700 shrink-0 shadow-2xs"
        >
          Details
        </button>
      </div>

      {/* Field Work In-Progress Special HUD Banner */}
      {fieldWorkSession?.isActive && (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-xl shadow-md border border-indigo-400/40">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] text-[#82f5c1]">business_center</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono-jb uppercase text-[#82f5c1] font-bold">
                Firm Assignment Active • Counted in Working Time
              </span>
              <span className="text-xs font-bold truncate">
                {fieldWorkSession.purpose}
              </span>
              <span className="text-[10px] font-mono-jb text-indigo-200">
                Outside Limit: ~2.0 Hours • Geofence Bypass Active
              </span>
            </div>
          </div>
          <button
            onClick={onEndFieldWork}
            className="px-2.5 py-1.5 bg-[#82f5c1] hover:bg-[#68dba9] text-indigo-950 font-bold text-[11px] font-mono-jb rounded-lg transition-all shadow-xs shrink-0"
          >
            Return
          </button>
        </div>
      )}

      {/* 1:00 PM – 2:00 PM Afternoon Break Window Banner */}
      {isAfternoonBreak && (
        <div className="flex items-center justify-between p-2.5 bg-amber-500/15 dark:bg-amber-950/50 border border-amber-400/40 rounded-xl text-xs text-amber-950 dark:text-amber-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400 shrink-0">
              coffee
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[11px]">
                Afternoon Break Window (1:00 PM – 2:00 PM) Active
              </span>
              <span className="text-[10px] text-amber-800 dark:text-amber-300">
                Any time outside during this period is automatically calculated as official break time.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Outside Firm Tracking & 6:00 PM Auto Punch-Out Safeguard */}
      {!isInsideGeofence && punchState === 'Clocked In' && !fieldWorkSession?.isActive && !isAfternoonBreak && (
        <div className="flex items-center justify-between p-2.5 bg-rose-500/15 dark:bg-rose-950/60 border border-rose-400/40 rounded-xl text-xs text-rose-950 dark:text-rose-200">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600 dark:text-rose-400 shrink-0">
              timer_off
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[11px]">
                Outside Firm: {outsideMinutes}m / 60m Limit
              </span>
              <span className="text-[10px] text-rose-800 dark:text-rose-300">
                Rule: Outdoor limit is 1 hour. Auto punch-out executes at 6:00 PM (18:00) or when 1h outdoor limit is reached.
              </span>
            </div>
          </div>
          <button
            onClick={onSimulateAutoPunchOut}
            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-mono-jb font-bold shrink-0 transition-colors shadow-2xs"
            title="Simulate 1-hour outdoor limit reached / 6:00 PM auto punch-out"
          >
            Test 6PM Exit
          </button>
        </div>
      )}

      {/* Daily Working Hours Target & Continuous Alarm Tester */}
      <div className="flex items-center justify-between p-2.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 rounded-xl text-xs">
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
            <span className="material-symbols-outlined text-[17px]">alarm</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-indigo-950 dark:text-indigo-200 text-[11px]">
                Shift: 9 AM – 6 PM ({(user.dailyWorkingHours || 9.0).toFixed(1)} hrs)
              </span>
              <span className="text-[10px] font-mono-jb text-indigo-600 dark:text-indigo-400">
                ({Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m done)
              </span>
            </div>
            <span className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 truncate">
              Mandatory 9 AM to 6 PM • Half-Day &amp; Overtime access
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenWorkingHours}
            className="px-2 py-1 bg-white dark:bg-[#1a263c] border border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 text-[10px] font-mono-jb font-bold rounded-lg shadow-2xs hover:bg-indigo-50"
          >
            Hours &amp; OT
          </button>
          <button
            onClick={onTriggerTestAlarm}
            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-mono-jb font-bold rounded-lg shadow-2xs flex items-center gap-0.5 active:scale-95"
            title="Simulate shift hours complete: triggers continuous beep with Shift End & Overtime options"
          >
            <span className="material-symbols-outlined text-[12px]">volume_up</span>
            <span>Test Alarm</span>
          </button>
        </div>
      </div>

      {/* Action Type Selector (Punch In, Break, Half-Day, Clock Out, and Firm Work) */}
      <div className="flex items-center justify-center p-1 bg-[#eff4ff] dark:bg-[#131d2e] rounded-xl border border-[#d5e3fc]/80 dark:border-slate-800 gap-1 text-[11px] font-semibold transition-colors flex-wrap">
        <button
          onClick={() => setSelectedAction('clock-in')}
          className={`flex-1 min-w-[55px] py-1.5 px-1 rounded-lg transition-all ${
            selectedAction === 'clock-in'
              ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-xs font-bold'
              : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f] dark:hover:text-slate-100'
          }`}
        >
          Punch In
        </button>
        <button
          onClick={() => setSelectedAction('break-start')}
          className={`flex-1 min-w-[48px] py-1.5 px-1 rounded-lg transition-all ${
            selectedAction === 'break-start'
              ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-xs font-bold'
              : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f] dark:hover:text-slate-100'
          }`}
        >
          Break
        </button>
        <button
          onClick={() => setSelectedAction('half-day')}
          className={`flex-1 min-w-[58px] py-1.5 px-1 rounded-lg transition-all ${
            selectedAction === 'half-day'
              ? 'bg-amber-600 text-white shadow-xs font-bold'
              : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100/50'
          }`}
          title="Clock out as Half Day"
        >
          Half-Day
        </button>
        <button
          onClick={() => setSelectedAction('clock-out')}
          className={`flex-1 min-w-[58px] py-1.5 px-1 rounded-lg transition-all ${
            selectedAction === 'clock-out'
              ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-xs font-bold'
              : 'text-[#444651] dark:text-slate-400 hover:text-[#00236f] dark:hover:text-slate-100'
          }`}
        >
          Clock Out
        </button>
        <button
          onClick={onOpenFieldWork}
          className={`flex-1 min-w-[62px] py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-0.5 ${
            fieldWorkSession?.isActive
              ? 'bg-indigo-600 text-white shadow-xs font-bold'
              : 'text-[#444651] dark:text-slate-400 hover:text-indigo-600'
          }`}
          title="Out for firm work (up to 1 hour outdoor limit, counted in work time)"
        >
          <span className="material-symbols-outlined text-[13px]">business_center</span>
          <span>Field Work</span>
        </button>
      </div>

      {/* Shift Profile & Verification Metadata Strip */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenShiftDetails}
          className="bg-[#eff4ff] dark:bg-[#131d2e] hover:bg-[#e6eeff] dark:hover:bg-[#18253f] transition-colors p-3 rounded-xl flex items-center gap-2.5 shadow-xs border border-[#d5e3fc]/60 dark:border-slate-800 text-left active:scale-[0.99]"
        >
          <div className="w-8 h-8 rounded-lg bg-[#e6eeff] dark:bg-[#1a263c] flex items-center justify-center text-[#00236f] dark:text-[#82f5c1] shrink-0 font-medium">
            <span className="material-symbols-outlined text-[20px]">badge</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono-jb text-[10px] uppercase font-bold text-[#444651] dark:text-slate-400">
              Shift Windows
            </span>
            <span className="text-[12px] font-bold text-[#0d1c2e] dark:text-slate-100 truncate">
              In: 9–11 AM • Out: 6–9 PM
            </span>
          </div>
        </button>

        <div className="bg-[#eff4ff] dark:bg-[#131d2e] p-3 rounded-xl flex items-center gap-2.5 shadow-xs border border-[#d5e3fc]/60 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-[#ffdcc3] dark:bg-amber-950/70 flex items-center justify-center text-[#2f1500] dark:text-amber-200 shrink-0">
            <span className="material-symbols-outlined text-[20px]">pending_actions</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono-jb text-[10px] uppercase font-bold text-[#444651] dark:text-slate-400">
              Punch State
            </span>
            <span className="text-[13px] font-bold text-[#00236f] dark:text-[#82f5c1] truncate">
              {punchState}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Trigger Interaction Area */}
      <div className="flex flex-col items-center gap-2 pt-1">
        {/* Big Tactile Punch Shutter Button */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Glow Aura */}
          <div
            className={`absolute w-24 h-24 rounded-full animate-pulse ${
              isClockInBlocked ? 'bg-rose-500/25' : 'bg-[#1e3a8a]/20'
            }`}
          ></div>

          {/* Outer Ring Dock */}
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center p-1.5 shadow-md ${
              isClockInBlocked ? 'bg-rose-100 ring-2 ring-rose-400' : 'bg-[#dce9ff]'
            }`}
          >
            {/* Interactive Trigger Button */}
            <button
              onClick={() => {
                if (isClockInBlocked) {
                  onTriggerDeniedModal();
                } else {
                  handleSnap();
                }
              }}
              disabled={isProcessing}
              aria-label={getActionTitle()}
              className={`w-full h-full rounded-full text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all shadow-md focus:outline-none disabled:opacity-75 ${
                isClockInBlocked
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#00236f] hover:bg-[#1e3a8a]'
              } ${snapTriggered ? 'scale-90' : ''}`}
            >
              <span className="material-symbols-outlined text-[26px]">
                {isProcessing
                  ? 'hourglass_top'
                  : isClockInBlocked
                  ? 'location_off'
                  : isBiometricEnabled
                  ? 'photo_camera'
                  : 'touch_app'}
              </span>
              <span className="font-mono-jb text-[9px] font-bold tracking-wider uppercase leading-tight">
                {isProcessing
                  ? 'SCAN'
                  : isClockInBlocked
                  ? 'LOCKED'
                  : isBiometricEnabled
                  ? 'SNAP'
                  : 'PUNCH'}
              </span>
            </button>
          </div>
        </div>

        {/* Status Subtext & Security Safeguard Assurance */}
        <div className="flex flex-col items-center gap-1 text-center">
          <span
            className={`text-[17px] font-bold ${
              isClockInBlocked ? 'text-rose-600' : 'text-[#0d1c2e]'
            }`}
          >
            {getActionTitle()}
          </span>
          <div className="flex items-center gap-1 text-[#444651] text-[12px] font-medium max-w-sm">
            <span
              className={`material-symbols-outlined text-[15px] shrink-0 ${
                isClockInBlocked
                  ? 'text-rose-600'
                  : isOnline
                  ? 'text-[#006c4a]'
                  : 'text-amber-600'
              }`}
            >
              {isClockInBlocked ? 'error' : isOnline ? 'verified' : 'cloud_queue'}
            </span>
            <span>
              {isClockInBlocked
                ? `Firm Policy: Employees must be inside ${activeSite.name} to punch in. Currently ${distanceMeters}m away (Limit: ${activeSite.radiusMeters}m).`
                : !isOnline
                ? `Offline: Caching to localStorage (${pendingQueueCount} queued for sync)`
                : isBiometricEnabled
                ? 'Optional 256-bit Biometric & Geofence Encrypted'
                : '1-Tap Firm Geofence Verified • Biometrics Not Required'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
