import React from 'react';
import { GeofenceSite } from '../types';

interface LocationDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSite: GeofenceSite;
  distanceMeters: number;
  onOpenRadar: () => void;
  onSimulateInside: () => void;
}

export const LocationDeniedModal: React.FC<LocationDeniedModalProps> = ({
  isOpen,
  onClose,
  activeSite,
  distanceMeters,
  onOpenRadar,
  onSimulateInside,
}) => {
  if (!isOpen) return null;

  const excessMeters = Math.max(0, distanceMeters - activeSite.radiusMeters);

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-white text-slate-900 rounded-3xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col cursor-default animate-in zoom-in-95 duration-200"
      >
        {/* Top Warning Banner */}
        <div className="bg-rose-600 text-white p-5 flex flex-col items-center text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner ring-4 ring-white/10">
            <span className="material-symbols-outlined text-[32px] text-white">
              location_off
            </span>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-mono-jb font-bold uppercase tracking-wider mb-1">
            Geofence Policy Violation
          </span>
          <h3 className="text-lg font-bold leading-tight">
            Punch In Denied: Outside Firm
          </h3>
          <p className="text-rose-100 text-xs mt-1 max-w-[260px]">
            Company policy requires employees to punch in only when physically inside the firm location.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Geofence comparison card */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 flex flex-col gap-2.5 text-xs font-mono-jb">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-sans text-[11px] font-medium">Authorized Firm:</span>
              <span className="font-bold text-[#0d1c2e] text-right font-sans">
                {activeSite.name} ({activeSite.code})
              </span>
            </div>

            <div className="flex items-start justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-sans text-[11px] font-medium">Address:</span>
              <span className="text-slate-700 text-right text-[10px] max-w-[180px] truncate">
                {activeSite.address}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-sans text-[11px] font-medium">Allowed Perimeter:</span>
              <span className="font-bold text-emerald-700">
                Within {activeSite.radiusMeters} meters
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-sans text-[11px] font-medium">Your Distance:</span>
              <span className="font-bold text-rose-600 flex items-center gap-1">
                <span>{distanceMeters}m away</span>
                <span className="text-[10px] text-rose-500">({excessMeters}m outside)</span>
              </span>
            </div>
          </div>

          {/* Explanation note */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-amber-700 mt-0.5 shrink-0">
              info
            </span>
            <span>
              Please step inside the firm perimeter to clock in. Geofence coordinates are verified with high-precision GPS.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                onOpenRadar();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">radar</span>
              <span>View Firm Radar &amp; Geofence Map</span>
            </button>

            <button
              onClick={() => {
                onSimulateInside();
                onClose();
              }}
              className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors border border-slate-300"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
              <span>Simulate At Firm Location (Test Punch)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
