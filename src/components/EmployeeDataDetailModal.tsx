import React, { useMemo, useState } from 'react';
import { GeofenceSite, PunchRecord, UserProfile } from '../types';

interface EmployeeDataDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: UserProfile | null;
  allPunches: PunchRecord[];
  activeSite: GeofenceSite;
  onCustomizeSalary: (emp: UserProfile) => void;
  onSwitchToEmployee: (emp: UserProfile) => void;
  currentUserRole?: 'admin' | 'owner' | 'employee';
}

export const EmployeeDataDetailModal: React.FC<EmployeeDataDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  allPunches,
  activeSite,
  onCustomizeSalary,
  onSwitchToEmployee,
  currentUserRole = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'punches' | 'compensation'>('overview');

  const employeePunches = useMemo(() => {
    if (!employee) return [];
    return allPunches.filter(p => p.employeeId === employee.employeeId);
  }, [employee, allPunches]);

  if (!isOpen || !employee) return null;

  const monthlySalary = employee.monthlySalary || 10000;
  // 26 working days (Sundays are official company paid holidays)
  const dailyRate = (monthlySalary / 26).toFixed(2);
  const hourlyRate = (monthlySalary / (26 * (employee.dailyWorkingHours || 8.0))).toFixed(2);

  const canEditSalary = currentUserRole === 'admin' || currentUserRole === 'owner';

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 text-[#0d1c2e] dark:text-slate-100 cursor-default max-h-[92vh] overflow-y-auto no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs shrink-0">
              <span className="material-symbols-outlined text-[20px]">badge</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-sm text-[#0d1c2e] dark:text-white truncate">
                  Employee Master Record
                </h3>
                <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-[#00236f] dark:text-[#82f5c1] font-bold">
                  ADMIN AUDIT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-jb truncate">
                Full Profile &amp; Timesheet Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Employee Identity Card */}
        <div className="p-4 bg-gradient-to-br from-[#00236f] via-[#102d75] to-[#1e3a8a] dark:from-[#0a1636] dark:via-[#0f214e] dark:to-[#172c63] text-white rounded-2xl shadow-md flex items-center gap-3.5">
          <img
            src={employee.avatarUrl}
            alt={employee.name}
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#82f5c1] shadow-sm shrink-0"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-base font-bold truncate">{employee.name}</span>
              <span className="text-[10px] font-mono-jb bg-white/20 text-[#82f5c1] px-1.5 py-0.5 rounded font-bold shrink-0">
                {employee.employeeId}
              </span>
            </div>
            <span className="text-xs text-blue-200 truncate">{employee.title}</span>
            <span className="text-[11px] text-blue-300 font-mono-jb truncate">
              {employee.department}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold font-mono-jb">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-[#1e293b] text-[#00236f] dark:text-[#82f5c1] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('compensation')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'compensation'
                ? 'bg-white dark:bg-[#1e293b] text-[#00236f] dark:text-[#82f5c1] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Salary ($10k)
          </button>
          <button
            onClick={() => setActiveTab('punches')}
            className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
              activeTab === 'punches'
                ? 'bg-white dark:bg-[#1e293b] text-[#00236f] dark:text-[#82f5c1] shadow-2xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Logs ({employeePunches.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & CONTACT CREDENTIALS */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-3">
            {/* Contact & Auth Telemetry */}
            <div className="p-3 bg-slate-50 dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                Contact &amp; Authentication Credentials
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono-jb">
                <div className="flex flex-col p-2 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase">Mobile Phone</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {employee.phone || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col p-2 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase">Email Address</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {employee.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Shift & Daily Working Hours Target */}
            <div className="p-3 bg-slate-50 dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                  Locked Shift Schedule
                </span>
                <span className="text-xs font-mono-jb font-bold text-[#00236f] dark:text-[#82f5c1]">
                  09:00 AM – 06:00 PM (Locked)
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono-jb">
                Official Shift: 9:00 AM – 6:00 PM • Late Cutoff: 09:30 AM
              </p>
              
              {/* Monthly Late Arrivals & Half Day Counter */}
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between text-xs font-mono-jb">
                <span className="text-amber-950 dark:text-amber-200 font-bold">
                  Monthly Late Days:
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={`font-bold ${(employee.monthlyLateArrivalsCount || 0) > 3 ? 'text-rose-600' : 'text-amber-800 dark:text-amber-300'}`}>
                    {employee.monthlyLateArrivalsCount || 0} / 3 Acceptable
                  </span>
                  {(employee.monthlyLateArrivalsCount || 0) > 3 && (
                    <span className="text-[9px] px-1 bg-rose-100 text-rose-800 font-bold rounded">
                      HALF DAY PENALTY
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60 text-[11px] font-mono-jb">
                <span className="text-slate-500">Weekly Target: {employee.weeklyTargetHours}h</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Completed: {employee.hoursCompletedThisWeek}h
                </span>
              </div>
            </div>

            {/* Biometric & Geofence Security Rules */}
            <div className="p-3 bg-slate-50 dark:bg-[#1e293b]/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
              <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                Security &amp; Biometric Audit Trail
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-jb">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase">Biometric Mesh</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {employee.biometricConfidence}% Confidence
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-400 uppercase">Geofence Policy</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    Firm Perimeter Enforced
                  </span>
                </div>
              </div>
              <div className="text-[9px] font-mono-jb text-slate-400 truncate pt-1 border-t border-slate-200 dark:border-slate-700/60">
                Enrollment Hash: {employee.biometricHash || 'SHA256-standard-key-v1'}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SALARY & COMPENSATION (₹10k BASE IN RUPEES + SUNDAY HOLIDAY) */}
        {activeTab === 'compensation' && (
          <div className="flex flex-col gap-3">
            {/* Compensation Card in Rupees */}
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  Monthly Base Compensation (Rupees)
                </span>
                <span className="text-xl font-bold font-mono-jb text-emerald-800 dark:text-emerald-300">
                  ₹{monthlySalary.toLocaleString()} / mo
                </span>
              </div>
              {monthlySalary === 10000 && (
                <span className="inline-flex text-[10px] font-mono-jb font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full w-max">
                  ✓ Standard Company ₹10k Base Salary
                </span>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs font-mono-jb">
                <div>
                  <span className="text-[9px] text-emerald-800/70 dark:text-emerald-400 uppercase">
                    Daily Rate (26 Days)
                  </span>
                  <p className="font-bold text-emerald-950 dark:text-emerald-100">
                    ₹{dailyRate} / day
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-800/70 dark:text-emerald-400 uppercase">
                    Calculated Hourly
                  </span>
                  <p className="font-bold text-emerald-950 dark:text-emerald-100">
                    ₹{hourlyRate} / hr
                  </p>
                </div>
              </div>
            </div>

            {/* Sunday Official Holiday Notice */}
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex flex-col gap-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                <span className="material-symbols-outlined text-[18px] text-amber-600">
                  celebration
                </span>
                <span>Sunday Official Company Holiday</span>
                <span className="ml-auto text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold">
                  Paid Rest Day
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300 leading-relaxed">
                Sundays are recognized as official paid rest days for all employees. {employee.name}'s monthly salary of ₹{monthlySalary.toLocaleString()} guarantees 100% full pay across all calendar Sundays.
              </p>
            </div>

            {/* Admin Customization Action */}
            {canEditSalary && (
              <button
                onClick={() => {
                  onClose();
                  onCustomizeSalary(employee);
                }}
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs font-mono-jb rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">tune</span>
                <span>Customize {employee.name}'s Salary (in Rupees)</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: PUNCH AUDIT LOGS FOR THIS EMPLOYEE */}
        {activeTab === 'punches' && (
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto no-scrollbar">
            {employeePunches.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-mono-jb">
                No recorded punches for this employee yet.
              </div>
            ) : (
              employeePunches.map(p => (
                <div
                  key={p.id}
                  className="p-2.5 bg-slate-50 dark:bg-[#1e293b]/70 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0d1c2e] dark:text-white capitalize">
                      {p.type.replace('-', ' ')}
                    </span>
                    <span className="text-[10px] font-mono-jb text-slate-400">
                      {p.dateFormatted} • {p.timeFormatted}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono-jb text-slate-500">
                    <span className="truncate">{p.siteName}</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      {p.statusTag}
                    </span>
                  </div>
                  {p.isAutoPunchOut && (
                    <div className="text-[9px] text-rose-600 dark:text-rose-400 font-mono-jb bg-rose-50 dark:bg-rose-950/40 p-1 rounded">
                      Auto exit: {p.autoPunchReason}
                    </div>
                  )}
                  {p.isFieldWork && (
                    <div className="text-[9px] text-indigo-600 dark:text-indigo-400 font-mono-jb bg-indigo-50 dark:bg-indigo-950/40 p-1 rounded">
                      Field work: {p.fieldWorkPurpose} (~2h limit)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              onClose();
              onSwitchToEmployee(employee);
            }}
            className="flex-1 py-2.5 bg-[#00236f] hover:bg-[#1e3a8a] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">switch_account</span>
            <span>Switch to {employee.name}'s Portal</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
