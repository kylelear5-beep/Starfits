import React from 'react';
import { 
  Zap, 
  RotateCcw, 
  Target, 
  Sliders, 
  Palette, 
  Sparkles, 
  FileText, 
  Cloud,
  Crosshair,
  Stars,
  Sun,
  Flame,
  Shield,
  Eye,
  Disc,
  Orbit,
  Compass,
  Undo2,
  ExternalLink,
  Scan,
  Bird,
  Plane,
  Car,
  PawPrint,
  Radio,
  Check
} from 'lucide-react';
import { AstroProcessingParams, StretchMethod, LoadedAstroImage, DsoRoiParams, DwarfTrackingMode, DwarfTrackingState } from '../types/fits';
import { PlanetaryParams } from '../utils/planetaryProcessing';
import { CalculatedTarget } from '../utils/celestial';
import { DWARF_TRACKING_CONFIGS } from '../utils/dwarfTracking';
import { PlanetaryDeck } from './PlanetaryDeck';
import { TelescopeCompass } from './TelescopeCompass';
import { SkyWeatherDeck } from './SkyWeatherDeck';
import { DsoRoiDeck } from './DsoRoiDeck';

interface ControlDeckProps {
  params: AstroProcessingParams;
  onUpdateParams: (newParams: Partial<AstroProcessingParams>) => void;
  onAutoSTF: () => void;
  onResetStretch: () => void;
  onAutoNeutralizeBg: () => void;
  pickingMask: boolean;
  onStartPickingMask: () => void;
  pickingBackground: boolean;
  onStartPickingBg: () => void;
  currentImage: LoadedAstroImage | null;
  onFetchRemoteUrl: (url: string) => void;
  isFetchingUrl: boolean;
  onOpenHeaderModal: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  planetaryParams: PlanetaryParams;
  onUpdatePlanetary: (newParams: Partial<PlanetaryParams>) => void;
  onResetPlanetary: () => void;
  selectedTarget: CalculatedTarget | null;
  onSelectTarget: (target: CalculatedTarget) => void;
  visibleTargets: CalculatedTarget[];
  onRevertToOriginal: () => void;
  onOpenDerotatorModal?: () => void;
  roiParams: DsoRoiParams;
  onUpdateRoi: (newParams: Partial<DsoRoiParams>) => void;
  onResetRoi: () => void;
  onCenterViewportOnRoi: () => void;
  onShowToast: (msg: string) => void;
  trackingState?: DwarfTrackingState;
  onUpdateTrackingState?: (updates: Partial<DwarfTrackingState>) => void;
  onSelectTrackingMode?: (mode: DwarfTrackingMode, autoLoadSample?: boolean) => void;
  onOpenGeminiAi?: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  params,
  onUpdateParams,
  onAutoSTF,
  onResetStretch,
  onAutoNeutralizeBg,
  pickingMask,
  onStartPickingMask,
  pickingBackground,
  onStartPickingBg,
  currentImage,
  onFetchRemoteUrl,
  isFetchingUrl,
  onOpenHeaderModal,
  activeTab,
  onTabChange,
  planetaryParams,
  onUpdatePlanetary,
  onResetPlanetary,
  selectedTarget,
  onSelectTarget,
  visibleTargets,
  onRevertToOriginal,
  onOpenDerotatorModal,
  roiParams,
  onUpdateRoi,
  onResetRoi,
  onCenterViewportOnRoi,
  onShowToast,
  trackingState,
  onUpdateTrackingState,
  onSelectTrackingMode,
  onOpenGeminiAi,
}) => {
  const [cloudUrl, setCloudUrl] = React.useState(
    'https://global.dwarflabapp.com/dwarf-prod/user/2106070080526692352/photo-process/result/7dd420f672548df9cd0e7eefbb58e65f.fits'
  );
  const [setupSubTab, setSetupSubTab] = React.useState<'compass' | 'sky'>('compass');

  const tabs = [
    { id: 'tabStretch', label: 'Stretch', icon: Sliders },
    { id: 'tabTracking', label: 'Tracking', icon: Crosshair },
    { id: 'tabROI', label: 'ROI & DSO', icon: Scan },
    { id: 'tabColor', label: 'Color', icon: Palette },
    { id: 'tabFX', label: 'Stars & FX', icon: Sparkles },
    { id: 'tabPlanetary', label: 'Planets', icon: Orbit },
    { id: 'tabSetup', label: 'Setup & Sky', icon: Compass },
    { id: 'tabHeader', label: 'FITS', icon: FileText },
    { id: 'tabSource', label: 'Cloud', icon: Cloud },
  ];

  return (
    <aside className="w-full lg:w-[440px] h-[52dvh] lg:h-full shrink-0 bg-[#090d16] border-t lg:border-t-0 lg:border-l border-[#1f2b42] flex flex-col z-20 select-none">
      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-[#1f2b42] bg-[#0d121d]/90 text-[11px] font-semibold shrink-0 no-scrollbar">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`py-2.5 px-3 whitespace-nowrap text-center border-b-2 transition flex items-center justify-center gap-1.5 shrink-0 ${
                isActive
                  ? 'border-sky-400 text-sky-300 bg-sky-500/10 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <t.icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-12">
        {/* TAB 1: STRETCH & TONE */}
        {activeTab === 'tabStretch' && (
          <div className="space-y-3.5">
            {/* Gemini AI Auto-Tuner Banner */}
            {onOpenGeminiAi && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-[#0d121d] border border-purple-500/40 flex items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/40">
                    <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      <span>Gemini AI Auto-Tuner</span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-[9px] font-mono text-purple-200 border border-purple-400/30">
                        1-Click
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Plate solves target & calculates optimal stretch curve
                    </div>
                  </div>
                </div>
                <button
                  onClick={onOpenGeminiAi}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-slate-950 font-bold text-xs shrink-0 transition active:scale-95 shadow"
                >
                  Analyze & Auto-Tune
                </button>
              </div>
            )}

            {/* Stretch Algorithm Selection */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">
                Non-Linear Stretch Curve
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-medium">
                {(['mtf', 'asinh', 'ghs'] as StretchMethod[]).map((method) => {
                  const labels: Record<StretchMethod, string> = {
                    mtf: 'MTF (PixInsight)',
                    asinh: 'Arcsinh (Color)',
                    ghs: 'Hyperbolic (GHS)',
                    linear: 'Linear',
                    log: 'Logarithmic',
                  };
                  return (
                    <button
                      key={method}
                      onClick={() => onUpdateParams({ stretchMethod: method })}
                      className={`py-1.5 px-2 rounded-lg border text-center transition ${
                        params.stretchMethod === method
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold shadow-sm'
                          : 'bg-[#131b2b] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {labels[method]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Black Point */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Black Point (Shadows Clip)
                </label>
                <span className="text-[11px] font-mono font-semibold text-amber-300">
                  {params.blackPoint.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.0001"
                value={params.blackPoint}
                onChange={(e) => onUpdateParams({ blackPoint: parseFloat(e.target.value) })}
                className="astro-slider slider-amber"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.0000 (Preserve faint halo)</span>
                <span>0.4000 (Clip sky)</span>
              </div>
            </div>

            {/* Midtones Stretch */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  Midtone Stretch Factor (MTF)
                </label>
                <span className="text-[11px] font-mono font-semibold text-sky-300">
                  {params.midtones.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.45"
                step="0.0005"
                value={params.midtones}
                onChange={(e) => onUpdateParams({ midtones: parseFloat(e.target.value) })}
                className="astro-slider"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Aggressive Stretch (0.01)</span>
                <span>Mild (0.30)</span>
              </div>
            </div>

            {/* White Point */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  White Point
                </label>
                <span className="text-[11px] font-mono font-semibold text-emerald-300">
                  {params.whitePoint.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.001"
                value={params.whitePoint}
                onChange={(e) => onUpdateParams({ whitePoint: parseFloat(e.target.value) })}
                className="astro-slider slider-green"
              />
            </div>

            {/* Highlight Core Compression (HDR) */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  Highlight Core Compression (HDR)
                </label>
                <span className="text-[11px] font-mono text-orange-300 font-semibold">
                  {Math.round(params.hdrCompress)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={params.hdrCompress}
                onChange={(e) => onUpdateParams({ hdrCompress: parseInt(e.target.value) })}
                className="astro-slider"
              />
              <p className="text-[10px] text-slate-400 leading-tight">
                Protects and recovers burned-out cores in galaxies (Andromeda) and bright nebulae (Orion Trapezium).
              </p>
            </div>

            {/* Arcsinh Beta (if active) */}
            {params.stretchMethod === 'asinh' && (
              <div className="p-3 rounded-xl bg-[#0d121d] border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-sky-300">
                    Arcsinh Beta Stretch Factor
                  </label>
                  <span className="text-[11px] font-mono text-sky-400 font-semibold">
                    {params.asinhBeta}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={params.asinhBeta}
                  onChange={(e) => onUpdateParams({ asinhBeta: parseInt(e.target.value) })}
                  className="astro-slider"
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: COLOR & PEDESTAL */}
        {activeTab === 'tabColor' && (
          <div className="space-y-3.5">
            {/* Background Neutralization */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-sky-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Sky Background Neutralization
                </label>
                <span className="text-[10px] font-mono text-sky-400">Color Calibration</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onAutoNeutralizeBg}
                  className="py-2 px-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-xs font-semibold text-sky-300 transition text-center"
                >
                  ⚡ Auto Neutralize
                </button>
                <button
                  onClick={onStartPickingBg}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition text-center flex items-center justify-center gap-1 ${
                    pickingBackground
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-[#131b2b] hover:bg-[#1f2b42] border-[#1f2b42] text-slate-300'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Sample Sky Patch</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Equalizes sky background across channels to eliminate light pollution gradients and color casts.
              </p>
            </div>

            {/* SCNR (Selective Color Noise Reduction) */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  SCNR (Remove Green Cast)
                </label>
                <span className="text-[11px] font-mono font-semibold text-emerald-400">
                  {Math.round(params.scnrGreen * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={Math.round(params.scnrGreen * 100)}
                onChange={(e) => onUpdateParams({ scnrGreen: parseInt(e.target.value) / 100 })}
                className="astro-slider slider-green"
              />
              <p className="text-[10px] text-slate-400 leading-tight">
                Crucial for OSC color sensors where the Bayer matrix has 2× Green photosites.
              </p>
            </div>

            {/* Saturation */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-200">
                  Color Saturation
                </label>
                <span className="text-[11px] font-mono font-semibold text-sky-300">
                  {Math.round(params.saturation * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="1"
                value={Math.round(params.saturation * 100)}
                onChange={(e) => onUpdateParams({ saturation: parseInt(e.target.value) / 100 })}
                className="astro-slider"
              />
            </div>

            {/* Color Temp & Tint */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Color Temperature</label>
                  <span className="text-[11px] font-mono text-slate-300">{params.colorTemp}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={params.colorTemp}
                  onChange={(e) => onUpdateParams({ colorTemp: parseInt(e.target.value) })}
                  className="astro-slider slider-amber"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">Tint (Magenta / Green)</label>
                  <span className="text-[11px] font-mono text-slate-300">{params.tint}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={params.tint}
                  onChange={(e) => onUpdateParams({ tint: parseInt(e.target.value) })}
                  className="astro-slider slider-purple"
                />
              </div>
            </div>

            {/* Fine RGB Pedestal Trim */}
            <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Fine RGB Pedestal Offset
                </label>
                <button
                  onClick={() => onUpdateParams({ offsetR: 0, offsetG: 0, offsetB: 0 })}
                  className="text-[10px] font-mono text-slate-400 hover:text-white"
                >
                  Reset Offsets
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-red-400 font-mono">Red Offset</span>
                  <span className="font-mono text-slate-300">{params.offsetR.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="-0.05"
                  max="0.05"
                  step="0.0002"
                  value={params.offsetR}
                  onChange={(e) => onUpdateParams({ offsetR: parseFloat(e.target.value) })}
                  className="astro-slider slider-red"
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-green-400 font-mono">Green Offset</span>
                  <span className="font-mono text-slate-300">{params.offsetG.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="-0.05"
                  max="0.05"
                  step="0.0002"
                  value={params.offsetG}
                  onChange={(e) => onUpdateParams({ offsetG: parseFloat(e.target.value) })}
                  className="astro-slider slider-green"
                />

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-blue-400 font-mono">Blue Offset</span>
                  <span className="font-mono text-slate-300">{params.offsetB.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min="-0.05"
                  max="0.05"
                  step="0.0002"
                  value={params.offsetB}
                  onChange={(e) => onUpdateParams({ offsetB: parseFloat(e.target.value) })}
                  className="astro-slider slider-blue"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOOLS, MASKS & FX */}
        {activeTab === 'tabFX' && (
          <div className="space-y-3.5">
            {/* Star Mask & Stellar Protection Card */}
            <div className="p-3.5 rounded-xl bg-[#0d121d] border border-amber-500/40 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Star Mask (Stellar Protection)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-medium text-amber-400/90">
                    {params.starMaskEnabled ? 'Active' : 'Disabled'}
                  </span>
                  <button
                    onClick={() => onUpdateParams({ starMaskEnabled: !params.starMaskEnabled })}
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      params.starMaskEnabled ? 'bg-amber-500' : 'bg-[#1e293b]'
                    }`}
                    title="Toggle Star Mask Protection"
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        params.starMaskEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Uses intensity thresholding to identify star-dense regions, applying stretches exclusively to nebulosity or galaxy structures while protecting stars from over-stretching.
              </p>

              {/* Target Zone Selector */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Adjustment Scope
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium">
                  <button
                    onClick={() => onUpdateParams({ starMaskTarget: 'nebulosity' })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition ${
                      params.starMaskTarget !== 'stars'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-sm'
                        : 'bg-[#131b2b] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Protect Stars (Stretch Nebula)
                  </button>
                  <button
                    onClick={() => onUpdateParams({ starMaskTarget: 'stars' })}
                    className={`py-1.5 px-2 rounded-lg border text-center transition ${
                      params.starMaskTarget === 'stars'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-sm'
                        : 'bg-[#131b2b] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Target Stars Only
                  </button>
                </div>
              </div>

              {/* View Mode Selector */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  Star Mask Inspection View
                </span>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-medium">
                  {(['composite', 'mask', 'overlay'] as const).map((mode) => {
                    const labels = {
                      composite: 'Protected Result',
                      mask: 'B&W Star Mask',
                      overlay: 'Ruby Highlight',
                    };
                    const isActive = (params.starMaskViewMode || 'composite') === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => onUpdateParams({ starMaskViewMode: mode })}
                        className={`py-1 px-1.5 rounded-md border text-center transition ${
                          isActive
                            ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                            : 'bg-[#131b2b] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {labels[mode]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Intensity Threshold (Sensitivity) */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Intensity Threshold (Sensitivity)</span>
                  <span className="font-mono text-amber-300 font-semibold">
                    {params.starMaskThreshold.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.70"
                  step="0.01"
                  value={params.starMaskThreshold}
                  onChange={(e) => onUpdateParams({ starMaskThreshold: parseFloat(e.target.value) })}
                  className="astro-slider slider-amber"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>0.02 (Include faint stars)</span>
                  <span>0.70 (Bright stars only)</span>
                </div>
              </div>

              {/* Star Growth / Dilation */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Star Growth (Halo Dilation)</span>
                  <span className="font-mono text-sky-300 font-semibold">
                    {params.starMaskGrowth} px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={params.starMaskGrowth}
                  onChange={(e) => onUpdateParams({ starMaskGrowth: parseInt(e.target.value) })}
                  className="astro-slider"
                />
                <p className="text-[9px] text-slate-500 font-mono">
                  Dilates mask to envelop outer star halos and diffraction spikes.
                </p>
              </div>

              {/* Edge Feathering */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Edge Feather (Softness)</span>
                  <span className="font-mono text-sky-300 font-semibold">
                    {params.starMaskFeather} px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={params.starMaskFeather}
                  onChange={(e) => onUpdateParams({ starMaskFeather: parseInt(e.target.value) })}
                  className="astro-slider"
                />
                <p className="text-[9px] text-slate-500 font-mono">
                  Softens mask boundary to eliminate dark halos around stars.
                </p>
              </div>

              {/* Protection Strength */}
              <div className="space-y-1 pt-1 border-t border-[#1f2b42]">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Star Protection Strength</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {Math.round(params.starProtectionStrength * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(params.starProtectionStrength * 100)}
                  onChange={(e) =>
                    onUpdateParams({ starProtectionStrength: parseInt(e.target.value) / 100 })
                  }
                  className="astro-slider slider-green"
                />
              </div>
            </div>

            {/* Target Isolation Mask */}
            <div className="p-3.5 rounded-xl bg-[#0d121d] border border-sky-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
                <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  Target Isolation Mask
                </label>
                <button
                  onClick={() => onUpdateParams({ maskEnabled: !params.maskEnabled })}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    params.maskEnabled ? 'bg-sky-500' : 'bg-[#1e293b]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      params.maskEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={onStartPickingMask}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                  pickingMask
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold animate-pulse'
                    : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/40'
                }`}
              >
                <Crosshair className="w-4 h-4" />
                <span>
                  {pickingMask ? 'Now tap target center on canvas!' : '🎯 Click Canvas to Set Target Center'}
                </span>
              </button>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Radius Size</span>
                  <span className="font-mono text-sky-300">{Math.round(params.maskRadius * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.01"
                  value={params.maskRadius}
                  onChange={(e) => onUpdateParams({ maskRadius: parseFloat(e.target.value) })}
                  className="astro-slider"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>Edge Feather (Softness)</span>
                  <span className="font-mono text-sky-300">{Math.round(params.maskFeather * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.5"
                  step="0.01"
                  value={params.maskFeather}
                  onChange={(e) => onUpdateParams({ maskFeather: parseFloat(e.target.value) })}
                  className="astro-slider"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-[#1f2b42]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.maskBlackout}
                    onChange={(e) => onUpdateParams({ maskBlackout: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-[11px] font-medium text-slate-300">
                    Completely black out background
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.maskInvert}
                    onChange={(e) => onUpdateParams({ maskInvert: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500"
                  />
                  <span className="text-[11px] font-medium text-slate-300">
                    Invert Mask (Protect center, edit background)
                  </span>
                </label>
              </div>
            </div>

            {/* Starless / Star Reduction Mode */}
            <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Stars className="w-4 h-4 text-purple-400" />
                  Remove Stars (Starless Mode)
                </label>
                <button
                  onClick={() => onUpdateParams({ starless: !params.starless })}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    params.starless ? 'bg-purple-500' : 'bg-[#1e293b]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      params.starless ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Employs multi-scale morphological erosion to suppress stars and reveal faint cosmic gas, dark dust lanes, and galactic arms.
              </p>
            </div>

            {/* Gloss (Orton Glow) */}
            <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Gloss (Orton Nebular Glow)
                </label>
                <span className="text-[11px] font-mono text-purple-300 font-semibold">
                  {params.gloss}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={params.gloss}
                onChange={(e) => onUpdateParams({ gloss: parseInt(e.target.value) })}
                className="astro-slider slider-purple"
              />
              <p className="text-[10px] text-slate-400 leading-tight">
                Infuses bright nebular emission nodes and core clusters with an ethereal dreamlike astrophotography glow.
              </p>
            </div>

            {/* Wavelet Detail Sharpness */}
            <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Sun className="w-4 h-4" />
                  Wavelet Detail & Micro-Contrast
                </label>
                <span className="text-[11px] font-mono text-cyan-300 font-semibold">
                  {params.waveletSharp}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={params.waveletSharp}
                onChange={(e) => onUpdateParams({ waveletSharp: parseInt(e.target.value) })}
                className="astro-slider slider-cyan"
              />
              <p className="text-[10px] text-slate-400 leading-tight">
                Accentuates fine shockfront gas filaments, lunar crater rims, and subtle absorption dust rilles.
              </p>
            </div>
          </div>
        )}

        {/* TAB: DWARF 3 AI TRACKING MODES */}
        {activeTab === 'tabTracking' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Header description */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-sky-950/40 via-indigo-950/30 to-[#0d121d] border border-sky-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-sky-400" />
                  Dwarf 3 Multi-Target AI Tracking
                </span>
                <span className="text-[9px] font-mono font-bold bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40">
                  NPU Optical Flow
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Autonomous target detection, PID gimbal tracking, and lead velocity vectors across aerial, terrestrial, and astronomical targets.
              </p>
            </div>

            {/* Target Mode Quick Selector Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Select Dwarf 3 Tracking Mode
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  7 Modes Available
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'bird', icon: Bird, label: 'Birds / Avian', badge: '🦅 Birds' },
                  { key: 'ufo', icon: Radio, label: 'UFOs / UAPs', badge: '🛸 UFOs' },
                  { key: 'plane', icon: Plane, label: 'Aircraft / Planes', badge: '✈️ Planes' },
                  { key: 'animal', icon: PawPrint, label: 'Wildlife / Animals', badge: '🐾 Animals' },
                  { key: 'car', icon: Car, label: 'Vehicles / Cars', badge: '🚗 Cars' },
                  { key: 'astro', icon: Sparkles, label: 'Deep Sky Astro', badge: '🌌 Deep Sky' },
                  { key: 'planet', icon: Orbit, label: 'Planets & Solar', badge: '🪐 Planets' },
                ] as const).map(({ key, icon: Icon, label, badge }) => {
                  const isCur = (trackingState?.activeMode || 'astro') === key;
                  const cfg = DWARF_TRACKING_CONFIGS[key as DwarfTrackingMode];
                  return (
                    <button
                      key={key}
                      onClick={() => onSelectTrackingMode?.(key as DwarfTrackingMode, true)}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isCur
                          ? `${cfg.bgColor} ${cfg.borderColor} text-white shadow-md ring-1 ring-sky-400/30`
                          : 'bg-[#0d121d] border-[#1f2b42] text-slate-400 hover:text-slate-200 hover:bg-[#151d2f]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          <span>{badge}</span>
                        </span>
                        {isCur && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {cfg.shutter} • {cfg.lensLabel.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Mode Telemetry & Optics Specs */}
            {trackingState && (
              <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-3">
                <div className="flex items-center justify-between border-b border-[#1f2b42]/70 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold text-white">
                      Active: {DWARF_TRACKING_CONFIGS[trackingState.activeMode].label}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#131b2b] text-sky-300 border border-sky-500/30">
                    {DWARF_TRACKING_CONFIGS[trackingState.activeMode].lensLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-[#090d16] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Shutter & Gain</span>
                    <span className="text-slate-200 font-bold">
                      {DWARF_TRACKING_CONFIGS[trackingState.activeMode].shutter} • G{DWARF_TRACKING_CONFIGS[trackingState.activeMode].gain}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#090d16] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Gimbal Slew Rate</span>
                    <span className="text-amber-300 font-bold">
                      {DWARF_TRACKING_CONFIGS[trackingState.activeMode].slewSpeed}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#090d16] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Confidence</span>
                    <span className="text-emerald-400 font-bold">
                      {DWARF_TRACKING_CONFIGS[trackingState.activeMode].trackingConfidence}% Lock
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#090d16] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Range / Speed</span>
                    <span className="text-purple-300 font-bold">
                      {DWARF_TRACKING_CONFIGS[trackingState.activeMode].velocityKmh} km/h • {DWARF_TRACKING_CONFIGS[trackingState.activeMode].distanceMeters}
                    </span>
                  </div>
                </div>

                {/* PID Sensitivity Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">PID Motor Sensitivity</span>
                    <span className="font-mono text-sky-400 font-bold">{trackingState.pidGain}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={trackingState.pidGain}
                    onChange={(e) => onUpdateTrackingState?.({ pidGain: parseInt(e.target.value) })}
                    className="astro-slider"
                  />
                  <p className="text-[10px] text-slate-400">
                    Adjusts gimbal motor correction response speed to eliminate overshoot.
                  </p>
                </div>

                {/* Lead Prediction Vector Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Predictive Lead Vector</span>
                    <span className="font-mono text-purple-400 font-bold">{trackingState.leadFactor}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={trackingState.leadFactor}
                    onChange={(e) => onUpdateTrackingState?.({ leadFactor: parseInt(e.target.value) })}
                    className="astro-slider slider-purple"
                  />
                  <p className="text-[10px] text-slate-400">
                    Extrapolates flight trajectory forward to lead fast-moving birds, aircraft, or anomalies.
                  </p>
                </div>

                {/* Dual Lens & Overlay Toggles */}
                <div className="pt-2 border-t border-[#1f2b42] flex flex-wrap gap-2">
                  <button
                    onClick={() => onUpdateTrackingState?.({ activeLens: trackingState.activeLens === 'tele' ? 'wide' : 'tele' })}
                    className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <span>Lens: {trackingState.activeLens === 'tele' ? '150mm Telephoto' : '24mm Wide-Angle'}</span>
                  </button>

                  <button
                    onClick={() => onUpdateTrackingState?.({ showHud: !trackingState.showHud })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      trackingState.showHud
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-[#131b2b] border-[#1f2b42] text-slate-400'
                    }`}
                  >
                    HUD Reticle: {trackingState.showHud ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => onUpdateTrackingState?.({ showLeadVector: !trackingState.showLeadVector })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      trackingState.showLeadVector
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                        : 'bg-[#131b2b] border-[#1f2b42] text-slate-400'
                    }`}
                  >
                    Lead Vector: {trackingState.showLeadVector ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: ROI & DSO FRAMING (GALAXIES, NEBULAE, STAR CLUSTERS, PLANETS) */}
        {activeTab === 'tabROI' && (
          <DsoRoiDeck
            roiParams={roiParams}
            onUpdateRoi={onUpdateRoi}
            onResetRoi={onResetRoi}
            currentImage={currentImage}
            onCenterViewportOnRoi={onCenterViewportOnRoi}
            onShowToast={onShowToast}
          />
        )}

        {/* TAB: PLANETARY (DWARF 3) */}
        {activeTab === 'tabPlanetary' && (
          <PlanetaryDeck
            planetaryParams={planetaryParams}
            onUpdatePlanetary={onUpdatePlanetary}
            onResetPlanetary={onResetPlanetary}
            onOpenDerotatorModal={onOpenDerotatorModal}
            onSwitchToRoiTab={() => onTabChange('tabROI')}
          />
        )}

        {/* TAB: SETUP & SKY (COMPASS, INCLINOMETER, WEATHER, SKY TONIGHT) */}
        {activeTab === 'tabSetup' && (
          <div className="space-y-3.5">
            {/* Sub-tab segmented button */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#0d121d] border border-[#1f2b42] text-xs font-semibold">
              <button
                onClick={() => setSetupSubTab('compass')}
                className={`py-1.5 rounded-lg transition ${
                  setupSubTab === 'compass'
                    ? 'bg-amber-500/20 border border-amber-400 text-amber-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🧭 Compass & Inclinometer Angle
              </button>
              <button
                onClick={() => setSetupSubTab('sky')}
                className={`py-1.5 rounded-lg transition ${
                  setupSubTab === 'sky'
                    ? 'bg-sky-500/20 border border-sky-400 text-sky-200'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌌 Weather, Bortle & Events
              </button>
            </div>

            {setupSubTab === 'compass' ? (
              <TelescopeCompass
                selectedTarget={selectedTarget}
                onSelectTarget={onSelectTarget}
                visibleTargets={visibleTargets}
              />
            ) : (
              <SkyWeatherDeck
                onSelectTargetForCompass={onSelectTarget}
                selectedTargetId={selectedTarget?.id}
              />
            )}
          </div>
        )}

        {/* TAB 4: FITS HEADER & ASTRONOMICAL METADATA */}
        {activeTab === 'tabHeader' && (
          <div className="space-y-3.5">
            {currentImage?.rawHeader ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#0d121d] border border-sky-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400">Target & Optics Metadata</span>
                    <button
                      onClick={onOpenHeaderModal}
                      className="text-[10px] font-semibold text-sky-300 hover:underline flex items-center gap-1"
                    >
                      <span>Full FITS Table</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                      <div className="text-[9px] text-slate-400 uppercase">Target</div>
                      <div className="font-semibold text-white truncate">
                        {currentImage.rawHeader.object || 'Deep Sky Target'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                      <div className="text-[9px] text-slate-400 uppercase">Telescope</div>
                      <div className="font-semibold text-white truncate">
                        {currentImage.rawHeader.telescop || 'Smart Astrograph'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                      <div className="text-[9px] text-slate-400 uppercase">Camera / Sensor</div>
                      <div className="font-semibold text-white truncate">
                        {currentImage.rawHeader.instrume || 'CMOS Sensor'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                      <div className="text-[9px] text-slate-400 uppercase">Bit Depth</div>
                      <div className="font-semibold text-amber-300">
                        BITPIX {currentImage.rawHeader.bitpix}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                      <div className="text-[9px] text-slate-400 uppercase">Exposure Sub</div>
                      <div className="font-semibold text-emerald-300">
                        {currentImage.rawHeader.exptime ? `${currentImage.rawHeader.exptime}s` : 'Integrated Stack'}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                      <div className="text-[9px] text-slate-400 uppercase">Observation Date</div>
                      <div className="font-semibold text-slate-300 truncate">
                        {currentImage.rawHeader.dateObs || 'Recent'}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onOpenHeaderModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#131b2b] hover:bg-[#1c273e] border border-[#1f2b42] text-xs font-semibold text-slate-200 transition text-center"
                >
                  Inspect All {currentImage.rawHeader.cards?.length || 0} FITS Cards
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#0d121d] border border-[#1f2b42] text-center space-y-2 text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <p>Standard image loaded without FITS astronomical header.</p>
                <p className="text-[11px] text-slate-500">
                  Open a .fits or .fit file to view full telescope, camera, and celestial coordinates.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SOURCE & CLOUD URL */}
        {activeTab === 'tabSource' && (
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-[#0d121d] border border-amber-500/30 space-y-2.5 shadow-lg">
              <label className="text-xs font-bold text-amber-300 block flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-amber-400" />
                Dwarflab / Cloud Telescope FITS URL
              </label>

              <p className="text-[10px] text-slate-400">
                Directly fetch full-fidelity FITS stacks from Dwarflab cloud or any remote astronomical server without CORS issues.
              </p>

              <textarea
                rows={3}
                value={cloudUrl}
                onChange={(e) => setCloudUrl(e.target.value)}
                placeholder="https://global.dwarflabapp.com/... or any .fits URL"
                className="w-full rounded-lg bg-[#05070c] border border-[#1f2b42] p-2 text-[11px] font-mono text-slate-200 focus:outline-none focus:border-amber-400 resize-none"
              />

              <button
                disabled={isFetchingUrl || !cloudUrl.trim()}
                onClick={() => onFetchRemoteUrl(cloudUrl.trim())}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md"
              >
                {isFetchingUrl ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Streaming Remote FITS...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Fetch FITS from Cloud</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Persistent Bottom Quick-Action Bar */}
      <div className="p-2.5 border-t border-[#1f2b42] bg-[#06080d] flex items-center justify-between text-xs shrink-0">
        <button
          onClick={onRevertToOriginal}
          className="py-1.5 px-3 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-semibold flex items-center gap-1.5 transition shadow-sm active:scale-95"
          title="Revert all curves, masks, colors, and planetary adjustments back to original unedited image"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Revert to Original</span>
        </button>

        <span className="text-[10px] font-mono text-slate-500">
          Dwarf 3 & AstroFITS
        </span>
      </div>
    </aside>
  );
};
