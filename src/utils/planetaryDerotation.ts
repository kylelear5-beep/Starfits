/**
 * Planetary Derotation & Center-of-Mass Registration Engine
 *
 * Implements:
 * 1. Intensity-weighted sub-pixel Center-of-Mass (CoM) centroid detection
 * 2. Sub-pixel translation & bilinear resampling alignment
 * 3. Physical planetary rotational velocity modeling (Jupiter System I/II, Saturn, Mars)
 * 4. Cylindrical longitudinal surface remapping around the polar axis
 * 5. Arithmetic frame averaging for theoretical sqrt(N) SNR enhancement
 */

import { LoadedAstroImage } from '../types/fits';

export interface PlanetaryFrame {
  id: string;
  name: string;
  frameIndex: number;
  timestampSeconds: number; // Offset from start of sequence
  width: number;
  height: number;
  chR: Float32Array;
  chG: Float32Array;
  chB: Float32Array;
  centroidX: number;
  centroidY: number;
  shiftX: number; // Translation applied to match reference
  shiftY: number;
  qualityScore: number; // 0 - 100 based on gradient sharpness
  selected: boolean;
}

export type TargetPlanetType = 'jupiter' | 'saturn' | 'mars' | 'custom';

export interface DerotationConfig {
  targetPlanet: TargetPlanetType;
  rotationPeriodMinutes: number; // Physical rotation period
  totalDurationSeconds: number; // Total capture span across sequence
  polarAxisAngleDeg: number; // Tilt of polar axis relative to vertical (degrees)
  enableDerotation: boolean;
  enableCentroidAlignment: boolean;
  thresholdCutoff: number; // Background cutoff ratio (0.05 - 0.3)
}

export const PLANETARY_PHYSICS: Record<TargetPlanetType, { periodMinutes: number; name: string; defaultPolarTilt: number }> = {
  jupiter: {
    name: 'Jupiter (System I/II)',
    periodMinutes: 595.6, // ~9h 55.6m
    defaultPolarTilt: 3.13,
  },
  saturn: {
    name: 'Saturn',
    periodMinutes: 633.6, // ~10h 33.6m
    defaultPolarTilt: 26.73,
  },
  mars: {
    name: 'Mars',
    periodMinutes: 1477.4, // ~24h 37.4m
    defaultPolarTilt: 25.19,
  },
  custom: {
    name: 'Custom Body',
    periodMinutes: 600.0,
    defaultPolarTilt: 0.0,
  },
};

/**
 * Compute the intensity-weighted sub-pixel center of mass (Centroid) of a planetary disk.
 *
 * Formula:
 * cx = sum(x * I(x,y)) / sum(I(x,y))
 * cy = sum(y * I(x,y)) / sum(I(x,y))
 */
export function computePlanetCentroid(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  width: number,
  height: number,
  thresholdRatio: number = 0.12
): { cx: number; cy: number; radiusEstimate: number; totalIntensity: number } {
  const total = width * height;
  let maxLuminance = 0;

  // 1. Find peak luminance
  for (let i = 0; i < total; i++) {
    const lum = chR[i] * 0.299 + chG[i] * 0.587 + chB[i] * 0.114;
    if (lum > maxLuminance) maxLuminance = lum;
  }

  const threshold = maxLuminance * thresholdRatio;
  let sumWeight = 0;
  let sumX = 0;
  let sumY = 0;
  let pixelCount = 0;

  // 2. Weighted moment calculation
  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x;
      const lum = chR[idx] * 0.299 + chG[idx] * 0.587 + chB[idx] * 0.114;
      if (lum > threshold) {
        // Use non-linear weighting (lum^1.5) to give prominent disk features higher center precision
        const weight = Math.pow(lum - threshold, 1.5);
        sumWeight += weight;
        sumX += x * weight;
        sumY += y * weight;
        pixelCount++;
      }
    }
  }

  if (sumWeight <= 0) {
    return { cx: width / 2, cy: height / 2, radiusEstimate: width * 0.25, totalIntensity: 0 };
  }

  const cx = sumX / sumWeight;
  const cy = sumY / sumWeight;
  // Estimate apparent disk radius from pixel area (Area = pi * r^2)
  const radiusEstimate = Math.sqrt(pixelCount / Math.PI);

  return { cx, cy, radiusEstimate, totalIntensity: sumWeight };
}

/**
 * Compute Sobel gradient sharpness score for a planetary frame
 */
export function computeFrameSharpness(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  width: number,
  height: number
): number {
  let totalGradient = 0;
  let sampleCount = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const idx = y * width + x;
      const lum = chG[idx]; // Green channel has best SNR for planetary detail

      const lumRight = chG[idx + 1];
      const lumDown = chG[idx + width];

      const dx = lumRight - lum;
      const dy = lumDown - lum;
      totalGradient += Math.sqrt(dx * dx + dy * dy);
      sampleCount++;
    }
  }

  return sampleCount > 0 ? (totalGradient / sampleCount) * 1000 : 50;
}

/**
 * Bilinear interpolation translation alignment
 */
export function translateFrameBilinear(
  src: Float32Array,
  width: number,
  height: number,
  shiftX: number,
  shiftY: number
): Float32Array {
  const dst = new Float32Array(width * height);

  for (let y = 0; y < height; y++) {
    const srcY = y - shiftY;
    const y0 = Math.floor(srcY);
    const y1 = y0 + 1;
    const dy = srcY - y0;

    for (let x = 0; x < width; x++) {
      const srcX = x - shiftX;
      const x0 = Math.floor(srcX);
      const x1 = x0 + 1;
      const dx = srcX - x0;

      if (x0 >= 0 && x1 < width && y0 >= 0 && y1 < height) {
        const v00 = src[y0 * width + x0];
        const v10 = src[y0 * width + x1];
        const v01 = src[y1 * width + x0];
        const v11 = src[y1 * width + x1];

        // Bilinear blend
        const top = v00 * (1 - dx) + v10 * dx;
        const bottom = v01 * (1 - dx) + v11 * dx;
        dst[y * width + x] = top * (1 - dy) + bottom * dy;
      } else if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        // Edge nearest neighbor clamp
        const clampedX = Math.min(width - 1, Math.max(0, Math.round(srcX)));
        const clampedY = Math.min(height - 1, Math.max(0, Math.round(srcY)));
        dst[y * width + x] = src[clampedY * width + clampedX];
      } else {
        dst[y * width + x] = 0;
      }
    }
  }

  return dst;
}

/**
 * Physical Planetary Derotation via Longitudinal Remapping
 *
 * For a spherical planetary body spinning at angular speed omega,
 * a surface point at planetary longitude phi and latitude theta projects to:
 * x_proj = R * cos(theta) * sin(phi)
 * y_proj = R * sin(theta)
 *
 * When time advances by deltaT, the longitude rotates by:
 * deltaPhi = omega * deltaT
 *
 * We remap the planetary disc back to reference time t0.
 */
export function derotatePlanetaryChannel(
  src: Float32Array,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  deltaAngleRad: number, // Rotational angle shift in radians
  polarAxisAngleRad: number // Polar tilt in radians
): Float32Array {
  if (Math.abs(deltaAngleRad) < 1e-4) {
    return new Float32Array(src); // No rotation needed
  }

  const dst = new Float32Array(width * height);
  const cosTilt = Math.cos(polarAxisAngleRad);
  const sinTilt = Math.sin(polarAxisAngleRad);
  const rSquared = radius * radius;

  for (let y = 0; y < height; y++) {
    const dy = y - centerY;
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;

      // Rotate coordinates into planet polar reference frame
      const xAligned = dx * cosTilt + dy * sinTilt;
      const yAligned = -dx * sinTilt + dy * cosTilt;

      const distSq = xAligned * xAligned + yAligned * yAligned;
      const dstIdx = y * width + x;

      if (distSq <= rSquared) {
        // Point is on planetary disc
        const normY = yAligned / radius;
        // Cosine of latitude
        const cosLat = Math.sqrt(Math.max(0.001, 1 - normY * normY));
        const normX = xAligned / (radius * cosLat);

        if (Math.abs(normX) <= 1.0) {
          // Current apparent longitude relative to central meridian
          const lon0 = Math.asin(Math.max(-1.0, Math.min(1.0, normX)));
          // Shift backwards by the rotational delta angle to derotate
          const lonSource = lon0 - deltaAngleRad;

          // If the point rotated from around the back limb, fade out smoothly
          if (Math.abs(lonSource) <= Math.PI / 2) {
            const xSourceAligned = radius * cosLat * Math.sin(lonSource);
            const ySourceAligned = yAligned;

            // Rotate back from planet frame to image frame
            const srcDx = xSourceAligned * cosTilt - ySourceAligned * sinTilt;
            const srcDy = xSourceAligned * sinTilt + ySourceAligned * cosTilt;

            const srcX = centerX + srcDx;
            const srcY = centerY + srcDy;

            // Bilinear sampling from source
            const x0 = Math.floor(srcX);
            const y0 = Math.floor(srcY);
            const x1 = x0 + 1;
            const y1 = y0 + 1;
            const fx = srcX - x0;
            const fy = srcY - y0;

            if (x0 >= 0 && x1 < width && y0 >= 0 && y1 < height) {
              const v00 = src[y0 * width + x0];
              const v10 = src[y0 * width + x1];
              const v01 = src[y1 * width + x0];
              const v11 = src[y1 * width + x1];

              const interp = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
              dst[dstIdx] = interp;
              continue;
            }
          }
        }
      }

      // Background pixels outside disk or rotated limb stay as-is
      dst[dstIdx] = src[dstIdx];
    }
  }

  return dst;
}

/**
 * Complete Planetary Derotation & Arithmetic Stacking Pipeline
 */
export function processPlanetarySequence(
  frames: PlanetaryFrame[],
  config: DerotationConfig,
  referenceIndex: number = 0
): {
  masterR: Float32Array;
  masterG: Float32Array;
  masterB: Float32Array;
  alignedFrames: PlanetaryFrame[];
  snrImprovementFactor: number;
  snrdBGain: number;
  framesStackedCount: number;
} {
  const activeFrames = frames.filter((f) => f.selected);
  if (activeFrames.length === 0) {
    throw new Error('No frames selected for stacking');
  }

  const refFrame = activeFrames[referenceIndex] || activeFrames[0];
  const width = refFrame.width;
  const height = refFrame.height;
  const total = width * height;

  // 1. Establish reference center of mass
  const refCentroid = computePlanetCentroid(
    refFrame.chR,
    refFrame.chG,
    refFrame.chB,
    width,
    height,
    config.thresholdCutoff
  );

  const polarTiltRad = (config.polarAxisAngleDeg * Math.PI) / 180;
  // Angular velocity: 2*PI radians per rotation period in seconds
  const periodSeconds = config.rotationPeriodMinutes * 60;
  const omegaRadPerSec = (2 * Math.PI) / periodSeconds;

  const sumR = new Float32Array(total);
  const sumG = new Float32Array(total);
  const sumB = new Float32Array(total);

  const processedFrames: PlanetaryFrame[] = [];

  for (let i = 0; i < activeFrames.length; i++) {
    const frame = activeFrames[i];

    // Sub-pixel centroid
    const centroid = computePlanetCentroid(
      frame.chR,
      frame.chG,
      frame.chB,
      width,
      height,
      config.thresholdCutoff
    );

    let shiftX = 0;
    let shiftY = 0;

    if (config.enableCentroidAlignment) {
      shiftX = refCentroid.cx - centroid.cx;
      shiftY = refCentroid.cy - centroid.cy;
    }

    // Step A: Translate frame to align center of mass
    let alignedR = translateFrameBilinear(frame.chR, width, height, shiftX, shiftY);
    let alignedG = translateFrameBilinear(frame.chG, width, height, shiftX, shiftY);
    let alignedB = translateFrameBilinear(frame.chB, width, height, shiftX, shiftY);

    // Step B: Physical Derotation (Rotational compensation relative to reference frame time)
    if (config.enableDerotation) {
      const timeDeltaSeconds = frame.timestampSeconds - refFrame.timestampSeconds;
      const deltaAngleRad = omegaRadPerSec * timeDeltaSeconds;

      alignedR = derotatePlanetaryChannel(
        alignedR,
        width,
        height,
        refCentroid.cx,
        refCentroid.cy,
        refCentroid.radiusEstimate,
        deltaAngleRad,
        polarTiltRad
      );
      alignedG = derotatePlanetaryChannel(
        alignedG,
        width,
        height,
        refCentroid.cx,
        refCentroid.cy,
        refCentroid.radiusEstimate,
        deltaAngleRad,
        polarTiltRad
      );
      alignedB = derotatePlanetaryChannel(
        alignedB,
        width,
        height,
        refCentroid.cx,
        refCentroid.cy,
        refCentroid.radiusEstimate,
        deltaAngleRad,
        polarTiltRad
      );
    }

    // Step C: Accumulate for Arithmetic Stacking Average
    for (let p = 0; p < total; p++) {
      sumR[p] += alignedR[p];
      sumG[p] += alignedG[p];
      sumB[p] += alignedB[p];
    }

    processedFrames.push({
      ...frame,
      centroidX: centroid.cx,
      centroidY: centroid.cy,
      shiftX,
      shiftY,
    });
  }

  // Step D: Normalized Arithmetic Mean
  const N = activeFrames.length;
  const masterR = new Float32Array(total);
  const masterG = new Float32Array(total);
  const masterB = new Float32Array(total);

  for (let p = 0; p < total; p++) {
    masterR[p] = sumR[p] / N;
    masterG[p] = sumG[p] / N;
    masterB[p] = sumB[p] / N;
  }

  // Signal-to-Noise Ratio (SNR) improvements:
  // For uncorrelated Gaussian/Poisson noise, SNR improves by sqrt(N)
  const snrImprovementFactor = Math.sqrt(N);
  const snrdBGain = 10 * Math.log10(N);

  return {
    masterR,
    masterG,
    masterB,
    alignedFrames: processedFrames,
    snrImprovementFactor,
    snrdBGain,
    framesStackedCount: N,
  };
}

/**
 * Generate a realistic procedural burst sequence of planetary frames
 * with seeing turbulence, centroid jitter, and rotational progression.
 */
export function generatePlanetaryBurst(
  targetPlanet: 'jupiter' | 'saturn',
  frameCount: number = 16,
  durationMinutes: number = 8
): PlanetaryFrame[] {
  const width = 480;
  const height = 480;
  const total = width * height;
  const frames: PlanetaryFrame[] = [];

  const cxBase = width / 2;
  const cyBase = height / 2;
  const radius = targetPlanet === 'jupiter' ? 115 : 75;

  const totalDurationSec = durationMinutes * 60;
  const deltaSec = totalDurationSec / (frameCount - 1);

  // Rotation angular speed
  const periodMin = targetPlanet === 'jupiter' ? 595.6 : 633.6;
  const omegaRadPerSec = (2 * Math.PI) / (periodMin * 60);

  for (let k = 0; k < frameCount; k++) {
    const timeSec = k * deltaSec;
    // Atmospheric seeing jitter displacement (+/- 6.5 pixels)
    const jitterX = Math.sin(k * 1.7) * 4.2 + Math.cos(k * 2.9) * 2.5;
    const jitterY = Math.cos(k * 1.9) * 3.8 + Math.sin(k * 3.1) * 2.1;
    const cx = cxBase + jitterX;
    const cy = cyBase + jitterY;

    // Planetary rotation progression angle
    const rotAngle = omegaRadPerSec * timeSec;

    const chR = new Float32Array(total);
    const chG = new Float32Array(total);
    const chB = new Float32Array(total);

    for (let y = 0; y < height; y++) {
      const dy = y - cy;
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const distSq = dx * dx + dy * dy;
        const idx = y * width + x;

        if (targetPlanet === 'jupiter') {
          if (distSq <= radius * radius) {
            const normY = dy / radius;
            const cosLat = Math.sqrt(Math.max(0.01, 1 - normY * normY));
            const normX = dx / (radius * cosLat);

            if (Math.abs(normX) <= 1.0) {
              const lon = Math.asin(normX) + rotAngle;
              // Jupiter Cloud Belts (North Equatorial Belt, South Equatorial Belt)
              const beltPattern = Math.sin(normY * 11) * 0.16 + Math.cos(normY * 23) * 0.08;
              // Great Red Spot (moves with rotation lon ~ 0.3)
              const grsDist = Math.hypot((lon - 0.3) * 3.5, (normY + 0.32) * 6.5);
              const isGRS = grsDist < 1.0 ? Math.cos(grsDist * Math.PI * 0.5) * 0.42 : 0;

              // Limb Darkening
              const limb = Math.sqrt(Math.max(0, 1 - distSq / (radius * radius)));

              let r = (0.75 + beltPattern * 0.4 + isGRS * 0.6) * limb;
              let g = (0.62 + beltPattern * 0.15 - isGRS * 0.3) * limb;
              let b = (0.48 - beltPattern * 0.25 - isGRS * 0.4) * limb;

              // Atmospheric seeing noise per frame
              const seeingNoise = (Math.random() - 0.5) * 0.08;
              chR[idx] = Math.max(0, Math.min(1, r + seeingNoise));
              chG[idx] = Math.max(0, Math.min(1, g + seeingNoise));
              chB[idx] = Math.max(0, Math.min(1, b + seeingNoise));
            }
          }
        } else {
          // Saturn with rings
          const ringDist = Math.hypot(dx, dy * 2.3);
          const isRing = ringDist > radius * 1.15 && ringDist < radius * 2.15;
          const isCassini = ringDist > radius * 1.58 && ringDist < radius * 1.68;

          if (distSq <= radius * radius) {
            const limb = Math.sqrt(Math.max(0, 1 - distSq / (radius * radius)));
            const belt = Math.sin((dy / radius) * 14) * 0.12;

            let r = (0.78 + belt * 0.3) * limb;
            let g = (0.71 + belt * 0.2) * limb;
            let b = (0.52 - belt * 0.2) * limb;

            const noise = (Math.random() - 0.5) * 0.07;
            chR[idx] = Math.max(0, Math.min(1, r + noise));
            chG[idx] = Math.max(0, Math.min(1, g + noise));
            chB[idx] = Math.max(0, Math.min(1, b + noise));
          } else if (isRing && !isCassini) {
            const ringShade = Math.sin(ringDist * 0.35) * 0.15 + 0.65;
            const noise = (Math.random() - 0.5) * 0.05;
            chR[idx] = Math.max(0, Math.min(1, (ringShade * 0.82 + noise)));
            chG[idx] = Math.max(0, Math.min(1, (ringShade * 0.74 + noise)));
            chB[idx] = Math.max(0, Math.min(1, (ringShade * 0.55 + noise)));
          }
        }
      }
    }

    frames.push({
      id: `frame_${k + 1}`,
      name: `${targetPlanet.toUpperCase()}_burst_sub${(k + 1).toString().padStart(2, '0')}.fits`,
      frameIndex: k + 1,
      timestampSeconds: timeSec,
      width,
      height,
      chR,
      chG,
      chB,
      centroidX: cx,
      centroidY: cy,
      shiftX: 0,
      shiftY: 0,
      qualityScore: 82 + Math.round(Math.sin(k * 0.8) * 12),
      selected: true,
    });
  }

  return frames;
}
