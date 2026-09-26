import React, { useState } from 'react';
import { PunchRecord, PunchType } from '../types';

interface HistoryScreenProps {
  punches: PunchRecord[];
  onSelectPunch: (punch: PunchRecord) => void;
  onOpenExport: () => void;
  pendingQueueCount: number;
  onSyncNow: () => void;
  isSyncing: boolean;
  isOnline: boolean;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  punches,
  onSelectPunch,
  onOpenExport,
  pendingQueueCount,
  onSyncNow,
  isSyncing,
  isOnline,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(3); // Default Thu (today)

  const daysOfWeek = [
    { day: 'Mon', date: '21', hours: '8.2h', isTarget: true },
    { day: 'Tue', date: '22', hours: '8.0h', isTarget: true },
    { day: 'Wed', date: '23', hours: '8.4h', isTarget: true },
    { day: 'Thu', date: '24', hours: '7.2h', isToday: true },
    { day: 'Fri', date: '25', hours: '8.0h', isTarget: true },
    { day: 'Sat', date: '26', hours: '4.0h', isHalfDay: true },
    { day: 'Sun', date: '27', hours: 'OFF', isHoliday: true },
  ];

  const filteredPunches = punches.filter(p => {
    if (filterType === 'all') return true;
    if (filterType === 'in') return p.type === 'clock-in';
    if (filterType === 'out') return p.type === 'clock-out';
    if (filterType === 'break') return p.type === 'break-start' || p.type === 'break-end';
    return true;
  });

  const getPunchTypeDetails = (type: PunchType) => {
    switch (type) {
      case 'clock-in':
        return {
          label: 'Clock In',
          icon: 'login',
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-700',
        };
      case 'clock-out':
        return {
          label: 'Clock Out',
          icon: 'logout',
          bgColor: 'bg-blue-50 text-blue-800 border-blue-200',
          iconColor: 'text-blue-700',
        };
      case 'break-start':
        return {
          label: 'Break Start',
          icon: 'coffee',
          bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
          iconColor: 'text-amber-700',
        };
      case 'break-end':
        return {
          label: 'Break End',
          icon: 'play_arrow',
          bgColor: 'bg-teal-50 text-teal-800 border-teal-200',
          iconColor: 'text-teal-700',
        };
      case 'auto-clock-out':
        return {
          label: 'Auto Clock Out',
          icon: 'timer_off',
          bgColor: 'bg-rose-50 text-rose-800 border-rose-200',
          iconColor: 'text-rose-700',
        };
      case 'field-work-start':
        return {
          label: 'Field Work Out',
          icon: 'business_center',
          bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          iconColor: 'text-indigo-700',
        };
      case 'field-work-end':
        return {
          label: 'Field Work Return',
          icon: 'domain_verification',
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          iconColor: 'text-emerald-700',
        };
      default:
        return {
          label: 'Punch Record',
          icon: 'fingerprint',
          bgColor: 'bg-slate-50 text-slate-800 border-slate-200',
          iconColor: 'text-slate-700',
        };
    }
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pb-24 gap-4">
      {/* Weekly Timesheet Summary Card */}
      <div className="p-4 bg-gradient-to-br from-[#00236f] to-[#1e3a8a] text-white rounded-2xl shadow-sm border border-blue-900/30">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono-jb text-[11px] uppercase tracking-wider text-blue-200 font-bold">
              Current Pay Period • Week 39
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono-jb text-3xl font-bold tracking-tight text-white">
                31.8
              </span>
              <span className="text-blue-200 text-sm font-medium">/ 40.0 hrs target</span>
            </div>
          </div>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 active:scale-95 transition-all rounded-lg text-xs font-semibold backdrop-blur-sm border border-white/20"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden mt-3">
          <div className="bg-[#85f8c4] h-full rounded-full transition-all" style={{ width: '79.5%' }} />
        </div>

        {/* Bottom Key Metas */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs font-mono-jb text-blue-100">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-[#85f8c4]">check_circle</span>
            <span>98.5% Punctuality</span>
          </div>
          <span>3 Days Logged</span>
        </div>
      </div>

      {/* Week Day Horizontal Scrubber */}
      <div className="flex items-center justify-between gap-1 p-1 bg-[#eff4ff] dark:bg-[#131d2e] rounded-xl border border-[#d5e3fc]/80 dark:border-slate-800">
        {daysOfWeek.map((item, idx) => {
          const isSelected = selectedDayIndex === idx;
          return (
            <button
              key={item.day}
              onClick={() => setSelectedDayIndex(idx)}
              className={`flex-1 py-1.5 px-0.5 rounded-lg flex flex-col items-center gap-0.5 transition-all ${
                isSelected
                  ? 'bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-xs font-bold'
                  : item.isHoliday
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/60'
                  : 'text-[#444651] dark:text-slate-400 hover:bg-white/60'
              }`}
            >
              <span className={`text-[9px] font-mono-jb uppercase tracking-wider ${item.isHoliday ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}`}>
                {item.day}
              </span>
              <span className="text-[13px] leading-tight font-bold">{item.date}</span>
              <span
                className={`text-[8px] font-mono-jb font-bold ${
                  item.isHoliday
                    ? 'text-amber-600 dark:text-amber-400'
                    : isSelected
                    ? 'text-[#85f8c4]'
                    : 'text-slate-400'
                }`}
              >
                {item.isHoliday ? 'HOLIDAY' : item.hours}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sunday Official Holiday Notice Banner */}
      <div className="p-2.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[17px] text-amber-600 dark:text-amber-400">celebration</span>
          <span className="text-[11px] text-amber-950 dark:text-amber-200 font-medium">
            <strong>Sunday: Official Company Holiday</strong> • Paid Weekly Rest Day for all employees
          </span>
        </div>
        <span className="text-[9px] font-mono-jb bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
          PAID
        </span>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {[
          { id: 'all', label: 'All Punches' },
          { id: 'in', label: 'Clock In' },
          { id: 'break', label: 'Breaks' },
          { id: 'out', label: 'Clock Out' },
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterType(filter.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              filterType === filter.id
                ? 'bg-[#00236f] text-white shadow-xs'
                : 'bg-[#eff4ff] text-[#444651] hover:bg-[#e6eeff]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Pending Sync Queue Alert Banner */}
      {pendingQueueCount > 0 && (
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">cloud_queue</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-amber-950">
                {pendingQueueCount} Offline Punch{pendingQueueCount > 1 ? 'es' : ''} Cached
              </span>
              <span className="text-[10px] text-amber-800 truncate">
                Saved in localStorage • Queued for cloud upload
              </span>
            </div>
          </div>
          <button
            onClick={onSyncNow}
            disabled={isSyncing || !isOnline}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-mono-jb text-[11px] font-bold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
          >
            <span className={`material-symbols-outlined text-[15px] ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Syncing...' : isOnline ? 'Sync Now' : 'Offline'}</span>
          </button>
        </div>
      )}

      {/* Punches Timeline Feed */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider font-mono-jb text-[#444651]">
            Recorded Logs ({filteredPunches.length})
          </span>
          <span className="text-xs text-[#006c4a] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a]"></span>
            GPS &amp; Geofence Verified
          </span>
        </div>

        {filteredPunches.length === 0 ? (
          <div className="p-8 text-center bg-[#eff4ff] rounded-xl border border-dashed border-[#d5e3fc]">
            <span className="material-symbols-outlined text-[32px] text-slate-400">
              history_toggle_drop_down
            </span>
            <p className="text-sm font-semibold text-slate-700 mt-2">No records found</p>
            <p className="text-xs text-slate-500 mt-0.5">Try changing your filter settings</p>
          </div>
        ) : (
          filteredPunches.map(punch => {
            const details = getPunchTypeDetails(punch.type);
            return (
              <div
                key={punch.id}
                onClick={() => onSelectPunch(punch)}
                className="group flex items-center justify-between p-3 bg-white hover:bg-[#f8f9ff] border border-slate-200/80 hover:border-[#1e3a8a]/40 rounded-xl shadow-xs transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Verified Punch Snapshot or GPS Icon */}
                  {punch.verificationMethod === 'gps_geofence' || !punch.photoUrl ? (
                    <div className="w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-300 shadow-xs bg-[#eff4ff] flex flex-col items-center justify-center text-center p-1">
                      <span className="material-symbols-outlined text-[20px] text-[#00236f]">
                        share_location
                      </span>
                      <span className="text-[7px] font-mono-jb text-[#00236f] font-bold mt-0.5">
                        GPS
                      </span>
                    </div>
                  ) : (
                    <div className="relative w-12 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-300 shadow-xs bg-slate-900">
                      <img
                        src={punch.photoUrl}
                        alt="Verification selfie"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[8px] font-mono-jb text-emerald-300 text-center py-0.5">
                        {punch.confidence}%
                      </div>
                    </div>
                  )}

                  {/* Punch Meta */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-[#0d1c2e]">
                        {details.label}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono-jb text-[12px] font-bold text-[#00236f]">
                        {punch.timeFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-[#444651] truncate mt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-[#006c4a]">
                        pin_drop
                      </span>
                      <span className="truncate">{punch.siteName}</span>
                      <span>·</span>
                      <span className="font-mono-jb text-[10px] text-slate-500">{punch.accuracy}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono-jb text-slate-500 mt-1">
                      <span>{punch.dateFormatted}</span>
                      <span>·</span>
                      <span className="text-slate-400 truncate">{punch.hash}</span>
                    </div>
                  </div>
                </div>

                {/* Right Status Indicator */}
                <div className="flex flex-col items-end gap-1 shrink-0 pl-2">
                  <div className="flex items-center gap-1">
                    {!punch.synced && (
                      <span
                        title="Cached locally in localStorage. Awaiting cloud sync."
                        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono-jb font-bold bg-amber-100 text-amber-900 border border-amber-300"
                      >
                        <span className="material-symbols-outlined text-[11px] text-amber-700">cloud_queue</span>
                        <span>QUEUED</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono-jb font-bold px-2 py-0.5 rounded border ${
                        punch.statusTag === 'On Time'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : punch.statusTag === 'Overtime'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : punch.statusTag === 'Early'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : punch.statusTag === 'Late'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {punch.statusTag}
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-[#00236f] transition-colors">
                    chevron_right
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
