import React, { useMemo, useState } from 'react';
import { GeofenceSite, PunchRecord, UserProfile } from '../types';

interface AdminScreenProps {
  employees: UserProfile[];
  allPunches: PunchRecord[];
  activeSite: GeofenceSite;
  currentUserId?: string;
  onSwitchToEmployee: (emp: UserProfile) => void;
  onOpenAuditPunch: (punch: PunchRecord) => void;
  onOpenSalaryCustomization: (emp?: UserProfile) => void;
  onViewEmployeeDetails: (emp: UserProfile) => void;
  currentUserRole?: 'admin' | 'owner' | 'employee';
}

export const AdminScreen: React.FC<AdminScreenProps> = ({
  employees,
  allPunches,
  activeSite,
  currentUserId,
  onSwitchToEmployee,
  onOpenAuditPunch,
  onOpenSalaryCustomization,
  onViewEmployeeDetails,
  currentUserRole = 'admin',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPunchType, setSelectedPunchType] = useState('all');
  const [activeTab, setActiveTab] = useState<'roster' | 'logs' | 'policies'>('roster');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showAccessGuide, setShowAccessGuide] = useState(true);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchTerm)) ||
        (emp.email && emp.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDept =
        selectedDepartment === 'all' || emp.department === selectedDepartment;
      return matchesSearch && matchesDept;
    });
  }, [employees, searchTerm, selectedDepartment]);

  // Filtered master audit punches
  const filteredPunches = useMemo(() => {
    return allPunches.filter(p => {
      const matchesEmp =
        selectedEmployeeId === 'all' || p.employeeId === selectedEmployeeId;
      const matchesType =
        selectedPunchType === 'all' ||
        (selectedPunchType === 'in' && p.type === 'clock-in') ||
        (selectedPunchType === 'out' && (p.type === 'clock-out' || p.type === 'auto-clock-out')) ||
        (selectedPunchType === 'break' && (p.type === 'break-start' || p.type === 'break-end')) ||
        (selectedPunchType === 'field' && (p.type === 'field-work-start' || p.type === 'field-work-end')) ||
        (selectedPunchType === 'auto' && p.type === 'auto-clock-out');

      const matchesSearch =
        !searchTerm ||
        (p.employeeName && p.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.employeeId && p.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        p.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.hash.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesEmp && matchesType && matchesSearch;
    });
  }, [allPunches, selectedEmployeeId, selectedPunchType, searchTerm]);

  // Compute live workforce status numbers
  const stats = useMemo(() => {
    const totalStaff = employees.length;
    // Derive stats from latest punch of each employee
    const latestByEmp: Record<string, PunchRecord> = {};
    allPunches.forEach(p => {
      if (p.employeeId && !latestByEmp[p.employeeId]) {
        latestByEmp[p.employeeId] = p;
      }
    });

    let insideCount = 0;
    let fieldWorkCount = 0;
    let onBreakCount = 0;
    let completedCount = 0;
    let autoPunchOutCount = 0;

    Object.values(latestByEmp).forEach(p => {
      if (p.type === 'clock-in' || p.type === 'break-end' || p.type === 'field-work-end') {
        insideCount++;
      } else if (p.type === 'field-work-start') {
        fieldWorkCount++;
      } else if (p.type === 'break-start') {
        onBreakCount++;
      } else if (p.type === 'clock-out') {
        completedCount++;
      } else if (p.type === 'auto-clock-out') {
        autoPunchOutCount++;
      }
    });

    const totalPayroll = employees.reduce((sum, emp) => sum + (emp.monthlySalary || 10000), 0);

    return {
      totalStaff,
      insideCount,
      fieldWorkCount,
      onBreakCount,
      completedCount,
      autoPunchOutCount,
      totalPayroll,
    };
  }, [employees, allPunches]);

  const handleExportAllCSV = () => {
    const headers = [
      'Record ID',
      'Employee ID',
      'Employee Name',
      'Punch Type',
      'Date',
      'Time',
      'Site Name',
      'Zone',
      'GPS Accuracy',
      'Biometric Method',
      'Status Tag',
      'Is Field Work',
      'Field Purpose',
      'Is Auto Clock Out',
      'Auto Reason',
      'Monthly Salary (₹ Rupees)',
      'Security Hash',
    ];

    const rows = filteredPunches.map(p => {
      const emp = employees.find(e => e.employeeId === p.employeeId);
      const sal = emp ? emp.monthlySalary || 10000 : 10000;
      return [
        p.id,
        p.employeeId || 'N/A',
        `"${p.employeeName || 'Staff'}"`,
        p.type,
        p.dateFormatted,
        p.timeFormatted,
        `"${p.siteName}"`,
        `"${p.zone}"`,
        p.accuracy,
        p.verificationMethod || 'gps_geofence',
        p.statusTag,
        p.isFieldWork ? 'YES' : 'NO',
        `"${p.fieldWorkPurpose || ''}"`,
        p.isAutoPunchOut ? 'YES' : 'NO',
        `"${p.autoPunchReason || ''}"`,
        sal,
        p.hash,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sq_attend_all_employees_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto px-4 pb-28 gap-4">
      {/* Master Admin Header Banner */}
      <div className="p-4 bg-gradient-to-br from-[#00184d] via-[#00236f] to-[#1e3a8a] text-white rounded-3xl shadow-lg border border-blue-800/40 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[140px]">admin_panel_settings</span>
        </div>

        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-[#82f5c1]/20 px-2.5 py-0.5 rounded-full border border-[#82f5c1]/30">
              <span className="material-symbols-outlined text-[15px] text-[#82f5c1]">verified_user</span>
              <span className="text-[10px] font-mono-jb uppercase tracking-wider text-[#82f5c1] font-bold">
                Admin &amp; Owner Control Portal
              </span>
            </div>
            <span className="text-[10px] font-mono-jb text-blue-200">
              {activeSite.name}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              All Employees Master Data
            </h2>
            <p className="text-xs text-blue-100/90 mt-0.5 leading-relaxed">
              Complete access to all employee records, live GPS telemetry, timesheets, and customized 10k salaries.
            </p>
          </div>

          {/* Quick Header Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => onOpenSalaryCustomization()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-xs font-mono-jb"
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Customize Salaries</span>
            </button>
            <button
              onClick={handleExportAllCSV}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#82f5c1] hover:bg-[#68dba9] text-[#00236f] font-bold text-xs rounded-xl transition-all shadow-xs active:scale-95 font-mono-jb"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>{downloadSuccess ? 'Exported CSV!' : 'Export All CSV'}</span>
            </button>
            <span className="text-[11px] font-mono-jb text-blue-200 ml-auto">
              {employees.length} Staff Registered
            </span>
          </div>
        </div>
      </div>

      {/* Access Explanation Guide: How Admin Accesses All Employees Data */}
      <div className="p-3.5 bg-blue-50/90 dark:bg-[#111e38] rounded-2xl border border-blue-200 dark:border-blue-900/60 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#00236f] dark:text-[#82f5c1] font-bold text-xs">
            <span className="material-symbols-outlined text-[18px]">help_center</span>
            <span>How Admin &amp; Owner Access All Employees Data:</span>
          </div>
          <button
            onClick={() => setShowAccessGuide(!showAccessGuide)}
            className="text-[10px] font-mono-jb text-slate-500 dark:text-slate-400 hover:underline"
          >
            {showAccessGuide ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showAccessGuide && (
          <div className="flex flex-col gap-1.5 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-blue-100 dark:border-blue-900/40">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#00236f] dark:text-[#82f5c1] shrink-0 font-mono-jb">1.</span>
              <span><strong>Staff Directory:</strong> Click <em>"View Full Data"</em> on any employee to inspect their contact information, locked 9 AM – 6 PM shift compliance, late days count (max 3 allowed), and punch logs.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#00236f] dark:text-[#82f5c1] shrink-0 font-mono-jb">2.</span>
              <span><strong>Locked 9 AM – 6 PM Shift &amp; 09:30 Late Cutoff:</strong> Staff must clock in by 09:30 AM. Max 3 late days acceptable per month. 4th+ late day calculates as a Half Day.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#00236f] dark:text-[#82f5c1] shrink-0 font-mono-jb">3.</span>
              <span><strong>Salary in Rupees (₹10,000 Base):</strong> All staff start at ₹10,000/mo. Admin and Owner can click <em>"Edit Salary"</em> to customize monthly compensation anytime.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#00236f] dark:text-[#82f5c1] shrink-0 font-mono-jb">4.</span>
              <span><strong>Sunday Official Paid Holiday:</strong> Sundays are recognized as paid company holidays. Monthly salary guarantees 26 working days + 4 paid Sunday rest days.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-[#00236f] dark:text-[#82f5c1] shrink-0 font-mono-jb">5.</span>
              <span><strong>1-Click Portal Switching:</strong> Click <em>"Switch To"</em> on any employee to instantly log into and experience their exact mobile view.</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Workforce Telemetry Overview Tiles */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-850/60 flex flex-col">
          <span className="text-[10px] font-mono-jb uppercase text-emerald-800 dark:text-emerald-300 font-bold">
            At Firm
          </span>
          <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100 font-mono-jb mt-0.5">
            {stats.insideCount} Staff
          </span>
          <span className="text-[9px] text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
            Inside Geofence
          </span>
        </div>

        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-850/60 flex flex-col">
          <span className="text-[10px] font-mono-jb uppercase text-indigo-800 dark:text-indigo-300 font-bold">
            Field Duty
          </span>
          <span className="text-lg font-bold text-indigo-900 dark:text-indigo-100 font-mono-jb mt-0.5">
            {stats.fieldWorkCount} Staff
          </span>
          <span className="text-[9px] text-indigo-700 dark:text-indigo-400 mt-0.5 truncate">
            Paid ~2h Limit
          </span>
        </div>

        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-850/60 flex flex-col">
          <span className="text-[10px] font-mono-jb uppercase text-rose-800 dark:text-rose-300 font-bold">
            Auto Exits
          </span>
          <span className="text-lg font-bold text-rose-900 dark:text-rose-100 font-mono-jb mt-0.5">
            {stats.autoPunchOutCount} Staff
          </span>
          <span className="text-[9px] text-rose-700 dark:text-rose-400 mt-0.5 truncate">
            &gt;1h at 7:00 PM
          </span>
        </div>
      </div>

      {/* Payroll in Rupees & Sunday Official Holiday Snapshot Card */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-amber-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs font-mono-jb">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <span className="material-symbols-outlined text-[18px]">payments</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">
              Total Monthly Payroll: ₹{stats.totalPayroll.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              ₹10k Default in Rupees • Sunday Official Paid Holiday
            </span>
          </div>
        </div>
        <button
          onClick={() => onOpenSalaryCustomization()}
          className="px-2.5 py-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 transition-all shadow-2xs shrink-0"
        >
          Manage Salaries
        </button>
      </div>

      {/* Main Admin Tab Switcher */}
      <div className="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl text-xs font-bold font-mono-jb">
        <button
          onClick={() => setActiveTab('roster')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'roster'
              ? 'bg-white dark:bg-[#111c30] text-[#00236f] dark:text-[#82f5c1] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">groups</span>
          <span>Staff Directory</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'logs'
              ? 'bg-white dark:bg-[#111c30] text-[#00236f] dark:text-[#82f5c1] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
          <span>All Punch Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1 ${
            activeTab === 'policies'
              ? 'bg-white dark:bg-[#111c30] text-[#00236f] dark:text-[#82f5c1] shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">policy</span>
          <span>Firm Rules</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400">
          search
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by employee name, ID, phone, or audit hash..."
          className="w-full pl-9 pr-8 py-2.5 text-xs rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
          </button>
        )}
      </div>

      {/* TAB 1: ALL EMPLOYEES ROSTER */}
      {activeTab === 'roster' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Registered Employees ({filteredEmployees.length})
            </span>
            <button
              onClick={() => onOpenSalaryCustomization()}
              className="text-[11px] font-mono-jb text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:underline"
            >
              <span className="material-symbols-outlined text-[15px]">payments</span>
              <span>Edit Salaries</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {filteredEmployees.map(emp => {
              const isSelected = emp.id === currentUserId;
              const salary = emp.monthlySalary || 10000;
              const dailyRate = (salary / 26).toFixed(0);

              return (
                <div
                  key={emp.id || emp.email}
                  className={`p-3.5 rounded-2xl border transition-all bg-white dark:bg-[#131d2e] shadow-xs flex flex-col gap-2.5 ${
                    isSelected
                      ? 'border-[#00236f] dark:border-[#82f5c1] ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        referrerPolicy="no-referrer"
                        className="w-11 h-11 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-[#0d1c2e] dark:text-white truncate">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-mono-jb px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/70 text-[#00236f] dark:text-[#82f5c1] font-bold">
                            {emp.employeeId}
                          </span>
                          {emp.role === 'admin' && (
                            <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                              ADMIN
                            </span>
                          )}
                          {emp.role === 'owner' && (
                            <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                              OWNER
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {emp.title} • {emp.department}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onSwitchToEmployee(emp)}
                      className="px-2.5 py-1 text-[11px] font-mono-jb font-bold bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl transition-all shadow-xs shrink-0 active:scale-95"
                    >
                      {isSelected ? 'Active View' : 'Switch To'}
                    </button>
                  </div>

                  {/* Salary & Sunday Holiday Strip in Rupees */}
                  <div className="p-2 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs font-mono-jb">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-emerald-700 dark:text-emerald-400">payments</span>
                      <span className="font-bold text-emerald-900 dark:text-emerald-200">
                        ₹{salary.toLocaleString()} / mo
                      </span>
                      {salary === 10000 && (
                        <span className="text-[9px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-1 rounded font-bold">
                          ₹10k Base
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-800 dark:text-emerald-300">
                      ₹{dailyRate}/day • Sunday Paid
                    </span>
                  </div>

                  {/* Locked Shift & Late Policy Attendance Strip */}
                  <div className="p-2 bg-slate-50 dark:bg-[#18253f] rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono-jb">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-rose-500">lock_clock</span>
                      <span className="text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                        9:00 AM – 6:00 PM (Late &gt;09:30 AM)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        (emp.monthlyLateArrivalsCount || 0) > 3
                          ? 'bg-rose-100 text-rose-700'
                          : (emp.monthlyLateArrivalsCount || 0) === 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {(emp.monthlyLateArrivalsCount || 0)} / 3 Late Days
                      </span>
                      {(emp.monthlyLateArrivalsCount || 0) > 3 && (
                        <span className="text-[9px] bg-rose-600 text-white font-bold px-1 rounded">
                          HALF DAY
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Employee Contact & Shift Telemetry */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-jb p-2 bg-slate-50 dark:bg-[#18253f] rounded-xl border border-slate-200/80 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase">Contact Phone</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {emp.phone || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase">Company Email</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {emp.email}
                      </span>
                    </div>
                    <div className="flex flex-col border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                      <span className="text-[9px] text-slate-400 uppercase">Daily Shift Target</span>
                      <span className="font-bold text-[#00236f] dark:text-[#82f5c1]">
                        8.0h Daily Net Work
                      </span>
                    </div>
                    <div className="flex flex-col border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                      <span className="text-[9px] text-slate-400 uppercase">Weekly Hours</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        {emp.hoursCompletedThisWeek}h / {emp.weeklyTargetHours}h
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons for this Employee */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => onViewEmployeeDetails(emp)}
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#00236f] dark:text-[#82f5c1] text-[11px] font-mono-jb font-bold rounded-xl transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      <span>View Full Data</span>
                    </button>
                    <button
                      onClick={() => onOpenSalaryCustomization(emp)}
                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-mono-jb font-bold rounded-xl transition-all flex items-center gap-1 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[15px]">tune</span>
                      <span>Edit Salary</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: MASTER AUDIT PUNCH LOGS */}
      {activeTab === 'logs' && (
        <div className="flex flex-col gap-3">
          {/* Punch Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px] font-mono-jb font-bold">
            {[
              { id: 'all', label: 'All Punches' },
              { id: 'in', label: 'Clock-In' },
              { id: 'break', label: 'Breaks' },
              { id: 'field', label: 'Field Work' },
              { id: 'auto', label: 'Auto Exits' },
              { id: 'out', label: 'Clock-Out' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setSelectedPunchType(pill.id)}
                className={`px-2.5 py-1 rounded-xl shrink-0 transition-all border ${
                  selectedPunchType === pill.id
                    ? 'bg-[#00236f] text-white border-[#00236f] shadow-xs'
                    : 'bg-white dark:bg-[#162238] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Showing {filteredPunches.length} Audit Records
            </span>
            <button
              onClick={handleExportAllCSV}
              className="text-[#00236f] dark:text-[#82f5c1] hover:underline font-bold font-mono-jb flex items-center gap-0.5"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>CSV</span>
            </button>
          </div>

          {/* Records List */}
          <div className="flex flex-col gap-2">
            {filteredPunches.map(p => {
              const isAuto = p.isAutoPunchOut || p.type === 'auto-clock-out';
              const isField = p.isFieldWork || p.type === 'field-work-start' || p.type === 'field-work-end';

              return (
                <div
                  key={p.id}
                  onClick={() => onOpenAuditPunch(p)}
                  className="p-3 bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-all cursor-pointer flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAuto
                            ? 'bg-rose-100 text-rose-700'
                            : isField
                            ? 'bg-indigo-100 text-indigo-700'
                            : p.type === 'clock-in'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-[#00236f]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[17px]">
                          {isAuto
                            ? 'timer_off'
                            : isField
                            ? 'business_center'
                            : p.type === 'clock-in'
                            ? 'login'
                            : 'logout'}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#0d1c2e] dark:text-white truncate">
                            {p.employeeName || 'Staff Member'}
                          </span>
                          <span className="text-[10px] font-mono-jb text-slate-500">
                            ({p.employeeId || 'ID'})
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-jb text-slate-400">
                          {p.dateFormatted} • {p.timeFormatted}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono-jb uppercase px-2 py-0.5 rounded-full font-bold border ${
                        isAuto
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : isField
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                    >
                      {p.type.replace('-', ' ')}
                    </span>
                  </div>

                  {/* Detail note if field work or auto punch out */}
                  {isAuto && p.autoPunchReason && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-[10px] text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900">
                      <strong>Auto Rule:</strong> {p.autoPunchReason}
                    </div>
                  )}

                  {isField && p.fieldWorkPurpose && (
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-[10px] text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900">
                      <strong>Firm Duty:</strong> {p.fieldWorkPurpose} (~2h limit)
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] font-mono-jb text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="truncate">{p.siteName}</span>
                    <span>SHA-256: {p.hash.substring(0, 14)}...</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY POLICIES & ENFORCEMENT RULES */}
      {activeTab === 'policies' && (
        <div className="flex flex-col gap-3 text-xs">
          {/* Locked Shift 9 AM - 6 PM & Late Cutoff Policy */}
          <div className="p-4 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold">
              <span className="material-symbols-outlined text-[20px] text-rose-600">lock_clock</span>
              <span className="text-sm">1. Locked Working Shift (9:00 AM – 6:00 PM) &amp; 09:30 AM Late Cutoff</span>
            </div>
            <p className="text-rose-950/80 dark:text-rose-300 text-[11px] leading-relaxed">
              Every employee is required to work from <strong>9:00 AM in the morning</strong> to <strong>6:00 PM in the evening</strong> (9 hours span including the 1:00 PM – 2:00 PM afternoon break).
              <br />
              • <strong>Late Threshold:</strong> Entry after <strong>09:30 AM</strong> is classified as a Late Arrival.
              <br />
              • <strong>Monthly Grace Limit:</strong> Only <strong>3 late days</strong> are acceptable per month.
              <br />
              • <strong>Half Day Penalty:</strong> From the <strong>4th late day onward</strong> in the same month, the day is automatically calculated as a <strong>Half Day</strong> (0.5 working day credited with half-day pay deduction).
            </p>
          </div>

          {/* Sunday Official Holiday Policy */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
              <span className="material-symbols-outlined text-[20px] text-amber-600">celebration</span>
              <span className="text-sm">2. Sunday is Official Company Holiday (Paid Rest Day)</span>
            </div>
            <p className="text-amber-950/80 dark:text-amber-300 text-[11px] leading-relaxed">
              Every Sunday is an official company holiday with 100% paid rest guaranteed across all employee salaries. The default ₹10,000 monthly salary in Rupees is distributed across 26 working days with all 4 Sunday rest days fully compensated. Voluntary Sunday duty is recorded as "Holiday Duty" overtime.
            </p>
          </div>

          {/* Admin and Owner Salary Customization Rule in Rupees */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">payments</span>
              <span className="text-sm">3. ₹10,000 Base Salary in Rupees &amp; Admin/Owner Customization</span>
            </div>
            <p className="text-emerald-950/80 dark:text-emerald-300 text-[11px] leading-relaxed">
              All employees start with an official base salary of ₹10,000 / month (₹10k in Rupees). Administrators and Owners have executive clearance to customize any employee's monthly compensation directly from the Admin Portal or Profile Screen.
            </p>
            <button
              onClick={() => onOpenSalaryCustomization()}
              className="w-max px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono-jb rounded-xl transition-all shadow-xs"
            >
              Open Salary Customization Tool
            </button>
          </div>

          <div className="p-4 bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
              <span className="material-symbols-outlined text-[20px] text-amber-600">coffee</span>
              <span className="text-sm">3. Afternoon Break Window (1:00 PM – 2:00 PM)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Every employee has mandatory/flexible break time between 1:00 PM and 2:00 PM. In this time period, if any employee goes outside the firm perimeter, the system automatically calculates it as authorized break time without penalizing them or logging unauthorized absence.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
              <span className="material-symbols-outlined text-[20px] text-rose-600">timer_off</span>
              <span className="text-sm">4. 7:00 PM Evening Auto Punch-Out</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              If an employee forgets to clock out, and remains outside the firm perimeter for more than 1 hour at or after 7:00 PM evening (19:00), the system automatically clocks them out with an audited auto-punch-out record.
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-bold">
              <span className="material-symbols-outlined text-[20px] text-indigo-600">business_center</span>
              <span className="text-sm">5. Firm Work (Outdoor Official Assignments)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              When employees go out for client consultations, vendor deliveries, or official firm assignments, they start a "Firm Work" session. Outdoor time is counted as paid working time with an approximate allowance limit of 2 hours (~120 minutes).
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#00236f] dark:text-[#82f5c1] font-bold">
              <span className="material-symbols-outlined text-[20px]">alarm</span>
              <span className="text-sm">6. Customizable Working Hours &amp; Continuous Beeping</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              Every employee can customize their shift target hours (e.g. 7.5h, 8h, 8.5h, 9h). When shift hours complete, the app beeps continuously with volume button silencing support, presenting two options: <strong>Shift End</strong> (clock out) or <strong>Overtime</strong> (add extra hours).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
