import React, { useState } from 'react';

interface FieldWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartFieldWork: (purpose: string) => void;
  isFieldWorkActive: boolean;
  onEndFieldWork: () => void;
  elapsedMinutes?: number;
  remainingMinutes?: number;
}

const COMMON_PURPOSES = [
  'Client On-Site Consultation',
  'Firm Vendor Delivery / Errand',
  'Official Bank & Financial Liaison',
  'External Project Site Inspection',
  'Government & Legal Compliance Filing',
  'Hardware / Equipment Procurement',
];

export const FieldWorkModal: React.FC<FieldWorkModalProps> = ({
  isOpen,
  onClose,
  onStartFieldWork,
  isFieldWorkActive,
  onEndFieldWork,
  elapsedMinutes = 0,
  remainingMinutes = 60,
}) => {
  const [selectedPurpose, setSelectedPurpose] = useState<string>(COMMON_PURPOSES[0]);
  const [customNote, setCustomNote] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPurpose = isCustom && customNote.trim() ? customNote.trim() : selectedPurpose;
    onStartFieldWork(finalPurpose);
    onClose();
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
        className="w-full max-w-sm bg-white dark:bg-[#111c30] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col gap-4 cursor-default transition-colors text-[#0d1c2e] dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">business_center</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#0d1c2e] dark:text-white">
                {isFieldWorkActive ? 'Official Field Work Active' : 'Go Out for Firm Work'}
              </h3>
              <p className="font-mono-jb text-[10px] text-slate-500 dark:text-slate-400">
                Official Off-Site Assignment Policy
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

        {/* Policy Highlights Card */}
        <div className="flex flex-col gap-2 p-3 bg-gradient-to-br from-indigo-50/80 to-blue-50/70 dark:from-indigo-950/40 dark:to-blue-950/30 rounded-xl border border-indigo-200/70 dark:border-indigo-850/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-indigo-950 dark:text-indigo-200">
            <span className="material-symbols-outlined text-[17px] text-indigo-600 dark:text-indigo-400">
              verified
            </span>
            <span>Counted in Working Time</span>
            <span className="ml-auto text-[9px] font-mono-jb bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100 px-1.5 py-0.2 rounded uppercase font-bold">
              Paid Duty
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Time spent outside for firm assignments is recorded as official work hours. The authorized outdoor duration limit is <strong className="text-indigo-950 dark:text-indigo-200 font-bold">1 hour (60 minutes)</strong>.
          </p>
          <div className="flex items-center justify-between text-[10px] font-mono-jb pt-1 border-t border-indigo-200/50 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-300">
            <span>Outdoor Limit: <strong>1.0 Hour (60m)</strong></span>
            <span>Geofence Block: <strong>Waived</strong></span>
          </div>
        </div>

        {isFieldWorkActive ? (
          /* Active Field Work Status & Return Screen */
          <div className="flex flex-col gap-3">
            <div className="p-3 bg-slate-50 dark:bg-[#18253f] rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Elapsed Time</span>
                <span className="text-xs font-bold font-mono-jb text-[#00236f] dark:text-[#85f8c4]">
                  {Math.floor(elapsedMinutes / 60)}h {elapsedMinutes % 60}m
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    remainingMinutes <= 0
                      ? 'bg-rose-500'
                      : remainingMinutes < 30
                      ? 'bg-amber-500'
                      : 'bg-indigo-600 dark:bg-[#85f8c4]'
                  }`}
                  style={{ width: `${Math.min(100, (elapsedMinutes / 120) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Remaining Allowance:</span>
                <span
                  className={`font-mono-jb font-bold ${
                    remainingMinutes <= 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-indigo-700 dark:text-indigo-300'
                  }`}
                >
                  {remainingMinutes <= 0
                    ? 'Limit Exceeded'
                    : `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m remaining`}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onEndFieldWork();
                onClose();
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[17px]">domain_verification</span>
              <span>Returned to Office / Complete Field Work</span>
            </button>
          </div>
        ) : (
          /* Start Field Work Form */
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#0d1c2e] dark:text-slate-200">
                Official Purpose of Outdoor Assignment:
              </label>
              
              {!isCustom ? (
                <div className="flex flex-col gap-1.5 max-h-44 overflow-y-auto pr-1">
                  {COMMON_PURPOSES.map((purpose) => (
                    <label
                      key={purpose}
                      onClick={() => setSelectedPurpose(purpose)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedPurpose === purpose
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-100 font-bold'
                          : 'bg-white dark:bg-[#162238] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="purpose"
                        checked={selectedPurpose === purpose}
                        onChange={() => setSelectedPurpose(purpose)}
                        className="text-indigo-600"
                      />
                      <span className="truncate">{purpose}</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-left pt-1 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit_note</span>
                    <span>Enter custom assignment note...</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <textarea
                    rows={2}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Specify the client, project, or task reason..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#162238] text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustom(false)}
                    className="text-[11px] text-slate-500 hover:underline text-left"
                  >
                    ← Back to standard list
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">commute</span>
                <span>Confirm Outing</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
