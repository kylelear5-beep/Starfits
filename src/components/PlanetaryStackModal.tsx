import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Orbit, 
  Layers, 
  Play, 
  Sparkles, 
  Upload, 
  Check, 
  Sliders, 
  RotateCw, 
  Eye, 
  Crosshair, 
  CheckCircle2, 
  ChevronRight, 
  Activity, 
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Disc
} from 'lucide-react';
import { 
  PlanetaryFrame, 
  DerotationConfig, 
  PLANETARY_PHYSICS, 
  TargetPlanetType,
  computePlanetCentroid, 
  processPlanetarySequence, 
  generatePlanetaryBurst 
} from '../utils/planetaryDerotation';
import { LoadedAstroImage } from '../types/fits';

interface PlanetaryStackModalProps {
  onClose: () => void;
  onApplyMasterStack: (stackedImage: LoadedAstroImage) => void;
  onShowToast: (msg: string) => void;
}

export const PlanetaryStackModal: React.FC<PlanetaryStackModalProps> = ({
  onClose,
  onApplyMasterStack,
  onShowToast,
}) => {
  // Planetary Frames Sequence
  const [frames, setFrames] = useState<PlanetaryFrame[]>(() => generatePlanetaryBurst('jupiter', 16, 8));
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [targetPlanet, setTargetPlanet] = useState<TargetPlanetType>('jupiter');
  const [captureDurationMin, setCaptureDurationMin] = useState(8);
  const [polarTiltDeg, setPolarTiltDeg] = useState(PLANETARY_PHYSICS.jupiter.defaultPolarTilt);
  const [enableDerotation, setEnableDerotation] = useState(true);
  const [enableCentroidAlignment, setEnableCentroidAlignment] = useState(true);
  const [showCentroidOverlay, setShowCentroidOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<'single' | 'stacked' | 'split'>('stacked');

  // Processing Results
  const [stackedResult, setStackedResult] = useState<{
    masterR: Float32Array;
    masterG: Float32Array;
    masterB: Float32Array;
    snrFactor: number;
    snrdB: number;
    count: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);

  // Canvases
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run stacking and derotation whenever frames or config change
  const executeStacking = () => {
    if (frames.length === 0) return;
    setIsProcessing(true);

    try {
      const config: DerotationConfig = {
        targetPlanet,
        rotationPeriodMinutes: PLANETARY_PHYSICS[targetPlanet].periodMinutes,
        totalDurationSeconds: captureDurationMin * 60,
        polarAxisAngleDeg: polarTiltDeg,
        enableDerotation,
        enableCentroidAlignment,
        thresholdCutoff: 0.12,
      };

      const result = processPlanetarySequence(frames, config, 0);

      setStackedResult({
        masterR: result.masterR,
        masterG: result.masterG,
        masterB: result.masterB,
        snrFactor: result.snrImprovementFactor,
        snrdB: result.snrdBGain,
        count: result.framesStackedCount,
      });

      // Update frame metadata with computed shifts
      setFrames(result.alignedFrames);
    } catch (err: any) {
      console.error('Stacking error:', err);
      onShowToast(err.message || 'Error processing planetary sequence');
    } finally {
      setIsProcessing(false);
    }
  };

  // Run initial stack
  useEffect(() => {
    executeStacking();
  }, [targetPlanet, captureDurationMin, polarTiltDeg, enableDerotation, enableCentroidAlignment]);

  // Load preset burst
  const handleLoadBurst = (planet: 'jupiter' | 'saturn') => {
    setTargetPlanet(planet);
    setPolarTiltDeg(PLANETARY_PHYSICS[planet].defaultPolarTilt);
    const count = planet === 'jupiter' ? 16 : 12;
    const burst = generatePlanetaryBurst(planet, count, 8);
    setFrames(burst);
    setActiveFrameIndex(0);
    onShowToast(`Loaded ${planet.toUpperCase()} ${count}-frame seeing burst with rotation drift`);
  };

  // Handle local batch frame upload
  const handleUploadFrames = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    onShowToast(`Loading ${files.length} planetary frames...`);
    const newFrames: PlanetaryFrame[] = [];
    const totalFiles = files.length;

    for (let k = 0; k < totalFiles; k++) {
      const file = files[k];
      const url = URL.createObjectURL(file);
      const img = new Image();

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        img.src = url;
      });
      URL.revokeObjectURL(url);

      if (!img.width || !img.height) continue;

      const w = img.width;
      const h = img.height;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h).data;
      const totalPixels = w * h;

      const chR = new Float32Array(totalPixels);
      const chG = new Float32Array(totalPixels);
      const chB = new Float32Array(totalPixels);

      for (let p = 0; p < totalPixels; p++) {
        chR[p] = imgData[p * 4] / 255.0;
        chG[p] = imgData[p * 4 + 1] / 255.0;
        chB[p] = imgData[p * 4 + 2] / 255.0;
      }

      const centroid = computePlanetCentroid(chR, chG, chB, w, h, 0.12);

      newFrames.push({
        id: `uploaded_${k + 1}`,
        name: file.name,
        frameIndex: k + 1,
        timestampSeconds: (k / Math.max(1, totalFiles - 1)) * (captureDurationMin * 60),
        width: w,
        height: h,
        chR,
        chG,
        chB,
        centroidX: centroid.cx,
        centroidY: centroid.cy,
        shiftX: 0,
        shiftY: 0,
        qualityScore: 85,
        selected: true,
      });
    }

    if (newFrames.length > 0) {
      setFrames(newFrames);
      setActiveFrameIndex(0);
      onShowToast(`✅ Loaded ${newFrames.length} frames from album / file picker`);
    }
    e.target.value = '';
  };

  // Toggle selection for a single frame
  const handleToggleFrame = (index: number) => {
    setFrames((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], selected: !updated[index].selected };
      return updated;
    });
  };

  // Render on preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || frames.length === 0) return;

    const activeFrame = frames[activeFrameIndex] || frames[0];
    const w = activeFrame.width;
    const h = activeFrame.height;

    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;
    const total = w * h;

    const showStacked = viewMode === 'stacked' && stackedResult;
    const rSrc = showStacked ? stackedResult.masterR : activeFrame.chR;
    const gSrc = showStacked ? stackedResult.masterG : activeFrame.chG;
    const bSrc = showStacked ? stackedResult.masterB : activeFrame.chB;

    if (viewMode === 'split' && stackedResult) {
      // Split view: Left = Single Raw, Right = Stacked Average
      const midX = Math.round(w / 2);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = y * w + x;
          const px = idx * 4;
          const isLeft = x < midX;
          const r = isLeft ? activeFrame.chR[idx] : stackedResult.masterR[idx];
          const g = isLeft ? activeFrame.chG[idx] : stackedResult.masterG[idx];
          const b = isLeft ? activeFrame.chB[idx] : stackedResult.masterB[idx];

          data[px] = Math.round(Math.max(0, Math.min(1, r)) * 255);
          data[px + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
          data[px + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
          data[px + 3] = 255;
        }
      }
    } else {
      for (let i = 0; i < total; i++) {
        const px = i * 4;
        data[px] = Math.round(Math.max(0, Math.min(1, rSrc[i])) * 255);
        data[px + 1] = Math.round(Math.max(0, Math.min(1, gSrc[i])) * 255);
        data[px + 2] = Math.round(Math.max(0, Math.min(1, bSrc[i])) * 255);
        data[px + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlay Split Divider Line
    if (viewMode === 'split') {
      const midX = Math.round(w / 2);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, 0);
      ctx.lineTo(midX, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText('RAW FRAME', 10, 20);
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('STACKED AVERAGE', midX + 10, 20);
    }

    // Overlay Centroid Crosshair
    if (showCentroidOverlay && viewMode === 'single') {
      const cx = activeFrame.centroidX;
      const cy = activeFrame.centroidY;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;

      // Draw crosshair
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      // Draw alignment vector arrow if shifted
      if (activeFrame.shiftX !== 0 || activeFrame.shiftY !== 0) {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + activeFrame.shiftX * 2, cy + activeFrame.shiftY * 2);
        ctx.stroke();
      }

      ctx.fillStyle = '#f59e0b';
      ctx.font = '11px monospace';
      ctx.fillText(`CoM: [${cx.toFixed(1)}, ${cy.toFixed(1)}]`, cx + 18, cy - 10);
      if (activeFrame.shiftX !== 0 || activeFrame.shiftY !== 0) {
        ctx.fillStyle = '#06b6d4';
        ctx.fillText(
          `Δ [${activeFrame.shiftX > 0 ? '+' : ''}${activeFrame.shiftX.toFixed(1)}, ${activeFrame.shiftY > 0 ? '+' : ''}${activeFrame.shiftY.toFixed(1)}]`,
          cx + 18,
          cy + 5
        );
      }
    }
  }, [frames, activeFrameIndex, viewMode, stackedResult, showCentroidOverlay]);

  // Animation player for seeing wobble
  useEffect(() => {
    if (!isPlayingAnimation || frames.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFrameIndex((prev) => (prev + 1) % frames.length);
    }, 150);
    return () => clearInterval(interval);
  }, [isPlayingAnimation, frames.length]);

  // Transfer stacked result to main applet
  const handleApplyToStudio = () => {
    if (!stackedResult || frames.length === 0) return;
    const refFrame = frames[0];

    const masterImage: LoadedAstroImage = {
      id: `stacked_master_${Date.now()}`,
      name: `${targetPlanet.toUpperCase()}_Master_Derotated_Stack_${stackedResult.count}frames.fits`,
      width: refFrame.width,
      height: refFrame.height,
      chR: stackedResult.masterR,
      chG: stackedResult.masterG,
      chB: stackedResult.masterB,
      isFits: true,
      fileSize: refFrame.width * refFrame.height * 12,
      sourceType: 'fits',
    };

    onApplyMasterStack(masterImage);
    onClose();
    onShowToast(`🚀 Master Stack loaded into Studio! Wavelet and ADC tools active.`);
  };

  const selectedCount = useMemo(() => frames.filter((f) => f.selected).length, [frames]);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl rounded-2xl bg-[#090d16] border border-[#1f2b42] shadow-2xl flex flex-col overflow-hidden max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-sky-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Orbit className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Planetary Derotation & Center-of-Mass Stacking Engine
                </h2>
                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] border border-sky-400/30">
                  Dwarf 3 Optimized
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Sub-pixel centroid alignment • Rotational velocity compensation • Arithmetic SNR enhancement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadBurst('jupiter')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131b2b] hover:bg-[#1a2337] border border-[#1f2b42] text-xs font-semibold text-amber-300 transition"
              title="Load sample Jupiter seeing burst"
            >
              <span>Jupiter Burst</span>
            </button>
            <button
              onClick={() => handleLoadBurst('saturn')}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#131b2b] hover:bg-[#1a2337] border border-[#1f2b42] text-xs font-semibold text-amber-300 transition"
              title="Load sample Saturn seeing burst"
            >
              <span>Saturn Burst</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Left / Center: Interactive Preview Stage */}
          <div className="flex-1 flex flex-col bg-[#05070c] p-3 sm:p-4 min-h-0 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#1f2b42]">
            {/* View Mode Toolbar */}
            <div className="flex items-center justify-between pb-3 text-xs">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                <button
                  onClick={() => setViewMode('stacked')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    viewMode === 'stacked'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stacked Average ({selectedCount})
                </button>
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    viewMode === 'single'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Frame (#{activeFrameIndex + 1})
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    viewMode === 'split'
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Before / After Split
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCentroidOverlay(!showCentroidOverlay)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    showCentroidOverlay
                      ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                      : 'bg-[#0d121d] text-slate-400 border-[#1f2b42]'
                  }`}
                  title="Toggle Center-of-Mass crosshair and drift vectors"
                >
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                  <span>Centroid ⊕</span>
                </button>

                <button
                  onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
                    isPlayingAnimation
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/50'
                      : 'bg-[#0d121d] text-slate-300 border-[#1f2b42] hover:text-white'
                  }`}
                  title="Play atmospheric seeing wobble sequence"
                >
                  <Play className={`w-3.5 h-3.5 ${isPlayingAnimation ? 'fill-current' : ''}`} />
                  <span>{isPlayingAnimation ? 'Stop' : 'Play Wobble'}</span>
                </button>
              </div>
            </div>

            {/* Canvas Stage */}
            <div className="flex-1 bg-[#06080d] rounded-xl border border-[#1f2b42] flex items-center justify-center overflow-hidden relative shadow-inner p-2">
              <canvas
                ref={previewCanvasRef}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg cursor-crosshair"
              />

              {/* Status Floating Pill */}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#0d121d]/90 backdrop-blur-md border border-[#1f2b42] text-[11px] font-mono text-slate-300 flex items-center gap-2 shadow-md">
                <span className="text-sky-400 font-bold">
                  {viewMode === 'stacked' ? 'Master Derotated Average' : `Frame ${activeFrameIndex + 1} of ${frames.length}`}
                </span>
                {stackedResult && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-semibold">
                      +{stackedResult.snrdB.toFixed(1)} dB SNR
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Bottom: Sequence Thumbnail Strip */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Sequence Frames ({selectedCount} of {frames.length} active)</span>
                <span className="text-sky-400 font-semibold">Click thumbnail to inspect centroid</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
                {frames.map((f, idx) => {
                  const isActive = idx === activeFrameIndex;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setActiveFrameIndex(idx);
                        if (viewMode === 'stacked') setViewMode('single');
                      }}
                      className={`w-20 shrink-0 p-1 rounded-xl border transition cursor-pointer flex flex-col items-center gap-1 ${
                        isActive
                          ? 'bg-sky-500/20 border-sky-400 ring-1 ring-sky-400/50'
                          : f.selected
                          ? 'bg-[#0d121d] hover:bg-[#131b2b] border-[#1f2b42]'
                          : 'bg-[#06080d] opacity-50 border-dashed border-[#1f2b42]'
                      }`}
                    >
                      <div className="w-full h-12 bg-black rounded-lg flex items-center justify-center overflow-hidden relative">
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                        {f.selected && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                        )}
                      </div>
                      <div className="w-full flex items-center justify-between px-1 text-[9px] font-mono">
                        <span className="text-slate-300">+{f.timestampSeconds.toFixed(0)}s</span>
                        <input
                          type="checkbox"
                          checked={f.selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleFrame(idx);
                          }}
                          className="rounded border-[#1f2b42] text-sky-500 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Controls & Metrics Deck */}
          <div className="w-full lg:w-[360px] h-[48dvh] lg:h-full shrink-0 bg-[#090d16] p-4 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-4">
              {/* SNR Performance Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#0d121d] to-[#0d121d] border border-emerald-500/40 space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Signal-to-Noise Ratio Gain</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white">
                    √N = {stackedResult ? stackedResult.snrFactor.toFixed(2) : '1.00'}x
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-300">
                    +{stackedResult ? stackedResult.snrdB.toFixed(2) : '0.00'} dB
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ({selectedCount} frames integrated)
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                  Arithmetic mean averaging suppresses Gaussian seeing noise and thermal sensor artifacts while preserving planetary surface contrast.
                </p>
              </div>

              {/* Target Planet Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  Target Planet Physics
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['jupiter', 'saturn', 'mars', 'custom'] as TargetPlanetType[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setTargetPlanet(p);
                        setPolarTiltDeg(PLANETARY_PHYSICS[p].defaultPolarTilt);
                      }}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold capitalize flex items-center justify-between transition ${
                        targetPlanet === p
                          ? 'bg-amber-500/20 text-amber-200 border-amber-400 shadow-sm'
                          : 'bg-[#0d121d] hover:bg-[#131b2b] text-slate-400 border-[#1f2b42]'
                      }`}
                    >
                      <span>{p}</span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {Math.round(PLANETARY_PHYSICS[p].periodMinutes / 60)}h
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Derotation & Alignment Toggles */}
              <div className="space-y-2.5 p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Center-of-Mass Alignment</div>
                    <div className="text-[10px] text-slate-400 font-mono">Sub-pixel centroid translation</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableCentroidAlignment}
                    onChange={(e) => setEnableCentroidAlignment(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-[#1f2b42] pt-2">
                  <div>
                    <div className="text-xs font-semibold text-white">Planetary Derotation</div>
                    <div className="text-[10px] text-slate-400 font-mono">Rotational phase remapping</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDerotation}
                    onChange={(e) => setEnableDerotation(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-500 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Sliders: Capture Duration & Polar Tilt */}
              <div className="space-y-3 p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42]">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Capture Duration</span>
                    <span className="text-amber-400 font-bold">{captureDurationMin} minutes</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={captureDurationMin}
                    onChange={(e) => setCaptureDurationMin(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300">Polar Axis Tilt</span>
                    <span className="text-sky-400 font-bold">{polarTiltDeg.toFixed(1)}°</span>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="0.5"
                    value={polarTiltDeg}
                    onChange={(e) => setPolarTiltDeg(Number(e.target.value))}
                    className="w-full accent-sky-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Frame Upload from Album */}
              <div>
                <label
                  htmlFor="burstFileInput"
                  className="w-full py-2 px-3 rounded-xl bg-[#131b2b] hover:bg-[#1c273e] border border-[#1f2b42] text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Import Burst from Album / FITS</span>
                </label>
                <input
                  id="burstFileInput"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".fits,.fit,.fts,image/*"
                  className="hidden"
                  onChange={handleUploadFrames}
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-[#1f2b42]">
              <button
                disabled={isProcessing}
                onClick={executeStacking}
                className="w-full py-2.5 px-3 rounded-xl bg-[#131b2b] hover:bg-[#1c273e] border border-[#1f2b42] text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Re-Compute Alignment & Derotation</span>
              </button>

              <button
                disabled={!stackedResult || isProcessing}
                onClick={handleApplyToStudio}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 fill-current" />
                <span>Apply Master Stack to Planetary Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
