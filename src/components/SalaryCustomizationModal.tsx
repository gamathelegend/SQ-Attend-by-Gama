import React, { useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface SalaryCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: UserProfile[];
  targetEmployee?: UserProfile | null;
  onUpdateSalary: (employeeId: string, newSalary: number) => void;
  currentUserRole?: 'admin' | 'owner' | 'employee';
}

const PRESET_SALARIES = [10000, 12000, 15000, 18000, 20000, 25000];

export const SalaryCustomizationModal: React.FC<SalaryCustomizationModalProps> = ({
  isOpen,
  onClose,
  employees,
  targetEmployee,
  onUpdateSalary,
  currentUserRole = 'admin',
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    targetEmployee?.employeeId || employees[0]?.employeeId || ''
  );

  useEffect(() => {
    if (targetEmployee) {
      setSelectedEmpId(targetEmployee.employeeId);
      setSalaryInput(String(targetEmployee.monthlySalary || 10000));
    } else if (employees.length > 0) {
      const first = employees[0];
      setSelectedEmpId(first.employeeId);
      setSalaryInput(String(first.monthlySalary || 10000));
    }
  }, [targetEmployee, isOpen, employees]);

  const selectedEmp = employees.find(e => e.employeeId === selectedEmpId) || employees[0];

  const [salaryInput, setSalaryInput] = useState<string>(
    String(selectedEmp?.monthlySalary || 10000)
  );

  if (!isOpen) return null;

  const handleSelectEmployee = (empId: string) => {
    setSelectedEmpId(empId);
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setSalaryInput(String(emp.monthlySalary || 10000));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(salaryInput);
    if (!isNaN(num) && num > 0 && selectedEmp) {
      onUpdateSalary(selectedEmp.employeeId, num);
      onClose();
    }
  };

  const currentSalaryNum = parseFloat(salaryInput) || 10000;
  // 26 working days (Sundays are official paid holidays)
  const dailyRate = (currentSalaryNum / 26).toFixed(2);
  const hourlyRate = (currentSalaryNum / (26 * (selectedEmp?.dailyWorkingHours || 8.0))).toFixed(2);

  const canEdit = currentUserRole === 'admin' || currentUserRole === 'owner';

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
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm text-[#0d1c2e] dark:text-white">
                  Salary Management
                </h3>
                <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                  {currentUserRole?.toUpperCase()} CLEARANCE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono-jb">
                Admin & Owner Customization Portal
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

        {/* Sunday Official Holiday Notice Card */}
        <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
            <span className="material-symbols-outlined text-[17px] text-amber-600">
              celebration
            </span>
            <span>Sunday is Official Company Holiday</span>
            <span className="ml-auto text-[9px] font-mono-jb bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.2 rounded uppercase font-bold">
              Paid Rest Day
            </span>
          </div>
          <p className="text-[11px] text-amber-900/80 dark:text-amber-300 leading-relaxed">
            All Sundays are official paid holidays. Monthly salary is guaranteed across 26 working days with full paid Sunday rest days included.
          </p>
        </div>

        {/* Employee Selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Employee:
          </label>
          <select
            value={selectedEmpId}
            onChange={(e) => handleSelectEmployee(e.target.value)}
            className="w-full text-xs font-mono-jb px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
          >
            {employees.map(emp => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.name} ({emp.employeeId}) • Current: ₹{(emp.monthlySalary || 10000).toLocaleString()}
              </option>
            ))}
          </select>
        </div>

        {/* Rate Breakdown Telemetry Card */}
        <div className="p-3.5 bg-slate-50 dark:bg-[#18253f] rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Base Monthly Compensation
            </span>
            <span className="text-base font-bold font-mono-jb text-emerald-700 dark:text-emerald-400">
              ₹{currentSalaryNum.toLocaleString()} / mo
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono-jb">
            <div>
              <span className="text-slate-400 text-[9px] uppercase">Daily Pro-Rated Rate</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">₹{dailyRate} / day</p>
            </div>
            <div>
              <span className="text-slate-400 text-[9px] uppercase">Calculated Hourly</span>
              <p className="font-bold text-slate-800 dark:text-slate-200">₹{hourlyRate} / hr</p>
            </div>
          </div>
        </div>

        {/* Quick 10k / 12k / 15k / 20k Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Quick Salary Tiers (Rupees):
          </label>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_SALARIES.map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setSalaryInput(String(val))}
                className={`py-2 px-1 text-xs font-mono-jb font-bold rounded-xl border transition-all active:scale-95 ${
                  currentSalaryNum === val
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-[#162238] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                ₹{val / 1000}k {val === 10000 && '(Default)'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Salary Input Form */}
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Customize Monthly Salary Amount (₹ Rupees):
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm font-bold text-slate-400 font-mono-jb">₹</span>
              <input
                type="number"
                step="500"
                min="1000"
                max="5000000"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                disabled={!canEdit}
                placeholder="10000"
                className="w-full pl-8 pr-3 py-2 text-xs font-mono-jb font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canEdit}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[17px]">check_circle</span>
              <span>Update Salary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
