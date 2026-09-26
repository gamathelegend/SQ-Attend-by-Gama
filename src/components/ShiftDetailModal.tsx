import React from 'react';

interface ShiftDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyLateCount?: number;
  halfDaysCount?: number;
}

export const ShiftDetailModal: React.FC<ShiftDetailModalProps> = ({
  isOpen,
  onClose,
  monthlyLateCount = 1,
  halfDaysCount = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#111c30] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 text-[#0d1c2e] dark:text-slate-100 cursor-default max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">lock_clock</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#0d1c2e] dark:text-white">
                  Locked Shift Schedule
                </h3>
                <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold">
                  9 AM – 6 PM
                </span>
              </div>
              <p className="font-mono-jb text-[10px] text-slate-500 dark:text-slate-400">
                Official Company Attendance Policy
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

        {/* Locked 9 AM to 6 PM Shift Headline Card */}
        <div className="p-3.5 bg-gradient-to-br from-[#00184d] to-[#00236f] text-white rounded-2xl shadow-sm border border-blue-900/40 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-jb uppercase tracking-wider text-blue-200 font-bold">
              Mandatory Working Hours
            </span>
            <span className="text-[10px] font-mono-jb bg-[#82f5c1] text-[#00236f] font-bold px-2 py-0.5 rounded-full">
              LOCKED
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono-jb text-2xl font-bold tracking-tight text-white">
              09:00 AM – 06:00 PM
            </span>
          </div>
          <p className="text-[11px] text-blue-100/90 leading-relaxed">
            Every employee is required to work from <strong>9:00 AM at morning</strong> to <strong>6:00 PM at evening</strong> (9 hours total span, including 1-hour afternoon break from 1:00 PM – 2:00 PM).
          </p>
        </div>

        {/* LATE TIME 09:30 & MAX 3 DAYS / MONTH RULE CARD */}
        <div className="p-3.5 bg-amber-50/90 dark:bg-amber-950/40 rounded-2xl border border-amber-300 dark:border-amber-800 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-bold text-xs">
            <span className="material-symbols-outlined text-[20px] text-amber-600">warning</span>
            <span>Late Arrival Cutoff: 09:30 AM</span>
            <span className="ml-auto text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold">
              Max 3 Days / Mo
            </span>
          </div>

          <p className="text-[11px] text-amber-950/90 dark:text-amber-200 leading-relaxed">
            • <strong>Late Threshold:</strong> Entry after <strong>09:30 AM</strong> is classified as a late arrival.
            <br />
            • <strong>Grace Limit:</strong> Only <strong>3 late days</strong> are acceptable per month.
            <br />
            • <strong>Half Day Penalty:</strong> From the <strong>4th late day onward</strong> in the same month, the day is automatically calculated as a <strong>Half Day</strong> (0.5 day / 4h credited) with half-day salary deduction.
          </p>

          <div className="p-2 bg-white dark:bg-[#1a263c] rounded-xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs font-mono-jb">
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">Your Late Days Used:</span>
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${monthlyLateCount > 3 ? 'text-rose-600' : 'text-amber-700 dark:text-amber-400'}`}>
                {monthlyLateCount} / 3 Allowed
              </span>
              {monthlyLateCount > 3 && (
                <span className="text-[9px] px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold rounded">
                  HALF DAY ENFORCED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Other Policies */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-[18px] text-amber-600 mt-0.5">coffee</span>
            <div>
              <span className="font-bold text-[#0d1c2e] dark:text-white">1:00 PM – 2:00 PM Afternoon Break</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official break time. Going outside the firm perimeter during this hour is counted as authorized break without penalty.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-[18px] text-indigo-600 mt-0.5">business_center</span>
            <div>
              <span className="font-bold text-[#0d1c2e] dark:text-white">Firm Work (Off-Site Duty)</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Official outdoor assignments allow up to ~2.0 hours credited toward working time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-[18px] text-amber-600 mt-0.5">celebration</span>
            <div>
              <span className="font-bold text-[#0d1c2e] dark:text-white">Sunday Official Paid Holiday</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sundays are recognized paid holidays for all employees. 10k salary guarantees all 4 Sundays paid.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-[#1a263c] rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-[18px] text-rose-600 mt-0.5">timer_off</span>
            <div>
              <span className="font-bold text-[#0d1c2e] dark:text-white">7:00 PM Evening Auto Punch-Out</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                If an employee is outside the firm for more than 1 hour at or after 7:00 PM, system clocks them out automatically.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold font-mono-jb transition-all shadow-md active:scale-95"
        >
          Acknowledge Shift Rules
        </button>
      </div>
    </div>
  );
};
