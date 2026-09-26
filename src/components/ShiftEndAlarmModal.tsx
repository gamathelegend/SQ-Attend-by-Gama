import React, { useEffect, useState } from 'react';
import { isAlarmActive, setAlarmMuted, startShiftAlarm, stopShiftAlarm, toggleAlarmMute } from '../utils/audio';

interface ShiftEndAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmShiftEnd: () => void;
  onSetOvertime: (extraMinutes: number) => void;
  isOvertimeAlarm?: boolean;
  workingHoursTarget: number;
  completedMinutes: number;
}

const OVERTIME_PRESETS = [
  { label: '+30 Minutes', minutes: 30 },
  { label: '+1.0 Hour', minutes: 60 },
  { label: '+1.5 Hours', minutes: 90 },
  { label: '+2.0 Hours', minutes: 120 },
];

export const ShiftEndAlarmModal: React.FC<ShiftEndAlarmModalProps> = ({
  isOpen,
  onClose,
  onConfirmShiftEnd,
  onSetOvertime,
  isOvertimeAlarm = false,
  workingHoursTarget,
  completedMinutes,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showOvertimePicker, setShowOvertimePicker] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('60');

  // Trigger continuous beeping when opened
  useEffect(() => {
    if (isOpen) {
      setIsMuted(false);
      startShiftAlarm();
    } else {
      stopShiftAlarm();
    }

    return () => {
      stopShiftAlarm();
    };
  }, [isOpen]);

  // Handle hardware / keyboard volume buttons to turn off / mute beeper
  useEffect(() => {
    if (!isOpen) return;

    const handleVolumeKey = (e: KeyboardEvent) => {
      // Hardware volume keys or common keyboard volume shortcuts / 'm' / 'v'
      if (
        e.key === 'AudioVolumeDown' ||
        e.key === 'AudioVolumeUp' ||
        e.key === 'AudioVolumeMute' ||
        e.key.toLowerCase() === 'm' ||
        e.key.toLowerCase() === 'v' ||
        e.code === 'KeyM' ||
        e.code === 'KeyV'
      ) {
        e.preventDefault();
        const nextMuted = toggleAlarmMute();
        setIsMuted(nextMuted);
      }
    };

    window.addEventListener('keydown', handleVolumeKey);
    return () => window.removeEventListener('keydown', handleVolumeKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const nextMuted = toggleAlarmMute();
    setIsMuted(nextMuted);
  };

  const handleApplyOvertime = (mins: number) => {
    stopShiftAlarm();
    onSetOvertime(mins);
    setShowOvertimePicker(false);
    onClose();
  };

  const handleShiftEndClick = () => {
    stopShiftAlarm();
    onConfirmShiftEnd();
    onClose();
  };

  const completedHours = (completedMinutes / 60).toFixed(1);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          stopShiftAlarm();
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] border-2 border-amber-500/70 dark:border-amber-400/80 p-5 flex flex-col gap-4 relative overflow-hidden text-[#0d1c2e] dark:text-slate-100"
      >
        {/* Animated Warning Stripe Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 animate-pulse" />

        {/* Alarm Header & Continuous Beep Indicator */}
        <div className="flex items-start justify-between pt-1">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-[26px] animate-bounce">
                {isOvertimeAlarm ? 'more_time' : 'alarm'}
              </span>
              {!isMuted && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border border-white"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-base text-[#0d1c2e] dark:text-white leading-tight">
                  {isOvertimeAlarm ? 'Overtime Elapsed!' : 'Shift Working Hours Complete!'}
                </h3>
              </div>
              <p className="font-mono-jb text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                Target: {workingHoursTarget}h 00m • Achieved: {completedHours}h
              </p>
            </div>
          </div>

          {/* Volume button / Mute toggle */}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Alarm is Muted. Click to unmute.' : 'Beeping continuously! Click or press Volume key to silence.'}
            className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-mono-jb font-bold shrink-0 ${
              isMuted
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                : 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-xs'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
            <span className="text-[10px] hidden xs:inline">
              {isMuted ? 'Muted' : 'Beeping'}
            </span>
          </button>
        </div>

        {/* Audio Volume Button Guidance Pill */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">
              speaker_phone
            </span>
            <span className="truncate">
              Continuous alarm active • Press <strong>Volume Down/Up</strong> or <strong>M</strong> key to mute
            </span>
          </div>
          <button
            onClick={handleToggleMute}
            className="text-[10px] font-mono-jb underline font-bold ml-1 shrink-0 text-amber-800 dark:text-amber-300"
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </div>

        {!showOvertimePicker ? (
          <>
            {/* Context Message */}
            <div className="p-3 bg-slate-50 dark:bg-[#182338] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs flex flex-col gap-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                What would you like to do?
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-[12px] leading-relaxed">
                Your designated daily working hours are complete. You can punch out now to conclude your shift, or allocate overtime hours to keep working.
              </p>
            </div>

            {/* 2 Primary Action Options */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Option 1: Shift End (Punch Out) */}
              <button
                onClick={handleShiftEndClick}
                className="py-3.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-2xl font-bold transition-all shadow-md flex flex-col items-center justify-center gap-1 border border-rose-500"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                <span className="text-sm">Shift End</span>
                <span className="text-[10px] font-mono-jb text-rose-100 font-normal">
                  Punch Out Now
                </span>
              </button>

              {/* Option 2: Overtime */}
              <button
                onClick={() => setShowOvertimePicker(true)}
                className="py-3.5 px-3 bg-[#00236f] hover:bg-[#183685] active:scale-95 text-white rounded-2xl font-bold transition-all shadow-md flex flex-col items-center justify-center gap-1 border border-blue-600"
              >
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                </div>
                <span className="text-sm">Overtime</span>
                <span className="text-[10px] font-mono-jb text-blue-100 font-normal">
                  Set Extra Hours
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Overtime Hours Configuration View */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Select Overtime Duration:
              </span>
              <button
                onClick={() => setShowOvertimePicker(false)}
                className="text-[11px] text-slate-500 hover:underline flex items-center gap-0.5"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Back</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {OVERTIME_PRESETS.map((preset) => (
                <button
                  key={preset.minutes}
                  onClick={() => handleApplyOvertime(preset.minutes)}
                  className="py-2.5 px-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-indigo-950 dark:text-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-indigo-600 dark:text-indigo-400">
                    add_circle
                  </span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Minutes Input */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="10"
                  max="480"
                  step="10"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="w-full text-xs font-mono-jb p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#182338] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
                <span className="absolute right-3 top-2.5 text-[11px] text-slate-400">min</span>
              </div>
              <button
                onClick={() => {
                  const val = parseInt(customMinutes, 10);
                  if (!isNaN(val) && val > 0) {
                    handleApplyOvertime(val);
                  }
                }}
                className="py-2.5 px-4 bg-[#00236f] hover:bg-[#183685] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Set
              </button>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono-jb text-center">
              App will beep again and prompt Punch Out once overtime ends.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
