import React from 'react';
import { PunchRecord } from '../types';

interface PunchDetailModalProps {
  punch: PunchRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PunchDetailModal: React.FC<PunchDetailModalProps> = ({
  punch,
  isOpen,
  onClose,
}) => {
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
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col gap-4 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0d1c2e]">Attendance Audit Record</h3>
              <p className="font-mono-jb text-[10px] text-slate-500">{punch.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Verification Selfie & Analysis or GPS Lock Box */}
        <div className="flex gap-3">
          {punch.verificationMethod === 'gps_geofence' || !punch.photoUrl ? (
            <div className="w-24 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-300 shadow-xs bg-[#eff4ff] flex flex-col items-center justify-center p-2 text-center">
              <div className="w-10 h-10 rounded-full bg-[#00236f] text-white flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-[22px]">share_location</span>
              </div>
              <span className="font-mono-jb text-[9px] font-bold text-[#00236f] uppercase">
                GPS LOCK
              </span>
              <span className="font-mono-jb text-[8px] text-emerald-700 font-bold mt-0.5">
                ON SITE
              </span>
            </div>
          ) : (
            <div className="relative w-24 h-32 rounded-xl overflow-hidden shrink-0 border border-slate-300 shadow-sm bg-slate-900">
              <img
                src={punch.photoUrl}
                alt="Audit verification frame"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 text-[#85f8c4] font-mono-jb text-[8px] font-bold">
                VERIFIED
              </div>
              <div className="absolute bottom-1 inset-x-1 py-0.5 rounded bg-[#00236f]/90 text-white font-mono-jb text-[9px] text-center font-bold">
                {punch.confidence ? `${punch.confidence}% Confidence` : 'Optional Match'}
              </div>
            </div>
          )}

          <div className="flex flex-col justify-between text-xs py-0.5">
            <div>
              <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                Punch Type
              </span>
              <p className="font-bold text-sm text-[#00236f] uppercase">
                {punch.type.replace('-', ' ')}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                Method
              </span>
              <p className="font-bold text-[#0d1c2e] text-[11px]">
                {punch.verificationMethod === 'face_biometric'
                  ? 'Optional Face ID + GPS'
                  : 'GPS Geofence (No Face)'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                Timestamp
              </span>
              <p className="font-bold text-[#0d1c2e] font-mono-jb">
                {punch.timeFormatted}
              </p>
              <p className="text-[10px] text-slate-500 font-mono-jb">
                {punch.dateFormatted}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
                Verification State
              </span>
              <p className="font-bold text-emerald-700 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                <span>{punch.statusTag}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Telemetry & Site Details */}
        <div className="p-3 bg-[#eff4ff] rounded-xl text-xs flex flex-col gap-1.5 font-mono-jb">
          <div className="flex justify-between">
            <span className="text-slate-500">Site:</span>
            <span className="font-bold text-[#0d1c2e]">{punch.siteName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Zone:</span>
            <span className="text-[#0d1c2e]">{punch.zone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Coordinates:</span>
            <span className="text-[#0d1c2e]">
              {punch.coordinates.lat.toFixed(4)}, {punch.coordinates.lng.toFixed(4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Firm Geofence:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              <span>
                {punch.isInsideGeofence !== false ? 'Verified Inside Firm' : 'Outside Boundary'}
                {punch.distanceMeters !== undefined ? ` (${punch.distanceMeters}m)` : ''}
              </span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">GPS Accuracy:</span>
            <span className="text-emerald-700 font-bold">{punch.accuracy}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Sync Status:</span>
            <span
              className={`font-bold flex items-center gap-1 ${
                punch.synced ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {punch.synced ? 'cloud_done' : 'cloud_queue'}
              </span>
              <span>{punch.synced ? 'Cloud Synced' : 'Cached in localStorage (Queued)'}</span>
            </span>
          </div>
          <div className="flex justify-between border-t border-[#d5e3fc] pt-1.5 mt-0.5">
            <span className="text-slate-500">SHA-256 Hash:</span>
            <span className="text-[#00236f] font-bold truncate max-w-[170px]">
              {punch.hash}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Close Record
        </button>
      </div>
    </div>
  );
};
