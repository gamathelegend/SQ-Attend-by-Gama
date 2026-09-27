import React, { useState } from 'react';
import { UserProfile } from '../types';

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onSaveWorkingHours: (hours: number) => void;
  onTriggerTestAlarm: () => void;
  completedMinutes: number;
}

const PRESET_HOURS = [4.5, 8.0, 9.0, 10.0, 11.0, 12.0];

export const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({
  isOpen,
  onClose,
  user,
  onSaveWorkingHours,
  onTriggerTestAlarm,
  completedMinutes,
}) => {
  const [selectedHours, setSelectedHours] = useState<number>(user.dailyWorkingHours || 8.0);
  const [customInput, setCustomInput] = useState<string>(String(user.dailyWorkingHours || 8.0));

  if (!isOpen) return null;

  const handleSelectPreset = (h: number) => {
    setSelectedHours(h);
    setCustomInput(String(h));
  };

  const handleSave = () => {
    const val = parseFloat(customInput);
    if (!isNaN(val) && val > 0 && val <= 24) {
      onSaveWorkingHours(val);
      onClose();
    }
  };

  const targetMinutes = selectedHours * 60;
  const progressPercent = Math.min(100, (completedMinutes / targetMinutes) * 100);
  const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#111c30] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 cursor-default text-[#0d1c2e] dark:text-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px] text-[#82f5c1]">schedule</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0d1c2e] dark:text-white">
                Employee Working Hours
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-jb">
                Customizable Daily Shift Target
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Current Progress Card */}
        <div className="p-3.5 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
              Today's Shift Progress
            </span>
            <span className="text-xs font-mono-jb font-bold text-[#00236f] dark:text-[#82f5c1]">
              {Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m / {selectedHours}h
            </span>
          </div>
          <div className="w-full bg-blue-200/70 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00236f] dark:bg-[#82f5c1] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono-jb text-blue-900 dark:text-blue-300">
            <span>Progress: {progressPercent.toFixed(0)}%</span>
            <span>
              {remainingMinutes > 0
                ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m remaining`
                : 'Target reached! Alarm ready'}
            </span>
          </div>
        </div>

        {/* Afternoon Break Policy Note: 1:00 PM to 2:00 PM */}
        <div className="p-3 bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
            <span className="material-symbols-outlined text-[17px] text-amber-600 dark:text-amber-400">
              coffee
            </span>
            <span>Daily Afternoon Break: 1:00 PM – 2:00 PM</span>
          </div>
          <p className="text-[11px] text-amber-900/80 dark:text-amber-300 leading-relaxed">
            Every employee has designated break time from 1:00 to 2:00 PM. Any time spent outside during this window is automatically calculated as official break time.
          </p>
        </div>

        {/* Hour Presets */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Shift Target &amp; Overtime Options:
            </label>
            <span className="text-[10px] font-mono-jb text-blue-600 dark:text-blue-400 font-bold">
              Standard: 9.0h (9 AM – 6 PM)
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleSelectPreset(h)}
                className={`py-2 px-1 text-xs font-mono-jb font-bold rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center ${
                  selectedHours === h
                    ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white border-[#00236f] shadow-xs'
                    : 'bg-slate-50 dark:bg-[#162238] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{h.toFixed(1)} hrs</span>
                <span className="text-[9px] opacity-80 font-normal">
                  {h === 4.5 ? 'Half-Day' : h === 9.0 ? 'Full Shift' : h > 9.0 ? `+${(h - 9).toFixed(1)}h OT` : 'Flexible'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              step="0.25"
              min="1"
              max="24"
              value={customInput}
              onChange={(e) => {
                setCustomInput(e.target.value);
                const p = parseFloat(e.target.value);
                if (!isNaN(p)) setSelectedHours(p);
              }}
              className="w-full text-xs font-mono-jb px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
              placeholder="Custom hours"
            />
            <span className="absolute right-3 top-2 text-[11px] text-slate-400">hours/day</span>
          </div>
        </div>

        {/* Save button & Test Alarm Button */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-[#00236f] hover:bg-[#183685] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">save</span>
            <span>Save Working Hours Target</span>
          </button>

          {/* Test Shift End Alarm Button */}
          <button
            onClick={() => {
              onClose();
              onTriggerTestAlarm();
            }}
            className="w-full py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">alarm</span>
            <span>Test Shift End Alarm & Options</span>
          </button>
        </div>
      </div>
    </div>
  );
};
