import React, { useState } from 'react';
import { GeofenceSite, ThemeMode, UserProfile } from '../types';

interface ProfileScreenProps {
  profile: UserProfile;
  sites: GeofenceSite[];
  activeSite: GeofenceSite;
  onSelectSite: (site: GeofenceSite) => void;
  onOpenSiteMap: () => void;
  onReEnrollBiometrics: () => void;
  onOpenAuth?: () => void;
  onOpenWorkingHours?: () => void;
  onOpenSalaryCustomization?: () => void;
  isBiometricEnabled: boolean;
  onToggleBiometric: (enabled: boolean) => void;
  isOnline: boolean;
  pendingQueueCount: number;
  onSyncNow: () => void;
  isSyncing: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulateOffline: () => void;
  lastSyncTime: string;
  themeMode: ThemeMode;
  onSelectThemeMode: (mode: ThemeMode) => void;
  isDark?: boolean;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  sites,
  activeSite,
  onSelectSite,
  onOpenSiteMap,
  onReEnrollBiometrics,
  onOpenAuth,
  onOpenWorkingHours,
  onOpenSalaryCustomization,
  isBiometricEnabled,
  onToggleBiometric,
  isOnline,
  pendingQueueCount,
  onSyncNow,
  isSyncing,
  isSimulatedOffline,
  onToggleSimulateOffline,
  lastSyncTime,
  themeMode,
  onSelectThemeMode,
  isDark = false,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(true);

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pb-24 gap-4">
      {/* Employee ID Badge Card */}
      <div className="relative p-5 bg-gradient-to-br from-[#00236f] via-[#102d75] to-[#1e3a8a] dark:from-[#0a1636] dark:via-[#0f214e] dark:to-[#172c63] text-white rounded-2xl shadow-md border border-blue-900/40 dark:border-blue-700/30 overflow-hidden transition-all">
        {/* Decorative Watermark Emblem */}
        <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[130px]">fingerprint</span>
        </div>

        <div className="relative z-10 flex items-start gap-4">
          {/* Avatar with Biometric Border */}
          <div className="relative w-16 h-20 rounded-xl overflow-hidden shrink-0 border-2 border-[#85f8c4] shadow-md bg-slate-800">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-[#006c4a]/90 text-[8px] font-mono-jb text-[#85f8c4] text-center font-bold py-0.5">
              VERIFIED
            </div>
          </div>

          {/* Employee Metadata */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-jb uppercase tracking-wider text-blue-200 dark:text-blue-300 font-bold">
                SQ Attend Identity
              </span>
              <span className="text-[10px] font-mono-jb text-[#85f8c4] font-bold">
                {profile.employeeId}
              </span>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5 truncate">
              {profile.name}
            </h2>
            <p className="text-xs text-blue-100 dark:text-blue-200 font-medium truncate">
              {profile.title}
            </p>
            <p className="text-[11px] text-blue-300 dark:text-blue-400 font-mono-jb mt-0.5 truncate">
              {profile.department}
            </p>
          </div>
        </div>

        {/* Biometric Status Row */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/15 dark:border-white/10 flex items-center justify-between text-xs font-mono-jb text-blue-100 dark:text-blue-200">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#85f8c4]">
              face_retouching_natural
            </span>
            <span>
              Face ID: <span className="text-[#85f8c4] font-bold">Optional</span> ({isBiometricEnabled ? 'Active' : 'Turned Off'})
            </span>
          </div>
          <button
            onClick={onReEnrollBiometrics}
            className="text-[#85f8c4] hover:underline font-bold"
          >
            Manage Biometrics
          </button>
        </div>
      </div>

      {/* Account Login & Mobile Credentials Card */}
      <div className="bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs flex flex-col gap-2.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#82f5c1]">
              badge
            </span>
            <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
              Account Credentials
            </span>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="text-xs text-[#00236f] dark:text-[#82f5c1] hover:underline font-bold flex items-center gap-1"
            >
              <span>Switch / Sign In</span>
              <span className="material-symbols-outlined text-[14px]">login</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-mono-jb text-slate-500 dark:text-slate-400 font-bold uppercase">
              Mobile Number
            </span>
            <p className="font-bold text-[#0d1c2e] dark:text-slate-100 font-mono-jb truncate text-[11px] mt-0.5">
              {profile.phone || '+1 555 234 5678'}
            </p>
          </div>
          <div className="p-2.5 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
            <span className="text-[10px] font-mono-jb text-slate-500 dark:text-slate-400 font-bold uppercase">
              Company Email
            </span>
            <p className="font-bold text-[#0d1c2e] dark:text-slate-100 font-mono-jb truncate text-[11px] mt-0.5">
              {profile.email || 'sarah.chen@sqattend.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Customizable Daily Working Hours Card */}
      <div className="bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs flex flex-col gap-2.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#82f5c1]">
              lock_clock
            </span>
            <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
              Locked Shift: 9:00 AM – 6:00 PM
            </span>
          </div>
          {onOpenWorkingHours && (
            <button
              onClick={onOpenWorkingHours}
              className="text-xs text-[#00236f] dark:text-[#82f5c1] hover:underline font-bold flex items-center gap-1"
            >
              <span>Shift Target</span>
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          )}
        </div>

        <div className="p-3 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-[#00236f] dark:text-white font-mono-jb">
                09:00 AM – 06:00 PM
              </span>
              <span className="text-[9px] font-mono-jb bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 px-1.5 py-0.2 rounded font-bold uppercase">
                Locked
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {(profile.dailyWorkingHours || 8.0).toFixed(1)}h Daily Net Work • Continuous Shift Alarm
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono-jb text-slate-400 block uppercase">Late Cutoff</span>
            <span className="text-xs font-bold font-mono-jb text-amber-700 dark:text-amber-400">
              09:30 AM
            </span>
          </div>
        </div>

        {/* Late Attendance 3-Day Rule & Half Day Warning Box */}
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs flex flex-col gap-1">
          <div className="flex items-center justify-between font-bold text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[17px] text-amber-600">warning</span>
              <span>Monthly Late Arrival Policy</span>
            </div>
            <span className={`text-[10px] font-mono-jb px-1.5 py-0.2 rounded font-bold ${
              (profile.monthlyLateArrivalsCount || 0) > 3
                ? 'bg-rose-100 text-rose-800'
                : 'bg-amber-200 text-amber-900'
            }`}>
              {(profile.monthlyLateArrivalsCount || 0)} / 3 Grace Days
            </span>
          </div>
          <p className="text-[10px] text-amber-900/80 dark:text-amber-300 leading-relaxed">
            Entry after 09:30 AM is marked Late. Only 3 late days are acceptable per month. On the 4th late day and beyond, the shift is calculated as a <strong>Half Day</strong>.
          </p>
        </div>

        {/* 1 to 2 PM Afternoon Break Policy */}
        <div className="p-2.5 bg-blue-50/80 dark:bg-[#1a263c] rounded-xl border border-blue-200/80 dark:border-slate-700/80 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-700 dark:text-amber-300 shrink-0">
            coffee
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-[#0d1c2e] dark:text-slate-100 text-xs">
              Afternoon Break: 1:00 PM – 2:00 PM
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              Outside time between 1:00 and 2:00 PM is automatically calculated as authorized break.
            </span>
          </div>
        </div>
      </div>

      {/* Salary & Sunday Official Holiday Compensation Card (In Rupees) */}
      <div className="bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs flex flex-col gap-2.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">
              payments
            </span>
            <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
              Salary &amp; Compensation (Rupees)
            </span>
          </div>
          {(profile.role === 'admin' || profile.role === 'owner') && onOpenSalaryCustomization && (
            <button
              onClick={onOpenSalaryCustomization}
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1"
            >
              <span>Customize</span>
              <span className="material-symbols-outlined text-[14px]">tune</span>
            </button>
          )}
        </div>

        {/* Salary Rate Display in Rupees */}
        <div className="p-3 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono-jb">
                ₹{(profile.monthlySalary || 10000).toLocaleString()} / month
              </span>
              {(profile.monthlySalary || 10000) === 10000 && (
                <span className="text-[9px] font-mono-jb bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  10k Base
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-jb mt-0.5">
              ₹{((profile.monthlySalary || 10000) / 26).toFixed(2)}/day • ₹{((profile.monthlySalary || 10000) / (26 * (profile.dailyWorkingHours || 8.0))).toFixed(2)}/hr
            </span>
          </div>
          {(profile.role === 'admin' || profile.role === 'owner') && onOpenSalaryCustomization && (
            <button
              onClick={onOpenSalaryCustomization}
              className="px-2.5 py-1 text-[11px] font-mono-jb font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-2xs"
            >
              Adjust
            </button>
          )}
        </div>

        {/* Sunday Official Holiday Notice Card */}
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 text-xs flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0">
            celebration
          </span>
          <div className="flex flex-col">
            <div className="flex items-center gap-1 font-bold text-amber-950 dark:text-amber-200 text-xs">
              <span>Sunday is Official Company Holiday</span>
              <span className="text-[9px] font-mono-jb bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded uppercase font-bold">
                Paid Rest
              </span>
            </div>
            <span className="text-[10px] text-amber-900/80 dark:text-amber-300">
              Monthly compensation in Rupees is computed across 26 days with all 4 calendar Sundays fully paid.
            </span>
          </div>
        </div>
      </div>

      {/* Display & Dark Mode Preferences */}
      <div className="flex flex-col gap-3 bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#82f5c1]">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
              Display &amp; Dark Mode
            </span>
          </div>
          <span
            className={`text-[10px] font-mono-jb font-bold px-2 py-0.5 rounded ${
              isDark
                ? 'bg-[#82f5c1]/20 text-[#85f8c4] border border-[#82f5c1]/30'
                : 'bg-[#e6eeff] text-[#00236f]'
            }`}
          >
            {isDark ? 'Dark Theme Active' : 'Light Theme Active'}
          </span>
        </div>

        {/* Primary Dark Mode Switch */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80 transition-colors shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                isDark ? 'bg-[#82f5c1]/15 text-[#85f8c4]' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'nightlight' : 'wb_sunny'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0d1c2e] dark:text-slate-100">Dark Mode</span>
                <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  OLED Low Glare
                </span>
              </div>
              <span className="text-[11px] text-[#444651] dark:text-slate-300">
                Reduced eye strain during morning 9–11 AM and evening 6–9 PM shifts.
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Toggle Dark Mode"
            onClick={() => onSelectThemeMode(isDark ? 'light' : 'dark')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isDark ? 'bg-[#82f5c1]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#060913] shadow ring-0 transition duration-200 ease-in-out ${
                isDark ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 3-Way Segmented Theme Selector (Light, Dark, System) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/70 dark:bg-[#0f172a] rounded-xl border border-slate-200/90 dark:border-slate-800">
          <button
            onClick={() => onSelectThemeMode('light')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              themeMode === 'light'
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">light_mode</span>
            <span>Light</span>
          </button>
          <button
            onClick={() => onSelectThemeMode('dark')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              themeMode === 'dark'
                ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">dark_mode</span>
            <span>Dark</span>
          </button>
          <button
            onClick={() => onSelectThemeMode('system')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              themeMode === 'system'
                ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">brightness_auto</span>
            <span>Auto</span>
          </button>
        </div>
      </div>

      {/* Assigned Geofence Sites */}
      <div className="flex flex-col gap-2 bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#006c4a] dark:text-[#82f5c1]">
              share_location
            </span>
            <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
              Authorized Geofence Sites
            </span>
          </div>
          <button
            onClick={onOpenSiteMap}
            className="text-xs text-[#00236f] dark:text-[#85f8c4] hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>View Radar</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {sites.map(site => {
            const isActive = site.id === activeSite.id;
            return (
              <div
                key={site.id}
                onClick={() => onSelectSite(site)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isActive
                    ? 'bg-white dark:bg-[#1a263c] border-[#00236f] dark:border-[#82f5c1] shadow-xs'
                    : 'bg-white/70 dark:bg-[#162136] border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-[#1a263c]'
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono-jb text-[11px] font-bold text-[#00236f] dark:text-[#85f8c4]">
                      {site.code}
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[13px] font-bold text-[#0d1c2e] dark:text-slate-100 truncate">
                      {site.name}
                    </span>
                    {isActive && (
                      <span className="bg-[#82f5c1]/30 text-[#006c4a] dark:text-[#85f8c4] text-[10px] font-mono-jb font-bold px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#444651] dark:text-slate-300 truncate mt-0.5">
                    {site.zone}
                  </span>
                  <span className="text-[10px] font-mono-jb text-slate-400 dark:text-slate-400 mt-0.5">
                    Radius: {site.radiusMeters}m · GPS ±3.8m
                  </span>
                </div>

                <div className="shrink-0 ml-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive
                        ? 'border-[#00236f] bg-[#00236f] dark:border-[#82f5c1] dark:bg-[#82f5c1]'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {isActive && <div className="w-2 h-2 rounded-full bg-white dark:bg-[#060913]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift Window Policy & Grace Period */}
      <div className="bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs flex flex-col gap-2 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
            Shift &amp; Attendance Policy
          </span>
          <span className="text-[10px] font-mono-jb text-slate-500 dark:text-slate-400 font-bold uppercase">
            Active Schedule
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-mono-jb text-emerald-800 dark:text-emerald-400 uppercase font-bold">
                Morning Entry
              </span>
            </div>
            <p className="font-bold text-[#0d1c2e] dark:text-slate-100 text-sm mt-0.5 font-mono-jb">09:00 – 11:00 AM</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">2-hour clock-in window</p>
          </div>
          <div className="p-2.5 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="text-[10px] font-mono-jb text-blue-800 dark:text-blue-300 uppercase font-bold">
                Evening Exit
              </span>
            </div>
            <p className="font-bold text-[#00236f] dark:text-[#82f5c1] text-sm mt-0.5 font-mono-jb">06:00 – 09:00 PM</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">3-hour checkout window</p>
          </div>
        </div>
        <div className="p-2.5 bg-purple-50/90 dark:bg-purple-950/40 rounded-xl border border-purple-200/80 dark:border-purple-850/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-purple-700 dark:text-purple-300">all_inclusive</span>
            <div className="flex flex-col">
              <span className="font-bold text-purple-950 dark:text-purple-200 text-xs">Enter Any Time • Exit Any Time</span>
              <span className="text-[10px] text-purple-900/80 dark:text-purple-300/80">Open 24/7 punch policy • Zero lockout</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 text-[10px] font-mono-jb font-bold uppercase">
            Active
          </span>
        </div>
      </div>

      {/* Security & Device Controls */}
      <div className="bg-[#eff4ff] dark:bg-[#131d2e] p-3.5 rounded-2xl border border-[#d5e3fc]/80 dark:border-slate-800 shadow-xs flex flex-col gap-3 transition-colors">
        <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#0d1c2e] dark:text-slate-100">
          Security &amp; Device Settings
        </span>

        {/* Optional Biometric Face ID Verification Toggle */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isBiometricEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-[#006c4a] dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isBiometricEnabled ? 'face' : 'no_accounts'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0d1c2e] dark:text-slate-100">Face ID Biometric Verification</span>
                <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                  Optional
                </span>
              </div>
              <span className="text-[11px] text-[#444651] dark:text-slate-300">
                {isBiometricEnabled
                  ? 'Active: Snap selfie mesh on punch.'
                  : 'Turned off: Instant 1-tap punch via GPS Geofence.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isBiometricEnabled}
            aria-label="Toggle Face ID Biometric Verification"
            onClick={() => onToggleBiometric(!isBiometricEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isBiometricEnabled ? 'bg-[#00236f] dark:bg-[#82f5c1]' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#060913] shadow ring-0 transition duration-200 ease-in-out ${
                isBiometricEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#82f5c1]">
              volume_up
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#0d1c2e] dark:text-slate-100">Camera Shutter Sound</span>
              <span className="text-[10px] text-[#444651] dark:text-slate-300">Mechanical shutter audio on snap</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={e => setSoundEnabled(e.target.checked)}
            className="w-4 h-4 text-[#00236f] dark:accent-[#82f5c1] rounded cursor-pointer"
          />
        </div>

        {/* Haptics Toggle */}
        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#82f5c1]">
              vibration
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#0d1c2e] dark:text-slate-100">Haptic Feedback</span>
              <span className="text-[10px] text-[#444651] dark:text-slate-300">Tactile pulse on snap &amp; confirm</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={hapticsEnabled}
            onChange={e => setHapticsEnabled(e.target.checked)}
            className="w-4 h-4 text-[#00236f] dark:accent-[#82f5c1] rounded cursor-pointer"
          />
        </div>

        {/* Offline Simulation Toggle */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isSimulatedOffline
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'bg-blue-50 dark:bg-blue-950/50 text-[#00236f] dark:text-[#82f5c1]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSimulatedOffline ? 'wifi_off' : 'wifi'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0d1c2e] dark:text-slate-100">Simulate Offline Mode</span>
                <span
                  className={`text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded font-bold border ${
                    isSimulatedOffline
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {isSimulatedOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              <span className="text-[11px] text-[#444651] dark:text-slate-300">
                {isSimulatedOffline
                  ? 'Test offline mode: Punches cache locally in localStorage.'
                  : 'Punches sync directly to cloud on creation.'}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isSimulatedOffline}
            aria-label="Toggle Offline Mode"
            onClick={onToggleSimulateOffline}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSimulatedOffline ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-[#060913] shadow ring-0 transition duration-200 ease-in-out ${
                isSimulatedOffline ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Offline Cache & localStorage Sync Status */}
        <div className="flex items-center justify-between p-3 bg-white dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                pendingQueueCount > 0
                  ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-[#006c4a] dark:text-[#82f5c1]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {pendingQueueCount > 0 ? 'cloud_queue' : 'cloud_done'}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#0d1c2e] dark:text-slate-100">Audit Log Sync</span>
                <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
                  localStorage
                </span>
              </div>
              <span className="text-[11px] text-[#444651] dark:text-slate-300 truncate">
                {pendingQueueCount > 0
                  ? `${pendingQueueCount} punch${pendingQueueCount > 1 ? 'es' : ''} queued in localStorage`
                  : lastSyncTime}
              </span>
            </div>
          </div>
          <button
            onClick={onSyncNow}
            disabled={isSyncing || (!isOnline && pendingQueueCount === 0)}
            className="px-3 py-1.5 text-xs font-bold bg-[#00236f] dark:bg-[#1e3a8a] hover:bg-[#1e3a8a] dark:hover:bg-[#254ab3] text-white rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shrink-0 shadow-xs"
          >
            <span className={`material-symbols-outlined text-[14px] ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
