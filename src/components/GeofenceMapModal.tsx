import React, { useState } from 'react';
import { GeofenceSite, LocationMode } from '../types';

interface GeofenceMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sites: GeofenceSite[];
  activeSite: GeofenceSite;
  onSelectSite: (site: GeofenceSite) => void;
  locationMode: LocationMode;
  onChangeLocationMode: (mode: LocationMode) => void;
  distanceMeters: number;
  isInsideGeofence: boolean;
  onUpdateSite?: (updatedSite: GeofenceSite) => void;
}

export const GeofenceMapModal: React.FC<GeofenceMapModalProps> = ({
  isOpen,
  onClose,
  sites,
  activeSite,
  onSelectSite,
  locationMode,
  onChangeLocationMode,
  distanceMeters,
  isInsideGeofence,
  onUpdateSite,
}) => {
  const [isEditingFirm, setIsEditingFirm] = useState(false);
  const [firmName, setFirmName] = useState(activeSite.name);
  const [firmAddress, setFirmAddress] = useState(activeSite.address);
  const [firmRadius, setFirmRadius] = useState(activeSite.radiusMeters);
  const [calibratingGPS, setCalibratingGPS] = useState(false);

  if (!isOpen) return null;

  const handleSaveFirmConfig = () => {
    if (onUpdateSite) {
      onUpdateSite({
        ...activeSite,
        name: firmName,
        address: firmAddress,
        radiusMeters: firmRadius,
      });
    }
    setIsEditingFirm(false);
  };

  const handleSetCurrentGPSAsFirm = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setCalibratingGPS(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCalibratingGPS(false);
        if (onUpdateSite) {
          onUpdateSite({
            ...activeSite,
            coordinates: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            },
          });
        }
      },
      err => {
        setCalibratingGPS(false);
        console.warn('Geolocation calibration error:', err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#1b2636] text-[#eaf1ff] rounded-2xl shadow-2xl border border-white/10 p-5 flex flex-col gap-4 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                isInsideGeofence ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">radar</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Firm Location &amp; Geofence</h3>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-mono-jb font-bold uppercase border ${
                    isInsideGeofence
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  }`}
                >
                  {isInsideGeofence ? 'INSIDE FIRM' : 'OUTSIDE BOUNDARY'}
                </span>
              </div>
              <p className="font-mono-jb text-[11px] text-slate-300 truncate max-w-[220px]">
                {activeSite.name} ({activeSite.code})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Location Simulator Quick Switcher */}
        <div className="flex flex-col gap-1.5 bg-black/30 p-2.5 rounded-xl border border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
              Test Location Mode:
            </span>
            <span className="text-[10px] font-mono-jb text-slate-300">
              {locationMode === 'inside'
                ? 'Simulated at Firm (~14m)'
                : locationMode === 'outside'
                ? 'Simulated Away (~380m)'
                : 'Live Device GPS'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
            <button
              onClick={() => onChangeLocationMode('inside')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 border text-[11px] ${
                locationMode === 'inside'
                  ? 'bg-emerald-600 text-white font-bold border-emerald-400 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              <span>At Firm (In)</span>
            </button>
            <button
              onClick={() => onChangeLocationMode('outside')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 border text-[11px] ${
                locationMode === 'outside'
                  ? 'bg-rose-600 text-white font-bold border-rose-400 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">location_off</span>
              <span>Away (Out)</span>
            </button>
            <button
              onClick={() => onChangeLocationMode('device')}
              className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 border text-[11px] ${
                locationMode === 'device'
                  ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-xs'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">satellite_alt</span>
              <span>Live GPS</span>
            </button>
          </div>
        </div>

        {/* Radar Graphic Simulation */}
        <div className="relative w-full aspect-square max-h-56 rounded-xl bg-[#090e17] border border-white/10 overflow-hidden flex items-center justify-center">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15"></div>

          {/* Crosshairs */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-slate-700/60"></div>
          <div className="absolute inset-y-0 left-1/2 w-px bg-slate-700/60"></div>

          {/* Concentric rings */}
          <div className="absolute w-44 h-44 rounded-full border border-dashed border-emerald-500/20"></div>
          {/* Authorized Perimeter Boundary Ring */}
          <div
            className={`absolute w-32 h-32 rounded-full border-2 transition-colors ${
              isInsideGeofence
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-rose-400/80 bg-rose-500/10'
            }`}
          ></div>
          <div className="absolute w-16 h-16 rounded-full border border-dashed border-emerald-500/40"></div>

          {/* Radar Sweep Line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-full h-full rounded-full border border-transparent origin-center animate-spin"
              style={{
                background: isInsideGeofence
                  ? 'conic-gradient(from 0deg, rgba(16, 185, 129, 0.22) 0deg, transparent 60deg)'
                  : 'conic-gradient(from 0deg, rgba(239, 68, 68, 0.22) 0deg, transparent 60deg)',
                animationDuration: '3.5s',
              }}
            />
          </div>

          {/* Outer Boundary Marker */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 font-mono-jb text-[9px] text-[#85f8c4] border border-[#85f8c4]/30 backdrop-blur-xs">
            FIRM RADIUS: {activeSite.radiusMeters}m
          </div>

          {/* Firm Center Hub Pin */}
          <div className="absolute z-10 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-blue-500 ring-2 ring-white shadow-md flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
            <span className="mt-0.5 px-1 py-0.2 rounded bg-black/80 font-mono-jb text-[8px] text-blue-300">
              FIRM HUB
            </span>
          </div>

          {/* User Pin - Dynamically positioned based on inside vs outside */}
          <div
            className="absolute z-20 flex flex-col items-center transition-all duration-500"
            style={{
              top: isInsideGeofence ? '42%' : '14%',
              left: isInsideGeofence ? '54%' : '80%',
            }}
          >
            <div className="relative flex items-center justify-center">
              <span
                className={`animate-ping absolute inline-flex h-6 w-6 rounded-full opacity-75 ${
                  isInsideGeofence ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              ></span>
              <div
                className={`w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-lg ${
                  isInsideGeofence ? 'bg-emerald-400' : 'bg-rose-500'
                }`}
              ></div>
            </div>
            <span
              className={`mt-0.5 px-1.5 py-0.5 rounded font-mono-jb text-[8px] font-bold shadow-xs whitespace-nowrap ${
                isInsideGeofence
                  ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950/90 text-rose-300 border border-rose-500/40 animate-pulse'
              }`}
            >
              {isInsideGeofence ? 'YOU (INSIDE)' : 'YOU (OUTSIDE)'}
            </span>
          </div>
        </div>

        {/* Telemetry Readout */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono-jb bg-black/40 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-slate-400 text-[10px]">PUNCH STATUS:</span>
            <p
              className={`font-bold mt-0.5 flex items-center gap-1.5 text-xs ${
                isInsideGeofence ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isInsideGeofence ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'
                }`}
              ></span>
              <span>{isInsideGeofence ? 'PUNCH IN ALLOWED' : 'PUNCH IN BLOCKED'}</span>
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">DISTANCE TO FIRM:</span>
            <p className="text-white font-bold mt-0.5 text-xs">
              {distanceMeters} meters{' '}
              <span className="text-[10px] text-slate-400">
                (Max: {activeSite.radiusMeters}m)
              </span>
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">FIRM LATITUDE:</span>
            <p className="text-slate-200 mt-0.5 text-[11px] truncate">
              {activeSite.coordinates.lat.toFixed(5)}° N
            </p>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">FIRM LONGITUDE:</span>
            <p className="text-slate-200 mt-0.5 text-[11px] truncate">
              {activeSite.coordinates.lng.toFixed(5)}° W
            </p>
          </div>
        </div>

        {/* Firm Location Settings Accordion */}
        <div className="bg-black/20 rounded-xl border border-white/10 p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono-jb font-bold text-white uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-blue-400">domain</span>
              <span>Configure Firm Location</span>
            </span>
            <button
              onClick={() => setIsEditingFirm(!isEditingFirm)}
              className="text-[10px] text-blue-300 hover:text-blue-200 underline font-mono-jb"
            >
              {isEditingFirm ? 'Cancel' : 'Edit Firm Settings'}
            </button>
          </div>

          {isEditingFirm ? (
            <div className="flex flex-col gap-2 text-xs pt-1">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Firm Name</label>
                <input
                  type="text"
                  value={firmName}
                  onChange={e => setFirmName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Address / Landmark</label>
                <input
                  type="text"
                  value={firmAddress}
                  onChange={e => setFirmAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/20 text-white text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <label className="text-[10px] text-slate-400">Allowed Geofence Radius</label>
                  <span className="text-[10px] font-mono-jb font-bold text-emerald-400">
                    {firmRadius} meters
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={firmRadius}
                  onChange={e => setFirmRadius(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSetCurrentGPSAsFirm}
                  disabled={calibratingGPS}
                  className="flex-1 py-1.5 px-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 rounded-lg text-[11px] font-medium border border-blue-400/40 flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">my_location</span>
                  <span>{calibratingGPS ? 'Calibrating...' : 'Set GPS as Firm'}</span>
                </button>
                <button
                  onClick={handleSaveFirmConfig}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow-xs"
                >
                  Save Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-300">
              <div className="flex flex-col">
                <span className="font-bold text-white text-[12px]">{activeSite.name}</span>
                <span className="text-[10px] text-slate-400">{activeSite.address}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-jb text-[10px] font-bold border border-emerald-400/30">
                Radius: {activeSite.radiusMeters}m
              </span>
            </div>
          )}
        </div>

        {/* Switch Site List */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono-jb uppercase text-slate-400 font-bold">
            Switch Monitored Firm Branch:
          </span>
          <div className="flex gap-2">
            {sites.map(site => (
              <button
                key={site.id}
                onClick={() => onSelectSite(site)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                  site.id === activeSite.id
                    ? 'bg-[#00236f] text-white border-blue-400 font-bold'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {site.code}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Confirm &amp; Return
        </button>
      </div>
    </div>
  );
};
