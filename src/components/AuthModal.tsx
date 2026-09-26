import React, { useState } from 'react';
import { UserProfile } from '../types';
import { getStoredUsers, saveActiveUser, saveStoredUsers } from '../utils/storage';
import { OFFICIAL_SELFIE_URL, sampleEmployees } from '../utils/mockData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [identifier, setIdentifier] = useState(''); // Mobile number or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Cloud & Infrastructure Systems');
  const [regWorkingHours, setRegWorkingHours] = useState('8.0');

  if (!isOpen) return null;

  const users = getStoredUsers();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanId = identifier.trim().toLowerCase();
    const cleanPhoneDigits = identifier.replace(/\D/g, '');

    if (!cleanId) {
      setErrorMessage('Please enter your mobile number or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    // Match by email or mobile number
    const matched = users.find((u) => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhoneDigits = (u.phone || '').replace(/\D/g, '');
      const uPhone = (u.phone || '').toLowerCase();

      const matchesEmail = uEmail === cleanId;
      const matchesPhone =
        (cleanPhoneDigits.length >= 6 && uPhoneDigits.endsWith(cleanPhoneDigits)) ||
        uPhone.includes(cleanId);

      return matchesEmail || matchesPhone;
    });

    if (!matched) {
      setErrorMessage(
        'No account found matching that email or phone number. Check your credentials or select a quick profile below.'
      );
      return;
    }

    // Check password (allow default demo passwords or matched)
    if (matched.password && matched.password !== password && password !== 'password123') {
      setErrorMessage('Incorrect password. For testing, you can use "password123".');
      return;
    }

    // Success
    saveActiveUser(matched);
    onLoginSuccess(matched);
    onClose();
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim()) {
      setErrorMessage('Please provide the employee full name.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid company email address.');
      return;
    }
    if (!regPhone.trim()) {
      setErrorMessage('Please provide a mobile phone number.');
      return;
    }
    if (!regPassword.trim() || regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    const workingHoursNum = parseFloat(regWorkingHours) || 8.0;

    const newEmployee: UserProfile = {
      id: `emp-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim(),
      password: regPassword.trim(),
      title: 'Systems Associate',
      employeeId: `SQ-${Math.floor(1000 + Math.random() * 9000)}`,
      department: regDepartment,
      shiftWindow: 'Entry: 09:00 - 11:00 AM • Exit: 06:00 - 09:00 PM',
      dailyWorkingHours: workingHoursNum,
      weeklyTargetHours: workingHoursNum * 5,
      monthlySalary: 10000, // 10k default salary
      role: 'employee',
      hoursCompletedThisWeek: 0,
      avatarUrl: OFFICIAL_SELFIE_URL,
      biometricEnrolledDate: 'Registered • Ready for Verification',
      biometricConfidence: 99.2,
      biometricHash: `hash-${Date.now().toString(16)}`,
      biometricOptional: true,
      biometricEnabled: false,
      isGeofenceEnforced: true,
    };

    const updatedUsers = [newEmployee, ...users];
    saveStoredUsers(updatedUsers);
    saveActiveUser(newEmployee);
    onLoginSuccess(newEmployee);
    onClose();
  };

  const handleQuickSelectUser = (user: UserProfile) => {
    saveActiveUser(user);
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-[#111c30] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 text-[#0d1c2e] dark:text-slate-100 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00236f] dark:bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px] text-[#82f5c1]">fingerprint</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#00236f] dark:text-white">SQ Attend</span>
                <span className="text-[10px] font-mono-jb px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                  AUTH
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {mode === 'signin' ? 'Sign in with Mobile or Email' : 'Register New Employee Account'}
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

        {/* Currently logged in user status badge */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-[#18253f] rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-mono-jb uppercase text-slate-500 dark:text-slate-400 font-bold">
                Logged In As
              </span>
              <span className="font-bold text-[#0d1c2e] dark:text-white truncate text-[12px]">
                {currentUser.name} ({currentUser.employeeId})
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              onLogout();
              setIdentifier('');
              setPassword('');
            }}
            className="px-2.5 py-1 text-[11px] font-mono-jb font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors border border-rose-200 dark:border-rose-900"
          >
            Logout
          </button>
        </div>

        {/* Tab Switcher: Sign In vs Register */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              setMode('signin');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white dark:bg-[#111c30] text-[#00236f] dark:text-[#82f5c1] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-[#111c30] text-[#00236f] dark:text-[#82f5c1] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {mode === 'signin' ? (
          /* Sign In Form */
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Mobile Number OR Email</span>
                <span className="text-[10px] font-mono-jb text-slate-400 font-normal">Either accepted</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400">
                  contact_phone
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. +1 555 234 5678 or sarah.chen@sqattend.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>Password</span>
                <span className="text-[10px] font-mono-jb text-slate-400 font-normal">Demo: password123</span>
              </label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-[18px] text-slate-400">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter employee password"
                  className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full py-2.5 bg-[#00236f] hover:bg-[#183685] active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">login</span>
              <span>Log In to SQ Attend</span>
            </button>

            {/* Quick 1-Click Employee Switcher */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-mono-jb uppercase text-slate-500 dark:text-slate-400 font-bold">
                Quick 1-Click Demo Accounts:
              </span>
              <div className="flex flex-col gap-1.5">
                {sampleEmployees.map((emp) => (
                  <button
                    key={emp.id || emp.email}
                    type="button"
                    onClick={() => handleQuickSelectUser(emp)}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/70 dark:bg-[#162238] text-left transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#0d1c2e] dark:text-white truncate">
                            {emp.name}
                          </span>
                          {emp.role === 'admin' && (
                            <span className="text-[9px] font-mono-jb uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono-jb text-slate-500 dark:text-slate-400 truncate">
                          {emp.phone} • {emp.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono-jb font-bold text-[#00236f] dark:text-[#82f5c1] bg-white dark:bg-[#1f2f4c] px-2 py-0.5 rounded shadow-2xs border border-slate-200 dark:border-slate-700 shrink-0">
                      Select
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          /* Register New Employee Form */
          <form onSubmit={handleRegister} className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Employee Full Name
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. David Vance"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 555 000 0000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Company Email
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@sqattend.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Set Password
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Working Hours / Day
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="4"
                  max="12"
                  value={regWorkingHours}
                  onChange={(e) => setRegWorkingHours(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Department
              </label>
              <select
                value={regDepartment}
                onChange={(e) => setRegDepartment(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00236f]"
              >
                <option value="Cloud & Infrastructure Systems">Cloud & Infrastructure Systems</option>
                <option value="Field Logistics & Deployment">Field Logistics & Deployment</option>
                <option value="Engineering & DevOps">Engineering & DevOps</option>
                <option value="Operations & Administration">Operations & Administration</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">how_to_reg</span>
              <span>Register & Log In</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
