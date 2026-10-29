export interface StarMaskResult {
  mask: Float32Array; // 0.0 = pure nebulosity/background, 1.0 = star
  starPixels: number;
  starPercentage: number;
}

/**
 * Generates an astronomical Star Mask using intensity thresholding,
 * high-frequency spatial discrimination, morphological dilation (growth),
 * and Gaussian/box feathering.
 */
export function generateStarMask(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  w: number,
  h: number,
  threshold: number = 0.2,
  growth: number = 2,
  feather: number = 3
): StarMaskResult {
  const total = w * h;
  const lum = new Float32Array(total);

  // Compute Luminance
  for (let i = 0; i < total; i++) {
    lum[i] = 0.2126 * chR[i] + 0.7152 * chG[i] + 0.0722 * chB[i];
  }

  // 1. Local Background Estimation (radius ~ 4px) to separate compact stars from extended nebulosity
  const bgBlur = new Float32Array(total);
  const rBg = 4;
  
  // Horizontal box blur
  const tempH = new Float32Array(total);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    let count = 0;
    for (let x = -rBg; x <= rBg; x++) {
      if (x >= 0 && x < w) {
        sum += lum[row + x];
        count++;
      }
    }
    for (let x = 0; x < w; x++) {
      tempH[row + x] = sum / count;
      const leftX = x - rBg;
      const rightX = x + rBg + 1;
      if (leftX >= 0) {
        sum -= lum[row + leftX];
        count--;
      }
      if (rightX < w) {
        sum += lum[row + rightX];
        count++;
      }
    }
  }

  // Vertical box blur
  for (let x = 0; x < w; x++) {
    let sum = 0;
    let count = 0;
    for (let y = -rBg; y <= rBg; y++) {
      if (y >= 0 && y < h) {
        sum += tempH[y * w + x];
        count++;
      }
    }
    for (let y = 0; y < h; y++) {
      bgBlur[y * w + x] = sum / count;
      const topY = y - rBg;
      const bottomY = y + rBg + 1;
      if (topY >= 0) {
        sum -= tempH[topY * w + x];
        count--;
      }
      if (bottomY < h) {
        sum += tempH[bottomY * w + x];
        count++;
      }
    }
  }

  // 2. Binary Star Detection via Intensity Threshold & Local Peak Prominence
  const binaryMask = new Uint8Array(total);
  let detectedStarCount = 0;

  for (let i = 0; i < total; i++) {
    const l = lum[i];
    const localDelta = l - bgBlur[i];

    // Star condition:
    // Either very high absolute intensity (bright saturated star core)
    // or strong local point prominence (faint/medium star standing out from background)
    const isPeak = localDelta > threshold * 0.35 && l > threshold * 0.45;
    const isSaturated = l > Math.max(0.7, threshold * 1.5);

    if (isPeak || isSaturated) {
      binaryMask[i] = 1;
      detectedStarCount++;
    }
  }

  // 3. Morphological Dilation (Star Growth)
  // Expands the mask outward so the faint star halo / PSF wings are covered
  const dilatedMask = new Uint8Array(total);
  const growR = Math.max(0, Math.min(8, Math.round(growth)));

  if (growR === 0) {
    dilatedMask.set(binaryMask);
  } else {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (binaryMask[row + x] === 1) {
          // Circular dilation
          for (let dy = -growR; dy <= growR; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            const nRow = ny * w;
            for (let dx = -growR; dx <= growR; dx++) {
              if (dx * dx + dy * dy <= growR * growR) {
                const nx = x + dx;
                if (nx >= 0 && nx < w) {
                  dilatedMask[nRow + nx] = 1;
                }
              }
            }
          }
        }
      }
    }
  }

  // 4. Feathering (Soft Edge Transition via Gaussian / Box Smoothing)
  const finalMask = new Float32Array(total);
  const featherR = Math.max(0, Math.min(10, Math.round(feather)));

  if (featherR === 0) {
    for (let i = 0; i < total; i++) {
      finalMask[i] = dilatedMask[i];
    }
  } else {
    // Two-pass separable smoothing
    const tempF = new Float32Array(total);

    // Horizontal pass
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      let count = 0;
      for (let x = -featherR; x <= featherR; x++) {
        if (x >= 0 && x < w) {
          sum += dilatedMask[row + x];
          count++;
        }
      }
      for (let x = 0; x < w; x++) {
        tempF[row + x] = sum / count;
        const leftX = x - featherR;
        const rightX = x + featherR + 1;
        if (leftX >= 0) {
          sum -= dilatedMask[row + leftX];
          count--;
        }
        if (rightX < w) {
          sum += dilatedMask[row + rightX];
          count++;
        }
      }
    }

    // Vertical pass
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let count = 0;
      for (let y = -featherR; y <= featherR; y++) {
        if (y >= 0 && y < h) {
          sum += tempF[y * w + x];
          count++;
        }
      }
      for (let y = 0; y < h; y++) {
        finalMask[y * w + x] = Math.max(0, Math.min(1, sum / count));
        const topY = y - featherR;
        const bottomY = y + featherR + 1;
        if (topY >= 0) {
          sum -= tempF[topY * w + x];
          count--;
        }
        if (bottomY < h) {
          sum += tempF[bottomY * w + x];
          count++;
        }
      }
    }
  }

  // Calculate coverage stats
  let activeMaskSum = 0;
  for (let i = 0; i < total; i++) {
    activeMaskSum += finalMask[i];
  }

  const starPercentage = Number(((activeMaskSum / total) * 100).toFixed(2));

  return {
    mask: finalMask,
    starPixels: detectedStarCount,
    starPercentage,
  };
}
