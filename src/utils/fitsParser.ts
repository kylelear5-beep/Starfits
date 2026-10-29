import { FitsHeader, FitsHeaderCard, LoadedAstroImage } from '../types/fits';

const BLOCK_SIZE = 2880;
const CARD_SIZE = 80;

/**
 * Parses FITS header blocks (2880 bytes each) until 'END' keyword is reached.
 */
export function parseFitsHeader(buffer: ArrayBuffer): { header: FitsHeader; dataOffset: number } {
  const bytes = new Uint8Array(buffer);
  const textDecoder = new TextDecoder('ascii');
  const cards: FitsHeaderCard[] = [];
  
  let offset = 0;
  let endFound = false;

  while (offset < bytes.length && !endFound) {
    if (offset + BLOCK_SIZE > bytes.length) {
      break;
    }

    for (let c = 0; c < BLOCK_SIZE; c += CARD_SIZE) {
      const cardRaw = textDecoder.decode(bytes.subarray(offset + c, offset + c + CARD_SIZE));
      const key = cardRaw.substring(0, 8).trim();

      if (key === 'END') {
        endFound = true;
        break;
      }

      if (key.length === 0) continue;

      let value: string | number | boolean | null = null;
      let comment = '';

      if (cardRaw.charAt(8) === '=') {
        const rest = cardRaw.substring(9);
        const slashIdx = rest.indexOf('/');
        let valStr = slashIdx !== -1 ? rest.substring(0, slashIdx).trim() : rest.trim();
        comment = slashIdx !== -1 ? rest.substring(slashIdx + 1).trim() : '';

        // Check if string enclosed in quotes
        if (valStr.startsWith("'")) {
          const endQuote = valStr.indexOf("'", 1);
          if (endQuote !== -1) {
            value = valStr.substring(1, endQuote).trim();
          } else {
            value = valStr.replace(/'/g, '').trim();
          }
        } else if (valStr === 'T') {
          value = true;
        } else if (valStr === 'F') {
          value = false;
        } else if (valStr.length > 0) {
          const num = Number(valStr);
          value = isNaN(num) ? valStr : num;
        }
      } else {
        // Comment or history or blank card
        comment = cardRaw.substring(8).trim();
      }

      cards.push({
        key,
        value,
        comment,
        raw: cardRaw,
      });
    }

    offset += BLOCK_SIZE;
  }

  // Find card value helper
  const getVal = (k: string) => cards.find(c => c.key === k)?.value;
  const getStr = (k: string) => {
    const v = getVal(k);
    return typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined;
  };
  const getNum = (k: string, fallback: number = 0) => {
    const v = getVal(k);
    return typeof v === 'number' ? v : fallback;
  };

  const bitpix = getNum('BITPIX', 16);
  const naxis = getNum('NAXIS', 2);
  const naxis1 = getNum('NAXIS1', 0);
  const naxis2 = getNum('NAXIS2', 0);
  const naxis3 = getVal('NAXIS3') !== undefined ? getNum('NAXIS3', 1) : undefined;
  const bzero = getNum('BZERO', 0);
  const bscale = getNum('BSCALE', 1);

  const header: FitsHeader = {
    cards,
    simple: Boolean(getVal('SIMPLE') ?? true),
    bitpix,
    naxis,
    naxis1,
    naxis2,
    naxis3,
    bzero,
    bscale,
    object: getStr('OBJECT'),
    telescop: getStr('TELESCOP') || getStr('TELESCOPE'),
    instrume: getStr('INSTRUME') || getStr('CAMERA'),
    dateObs: getStr('DATE-OBS'),
    exptime: getNum('EXPTIME') || getNum('EXPOSURE'),
    gain: getNum('GAIN'),
    filter: getStr('FILTER'),
    ra: getVal('RA') as string | number | undefined,
    dec: getVal('DEC') as string | number | undefined,
    focalLen: getNum('FOCALLEN'),
    bayerPat: getStr('BAYERPAT') || getStr('COLORTYP'),
  };

  return { header, dataOffset: offset };
}

/**
 * Debayers a single-channel Bayer CFA array (RGGB, BGGR, GBRG, GRBG) into RGB planes.
 */
function debayerCFA(
  raw: Float32Array,
  w: number,
  h: number,
  pattern: string = 'RGGB'
): { r: Float32Array; g: Float32Array; b: Float32Array } {
  const r = new Float32Array(w * h);
  const g = new Float32Array(w * h);
  const b = new Float32Array(w * h);
  const pat = pattern.toUpperCase();

  // Bilinear interpolation debayer
  for (let y = 0; y < h; y++) {
    const yEven = (y % 2) === 0;
    const rowOff = y * w;

    for (let x = 0; x < w; x++) {
      const idx = rowOff + x;
      const xEven = (x % 2) === 0;

      let isR = false, isB = false, isG = false;

      if (pat.includes('BGGR')) {
        isB = yEven && xEven;
        isR = !yEven && !xEven;
        isG = !isB && !isR;
      } else if (pat.includes('GRBG')) {
        isG = (yEven && xEven) || (!yEven && !xEven);
        isR = yEven && !xEven;
        isB = !yEven && xEven;
      } else if (pat.includes('GBRG')) {
        isG = (yEven && xEven) || (!yEven && !xEven);
        isB = yEven && !xEven;
        isR = !yEven && xEven;
      } else {
        // Default RGGB
        isR = yEven && xEven;
        isB = !yEven && !xEven;
        isG = !isR && !isB;
      }

      if (isR) {
        r[idx] = raw[idx];
        // Green from 4-neighbors
        let gSum = 0, gCount = 0;
        if (y > 0) { gSum += raw[idx - w]; gCount++; }
        if (y < h - 1) { gSum += raw[idx + w]; gCount++; }
        if (x > 0) { gSum += raw[idx - 1]; gCount++; }
        if (x < w - 1) { gSum += raw[idx + 1]; gCount++; }
        g[idx] = gCount > 0 ? gSum / gCount : raw[idx];

        // Blue from 4 diagonal neighbors
        let bSum = 0, bCount = 0;
        if (y > 0 && x > 0) { bSum += raw[idx - w - 1]; bCount++; }
        if (y > 0 && x < w - 1) { bSum += raw[idx - w + 1]; bCount++; }
        if (y < h - 1 && x > 0) { bSum += raw[idx + w - 1]; bCount++; }
        if (y < h - 1 && x < w - 1) { bSum += raw[idx + w + 1]; bCount++; }
        b[idx] = bCount > 0 ? bSum / bCount : raw[idx];
      } else if (isB) {
        b[idx] = raw[idx];
        // Green from 4-neighbors
        let gSum = 0, gCount = 0;
        if (y > 0) { gSum += raw[idx - w]; gCount++; }
        if (y < h - 1) { gSum += raw[idx + w]; gCount++; }
        if (x > 0) { gSum += raw[idx - 1]; gCount++; }
        if (x < w - 1) { gSum += raw[idx + 1]; gCount++; }
        g[idx] = gCount > 0 ? gSum / gCount : raw[idx];

        // Red from 4 diagonal neighbors
        let rSum = 0, rCount = 0;
        if (y > 0 && x > 0) { rSum += raw[idx - w - 1]; rCount++; }
        if (y > 0 && x < w - 1) { rSum += raw[idx - w + 1]; rCount++; }
        if (y < h - 1 && x > 0) { rSum += raw[idx + w - 1]; rCount++; }
        if (y < h - 1 && x < w - 1) { rSum += raw[idx + w + 1]; rCount++; }
        r[idx] = rCount > 0 ? rSum / rCount : raw[idx];
      } else {
        // Green pixel
        g[idx] = raw[idx];
        if (yEven) {
          // If in red row, horizontal neighbors are Red, vertical are Blue
          let rSum = 0, rCount = 0;
          if (x > 0) { rSum += raw[idx - 1]; rCount++; }
          if (x < w - 1) { rSum += raw[idx + 1]; rCount++; }
          r[idx] = rCount > 0 ? rSum / rCount : raw[idx];

          let bSum = 0, bCount = 0;
          if (y > 0) { bSum += raw[idx - w]; bCount++; }
          if (y < h - 1) { bSum += raw[idx + w]; bCount++; }
          b[idx] = bCount > 0 ? bSum / bCount : raw[idx];
        } else {
          // In blue row, horizontal are Blue, vertical are Red
          let bSum = 0, bCount = 0;
          if (x > 0) { bSum += raw[idx - 1]; bCount++; }
          if (x < w - 1) { bSum += raw[idx + 1]; bCount++; }
          b[idx] = bCount > 0 ? bSum / bCount : raw[idx];

          let rSum = 0, rCount = 0;
          if (y > 0) { rSum += raw[idx - w]; rCount++; }
          if (y < h - 1) { rSum += raw[idx + w]; rCount++; }
          r[idx] = rCount > 0 ? rSum / rCount : raw[idx];
        }
      }
    }
  }

  return { r, g, b };
}

/**
 * Parses full FITS binary data array into normalized 32-bit float RGB planes.
 */
export function parseFitsData(
  buffer: ArrayBuffer,
  header: FitsHeader,
  dataOffset: number,
  fileName: string = 'capture.fits',
  flipY: boolean = true
): LoadedAstroImage {
  const w = header.naxis1;
  const h = header.naxis2;
  const planes = header.naxis3 || 1;
  const totalPixelsPerPlane = w * h;

  if (w <= 0 || h <= 0) {
    throw new Error(`Invalid FITS dimensions: ${w}x${h}`);
  }

  const dataView = new DataView(buffer, dataOffset);
  const bitpix = header.bitpix;
  const bzero = header.bzero;
  const bscale = header.bscale;

  // Read raw planes as float32
  const rawPlanes: Float32Array[] = [];
  let byteOffset = 0;

  for (let p = 0; p < planes; p++) {
    const planeData = new Float32Array(totalPixelsPerPlane);
    
    for (let i = 0; i < totalPixelsPerPlane; i++) {
      let val = 0;

      if (bitpix === 8) {
        val = dataView.getUint8(byteOffset);
        byteOffset += 1;
      } else if (bitpix === 16) {
        // Big-endian 16-bit signed int
        val = dataView.getInt16(byteOffset, false);
        byteOffset += 2;
      } else if (bitpix === 32) {
        // Big-endian 32-bit signed int
        val = dataView.getInt32(byteOffset, false);
        byteOffset += 4;
      } else if (bitpix === -32) {
        // Big-endian 32-bit float
        val = dataView.getFloat32(byteOffset, false);
        byteOffset += 4;
      } else if (bitpix === -64) {
        // Big-endian 64-bit double
        val = dataView.getFloat64(byteOffset, false);
        byteOffset += 8;
      }

      // Apply BSCALE and BZERO
      val = val * bscale + bzero;
      planeData[i] = val;
    }

    rawPlanes.push(planeData);
  }

  // Compute normalization range across planes
  let globalMin = Infinity;
  let globalMax = -Infinity;

  for (const plane of rawPlanes) {
    const step = Math.max(1, Math.floor(plane.length / 50000));
    for (let i = 0; i < plane.length; i += step) {
      const v = plane[i];
      if (!isNaN(v) && isFinite(v)) {
        if (v < globalMin) globalMin = v;
        if (v > globalMax) globalMax = v;
      }
    }
  }

  if (globalMax <= globalMin) {
    globalMax = globalMin + 1;
  }

  // Normalize to 0.0 .. 1.0
  const normFactor = 1.0 / (globalMax - globalMin);
  for (const plane of rawPlanes) {
    for (let i = 0; i < plane.length; i++) {
      let v = (plane[i] - globalMin) * normFactor;
      if (isNaN(v) || v < 0) v = 0;
      else if (v > 1) v = 1;
      plane[i] = v;
    }
  }

  // Flip Y if requested (standard FITS is bottom-to-top)
  const flipPlane = (src: Float32Array): Float32Array => {
    if (!flipY) return src;
    const dest = new Float32Array(totalPixelsPerPlane);
    for (let y = 0; y < h; y++) {
      const srcRow = (h - 1 - y) * w;
      const destRow = y * w;
      for (let x = 0; x < w; x++) {
        dest[destRow + x] = src[srcRow + x];
      }
    }
    return dest;
  };

  let chR: Float32Array;
  let chG: Float32Array;
  let chB: Float32Array;

  if (planes >= 3) {
    // 3D RGB Cube
    chR = flipPlane(rawPlanes[0]);
    chG = flipPlane(rawPlanes[1]);
    chB = flipPlane(rawPlanes[2]);
  } else if (header.bayerPat) {
    // Debayer OSC Bayer sensor
    const flippedRaw = flipPlane(rawPlanes[0]);
    const debayered = debayerCFA(flippedRaw, w, h, header.bayerPat);
    chR = debayered.r;
    chG = debayered.g;
    chB = debayered.b;
  } else {
    // Monochrome
    const mono = flipPlane(rawPlanes[0]);
    chR = mono;
    chG = mono.slice();
    chB = mono.slice();
  }

  return {
    id: 'fits_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: fileName,
    width: w,
    height: h,
    chR,
    chG,
    chB,
    isFits: true,
    rawHeader: header,
    fileSize: buffer.byteLength,
    sourceType: 'fits',
  };
}
