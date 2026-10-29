export interface FitsHeaderCard {
  key: string;
  value: string | number | boolean | null;
  comment: string;
  raw: string;
}

export interface FitsHeader {
  cards: FitsHeaderCard[];
  simple: boolean;
  bitpix: number;
  naxis: number;
  naxis1: number;
  naxis2: number;
  naxis3?: number;
  bzero: number;
  bscale: number;
  object?: string;
  telescop?: string;
  instrume?: string;
  dateObs?: string;
  exptime?: number;
  gain?: number;
  filter?: string;
  ra?: string | number;
  dec?: string | number;
  focalLen?: number;
  bayerPat?: string;
  comment?: string[];
  history?: string[];
}

export type StretchMethod = 'mtf' | 'asinh' | 'ghs' | 'linear' | 'log';

export interface AstroProcessingParams {
  // Stretch Controls
  stretchMethod: StretchMethod;
  blackPoint: number;    // 0.0 - 0.5
  midtones: number;      // 0.001 - 0.5 (typical 0.05 - 0.15 for deep sky)
  whitePoint: number;    // 0.5 - 1.0
  hdrCompress: number;   // 0.0 - 1.0 (recovers core blowout)
  asinhBeta: number;     // 10.0 - 1000.0 (for arcsinh stretch)

  // Color & Pedestal
  saturation: number;    // 0.0 - 2.5 (1.0 = normal)
  scnrGreen: number;     // 0.0 - 1.0 (green cast removal)
  offsetR: number;       // -0.05 to +0.05
  offsetG: number;       // -0.05 to +0.05
  offsetB: number;       // -0.05 to +0.05
  colorTemp: number;     // -50 to +50 (warm/cool)
  tint: number;          // -50 to +50 (magenta/green)

  // Masking
  maskEnabled: boolean;
  maskX: number;         // 0.0 - 1.0 normalized
  maskY: number;         // 0.0 - 1.0 normalized
  maskRadius: number;    // 0.01 - 0.8 normalized
  maskFeather: number;   // 0.0 - 0.5 normalized
  maskBlackout: boolean; // black out or dim background
  maskInvert: boolean;

  // Effects & Tools
  starless: boolean;
  starReduction: number; // 0.0 - 1.0
  gloss: number;         // 0.0 - 100.0 (Orton glow)
  waveletSharp: number;  // 0.0 - 100.0
  denoise: number;       // 0.0 - 100.0

  // Star Mask & Stellar Protection
  starMaskEnabled: boolean;
  starMaskThreshold: number;       // 0.01 - 0.80 (intensity threshold sensitivity)
  starMaskGrowth: number;          // 0 - 8 px (dilation around star edges/halos)
  starMaskFeather: number;         // 0 - 10 px (soft feathering radius)
  starProtectionStrength: number;  // 0.0 - 1.0 (shields stars from over-stretching)
  starMaskViewMode: 'composite' | 'mask' | 'overlay'; // View modes
  starMaskTarget: 'nebulosity' | 'stars';             // Target adjustment zone
}

export interface LoadedAstroImage {
  id: string;
  name: string;
  width: number;
  height: number;
  chR: Float32Array;
  chG: Float32Array;
  chB: Float32Array;
  isFits: boolean;
  rawHeader?: FitsHeader;
  fileSize?: number;
  sourceType: 'fits' | 'image' | 'sample' | 'cloud';
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  badge?: string;
  params: Partial<AstroProcessingParams>;
}

export type DsoRoiType = 'galaxy' | 'nebula' | 'cluster' | 'planet';

export interface DsoRoiParams {
  enabled: boolean;
  targetType: DsoRoiType;
  zoomLevel: 1 | 2 | 4 | 8;
  centerX: number; // 0.0 - 1.0 normalized
  centerY: number; // 0.0 - 1.0 normalized
  width: number;   // 0.05 - 1.0 normalized
  height: number;  // 0.05 - 1.0 normalized
  showOverlay: boolean;
  autoCentered: boolean;
  coreHdr: number;        // 0 - 100% HDR recovery for blown out cores
  detailEnhance: number;  // 0 - 100% micro-contrast / dust lane / star separation
  detectedLabel?: string;
  detectedConfidence?: number;
}

export const DEFAULT_DSO_ROI_PARAMS: DsoRoiParams = {
  enabled: false,
  targetType: 'galaxy',
  zoomLevel: 1,
  centerX: 0.5,
  centerY: 0.5,
  width: 0.35,
  height: 0.35,
  showOverlay: true,
  autoCentered: false,
  coreHdr: 35,
  detailEnhance: 40,
};

export type DwarfTrackingMode = 
  | 'bird' 
  | 'ufo' 
  | 'plane' 
  | 'animal' 
  | 'car' 
  | 'astro' 
  | 'planet';

export interface DwarfTrackingConfig {
  mode: DwarfTrackingMode;
  label: string;
  badge: string;
  iconName: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  lens: 'tele' | 'wide' | 'dual';
  lensLabel: string;
  shutter: string;
  gain: number;
  slewSpeed: string;
  targetCategory: string;
  sampleId?: string;
  // HUD telemetry simulation
  trackingConfidence: number;
  velocityKmh: number;
  distanceMeters: string;
  pidSensitivity: number; // 1 - 100
  leadPrediction: number; // 0 - 100
}

export interface DwarfTrackingState {
  activeMode: DwarfTrackingMode;
  isLocked: boolean;
  showHud: boolean;
  showLeadVector: boolean;
  activeLens: 'tele' | 'wide';
  pidGain: number;
  leadFactor: number;
  boxX: number; // normalized 0..1
  boxY: number;
  boxW: number;
  boxH: number;
  velocityX: number;
  velocityY: number;
}

// Astronomical Mosaic Spatial Transformation Types
export type MosaicTransformModel = 'translation' | 'euclidean' | 'similarity' | 'affine' | 'homography';

export interface StarMatchPoint {
  refX: number;
  refY: number;
  targetX: number;
  targetY: number;
  errorPx?: number;
}

export interface MosaicPanel {
  id: string;
  name: string;
  image: LoadedAstroImage;
  isReference: boolean;
  matrix: number[]; // 3x3 row-major: [m00, m01, m02, m10, m11, m12, m20, m21, m22]
  rotationDeg: number;
  scale: number;
  translationX: number;
  translationY: number;
  matchedStarsCount: number;
  rmsePixelError: number;
  status: 'ready' | 'aligned' | 'failed';
}

export interface MosaicStitchOptions {
  transformModel: MosaicTransformModel;
  featherWidth: number; // in pixels (e.g. 5 to 120)
  backgroundEqualization: boolean;
  starSensitivity: number; // 0.1 to 1.0
  blendingMode: 'linear' | 'multiresolution' | 'max_snr';
}

export interface MosaicResult {
  compositeImage: LoadedAstroImage;
  panels: MosaicPanel[];
  totalWidth: number;
  totalHeight: number;
  overlapAreaPercent: number;
  computationTimeMs: number;
}

// Star Party Gathering & Live Outreach Types
export interface StarPartyTarget {
  id: string;
  name: string;
  catalog: string;
  constellation: string;
  targetType: 'Planetary' | 'Nebula' | 'Galaxy' | 'Cluster' | 'Double Star' | 'Moon';
  ra: string;
  dec: string;
  magnitude: number;
  distanceLy: string;
  status: 'queued' | 'active' | 'observed' | 'skipped';
  partyNotes: string;
  guestVotes: number;
  requestedBy?: string;
  telescopeExposureSec?: number;
}

export interface StarPartySession {
  partyName: string;
  hostName: string;
  location: string;
  bortle: number;
  attendeeCount: number;
  telescopeModel: string;
  isBroadcasting: boolean;
  broadcastCode: string;
  kioskMode: boolean;
  activeTargetId: string;
}


