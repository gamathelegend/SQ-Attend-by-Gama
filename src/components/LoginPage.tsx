import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getStoredUsers, saveActiveUser, saveStoredUsers } from '../utils/storage';
import { OFFICIAL_SELFIE_URL } from '../utils/mockData';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
  isDark?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isDark = false }) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [roleGroup, setRoleGroup] = useState<'employees' | 'admins' | 'owner'>('employees');

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Cloud & Infrastructure Systems');
  const [regRole, setRegRole] = useState<'employee' | 'admin'>('employee');

  const users = getStoredUsers();

  // Filter users by role
  const employeeUsers = users.filter((u) => u.role === 'employee' || !u.role);
  const adminUsers = users.filter((u) => u.role === 'admin');
  const ownerUsers = users.filter((u) => u.role === 'owner');

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = identifier.replace(/\D/g, '');

    if (!cleanId) {
      setErrorMessage('Please enter your mobile phone number or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Find matching user
      const matched = users.find((u) => {
        const uEmail = (u.email || '').toLowerCase();
        const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
        const uPhone = (u.phone || '').toLowerCase();
        const uEmpId = (u.employeeId || '').toLowerCase();

        const matchesEmail = uEmail === cleanId;
        const matchesPhone =
          (cleanPhoneDigits.length >= 6 && uPhoneDigits.endsWith(cleanPhoneDigits)) ||
          uPhone.includes(cleanId);
        const matchesEmpId = uEmpId === cleanId;

        return matchesEmail || matchesPhone || matchesEmpId;
      });

      if (!matched) {
        setIsLoading(false);
        setErrorMessage(
          'No account found matching that email or phone number. Check your credentials or tap a profile below.'
        );
        return;
      }

      // Check password (allow 'password123' as universal demo credential)
      if (matched.password && matched.password !== password && password !== 'password123') {
        setIsLoading(false);
        setErrorMessage('Incorrect password. For testing, default password is "password123".');
        return;
      }

      setIsLoading(false);
      saveActiveUser(matched);
      onLoginSuccess(matched);
    }, 350);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid work email address.');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    // Check if admin registration requested and if 5 admins already exist
    if (regRole === 'admin' && adminUsers.length >= 5) {
      setErrorMessage('Maximum number of Admins (5) is already registered in the firm.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const isAdm = regRole === 'admin';
      const adminIndex = adminUsers.length + 1;

      const newUser: UserProfile = {
        id: isAdm ? `admin-${adminIndex}` : `emp-${Date.now()}`,
        role: isAdm ? 'admin' : 'employee',
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
        title: isAdm ? `Operations Admin (${adminIndex} of 5)` : 'Systems Associate',
        employeeId: isAdm ? `SQ-ADMIN-${adminIndex}` : `SQ-${Math.floor(1000 + Math.random() * 9000)}`,
        department: regDepartment,
        shiftWindow: 'Locked Shift: 09:00 AM – 06:00 PM (Late Cutoff: 09:30 AM)',
        dailyWorkingHours: 9.0, // Fixed 9 AM to 6 PM
        weeklyTargetHours: 45.0,
        monthlySalary: 10000, // 10k default salary (Locked to Admin/Owner edit)
        hoursCompletedThisWeek: 0,
        monthlyLateArrivalsCount: 0,
        halfDaysCount: 0,
        shiftStartTime: '09:00 AM',
        shiftEndTime: '06:00 PM',
        lateThresholdTime: '09:30 AM',
        maxAllowedLateDaysPerMonth: 3,
        avatarUrl: OFFICIAL_SELFIE_URL,
        biometricEnrolledDate: 'Registered • Ready for Verification',
        biometricConfidence: 99.4,
        biometricHash: `hash-${Date.now().toString(16)}`,
        biometricOptional: true,
        biometricEnabled: false,
        isGeofenceEnforced: !isAdm,
      };

      const updatedUsers = [newUser, ...users];
      saveStoredUsers(updatedUsers);
      saveActiveUser(newUser);
      setIsLoading(false);
      onLoginSuccess(newUser);
    }, 400);
  };

  const handleQuickSelect = (user: UserProfile) => {
    setIdentifier(user.phone || user.email);
    setPassword(user.password || 'password123');
    saveActiveUser(user);
    onLoginSuccess(user);
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-5 max-w-md mx-auto text-[#0d1c2e] dark:text-slate-100 transition-colors animate-in fade-in duration-300">
      {/* Top Branding Section */}
      <div className="flex flex-col items-center text-center pt-2 pb-4">
        {/* Logo Shield Icon */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#00236f] via-[#1e3a8a] to-[#2563eb] flex items-center justify-center text-white shadow-xl shadow-blue-900/30 border border-blue-400/20">
            <span className="material-symbols-outlined text-[34px] text-[#82f5c1]">
              fingerprint
            </span>
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-[#0a0f1d]"></span>
          </span>
        </div>

        {/* Firm / App Name */}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#0d1c2e] dark:text-white font-mono-jb">
          SQ Attend - By Gama
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
          Enterprise Geofence Attendance • 50m Firm Perimeter • 09:00 AM – 06:00 PM Shift
        </p>

        {/* Status badges */}
        <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-jb font-semibold bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <span className="material-symbols-outlined text-[13px] text-blue-600 dark:text-blue-400">
              radar
            </span>
            Radius 50m
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-jb font-semibold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="material-symbols-outlined text-[13px] text-emerald-600 dark:text-emerald-400">
              schedule
            </span>
            9 AM – 6 PM
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-jb font-semibold bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <span className="material-symbols-outlined text-[13px] text-purple-600 dark:text-purple-400">
              admin_panel_settings
            </span>
            5 Admins
          </span>
        </div>
      </div>

      {/* Main Login / Register Card */}
      <div className="bg-white dark:bg-[#121c2e] rounded-3xl p-5 shadow-xl border border-slate-200/80 dark:border-slate-800/80 flex flex-col gap-4">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-[#0a1222] rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-bold font-mono-jb rounded-xl transition-all ${
              tab === 'login'
                ? 'bg-[#00236f] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMessage('');
            }}
            className={`py-2 text-xs font-bold font-mono-jb rounded-xl transition-all ${
              tab === 'register'
                ? 'bg-[#00236f] text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Registration
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">
              error
            </span>
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                Mobile Number or Work Email
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 material-symbols-outlined text-[19px] text-slate-400">
                  contact_phone
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +1 555 234 5678 or name@sqattend.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] dark:focus:ring-blue-500 transition-all text-[#0d1c2e] dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                  Password
                </label>
                <span className="text-[10px] text-slate-400 font-mono-jb">Demo: password123</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 material-symbols-outlined text-[19px] text-slate-400">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00236f] dark:focus:ring-blue-500 transition-all text-[#0d1c2e] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00236f] to-[#1e3a8a] hover:from-[#1e3a8a] hover:to-[#2563eb] text-white font-bold font-mono-jb text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-900/25 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{isLoading ? 'Signing In...' : 'Sign In to SQ Attend'}</span>
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00236f] text-[#0d1c2e] dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 555 000 1234"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00236f] text-[#0d1c2e] dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                Company Email
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="employee@sqattend.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00236f] text-[#0d1c2e] dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                  Create Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 4 chars"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00236f] text-[#0d1c2e] dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                  Account Role
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'employee' | 'admin')}
                  className="w-full px-2.5 py-2 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00236f] text-[#0d1c2e] dark:text-white"
                >
                  <option value="employee">Employee</option>
                  <option value="admin" disabled={adminUsers.length >= 5}>
                    Admin {adminUsers.length >= 5 ? '(Full 5/5)' : `(${adminUsers.length}/5)`}
                  </option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider font-mono-jb text-slate-500 dark:text-slate-400">
                Department
              </label>
              <select
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0d1627] border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#00236f] text-[#0d1c2e] dark:text-white"
              >
                <option value="Cloud & Infrastructure Systems">Cloud & Infrastructure Systems</option>
                <option value="Field Logistics & Deployment">Field Logistics & Deployment</option>
                <option value="Engineering & DevOps">Engineering & DevOps</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="Finance & Operations">Finance & Operations</option>
              </select>
            </div>

            {/* Firm rules summary */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-[10px] text-blue-900 dark:text-blue-200 flex flex-col gap-1">
              <div className="flex items-center gap-1 font-bold">
                <span className="material-symbols-outlined text-[14px]">policy</span>
                <span>Firm Shift & Policy:</span>
              </div>
              <span>• Daily Shift: 09:00 AM – 06:00 PM (9.0 hrs)</span>
              <span>• Half-Day & Overtime permitted • Outdoor limit: 1 hour</span>
              <span>• Starting Salary: ₹10,000 (Protected: editable only by 5 Admins)</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold font-mono-jb text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/25 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}

        {/* Quick One-Tap Profile Switcher */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono-jb uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Quick 1-Tap Login
            </span>
            {/* Category tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRoleGroup('employees')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono-jb font-bold transition-all ${
                  roleGroup === 'employees'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Employees ({employeeUsers.length})
              </button>
              <button
                type="button"
                onClick={() => setRoleGroup('admins')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono-jb font-bold transition-all ${
                  roleGroup === 'admins'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                5 Admins
              </button>
              <button
                type="button"
                onClick={() => setRoleGroup('owner')}
                className={`px-2 py-0.5 rounded-md text-[9px] font-mono-jb font-bold transition-all ${
                  roleGroup === 'owner'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Owner
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
            {roleGroup === 'employees' &&
              employeeUsers.map((u) => (
                <button
                  key={u.id || u.employeeId}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-[#0e1728] dark:hover:bg-blue-950/40 border border-slate-200/80 dark:border-slate-800 text-left transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {u.name}
                      </span>
                      <span className="text-[10px] font-mono-jb text-slate-500 dark:text-slate-400">
                        {u.employeeId} • {u.title}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-mono-jb font-bold rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 shrink-0">
                    Employee
                  </span>
                </button>
              ))}

            {roleGroup === 'admins' &&
              adminUsers.map((u, idx) => (
                <button
                  key={u.id || u.employeeId}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className="flex items-center justify-between p-2 rounded-xl bg-purple-50/50 hover:bg-purple-100/60 dark:bg-purple-950/20 dark:hover:bg-purple-950/50 border border-purple-200/80 dark:border-purple-800/60 text-left transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-purple-300 dark:border-purple-700 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-300">
                        {u.name}
                      </span>
                      <span className="text-[10px] font-mono-jb text-purple-700 dark:text-purple-300">
                        {u.employeeId} • Admin {idx + 1} of 5
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-mono-jb font-bold rounded-md bg-purple-600 text-white shrink-0">
                    Admin
                  </span>
                </button>
              ))}

            {roleGroup === 'owner' &&
              ownerUsers.map((u) => (
                <button
                  key={u.id || u.employeeId}
                  type="button"
                  onClick={() => handleQuickSelect(u)}
                  className="flex items-center justify-between p-2 rounded-xl bg-amber-50/60 hover:bg-amber-100/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 text-left transition-all group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-amber-300 dark:border-amber-700 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-600">
                        {u.name}
                      </span>
                      <span className="text-[10px] font-mono-jb text-amber-700 dark:text-amber-300">
                        {u.employeeId} • Managing Director
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-mono-jb font-bold rounded-md bg-amber-600 text-white shrink-0">
                    Owner
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-3 pb-1 text-[11px] font-mono-jb text-slate-400 dark:text-slate-500">
        SQ Attend - By Gama • Geofence 50m • Shift 09:00 AM – 06:00 PM
      </div>
    </div>
  );
};
