import React from 'react';

interface HeaderProps {
  currentTab: 'punch' | 'history' | 'admin' | 'profile';
  unreadCount: number;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: () => void;
  userName?: string;
  avatarUrl: string;
  isOnline: boolean;
  pendingQueueCount: number;
  onToggleOffline: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  onOpenAuth,
  userName = 'Employee',
  avatarUrl,
  isOnline,
  pendingQueueCount,
  onToggleOffline,
}) => {
  const getSubtext = () => {
    switch (currentTab) {
      case 'punch':
        return 'Biometric Clock In';
      case 'history':
        return 'History & Timesheets';
      case 'admin':
        return 'Admin Portal • All Staff Data';
      case 'profile':
        return 'Profile & Settings';
    }
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-[#f8f9ff]/90 dark:bg-[#0b1329]/95 backdrop-blur-xl border-b border-[#e6eeff]/80 dark:border-slate-800 shadow-[0_1px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition-colors">
      <div className="h-16 px-4 max-w-lg mx-auto flex items-center justify-between">
        {/* Brand Lockup: SQ Attend */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00236f] dark:bg-[#1e3a8a] text-white shadow-sm border border-transparent dark:border-blue-500/30">
            <span className="material-symbols-outlined text-[20px] text-[#82f5c1]">fingerprint</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-lg tracking-tight text-[#00236f] dark:text-white leading-none">
                SQ Attend
              </span>
              <span className="font-mono-jb text-[10px] bg-[#e6eeff] dark:bg-[#162544] text-[#1e3a8a] dark:text-[#82f5c1] px-1.5 py-0.5 rounded font-semibold tracking-wider uppercase border border-transparent dark:border-blue-900/50">
                PRO
              </span>
            </div>
            <span className="text-[12px] text-[#444651] dark:text-slate-300 leading-tight font-medium">
              {getSubtext()}
            </span>
          </div>
        </div>

        {/* Action Controls & Network Status */}
        <div className="flex items-center gap-1.5">
          {/* Auth Switcher Button */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              title="Click to switch account or log in with Mobile / Email"
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono-jb font-bold bg-[#e6eeff] dark:bg-[#162544] text-[#00236f] dark:text-[#82f5c1] hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all border border-blue-200 dark:border-blue-800"
            >
              <span className="material-symbols-outlined text-[13px]">person</span>
              <span className="max-w-[70px] truncate">{userName.split(' ')[0]}</span>
            </button>
          )}

          {/* Network status pill - interactive toggle for testing */}
          <button
            onClick={onToggleOffline}
            title={
              isOnline
                ? 'Device is Online. Click to simulate Offline mode.'
                : 'Device is Offline (Caching to localStorage). Click to reconnect.'
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono-jb font-bold transition-all active:scale-95 border ${
              !isOnline
                ? 'bg-amber-100/90 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 animate-pulse'
                : pendingQueueCount > 0
                ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                !isOnline ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            />
            <span>
              {!isOnline
                ? pendingQueueCount > 0
                  ? `OFFLINE (${pendingQueueCount})`
                  : 'OFFLINE'
                : pendingQueueCount > 0
                ? `SYNC (${pendingQueueCount})`
                : 'ONLINE'}
            </span>
          </button>

          <button
            onClick={onOpenNotifications}
            aria-label="View notifications"
            className="relative w-9 h-9 flex items-center justify-center text-[#444651] dark:text-slate-300 hover:text-[#0d1c2e] dark:hover:text-white hover:bg-[#e6eeff]/60 dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#f8f9ff] dark:ring-[#0b1329]"></span>
            )}
          </button>

          <button
            onClick={onOpenProfile}
            aria-label="View employee profile"
            className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#1e3a8a]/20 dark:border-[#82f5c1]/30 hover:border-[#1e3a8a] dark:hover:border-[#82f5c1] transition-all active:scale-95 shadow-sm ml-0.5"
          >
            <img
              src={avatarUrl}
              alt="User profile"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

