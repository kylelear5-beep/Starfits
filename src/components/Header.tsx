import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  FolderOpen, 
  Moon, 
  Download, 
  Layers, 
  SlidersHorizontal, 
  Info, 
  ExternalLink, 
  ChevronDown, 
  SplitSquareVertical, 
  RotateCcw, 
  Compass, 
  CloudSun, 
  Share2, 
  Image as ImageIcon, 
  Sliders, 
  Calendar,
  Orbit,
  Bird,
  Plane,
  Car,
  PawPrint,
  Crosshair,
  HelpCircle,
  Check,
  Grid,
  Users
} from 'lucide-react';
import { LoadedAstroImage, Preset, DwarfTrackingMode } from '../types/fits';
import { SAMPLE_TARGETS } from '../utils/sampleImages';
import { PRESETS } from '../utils/presets';
import { DWARF_TRACKING_CONFIGS } from '../utils/dwarfTracking';

interface HeaderProps {
  currentImage: LoadedAstroImage | null;
  nightMode: boolean;
  onToggleNightMode: () => void;
  onOpenFile: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  onApplyPreset: (preset: Preset) => void;
  onOpenHeaderModal: () => void;
  onExport: (format: 'png' | 'jpg' | 'webp') => void;
  onSendToFlow: () => void;
  splitView: boolean;
  onToggleSplitView: () => void;
  onRevertToOriginal: () => void;
  onToggleTelescopeSetup: () => void;
  telescopeSetupOpen: boolean;
  onOpenGeminiAi: () => void;
  onOpenGeminiGuide?: () => void;
  onOpenShareApp: () => void;
  onOpenDerotator?: () => void;
  onOpenMosaicStudio?: () => void;
  onOpenStarParty?: () => void;
  bortleNumber: number;
  activeTrackingMode: DwarfTrackingMode;
  onSelectTrackingMode: (mode: DwarfTrackingMode, autoLoadSample?: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentImage,
  nightMode,
  onToggleNightMode,
  onOpenFile,
  onSelectSample,
  onApplyPreset,
  onOpenHeaderModal,
  onExport,
  onSendToFlow,
  splitView,
  onToggleSplitView,
  onRevertToOriginal,
  onToggleTelescopeSetup,
  telescopeSetupOpen,
  onOpenGeminiAi,
  onOpenGeminiGuide,
  onOpenShareApp,
  onOpenDerotator,
  onOpenMosaicStudio,
  onOpenStarParty,
  bortleNumber,
  activeTrackingMode,
  onSelectTrackingMode,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const [trackingMenuOpen, setTrackingMenuOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoAlbumInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    e.target.value = '';
  };

  const activeTrackingConfig = DWARF_TRACKING_CONFIGS[activeTrackingMode] || DWARF_TRACKING_CONFIGS.astro;

  const getTrackingIcon = (mode: DwarfTrackingMode) => {
    switch (mode) {
      case 'bird': return <Bird className="w-3.5 h-3.5 text-sky-400" />;
      case 'ufo': return <Crosshair className="w-3.5 h-3.5 text-purple-400" />;
      case 'plane': return <Plane className="w-3.5 h-3.5 text-cyan-400" />;
      case 'animal': return <PawPrint className="w-3.5 h-3.5 text-amber-400" />;
      case 'car': return <Car className="w-3.5 h-3.5 text-emerald-400" />;
      case 'planet': return <Orbit className="w-3.5 h-3.5 text-amber-300" />;
      case 'astro':
      default: return <Sparkles className="w-3.5 h-3.5 text-sky-300" />;
    }
  };

  return (
    <header className="h-14 shrink-0 bg-[#090d16] border-b border-[#1f2b42] px-2.5 lg:px-4 flex items-center justify-between gap-1.5 sm:gap-2 z-30 select-none">
      {/* Brand & Active Image Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-amber-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-inner">
          <Sparkles className="w-4 h-4 text-sky-400" />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate">
              AstroFITS Studio
            </h1>
            <span className="hidden xl:inline-block px-1 py-0.2 rounded text-[9px] font-mono font-medium bg-sky-950 border border-sky-500/30 text-sky-300">
              Dwarf 3
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 truncate">
            {currentImage ? (
              <>
                <span className="font-mono text-slate-200 truncate font-medium">
                  {currentImage.name}
                </span>
                <span className="hidden md:inline text-slate-500">•</span>
                <span className="hidden md:inline font-mono text-sky-400/90">
                  {currentImage.width}×{currentImage.height}
                </span>
              </>
            ) : (
              <span className="font-mono text-slate-500">No Image Loaded</span>
            )}
          </div>
        </div>
      </div>

      {/* Dwarf 3 AI Tracking Mode Dropdown (Birds, UFOs, Planes, Animals, Cars, Astro, Planetary) */}
      <div className="relative">
        <button
          onClick={() => {
            setTrackingMenuOpen(!trackingMenuOpen);
            setSampleOpen(false);
            setPresetOpen(false);
            setExportOpen(false);
          }}
          className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
            activeTrackingConfig.bgColor
          } ${activeTrackingConfig.borderColor} text-slate-100 hover:brightness-110 active:scale-95`}
          title="Dwarf 3 AI Tracking Modes: Birds, UFOs, Planes, Animals, Cars, Astro, Planetary"
        >
          <div className="flex items-center gap-1.5">
            {getTrackingIcon(activeTrackingMode)}
            <span className="font-bold tracking-wide">{activeTrackingConfig.badge}</span>
          </div>
          <span className="hidden lg:inline-block text-[10px] font-mono text-slate-400 px-1 py-0.2 bg-[#090d16] rounded border border-white/10">
            {activeTrackingConfig.shutter}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>

        {trackingMenuOpen && (
          <div 
            className="absolute left-0 mt-1.5 w-80 rounded-2xl bg-[#0d121d] border border-[#1f2b42] shadow-2xl py-2 z-50 text-slate-200 divide-y divide-[#1f2b42]/60 animate-in fade-in zoom-in-95"
            onMouseLeave={() => setTrackingMenuOpen(false)}
          >
            <div className="px-3.5 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Dwarf 3 AI Tracking Modes
              </span>
              <span className="text-[9px] font-mono text-sky-400 bg-sky-950 px-1.5 py-0.5 rounded border border-sky-500/30">
                NPU Powered
              </span>
            </div>

            <div className="p-1 space-y-0.5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {(Object.keys(DWARF_TRACKING_CONFIGS) as DwarfTrackingMode[]).map((modeKey) => {
                const cfg = DWARF_TRACKING_CONFIGS[modeKey];
                const isSelected = activeTrackingMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    onClick={() => {
                      onSelectTrackingMode(modeKey, true);
                      setTrackingMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs transition flex items-start justify-between group ${
                      isSelected
                        ? `${cfg.bgColor} ${cfg.borderColor} border text-white`
                        : 'hover:bg-[#151d2f] text-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        {getTrackingIcon(modeKey)}
                        <span className="font-bold text-slate-100 group-hover:text-white">
                          {cfg.label}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {cfg.description}
                      </p>
                      <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500 pt-0.5">
                        <span className="text-sky-300/80">{cfg.lensLabel}</span>
                        <span>•</span>
                        <span>{cfg.shutter}</span>
                        <span>•</span>
                        <span>Gain {cfg.gain}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                      {isSelected ? (
                        <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#131b2b] text-slate-400 group-hover:text-slate-200">
                          {cfg.badge.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 text-[10px] text-slate-400 bg-[#090d16] rounded-b-xl flex items-center justify-between">
              <span>Dual-Cam: 24mm Wide + 150mm Tele</span>
              <span className="text-purple-400 font-mono">PID Optical Flow</span>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Live Weather & Bortle Pill (Always Visible in Center/Right) */}
      <button
        onClick={onToggleTelescopeSetup}
        className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#0d121d] hover:bg-[#131b2b] border border-amber-500/30 hover:border-amber-400 text-xs text-slate-200 transition shadow-inner group"
        title="Click to view Weather, Bortle Scale, Celestial Events & 360° Compass"
      >
        <span className="flex items-center gap-1 text-sky-300 font-semibold text-[11px]">
          <CloudSun className="w-3.5 h-3.5 text-sky-400" />
          <span>Clear 14°C</span>
        </span>
        <span className="text-slate-600">•</span>
        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
          Bortle {bortleNumber}
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-[10px] font-mono text-purple-300 flex items-center gap-1">
          <Calendar className="w-3 h-3 text-purple-400" />
          <span>Events</span>
        </span>
      </button>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Gemini AI Assistant Button & How To Use Guide */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenGeminiAi}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-sky-600/30 hover:from-purple-600/40 hover:to-sky-600/40 border border-purple-400/60 text-purple-200 text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95 ring-1 ring-purple-400/30"
            title="Gemini AI: Plate Solving, Quality Diagnosis, and Auto-Tuning"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>Gemini AI</span>
          </button>

          {onOpenGeminiGuide && (
            <button
              onClick={onOpenGeminiGuide}
              className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-purple-300 text-xs font-semibold flex items-center gap-1 transition shadow-sm active:scale-95"
              title="How to Use Gemini AI: Step-by-step guide, plate solving, and 1-click optimization"
            >
              <HelpCircle className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden xl:inline text-[11px]">How to use</span>
            </button>
          )}
        </div>


        {/* Planetary Derotator & Frame Stacker Button */}
        {onOpenDerotator && (
          <button
            onClick={onOpenDerotator}
            className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Planetary Derotation: Align center-of-mass, compensate rotation, and average frames"
          >
            <Orbit className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Derotator</span>
          </button>
        )}

        {/* Mosaic Studio Button (Spatial Transformation Matrices) */}
        {onOpenMosaicStudio && (
          <button
            onClick={onOpenMosaicStudio}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/50 text-sky-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            title="Astronomical Mosaic Studio: Align and stitch overlapping FITS panels with spatial transformation matrices"
          >
            <Grid className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Mosaic</span>
          </button>
        )}

        {/* Star Party Suite Button */}
        {onOpenStarParty && (
          <button
            onClick={onOpenStarParty}
            className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-400/60 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm ring-1 ring-amber-400/30"
            title="Star Party Mode: Audience Kiosk HUD, Curated Sky Tour, Guest Request Queue & Phone Broadcast"
          >
            <Users className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden md:inline">Star Party</span>
          </button>
        )}

        {/* Photo Album Import Button (User explicitly requested!) */}
        <label
          htmlFor="photoAlbumInput"
          className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          title="Import capture from your Phone Photo Album / Camera Roll / Library"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Photo Album</span>
        </label>
        <input
          id="photoAlbumInput"
          ref={photoAlbumInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Open FITS File Button */}
        <label
          htmlFor="astroFileInput"
          className="cursor-pointer px-2.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          title="Open FITS or Raw Capture"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">FITS</span>
        </label>
        <input
          id="astroFileInput"
          ref={fileInputRef}
          type="file"
          accept=".fits,.fit,.fts,application/fits,image/fits,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Share App with Friend Button (User explicitly requested!) */}
        <button
          onClick={onOpenShareApp}
          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          title="Share this app with a friend who has the Dwarf 3 telescope (QR Code & Link)"
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Share</span>
        </button>

        {/* Revert to Original Button */}
        <button
          onClick={onRevertToOriginal}
          className="px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 transition shadow-sm active:scale-95"
          title="Revert all curves, adjustments, and masks back to original unedited image"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Revert</span>
        </button>

        {/* Telescope Setup & Weather Modal Button */}
        <button
          onClick={onToggleTelescopeSetup}
          className={`px-2 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition shadow-sm ${
            telescopeSetupOpen
              ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
              : 'bg-[#131b2b] hover:bg-[#1c273e] border-[#1f2b42] text-slate-300'
          }`}
          title="Dwarf 3 Setup: Weather, Bortle Scale, Celestial Events, 360° Compass & Inclinometer Angle"
        >
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline">Weather & Setup</span>
        </button>

        {/* Sample Targets Dropdown */}
        <div className="relative hidden xl:block">
          <button
            onClick={() => {
              setSampleOpen(!sampleOpen);
              setPresetOpen(false);
              setExportOpen(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-[#131b2b] hover:bg-[#1c273e] border border-[#1f2b42] text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
            title="Load Sample Astrophotography Image"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Samples</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {sampleOpen && (
            <div 
              className="absolute right-0 mt-1.5 w-64 rounded-xl bg-[#0d121d] border border-[#1f2b42] shadow-2xl py-1.5 z-50 text-slate-200"
              onMouseLeave={() => setSampleOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-[#1f2b42]">
                Deep Sky & Planetary Samples
              </div>
              {SAMPLE_TARGETS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    onSelectSample(sample.id);
                    setSampleOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs hover:bg-[#1a2337] flex items-center justify-between transition ${
                    currentImage?.id === sample.id ? 'bg-sky-500/10 text-sky-300 font-medium' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200">{sample.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{sample.telescope}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#131b2b] text-sky-400 border border-sky-500/20">
                    {sample.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Before / After Split Comparison */}
        <button
          onClick={onToggleSplitView}
          className={`p-1.5 rounded-lg border transition ${
            splitView
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-[#131b2b] hover:bg-[#1c273e] border-[#1f2b42] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Split-Screen Before/After View"
        >
          <SplitSquareVertical className="w-4 h-4" />
        </button>

        {/* Night Vision Red Mode Toggle */}
        <button
          onClick={onToggleNightMode}
          className={`p-1.5 rounded-lg border transition ${
            nightMode
              ? 'bg-red-500/20 text-red-400 border-red-500/50 ring-2 ring-red-500/30'
              : 'bg-[#131b2b] hover:bg-[#1c273e] border-[#1f2b42] text-slate-400 hover:text-red-400'
          }`}
          title="Astronomical Night Vision (Red Light) Mode"
        >
          <Moon className="w-4 h-4" />
        </button>

        {/* Export Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setExportOpen(!exportOpen);
              setSampleOpen(false);
              setPresetOpen(false);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold flex items-center gap-1 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 text-sky-400" />
          </button>

          {exportOpen && (
            <div 
              className="absolute right-0 mt-1.5 w-60 rounded-xl bg-[#0d121d] border border-[#1f2b42] shadow-2xl py-1.5 z-50 text-slate-200"
              onMouseLeave={() => setExportOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 border-b border-[#1f2b42]">
                Export Stretched Image
              </div>
              <button
                onClick={() => {
                  onExport('png');
                  setExportOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a2337] flex items-center justify-between text-slate-200 transition"
              >
                <span>Save Full-Res PNG</span>
                <span className="text-[10px] font-mono text-emerald-400 font-medium">Lossless</span>
              </button>
              <button
                onClick={() => {
                  onExport('jpg');
                  setExportOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a2337] flex items-center justify-between text-slate-200 transition"
              >
                <span>Save Stretched JPEG</span>
                <span className="text-[10px] font-mono text-sky-400">95% Quality</span>
              </button>
              <button
                onClick={() => {
                  onExport('webp');
                  setExportOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-[#1a2337] flex items-center justify-between text-slate-200 transition"
              >
                <span>Save WebP</span>
                <span className="text-[10px] font-mono text-indigo-400">Web Optimized</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
