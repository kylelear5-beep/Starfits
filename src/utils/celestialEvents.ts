export interface BortleClassInfo {
  classNumber: number;
  title: string;
  sqmRange: string;
  limitingMag: number;
  description: string;
  dwarf3Recommendation: string;
  recommendedFilter: 'None (Broadband)' | 'UHC / Light Pollution' | 'Dual-Band Astro (Duo-Narrowband)' | 'Planetary IR-Pass';
  color: string;
}

export const BORTLE_SCALE_DATA: Record<number, BortleClassInfo> = {
  1: {
    classNumber: 1,
    title: 'Class 1: Excellent Dark-Sky Site',
    sqmRange: '21.99 - 22.0 mag/arcsec²',
    limitingMag: 7.8,
    description: 'Milky Way casts distinct shadows on ground. Zodiacal light is striking. Airglow is readily visible near horizon.',
    dwarf3Recommendation: 'Shoot completely unfiltered (broadband). Best for faint reflection nebulae (M45 Pleiades dust), integrated flux nebulae (IFN), and faint galaxy outer spiral arms.',
    recommendedFilter: 'None (Broadband)',
    color: '#064e3b',
  },
  2: {
    classNumber: 2,
    title: 'Class 2: Truly Dark Site',
    sqmRange: '21.89 - 21.99 mag/arcsec²',
    limitingMag: 7.3,
    description: 'Airglow faintly visible along horizon. Summer Milky Way is highly structured. Faint clouds appear as dark silhouettes.',
    dwarf3Recommendation: 'Unfiltered broadband works wonderfully. 10s to 15s subs on Dwarf 3 with Gain 60-80 yield extraordinary signal without background clipping.',
    recommendedFilter: 'None (Broadband)',
    color: '#047857',
  },
  3: {
    classNumber: 3,
    title: 'Class 3: Rural Sky',
    sqmRange: '21.69 - 21.89 mag/arcsec²',
    limitingMag: 6.8,
    description: 'Some light pollution domes visible at horizon. Clouds faintly illuminated near horizon but dark overhead. M31 galaxy is easily visible naked-eye.',
    dwarf3Recommendation: 'Broadband is great for galaxies. For emission targets (M42, Rosette, Veil), the Dwarf 3 Dual-Band filter isolates H-alpha and O-III brilliantly.',
    recommendedFilter: 'None (Broadband)',
    color: '#0284c7',
  },
  4: {
    classNumber: 4,
    title: 'Class 4: Rural / Suburban Transition',
    sqmRange: '20.49 - 21.69 mag/arcsec²',
    limitingMag: 6.3,
    description: 'Light pollution domes obvious in several directions. Milky Way still impressive overhead, but loses fine details toward horizon.',
    dwarf3Recommendation: 'Balanced conditions. Use broadband on brighter galaxies (M81/M82, M31). Use Dual-Band filter on all emission nebulae to block suburban skyglow.',
    recommendedFilter: 'Dual-Band Astro (Duo-Narrowband)',
    color: '#2563eb',
  },
  5: {
    classNumber: 5,
    title: 'Class 5: Suburban Sky',
    sqmRange: '19.50 - 20.49 mag/arcsec²',
    limitingMag: 5.8,
    description: 'Only hints of Milky Way seen overhead; invisible near horizon. Light sources visible from all directions. Clouds are brighter than sky.',
    dwarf3Recommendation: 'Dual-Band filter strongly recommended for nebulae. For galaxies, limit exposure to 10s subs to avoid skyglow wash out, and stack 200+ frames.',
    recommendedFilter: 'Dual-Band Astro (Duo-Narrowband)',
    color: '#d97706',
  },
  6: {
    classNumber: 6,
    title: 'Class 6: Bright Suburban Sky',
    sqmRange: '18.94 - 19.50 mag/arcsec²',
    limitingMag: 5.3,
    description: 'Milky Way only visible directly at zenith on clearest nights. Sky background glows grayish-white across whole sky.',
    dwarf3Recommendation: 'Always insert the Dwarf 3 Dual-Band filter for deep sky nebulae. Use the SCNR Green and Background Neutralization tools in this app.',
    recommendedFilter: 'Dual-Band Astro (Duo-Narrowband)',
    color: '#ea580c',
  },
  7: {
    classNumber: 7,
    title: 'Class 7: Suburban / Urban Transition',
    sqmRange: '18.38 - 18.94 mag/arcsec²',
    limitingMag: 4.8,
    description: 'Sky background has strong light gray/amber cast. Entire Milky Way is totally invisible. Clouds are brightly lit.',
    dwarf3Recommendation: 'Dual-Band filter is mandatory for emission nebulae. Planetary captures (Jupiter, Saturn) are unaffected by light pollution—great night for planets!',
    recommendedFilter: 'Dual-Band Astro (Duo-Narrowband)',
    color: '#dc2626',
  },
  8: {
    classNumber: 8,
    title: 'Class 8: City Sky',
    sqmRange: '17.80 - 18.38 mag/arcsec²',
    limitingMag: 4.3,
    description: 'Sky glows whitish or orange. Only brightest stars and planets visible naked-eye. Constellation outlines are hard to trace.',
    dwarf3Recommendation: 'Ideal for Moon and Planets (Jupiter belts, Saturn rings). For deep sky, shoot high-contrast emission targets (Orion M42, Dumbbell M27) with Dual-Band filter.',
    recommendedFilter: 'Dual-Band Astro (Duo-Narrowband)',
    color: '#991b1b',
  },
  9: {
    classNumber: 9,
    title: 'Class 9: Inner-City Sky',
    sqmRange: '< 17.80 mag/arcsec²',
    limitingMag: 3.8,
    description: 'Dense downtown urban core. Entire night sky is brilliantly lit. Many familiar constellations are completely invisible.',
    dwarf3Recommendation: 'Focus on Solar, Lunar, and Planetary imaging (Jupiter, Saturn, Venus). Dwarf 3 planetary burst mode and video stacking are unaffected by streetlights.',
    recommendedFilter: 'Planetary IR-Pass',
    color: '#4c0519',
  },
};

export interface CelestialEvent {
  id: string;
  title: string;
  type: 'Meteor Shower' | 'Planetary Opposition' | 'Eclipse' | 'Conjunction' | 'Lunar Occultation';
  dateString: string;
  peakDate: string;
  daysAway: number;
  visibility: 'Optimal' | 'Good' | 'Moderate';
  description: string;
  dwarf3Tips: string;
  bestHours: string;
}

export const UPCOMING_CELESTIAL_EVENTS: CelestialEvent[] = [
  {
    id: 'lyrids',
    title: 'Lyrid Meteor Shower',
    type: 'Meteor Shower',
    dateString: 'April 21 - 22',
    peakDate: '2025-04-22',
    daysAway: 12,
    visibility: 'Good',
    description: 'One of the oldest known meteor showers. Produces up to 18 meteors/hour with occasional bright fireballs leaving glowing dust trails.',
    dwarf3Tips: 'Switch Dwarf 3 to Wide-Angle Astro Mode with 15-second continuous interval exposures pointed towards constellation Lyra / Vega.',
    bestHours: 'Midnight to 4:30 AM (Moon sets early)',
  },
  {
    id: 'eta-aquariids',
    title: 'Eta Aquariids Meteor Shower',
    type: 'Meteor Shower',
    dateString: 'May 5 - 6',
    peakDate: '2025-05-06',
    daysAway: 26,
    visibility: 'Optimal',
    description: 'Produced by debris particles from Halley Comet. Produces up to 50 meteors/hour with rapid speeds and long persistent trains.',
    dwarf3Tips: 'Mount Dwarf 3 on a solid tripod with level ground. Set wide lens to Gain 80, 10s exposures, and point East-Southeast.',
    bestHours: '3:00 AM to dawn',
  },
  {
    id: 'moon-jupiter-conjunction',
    title: 'Moon & Jupiter Spectacular Conjunction',
    type: 'Conjunction',
    dateString: 'May 23',
    peakDate: '2025-05-23',
    daysAway: 43,
    visibility: 'Optimal',
    description: 'Crescent Moon pairs within 2 degrees of brilliant gas giant Jupiter. Stunning photographic composition for telephoto and wide-angle smart scopes.',
    dwarf3Tips: 'Use Dwarf 3 telephoto mode to capture both the crescent lunar craters and Jupiter with all 4 Galilean moons (Io, Europa, Ganymede, Callisto).',
    bestHours: 'Dusk to 11:30 PM',
  },
  {
    id: 'perseids',
    title: 'Perseids Meteor Shower (Grand Peak)',
    type: 'Meteor Shower',
    dateString: 'August 11 - 13',
    peakDate: '2025-08-12',
    daysAway: 124,
    visibility: 'Optimal',
    description: 'The king of summer meteor showers! Up to 100 fast, bright meteors per hour radiating from Perseus with magnificent fireballs.',
    dwarf3Tips: 'Use Dwarf 3 Wide-Angle camera in Astro Timelapse mode. Keep lens heater on to counter morning dew condensation.',
    bestHours: '11:00 PM to 4:45 AM',
  },
  {
    id: 'saturn-opposition',
    title: 'Saturn Opposition & Edge-On Rings',
    type: 'Planetary Opposition',
    dateString: 'September 21',
    peakDate: '2025-09-21',
    daysAway: 164,
    visibility: 'Optimal',
    description: 'Saturn shines brightly at magnitude +0.4. Unique rare event: rings are tilted nearly edge-on to Earth, offering a razor-thin profile and visible moons (Titan, Rhea).',
    dwarf3Tips: 'Set Dwarf 3 to manual planetary exposure 1/60s, Gain 40. Apply multi-scale wavelets in this app to resolve ring shadows across the planetary disk.',
    bestHours: '10:00 PM to 3:30 AM',
  },
  {
    id: 'geminids',
    title: 'Geminid Meteor Shower',
    type: 'Meteor Shower',
    dateString: 'December 13 - 14',
    peakDate: '2025-12-14',
    daysAway: 248,
    visibility: 'Optimal',
    description: 'The richest meteor shower of the year, originating from asteroid 3200 Phaethon. Yields up to 120-150 slow, multi-colored meteors per hour.',
    dwarf3Tips: 'Set up Dwarf 3 facing high near Gemini / Castor & Pollux. Use interval shooting with 15s exposures and stack fireballs.',
    bestHours: '9:30 PM to 5:00 AM',
  },
  {
    id: 'jupiter-opposition',
    title: 'Jupiter Opposition (Closest to Earth)',
    type: 'Planetary Opposition',
    dateString: 'January 10',
    peakDate: '2026-01-10',
    daysAway: 275,
    visibility: 'Optimal',
    description: 'Jupiter is closest to Earth, shining at magnitude -2.8 with maximum apparent disc size (48 arcseconds). Cloud belts and Great Red Spot in full glory.',
    dwarf3Tips: 'Crucial for Dwarf 3: Use Planetary Burst mode at 1/100s exposure, Gain 20-30. Use our Atmospheric Dispersion (ADC) tool to fix blue/red rim fringe.',
    bestHours: 'Visible all night (Highest at 12:30 AM)',
  },
];
