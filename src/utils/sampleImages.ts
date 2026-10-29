import { LoadedAstroImage, FitsHeader } from '../types/fits';

export interface SampleDefinition {
  id: string;
  name: string;
  category: 'Nebula' | 'Galaxy' | 'Supernova' | 'Cluster' | 'Planetary' | 'Bird' | 'UFO' | 'Plane' | 'Animal' | 'Car';
  target: string;
  description: string;
  telescope: string;
  camera: string;
  exposure: string;
  date: string;
  ra: string;
  dec: string;
}

export const SAMPLE_TARGETS: SampleDefinition[] = [
  {
    id: 'm42',
    name: 'M42 Orion Nebula & Trapezium',
    category: 'Nebula',
    target: 'NGC 1976 / Messier 42',
    description: 'Emission and reflection nebula with Trapezium cluster core and dark molecular clouds in Orion.',
    telescope: 'Dwarf II / 150mm Astrograph f/4',
    camera: 'Sony IMX462 Color CMOS',
    exposure: '180 x 15s (45m total)',
    date: '2026-02-14T22:30:00',
    ra: '05h 35m 17s',
    dec: "-05° 23' 28\"",
  },
  {
    id: 'm31',
    name: 'M31 Andromeda Galaxy',
    category: 'Galaxy',
    target: 'Messier 31 / NGC 224',
    description: 'Giant spiral galaxy 2.5 million light-years away with intense stellar nucleus and dust lanes.',
    telescope: 'Seestar S50 / Triplet Apo 50mm',
    camera: 'Sony IMX462 Starvis',
    exposure: '360 x 10s (60m total)',
    date: '2026-10-18T20:15:00',
    ra: '00h 42m 44s',
    dec: "+41° 16' 09\"",
  },
  {
    id: 'veil',
    name: 'NGC 6960 Western Veil Nebula',
    category: 'Supernova',
    target: "Witch's Broom / Veil Remnant",
    description: 'Delicate ionised gas shockwaves from a 10,000-year-old supernova remnant in Cygnus.',
    telescope: 'Askar FRA400 Quintuplet 72mm',
    camera: 'ZWO ASI533MC Pro (-10°C)',
    exposure: '40 x 180s (2.0 hrs)',
    date: '2026-08-12T23:45:00',
    ra: '20h 45m 38s',
    dec: "+30° 42' 30\"",
  },
  {
    id: 'm45',
    name: 'M45 Pleiades & Reflection Nebula',
    category: 'Cluster',
    target: 'Seven Sisters / Messier 45',
    description: 'Open star cluster enveloped by interstellar blue dust reflection nebulosity in Taurus.',
    telescope: 'RedCat 51 Petzval Apo f/4.9',
    camera: 'ZWO ASI2600MC Pro',
    exposure: '50 x 120s (1.6 hrs)',
    date: '2026-11-05T21:10:00',
    ra: '03h 47m 24s',
    dec: "+24° 07' 00\"",
  },
  {
    id: 'jupiter_dwarf3',
    name: 'Jupiter & Belts (Dwarf 3)',
    category: 'Planetary',
    target: 'Jupiter & 3 Galilean Moons',
    description: 'Dwarf 3 telephoto planetary capture with Equatorial Belts, Great Red Spot, and Moons.',
    telescope: 'Dwarflab Dwarf 3 Telephoto 150mm f/4.3',
    camera: 'Sony IMX678 Starvis 2',
    exposure: '1/125s x 1500 frames (Burst Video)',
    date: '2026-10-24T22:45:00',
    ra: '04h 48m 10s',
    dec: "+21° 30' 00\"",
  },
  {
    id: 'saturn_dwarf3',
    name: 'Saturn & Rings (Dwarf 3)',
    category: 'Planetary',
    target: 'Saturn & Cassini Division',
    description: 'Dwarf 3 telephoto capture revealing Ring A, Cassini gap, and planetary globe shadow.',
    telescope: 'Dwarflab Dwarf 3 Telephoto 150mm f/4.3',
    camera: 'Sony IMX678 Starvis 2',
    exposure: '1/60s x 1800 frames (Burst Video)',
    date: '2026-10-22T21:15:00',
    ra: '23h 15m 40s',
    dec: "-06° 50' 00\"",
  },
  {
    id: 'sample_bird',
    name: 'Peregrine Falcon in Flight (Dwarf 3)',
    category: 'Bird',
    target: 'Falco peregrinus',
    description: 'Dwarf 3 AI Avian Tracking lock at 1/1600s with lead prediction and wing-beat motion compensation.',
    telescope: 'Dwarflab Dwarf 3 Telephoto 150mm f/4.3',
    camera: 'Sony IMX678 NPU AI Tracker',
    exposure: '1/1600s, Gain 45',
    date: '2026-10-24T14:22:10',
    ra: 'Az: 142.4°',
    dec: 'El: +38.2°',
  },
  {
    id: 'sample_ufo',
    name: 'High-Speed Luminous UAP Anomaly (Dwarf 3)',
    category: 'UFO',
    target: 'Unidentified Aerial Phenomenon',
    description: 'High-speed sky anomaly track: 840 km/h vector, luminous ionization sheath, 45°/s slew pursuit.',
    telescope: 'Dwarflab Dwarf 3 Dual-Lens (24mm + 150mm)',
    camera: 'Sony IMX678 High-FPS Tracking',
    exposure: '1/3200s, Gain 75',
    date: '2026-10-25T23:18:42',
    ra: 'Az: 218.6°',
    dec: 'El: +54.1°',
  },
  {
    id: 'sample_plane',
    name: 'Boeing 787 Dreamliner at FL350 (Dwarf 3)',
    category: 'Plane',
    target: 'Commercial Jetliner & Contrail',
    description: 'High-altitude aircraft linear tracking with vapor contrail illumination and beacon detection.',
    telescope: 'Dwarflab Dwarf 3 Telephoto 150mm f/4.3',
    camera: 'Sony IMX678 Telephoto Tracking',
    exposure: '1/2000s, Gain 30',
    date: '2026-10-25T17:45:00',
    ra: 'Az: 088.1°',
    dec: 'El: +62.4°',
  },
  {
    id: 'sample_animal',
    name: 'Red Fox in Meadow Twilight (Dwarf 3)',
    category: 'Animal',
    target: 'Vulpes vulpes',
    description: 'Terrestrial wildlife silhouette lock with low-light grass obstacle filtering and smooth gimbal panning.',
    telescope: 'Dwarflab Dwarf 3 Telephoto 150mm f/4.3',
    camera: 'Sony IMX678 Starvis 2 Low-Light',
    exposure: '1/500s, Gain 55',
    date: '2026-10-25T19:10:30',
    ra: 'Az: 312.0°',
    dec: 'El: +04.8°',
  },
  {
    id: 'sample_car',
    name: 'Highway Vehicle Motion Track (Dwarf 3)',
    category: 'Car',
    target: 'Sedan Vehicle (105 km/h)',
    description: 'Wide-angle vehicle chassis tracking with high-contrast edge lock and velocity vector prediction.',
    telescope: 'Dwarflab Dwarf 3 Wide-Angle 24mm f/2.8',
    camera: 'Sony IMX678 Wide View NPU',
    exposure: '1/800s, Gain 40',
    date: '2026-10-25T16:30:15',
    ra: 'Az: 185.3°',
    dec: 'El: +12.0°',
  },
];

/**
 * Creates synthetic high-dynamic-range astronomical linear data for a target.
 * Realistic dynamic range (linear raw data ready to be stretched), PSF stars, and nebular emission.
 */
export function generateSampleDataset(sampleId: string): LoadedAstroImage {
  const sampleDef = SAMPLE_TARGETS.find(s => s.id === sampleId) || SAMPLE_TARGETS[0];
  const w = 1200;
  const h = 800;
  const total = w * h;

  const chR = new Float32Array(total);
  const chG = new Float32Array(total);
  const chB = new Float32Array(total);

  // Seeded pseudo-random generator
  let seed = sampleId === 'm42' ? 42 : sampleId === 'm31' ? 31 : sampleId === 'veil' ? 6960 : 45;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Base sky background with realistic Poisson / Gaussian sensor readout noise
  const baseBgR = 0.015 + rnd() * 0.005;
  const baseBgG = 0.018 + rnd() * 0.005;
  const baseBgB = 0.016 + rnd() * 0.005;

  for (let i = 0; i < total; i++) {
    const noise = (rnd() - 0.5) * 0.004;
    chR[i] = Math.max(0, baseBgR + noise);
    chG[i] = Math.max(0, baseBgG + noise * 1.05);
    chB[i] = Math.max(0, baseBgB + noise * 0.95);
  }

  // Draw astronomical structures
  if (sampleId === 'm42') {
    // Orion Nebula: Central bright trapezium core + rich H-alpha red wings + OIII teal core + dust silhouette
    const cx = w * 0.48;
    const cy = h * 0.52;

    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const d = Math.sqrt(dx * dx * 1.0 + dy * dy * 1.4);
        const angle = Math.atan2(dy, dx);

        // Core bright emission (exponential dynamic range)
        const core = Math.exp(-d / 45.0) * 0.85;
        // Outer billowing gas clouds (H-alpha and OIII)
        const nebStructure = (Math.sin(angle * 3.5 + d * 0.02) * 0.5 + 0.5) * Math.exp(-d / 160.0) * 0.35;
        const outerGlow = Math.exp(-d / 280.0) * 0.12;

        // Dust lane shadow (bay of Orion)
        const dustLane = (Math.sin(angle * 2.0) > 0.4 && d > 35 && d < 120) ? 0.35 : 1.0;

        const totalNeb = (core + nebStructure + outerGlow) * dustLane;

        // Emission spectrum: Strong H-alpha (Red), OIII (Blue/Green)
        chR[row + x] += totalNeb * 1.15;
        chG[row + x] += totalNeb * 0.65 + core * 0.3;
        chB[row + x] += totalNeb * 0.75 + core * 0.35;
      }
    }
  } else if (sampleId === 'm31') {
    // Andromeda Galaxy: Elliptical tilted disk + bright central nucleus + spiral dust lanes
    const cx = w * 0.5;
    const cy = h * 0.5;
    const tilt = -0.55; // radians
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        // Rotated ellipse coordinates
        const rx = dx * cosT - dy * sinT;
        const ry = (dx * sinT + dy * cosT) * 3.0; // Inclination elongation
        const dist = Math.sqrt(rx * rx + ry * ry);

        // Central bulge & nucleus (high dynamic range)
        const nucleus = Math.exp(-dist / 30.0) * 0.9;
        const disk = Math.exp(-dist / 220.0) * 0.28;

        // Spiral dust ring absorption
        const spiralDist = Math.sqrt(rx * rx + ry * ry);
        const spiralPhase = Math.sin(spiralDist * 0.045);
        const dustFactor = (spiralPhase > 0.6 && dist > 50 && dist < 240) ? 0.45 : 1.0;

        const galaxyInt = (nucleus + disk) * dustFactor;

        // Warm yellow-white core, blue star-forming outer spiral arms
        const coreWarmth = Math.exp(-dist / 60.0);
        chR[row + x] += galaxyInt * (0.95 + coreWarmth * 0.25);
        chG[row + x] += galaxyInt * (0.85 + coreWarmth * 0.15);
        chB[row + x] += galaxyInt * (0.75 + (1 - coreWarmth) * 0.25);
      }
    }
  } else if (sampleId === 'veil') {
    // Veil Nebula: Filamentary shockwaves across Cygnus
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const curveX = w * 0.42 + Math.sin(y * 0.008) * 85 + Math.sin(y * 0.03) * 20;
        const distToFilament = Math.abs(x - curveX);

        // Multiple thin filaments
        const filament1 = Math.exp(-distToFilament / 12.0) * 0.32;
        const filament2 = Math.exp(-Math.abs(x - (curveX + 35)) / 8.0) * 0.22;
        const gasSheath = Math.exp(-distToFilament / 70.0) * 0.08;

        const filamentInt = filament1 + filament2 + gasSheath;

        // Shockwave colors: Red H-alpha on one side, Teal OIII on shockfront
        chR[row + x] += filamentInt * 0.95;
        chG[row + x] += filamentInt * 0.72;
        chB[row + x] += filamentInt * 0.88;
      }
    }
  } else if (sampleId === 'm45') {
    // Pleiades: Brilliant blue stars + wispy gossamer reflection nebulosity
    const clusterStars = [
      { x: w * 0.48, y: h * 0.42, r: 80 }, // Alcyone
      { x: w * 0.38, y: h * 0.38, r: 60 }, // Electra
      { x: w * 0.58, y: h * 0.45, r: 65 }, // Atlas
      { x: w * 0.55, y: h * 0.32, r: 55 }, // Maia
      { x: w * 0.42, y: h * 0.58, r: 50 }, // Merope
      { x: w * 0.62, y: h * 0.35, r: 45 }, // Pleione
      { x: w * 0.32, y: h * 0.52, r: 40 }, // Taygeta
    ];

    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let nebTotal = 0;
        for (const s of clusterStars) {
          const dx = x - s.x;
          const dy = y - s.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          nebTotal += Math.exp(-d / s.r) * 0.14;
        }

        // Reflection nebula is predominantly vivid sky blue
        chR[row + x] += nebTotal * 0.45;
        chG[row + x] += nebTotal * 0.75;
        chB[row + x] += nebTotal * 1.15;
      }
    }
  } else if (sampleId === 'jupiter_dwarf3') {
    // Jupiter: Oblate disk + alternating cloud belts + Great Red Spot + atmospheric dispersion
    const cx = w * 0.5;
    const cy = h * 0.5;
    const radX = 52.0; // Equatorial radius
    const radY = 48.0; // Polar flattening (oblate spheroid)

    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const normDistSq = (dx * dx) / (radX * radX) + (dy * dy) / (radY * radY);

        if (normDistSq <= 1.0) {
          const normDist = Math.sqrt(normDistSq);
          // Limb darkening: sphere shading cos(theta)
          const cosTheta = Math.sqrt(Math.max(0, 1.0 - normDistSq));
          const limb = Math.pow(cosTheta, 0.4);

          // Atmospheric Cloud Belts: North & South Equatorial Belts (NEB, SEB)
          const lat = dy / radY; // -1 to +1
          const beltPattern = Math.sin(lat * Math.PI * 4.2);
          const isDarkBelt = beltPattern > 0.15;

          // Great Red Spot at approx lat ~ -0.35, lon offset
          const grsDist = Math.sqrt(Math.pow((dx - 18) / 10.0, 2) + Math.pow((dy + 16) / 6.0, 2));
          const isGRS = grsDist < 1.0;

          let rBase = 0.88, gBase = 0.82, bBase = 0.72;
          if (isGRS) {
            rBase = 0.95; gBase = 0.45; bBase = 0.35; // Distinct terracotta red
          } else if (isDarkBelt) {
            rBase = 0.75; gBase = 0.62; bBase = 0.48; // Ochre brownish belts
          }

          // Subtle atmospheric turbulence
          const turbulence = Math.sin(dx * 0.18 + dy * 0.1) * 0.03;

          // Atmospheric dispersion: red top edge, blue bottom edge
          const adcOffsetR = (dy / radY) * 0.05;
          const adcOffsetB = -(dy / radY) * 0.05;

          chR[row + x] = Math.min(1.0, (rBase + turbulence + adcOffsetR) * limb * 0.9);
          chG[row + x] = Math.min(1.0, (gBase + turbulence) * limb * 0.9);
          chB[row + x] = Math.min(1.0, (bBase + turbulence + adcOffsetB) * limb * 0.9);
        }
      }
    }

    // Add Galilean Moons (Io, Europa, Ganymede)
    const moons = [
      { x: cx - 180, y: cy + 12, b: 0.85 }, // Callisto
      { x: cx - 95, y: cy + 6, b: 0.9 },   // Io
      { x: cx + 115, y: cy - 8, b: 0.95 },  // Europa
      { x: cx + 220, y: cy - 14, b: 0.9 },  // Ganymede
    ];
    for (const m of moons) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const idx = (Math.floor(m.y) + dy) * w + (Math.floor(m.x) + dx);
          if (idx >= 0 && idx < total) {
            const d = Math.sqrt(dx * dx + dy * dy);
            const val = Math.exp(-d / 1.0) * m.b;
            chR[idx] += val; chG[idx] += val * 0.95; chB[idx] += val * 0.85;
          }
        }
      }
    }
  } else if (sampleId === 'saturn_dwarf3') {
    // Saturn: Planet globe + Ring A, Cassini Division, Ring B + Globe Shadow
    const cx = w * 0.5;
    const cy = h * 0.5;
    const globeRad = 36.0;
    const tilt = 0.38; // Ring tilt radians
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);

    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;

        // Rotated coordinates for rings
        const rx = dx * cosT - dy * sinT;
        const ry = (dx * sinT + dy * cosT) * 2.8; // Foreshortened ring plane
        const rDist = Math.sqrt(rx * rx + ry * ry);

        // Globe sphere distance
        const globeDist = Math.sqrt(dx * dx + dy * dy);
        const inGlobe = globeDist <= globeRad;

        // Ring distance boundaries
        // Ring B: 48 - 68
        // Cassini Division: 68 - 72
        // Ring A: 72 - 88
        const inRingB = rDist >= 46 && rDist < 68;
        const inCassini = rDist >= 68 && rDist < 72;
        const inRingA = rDist >= 72 && rDist <= 88;

        let rVal = 0, gVal = 0, bVal = 0;

        if (inGlobe) {
          const cosTheta = Math.sqrt(Math.max(0, 1.0 - (globeDist / globeRad)));
          const limb = Math.pow(cosTheta, 0.45);
          // Subtle polar cap & temperate cloud bands
          const band = Math.sin((dy / globeRad) * Math.PI * 3.0) * 0.04;
          rVal = (0.86 + band) * limb;
          gVal = (0.78 + band) * limb;
          bVal = (0.60 + band) * limb;
        }

        // Composite Ring system (with Cassini Division gap)
        if (inRingB || inRingA) {
          const ringBrightness = inRingB ? 0.82 : 0.65;
          // Globe shadow cast across back of rings
          const inShadow = dx > 8 && dy < -10 && dy > -30;
          const shadowFactor = inShadow ? 0.15 : 1.0;

          const rRing = 0.88 * ringBrightness * shadowFactor;
          const gRing = 0.80 * ringBrightness * shadowFactor;
          const bRing = 0.62 * ringBrightness * shadowFactor;

          if (inGlobe && dy > 0) {
            // Front ring passes in front of southern hemisphere
            rVal = rRing; gVal = gRing; bVal = bRing;
          } else if (!inGlobe) {
            rVal = rRing; gVal = gRing; bVal = bRing;
          }
        }

        if (rVal > 0) {
          chR[row + x] = Math.min(1.0, rVal);
          chG[row + x] = Math.min(1.0, gVal);
          chB[row + x] = Math.min(1.0, bVal);
        }
      }
    }
  } else if (sampleId === 'sample_bird') {
    // Peregrine Falcon in high-velocity flight against sky
    const cx = w * 0.5;
    const cy = h * 0.46;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      const skyGrad = 0.12 + (y / h) * 0.22; // Twilight blue sky gradient
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        chR[row + x] = skyGrad * 0.45;
        chG[row + x] = skyGrad * 0.65;
        chB[row + x] = skyGrad * 0.95;

        // Fuselage / body
        const bodyDist = (dx * dx) / 120.0 + (dy * dy) / 480.0;
        // Swept wings: W-shape falcon wingspan
        const wingSpan = Math.abs(dx);
        const wingCurve = dy + Math.pow(wingSpan * 0.045, 1.6) * 14.0;
        const inWing = wingSpan < 160 && Math.abs(wingCurve) < (18 - wingSpan * 0.08);

        if (bodyDist < 1.0 || inWing) {
          const featherTexture = Math.sin(dx * 0.8 + dy * 0.6) * 0.06;
          const underwingLight = dy > 0 ? 0.15 : 0.0;
          chR[row + x] = 0.28 + featherTexture + underwingLight;
          chG[row + x] = 0.24 + featherTexture + underwingLight;
          chB[row + x] = 0.20 + featherTexture * 0.8;
        }
      }
    }
  } else if (sampleId === 'sample_ufo') {
    // UFO / UAP: High-speed luminous anomaly with ionization halo and pulse vector
    const cx = w * 0.52;
    const cy = h * 0.48;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        // Motion trail vector (trailing to the lower-left)
        const trailX = dx + 0.6 * dy;
        const trailDist = Math.abs(dy - dx * 0.35);
        if (dx < 0 && Math.abs(dx) < 180 && trailDist < 16) {
          const falloff = Math.exp(-Math.abs(dx) / 50.0);
          chR[row + x] += 0.45 * falloff;
          chG[row + x] += 0.25 * falloff;
          chB[row + x] += 0.85 * falloff;
        }

        // Elliptical plasma sheath
        const ellipse = (dx * dx) / 900.0 + (dy * dy) / 320.0;
        if (ellipse <= 1.0) {
          const coreIntensity = Math.exp(-ellipse * 2.5);
          chR[row + x] = Math.min(1.0, chR[row + x] + 0.95 * coreIntensity);
          chG[row + x] = Math.min(1.0, chG[row + x] + 0.85 * coreIntensity);
          chB[row + x] = Math.min(1.0, chB[row + x] + 1.0 * coreIntensity);
        } else if (ellipse < 3.8) {
          const halo = Math.exp(-(ellipse - 1.0) * 1.2) * 0.45;
          chR[row + x] += 0.35 * halo;
          chG[row + x] += 0.15 * halo;
          chB[row + x] += 0.75 * halo;
        }
      }
    }
  } else if (sampleId === 'sample_plane') {
    // Boeing 787 at FL350: Silhouette + dual vapor contrails illuminated by setting sun
    const cx = w * 0.5;
    const cy = h * 0.45;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      const sky = 0.15 + (1.0 - y / h) * 0.2;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        chR[row + x] = sky * 0.55;
        chG[row + x] = sky * 0.7;
        chB[row + x] = sky * 0.95;

        // Vapor contrails (trailing to the left)
        if (dx < -25) {
          const trailDist1 = Math.abs(dy - 12);
          const trailDist2 = Math.abs(dy + 12);
          const expand = Math.max(4, Math.abs(dx) * 0.08);
          if (trailDist1 < expand || trailDist2 < expand) {
            const cAlpha = Math.exp(-Math.min(trailDist1, trailDist2) / (expand * 0.6)) * 0.55;
            chR[row + x] += cAlpha * 0.92;
            chG[row + x] += cAlpha * 0.85;
            chB[row + x] += cAlpha * 0.78;
          }
        }

        // Aircraft fuselage & swept wings
        const fuseDist = (dx * dx) / 1600.0 + (dy * dy) / 100.0;
        const wingDist = Math.abs(dx * 0.4 + dy);
        const inSweptWing = Math.abs(dy) < 85 && wingDist < 14 && dx > -40 && dx < 30;

        if (fuseDist <= 1.0 || inSweptWing) {
          chR[row + x] = 0.85;
          chG[row + x] = 0.85;
          chB[row + x] = 0.88;
        }
      }
    }
  } else if (sampleId === 'sample_animal') {
    // Red Fox in evening meadow foliage
    const cx = w * 0.5;
    const cy = h * 0.52;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const foliage = y > h * 0.55 ? 0.2 + Math.sin(x * 0.15 + y * 0.1) * 0.05 : 0.1;
        // Meadow background
        chR[row + x] = foliage * 0.6;
        chG[row + x] = foliage * 0.85;
        chB[row + x] = foliage * 0.35;

        // Fox body & brush tail
        const bodyDist = (dx * dx) / 3600.0 + (dy * dy) / 1400.0;
        const tailDist = ((dx + 80) * (dx + 80)) / 1800.0 + ((dy - 20) * (dy - 20)) / 500.0;
        const headDist = ((dx - 65) * (dx - 65)) / 600.0 + ((dy + 25) * (dy + 25)) / 600.0;

        if (bodyDist <= 1.0 || tailDist <= 1.0 || headDist <= 1.0) {
          const fur = Math.sin(dx * 0.4 + dy * 0.3) * 0.08;
          chR[row + x] = 0.78 + fur;
          chG[row + x] = 0.38 + fur * 0.5;
          chB[row + x] = 0.14;
        }
      }
    }
  } else if (sampleId === 'sample_car') {
    // Sedan vehicle on road with lane markings
    const cx = w * 0.5;
    const cy = h * 0.55;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      const dy = y - cy;
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        // Asphalt road surface
        const road = 0.22 + (y / h) * 0.12;
        chR[row + x] = road * 0.9;
        chG[row + x] = road * 0.92;
        chB[row + x] = road * 0.95;

        // Lane markings (dashed yellow and white)
        if (Math.abs(x - w * 0.3) < 4 && (y % 60) < 35) {
          chR[row + x] = 0.95; chG[row + x] = 0.85; chB[row + x] = 0.1;
        }

        // Car chassis & cabin
        const chassis = (dx * dx) / 6400.0 + (dy * dy) / 1600.0;
        const cabin = (dx * dx) / 2800.0 + ((dy + 35) * (dy + 35)) / 800.0;
        if (chassis <= 1.0 || cabin <= 1.0) {
          chR[row + x] = 0.15;
          chG[row + x] = 0.35;
          chB[row + x] = 0.65; // Metallic cobalt blue
        }
      }
    }
  }


  // Add realistic starfield with Gaussian Point Spread Functions (PSF)
  const isGroundTarget = sampleId === 'sample_bird' || sampleId === 'sample_animal' || sampleId === 'sample_car';
  const starCount = isGroundTarget ? 0 : sampleId === 'sample_plane' ? 40 : 350;
  for (let s = 0; s < starCount; s++) {
    const sx = Math.floor(rnd() * w);
    const sy = Math.floor(rnd() * h);
    // Log-normal distribution of star magnitudes (mostly faint, a few bright)
    const brightness = Math.pow(rnd(), 4.5) * 0.85 + 0.04;
    const starRadius = Math.max(1.2, brightness * 5.0);

    // Star color index: blue-white to orange/red giant
    const colorType = rnd();
    let sR = 1.0, sG = 1.0, sB = 1.0;
    if (colorType < 0.25) {
      // Blue star (O/B type)
      sR = 0.7; sG = 0.85; sB = 1.25;
    } else if (colorType > 0.8) {
      // Orange/Red giant (K/M type)
      sR = 1.25; sG = 0.85; sB = 0.6;
    }

    const box = Math.ceil(starRadius * 3);
    for (let dy = -box; dy <= box; dy++) {
      const py = sy + dy;
      if (py < 0 || py >= h) continue;
      const rowOff = py * w;
      for (let dx = -box; dx <= box; dx++) {
        const px = sx + dx;
        if (px < 0 || px >= w) continue;
        const dSq = dx * dx + dy * dy;
        const psf = Math.exp(-dSq / (2 * starRadius * starRadius)) * brightness;

        chR[rowOff + px] += psf * sR;
        chG[rowOff + px] += psf * sG;
        chB[rowOff + px] += psf * sB;
      }
    }
  }

  // Clamp all to max 1.0
  for (let i = 0; i < total; i++) {
    chR[i] = Math.min(1.0, chR[i]);
    chG[i] = Math.min(1.0, chG[i]);
    chB[i] = Math.min(1.0, chB[i]);
  }

  // Create simulated FITS header
  const header: FitsHeader = {
    cards: [
      { key: 'SIMPLE', value: true, comment: 'Standard FITS', raw: 'SIMPLE  =                    T / Standard FITS' },
      { key: 'BITPIX', value: -32, comment: 'IEEE 32-bit floating point', raw: 'BITPIX  =                  -32 / IEEE 32-bit floating point' },
      { key: 'NAXIS', value: 3, comment: 'Number of axes (RGB 3D cube)', raw: 'NAXIS   =                    3 / Number of axes' },
      { key: 'NAXIS1', value: w, comment: 'Image width in pixels', raw: `NAXIS1  =                 ${w} / Image width` },
      { key: 'NAXIS2', value: h, comment: 'Image height in pixels', raw: `NAXIS2  =                 ${h} / Image height` },
      { key: 'NAXIS3', value: 3, comment: 'Color channels (R, G, B)', raw: 'NAXIS3  =                    3 / Channels' },
      { key: 'OBJECT', value: sampleDef.target, comment: 'Astronomical Target', raw: `OBJECT  = '${sampleDef.target}' / Target` },
      { key: 'TELESCOP', value: sampleDef.telescope, comment: 'Optics / Mount', raw: `TELESCOP= '${sampleDef.telescope}' / Telescope` },
      { key: 'INSTRUME', value: sampleDef.camera, comment: 'Sensor / Camera', raw: `INSTRUME= '${sampleDef.camera}' / Camera` },
      { key: 'DATE-OBS', value: sampleDef.date, comment: 'Observation UTC timestamp', raw: `DATE-OBS= '${sampleDef.date}' / Date` },
      { key: 'EXPTIME', value: 15.0, comment: 'Individual frame sub exposure (sec)', raw: 'EXPTIME =                 15.0 / Sub-exposure (s)' },
      { key: 'RA', value: sampleDef.ra, comment: 'Right Ascension (J2000)', raw: `RA      = '${sampleDef.ra}' / Right Ascension` },
      { key: 'DEC', value: sampleDef.dec, comment: 'Declination (J2000)', raw: `DEC     = '${sampleDef.dec}' / Declination` },
      { key: 'FOCALLEN', value: 400.0, comment: 'Focal length in mm', raw: 'FOCALLEN=                400.0 / Focal length (mm)' },
      { key: 'BZERO', value: 0.0, comment: 'Linear offset', raw: 'BZERO   =                  0.0 / Linear offset' },
      { key: 'BSCALE', value: 1.0, comment: 'Linear scale factor', raw: 'BSCALE  =                  1.0 / Linear scale factor' },
    ],
    simple: true,
    bitpix: -32,
    naxis: 3,
    naxis1: w,
    naxis2: h,
    naxis3: 3,
    bzero: 0,
    bscale: 1,
    object: sampleDef.target,
    telescop: sampleDef.telescope,
    instrume: sampleDef.camera,
    dateObs: sampleDef.date,
    exptime: 15.0,
    ra: sampleDef.ra,
    dec: sampleDef.dec,
    focalLen: 400.0,
  };

  return {
    id: sampleDef.id,
    name: `${sampleDef.name}.fits`,
    width: w,
    height: h,
    chR,
    chG,
    chB,
    isFits: true,
    rawHeader: header,
    fileSize: total * 3 * 4,
    sourceType: 'sample',
  };
}
