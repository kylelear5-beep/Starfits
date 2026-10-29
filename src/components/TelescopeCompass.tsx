import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Navigation, 
  Crosshair, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  Smartphone,
  Eye,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { CalculatedTarget, degreesToCompass } from '../utils/celestial';

interface TelescopeCompassProps {
  selectedTarget: CalculatedTarget | null;
  onSelectTarget: (target: CalculatedTarget) => void;
  visibleTargets: CalculatedTarget[];
  onClose?: () => void;
}

export const TelescopeCompass: React.FC<TelescopeCompassProps> = ({
  selectedTarget,
  onSelectTarget,
  visibleTargets,
  onClose,
}) => {
  // Current orientation angles
  const [heading, setHeading] = useState(0); // 0 - 360 deg
  const [pitch, setPitch] = useState(45);     // 0 - 90 deg (altitude tilt)
  const [roll, setRoll] = useState(0);       // -45 to +45 deg (level balance)
  const [sensorActive, setSensorActive] = useState(false);
  const [sensorSupported, setSensorSupported] = useState(false);

  // Check hardware orientation sensor support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setSensorSupported(true);
    }
  }, []);

  // Handle hardware device orientation
  const requestSensorAccess = async () => {
    if (typeof (DeviceOrientationEvent as any)?.requestPermission === 'function') {
      try {
        const response = await (DeviceOrientationEvent as any).requestPermission();
        if (response === 'granted') {
          startOrientationListener();
        }
      } catch (err) {
        console.warn('Orientation permission error:', err);
      }
    } else {
      startOrientationListener();
    }
  };

  const startOrientationListener = () => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        // e.alpha = compass heading (0 - 360)
        // e.beta = front-to-back tilt (-180 to 180) -> altitude
        // e.gamma = left-to-right tilt (-90 to 90) -> roll level
        const currentAlpha = 360 - e.alpha;
        setHeading(Math.round(((currentAlpha % 360) + 360) % 360));
        setPitch(Math.max(0, Math.min(90, Math.round(Math.abs(e.beta || 0)))));
        setRoll(Math.round(e.gamma || 0));
        setSensorActive(true);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
  };

  // Target alignment calculation
  const targetAz = selectedTarget?.azimuth ?? 135;
  const targetAlt = selectedTarget?.altitude ?? 45;

  const azDiff = ((targetAz - heading + 540) % 360) - 180; // -180 to +180
  const altDiff = targetAlt - pitch;

  const isLevel = Math.abs(roll) < 2.0;
  const isAligned = Math.abs(azDiff) < 3.0 && Math.abs(altDiff) < 3.0;

  return (
    <div className="p-4 rounded-2xl bg-[#090d16] border border-[#1f2b42] text-slate-100 shadow-2xl space-y-4 select-none">
      {/* Title & Status */}
      <div className="flex items-center justify-between border-b border-[#1f2b42] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Dwarf 3 Setup Compass & Inclinometer</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Azimuth Compass • Altitude Tilt • Tripod Leveling
            </p>
          </div>
        </div>

        {sensorSupported && (
          <button
            onClick={requestSensorAccess}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 transition ${
              sensorActive
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-[#131b2b] hover:bg-[#1c273e] border-[#1f2b42] text-slate-300'
            }`}
            title="Use device gyroscope and magnetic compass"
          >
            <Smartphone className="w-3 h-3" />
            <span>{sensorActive ? 'Live Sensor' : 'Enable Device Sensor'}</span>
          </button>
        )}
      </div>

      {/* Target Selector Dropdown */}
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
          Target to Align (Altitude & Azimuth)
        </label>
        <select
          value={selectedTarget?.id || ''}
          onChange={(e) => {
            const found = visibleTargets.find((t) => t.id === e.target.value);
            if (found) onSelectTarget(found);
          }}
          className="w-full py-2 px-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-400"
        >
          {visibleTargets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.type.toUpperCase()}) — Alt: {t.altitude}° ({t.visibilityRating}) • Az: {t.azimuth}° {t.compassDirection}
            </option>
          ))}
        </select>
      </div>

      {/* Main Dual Gauge: 360° Compass & Inclinometer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* 1. Compass Rose (Azimuth) */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-[#04060a] border border-[#1f2b42] space-y-2">
          <div className="flex items-center justify-between w-full text-[11px] font-mono">
            <span className="text-slate-400">Azimuth Direction</span>
            <span className="font-bold text-sky-400 text-sm">
              {heading}° <span className="text-xs text-slate-300 font-normal">({degreesToCompass(heading)})</span>
            </span>
          </div>

          {/* Interactive Visual Compass Dial */}
          <div className="relative w-44 h-44 rounded-full border-2 border-[#1f2b42] bg-gradient-to-b from-[#090d16] to-[#04060a] flex items-center justify-center shadow-inner overflow-hidden">
            {/* Cardinal Markers */}
            <span className="absolute top-1 font-bold text-red-400 text-xs font-mono">N</span>
            <span className="absolute right-1.5 font-bold text-slate-300 text-xs font-mono">E</span>
            <span className="absolute bottom-1 font-bold text-slate-300 text-xs font-mono">S</span>
            <span className="absolute left-1.5 font-bold text-slate-300 text-xs font-mono">W</span>

            {/* Target Needle (Gold/Cyan) */}
            <div
              className="absolute w-full h-full pointer-events-none transition-transform duration-300"
              style={{ transform: `rotate(${targetAz}deg)` }}
            >
              <div className="w-1 h-14 bg-amber-400 mx-auto rounded-t-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 text-[9px] font-bold text-amber-300 bg-black/60 px-1 rounded">
                Target
              </div>
            </div>

            {/* Telescope Needle (Red/White) */}
            <div
              className="absolute w-full h-full pointer-events-none transition-transform duration-150"
              style={{ transform: `rotate(${heading}deg)` }}
            >
              <div className="w-1.5 h-16 bg-red-500 mx-auto rounded-t-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <div className="w-1.5 h-10 bg-slate-200 mx-auto rounded-b-full opacity-60" />
            </div>

            {/* Center Pivot Hub */}
            <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-sky-400 shadow-md z-10 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            </div>
          </div>

          {/* Manual Heading Slider */}
          <div className="w-full space-y-1 pt-1">
            <input
              type="range"
              min="0"
              max="359"
              value={heading}
              onChange={(e) => setHeading(parseInt(e.target.value))}
              className="astro-slider slider-blue"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0° (North)</span>
              <span>90° (East)</span>
              <span>180° (South)</span>
              <span>270° (West)</span>
            </div>
          </div>
        </div>

        {/* 2. Inclinometer (Altitude Angle) & Tripod Level */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-[#04060a] border border-[#1f2b42] space-y-2">
          <div className="flex items-center justify-between w-full text-[11px] font-mono">
            <span className="text-slate-400">Altitude Pitch Angle</span>
            <span className="font-bold text-emerald-400 text-sm">
              {pitch}° <span className="text-xs text-slate-400 font-normal">Elevation</span>
            </span>
          </div>

          {/* Altitude Pitch Arc Display */}
          <div className="relative w-44 h-44 rounded-full border border-[#1f2b42] bg-[#090d16] flex items-center justify-center overflow-hidden">
            {/* Horizon and Zenith labels */}
            <div className="absolute inset-x-2 top-1/2 h-px bg-slate-700 pointer-events-none" />
            <span className="absolute bottom-2 text-[9px] font-mono text-slate-500">0° Horizon</span>
            <span className="absolute top-2 text-[9px] font-mono text-slate-500">90° Zenith</span>

            {/* Target Altitude Mark */}
            <div
              className="absolute left-1/2 bottom-1/2 w-20 h-0.5 bg-amber-400 origin-left transition-transform duration-300"
              style={{ transform: `rotate(${-targetAlt}deg)` }}
            >
              <span className="absolute right-0 -top-3 text-[9px] font-bold text-amber-300">
                {targetAlt}° Target
              </span>
            </div>

            {/* Current Telescope Angle Needle */}
            <div
              className="absolute left-1/2 bottom-1/2 w-20 h-1 bg-emerald-400 origin-left shadow-[0_0_8px_rgba(52,211,153,0.8)] transition-transform duration-150"
              style={{ transform: `rotate(${-pitch}deg)` }}
            />

            {/* Dual-Axis Level Bubble Indicator in center */}
            <div className="w-16 h-16 rounded-full border-2 border-slate-700 bg-slate-900/90 flex items-center justify-center relative">
              <div className="w-6 h-6 rounded-full border border-dashed border-slate-600" />
              {/* Floating Bubble */}
              <div
                className={`w-3.5 h-3.5 rounded-full shadow-md transition-all duration-150 ${
                  isLevel ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
                style={{
                  transform: `translate(${Math.max(-20, Math.min(20, roll))}px, ${Math.max(-20, Math.min(20, (pitch - 45) * 0.4))}px)`,
                }}
              />
            </div>
          </div>

          {/* Manual Altitude Slider */}
          <div className="w-full space-y-1 pt-1">
            <input
              type="range"
              min="0"
              max="90"
              value={pitch}
              onChange={(e) => setPitch(parseInt(e.target.value))}
              className="astro-slider slider-green"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span>0° (Horizontal)</span>
              <span>45° (Mid-Sky)</span>
              <span>90° (Zenith Straight Up)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Alignment Direction Guidance */}
      <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono ${
        isAligned
          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
          : 'bg-[#131b2b] border-[#1f2b42] text-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          {isAligned ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <Crosshair className="w-5 h-5 text-amber-400 animate-pulse" />
          )}
          <div>
            <div className="font-bold">
              {isAligned ? '✅ Telescope Aligned with Target!' : `Aiming Guidance for ${selectedTarget?.name || 'Target'}:`}
            </div>
            {!isAligned && (
              <div className="text-[11px] text-slate-400 font-normal">
                {azDiff > 0 ? `Turn Right (East) by ${Math.abs(azDiff).toFixed(1)}°` : `Turn Left (West) by ${Math.abs(azDiff).toFixed(1)}°`}
                {' • '}
                {altDiff > 0 ? `Tilt UP by ${Math.abs(altDiff).toFixed(1)}°` : `Tilt DOWN by ${Math.abs(altDiff).toFixed(1)}°`}
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase">Tripod Base</div>
          <div className={`font-semibold ${isLevel ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isLevel ? 'Perfect Level' : `Tilt: ${roll}°`}
          </div>
        </div>
      </div>
    </div>
  );
};
