import React, { useEffect } from 'react';
import { PunchRecord } from '../types';

interface PunchSuccessModalProps {
  punch: PunchRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onViewHistory: () => void;
}

export const PunchSuccessModal: React.FC<PunchSuccessModalProps> = ({
  punch,
  isOpen,
  onClose,
  onViewHistory,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // Fast keyboard dismiss
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);

    // Auto-dismiss after 3.5s so user isn't stuck
    const timer = setTimeout(() => {
      onClose();
    }, 3500);

    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !punch) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#233144] text-[#eaf1ff] p-5 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-4 cursor-default transform transition-transform"
      >
        {/* Header with success check */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
              punch.synced
                ? 'bg-[#82f5c1] text-[#006c4a]'
                : 'bg-amber-400 text-amber-950'
            }`}
          >
            <span className="material-symbols-outlined text-[24px] font-bold">
              {punch.synced ? 'done_all' : 'inventory_2'}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-white leading-tight">
                {punch.synced ? 'Punch Verified' : 'Punch Cached Offline'}
              </h3>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono-jb font-bold uppercase ${
                  punch.synced
                    ? 'bg-emerald-500/20 text-[#82f5c1] border border-emerald-500/30'
                    : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                }`}
              >
                {punch.synced ? 'SYNCED' : 'LOCAL CACHE'}
              </span>
            </div>
            <span className="font-mono-jb text-xs text-[#85f8c4]">
              {punch.timeFormatted} • {punch.synced ? 'Cloud Synced' : 'Queued in localStorage'}
            </span>
          </div>
        </div>

        {/* Offline Queue Information Banner */}
        {!punch.synced && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs">
            <span className="material-symbols-outlined text-[18px] text-amber-400 shrink-0">
              cloud_queue
            </span>
            <span>
              Recorded offline. Cached in browser <strong>localStorage</strong>. Will auto-sync when back online.
            </span>
          </div>
        )}

        {/* Verification and Location Snapshot */}
        <div className="flex gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
          {punch.verificationMethod === 'gps_geofence' || !punch.photoUrl ? (
            <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-[#82f5c1]/40 bg-[#00236f]/60 flex flex-col items-center justify-center text-center p-1.5 shadow-xs">
              <span className="material-symbols-outlined text-[26px] text-[#82f5c1]">share_location</span>
              <span className="font-mono-jb text-[8px] text-[#82f5c1] font-bold mt-1 tracking-wider">
                GPS LOCK
              </span>
            </div>
          ) : (
            <div className="relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border border-[#85f8c4]/40 bg-slate-900 shadow-xs">
              <img
                src={punch.photoUrl}
                alt="Verification selfie"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono-jb text-[#85f8c4] text-center py-0.5">
                {punch.confidence}% MATCH
              </div>
            </div>
          )}

          <div className="flex flex-col justify-center min-w-0 text-xs gap-1">
            <div className="flex items-center gap-1 text-white font-bold">
              <span className="material-symbols-outlined text-[15px] text-[#85f8c4]">
                verified
              </span>
              <span className="truncate">{punch.siteName}</span>
            </div>
            <span className="text-[#d5e3fc] truncate">{punch.zone}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono-jb text-[10px] text-slate-300">
                GPS Lock {punch.accuracy}
              </span>
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-[#82f5c1] font-mono-jb text-[9px] rounded font-bold">
                {punch.verificationMethod === 'face_biometric' ? 'Optional Face ID' : 'GPS Verified'}
              </span>
            </div>
            <span className="font-mono-jb text-[9px] text-[#85f8c4] truncate mt-0.5">
              HASH: {punch.hash}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onViewHistory}
            className="flex-1 py-2 px-3 bg-[#00236f] hover:bg-[#1e3a8a] active:scale-95 text-white rounded-xl text-xs font-bold transition-all text-center"
          >
            View Timesheet
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-white/10 hover:bg-white/20 active:scale-95 text-[#eaf1ff] rounded-xl text-xs font-semibold transition-all"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
