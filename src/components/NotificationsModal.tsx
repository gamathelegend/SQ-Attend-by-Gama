import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col gap-3 max-h-[85vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
            </div>
            <h3 className="font-bold text-sm text-[#0d1c2e]">Notifications</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-96 pr-0.5">
          {notifications.map(item => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border text-xs transition-colors ${
                item.read
                  ? 'bg-slate-50/70 border-slate-200/60 text-slate-600'
                  : 'bg-[#eff4ff] border-[#d5e3fc] text-[#0d1c2e]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {!item.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                  {item.title}
                </span>
                <span className="text-[10px] font-mono-jb text-slate-400">
                  {item.timeAgo}
                </span>
              </div>
              <p className="text-[11px] text-[#444651] mt-1 leading-relaxed">
                {item.message}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-[#00236f] hover:underline"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#00236f] text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
