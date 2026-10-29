import React from 'react';
import { 
  Orbit, 
  Sparkles, 
  Layers, 
  Sliders, 
  HelpCircle, 
  RotateCcw, 
  Zap, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PlanetaryParams } from '../utils/planetaryProcessing';

interface PlanetaryDeckProps {
  planetaryParams: PlanetaryParams;
  onUpdatePlanetary: (newParams: Partial<PlanetaryParams>) => void;
  onResetPlanetary: () => void;
  onOpenDerotatorModal?: () => void;
  onSwitchToRoiTab?: () => void;
}

export const PlanetaryDeck: React.FC<PlanetaryDeckProps> = ({
  planetaryParams,
  onUpdatePlanetary,
  onResetPlanetary,
  onOpenDerotatorModal,
  onSwitchToRoiTab,
}) => {
  return (
    <div className="space-y-3.5 select-none text-slate-100">
      {/* DSO & Deep Sky Target ROI Cross-Link */}
      {onSwitchToRoiTab && (
        <button
          onClick={onSwitchToRoiTab}
          className="w-full p-2.5 rounded-xl bg-purple-950/30 hover:bg-purple-950/50 border border-purple-500/40 text-left transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">🌌</span>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition">
                Looking for Galaxies, Nebulae or Clusters?
              </div>
              <div className="text-[10px] text-slate-400">
                Switch to Region of Interest (ROI) & DSO Framing Deck
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">
            Open DSO ROI →
          </span>
        </button>
      )}

      {/* 0. Planetary Derotation & Frame Stacker Trigger Banner */}
      {onOpenDerotatorModal && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#0d121d] to-[#0d121d] border border-sky-400/50 space-y-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Orbit className="w-4 h-4 text-sky-400 animate-spin" />
              <span className="text-xs font-bold text-white">Planetary Derotation & Stacking</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
              +SNR Boost
            </span>
          </div>

          <p className="text-[10px] text-slate-300 leading-relaxed">
            Eliminate atmospheric seeing drift with sub-pixel center-of-mass centroid registration, compensate for Jupiter/Saturn high-speed rotation, and stack multiple frames for cleaner signal.
          </p>

          <button
            onClick={onOpenDerotatorModal}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-md transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Open Planetary Derotator & Frame Stacker</span>
          </button>
        </div>
      )}

      {/* 1. Dwarf 3 Planetary Solver Banner */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-amber-500/40 space-y-2.5 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <div className="flex items-center gap-2">
            <Orbit className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white">Dwarf 3 Planetary Optimizer</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdatePlanetary({ enabled: !planetaryParams.enabled })}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                planetaryParams.enabled ? 'bg-amber-500' : 'bg-[#1e293b]'
              }`}
              title="Toggle Planetary Enhancement Engine"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  planetaryParams.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          The Dwarf 3's 150mm lens makes planets small targets (~50px), and auto-exposure burns them out into white blobs. These tools correct atmospheric dispersion color fringing and recover surface cloud belts and ring gaps.
        </p>

        {/* Quick Planetary Presets */}
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-semibold">
          <button
            onClick={() => {
              onUpdatePlanetary({
                enabled: true,
                adcShiftRX: 0,
                adcShiftRY: 1,
                adcShiftBX: 0,
                adcShiftBY: -1,
                waveletFine: 45,
                waveletMedium: 35,
                waveletLarge: 15,
                diskContrast: 40,
                surfaceSat: 135,
              });
            }}
            className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-center transition"
          >
            🪐 Jupiter Cloud Belts
          </button>
          <button
            onClick={() => {
              onUpdatePlanetary({
                enabled: true,
                adcShiftRX: 1,
                adcShiftRY: 1,
                adcShiftBX: -1,
                adcShiftBY: -1,
                waveletFine: 55,
                waveletMedium: 20,
                waveletLarge: 10,
                diskContrast: 35,
                surfaceSat: 110,
              });
            }}
            className="py-1.5 px-2 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 text-center transition"
          >
            🪐 Saturn Cassini Rings
          </button>
        </div>
      </div>

      {/* 2. Atmospheric Dispersion Corrector (ADC) */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-[#1f2b42] space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-400" />
            Atmospheric Dispersion Corrector (ADC)
          </label>
          <button
            onClick={() => onUpdatePlanetary({ adcShiftRX: 0, adcShiftRY: 0, adcShiftBX: 0, adcShiftBY: 0 })}
            className="text-[10px] font-mono text-slate-400 hover:text-white"
          >
            Reset ADC
          </button>
        </div>

        <p className="text-[10px] text-slate-400 leading-tight">
          When planets are low on the horizon, Earth's atmosphere bends red and blue light unevenly. Shift color planes to cancel the red/blue fringing edge.
        </p>

        {/* Red & Blue Channel Shifts */}
        <div className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-red-400 font-semibold">Red Vertical Shift (Y)</span>
              <span className="text-slate-300">{planetaryParams.adcShiftRY} px</span>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="1"
              value={planetaryParams.adcShiftRY}
              onChange={(e) => onUpdatePlanetary({ adcShiftRY: parseInt(e.target.value) })}
              className="astro-slider slider-red"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-blue-400 font-semibold">Blue Vertical Shift (Y)</span>
              <span className="text-slate-300">{planetaryParams.adcShiftBY} px</span>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="1"
              value={planetaryParams.adcShiftBY}
              onChange={(e) => onUpdatePlanetary({ adcShiftBY: parseInt(e.target.value) })}
              className="astro-slider slider-blue"
            />
          </div>
        </div>
      </div>

      {/* 3. Multi-Layer Planetary Wavelets */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-[#1f2b42] space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            Planetary Multi-Layer Wavelets
          </label>
        </div>

        <p className="text-[10px] text-slate-400 leading-tight">
          Sharpen surface features at different spatial frequencies without blowing out the disk.
        </p>

        <div className="space-y-2.5">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-emerald-300">Layer 1: Fine (Cassini Gap & Rims)</span>
              <span>{planetaryParams.waveletFine}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={planetaryParams.waveletFine}
              onChange={(e) => onUpdatePlanetary({ waveletFine: parseInt(e.target.value) })}
              className="astro-slider slider-green"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-cyan-300">Layer 2: Medium (Equatorial Cloud Belts)</span>
              <span>{planetaryParams.waveletMedium}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={planetaryParams.waveletMedium}
              onChange={(e) => onUpdatePlanetary({ waveletMedium: parseInt(e.target.value) })}
              className="astro-slider slider-cyan"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-300">Layer 3: Large (Disk Limb Contrast)</span>
              <span>{planetaryParams.waveletLarge}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={planetaryParams.waveletLarge}
              onChange={(e) => onUpdatePlanetary({ waveletLarge: parseInt(e.target.value) })}
              className="astro-slider"
            />
          </div>
        </div>
      </div>

      {/* 4. Dwarf 3 Planetary Capture Cheat Sheet Guide */}
      <div className="p-3.5 rounded-2xl bg-[#06080d] border border-amber-500/30 space-y-2.5">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
          <Info className="w-4 h-4 text-amber-400" />
          <span>Dwarf 3 Capture Settings Guide for Planets</span>
        </div>

        <div className="space-y-1.5 text-[10px] font-mono text-slate-300">
          <div className="p-2 rounded-lg bg-[#0d121d] border border-[#1f2b42] flex justify-between items-center">
            <strong className="text-white">Jupiter:</strong>
            <span className="text-amber-300">1/100s - 1/200s • Gain 0 • Burst Video</span>
          </div>
          <div className="p-2 rounded-lg bg-[#0d121d] border border-[#1f2b42] flex justify-between items-center">
            <strong className="text-white">Saturn:</strong>
            <span className="text-amber-300">1/50s - 1/80s • Gain 10 • Telephoto</span>
          </div>
          <div className="p-2 rounded-lg bg-[#0d121d] border border-[#1f2b42] flex justify-between items-center">
            <strong className="text-white">Mars:</strong>
            <span className="text-amber-300">1/120s - 1/250s • Gain 5 • Telephoto</span>
          </div>
          <div className="p-2 rounded-lg bg-[#0d121d] border border-[#1f2b42] flex justify-between items-center">
            <strong className="text-white">Moon:</strong>
            <span className="text-emerald-300">1/250s • Gain 0 • Telephoto</span>
          </div>
        </div>

        <p className="text-[9px] text-slate-500 leading-tight">
          💡 <em>Crucial Dwarf 3 Tip:</em> Always switch to Manual Exposure in the Dwarf App! Never leave it on Auto, which assumes faint deep-sky targets and over-exposes planetary discs to pure white.
        </p>
      </div>
    </div>
  );
};
