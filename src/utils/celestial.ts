/**
 * Astronomical ephemeris and celestial calculations.
 * Calculates Altitude, Azimuth, Moon phase, and visibility for major planets and deep-sky objects.
 */

export interface CelestialTarget {
  id: string;
  name: string;
  type: 'planet' | 'moon' | 'nebula' | 'galaxy' | 'star';
  magnitude: number;
  raHours: number; // RA in decimal hours (0 - 24)
  decDeg: number;  // DEC in decimal degrees (-90 to +90)
  description: string;
  dwarf3Tip?: string;
}

export interface CalculatedTarget extends CelestialTarget {
  altitude: number; // degrees above horizon (-90 to +90)
  azimuth: number;  // degrees clockwise from North (0 to 360)
  compassDirection: string;
  isVisible: boolean;
  visibilityRating: 'Optimal' | 'Good' | 'Low' | 'Below Horizon';
}

// Major visible targets for telescopes
export const CELESTIAL_CATALOG: CelestialTarget[] = [
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'planet',
    magnitude: -2.7,
    raHours: 4.8,
    decDeg: 21.5,
    description: 'Gas giant with distinct dark equatorial cloud belts and four bright Galilean moons.',
    dwarf3Tip: 'Use Dwarf 3 Telephoto, shutter 1/80s - 1/200s, Gain 0, use Planetary Wavelets to reveal Great Red Spot.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'planet',
    magnitude: 0.6,
    raHours: 23.2,
    decDeg: -6.8,
    description: 'Ringed planet displaying Cassini Division, Ring A/B, and Titan.',
    dwarf3Tip: 'Use Dwarf 3 Telephoto with 4x ROI crop, shutter 1/50s, Gain 10, enable ADC (Atmospheric Dispersion Correction).',
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'planet',
    magnitude: -1.2,
    raHours: 8.5,
    decDeg: 23.1,
    description: 'The Red Planet with dark volcanic plains and white polar ice cap.',
    dwarf3Tip: 'Dwarf 3 exposure 1/120s, boost red-orange saturation and contrast for polar caps.',
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'planet',
    magnitude: -4.3,
    raHours: 19.5,
    decDeg: -22.0,
    description: 'Dazzling morning/evening star showing crescent phase.',
    dwarf3Tip: 'High surface brightness! Drop shutter to 1/500s or lower to resolve crescent without flare.',
  },
  {
    id: 'moon',
    name: 'The Moon',
    type: 'moon',
    magnitude: -12.5,
    raHours: 3.2,
    decDeg: 18.5,
    description: 'Lunar crater rims, maria plains, and mountain ranges along the terminator.',
    dwarf3Tip: 'Dwarf 3 Lunar mode: shutter 1/250s, Gain 0, apply Wavelet micro-contrast for crater edges.',
  },
  {
    id: 'm42',
    name: 'M42 Orion Nebula',
    type: 'nebula',
    magnitude: 4.0,
    raHours: 5.58,
    decDeg: -5.39,
    description: 'Brightest diffuse nebula with Trapezium cluster and cosmic dust lanes.',
    dwarf3Tip: 'Dwarf 3 Astro mode: 15s exposures, Gain 60, 45 min stack, use Star Mask to prevent core burnout.',
  },
  {
    id: 'm31',
    name: 'M31 Andromeda Galaxy',
    type: 'galaxy',
    magnitude: 3.4,
    raHours: 0.71,
    decDeg: 41.27,
    description: 'Nearest spiral galaxy with bright stellar core and dust spirals.',
    dwarf3Tip: 'Dwarf 3 Wide or Telephoto: 10s exposures, 60 min stack, use HDR Core Compression.',
  },
  {
    id: 'm45',
    name: 'M45 Pleiades',
    type: 'star',
    magnitude: 1.6,
    raHours: 3.79,
    decDeg: 24.11,
    description: 'Seven Sisters star cluster enveloped in wispy blue reflection nebulosity.',
    dwarf3Tip: 'Dwarf 3: 15s exposures, Gain 40, apply Blue Pedestal trim and Orton Glow.',
  },
];

/**
 * Converts degrees to compass 16-point cardinal direction.
 */
export function degreesToCompass(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

/**
 * Calculates Local Sidereal Time (LST) in hours.
 */
export function calculateLST(date: Date, lonDeg: number): number {
  // Julian Date
  const time = date.getTime();
  const jd = time / 86400000.0 + 2440587.5;
  const d = jd - 2451545.0; // Days since J2000.0

  // Greenwich Mean Sidereal Time in degrees
  let gmst = 280.46061837 + 360.98564736629 * d;
  gmst = ((gmst % 360) + 360) % 360;

  // Local Sidereal Time
  let lstDeg = gmst + lonDeg;
  lstDeg = ((lstDeg % 360) + 360) % 360;

  return lstDeg / 15.0; // Convert to hours
}

/**
 * Computes horizontal coordinates (Altitude and Azimuth) from Equatorial (RA, Dec).
 */
export function equatorialToHorizontal(
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  date: Date = new Date()
): { altitude: number; azimuth: number } {
  const lstHours = calculateLST(date, lonDeg);
  
  // Hour Angle (HA) in degrees
  let haDeg = (lstHours - raHours) * 15.0;
  haDeg = ((haDeg % 360) + 360) % 360;

  const toRad = Math.PI / 180.0;
  const toDeg = 180.0 / Math.PI;

  const haRad = haDeg * toRad;
  const decRad = decDeg * toRad;
  const latRad = latDeg * toRad;

  // Altitude
  const sinAlt = Math.sin(decRad) * Math.sin(latRad) +
                 Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const altDeg = altRad * toDeg;

  // Azimuth
  const cosAlt = Math.cos(altRad);
  let azDeg = 0;

  if (Math.abs(cosAlt) > 1e-6) {
    const cosAz = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * cosAlt);
    const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
    let azCandidate = Math.acos(clampedCosAz) * toDeg;

    if (Math.sin(haRad) > 0) {
      azDeg = 360.0 - azCandidate;
    } else {
      azDeg = azCandidate;
    }
  }

  return {
    altitude: Number(altDeg.toFixed(1)),
    azimuth: Number(azDeg.toFixed(1)),
  };
}

/**
 * Computes all targets for current date and observer coordinates.
 */
export function getVisibleSkyTargets(
  latDeg: number = 34.05,
  lonDeg: number = -118.25,
  date: Date = new Date()
): CalculatedTarget[] {
  return CELESTIAL_CATALOG.map((t) => {
    const { altitude, azimuth } = equatorialToHorizontal(t.raHours, t.decDeg, latDeg, lonDeg, date);
    const compassDirection = degreesToCompass(azimuth);
    const isVisible = altitude > 0;

    let visibilityRating: CalculatedTarget['visibilityRating'] = 'Below Horizon';
    if (altitude > 35) {
      visibilityRating = 'Optimal';
    } else if (altitude > 15) {
      visibilityRating = 'Good';
    } else if (altitude > 0) {
      visibilityRating = 'Low';
    }

    return {
      ...t,
      altitude,
      azimuth,
      compassDirection,
      isVisible,
      visibilityRating,
    };
  }).sort((a, b) => b.altitude - a.altitude);
}

/**
 * Calculates current Moon illumination percentage (0 - 100%) and phase name.
 */
export function getMoonPhase(date: Date = new Date()): {
  phaseFraction: number; // 0.0 (New) to 1.0 (Next New)
  illumination: number;  // 0 to 100%
  phaseName: string;
} {
  // Known New Moon reference: Jan 11, 2024 at 11:57 UTC
  const refTime = new Date('2024-01-11T11:57:00Z').getTime();
  const synodicMonth = 29.53058867 * 86400000; // ms
  const diff = date.getTime() - refTime;
  const phaseFraction = ((diff % synodicMonth) + synodicMonth) % synodicMonth / synodicMonth;

  // Illumination calculation (0% at new, 100% at full)
  const illumination = Math.round(0.5 * (1 - Math.cos(phaseFraction * 2 * Math.PI)) * 100);

  let phaseName = 'New Moon';
  if (phaseFraction < 0.03 || phaseFraction > 0.97) phaseName = 'New Moon';
  else if (phaseFraction < 0.22) phaseName = 'Waxing Crescent';
  else if (phaseFraction < 0.28) phaseName = 'First Quarter';
  else if (phaseFraction < 0.47) phaseName = 'Waxing Gibbous';
  else if (phaseFraction < 0.53) phaseName = 'Full Moon';
  else if (phaseFraction < 0.72) phaseName = 'Waning Gibbous';
  else if (phaseFraction < 0.78) phaseName = 'Last Quarter';
  else phaseName = 'Waning Crescent';

  return { phaseFraction, illumination, phaseName };
}
