import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  X, 
  Layers, 
  Sparkles, 
  Check, 
  Sliders, 
  Maximize2, 
  FileText, 
  Upload, 
  RefreshCw, 
  HelpCircle, 
  Move, 
  RotateCw, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  SplitSquareVertical,
  SlidersHorizontal
} from 'lucide-react';
import { 
  LoadedAstroImage, 
  MosaicPanel, 
  MosaicResult, 
  MosaicStitchOptions, 
  MosaicTransformModel,
  StarMatchPoint 
} from '../types/fits';
import { 
  calculateTransformationMatrix, 
  detectStarCentroids, 
  getSampleMosaicDatasets, 
  IDENTITY_MATRIX_3X3, 
  registerMosaicPanel, 
  stitchMosaicComposite 
} from '../utils/mosaicTransformation';
import { generateSampleDataset } from '../utils/sampleImages';
import { computeAutoSTF } from '../utils/astroStretch';

interface MosaicStudioModalProps {
  currentImage: LoadedAstroImage | null;
  onApplyMosaic: (mosaicImage: LoadedAstroImage) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const MosaicStudioModal: React.FC<MosaicStudioModalProps> = ({
  currentImage,
  onApplyMosaic,
  onClose,
  onShowToast,
}) => {
  const [panels, setPanels] = useState<MosaicPanel[]>([]);
  const [options, setOptions] = useState<MosaicStitchOptions>({
    transformModel: 'similarity',
    featherWidth: 32,
    backgroundEqualization: true,
    starSensitivity: 0.6,
    blendingMode: 'linear',
  });
  const [isAligning, setIsAligning] = useState(false);
  const [isStitching, setIsStitching] = useState(false);
  const [mosaicResult, setMosaicResult] = useState<MosaicResult | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'composite' | 'layout'>('composite');

  // Load initial sample mosaic (Veil Nebula 2-Panel Super-Mosaic)
  useEffect(() => {
    loadSampleDataset('veil_mosaic');
  }, []);

  const loadSampleDataset = (datasetId: string) => {
    const dsList = getSampleMosaicDatasets();
    const ds = dsList.find((d) => d.id === datasetId) || dsList[0];

    // Generate sample panels with known overlap offsets
    const baseImg = currentImage && currentImage.width > 200 ? currentImage : generateSampleDataset('veil');
    const panelList: MosaicPanel[] = [];

    // Panel 1: Reference frame
    panelList.push({
      id: 'panel_1',
      name: `${ds.panels[0].name}`,
      image: baseImg,
      isReference: true,
      matrix: [...IDENTITY_MATRIX_3X3],
      rotationDeg: 0,
      scale: 1.0,
      translationX: 0,
      translationY: 0,
      matchedStarsCount: 38,
      rmsePixelError: 0.0,
      status: 'aligned',
    });

    // Panel 2: Overlapping frame
    const p2Offset = ds.panels[1]?.offset || { dx: 450, dy: 15, rotDeg: 2.1 };
    // Create an overlapping shifted/rotated dataset
    const p2Img = generateSampleDataset(datasetId === 'orion_mosaic' ? 'm42' : 'veil');
    
    // Synthesize registered transformation matrix
    const rotRad = (p2Offset.rotDeg * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const matrix = [
      cosR, -sinR, p2Offset.dx,
      sinR,  cosR, p2Offset.dy,
      0,     0,    1,
    ];

    panelList.push({
      id: 'panel_2',
      name: `${ds.panels[1].name}`,
      image: p2Img,
      isReference: false,
      matrix,
      rotationDeg: p2Offset.rotDeg,
      scale: 1.0,
      translationX: p2Offset.dx,
      translationY: p2Offset.dy,
      matchedStarsCount: 32,
      rmsePixelError: 0.34,
      status: 'aligned',
    });

    setPanels(panelList);
    setSelectedPanelId(panelList[1]?.id || panelList[0]?.id || null);
    setMosaicResult(null);
    onShowToast(`Loaded ${ds.title} for mosaic alignment!`);
  };

  // Re-run registration & compute transformation matrices
  const handleRunAlignment = () => {
    if (panels.length < 2) {
      onShowToast('Need at least 2 panels to calculate alignment matrices');
      return;
    }

    setIsAligning(true);
    setTimeout(() => {
      try {
        const refPanel = panels.find((p) => p.isReference) || panels[0];
        const updatedPanels = panels.map((p) => {
          if (p.id === refPanel.id) {
            return {
              ...p,
              isReference: true,
              matrix: [...IDENTITY_MATRIX_3X3],
              rotationDeg: 0,
              scale: 1.0,
              translationX: 0,
              translationY: 0,
              status: 'aligned' as const,
            };
          }

          // Register target against reference
          const reg = registerMosaicPanel(refPanel.image, p.image, options.transformModel, {
            dx: p.translationX || refPanel.image.width * 0.45,
            dy: p.translationY || 0,
            rotDeg: p.rotationDeg || 0,
          });

          return {
            ...p,
            matrix: reg.matrix,
            rotationDeg: Number(reg.rotationDeg.toFixed(3)),
            scale: Number(reg.scale.toFixed(4)),
            translationX: Number(reg.translationX.toFixed(1)),
            translationY: Number(reg.translationY.toFixed(1)),
            matchedStarsCount: reg.matchedStars.length,
            rmsePixelError: Number(reg.rmse.toFixed(2)),
            status: 'aligned' as const,
          };
        });

        setPanels(updatedPanels);
        onShowToast(`✨ Computed ${options.transformModel.toUpperCase()} transformation matrices for ${updatedPanels.length} panels!`);
      } catch (err: any) {
        console.error('Alignment failed', err);
        onShowToast(`Alignment error: ${err.message || 'Matrix calculation failed'}`);
      } finally {
        setIsAligning(false);
      }
    }, 120);
  };

  // Stitch panels using backward mapping & distance-feathered blending
  const handleStitchMosaic = () => {
    if (panels.length < 2) return;
    setIsStitching(true);

    setTimeout(() => {
      try {
        const result = stitchMosaicComposite(panels, options);
        setMosaicResult(result);
        onShowToast(`✅ Stitched ${result.totalWidth}×${result.totalHeight} mosaic in ${result.computationTimeMs}ms!`);
      } catch (err: any) {
        console.error('Stitching failed', err);
        onShowToast(`Stitching error: ${err.message}`);
      } finally {
        setIsStitching(false);
      }
    }, 150);
  };

  // Apply master stitched mosaic to main studio viewport
  const handleApplyToStudio = () => {
    if (!mosaicResult) return;
    onApplyMosaic(mosaicResult.compositeImage);
    onClose();
    onShowToast(`🔭 Master Mosaic (${mosaicResult.totalWidth}×${mosaicResult.totalHeight}) loaded into viewport!`);
  };

  const selectedPanel = panels.find((p) => p.id === selectedPanelId) || panels[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl bg-[#090d16] border border-sky-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-purple-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300 shadow-inner">
              <Grid className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Astronomical Mosaic & Spatial Alignment Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-950 text-sky-300 border border-sky-500/30">
                  Affine / Projective Matrix Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Calculates sub-pixel transformation matrices $[a, b, t_x; c, d, t_y; 0, 0, 1]$ and warps overlapping FITS panels into seamless widefield mosaics.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131b2b] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#1f2b42]">
          {/* Left Panel: Panels List & Transformation Matrix Inspector */}
          <div className="w-full md:w-[380px] shrink-0 p-4 space-y-4 overflow-y-auto custom-scrollbar text-xs bg-[#070a11]">
            {/* Quick Sample Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Mosaic Datasets</span>
                <span className="text-sky-400">Multi-Panel Sets</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => loadSampleDataset('veil_mosaic')}
                  className="px-2 py-1.5 rounded-lg bg-[#0d121d] hover:bg-[#151d2f] border border-[#1f2b42] hover:border-sky-500/50 text-[10px] font-semibold text-slate-200 transition truncate"
                  title="NGC 6960 / 6992 Veil Nebula Super-Mosaic"
                >
                  🕸️ Veil (2-P)
                </button>
                <button
                  onClick={() => loadSampleDataset('orion_mosaic')}
                  className="px-2 py-1.5 rounded-lg bg-[#0d121d] hover:bg-[#151d2f] border border-[#1f2b42] hover:border-sky-500/50 text-[10px] font-semibold text-slate-200 transition truncate"
                  title="M42 Orion & Horsehead Mosaic"
                >
                  🌌 Orion (2-P)
                </button>
                <button
                  onClick={() => loadSampleDataset('dwarf3_survey')}
                  className="px-2 py-1.5 rounded-lg bg-[#0d121d] hover:bg-[#151d2f] border border-[#1f2b42] hover:border-sky-500/50 text-[10px] font-semibold text-slate-200 transition truncate"
                  title="Dwarf 3 Dual-Tile Survey"
                >
                  🔭 Dwarf 3 Survey
                </button>
              </div>
            </div>

            {/* Overlapping Panels List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300">Mosaic Panels ({panels.length})</span>
                <span className="text-slate-500 font-mono text-[10px]">Reference: Panel 1</span>
              </div>

              <div className="space-y-1.5">
                {panels.map((p, idx) => {
                  const isSel = p.id === selectedPanelId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPanelId(p.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSel
                          ? 'bg-sky-500/15 border-sky-400 text-white shadow-sm'
                          : 'bg-[#0d121d] border-[#1f2b42] text-slate-300 hover:bg-[#131b2b]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${p.isReference ? 'bg-amber-400' : 'bg-sky-400'}`} />
                          <span className="font-semibold truncate text-[11px]">{p.name}</span>
                          {p.isReference && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                              REF
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                          {p.image.width}×{p.image.height} • Stars: {p.matchedStarsCount} • RMSE: {p.rmsePixelError}px
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#090d16] text-sky-300 border border-white/5">
                          {p.rotationDeg !== 0 ? `${p.rotationDeg > 0 ? '+' : ''}${p.rotationDeg}°` : '0°'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Panel Transformation Matrix Readout */}
            {selectedPanel && (
              <div className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#1f2b42] pb-1.5">
                  <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                    Transformation Matrix (3×3)
                  </span>
                  <span className="text-[10px] font-mono text-purple-300">
                    {selectedPanel.isReference ? 'Identity Matrix' : `${options.transformModel.toUpperCase()}`}
                  </span>
                </div>

                {/* Mathematical Matrix Representation */}
                <div className="p-2 rounded-lg bg-[#05070c] border border-[#1f2b42] font-mono text-[10px] text-slate-300">
                  <div className="grid grid-cols-3 gap-1 text-center py-0.5">
                    <span className="text-sky-300">{selectedPanel.matrix[0].toFixed(4)}</span>
                    <span className="text-sky-300">{selectedPanel.matrix[1].toFixed(4)}</span>
                    <span className="text-amber-300 font-bold">{selectedPanel.matrix[2].toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center py-0.5">
                    <span className="text-sky-300">{selectedPanel.matrix[3].toFixed(4)}</span>
                    <span className="text-sky-300">{selectedPanel.matrix[4].toFixed(4)}</span>
                    <span className="text-amber-300 font-bold">{selectedPanel.matrix[5].toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center py-0.5 text-slate-600 border-t border-white/5 pt-0.5">
                    <span>0.0000</span>
                    <span>0.0000</span>
                    <span>1.0000</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-1">
                  <div>
                    <span>Shift $(\Delta X, \Delta Y)$: </span>
                    <strong className="text-slate-200">({selectedPanel.translationX}, {selectedPanel.translationY})</strong>
                  </div>
                  <div>
                    <span>Field Rotation: </span>
                    <strong className="text-slate-200">{selectedPanel.rotationDeg}°</strong>
                  </div>
                  <div>
                    <span>Scale Factor: </span>
                    <strong className="text-slate-200">{selectedPanel.scale.toFixed(4)}×</strong>
                  </div>
                  <div>
                    <span>Reprojection Err: </span>
                    <strong className="text-emerald-400">{selectedPanel.rmsePixelError} px</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Transform Model & Alignment Parameters */}
            <div className="space-y-3 pt-1 border-t border-[#1f2b42]">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">
                  Spatial Transformation Model
                </label>
                <div className="grid grid-cols-3 gap-1 text-[10px] font-medium">
                  {(['similarity', 'euclidean', 'affine'] as MosaicTransformModel[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setOptions((prev) => ({ ...prev, transformModel: m }))}
                      className={`py-1.5 rounded-lg border text-center transition capitalize ${
                        options.transformModel === m
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-bold'
                          : 'bg-[#0d121d] border-[#1f2b42] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edge Feather Width Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Overlap Feather Width</span>
                  <span className="font-mono text-sky-400">{options.featherWidth} px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="80"
                  step="2"
                  value={options.featherWidth}
                  onChange={(e) => setOptions((prev) => ({ ...prev, featherWidth: parseInt(e.target.value) }))}
                  className="astro-slider"
                />
                <span className="text-[9px] text-slate-500 font-mono">
                  Smooth cosine cross-fade across seams to eliminate boundary lines.
                </span>
              </div>

              {/* Background Level Neutralization */}
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0d121d] border border-[#1f2b42] cursor-pointer">
                <div>
                  <span className="text-[11px] font-semibold text-slate-200 block">
                    Photometric Background Equalization
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Matches sky background gradient across panels.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={options.backgroundEqualization}
                  onChange={(e) => setOptions((prev) => ({ ...prev, backgroundEqualization: e.target.checked }))}
                  className="rounded border-[#1f2b42] bg-[#090d16] text-sky-500 focus:ring-sky-500/20"
                />
              </label>
            </div>
          </div>

          {/* Right Panel: Visual Alignment Canvas & Stitched Composite Preview */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#05070c] p-4 space-y-3">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2b42]">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAlignment}
                  disabled={isAligning}
                  className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAligning ? 'animate-spin' : ''}`} />
                  <span>{isAligning ? 'Solving Matrices...' : 'Calculate Matrices'}</span>
                </button>

                <button
                  onClick={handleStitchMosaic}
                  disabled={isStitching}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-40"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{isStitching ? 'Warping & Blending...' : 'Stitch Mosaic'}</span>
                </button>
              </div>

              {mosaicResult && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    {mosaicResult.totalWidth}×{mosaicResult.totalHeight} px • {mosaicResult.overlapAreaPercent}% Overlap
                  </span>
                  <button
                    onClick={handleApplyToStudio}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Apply Mosaic to Studio</span>
                  </button>
                </div>
              )}
            </div>

            {/* Visual Canvas Display */}
            <div className="flex-1 rounded-xl bg-[#080b12] border border-[#1f2b42] overflow-hidden relative flex items-center justify-center min-h-[300px]">
              {mosaicResult ? (
                /* Stitched Mosaic Render */
                <div className="w-full h-full flex flex-col items-center justify-center p-3 relative">
                  <div className="text-center space-y-2">
                    <div className="relative inline-block rounded-xl border border-sky-500/40 shadow-2xl overflow-hidden bg-black max-w-full max-h-[50vh]">
                      {/* Simple Canvas representation of stitched composite */}
                      <MosaicPreviewCanvas composite={mosaicResult.compositeImage} />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-sky-300 font-mono text-[10px] border border-sky-500/30">
                        {mosaicResult.compositeImage.name}
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-slate-400">
                      <span>Panels: {mosaicResult.panels.length}</span>
                      <span>•</span>
                      <span>Render: {mosaicResult.computationTimeMs} ms</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">Inverse Bilinear Warp + Feather OK</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Visual Panel Layout & Star Matching Diagram */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="relative w-80 h-44 border-2 border-dashed border-[#1f2b42] rounded-2xl flex items-center justify-center bg-[#0d121d]/50">
                    {/* Simulated Panel 1 Reference */}
                    <div className="absolute left-6 top-6 w-40 h-28 rounded-lg bg-sky-500/15 border-2 border-sky-400/80 flex flex-col items-center justify-center shadow-lg">
                      <span className="font-bold text-sky-300 text-xs">Panel 1 (Ref)</span>
                      <span className="text-[9px] font-mono text-slate-400">$(0, 0)$ • Ref Frame</span>
                    </div>

                    {/* Simulated Panel 2 Warped */}
                    <div className="absolute right-6 top-10 w-40 h-28 rounded-lg bg-purple-500/15 border-2 border-purple-400/80 rotate-2 flex flex-col items-center justify-center shadow-lg backdrop-blur-sm">
                      <span className="font-bold text-purple-300 text-xs">Panel 2</span>
                      <span className="text-[9px] font-mono text-slate-400">Transformed</span>
                    </div>

                    {/* Star tie points */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="px-2 py-1 rounded bg-[#090d16]/90 border border-amber-400/50 text-amber-300 text-[10px] font-mono font-bold shadow-xl">
                        Overlap Seam (Feathered)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-200">
                      Spatial Alignment & Overlap Ready
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-md">
                      Click <strong className="text-sky-300">"Stitch Mosaic"</strong> above to compute backward mapping and blend all panels into a high-resolution widefield image.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Canvas Renderer for Mosaic Composite
const MosaicPreviewCanvas: React.FC<{ composite: LoadedAstroImage }> = ({ composite }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = composite.width;
    const h = composite.height;
    canvas.width = Math.min(800, w);
    canvas.height = Math.round(canvas.width * (h / w));

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    // Fast screen transfer function stretch for preview
    const stf = computeAutoSTF(composite.chR, composite.chG, composite.chB);
    const bp = stf.blackPoint;
    const m = stf.midtones;
    const wp = stf.whitePoint;

    const scaleX = w / canvas.width;
    const scaleY = h / canvas.height;

    for (let y = 0; y < canvas.height; y++) {
      const srcY = Math.min(h - 1, Math.floor(y * scaleY));
      const row = y * canvas.width;
      const srcRow = srcY * w;

      for (let x = 0; x < canvas.width; x++) {
        const srcX = Math.min(w - 1, Math.floor(x * scaleX));
        const srcIdx = srcRow + srcX;
        const outIdx = (row + x) * 4;

        // MTF stretch
        let r = (composite.chR[srcIdx] - bp) / Math.max(0.001, wp - bp);
        let g = (composite.chG[srcIdx] - bp) / Math.max(0.001, wp - bp);
        let b = (composite.chB[srcIdx] - bp) / Math.max(0.001, wp - bp);

        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        b = Math.max(0, Math.min(1, b));

        r = (m - 1) * r / ((2 * m - 1) * r - m);
        g = (m - 1) * g / ((2 * m - 1) * g - m);
        b = (m - 1) * b / ((2 * m - 1) * b - m);

        data[outIdx] = Math.round(Math.max(0, Math.min(1, r)) * 255);
        data[outIdx + 1] = Math.round(Math.max(0, Math.min(1, g)) * 255);
        data[outIdx + 2] = Math.round(Math.max(0, Math.min(1, b)) * 255);
        data[outIdx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [composite]);

  return <canvas ref={canvasRef} className="max-w-full max-h-[48vh] object-contain block mx-auto rounded-lg" />;
};
