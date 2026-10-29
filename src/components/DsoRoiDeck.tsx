import React, { useState } from 'react';
import { 
  Crosshair, 
  Scan, 
  Sparkles, 
  Sliders, 
  ZoomIn, 
  Target, 
  Eye, 
  Layers, 
  Flame, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Maximize2,
  Info
} from 'lucide-react';
import { DsoRoiType, DsoRoiParams, LoadedAstroImage } from '../types/fits';
import { 
  detectRoiForTarget, 
  DSO_ROI_PRESETS, 
  DetectedRoiResult 
} from '../utils/dsoRoiProcessing';

interface DsoRoiDeckProps {
  roiParams: DsoRoiParams;
  onUpdateRoi: (newParams: Partial<DsoRoiParams>) => void;
  onResetRoi: () => void;
  currentImage: LoadedAstroImage | null;
  onCenterViewportOnRoi: () => void;
  onShowToast: (msg: string) => void;
}

export const DsoRoiDeck: React.FC<DsoRoiDeckProps> = ({
  roiParams,
  onUpdateRoi,
  onResetRoi,
  currentImage,
  onCenterViewportOnRoi,
  onShowToast,
}) => {
  const [detecting, setDetecting] = useState(false);
  const [lastDetection, setLastDetection] = useState<DetectedRoiResult | null>(null);

  const targetTypes: Array<{
    id: DsoRoiType;
    label: string;
    icon: string;
    desc: string;
    accent: string;
  }> = [
    {
      id: 'galaxy',
      label: 'Galaxies',
      icon: '🌌',
      desc: 'Galactic nucleus, spiral dust absorption lanes, and tidal halo framing',
      accent: 'border-purple-500/50 text-purple-300 bg-purple-500/10',
    },
    {
      id: 'nebula',
      label: 'Nebulae',
      icon: '☁️',
      desc: 'Diffuse gas envelopes, ionization cores (Trapezium), and H-alpha/OIII shockfronts',
      accent: 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10',
    },
    {
      id: 'cluster',
      label: 'Star Clusters',
      icon: '⭐',
      desc: 'Globular & open cluster stellar density centers with pinpoint star separation',
      accent: 'border-amber-500/50 text-amber-300 bg-amber-500/10',
    },
    {
      id: 'planet',
      label: 'Planets',
      icon: '🪐',
      desc: 'Sub-pixel planetary disc auto-centering, limb contrast, and atmospheric bands',
      accent: 'border-sky-500/50 text-sky-300 bg-sky-500/10',
    },
  ];

  const handleAutoDetect = () => {
    if (!currentImage) {
      onShowToast('Please load an astronomical image first');
      return;
    }

    setDetecting(true);
    setTimeout(() => {
      try {
        const result = detectRoiForTarget(
          roiParams.targetType,
          currentImage.chR,
          currentImage.chG,
          currentImage.chB,
          currentImage.width,
          currentImage.height
        );

        setLastDetection(result);
        onUpdateRoi({
          enabled: true,
          centerX: result.centerX,
          centerY: result.centerY,
          width: result.width,
          height: result.height,
          detectedLabel: result.label,
          detectedConfidence: result.confidence,
          showOverlay: true,
        });

        // Trigger viewport re-centering
        onCenterViewportOnRoi();

        onShowToast(`🎯 Auto-Detected ${result.label} (Confidence: ${Math.round(result.confidence * 100)}%)`);
      } catch (err) {
        console.error('ROI Detection Error:', err);
        onShowToast('Failed to auto-detect ROI for this image');
      } finally {
        setDetecting(false);
      }
    }, 80);
  };

  const handleApplyPreset = (preset: typeof DSO_ROI_PRESETS[0]) => {
    onUpdateRoi(preset.params);
    setTimeout(() => {
      onCenterViewportOnRoi();
    }, 50);
    onShowToast(`Applied ${preset.name} ROI preset`);
  };

  return (
    <div className="space-y-3.5 select-none text-slate-100">
      {/* 1. Header & Master Enable Switch */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-indigo-500/40 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white">Target ROI & Framing Deck</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateRoi({ enabled: !roiParams.enabled })}
              className={`w-11 h-6 rounded-full relative transition-colors ${
                roiParams.enabled ? 'bg-indigo-500' : 'bg-[#1e293b]'
              }`}
              title="Toggle ROI Framing Engine"
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  roiParams.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 leading-relaxed">
          Region of Interest (ROI) auto-centering and digital framing for <strong>Galaxies</strong>, <strong>Nebulae</strong>, <strong>Star Clusters</strong>, and <strong>Planets</strong>. Auto-locates galactic nuclei, emission envelopes, and stellar density cores.
        </p>

        {/* Target Type Selector */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {targetTypes.map((t) => {
            const isSelected = roiParams.targetType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onUpdateRoi({ targetType: t.id, enabled: true })}
                className={`p-2 rounded-xl text-left border transition flex items-center gap-2 ${
                  isSelected
                    ? t.accent + ' shadow-md'
                    : 'bg-[#090d16] border-[#1f2b42] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{t.label}</div>
                  <div className="text-[9px] text-slate-400 truncate">{t.id.toUpperCase()}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Auto-Detect ROI Button */}
        <div className="pt-1">
          <button
            onClick={handleAutoDetect}
            disabled={detecting}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {detecting ? (
              <>
                <Crosshair className="w-4 h-4 animate-spin text-slate-950" />
                <span>Analyzing Astronomical Frame...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Auto-Detect {targetTypes.find((t) => t.id === roiParams.targetType)?.label} ROI</span>
              </>
            )}
          </button>
        </div>

        {/* Last Detection Pill */}
        {lastDetection && (
          <div className="p-2.5 rounded-xl bg-[#090d16] border border-indigo-500/30 text-[10px] space-y-1">
            <div className="flex items-center justify-between text-indigo-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {lastDetection.label}
              </span>
              <span className="font-mono text-emerald-400">
                {Math.round(lastDetection.confidence * 100)}% match
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[9px] flex flex-wrap gap-x-3">
              <span>Center: ({lastDetection.details.subPixelX}, {lastDetection.details.subPixelY}) px</span>
              <span>Morphology: {lastDetection.details.morphology}</span>
              <span>FOV: {lastDetection.details.estimatedDiameterPx} px</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Digital ROI Zoom & Viewport Framing */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-[#1f2b42] space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <ZoomIn className="w-4 h-4 text-sky-400" />
            Digital ROI Framing & Zoom
          </label>
          <button
            onClick={onCenterViewportOnRoi}
            className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/40 text-[10px] font-mono text-sky-300 hover:bg-sky-500/25 flex items-center gap-1 transition"
            title="Snap Viewport to Center on ROI Box"
          >
            <Crosshair className="w-3 h-3" />
            <span>Center on ROI</span>
          </button>
        </div>

        {/* Zoom Level Switcher */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-slate-300">
            <span>ROI Zoom Scale</span>
            <span className="text-sky-400 font-bold">{roiParams.zoomLevel}× Magnification</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[11px] font-mono font-semibold">
            {[1, 2, 4, 8].map((lvl) => {
              const active = roiParams.zoomLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    onUpdateRoi({ zoomLevel: lvl as any, enabled: true });
                    setTimeout(() => onCenterViewportOnRoi(), 40);
                  }}
                  className={`py-1.5 rounded-lg border transition ${
                    active
                      ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold shadow'
                      : 'bg-[#090d16] border-[#1f2b42] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {lvl}× {lvl === 1 ? 'Full' : lvl === 2 ? 'Frame' : lvl === 4 ? 'Core' : 'Ultra'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overlay toggle */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-slate-300">Show Astronomical HUD Reticle</span>
          <button
            onClick={() => onUpdateRoi({ showOverlay: !roiParams.showOverlay })}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono font-semibold transition ${
              roiParams.showOverlay
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {roiParams.showOverlay ? 'ON (Reticle Visible)' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 3. Core HDR Recovery & Detail Enhancement inside ROI */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-[#1f2b42] space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            ROI Core HDR & Detail Enhancer
          </label>
        </div>

        <p className="text-[10px] text-slate-400 leading-tight">
          Protects galactic cores and star clusters from burning into solid white blobs, while pulling out delicate dust filaments and stellar pinpoints.
        </p>

        <div className="space-y-3">
          {/* Core HDR Recovery */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-amber-300">Core Blowout HDR Compression</span>
              <span>{roiParams.coreHdr}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={roiParams.coreHdr}
              onChange={(e) => onUpdateRoi({ coreHdr: parseInt(e.target.value), enabled: true })}
              className="astro-slider slider-amber"
            />
            <span className="text-[9px] text-slate-500">Recovers nuclear detail in M31 core, M42 Trapezium, or M13 center</span>
          </div>

          {/* Micro-Contrast / Dust Lanes / Pinpoints */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-cyan-300">Micro-Contrast & Structural Clarity</span>
              <span>{roiParams.detailEnhance}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={roiParams.detailEnhance}
              onChange={(e) => onUpdateRoi({ detailEnhance: parseInt(e.target.value), enabled: true })}
              className="astro-slider slider-cyan"
            />
            <span className="text-[9px] text-slate-500">
              {roiParams.targetType === 'galaxy'
                ? 'Emphasizes dark spiral dust absorption bands'
                : roiParams.targetType === 'nebula'
                ? 'Heightens ionization gas filaments & shockwaves'
                : roiParams.targetType === 'cluster'
                ? 'Separates crowded stars into crisp individual points'
                : 'Sharpens planetary cloud bands and Cassini division'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Fine-Tune ROI Framing Coordinates */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-[#1f2b42] space-y-3 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-slate-400" />
            ROI Coordinate Framing
          </label>
          <button
            onClick={() => onUpdateRoi({ centerX: 0.5, centerY: 0.5, width: 0.35, height: 0.35 })}
            className="text-[10px] font-mono text-slate-400 hover:text-white"
          >
            Reset Center
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Center X:</span>
              <span className="text-sky-300">{Math.round(roiParams.centerX * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={roiParams.centerX}
              onChange={(e) => onUpdateRoi({ centerX: parseFloat(e.target.value), enabled: true })}
              className="astro-slider"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Center Y:</span>
              <span className="text-sky-300">{Math.round(roiParams.centerY * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.95"
              step="0.01"
              value={roiParams.centerY}
              onChange={(e) => onUpdateRoi({ centerY: parseFloat(e.target.value), enabled: true })}
              className="astro-slider"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Box Width:</span>
              <span className="text-emerald-300">{Math.round(roiParams.width * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.02"
              value={roiParams.width}
              onChange={(e) => onUpdateRoi({ width: parseFloat(e.target.value), enabled: true })}
              className="astro-slider"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Box Height:</span>
              <span className="text-emerald-300">{Math.round(roiParams.height * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.02"
              value={roiParams.height}
              onChange={(e) => onUpdateRoi({ height: parseFloat(e.target.value), enabled: true })}
              className="astro-slider"
            />
          </div>
        </div>
      </div>

      {/* 5. Celestial DSO & Planetary ROI Presets */}
      <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-[#1f2b42] space-y-2.5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
          <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-purple-400" />
            Curated Celestial ROI Presets
          </label>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {DSO_ROI_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className="p-2.5 rounded-xl bg-[#090d16] hover:bg-[#121927] border border-[#1f2b42] hover:border-purple-500/50 text-left transition group"
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-white group-hover:text-purple-300 transition">
                  {preset.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {preset.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 6. Dwarf 3 Smart Telescope Optical Reference */}
      <div className="p-3.5 rounded-2xl bg-[#06080d] border border-indigo-500/30 space-y-2 text-[10px]">
        <div className="flex items-center gap-2 text-indigo-300 font-bold">
          <Info className="w-4 h-4 text-indigo-400" />
          <span>Dwarf 3 Sensor & ROI Resolution Guide</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          The Dwarf 3 features a 24mm aperture / 150mm telephoto lens with a 3840×2160 Sony Starvis 2 IMX678 sensor (2.0µm pixels, ~3.0°×1.7° field of view).
        </p>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-slate-300">
          <div className="p-1.5 rounded bg-[#0d121d] border border-[#1f2b42]">
            <strong className="text-purple-300">Galaxies:</strong> Core fits in ~300-600px ROI. Use 2x/4x with HDR compression.
          </div>
          <div className="p-1.5 rounded bg-[#0d121d] border border-[#1f2b42]">
            <strong className="text-emerald-300">Nebulae:</strong> M42 spans ~60% of frame. Use 2x ROI for Trapezium core.
          </div>
          <div className="p-1.5 rounded bg-[#0d121d] border border-[#1f2b42]">
            <strong className="text-amber-300">Clusters:</strong> M13 spans ~250px. 4x ROI resolves thousands of stars.
          </div>
          <div className="p-1.5 rounded bg-[#0d121d] border border-[#1f2b42]">
            <strong className="text-sky-300">Planets:</strong> Jupiter spans ~40-50px. 8x ROI centers the planetary disc.
          </div>
        </div>
      </div>
    </div>
  );
};
