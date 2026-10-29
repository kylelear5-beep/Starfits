import React, { useEffect, useRef, useState } from 'react';
import { Zap, RotateCcw, BarChart2 } from 'lucide-react';
import { AstroProcessingParams } from '../types/fits';

interface HistogramPanelProps {
  offscreenCanvas: HTMLCanvasElement | null;
  params: AstroProcessingParams;
  onAutoSTF: () => void;
  onResetStretch: () => void;
  onUpdateParams: (newParams: Partial<AstroProcessingParams>) => void;
}

export const HistogramPanel: React.FC<HistogramPanelProps> = ({
  offscreenCanvas,
  params,
  onAutoSTF,
  onResetStretch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logScale, setLogScale] = useState(true);
  const [clipStats, setClipStats] = useState({ shadows: 0, highlights: 0, meanLum: 0 });

  useEffect(() => {
    if (!canvasRef.current || !offscreenCanvas || offscreenCanvas.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width * dpr);
    const h = Math.floor(rect.height * dpr);

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    // Compute histogram from offscreen canvas
    // Sample a subset for 60fps performance
    const offCtx = offscreenCanvas.getContext('2d');
    if (!offCtx) return;

    const imgW = offscreenCanvas.width;
    const imgH = offscreenCanvas.height;
    const sampleStep = Math.max(1, Math.floor((imgW * imgH) / 60000));
    const imgData = offCtx.getImageData(0, 0, imgW, imgH).data;

    const histR = new Uint32Array(256);
    const histG = new Uint32Array(256);
    const histB = new Uint32Array(256);
    const histL = new Uint32Array(256);

    let shadowClipCount = 0;
    let highlightClipCount = 0;
    let totalSamples = 0;
    let sumLum = 0;

    for (let i = 0; i < imgData.length; i += 4 * sampleStep) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      histR[r]++;
      histG[g]++;
      histB[b]++;
      histL[lum]++;

      if (lum === 0) shadowClipCount++;
      if (lum === 255) highlightClipCount++;
      sumLum += lum;
      totalSamples++;
    }

    if (totalSamples > 0) {
      setClipStats({
        shadows: Number(((shadowClipCount / totalSamples) * 100).toFixed(1)),
        highlights: Number(((highlightClipCount / totalSamples) * 100).toFixed(1)),
        meanLum: Number((sumLum / totalSamples / 255).toFixed(3)),
      });
    }

    // Find maximum bin for scaling
    let maxVal = 1;
    for (let i = 0; i < 256; i++) {
      if (histR[i] > maxVal) maxVal = histR[i];
      if (histG[i] > maxVal) maxVal = histG[i];
      if (histB[i] > maxVal) maxVal = histB[i];
    }

    const scaleVal = (val: number) => {
      if (val <= 0) return 0;
      if (logScale) {
        return (Math.log1p(val) / Math.log1p(maxVal)) * (h - 8);
      }
      return (val / maxVal) * (h - 8);
    };

    // Draw background grid lines
    ctx.strokeStyle = '#151d2e';
    ctx.lineWidth = 1 * dpr;
    for (let p = 0.25; p <= 0.75; p += 0.25) {
      const gx = Math.round(p * w);
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.stroke();
    }

    // Draw channels with compositing
    const drawChannel = (hist: Uint32Array, color: string, fillStyle?: string) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255.0) * w;
        const barH = scaleVal(hist[i]);
        const y = h - barH;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);

      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke();
    };

    // Luminance curve (white/gray)
    drawChannel(histL, 'rgba(226, 232, 240, 0.45)', 'rgba(226, 232, 240, 0.05)');
    // Red Channel
    drawChannel(histR, 'rgba(248, 113, 113, 0.8)');
    // Green Channel
    drawChannel(histG, 'rgba(74, 222, 128, 0.8)');
    // Blue Channel
    drawChannel(histB, 'rgba(96, 165, 250, 0.85)');

    // Draw Black Point, Midtone, and White Point indicator lines
    const bpX = params.blackPoint * w;
    const midX = params.midtones * w;
    const wpX = params.whitePoint * w;

    // Black Point Line (Amber)
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([3 * dpr, 2 * dpr]);
    ctx.beginPath();
    ctx.moveTo(bpX, 0);
    ctx.lineTo(bpX, h);
    ctx.stroke();

    // Midtone Stretch Line (Sky Blue)
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(midX, 0);
    ctx.lineTo(midX, h);
    ctx.stroke();

    // White Point Line (Emerald)
    ctx.strokeStyle = '#34d399';
    ctx.beginPath();
    ctx.moveTo(wpX, 0);
    ctx.lineTo(wpX, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [offscreenCanvas, params, logScale]);

  return (
    <div className="p-3 border-b border-[#1f2b42] bg-[#080c14] shrink-0 select-none">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
            Histogram
          </span>
          <button
            onClick={() => setLogScale(!logScale)}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
              logScale ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-[#131b2b] text-slate-400 border border-[#1f2b42]'
            }`}
            title="Toggle Logarithmic Vertical Scale (Essential for deep sky faint nebulosity)"
          >
            {logScale ? 'Log Scale' : 'Linear Scale'}
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onAutoSTF}
            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-gradient-to-r from-sky-500 to-cyan-400 text-slate-950 shadow-sm hover:brightness-110 active:scale-95 transition flex items-center gap-1"
            title="Auto Screen Transfer Function (PixInsight Auto-Stretch algorithm)"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Auto-Stretch</span>
          </button>

          <button
            onClick={onResetStretch}
            className="px-2 py-1 rounded-md text-[11px] font-mono bg-[#131b2b] hover:bg-[#1f2b42] text-slate-300 border border-[#1f2b42] transition flex items-center gap-1"
            title="Reset to raw linear sensor data"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Linear</span>
          </button>
        </div>
      </div>

      {/* Histogram Graph Display */}
      <div className="relative h-22 w-full rounded-lg bg-[#04060a] border border-[#1f2b42] overflow-hidden shadow-inner">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Legend Overlay */}
        <div className="absolute top-1.5 left-2 flex items-center gap-2 text-[9px] font-mono pointer-events-none">
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>R
          </span>
          <span className="flex items-center gap-1 text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>G
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>B
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>Lum
          </span>
        </div>

        {/* Dynamic Clipping Info */}
        <div className="absolute bottom-1 right-2 flex items-center gap-2 text-[9px] font-mono text-slate-400 pointer-events-none">
          <span className={clipStats.shadows > 2 ? 'text-amber-400 font-semibold' : ''}>
            Clip 0: {clipStats.shadows}%
          </span>
          <span className={clipStats.highlights > 1 ? 'text-rose-400 font-semibold' : ''}>
            Clip 255: {clipStats.highlights}%
          </span>
        </div>
      </div>
    </div>
  );
};
