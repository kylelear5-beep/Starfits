import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  LoadedAstroImage, 
  AstroProcessingParams, 
  Preset,
  DsoRoiParams,
  DEFAULT_DSO_ROI_PARAMS,
  DwarfTrackingMode,
  DwarfTrackingState
} from './types/fits';
import { 
  parseFitsHeader, 
  parseFitsData 
} from './utils/fitsParser';
import { 
  computeAutoSTF, 
  sampleBackgroundNeutralization, 
  renderAstroToCanvas 
} from './utils/astroStretch';
import { 
  generateSampleDataset, 
  SAMPLE_TARGETS 
} from './utils/sampleImages';
import { PRESETS } from './utils/presets';
import { 
  PlanetaryParams, 
  DEFAULT_PLANETARY_PARAMS 
} from './utils/planetaryProcessing';
import { 
  DWARF_TRACKING_CONFIGS, 
  DEFAULT_TRACKING_STATE 
} from './utils/dwarfTracking';
import { 
  CalculatedTarget, 
  getVisibleSkyTargets 
} from './utils/celestial';
import { Header } from './components/Header';
import { CanvasViewport } from './components/CanvasViewport';
import { HistogramPanel } from './components/HistogramPanel';
import { ControlDeck } from './components/ControlDeck';
import { FitsHeaderModal } from './components/FitsHeaderModal';
import { TelescopeCompass } from './components/TelescopeCompass';
import { SkyWeatherDeck } from './components/SkyWeatherDeck';
import { GeminiAstroModal } from './components/GeminiAstroModal';
import { GeminiGuideModal } from './components/GeminiGuideModal';
import { ShareAppModal } from './components/ShareAppModal';
import { PlanetaryStackModal } from './components/PlanetaryStackModal';
import { MosaicStudioModal } from './components/MosaicStudioModal';
import { StarPartyModal } from './components/StarPartyModal';
import { Sparkles, UploadCloud, X, Compass, CloudSun, RotateCcw, Share2, ImageIcon, Orbit, Crosshair, Grid, Users } from 'lucide-react';

const DEFAULT_PARAMS: AstroProcessingParams = {
  stretchMethod: 'mtf',
  blackPoint: 0.02,
  midtones: 0.08,
  whitePoint: 1.0,
  hdrCompress: 25,
  asinhBeta: 100,

  saturation: 1.25,
  scnrGreen: 0.5,
  offsetR: 0.0,
  offsetG: 0.0,
  offsetB: 0.0,
  colorTemp: 0,
  tint: 0,

  maskEnabled: false,
  maskX: 0.5,
  maskY: 0.5,
  maskRadius: 0.22,
  maskFeather: 0.12,
  maskBlackout: true,
  maskInvert: false,

  starless: false,
  starReduction: 0,
  gloss: 0,
  waveletSharp: 15,
  denoise: 0,

  // Star Mask & Stellar Protection
  starMaskEnabled: false,
  starMaskThreshold: 0.22,
  starMaskGrowth: 2,
  starMaskFeather: 3,
  starProtectionStrength: 0.85,
  starMaskViewMode: 'composite',
  starMaskTarget: 'nebulosity',
};

export default function App() {
  const [currentImage, setCurrentImage] = useState<LoadedAstroImage | null>(null);
  const [params, setParams] = useState<AstroProcessingParams>(DEFAULT_PARAMS);
  const [planetaryParams, setPlanetaryParams] = useState<PlanetaryParams>(DEFAULT_PLANETARY_PARAMS);
  const [dsoRoi, setDsoRoi] = useState<DsoRoiParams>(DEFAULT_DSO_ROI_PARAMS);
  const [centerRoiTrigger, setCenterRoiTrigger] = useState(0);
  const [nightMode, setNightMode] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [compareRaw, setCompareRaw] = useState(false);
  const [activeTab, setActiveTab] = useState('tabStretch');
  const [bortleNumber, setBortleNumber] = useState(4);

  // Telescope Setup, Compass, Weather & Events Modal
  const [telescopeSetupModalOpen, setTelescopeSetupModalOpen] = useState(false);
  const [setupModalSubTab, setSetupModalSubTab] = useState<'sky' | 'compass'>('sky');
  const [visibleTargets, setVisibleTargets] = useState<CalculatedTarget[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<CalculatedTarget | null>(null);

  // Gemini AI, Share App, Planetary Derotator, Mosaic & Star Party Modals
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const [geminiGuideOpen, setGeminiGuideOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [derotatorModalOpen, setDerotatorModalOpen] = useState(false);
  const [mosaicModalOpen, setMosaicModalOpen] = useState(false);
  const [starPartyModalOpen, setStarPartyModalOpen] = useState(false);

  // Dwarf 3 AI Tracking State (Birds, UFOs, Planes, Animals, Cars, Astro, Planetary)
  const [trackingState, setTrackingState] = useState<DwarfTrackingState>(DEFAULT_TRACKING_STATE);

  // Picking Modes
  const [pickingMask, setPickingMask] = useState(false);
  const [pickingBackground, setPickingBackground] = useState(false);

  // Modals & Remote Loading
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dual offscreen rendering buffers
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const rawOffscreenCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const renderAnimFrameRef = useRef<number | null>(null);

  // Toast notification helper
  const showToast = useCallback((msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, duration);
  }, []);

  // Re-render processed and raw buffers when image or params change
  const scheduleRender = useCallback(() => {
    if (!currentImage) return;
    if (renderAnimFrameRef.current) cancelAnimationFrame(renderAnimFrameRef.current);

    renderAnimFrameRef.current = requestAnimationFrame(() => {
      const offCanvas = offscreenCanvasRef.current;
      const rawCanvas = rawOffscreenCanvasRef.current;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      const rawCtx = rawCanvas.getContext('2d', { willReadFrequently: true });

      if (offCtx && rawCtx) {
        // Render Stretched with planetary & DSO ROI processing
        renderAstroToCanvas(
          currentImage.chR,
          currentImage.chG,
          currentImage.chB,
          currentImage.width,
          currentImage.height,
          params,
          offCanvas,
          offCtx,
          false,
          planetaryParams,
          dsoRoi
        );

        // Render Raw Linear (for instant comparison)
        renderAstroToCanvas(
          currentImage.chR,
          currentImage.chG,
          currentImage.chB,
          currentImage.width,
          currentImage.height,
          params,
          rawCanvas,
          rawCtx,
          true
        );
      }
    });
  }, [currentImage, params, planetaryParams, dsoRoi]);

  useEffect(() => {
    scheduleRender();
  }, [scheduleRender]);

  // Initial Load: Orion Nebula M42 sample and Celestial Ephemeris
  useEffect(() => {
    const defaultSample = generateSampleDataset('m42');
    setCurrentImage(defaultSample);
    
    // Auto-STF calculation for default sample
    const stf = computeAutoSTF(defaultSample.chR, defaultSample.chG, defaultSample.chB);
    setParams((prev) => ({
      ...prev,
      blackPoint: stf.blackPoint,
      midtones: stf.midtones,
      whitePoint: stf.whitePoint,
    }));

    // Calculate initial visible sky targets
    const targets = getVisibleSkyTargets(34.05, -118.25);
    setVisibleTargets(targets);
    const jupiter = targets.find((t) => t.id === 'jupiter') || targets[0];
    if (jupiter) setSelectedTarget(jupiter);
  }, []);

  // ROI Handlers
  const handleUpdateRoi = useCallback((newRoi: Partial<DsoRoiParams>) => {
    setDsoRoi((prev) => ({ ...prev, ...newRoi }));
  }, []);

  const handleResetRoi = useCallback(() => {
    setDsoRoi(DEFAULT_DSO_ROI_PARAMS);
    showToast('Reset ROI framing parameters');
  }, [showToast]);

  const handleCenterViewportOnRoi = useCallback(() => {
    setCenterRoiTrigger((prev) => prev + 1);
  }, []);

  // Revert all parameters back to original unedited state
  const handleRevertToOriginal = () => {
    setParams(DEFAULT_PARAMS);
    setPlanetaryParams(DEFAULT_PLANETARY_PARAMS);
    setDsoRoi(DEFAULT_DSO_ROI_PARAMS);
    setPickingMask(false);
    setPickingBackground(false);
    showToast('↺ Reverted all processing adjustments back to original unedited state');
  };

  // Update params helper
  const handleUpdateParams = (newParams: Partial<AstroProcessingParams>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  };

  // Apply Gemini AI recommendations
  const handleApplyAiParams = (
    astroUpdates: Partial<AstroProcessingParams>,
    planetaryUpdates?: Partial<PlanetaryParams>,
    dsoRoiUpdates?: Partial<DsoRoiParams>
  ) => {
    setParams((prev) => ({ ...prev, ...astroUpdates }));
    if (planetaryUpdates && Object.keys(planetaryUpdates).length > 0) {
      setPlanetaryParams((prev) => ({ ...prev, ...planetaryUpdates }));
    }
    if (dsoRoiUpdates && Object.keys(dsoRoiUpdates).length > 0) {
      setDsoRoi((prev) => ({ ...prev, ...dsoRoiUpdates }));
      setCenterRoiTrigger((prev) => prev + 1);
    }
  };

  // Apply master derotated & stacked planetary image
  const handleApplyMasterStack = (stackedImage: LoadedAstroImage) => {
    setCurrentImage(stackedImage);
    setPlanetaryParams((prev) => ({
      ...prev,
      enabled: true,
      autoCenterROI: true,
      waveletFine: 45,
      waveletMedium: 30,
      waveletLarge: 15,
      diskContrast: 35,
      surfaceSat: 125,
    }));
    setActiveTab('tabPlanetary');
    showToast(`🪐 Master Derotated Stack (${stackedImage.name}) loaded with wavelets active!`);
  };

  // Apply master stitched astronomical mosaic
  const handleApplyMosaic = (mosaicImage: LoadedAstroImage) => {
    setCurrentImage(mosaicImage);
    const stf = computeAutoSTF(mosaicImage.chR, mosaicImage.chG, mosaicImage.chB);
    setParams((prev) => ({
      ...prev,
      blackPoint: stf.blackPoint,
      midtones: stf.midtones,
      whitePoint: stf.whitePoint,
      saturation: 1.35,
      hdrCompress: 20,
    }));
    showToast(`🔭 Master Mosaic (${mosaicImage.width}×${mosaicImage.height}) loaded with Auto-STF!`);
  };

  // Auto-STF (Screen Transfer Function)
  const handleAutoSTF = () => {
    if (!currentImage) return;
    const stf = computeAutoSTF(currentImage.chR, currentImage.chG, currentImage.chB);
    handleUpdateParams({
      blackPoint: stf.blackPoint,
      midtones: stf.midtones,
      whitePoint: stf.whitePoint,
    });
    showToast(`⚡ Auto-Stretch applied (Black: ${stf.blackPoint}, Mid: ${stf.midtones})`);
  };

  // Reset to Linear Raw
  const handleResetStretch = () => {
    handleUpdateParams({
      blackPoint: 0.0,
      midtones: 0.5,
      whitePoint: 1.0,
      hdrCompress: 0,
      stretchMethod: 'mtf',
    });
    showToast('Reset to linear un-stretched data');
  };

  // Auto Neutralize Sky Background
  const handleAutoNeutralizeBg = () => {
    if (!currentImage) return;
    const offsets = sampleBackgroundNeutralization(
      currentImage.chR,
      currentImage.chG,
      currentImage.chB,
      currentImage.width,
      currentImage.height,
      0.08,
      0.08,
      0.05
    );
    handleUpdateParams({
      offsetR: offsets.offsetR,
      offsetG: offsets.offsetG,
      offsetB: offsets.offsetB,
    });
    showToast('Sky background color pedestals neutralized');
  };

  // Sample Sky Background from Canvas Click
  const handleSampleBackgroundFromCanvas = (x: number, y: number) => {
    if (!currentImage) return;
    const offsets = sampleBackgroundNeutralization(
      currentImage.chR,
      currentImage.chG,
      currentImage.chB,
      currentImage.width,
      currentImage.height,
      x,
      y,
      0.04
    );
    handleUpdateParams({
      offsetR: offsets.offsetR,
      offsetG: offsets.offsetG,
      offsetB: offsets.offsetB,
    });
    setPickingBackground(false);
    showToast(`Sampled background at [${Math.round(x * 100)}%, ${Math.round(y * 100)}%]`);
  };

  // Apply Presets
  const handleApplyPreset = (preset: Preset) => {
    setParams((prev) => ({ ...prev, ...preset.params }));
    showToast(`Applied preset: ${preset.name}`);
  };

  // Select Sample Image
  const handleSelectSample = (sampleId: string) => {
    const sample = generateSampleDataset(sampleId);
    setCurrentImage(sample);
    const stf = computeAutoSTF(sample.chR, sample.chG, sample.chB);
    setParams((prev) => ({
      ...prev,
      blackPoint: stf.blackPoint,
      midtones: stf.midtones,
      whitePoint: stf.whitePoint,
      maskEnabled: false,
    }));

    if (sampleId === 'm31') {
      setDsoRoi((prev) => ({ ...prev, targetType: 'galaxy', enabled: false }));
    } else if (sampleId === 'm42') {
      setDsoRoi((prev) => ({ ...prev, targetType: 'nebula', enabled: false }));
    } else if (sampleId === 'm13') {
      setDsoRoi((prev) => ({ ...prev, targetType: 'cluster', enabled: false }));
    } else if (sampleId === 'jupiter' || sampleId === 'jupiter_dwarf3' || sampleId === 'saturn_dwarf3') {
      setDsoRoi((prev) => ({ ...prev, targetType: 'planet', enabled: false }));
    } else if (sampleId === 'sample_bird') {
      setTrackingState((prev) => ({ ...prev, activeMode: 'bird' }));
    } else if (sampleId === 'sample_ufo') {
      setTrackingState((prev) => ({ ...prev, activeMode: 'ufo' }));
    } else if (sampleId === 'sample_plane') {
      setTrackingState((prev) => ({ ...prev, activeMode: 'plane' }));
    } else if (sampleId === 'sample_animal') {
      setTrackingState((prev) => ({ ...prev, activeMode: 'animal' }));
    } else if (sampleId === 'sample_car') {
      setTrackingState((prev) => ({ ...prev, activeMode: 'car' }));
    }

    showToast(`Loaded ${sample.name}`);
  };

  // Select Dwarf 3 Tracking Mode (Birds, UFOs, Planes, Animals, Cars, Astro, Planetary)
  const handleSelectTrackingMode = useCallback((mode: DwarfTrackingMode, autoLoadSample = true) => {
    const config = DWARF_TRACKING_CONFIGS[mode];
    setTrackingState((prev) => ({
      ...prev,
      activeMode: mode,
      isLocked: true,
      activeLens: config.lens === 'wide' ? 'wide' : 'tele',
      pidGain: config.pidSensitivity,
      leadFactor: config.leadPrediction,
    }));

    if (autoLoadSample && config.sampleId) {
      const sample = generateSampleDataset(config.sampleId);
      setCurrentImage(sample);
      const stf = computeAutoSTF(sample.chR, sample.chG, sample.chB);
      if (mode === 'bird' || mode === 'plane' || mode === 'animal' || mode === 'car') {
        setParams((prev) => ({
          ...prev,
          stretchMethod: 'mtf',
          blackPoint: 0.01,
          midtones: 0.16,
          whitePoint: 1.0,
          saturation: 1.35,
          scnrGreen: 0.0,
        }));
      } else {
        setParams((prev) => ({
          ...prev,
          blackPoint: stf.blackPoint,
          midtones: stf.midtones,
          whitePoint: stf.whitePoint,
        }));
      }
      showToast(`${config.badge} mode active — ${sample.name.replace('.fits', '')} lock acquired!`);
    } else {
      showToast(`${config.badge} mode active (${config.lensLabel}, ${config.shutter})`);
    }
  }, [showToast]);

  // Load File (FITS, Camera Roll photo, or standard picture)
  const handleOpenFile = async (file: File) => {
    const name = file.name.toLowerCase();
    try {
      if (name.endsWith('.fits') || name.endsWith('.fit') || name.endsWith('.fts')) {
        showToast(`Parsing FITS header & data for ${file.name}...`, 4000);
        const arrayBuf = await file.arrayBuffer();
        const { header, dataOffset } = parseFitsHeader(arrayBuf);
        const astroImg = parseFitsData(arrayBuf, header, dataOffset, file.name);

        setCurrentImage(astroImg);
        const stf = computeAutoSTF(astroImg.chR, astroImg.chG, astroImg.chB);
        setParams((prev) => ({
          ...prev,
          blackPoint: stf.blackPoint,
          midtones: stf.midtones,
          whitePoint: stf.whitePoint,
          maskEnabled: false,
        }));
        showToast(`✅ Loaded FITS: ${file.name} (${astroImg.width}×${astroImg.height})`);
      } else {
        // Standard Image or Photo Album picture (JPG / PNG / WebP / HEIC)
        showToast(`Importing photo from album: ${file.name}...`);
        const url = URL.createObjectURL(file);
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        });
        URL.revokeObjectURL(url);

        const w = img.width;
        const h = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context failed');

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h).data;
        const total = w * h;

        const chR = new Float32Array(total);
        const chG = new Float32Array(total);
        const chB = new Float32Array(total);

        for (let i = 0; i < total; i++) {
          chR[i] = imgData[i * 4] / 255.0;
          chG[i] = imgData[i * 4 + 1] / 255.0;
          chB[i] = imgData[i * 4 + 2] / 255.0;
        }

        const loaded: LoadedAstroImage = {
          id: 'img_' + Date.now(),
          name: file.name,
          width: w,
          height: h,
          chR,
          chG,
          chB,
          isFits: false,
          fileSize: file.size,
          sourceType: 'image',
        };

        setCurrentImage(loaded);
        setParams((prev) => ({
          ...prev,
          blackPoint: 0.0,
          midtones: 0.5,
          whitePoint: 1.0,
          maskEnabled: false,
        }));
        showToast(`✅ Loaded Photo: ${file.name} (${w}×${h})`);
      }
    } catch (err: any) {
      console.error('Error opening file:', err);
      showToast(`Error loading file: ${err.message || 'Unknown error'}`);
    }
  };

  // Fetch Remote Cloud FITS (Dwarflab / External telescope server)
  const handleFetchRemoteUrl = async (url: string) => {
    setIsFetchingUrl(true);
    showToast('Fetching FITS from remote cloud server...', 5000);

    try {
      let res: Response;
      try {
        res = await fetch(`/api/proxy-fits?url=${encodeURIComponent(url)}`);
      } catch {
        res = await fetch(url);
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const buffer = await res.arrayBuffer();
      const fileName = url.split('/').pop()?.split('?')[0] || 'remote_telescope.fits';
      const { header, dataOffset } = parseFitsHeader(buffer);
      const astroImg = parseFitsData(buffer, header, dataOffset, fileName);

      setCurrentImage(astroImg);
      const stf = computeAutoSTF(astroImg.chR, astroImg.chG, astroImg.chB);
      setParams((prev) => ({
        ...prev,
        blackPoint: stf.blackPoint,
        midtones: stf.midtones,
        whitePoint: stf.whitePoint,
        maskEnabled: false,
      }));
      showToast(`✅ Fetched & Auto-Stretched FITS: ${fileName}`);
    } catch (err: any) {
      console.error('Fetch error:', err);
      showToast(`Cloud fetch failed: ${err.message || 'Check URL or CORS'}`);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  // Export full resolution image
  const handleExport = (format: 'png' | 'jpg' | 'webp') => {
    const offCanvas = offscreenCanvasRef.current;
    if (!offCanvas || offCanvas.width === 0) return;

    const baseName = (currentImage?.name || 'astrophotography').replace(/\.[^/.]+$/, '');
    const mimeMap = {
      png: 'image/png',
      jpg: 'image/jpeg',
      webp: 'image/webp',
    };

    offCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_stretched.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Saved full-res ${offCanvas.width}×${offCanvas.height} ${format.toUpperCase()}`);
      },
      mimeMap[format],
      0.95
    );
  };

  // Send to Google Flow
  const handleSendToFlow = () => {
    const offCanvas = offscreenCanvasRef.current;
    if (!offCanvas || offCanvas.width === 0) return;

    showToast('Exporting high-resolution PNG for Google Flow...', 2500);
    handleExport('png');
    setTimeout(() => {
      window.open('https://flow.google.com/', '_blank');
      showToast('Opened Google Flow in new tab');
    }, 700);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.relatedTarget === null) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleOpenFile(file);
    }
  };

  return (
    <div
      className={`h-[100dvh] w-screen overflow-hidden flex flex-col font-sans select-none bg-[#05070c] text-slate-100 ${
        nightMode ? 'night-vision' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top App Header with Gemini, Photo Album, Weather, and Share App */}
      <Header
        currentImage={currentImage}
        nightMode={nightMode}
        onToggleNightMode={() => setNightMode(!nightMode)}
        onOpenFile={handleOpenFile}
        onSelectSample={handleSelectSample}
        onApplyPreset={handleApplyPreset}
        onOpenHeaderModal={() => setHeaderModalOpen(true)}
        onExport={handleExport}
        onSendToFlow={handleSendToFlow}
        splitView={splitView}
        onToggleSplitView={() => setSplitView(!splitView)}
        onRevertToOriginal={handleRevertToOriginal}
        onToggleTelescopeSetup={() => setTelescopeSetupModalOpen(!telescopeSetupModalOpen)}
        telescopeSetupOpen={telescopeSetupModalOpen}
        onOpenGeminiAi={() => setGeminiModalOpen(true)}
        onOpenGeminiGuide={() => setGeminiGuideOpen(true)}
        onOpenShareApp={() => setShareModalOpen(true)}
        onOpenDerotator={() => setDerotatorModalOpen(true)}
        onOpenMosaicStudio={() => setMosaicModalOpen(true)}
        onOpenStarParty={() => setStarPartyModalOpen(true)}
        bortleNumber={bortleNumber}
        activeTrackingMode={trackingState.activeMode}
        onSelectTrackingMode={handleSelectTrackingMode}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* Canvas Viewport */}
        <CanvasViewport
          offscreenCanvas={offscreenCanvasRef.current}
          rawOffscreenCanvas={rawOffscreenCanvasRef.current}
          params={params}
          pickingMask={pickingMask}
          onSetMaskCenter={(x, y) => {
            setParams((prev) => ({ ...prev, maskX: x, maskY: y, maskEnabled: true }));
            setPickingMask(false);
            showToast(`Target center set to [${Math.round(x * 100)}%, ${Math.round(y * 100)}%]`);
          }}
          pickingBackground={pickingBackground}
          onSampleBackground={handleSampleBackgroundFromCanvas}
          compareRaw={compareRaw}
          onCompareRawStart={() => setCompareRaw(true)}
          onCompareRawEnd={() => setCompareRaw(false)}
          splitView={splitView}
          imageWidth={currentImage?.width || 0}
          imageHeight={currentImage?.height || 0}
          dsoRoi={dsoRoi}
          onUpdateRoi={handleUpdateRoi}
          centerRoiTrigger={centerRoiTrigger}
          trackingState={trackingState}
          trackingConfig={DWARF_TRACKING_CONFIGS[trackingState.activeMode]}
          onUpdateTrackingState={(up) => setTrackingState((prev) => ({ ...prev, ...up }))}
        />

        {/* Right / Bottom Control Deck */}
        <div className="w-full lg:w-[440px] h-[52dvh] lg:h-full shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[#1f2b42] bg-[#090d16]">
          {/* Histogram Panel */}
          <HistogramPanel
            offscreenCanvas={offscreenCanvasRef.current}
            params={params}
            onAutoSTF={handleAutoSTF}
            onResetStretch={handleResetStretch}
            onUpdateParams={handleUpdateParams}
          />

          {/* Controls & Tabs Deck */}
          <ControlDeck
            params={params}
            onUpdateParams={handleUpdateParams}
            onAutoSTF={handleAutoSTF}
            onResetStretch={handleResetStretch}
            onAutoNeutralizeBg={handleAutoNeutralizeBg}
            pickingMask={pickingMask}
            onStartPickingMask={() => {
              setParams((prev) => ({ ...prev, maskEnabled: true }));
              setPickingMask(true);
              setPickingBackground(false);
            }}
            pickingBackground={pickingBackground}
            onStartPickingBg={() => {
              setPickingBackground(true);
              setPickingMask(false);
            }}
            currentImage={currentImage}
            onFetchRemoteUrl={handleFetchRemoteUrl}
            isFetchingUrl={isFetchingUrl}
            onOpenHeaderModal={() => setHeaderModalOpen(true)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            planetaryParams={planetaryParams}
            onUpdatePlanetary={(newP) => setPlanetaryParams((prev) => ({ ...prev, ...newP }))}
            onResetPlanetary={() => setPlanetaryParams(DEFAULT_PLANETARY_PARAMS)}
            selectedTarget={selectedTarget}
            onSelectTarget={(t) => setSelectedTarget(t)}
            visibleTargets={visibleTargets}
            onRevertToOriginal={handleRevertToOriginal}
            onOpenDerotatorModal={() => setDerotatorModalOpen(true)}
            roiParams={dsoRoi}
            onUpdateRoi={handleUpdateRoi}
            onResetRoi={handleResetRoi}
            onCenterViewportOnRoi={handleCenterViewportOnRoi}
            onShowToast={showToast}
            trackingState={trackingState}
            onUpdateTrackingState={(up) => setTrackingState((prev) => ({ ...prev, ...up }))}
            onSelectTrackingMode={handleSelectTrackingMode}
            onOpenGeminiAi={() => setGeminiModalOpen(true)}
          />
        </div>
      </div>

      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-4 rounded-3xl border-3 border-dashed border-sky-400 bg-sky-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95">
          <UploadCloud className="w-16 h-16 text-sky-400 mb-3 animate-bounce" />
          <h3 className="text-xl font-bold text-white mb-1">Drop Astronomical Image or FITS Here</h3>
          <p className="text-xs text-sky-300 font-mono">Supports .fits, .fit, .fts, .png, .jpg, .webp</p>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-[#0d121d]/95 border border-sky-500/50 text-xs font-semibold text-slate-100 shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FITS Header Inspector Modal */}
      {headerModalOpen && currentImage?.rawHeader && (
        <FitsHeaderModal
          header={currentImage.rawHeader}
          fileName={currentImage.name}
          onClose={() => setHeaderModalOpen(false)}
        />
      )}

      {/* Gemini AI Plate Solver & Tuning Modal */}
      {geminiModalOpen && (
        <GeminiAstroModal
          offscreenCanvas={offscreenCanvasRef.current}
          currentImage={currentImage}
          onApplyAiParams={handleApplyAiParams}
          onClose={() => setGeminiModalOpen(false)}
          onShowToast={showToast}
          onLoadSample={(id) => handleSelectSample(id)}
        />
      )}

      {/* How to Use Gemini AI Guide Modal */}
      {geminiGuideOpen && (
        <GeminiGuideModal
          onClose={() => setGeminiGuideOpen(false)}
          onOpenGeminiAi={() => setGeminiModalOpen(true)}
          onLoadSample={(id) => handleSelectSample(id)}
        />
      )}

      {/* Share App with Telescope Buddy Modal */}
      {shareModalOpen && (
        <ShareAppModal
          onClose={() => setShareModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Planetary Derotator & Frame Stacker Modal */}
      {derotatorModalOpen && (
        <PlanetaryStackModal
          onClose={() => setDerotatorModalOpen(false)}
          onApplyMasterStack={handleApplyMasterStack}
          onShowToast={showToast}
        />
      )}

      {/* Mosaic Studio Modal (Spatial Transformation Matrices & Widefield Stitching) */}
      {mosaicModalOpen && (
        <MosaicStudioModal
          currentImage={currentImage}
          onApplyMosaic={handleApplyMosaic}
          onClose={() => setMosaicModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Star Party & Public Outreach Suite Modal */}
      {starPartyModalOpen && (
        <StarPartyModal
          currentImage={currentImage}
          bortleNumber={bortleNumber}
          onSelectTarget={(targetId) => handleSelectSample(targetId)}
          onClose={() => setStarPartyModalOpen(false)}
          onShowToast={showToast}
          nightMode={nightMode}
          onToggleNightMode={() => setNightMode(!nightMode)}
        />
      )}

      {/* Telescope Setup, Weather, Bortle & Events Modal */}
      {telescopeSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
          <div className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-[#090d16] border border-[#1f2b42] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Dwarf 3 Observing Conditions & Setup</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                      Bortle {bortleNumber}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Weather • Bortle Scale 1-9 • Upcoming Celestial Events • 360° Compass & Inclinometer Angle
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTelescopeSetupModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="px-5 py-2.5 border-b border-[#1f2b42] bg-[#0d121d] flex gap-2">
              <button
                onClick={() => setSetupModalSubTab('sky')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  setupModalSubTab === 'sky'
                    ? 'bg-sky-500/20 text-sky-200 border border-sky-400 shadow-sm'
                    : 'bg-[#131b2b] text-slate-400 border border-[#1f2b42] hover:text-white'
                }`}
              >
                <CloudSun className="w-3.5 h-3.5" />
                <span>Weather, Bortle Scale & Events</span>
              </button>

              <button
                onClick={() => setSetupModalSubTab('compass')}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  setupModalSubTab === 'compass'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-400 shadow-sm'
                    : 'bg-[#131b2b] text-slate-400 border border-[#1f2b42] hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>360° Compass & Altitude Inclinometer</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {setupModalSubTab === 'sky' ? (
                <SkyWeatherDeck
                  onSelectTargetForCompass={(t) => {
                    setSelectedTarget(t);
                    setSetupModalSubTab('compass');
                    showToast(`Selected ${t.name}: Alt ${t.altitude}°, Az ${t.azimuth}° ${t.compassDirection}`);
                  }}
                  selectedTargetId={selectedTarget?.id}
                  currentBortle={bortleNumber}
                  onBortleChange={(b) => setBortleNumber(b)}
                />
              ) : (
                <TelescopeCompass
                  selectedTarget={selectedTarget}
                  onSelectTarget={(t) => setSelectedTarget(t)}
                  visibleTargets={visibleTargets}
                  onClose={() => setTelescopeSetupModalOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
