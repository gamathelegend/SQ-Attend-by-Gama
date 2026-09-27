import React from 'react';

interface BottomNavProps {
  activeTab: 'punch' | 'history' | 'admin' | 'profile';
  onChangeTab: (tab: 'punch' | 'history' | 'admin' | 'profile') => void;
  currentUserRole?: 'admin' | 'owner' | 'employee';
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, currentUserRole }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 pb-safe bg-[#f8f9ff]/95 dark:bg-[#0b1329]/95 backdrop-blur-xl border-t border-[#e6eeff] dark:border-slate-800 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.35)] transition-colors">
      <div className="max-w-lg mx-auto flex justify-around items-center h-16 px-2">
        {/* Punch Tab */}
        <button
          onClick={() => onChangeTab('punch')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[62px] h-12 rounded-xl transition-all ${
            activeTab === 'punch'
              ? 'text-[#00236f] dark:text-[#82f5c1]'
              : 'text-[#444651]/80 dark:text-slate-400 hover:text-[#0d1c2e] dark:hover:text-slate-100'
          }`}
          aria-label="Punch Clock In screen"
        >
          <div className="relative">
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                activeTab === 'punch' ? 'scale-110 font-bold' : ''
              }`}
            >
              timer
            </span>
            {activeTab === 'punch' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00236f] dark:bg-[#82f5c1]"></span>
            )}
          </div>
          <span
            className={`text-[11px] leading-tight ${
              activeTab === 'punch' ? 'font-bold' : 'font-medium'
            }`}
          >
            Punch
          </span>
        </button>

        {/* History Tab */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[62px] h-12 rounded-xl transition-all ${
            activeTab === 'history'
              ? 'text-[#00236f] dark:text-[#82f5c1]'
              : 'text-[#444651]/80 dark:text-slate-400 hover:text-[#0d1c2e] dark:hover:text-slate-100'
          }`}
          aria-label="Timesheet history screen"
        >
          <div className="relative">
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                activeTab === 'history' ? 'scale-110 font-bold' : ''
              }`}
            >
              calendar_month
            </span>
            {activeTab === 'history' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00236f] dark:bg-[#82f5c1]"></span>
            )}
          </div>
          <span
            className={`text-[11px] leading-tight ${
              activeTab === 'history' ? 'font-bold' : 'font-medium'
            }`}
          >
            History
          </span>
        </button>

        {/* Admin Tab (All Employees Data Access - 5 Admins & Owner) */}
        <button
          onClick={() => onChangeTab('admin')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[62px] h-12 rounded-xl transition-all ${
            activeTab === 'admin'
              ? 'text-[#00236f] dark:text-[#82f5c1]'
              : 'text-[#444651]/80 dark:text-slate-400 hover:text-[#0d1c2e] dark:hover:text-slate-100'
          }`}
          aria-label="Admin All Employees Portal"
        >
          <div className="relative">
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                activeTab === 'admin' ? 'scale-110 font-bold' : ''
              }`}
            >
              {currentUserRole === 'employee' ? 'lock' : 'admin_panel_settings'}
            </span>
            {currentUserRole === 'employee' && (
              <span className="absolute -top-1 -right-1.5 px-1 bg-rose-500 text-white text-[8px] font-mono-jb rounded-full font-bold">
                5 Admins
              </span>
            )}
            {activeTab === 'admin' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00236f] dark:bg-[#82f5c1]"></span>
            )}
          </div>
          <span
            className={`text-[11px] leading-tight flex items-center gap-0.5 ${
              activeTab === 'admin' ? 'font-bold' : 'font-medium'
            }`}
          >
            Admin
          </span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 min-w-[62px] h-12 rounded-xl transition-all ${
            activeTab === 'profile'
              ? 'text-[#00236f] dark:text-[#82f5c1]'
              : 'text-[#444651]/80 dark:text-slate-400 hover:text-[#0d1c2e] dark:hover:text-slate-100'
          }`}
          aria-label="Employee profile screen"
        >
          <div className="relative">
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${
                activeTab === 'profile' ? 'scale-110 font-bold' : ''
              }`}
            >
              manage_accounts
            </span>
            {activeTab === 'profile' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00236f] dark:bg-[#82f5c1]"></span>
            )}
          </div>
          <span
            className={`text-[11px] leading-tight ${
              activeTab === 'profile' ? 'font-bold' : 'font-medium'
            }`}
          >
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
