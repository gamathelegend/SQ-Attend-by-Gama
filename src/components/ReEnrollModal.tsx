import React, { useState } from 'react';
import { OFFICIAL_SELFIE_URL } from '../utils/mockData';
import { playSuccessChime } from '../utils/audio';

interface ReEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrollSuccess: () => void;
}

export const ReEnrollModal: React.FC<ReEnrollModalProps> = ({
  isOpen,
  onClose,
  onEnrollSuccess,
}) => {
  const [step, setStep] = useState<'scan' | 'complete'>('scan');
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const handleStartScan = () => {
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        playSuccessChime();
        setStep('complete');
      }
    }, 70);
  };

  const handleFinish = () => {
    onEnrollSuccess();
    setStep('scan');
    setProgress(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#233144] text-[#eaf1ff] rounded-2xl shadow-2xl border border-white/10 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006c4a] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">face</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Biometric Calibration</h3>
              <p className="font-mono-jb text-[10px] text-[#85f8c4]">3D Facial Mesh v2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {step === 'scan' ? (
          <>
            <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-900 border border-[#85f8c4]/40 flex items-center justify-center">
              <img
                src={OFFICIAL_SELFIE_URL}
                alt="Calibration target"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-85"
              />
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute w-36 h-48 rounded-[50%] border-2 border-dashed border-[#85f8c4] flex items-center justify-center">
                <span className="material-symbols-outlined text-[#85f8c4] text-[24px]">add</span>
              </div>
              {progress > 0 && (
                <div className="absolute inset-x-6 bottom-4 bg-black/80 p-2 rounded-lg text-center font-mono-jb text-xs text-[#85f8c4]">
                  Mapping 468 mesh landmarks ({progress}%)
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 text-center">
              Look directly into the camera lens with neutral facial expression.
            </p>

            <button
              onClick={handleStartScan}
              disabled={progress > 0}
              className="w-full py-2 bg-[#00236f] hover:bg-[#1e3a8a] text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {progress > 0 ? `Scanning ${progress}%...` : 'Begin Calibration'}
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#82f5c1] text-[#006c4a] flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-[30px]">check</span>
            </div>
            <h4 className="font-bold text-white text-base">Biometric Template Updated</h4>
            <p className="text-xs text-slate-300 font-mono-jb">
              SHA256 signature generated: 8f92b7c4d1e039aa50284c8310b91e77
            </p>
            <button
              onClick={handleFinish}
              className="w-full mt-2 py-2 bg-[#006c4a] text-white rounded-xl text-xs font-bold"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
