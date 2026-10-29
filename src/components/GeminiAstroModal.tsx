import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Check, 
  Sliders, 
  Activity, 
  AlertCircle, 
  Eye, 
  Disc, 
  Info, 
  Zap, 
  CheckCircle2,
  RefreshCw,
  Orbit,
  Star
} from 'lucide-react';
import { AstroProcessingParams, LoadedAstroImage, DsoRoiParams } from '../types/fits';
import { PlanetaryParams } from '../utils/planetaryProcessing';

interface GeminiAnalysisResult {
  targetName: string;
  targetType: string;
  confidence: string;
  qualityAssessment: {
    focusScore: number;
    noiseLevel: string;
    trackingQuality: string;
    seeingEstimate: string;
    colorBalance: string;
    overallGrade: string;
  };
  suggestedParams: {
    midtones: number;
    blackPoint: number;
    whitePoint?: number;
    saturation: number;
    scnrGreen: number;
    hdrCompress?: number;
    waveletSharp: number;
    starMaskThreshold?: number;
    starProtectionStrength?: number;
    adcShiftRY?: number;
    waveletPlanetary?: number;
  };
  dwarf3Tips: string[];
  astronomyFacts: string;
}

interface GeminiAstroModalProps {
  offscreenCanvas: HTMLCanvasElement;
  currentImage: LoadedAstroImage | null;
  onApplyAiParams: (
    astroParams: Partial<AstroProcessingParams>, 
    planetaryParams?: Partial<PlanetaryParams>,
    dsoRoiParams?: Partial<DsoRoiParams>
  ) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onLoadSample?: (sampleId: string) => void;
}

export const GeminiAstroModal: React.FC<GeminiAstroModalProps> = ({
  offscreenCanvas,
  currentImage,
  onApplyAiParams,
  onClose,
  onShowToast,
  onLoadSample,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GeminiAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [engineSource, setEngineSource] = useState<string>('Google Gemini 3.8 Flash');

  // Robust helper to get scaled base64 JPEG from offscreen canvas or synthesize from raw channels
  const getCanvasBase64 = (): string => {
    // 1. If offscreenCanvas is valid with dimensions > 0, downscale and export
    if (offscreenCanvas && offscreenCanvas.width > 0 && offscreenCanvas.height > 0) {
      const maxDim = 1000;
      let w = offscreenCanvas.width;
      let h = offscreenCanvas.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(offscreenCanvas, 0, 0, w, h);
        return tempCanvas.toDataURL('image/jpeg', 0.85);
      }
      return offscreenCanvas.toDataURL('image/jpeg', 0.85);
    }

    // 2. Fallback: synthesize directly from currentImage channel data if canvas hasn't painted yet
    if (currentImage && currentImage.chR && currentImage.width > 0) {
      const w = Math.min(800, currentImage.width);
      const h = Math.round((currentImage.height * w) / currentImage.width);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        const imgData = tempCtx.createImageData(w, h);
        const d = imgData.data;
        const srcW = currentImage.width;
        const srcH = currentImage.height;
        const r = currentImage.chR;
        const g = currentImage.chG;
        const b = currentImage.chB;

        for (let y = 0; y < h; y++) {
          const sy = Math.floor((y * srcH) / h);
          for (let x = 0; x < w; x++) {
            const sx = Math.floor((x * srcW) / w);
            const sIdx = sy * srcW + sx;
            const dIdx = (y * w + x) * 4;

            // Apply square root non-linear stretch so Gemini can see nebulosity/stars
            const rVal = Math.min(255, Math.max(0, Math.round(Math.pow(Math.max(0, r[sIdx] || 0), 0.4) * 255)));
            const gVal = Math.min(255, Math.max(0, Math.round(Math.pow(Math.max(0, g[sIdx] || 0), 0.4) * 255)));
            const bVal = Math.min(255, Math.max(0, Math.round(Math.pow(Math.max(0, b[sIdx] || 0), 0.4) * 255)));

            d[dIdx] = rVal;
            d[dIdx + 1] = gVal;
            d[dIdx + 2] = bVal;
            d[dIdx + 3] = 255;
          }
        }
        tempCtx.putImageData(imgData, 0, 0);
        return tempCanvas.toDataURL('image/jpeg', 0.85);
      }
    }

    return '';
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setApplied(false);

    try {
      const base64 = getCanvasBase64();
      if (!base64) {
        if (!currentImage) {
          throw new Error('NO_IMAGE_LOADED');
        }
        throw new Error('Image canvas rendering buffer is still initializing. Please click Retry.');
      }

      const res = await fetch('/api/gemini/analyze-astro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg',
          fileName: currentImage?.name || 'astro_capture.fits',
          currentTargetHint: currentImage?.rawHeader?.object || currentImage?.name || '',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data: any = await res.json();
      if (data.engine) {
        setEngineSource(data.engine);
      }
      setAnalysis(data);
    } catch (err: any) {
      console.error('Gemini Analysis error:', err);
      if (err.message === 'NO_IMAGE_LOADED') {
        setError('NO_IMAGE_LOADED');
      } else {
        setError(err.message || 'Failed to analyze astrophotography image with Gemini');
      }
    } finally {
      setLoading(false);
    }
  };

  // Run on mount
  useEffect(() => {
    runAnalysis();
  }, [currentImage]);

  const handleApplySettings = () => {
    if (!analysis) return;
    const sp = analysis.suggestedParams;
    const astroUpdate: Partial<AstroProcessingParams> = {
      midtones: sp.midtones ?? 0.08,
      blackPoint: sp.blackPoint ?? 0.02,
      whitePoint: sp.whitePoint ?? 1.0,
      saturation: sp.saturation ?? 1.25,
      scnrGreen: sp.scnrGreen ?? 0.5,
      waveletSharp: sp.waveletSharp ?? 15,
      hdrCompress: sp.hdrCompress ?? 20,
    };

    if (sp.starMaskThreshold !== undefined) {
      astroUpdate.starMaskThreshold = sp.starMaskThreshold;
      astroUpdate.starMaskEnabled = true;
    }
    if (sp.starProtectionStrength !== undefined) {
      astroUpdate.starProtectionStrength = sp.starProtectionStrength;
    }

    const planetaryUpdate: Partial<PlanetaryParams> = {};
    if (sp.adcShiftRY !== undefined) {
      planetaryUpdate.adcShiftRY = sp.adcShiftRY;
      planetaryUpdate.adcShiftBY = -sp.adcShiftRY;
      planetaryUpdate.enabled = true;
    }
    if (sp.waveletPlanetary !== undefined) {
      planetaryUpdate.waveletFine = Math.round(sp.waveletPlanetary * 0.7);
      planetaryUpdate.waveletMedium = Math.round(sp.waveletPlanetary * 0.5);
      planetaryUpdate.autoCenterROI = true;
      planetaryUpdate.enabled = true;
    }

    // Recommend DSO ROI configuration based on target identified
    const dsoRoiUpdate: Partial<DsoRoiParams> = {};
    const tType = (analysis.targetType || '').toLowerCase();
    const tName = (analysis.targetName || '').toLowerCase();

    if (tType.includes('galaxy') || tName.includes('galaxy') || tName.includes('m31') || tName.includes('m51')) {
      dsoRoiUpdate.enabled = true;
      dsoRoiUpdate.targetType = 'galaxy';
      dsoRoiUpdate.zoomLevel = 2;
      dsoRoiUpdate.coreHdr = 55;
      dsoRoiUpdate.detailEnhance = 60;
      dsoRoiUpdate.showOverlay = true;
    } else if (tType.includes('nebula') || tName.includes('nebula') || tName.includes('m42')) {
      dsoRoiUpdate.enabled = true;
      dsoRoiUpdate.targetType = 'nebula';
      dsoRoiUpdate.zoomLevel = 2;
      dsoRoiUpdate.coreHdr = 50;
      dsoRoiUpdate.detailEnhance = 50;
      dsoRoiUpdate.showOverlay = true;
    } else if (tType.includes('cluster') || tName.includes('cluster') || tName.includes('m13') || tName.includes('pleiades')) {
      dsoRoiUpdate.enabled = true;
      dsoRoiUpdate.targetType = 'cluster';
      dsoRoiUpdate.zoomLevel = 4;
      dsoRoiUpdate.coreHdr = 45;
      dsoRoiUpdate.detailEnhance = 65;
      dsoRoiUpdate.showOverlay = true;
    } else if (tType.includes('planet') || tName.includes('jupiter') || tName.includes('saturn') || tName.includes('mars')) {
      dsoRoiUpdate.enabled = true;
      dsoRoiUpdate.targetType = 'planet';
      dsoRoiUpdate.zoomLevel = 8;
      dsoRoiUpdate.coreHdr = 40;
      dsoRoiUpdate.detailEnhance = 70;
      dsoRoiUpdate.showOverlay = true;
    }

    onApplyAiParams(astroUpdate, planetaryUpdate, dsoRoiUpdate);
    setApplied(true);
    onShowToast(`✨ Gemini AI settings applied for ${analysis.targetName}!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-[#090d16] border border-indigo-500/40 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-sky-500/20 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Gemini AI Astrophotography Assistant</span>
                <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-400/30 text-[10px] font-mono text-purple-300">
                  Plate-Solver & Auto-Tuner
                </span>
              </h2>
              <div className="flex items-center gap-2 pt-0.5 text-[10px] font-mono">
                <span className="text-slate-400">{engineSource}</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Pre-Configured Server Proxy (No API Key Required)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={loading}
              onClick={runAnalysis}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition disabled:opacity-40"
              title="Re-run Gemini AI Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-sky-500/30 border border-purple-400/40 flex items-center justify-center animate-spin">
                  <Orbit className="w-8 h-8 text-purple-400" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-sky-300 animate-ping" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Gemini AI is analyzing capture...</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Plate solving coordinates, inspecting star shapes, evaluating seeing & tone curves
                </p>
              </div>

              <div className="max-w-xs w-full bg-[#131b2b] rounded-full h-1.5 overflow-hidden border border-[#1f2b42]">
                <div className="bg-gradient-to-r from-purple-500 to-sky-400 h-full w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {/* No Image Loaded State */}
          {error === 'NO_IMAGE_LOADED' && !loading && (
            <div className="p-5 rounded-xl bg-[#0d121d] border border-amber-500/40 space-y-3 text-slate-200">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>No Astronomical Image Loaded Yet</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gemini AI needs an astronomical capture or FITS frame to plate solve and diagnose. Choose one of the pre-loaded Dwarf 3 samples below to test Gemini AI immediately:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => {
                    if (onLoadSample) onLoadSample('m42');
                  }}
                  className="p-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-left transition"
                >
                  <div className="text-xs font-bold text-sky-300">Orion Nebula M42</div>
                  <div className="text-[10px] text-slate-400 font-mono">Emission Nebula • HDR Core</div>
                </button>
                <button
                  onClick={() => {
                    if (onLoadSample) onLoadSample('m31');
                  }}
                  className="p-2.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/40 text-left transition"
                >
                  <div className="text-xs font-bold text-purple-300">Andromeda M31</div>
                  <div className="text-[10px] text-slate-400 font-mono">Spiral Galaxy • Dust Lanes</div>
                </button>
                <button
                  onClick={() => {
                    if (onLoadSample) onLoadSample('jupiter');
                  }}
                  className="p-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-left transition"
                >
                  <div className="text-xs font-bold text-amber-300">Jupiter & Moons</div>
                  <div className="text-[10px] text-slate-400 font-mono">Planetary ADC & Wavelets</div>
                </button>
              </div>
            </div>
          )}

          {/* General Error State */}
          {error && error !== 'NO_IMAGE_LOADED' && !loading && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4" />
                <span>AI Analysis Encountered an Issue</span>
              </div>
              <p className="font-mono text-[11px]">{error}</p>
              <button
                onClick={runAnalysis}
                className="mt-2 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-semibold text-xs transition"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {/* Result State */}
          {analysis && !loading && (
            <>
              {/* Quick How to Use Banner */}
              <div className="p-3 rounded-xl bg-[#0d121d] border border-purple-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-300 font-bold flex items-center justify-center font-mono text-xs shrink-0">
                    ✨
                  </div>
                  <span className="text-slate-300 text-[11px] leading-snug">
                    <strong className="text-white">How to Use:</strong> Gemini has solved your target and diagnosed observing quality. Click <strong className="text-emerald-300">"Apply Gemini AI Settings"</strong> below to automatically apply the optimal stretch, HDR recovery, and star protection.
                  </span>
                </div>
              </div>

              {/* Target Identification Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-[#0d121d] to-[#0d121d] border border-purple-500/30 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current text-purple-400" />
                      <span>Identified Celestial Object</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {analysis.targetName}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 border border-purple-400/40 text-purple-300">
                      {analysis.targetType}
                    </span>
                    <div className="text-[9px] font-mono text-slate-400 mt-1">
                      Confidence: {analysis.confidence}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic border-t border-[#1f2b42] pt-2">
                  "{analysis.astronomyFacts}"
                </p>
              </div>

              {/* Optical Diagnostics Grid */}
              <div className="p-3.5 rounded-xl bg-[#06080d] border border-[#1f2b42] space-y-2.5">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    Optical & Quality Diagnostics
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Grade: {analysis.qualityAssessment.overallGrade}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                    <div className="text-[9px] text-slate-400 uppercase">Focus Score</div>
                    <div className="font-bold text-sky-300 text-sm">
                      {analysis.qualityAssessment.focusScore}/100
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                    <div className="text-[9px] text-slate-400 uppercase">Tracking / Stars</div>
                    <div className="font-semibold text-slate-200 truncate">
                      {analysis.qualityAssessment.trackingQuality}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                    <div className="text-[9px] text-slate-400 uppercase">Noise / SNR</div>
                    <div className="font-semibold text-slate-200">
                      {analysis.qualityAssessment.noiseLevel} Noise
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                    <div className="text-[9px] text-slate-400 uppercase">Atmospheric Seeing</div>
                    <div className="font-semibold text-slate-200 truncate">
                      {analysis.qualityAssessment.seeingEstimate}
                    </div>
                  </div>
                </div>

                {analysis.qualityAssessment.colorBalance && (
                  <p className="text-[10px] text-slate-400 font-mono">
                    Color: {analysis.qualityAssessment.colorBalance}
                  </p>
                )}
              </div>

              {/* Recommended Processing Values & One-Click Apply */}
              <div className="p-4 rounded-xl bg-gradient-to-tr from-sky-950/30 to-indigo-950/30 border border-sky-400/40 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">AI-Recommended Processing Adjustments</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300">Customized for this capture</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] font-mono text-center">
                  <div className="p-1.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                    <div className="text-slate-400">Midtones</div>
                    <div className="font-bold text-sky-300">{analysis.suggestedParams.midtones}</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                    <div className="text-slate-400">Black Pt</div>
                    <div className="font-bold text-slate-200">{analysis.suggestedParams.blackPoint}</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                    <div className="text-slate-400">Saturation</div>
                    <div className="font-bold text-amber-300">{analysis.suggestedParams.saturation}x</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                    <div className="text-slate-400">SCNR Green</div>
                    <div className="font-bold text-emerald-400">{Math.round((analysis.suggestedParams.scnrGreen ?? 0.5) * 100)}%</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                    <div className="text-slate-400">Sharpness</div>
                    <div className="font-bold text-indigo-300">+{analysis.suggestedParams.waveletSharp}</div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-[#0d121d] border border-[#1f2b42]">
                    <div className="text-slate-400">Star Mask</div>
                    <div className="font-bold text-purple-300">{analysis.suggestedParams.starMaskThreshold ?? 0.22}</div>
                  </div>
                </div>

                <button
                  onClick={handleApplySettings}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95 ${
                    applied
                      ? 'bg-emerald-500 text-slate-950 font-extrabold'
                      : 'bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-slate-950'
                  }`}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                      <span>Applied AI Settings to Sliders & Curves!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-current" />
                      <span>✨ Apply Gemini AI Recommended Settings</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dwarf 3 Specific Capture & Hardware Advice */}
              {analysis.dwarf3Tips && analysis.dwarf3Tips.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#06080d] border border-amber-500/30 space-y-2">
                  <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dwarf 3 Smart Astrograph Advice for this Target</span>
                  </div>

                  <ul className="text-[11px] text-slate-300 space-y-1.5 pl-1 font-mono">
                    {analysis.dwarf3Tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold shrink-0">🔭</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2b42] bg-[#06080d] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">
            AI Studio Multimodal Astro Solver
          </span>
          <button
            onClick={onClose}
            className="py-1 px-3.5 rounded-lg bg-[#131b2b] hover:bg-[#1a2337] text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
