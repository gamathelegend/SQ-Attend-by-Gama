import React, { useState } from 'react';
import { PunchRecord, UserProfile } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  punches: PunchRecord[];
  profile: UserProfile;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  punches,
  profile,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadCSV = () => {
    const headers = ['Record ID', 'Type', 'Date', 'Time', 'Site', 'GPS Accuracy', 'Confidence', 'Hash', 'Status'];
    const rows = punches.map(p => [
      p.id,
      p.type,
      p.dateFormatted,
      p.timeFormatted,
      `"${p.siteName} - ${p.zone}"`,
      p.accuracy,
      `${p.confidence}%`,
      p.hash,
      p.statusTag,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sq_attend_timesheet_${profile.employeeId}_week39.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 flex flex-col gap-4 max-h-[90vh] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] text-[#00236f] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0d1c2e]">Export Attendance Audit</h3>
              <p className="font-mono-jb text-[10px] text-slate-500">
                {profile.name} • {profile.employeeId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-[#eff4ff] p-3 rounded-xl border border-[#d5e3fc] flex items-center justify-between text-xs font-mono-jb">
          <div>
            <span className="text-slate-500 text-[10px]">PAY PERIOD:</span>
            <p className="font-bold text-[#0d1c2e]">Sep 21 – Sep 27, 2026</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500 text-[10px]">TOTAL VERIFIED:</span>
            <p className="font-bold text-[#00236f] text-sm">31.8 Hours</p>
          </div>
        </div>

        {/* Audit Log Table Preview */}
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-56 pr-1">
          <span className="text-[10px] font-mono-jb uppercase text-slate-500 font-bold">
            Audit Records ({punches.length})
          </span>
          <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left font-mono-jb">
              <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-2">Type</th>
                  <th className="p-2">Time</th>
                  <th className="p-2">Site</th>
                  <th className="p-2 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {punches.slice(0, 6).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-2 capitalize font-semibold text-[#00236f]">
                      {p.type.replace('-', ' ')}
                    </td>
                    <td className="p-2 text-slate-700">{p.timeFormatted}</td>
                    <td className="p-2 text-slate-600 truncate max-w-[90px]">{p.siteName}</td>
                    <td className="p-2 text-right text-emerald-700 font-bold">{p.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security & Cryptographic Seal */}
        <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-[11px] text-[#444651]">
          <span className="material-symbols-outlined text-[18px] text-[#006c4a]">
            verified_user
          </span>
          <span>Digital SHA256 signatures attached to each punch for enterprise compliance.</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDownloadCSV}
            className="flex-1 py-2 px-3 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px]">
              {downloadSuccess ? 'check' : 'download'}
            </span>
            <span>{downloadSuccess ? 'Downloaded CSV!' : 'Download CSV Report'}</span>
          </button>
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
