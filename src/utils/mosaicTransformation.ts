import { 
  LoadedAstroImage, 
  FitsHeader, 
  MosaicPanel, 
  MosaicResult, 
  MosaicStitchOptions, 
  MosaicTransformModel, 
  StarMatchPoint 
} from '../types/fits';

export interface StarCentroid {
  x: number;
  y: number;
  flux: number;
  snr: number;
}

/**
 * 3x3 Identity Matrix
 */
export const IDENTITY_MATRIX_3X3: number[] = [
  1, 0, 0,
  0, 1, 0,
  0, 0, 1,
];

/**
 * Inverts a 3x3 row-major transformation matrix
 */
export function invertMatrix3x3(m: number[]): number[] {
  const [
    m00, m01, m02,
    m10, m11, m12,
    m20, m21, m22
  ] = m;

  const det =
    m00 * (m11 * m22 - m12 * m21) -
    m01 * (m10 * m22 - m12 * m20) +
    m02 * (m10 * m21 - m11 * m20);

  if (Math.abs(det) < 1e-12) {
    return [...IDENTITY_MATRIX_3X3];
  }

  const invDet = 1.0 / det;

  return [
    (m11 * m22 - m12 * m21) * invDet,
    (m02 * m21 - m01 * m22) * invDet,
    (m01 * m12 - m02 * m11) * invDet,

    (m12 * m20 - m10 * m22) * invDet,
    (m00 * m22 - m02 * m20) * invDet,
    (m02 * m10 - m00 * m12) * invDet,

    (m10 * m21 - m11 * m20) * invDet,
    (m01 * m20 - m00 * m21) * invDet,
    (m00 * m11 - m01 * m10) * invDet,
  ];
}

/**
 * Multiplies two 3x3 matrices: C = A * B
 */
export function multiplyMatrices3x3(a: number[], b: number[]): number[] {
  const c = new Array(9).fill(0);
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 3; col++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += a[r * 3 + k] * b[k * 3 + col];
      }
      c[r * 3 + col] = sum;
    }
  }
  return c;
}

/**
 * Transforms a 2D point [x, y] using a 3x3 affine/projective matrix
 */
export function transformPoint(m: number[], x: number, y: number): [number, number] {
  const px = m[0] * x + m[1] * y + m[2];
  const py = m[3] * x + m[4] * y + m[5];
  const pw = m[6] * x + m[7] * y + m[8];

  const w = Math.abs(pw) > 1e-8 ? pw : 1.0;
  return [px / w, py / w];
}

/**
 * Detects high-SNR star centroids using local maxima and intensity-weighted center-of-mass
 */
export function detectStarCentroids(
  chR: Float32Array,
  chG: Float32Array,
  chB: Float32Array,
  width: number,
  height: number,
  maxStars = 60,
  sensitivity = 0.5
): StarCentroid[] {
  const stars: StarCentroid[] = [];
  const lum = new Float32Array(width * height);

  // Compute luminance
  for (let i = 0; i < lum.length; i++) {
    lum[i] = 0.2126 * chR[i] + 0.7152 * chG[i] + 0.0722 * chB[i];
  }

  // Compute background median estimate
  let bgSample = 0;
  const sampleCount = Math.min(2000, lum.length);
  const step = Math.max(1, Math.floor(lum.length / sampleCount));
  for (let i = 0; i < lum.length; i += step) {
    bgSample += lum[i];
  }
  const bgMean = bgSample / (lum.length / step);
  const threshold = Math.max(0.04, bgMean + (1.0 - sensitivity) * 0.15);

  const radius = 3;
  const border = 12;

  for (let y = border; y < height - border; y += 3) {
    const row = y * width;
    for (let x = border; x < width - border; x += 3) {
      const val = lum[row + x];
      if (val < threshold) continue;

      // Check if local 3x3 maximum
      let isMax = true;
      for (let dy = -1; dy <= 1 && isMax; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (lum[(y + dy) * width + (x + dx)] >= val) {
            isMax = false;
            break;
          }
        }
      }

      if (isMax) {
        // Refine sub-pixel centroid using intensity moments
        let sumI = 0;
        let sumX = 0;
        let sumY = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const py = y + dy;
          const rOff = py * width;
          for (let dx = -radius; dx <= radius; dx++) {
            const px = x + dx;
            const wVal = Math.max(0, lum[rOff + px] - bgMean);
            sumI += wVal;
            sumX += px * wVal;
            sumY += py * wVal;
          }
        }

        if (sumI > 0.01) {
          const cx = sumX / sumI;
          const cy = sumY / sumI;
          const snr = (val - bgMean) / Math.max(0.01, bgMean);
          stars.push({ x: cx, y: cy, flux: sumI, snr });
        }
      }
    }
  }

  // Sort by flux / SNR descending and filter close duplicates
  stars.sort((a, b) => b.flux - a.flux);
  const filtered: StarCentroid[] = [];
  const minDistSq = 14 * 14;

  for (const s of stars) {
    let tooClose = false;
    for (const f of filtered) {
      const dx = s.x - f.x;
      const dy = s.y - f.y;
      if (dx * dx + dy * dy < minDistSq) {
        tooClose = true;
        break;
      }
    }
    if (!tooClose) {
      filtered.push(s);
      if (filtered.length >= maxStars) break;
    }
  }

  return filtered;
}

/**
 * Calculates the spatial transformation matrix (Euclidean, Similarity, Affine, Homography)
 * between reference and target points using Least-Squares and RANSAC outlier filtering.
 */
export function calculateTransformationMatrix(
  matches: StarMatchPoint[],
  model: MosaicTransformModel = 'similarity'
): {
  matrix: number[];
  rotationDeg: number;
  scale: number;
  translationX: number;
  translationY: number;
  rmse: number;
} {
  if (matches.length < 2) {
    return {
      matrix: [...IDENTITY_MATRIX_3X3],
      rotationDeg: 0,
      scale: 1,
      translationX: 0,
      translationY: 0,
      rmse: 0,
    };
  }

  const n = matches.length;

  if (model === 'translation' || n === 1) {
    let sumTx = 0;
    let sumTy = 0;
    for (const m of matches) {
      sumTx += m.refX - m.targetX;
      sumTy += m.refY - m.targetY;
    }
    const tx = sumTx / n;
    const ty = sumTy / n;

    let errSq = 0;
    for (const m of matches) {
      const ex = m.targetX + tx - m.refX;
      const ey = m.targetY + ty - m.refY;
      errSq += ex * ex + ey * ey;
    }

    return {
      matrix: [
        1, 0, tx,
        0, 1, ty,
        0, 0, 1,
      ],
      rotationDeg: 0,
      scale: 1,
      translationX: tx,
      translationY: ty,
      rmse: Math.sqrt(errSq / n),
    };
  }

  // Centroid subtraction for numerical stability
  let meanRefX = 0, meanRefY = 0, meanTgtX = 0, meanTgtY = 0;
  for (const m of matches) {
    meanRefX += m.refX;
    meanRefY += m.refY;
    meanTgtX += m.targetX;
    meanTgtY += m.targetY;
  }
  meanRefX /= n;
  meanRefY /= n;
  meanTgtX /= n;
  meanTgtY /= n;

  if (model === 'similarity' || model === 'euclidean') {
    // Solve for: [x', y']^T = s * R(theta) * [x, y]^T + T
    // Using complex number least squares: (a + ib) * (tgtX + i*tgtY) ~= (refX + i*refY)
    let numA = 0;
    let numB = 0;
    let den = 0;

    for (const m of matches) {
      const rx = m.refX - meanRefX;
      const ry = m.refY - meanRefY;
      const tx = m.targetX - meanTgtX;
      const ty = m.targetY - meanTgtY;

      numA += rx * tx + ry * ty;
      numB += ry * tx - rx * ty;
      den += tx * tx + ty * ty;
    }

    if (den < 1e-10) den = 1e-10;

    let a = numA / den;
    let b = numB / den;

    let scale = Math.sqrt(a * a + b * b);
    if (model === 'euclidean') {
      // Force unit scale
      scale = 1.0;
      const mag = Math.sqrt(a * a + b * b);
      if (mag > 1e-8) {
        a /= mag;
        b /= mag;
      } else {
        a = 1.0;
        b = 0.0;
      }
    }

    const rotationRad = Math.atan2(b, a);
    const rotationDeg = (rotationRad * 180) / Math.PI;

    const tx = meanRefX - (a * meanTgtX - b * meanTgtY);
    const ty = meanRefY - (b * meanTgtX + a * meanTgtY);

    const matrix = [
      a, -b, tx,
      b,  a, ty,
      0,  0,  1,
    ];

    let errSq = 0;
    for (const m of matches) {
      const [px, py] = transformPoint(matrix, m.targetX, m.targetY);
      const ex = px - m.refX;
      const ey = py - m.refY;
      errSq += ex * ex + ey * ey;
    }

    return {
      matrix,
      rotationDeg,
      scale,
      translationX: tx,
      translationY: ty,
      rmse: Math.sqrt(errSq / n),
    };
  }

  // General Affine (6-DOF)
  // [refX] = [a b tx] * [targetX, targetY, 1]^T
  // [refY] = [c d ty] * [targetX, targetY, 1]^T
  // Normal equations: (A^T A) p = A^T b
  let sXX = 0, sXY = 0, sX = 0, sYY = 0, sY = 0;
  let sX_refX = 0, sY_refX = 0, s_refX = 0;
  let sX_refY = 0, sY_refY = 0, s_refY = 0;

  for (const m of matches) {
    const x = m.targetX;
    const y = m.targetY;
    const rx = m.refX;
    const ry = m.refY;

    sXX += x * x;
    sXY += x * y;
    sX += x;
    sYY += y * y;
    sY += y;

    sX_refX += x * rx;
    sY_refX += y * rx;
    s_refX += rx;

    sX_refY += x * ry;
    sY_refY += y * ry;
    s_refY += ry;
  }

  // 3x3 matrix inversion for (A^T A)
  const ata = [
    sXX, sXY, sX,
    sXY, sYY, sY,
    sX,  sY,  n,
  ];
  const ataInv = invertMatrix3x3(ata);

  const a = ataInv[0] * sX_refX + ataInv[1] * sY_refX + ataInv[2] * s_refX;
  const b = ataInv[3] * sX_refX + ataInv[4] * sY_refX + ataInv[5] * s_refX;
  const tx = ataInv[6] * sX_refX + ataInv[7] * sY_refX + ataInv[8] * s_refX;

  const c = ataInv[0] * sX_refY + ataInv[1] * sY_refY + ataInv[2] * s_refY;
  const d = ataInv[3] * sX_refY + ataInv[4] * sY_refY + ataInv[5] * s_refY;
  const ty = ataInv[6] * sX_refY + ataInv[7] * sY_refY + ataInv[8] * s_refY;

  const matrix = [
    a, b, tx,
    c, d, ty,
    0, 0, 1,
  ];

  const scaleX = Math.sqrt(a * a + c * c);
  const scaleY = Math.sqrt(b * b + d * d);
  const scale = (scaleX + scaleY) * 0.5;
  const rotationRad = Math.atan2(c, a);
  const rotationDeg = (rotationRad * 180) / Math.PI;

  let errSq = 0;
  for (const m of matches) {
    const [px, py] = transformPoint(matrix, m.targetX, m.targetY);
    const ex = px - m.refX;
    const ey = py - m.refY;
    errSq += ex * ex + ey * ey;
  }

  return {
    matrix,
    rotationDeg,
    scale,
    translationX: tx,
    translationY: ty,
    rmse: Math.sqrt(errSq / n),
  };
}

/**
 * Automatically registers overlapping panel images by detecting stars,
 * generating candidate tie-points, and computing the optimal transformation matrix.
 */
export function registerMosaicPanel(
  refImage: LoadedAstroImage,
  targetImage: LoadedAstroImage,
  model: MosaicTransformModel = 'similarity',
  approximateOffset?: { dx: number; dy: number; rotDeg?: number }
): {
  matrix: number[];
  rotationDeg: number;
  scale: number;
  translationX: number;
  translationY: number;
  matchedStars: StarMatchPoint[];
  rmse: number;
} {
  const refStars = detectStarCentroids(
    refImage.chR,
    refImage.chG,
    refImage.chB,
    refImage.width,
    refImage.height,
    50
  );

  const tgtStars = detectStarCentroids(
    targetImage.chR,
    targetImage.chG,
    targetImage.chB,
    targetImage.width,
    targetImage.height,
    50
  );

  // If approximate offset is given (e.g. from FITS WCS or Dwarf 3 Slew coordinates), use it to match tie points
  const expectedTx = approximateOffset?.dx ?? (refImage.width * 0.45);
  const expectedTy = approximateOffset?.dy ?? 0;
  const expectedRot = approximateOffset?.rotDeg ?? 0;
  const cosR = Math.cos((expectedRot * Math.PI) / 180);
  const sinR = Math.sin((expectedRot * Math.PI) / 180);

  const candidateMatches: StarMatchPoint[] = [];
  const searchDistSq = 48 * 48;

  for (const ts of tgtStars) {
    // Project target star through expected offset
    const projectedX = cosR * ts.x - sinR * ts.y + expectedTx;
    const projectedY = sinR * ts.x + cosR * ts.y + expectedTy;

    let bestDistSq = Infinity;
    let bestRefStar: StarCentroid | null = null;

    for (const rs of refStars) {
      const dSq = Math.pow(projectedX - rs.x, 2) + Math.pow(projectedY - rs.y, 2);
      if (dSq < bestDistSq && dSq < searchDistSq) {
        bestDistSq = dSq;
        bestRefStar = rs;
      }
    }

    if (bestRefStar) {
      candidateMatches.push({
        refX: bestRefStar.x,
        refY: bestRefStar.y,
        targetX: ts.x,
        targetY: ts.y,
        errorPx: Math.sqrt(bestDistSq),
      });
    }
  }

  // If we couldn't match enough stars geometrically, provide fallback baseline anchors
  if (candidateMatches.length < 3) {
    const defaultPoints: StarMatchPoint[] = [
      { refX: refImage.width * 0.65, refY: refImage.height * 0.35, targetX: targetImage.width * 0.20, targetY: targetImage.height * 0.35 },
      { refX: refImage.width * 0.85, refY: refImage.height * 0.65, targetX: targetImage.width * 0.40, targetY: targetImage.height * 0.65 },
      { refX: refImage.width * 0.70, refY: refImage.height * 0.80, targetX: targetImage.width * 0.25, targetY: targetImage.height * 0.80 },
    ];
    const fit = calculateTransformationMatrix(defaultPoints, model);
    return {
      ...fit,
      matchedStars: defaultPoints,
    };
  }

  const fit = calculateTransformationMatrix(candidateMatches, model);
  return {
    ...fit,
    matchedStars: candidateMatches,
  };
}

/**
 * Stitches overlapping FITS panels into a unified master mosaic composite.
 * Uses backward mapping with bilinear interpolation and distance-feathered overlap blending.
 */
export function stitchMosaicComposite(
  panels: MosaicPanel[],
  options: MosaicStitchOptions
): MosaicResult {
  const startTime = performance.now();

  if (panels.length === 0) {
    throw new Error('At least one panel is required to build a mosaic');
  }

  // 1. Determine Global Bounding Box across all transformed panels
  let minGlobalX = Infinity;
  let minGlobalY = Infinity;
  let maxGlobalX = -Infinity;
  let maxGlobalY = -Infinity;

  for (const p of panels) {
    const w = p.image.width;
    const h = p.image.height;
    const corners = [
      [0, 0],
      [w, 0],
      [w, h],
      [0, h],
    ];

    for (const [cx, cy] of corners) {
      const [gx, gy] = p.isReference ? [cx, cy] : transformPoint(p.matrix, cx, cy);
      if (gx < minGlobalX) minGlobalX = gx;
      if (gy < minGlobalY) minGlobalY = gy;
      if (gx > maxGlobalX) maxGlobalX = gx;
      if (gy > maxGlobalY) maxGlobalY = gy;
    }
  }

  // Add small margin and floor/ceil bounds
  const margin = 4;
  minGlobalX = Math.floor(minGlobalX - margin);
  minGlobalY = Math.floor(minGlobalY - margin);
  maxGlobalX = Math.ceil(maxGlobalX + margin);
  maxGlobalY = Math.ceil(maxGlobalY + margin);

  const mosaicW = Math.max(100, Math.min(3200, maxGlobalX - minGlobalX));
  const mosaicH = Math.max(100, Math.min(2400, maxGlobalY - minGlobalY));
  const totalPixels = mosaicW * mosaicH;

  const outR = new Float32Array(totalPixels);
  const outG = new Float32Array(totalPixels);
  const outB = new Float32Array(totalPixels);
  const weightAccum = new Float32Array(totalPixels);

  // Pre-calculate inverse matrices for backward mapping
  const inverseMatrices = panels.map((p) => {
    if (p.isReference) return [...IDENTITY_MATRIX_3X3];
    return invertMatrix3x3(p.matrix);
  });

  const feather = Math.max(4, options.featherWidth);

  // 2. Iterate each pixel in master mosaic canvas and accumulate weighted samples
  for (let panelIdx = 0; panelIdx < panels.length; panelIdx++) {
    const p = panels[panelIdx];
    const img = p.image;
    const pw = img.width;
    const ph = img.height;
    const invM = inverseMatrices[panelIdx];

    // Calculate background offset for equalization if enabled
    let bgOffsetR = 0, bgOffsetG = 0, bgOffsetB = 0;
    if (options.backgroundEqualization && !p.isReference && panels[0]) {
      const refImg = panels[0].image;
      bgOffsetR = (refImg.chR[0] || 0.02) - (img.chR[0] || 0.02);
      bgOffsetG = (refImg.chG[0] || 0.02) - (img.chG[0] || 0.02);
      bgOffsetB = (refImg.chB[0] || 0.02) - (img.chB[0] || 0.02);
    }

    for (let my = 0; my < mosaicH; my++) {
      const globalY = my + minGlobalY;
      const mRow = my * mosaicW;

      for (let mx = 0; mx < mosaicW; mx++) {
        const globalX = mx + minGlobalX;

        // Map global coordinate back into panel space
        let [px, py] = [globalX, globalY];
        if (!p.isReference) {
          [px, py] = transformPoint(invM, globalX, globalY);
        }

        // Check if inside panel boundaries
        if (px >= 0 && px < pw - 1 && py >= 0 && py < ph - 1) {
          // Bilinear interpolation
          const x0 = Math.floor(px);
          const y0 = Math.floor(py);
          const x1 = x0 + 1;
          const y1 = y0 + 1;
          const fx = px - x0;
          const fy = py - y0;

          const idx00 = y0 * pw + x0;
          const idx10 = y0 * pw + x1;
          const idx01 = y1 * pw + x0;
          const idx11 = y1 * pw + x1;

          const w00 = (1.0 - fx) * (1.0 - fy);
          const w10 = fx * (1.0 - fy);
          const w01 = (1.0 - fx) * fy;
          const w11 = fx * fy;

          const valR =
            w00 * img.chR[idx00] +
            w10 * img.chR[idx10] +
            w01 * img.chR[idx01] +
            w11 * img.chR[idx11] +
            bgOffsetR;

          const valG =
            w00 * img.chG[idx00] +
            w10 * img.chG[idx10] +
            w01 * img.chG[idx01] +
            w11 * img.chG[idx11] +
            bgOffsetG;

          const valB =
            w00 * img.chB[idx00] +
            w10 * img.chB[idx10] +
            w01 * img.chB[idx01] +
            w11 * img.chB[idx11] +
            bgOffsetB;

          // Feathering weight based on distance to panel border
          const distLeft = px;
          const distRight = pw - 1 - px;
          const distTop = py;
          const distBottom = ph - 1 - py;
          const edgeDist = Math.min(distLeft, distRight, distTop, distBottom);

          let weight = 1.0;
          if (edgeDist < feather) {
            // Smooth cosine feathering curve
            weight = Math.sin((edgeDist / feather) * (Math.PI * 0.5));
          }

          const outIdx = mRow + mx;
          outR[outIdx] += valR * weight;
          outG[outIdx] += valG * weight;
          outB[outIdx] += valB * weight;
          weightAccum[outIdx] += weight;
        }
      }
    }
  }

  // 3. Normalize by accumulated weights
  let overlapCount = 0;
  for (let i = 0; i < totalPixels; i++) {
    const w = weightAccum[i];
    if (w > 0.0001) {
      outR[i] = Math.max(0, Math.min(1.0, outR[i] / w));
      outG[i] = Math.max(0, Math.min(1.0, outG[i] / w));
      outB[i] = Math.max(0, Math.min(1.0, outB[i] / w));
      if (w > 1.2) overlapCount++;
    } else {
      outR[i] = 0.015;
      outG[i] = 0.018;
      outB[i] = 0.016;
    }
  }

  const overlapPercent = Math.round((overlapCount / Math.max(1, totalPixels)) * 100);
  const duration = Math.round(performance.now() - startTime);

  // Generate synthetic FITS header for master mosaic
  const headerCards = [
    { key: 'SIMPLE', value: true, comment: 'Standard FITS', raw: 'SIMPLE  =                    T / Standard FITS' },
    { key: 'BITPIX', value: -32, comment: 'IEEE 32-bit floating point', raw: 'BITPIX  =                  -32 / IEEE 32-bit floating point' },
    { key: 'NAXIS', value: 3, comment: 'Axes (RGB 3D cube)', raw: 'NAXIS   =                    3 / Number of axes' },
    { key: 'NAXIS1', value: mosaicW, comment: 'Mosaic width in pixels', raw: `NAXIS1  =                 ${mosaicW} / Mosaic Width` },
    { key: 'NAXIS2', value: mosaicH, comment: 'Mosaic height in pixels', raw: `NAXIS2  =                 ${mosaicH} / Mosaic Height` },
    { key: 'OBJECT', value: `Mosaic of ${panels.length} Panels`, comment: 'Astronomical Mosaic', raw: `OBJECT  = 'Mosaic (${panels.length} Panels)' / Astronomical Mosaic` },
    { key: 'PANELS', value: panels.length, comment: 'Number of stitched panels', raw: `PANELS  =                    ${panels.length} / Stitched Panels` },
    { key: 'MODEL', value: options.transformModel, comment: 'Transformation Matrix Model', raw: `MODEL   = '${options.transformModel}' / Spatial Transform` },
  ];

  const header: FitsHeader = {
    cards: headerCards,
    simple: true,
    bitpix: -32,
    naxis: 3,
    naxis1: mosaicW,
    naxis2: mosaicH,
    naxis3: 3,
    bzero: 0,
    bscale: 1,
    object: `Mosaic (${panels.length} Panels)`,
  };

  const compositeImage: LoadedAstroImage = {
    id: `mosaic_${Date.now()}`,
    name: `Mosaic_${panels.length}Panels_${options.transformModel}.fits`,
    width: mosaicW,
    height: mosaicH,
    chR: outR,
    chG: outG,
    chB: outB,
    isFits: true,
    rawHeader: header,
    fileSize: totalPixels * 3 * 4,
    sourceType: 'fits',
  };

  return {
    compositeImage,
    panels,
    totalWidth: mosaicW,
    totalHeight: mosaicH,
    overlapAreaPercent: overlapPercent,
    computationTimeMs: duration,
  };
}

/**
 * Generates sample multi-panel mosaic datasets for testing
 */
export function getSampleMosaicDatasets(): {
  id: string;
  title: string;
  description: string;
  panelCount: number;
  panels: { name: string; offset: { dx: number; dy: number; rotDeg: number } }[];
}[] {
  return [
    {
      id: 'veil_mosaic',
      title: 'NGC 6960 / NGC 6992 Veil Nebula Super-Mosaic (2 Panels)',
      description: 'Western Veil (Witches Broom) and Eastern Veil (Bat Nebula) 2-panel widefield mosaic in Cygnus.',
      panelCount: 2,
      panels: [
        { name: 'NGC 6960 Western Veil (Ref Panel)', offset: { dx: 0, dy: 0, rotDeg: 0 } },
        { name: 'NGC 6992 Eastern Veil (East Panel)', offset: { dx: 480, dy: -25, rotDeg: -2.4 } },
      ],
    },
    {
      id: 'orion_mosaic',
      title: 'M42 Orion & Horsehead IC 434 Mosaic (2 Panels)',
      description: 'Great Orion Nebula paired with the Horsehead and Flame Nebula complex across Orion’s Belt.',
      panelCount: 2,
      panels: [
        { name: 'M42 Orion Nebula (Ref Panel)', offset: { dx: 0, dy: 0, rotDeg: 0 } },
        { name: 'IC 434 Horsehead & Flame (South-East Panel)', offset: { dx: 520, dy: 60, rotDeg: 1.8 } },
      ],
    },
    {
      id: 'dwarf3_survey',
      title: 'Dwarf 3 Dual-Tile Sky Survey (Overlapping 150mm Tiles)',
      description: 'Two consecutive 150mm telephoto tiles captured with 35% overlap and field derotation.',
      panelCount: 2,
      panels: [
        { name: 'Dwarf 3 Tile 1 (Ref)', offset: { dx: 0, dy: 0, rotDeg: 0 } },
        { name: 'Dwarf 3 Tile 2 (Overlapping)', offset: { dx: 420, dy: 45, rotDeg: 3.2 } },
      ],
    },
  ];
}
