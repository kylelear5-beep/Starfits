/**
 * Planetary Image Processing Engine specifically optimized for
 * Dwarf 3 and smart telescopes (150mm telephoto, Sony IMX678 sensor).
 *
 * Solves:
 * 1. Over-exposure / blown-out planetary discs
 * 2. Atmospheric dispersion chromatic fringing (ADC tool)
 * 3. Planetary wavelets for cloud belts and Cassini division
 * 4. Region of Interest (ROI) auto-detection and high-res digital centering
 */

export interface PlanetaryParams {
  enabled: boolean;
  // Atmospheric Dispersion Correction (ADC) channel shifts (in pixels)
  adcShiftRX: number; // -10 to +10 px
  adcShiftRY: number; // -10 to +10 px
  adcShiftBX: number; // -10 to +10 px
  adcShiftBY: number; // -10 to +10 px
  
  // Wavelet Layers (Planetary detail sharpening)
  waveletFine: number;   // 0 - 100% (Cassini division, ring edges, fine storm knots)
  waveletMedium: number; // 0 - 100% (Jupiter equatorial belts, Martian plains)
  waveletLarge: number;  // 0 - 100% (Limb contrast, planet disc spherical shading)

  // Planetary Surface Contrast & Saturation
  diskContrast: number;  // 0 - 100% (extracts faint methane/ammonia bands)
  surfaceSat: number;    // 0 - 200% (brings out Great Red Spot & Saturn hues)
  limbDarkening: number; // 0 - 100% (reduces planetary edge glare/blowout)

  // Region of Interest (ROI) Zoom & Crop
  autoCenterROI: boolean;
  roiZoom: number; // 1 (full), 2 (2x), 4 (4x), 8 (8x)
}

export const DEFAULT_PLANETARY_PARAMS: PlanetaryParams = {
  enabled: false,
  adcShiftRX: 0,
  adcShiftRY: 1, // Common vertical atmospheric dispersion
  adcShiftBX: 0,
  adcShiftBY: -1,
  waveletFine: 35,
  waveletMedium: 25,
  waveletLarge: 15,
  diskContrast: 30,
  surfaceSat: 125,
  limbDarkening: 20,
  autoCenterROI: false,
  roiZoom: 1,
};

/**
 * Finds the brightest planetary centroid (center of mass) in the image.
 */
export function findPlanetCentroid(
  lum: Float32Array,
  w: number,
  h: number
): { cx: number; cy: number; radius: number; peakVal: number } {
  let maxVal = 0;
  for (let i = 0; i < lum.length; i++) {
    if (lum[i] > maxVal) maxVal = lum[i];
  }

  // Threshold at 25% of peak to isolate the planet disk
  const threshold = Math.max(0.1, maxVal * 0.25);
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const v = lum[row + x];
      if (v > threshold) {
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  if (count === 0) {
    return { cx: Math.floor(w / 2), cy: Math.floor(h / 2), radius: 30, peakVal: maxVal };
  }

  const cx = Math.floor(sumX / count);
  const cy = Math.floor(sumY / count);
  const estimatedRadius = Math.max(15, Math.floor(Math.sqrt(count / Math.PI)));

  return { cx, cy, radius: estimatedRadius, peakVal: maxVal };
}

/**
 * Applies Atmospheric Dispersion Correction (ADC) by shifting Red and Blue planes
 * relative to the Green reference plane.
 */
export function applyADC(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  w: number,
  h: number,
  shiftRX: number,
  shiftRY: number,
  shiftBX: number,
  shiftBY: number
): { r: Float32Array; g: Float32Array; b: Float32Array } {
  const total = w * h;
  const newR = new Float32Array(total);
  const newB = new Float32Array(total);

  const srx = Math.round(shiftRX);
  const sry = Math.round(shiftRY);
  const sbx = Math.round(shiftBX);
  const sby = Math.round(shiftBY);

  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const idx = row + x;

      // Sample Red with offset
      const rx = x - srx;
      const ry = y - sry;
      if (rx >= 0 && rx < w && ry >= 0 && ry < h) {
        newR[idx] = chR[ry * w + rx];
      } else {
        newR[idx] = chR[idx];
      }

      // Sample Blue with offset
      const bx = x - sbx;
      const by = y - sby;
      if (bx >= 0 && bx < w && by >= 0 && by < h) {
        newB[idx] = chB[by * w + bx];
      } else {
        newB[idx] = chB[idx];
      }
    }
  }

  return { r: newR, g: chG, b: newB };
}

/**
 * Multi-layer wavelet sharpening tailored for planetary disks.
 */
export function applyPlanetaryWavelets(
  r: Float32Array,
  g: Float32Array,
  b: Float32Array,
  w: number,
  h: number,
  fineWeight: number,   // 0.0 - 1.0
  mediumWeight: number, // 0.0 - 1.0
  largeWeight: number   // 0.0 - 1.0
): void {
  const total = w * h;

  // Simple box blur helper
  const boxBlur = (src: Float32Array, radius: number): Float32Array => {
    const tempH = new Float32Array(total);
    const dest = new Float32Array(total);
    const r = Math.max(1, Math.round(radius));

    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0, count = 0;
      for (let x = -r; x <= r; x++) {
        if (x >= 0 && x < w) { sum += src[row + x]; count++; }
      }
      for (let x = 0; x < w; x++) {
        tempH[row + x] = sum / count;
        if (x - r >= 0) { sum -= src[row + (x - r)]; count--; }
        if (x + r + 1 < w) { sum += src[row + (x + r + 1)]; count++; }
      }
    }

    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let y = -r; y <= r; y++) {
        if (y >= 0 && y < h) { sum += tempH[y * w + x]; count++; }
      }
      for (let y = 0; y < h; y++) {
        dest[y * w + x] = sum / count;
        if (y - r >= 0) { sum -= tempH[(y - r) * w + x]; count--; }
        if (y + r + 1 < h) { sum += tempH[(y + r + 1) * w + x]; count++; }
      }
    }

    return dest;
  };

  // Compute multi-scale wavelet decomposition on Luminance
  const lum = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    lum[i] = 0.2126 * r[i] + 0.7152 * g[i] + 0.0722 * b[i];
  }

  const scale1 = boxBlur(lum, 1.5); // Fine layer
  const scale2 = boxBlur(lum, 3.5); // Medium layer
  const scale3 = boxBlur(lum, 8.0); // Large layer

  // Wavelet detail bands
  for (let i = 0; i < total; i++) {
    const l0 = lum[i];
    const wFine = l0 - scale1[i];
    const wMed = scale1[i] - scale2[i];
    const wLarge = scale2[i] - scale3[i];

    const delta = wFine * (fineWeight * 1.5) +
                  wMed * (mediumWeight * 1.2) +
                  wLarge * (largeWeight * 0.8);

    // Apply sharp delta to channels
    r[i] = Math.max(0, Math.min(1, r[i] + delta));
    g[i] = Math.max(0, Math.min(1, g[i] + delta));
    b[i] = Math.max(0, Math.min(1, b[i] + delta));
  }
}
