import { AstroProcessingParams, DsoRoiParams } from '../types/fits';
import { generateStarMask, StarMaskResult } from './starMask';
import { PlanetaryParams, applyADC, applyPlanetaryWavelets } from './planetaryProcessing';
import { applyDsoRoiEnhancement } from './dsoRoiProcessing';

/**
 * Midtone Transfer Function (MTF)
 * Standard in astronomical image processing (PixInsight, Siril, AstroPixelProcessor).
 */
export function mtf(x: number, m: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (Math.abs(m - 0.5) < 1e-6) return x;
  return ((m - 1.0) * x) / ((2.0 * m - 1.0) * x - m);
}

/**
 * Arcsinh Stretch function.
 * Preserves color balance and chromaticity by stretching luminance while preserving channel ratios.
 */
export function arcsinh(x: number, beta: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return Math.asinh(x * beta) / Math.asinh(beta);
}

/**
 * Generalized Hyperbolic Stretch (GHS) approximation.
 * Provides independent control over stretch point, highlight protection, and shadows.
 */
export function ghs(x: number, b: number = 5.0, c: number = 0.5): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const num = Math.exp(b * (x - c)) - Math.exp(-b * c);
  const den = Math.exp(b * (1 - c)) - Math.exp(-b * c);
  return Math.max(0, Math.min(1, num / den));
}

/**
 * Computes PixInsight-Style Auto-STF parameters from pixel samples.
 * Uses Median and Median Absolute Deviation (MAD) to estimate background noise and floor.
 */
export function computeAutoSTF(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array
): { blackPoint: number; midtones: number; whitePoint: number } {
  // Sample up to 40,000 pixels for fast responsive statistics
  const sampleCount = Math.min(40000, chR.length);
  const step = Math.max(1, Math.floor(chR.length / sampleCount));
  const samples = new Float32Array(sampleCount);

  let validCount = 0;
  for (let i = 0; i < chR.length && validCount < sampleCount; i += step) {
    // Average luminance of pixel
    const lum = 0.2126 * chR[i] + 0.7152 * chG[i] + 0.0722 * chB[i];
    if (!isNaN(lum) && isFinite(lum)) {
      samples[validCount++] = lum;
    }
  }

  const validSamples = samples.subarray(0, validCount);
  validSamples.sort();

  if (validCount === 0) {
    return { blackPoint: 0.02, midtones: 0.08, whitePoint: 1.0 };
  }

  const median = validSamples[Math.floor(validCount / 2)];

  // Compute MAD (Median Absolute Deviation)
  const diffs = new Float32Array(validCount);
  for (let i = 0; i < validCount; i++) {
    diffs[i] = Math.abs(validSamples[i] - median);
  }
  diffs.sort();
  const mad = diffs[Math.floor(validCount / 2)];

  // In astronomical STF:
  // Shadows clipping point is typically Median - 2.8 * (MAD * 1.4826)
  // If median is very low, clip close to median
  const sigma = mad * 1.4826;
  let bp = Math.max(0, median - 2.8 * sigma);
  if (bp >= median) {
    bp = Math.max(0, median * 0.7);
  }

  // Target background is typically 0.15 - 0.25 in 0..1 space
  const targetBg = 0.22;
  const normalizedMedian = Math.max(0.0001, (median - bp) / (1.0 - bp));
  let mid = mtf(targetBg, normalizedMedian);

  // Clamp safely
  bp = Math.max(0.0, Math.min(0.4, Number(bp.toFixed(4))));
  mid = Math.max(0.005, Math.min(0.35, Number(mid.toFixed(4))));
  const wp = 1.0;

  return { blackPoint: bp, midtones: mid, whitePoint: wp };
}

/**
 * Calculates neutral background offsets from an astronomical sample area (e.g. dark sky patch).
 */
export function sampleBackgroundNeutralization(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  w: number,
  h: number,
  centerX: number = 0.1,
  centerY: number = 0.1,
  radius: number = 0.05
): { offsetR: number; offsetG: number; offsetB: number } {
  const cx = Math.floor(centerX * w);
  const cy = Math.floor(centerY * h);
  const r = Math.max(5, Math.floor(radius * Math.min(w, h)));

  let sumR = 0, sumG = 0, sumB = 0, count = 0;

  for (let dy = -r; dy <= r; dy++) {
    const y = cy + dy;
    if (y < 0 || y >= h) continue;
    const rowOff = y * w;
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const x = cx + dx;
        if (x < 0 || x >= w) continue;
        const idx = rowOff + x;
        sumR += chR[idx];
        sumG += chG[idx];
        sumB += chB[idx];
        count++;
      }
    }
  }

  if (count === 0) return { offsetR: 0, offsetG: 0, offsetB: 0 };

  const avgR = sumR / count;
  const avgG = sumG / count;
  const avgB = sumB / count;
  const targetBg = (avgR + avgG + avgB) / 3;

  return {
    offsetR: Number((targetBg - avgR).toFixed(4)),
    offsetG: Number((targetBg - avgG).toFixed(4)),
    offsetB: Number((targetBg - avgB).toFixed(4)),
  };
}

/**
 * High-performance 16-bit Look-Up Table (65536 entries) for the primary stretch curve.
 */
export function buildStretchLUT(params: AstroProcessingParams, rawMode: boolean = false): Float32Array {
  const lut = new Float32Array(65536);
  if (rawMode) {
    for (let i = 0; i < 65536; i++) {
      lut[i] = i / 65535.0;
    }
    return lut;
  }

  const bp = params.blackPoint;
  const wp = Math.max(bp + 0.001, params.whitePoint);
  const mid = params.midtones;
  const hdr = (params.hdrCompress / 100.0) * 0.7;
  const method = params.stretchMethod;
  const beta = params.asinhBeta || 100;
  const invSpan = 1.0 / (wp - bp);

  for (let i = 0; i < 65536; i++) {
    let x = (i / 65535.0 - bp) * invSpan;
    if (x <= 0) {
      lut[i] = 0;
      continue;
    }
    if (x >= 1) {
      x = 1;
    }

    let y = x;
    if (method === 'mtf') {
      y = mtf(x, mid);
    } else if (method === 'asinh') {
      y = arcsinh(x, beta);
    } else if (method === 'ghs') {
      y = ghs(x, 4.0 + (1.0 - mid) * 8.0, mid);
    } else if (method === 'log') {
      y = Math.log1p(x * 10) / Math.log1p(10);
    }

    // Highlight core compression (smooth roll-off in highlights)
    if (hdr > 0 && y > 0.45) {
      const t = (y - 0.45) / 0.55;
      const compressed = (t / (1.0 + hdr * t * 1.8)) * (1.0 + hdr * 0.4);
      y = 0.45 + 0.55 * Math.min(1.0, compressed);
    }

    lut[i] = y < 0 ? 0 : y > 1 ? 1 : y;
  }

  return lut;
}

/**
 * Renders the astronomical image planes onto an offscreen canvas context with full processing.
 */
export function renderAstroToCanvas(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  w: number,
  h: number,
  params: AstroProcessingParams,
  outCanvas: HTMLCanvasElement,
  outCtx: CanvasRenderingContext2D,
  rawMode: boolean = false,
  planetary?: PlanetaryParams,
  dsoRoi?: DsoRoiParams
): void {
  if (outCanvas.width !== w || outCanvas.height !== h) {
    outCanvas.width = w;
    outCanvas.height = h;
  }

  // Atmospheric Dispersion Correction (ADC) for planets (Dwarf 3)
  let activeR = chR;
  let activeG = chG;
  let activeB = chB;

  if (planetary?.enabled && !rawMode) {
    if (
      planetary.adcShiftRX !== 0 ||
      planetary.adcShiftRY !== 0 ||
      planetary.adcShiftBX !== 0 ||
      planetary.adcShiftBY !== 0
    ) {
      const adc = applyADC(
        chR,
        chG,
        chB,
        w,
        h,
        planetary.adcShiftRX,
        planetary.adcShiftRY,
        planetary.adcShiftBX,
        planetary.adcShiftBY
      );
      activeR = adc.r;
      activeG = adc.g;
      activeB = adc.b;
    }
  }

  const imgData = outCtx.createImageData(w, h);
  const out = imgData.data;
  const lut = buildStretchLUT(params, rawMode);

  const offR = rawMode ? 0 : params.offsetR;
  const offG = rawMode ? 0 : params.offsetG;
  const offB = rawMode ? 0 : params.offsetB;
  const scnr = rawMode ? 0 : params.scnrGreen;
  const sat = rawMode ? 1.0 : params.saturation;
  const tempShift = rawMode ? 0 : (params.colorTemp / 100.0) * 0.1;
  const tintShift = rawMode ? 0 : (params.tint / 100.0) * 0.1;

  // Masking variables
  const mEn = !rawMode && params.maskEnabled;
  const mx = params.maskX;
  const my = params.maskY;
  const mRad = params.maskRadius;
  const mFeath = params.maskFeather;
  const mBout = params.maskBlackout;
  const mInv = params.maskInvert;
  const ar = w / h;

  // Star Mask generation (if enabled or view mode is active)
  let starMaskData: Float32Array | null = null;
  const isStarMaskActive = !rawMode && (params.starMaskEnabled || params.starMaskViewMode !== 'composite');
  if (isStarMaskActive) {
    const res = generateStarMask(
      chR,
      chG,
      chB,
      w,
      h,
      params.starMaskThreshold,
      params.starMaskGrowth,
      params.starMaskFeather
    );
    starMaskData = res.mask;
  }

  // Mild stretch LUT for protected stars (prevents bloating & core clipping)
  const starLUT = new Float32Array(65536);
  for (let i = 0; i < 65536; i++) {
    const x = i / 65535.0;
    // Gentle Arcsinh or mild MTF that protects star profiles and color saturation
    starLUT[i] = arcsinh(x, 25.0);
  }

  const starProtStrength = params.starProtectionStrength ?? 0.8;
  const isTargetingNebula = params.starMaskTarget !== 'stars';
  const viewMode = params.starMaskViewMode || 'composite';

  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    const ny = y / h;

    for (let x = 0; x < w; x++) {
      const sIdx = rowOff + x;
      const dIdx = sIdx << 2;

      // Color temperature and tint shift
      let rawRVal = activeR[sIdx] + offR + tempShift;
      let rawGVal = activeG[sIdx] + offG - tintShift;
      let rawBVal = activeB[sIdx] + offB - tempShift;

      // Primary aggressive stretch for nebulosity & deep sky structures
      let r = lut[Math.max(0, Math.min(65535, (rawRVal * 65535) | 0))];
      let g = lut[Math.max(0, Math.min(65535, (rawGVal * 65535) | 0))];
      let b = lut[Math.max(0, Math.min(65535, (rawBVal * 65535) | 0))];

      // Star-protected values (gentle stretch preserving stellar chromaticity and tight PSF)
      if (starMaskData && params.starMaskEnabled && viewMode === 'composite') {
        const starWeight = starMaskData[sIdx] * starProtStrength;

        if (starWeight > 0) {
          const starR = starLUT[Math.max(0, Math.min(65535, (rawRVal * 65535) | 0))];
          const starG = starLUT[Math.max(0, Math.min(65535, (rawGVal * 65535) | 0))];
          const starB = starLUT[Math.max(0, Math.min(65535, (rawBVal * 65535) | 0))];

          if (isTargetingNebula) {
            // Processing adjustments applied to nebulosity, stars shielded
            r = r * (1.0 - starWeight) + starR * starWeight;
            g = g * (1.0 - starWeight) + starG * starWeight;
            b = b * (1.0 - starWeight) + starB * starWeight;
          } else {
            // Adjustments applied exclusively to stars, nebulosity held in gentle baseline
            r = starR * (1.0 - starWeight) + r * starWeight;
            g = starG * (1.0 - starWeight) + g * starWeight;
            b = starB * (1.0 - starWeight) + b * starWeight;
          }
        }
      }

      // SCNR (Selective Color Noise Reduction - green removal)
      if (scnr > 0) {
        const maxNeutralG = 0.5 * (r + b);
        if (g > maxNeutralG) {
          g = g * (1.0 - scnr) + maxNeutralG * scnr;
        }
      }

      // Saturation
      if (sat !== 1.0) {
        const lumVal = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lumVal + (r - lumVal) * sat;
        g = lumVal + (g - lumVal) * sat;
        b = lumVal + (b - lumVal) * sat;
      }

      // Target Isolation Mask
      if (mEn) {
        const dx = (x / w - mx) * ar;
        const dy = ny - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let insideFactor = 1.0;
        if (dist > mRad) {
          if (mFeath > 0 && dist <= mRad + mFeath) {
            insideFactor = 1.0 - (dist - mRad) / mFeath;
          } else {
            insideFactor = 0.0;
          }
        }

        if (mInv) {
          insideFactor = 1.0 - insideFactor;
        }

        const mult = mBout ? insideFactor : 0.15 + 0.85 * insideFactor;
        r *= mult;
        g *= mult;
        b *= mult;
      }

      // Star Mask Inspection Visualizations
      if (starMaskData && !rawMode) {
        if (viewMode === 'mask') {
          // Grayscale mask view: White = stars, Black = nebulosity/sky
          const maskVal = Math.round(starMaskData[sIdx] * 255);
          out[dIdx] = maskVal;
          out[dIdx + 1] = maskVal;
          out[dIdx + 2] = maskVal;
          out[dIdx + 3] = 255;
          continue;
        } else if (viewMode === 'overlay') {
          // Rubylith overlay view: Ruby red highlight over detected stars
          const mVal = starMaskData[sIdx];
          if (mVal > 0.05) {
            r = Math.min(1.0, r * (1.0 - mVal * 0.4) + mVal * 0.9);
            g = Math.max(0.0, g * (1.0 - mVal * 0.8));
            b = Math.min(1.0, b * (1.0 - mVal * 0.5) + mVal * 0.4);
          }
        }
      }

      out[dIdx] = r <= 0 ? 0 : r >= 1 ? 255 : (r * 255 + 0.5) | 0;
      out[dIdx + 1] = g <= 0 ? 0 : g >= 1 ? 255 : (g * 255 + 0.5) | 0;
      out[dIdx + 2] = b <= 0 ? 0 : b >= 1 ? 255 : (b * 255 + 0.5) | 0;
      out[dIdx + 3] = 255;
    }
  }

  outCtx.putImageData(imgData, 0, 0);

  // Starless / Star Reduction Morphological Filter
  if (!rawMode && (params.starless || params.starReduction > 0)) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.drawImage(outCanvas, 0, 0);

      outCtx.save();
      const alpha = params.starless ? 1.0 : params.starReduction;
      outCtx.globalAlpha = alpha;
      outCtx.globalCompositeOperation = 'darken';

      const radius = params.starless ? 2 : 1;
      outCtx.drawImage(tempCanvas, radius, radius);
      outCtx.drawImage(tempCanvas, -radius, -radius);
      outCtx.drawImage(tempCanvas, radius, -radius);
      outCtx.drawImage(tempCanvas, -radius, radius);
      outCtx.drawImage(tempCanvas, radius * 2, 0);
      outCtx.drawImage(tempCanvas, -radius * 2, 0);
      outCtx.drawImage(tempCanvas, 0, radius * 2);
      outCtx.drawImage(tempCanvas, 0, -radius * 2);

      outCtx.restore();
    }
  }

  // Gloss / Orton Glow (ethereal luminous glow for nebulae)
  if (!rawMode && params.gloss > 0) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = w;
    glowCanvas.height = h;
    const gCtx = glowCanvas.getContext('2d');
    if (gCtx) {
      const blurRadius = Math.max(4, Math.floor(w * 0.018));
      gCtx.filter = `blur(${blurRadius}px) brightness(1.2)`;
      gCtx.drawImage(outCanvas, 0, 0);

      outCtx.save();
      outCtx.globalCompositeOperation = 'screen';
      outCtx.globalAlpha = params.gloss / 100.0;
      outCtx.drawImage(glowCanvas, 0, 0);
      outCtx.restore();
    }
  }

  // Wavelet / Unsharp Mask detail enhancer
  if (!rawMode && params.waveletSharp > 0) {
    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = w;
    sharpCanvas.height = h;
    const sCtx = sharpCanvas.getContext('2d');
    if (sCtx) {
      const blurRadius = Math.max(2, Math.floor(w * 0.004));
      sCtx.filter = `blur(${blurRadius}px)`;
      sCtx.drawImage(outCanvas, 0, 0);

      // Extract high frequency detail
      const sharpData = outCtx.getImageData(0, 0, w, h);
      const blurData = sCtx.getImageData(0, 0, w, h);
      const sPix = sharpData.data;
      const bPix = blurData.data;
      const strength = (params.waveletSharp / 100.0) * 0.8;

      for (let i = 0; i < sPix.length; i += 4) {
        sPix[i] = Math.max(0, Math.min(255, sPix[i] + (sPix[i] - bPix[i]) * strength));
        sPix[i + 1] = Math.max(0, Math.min(255, sPix[i + 1] + (sPix[i + 1] - bPix[i + 1]) * strength));
        sPix[i + 2] = Math.max(0, Math.min(255, sPix[i + 2] + (sPix[i + 2] - bPix[i + 2]) * strength));
      }
      outCtx.putImageData(sharpData, 0, 0);
    }
  }

  // Planetary Multi-Layer Wavelets (Dwarf 3 Planetary feature)
  if (!rawMode && planetary?.enabled) {
    if (planetary.waveletFine > 0 || planetary.waveletMedium > 0 || planetary.waveletLarge > 0) {
      const pData = outCtx.getImageData(0, 0, w, h);
      const pix = pData.data;
      const rF = new Float32Array(w * h);
      const gF = new Float32Array(w * h);
      const bF = new Float32Array(w * h);

      for (let i = 0; i < w * h; i++) {
        rF[i] = pix[i * 4] / 255.0;
        gF[i] = pix[i * 4 + 1] / 255.0;
        bF[i] = pix[i * 4 + 2] / 255.0;
      }

      applyPlanetaryWavelets(
        rF,
        gF,
        bF,
        w,
        h,
        planetary.waveletFine / 100.0,
        planetary.waveletMedium / 100.0,
        planetary.waveletLarge / 100.0
      );

      for (let i = 0; i < w * h; i++) {
        pix[i * 4] = Math.round(rF[i] * 255);
        pix[i * 4 + 1] = Math.round(gF[i] * 255);
        pix[i * 4 + 2] = Math.round(bF[i] * 255);
      }
      outCtx.putImageData(pData, 0, 0);
    }
  }

  // DSO ROI Targeted Detail & Core Recovery (Galaxies, Nebulae, Star Clusters)
  if (!rawMode && dsoRoi?.enabled && (dsoRoi.coreHdr > 0 || dsoRoi.detailEnhance > 0)) {
    const roiData = outCtx.getImageData(0, 0, w, h);
    const pix = roiData.data;
    const rF = new Float32Array(w * h);
    const gF = new Float32Array(w * h);
    const bF = new Float32Array(w * h);

    for (let i = 0; i < w * h; i++) {
      rF[i] = pix[i * 4] / 255.0;
      gF[i] = pix[i * 4 + 1] / 255.0;
      bF[i] = pix[i * 4 + 2] / 255.0;
    }

    applyDsoRoiEnhancement(rF, gF, bF, w, h, dsoRoi);

    for (let i = 0; i < w * h; i++) {
      pix[i * 4] = Math.round(rF[i] * 255);
      pix[i * 4 + 1] = Math.round(gF[i] * 255);
      pix[i * 4 + 2] = Math.round(bF[i] * 255);
    }
    outCtx.putImageData(roiData, 0, 0);
  }
}
