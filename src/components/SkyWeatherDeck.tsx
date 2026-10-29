import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  Moon, 
  Wind, 
  Droplets, 
  Thermometer, 
  Compass, 
  MapPin, 
  RefreshCw, 
  Sparkles,
  AlertTriangle,
  Calendar,
  Layers,
  Sliders,
  Filter,
  Eye,
  CheckCircle2,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  CalculatedTarget, 
  getVisibleSkyTargets, 
  getMoonPhase 
} from '../utils/celestial';
import { 
  BORTLE_SCALE_DATA, 
  UPCOMING_CELESTIAL_EVENTS, 
  CelestialEvent,
  BortleClassInfo 
} from '../utils/celestialEvents';

interface WeatherData {
  temp: number;
  humidity: number;
  cloudCover: number;
  windSpeed: number;
  dewPoint: number;
  seeingQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  stargazingIndex: number; // 0 - 100%
  locationName: string;
}

interface SkyWeatherDeckProps {
  onSelectTargetForCompass: (target: CalculatedTarget) => void;
  selectedTargetId?: string;
  currentBortle?: number;
  onBortleChange?: (bortle: number) => void;
}

export const SkyWeatherDeck: React.FC<SkyWeatherDeckProps> = ({
  onSelectTargetForCompass,
  selectedTargetId,
  currentBortle = 4,
  onBortleChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'weather' | 'bortle' | 'events' | 'targets'>('weather');
  const [bortleClass, setBortleClass] = useState<number>(currentBortle);

  const [lat, setLat] = useState(34.05);
  const [lon, setLon] = useState(-118.25);
  const [locationName, setLocationName] = useState('Los Angeles (Suburban Dark Sky)');
  const [loading, setLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData>({
    temp: 14,
    humidity: 52,
    cloudCover: 10,
    windSpeed: 6,
    dewPoint: 5,
    seeingQuality: 'Good',
    stargazingIndex: 90,
    locationName: 'Los Angeles (Suburban Dark Sky)',
  });

  const [targets, setTargets] = useState<CalculatedTarget[]>([]);
  const moon = getMoonPhase();

  // Handle Bortle change
  const handleSelectBortle = (cls: number) => {
    setBortleClass(cls);
    if (onBortleChange) onBortleChange(cls);
  };

  // Recalculate celestial targets
  useEffect(() => {
    const calculated = getVisibleSkyTargets(lat, lon, new Date());
    setTargets(calculated);
  }, [lat, lon]);

  // Fetch real-time weather from Open-Meteo
  const fetchWeather = async (latitude: number, longitude: number, locName?: string) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m,dew_point_2m&forecast_days=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Weather API error');
      const data = await res.json();
      const current = data.current;

      const temp = Math.round(current.temperature_2m ?? 15);
      const humidity = Math.round(current.relative_humidity_2m ?? 50);
      const cloudCover = Math.round(current.cloud_cover ?? 10);
      const windSpeed = Math.round(current.wind_speed_10m ?? 5);
      const dewPoint = Math.round(current.dew_point_2m ?? temp - 6);

      // Calculate Astronomical Seeing
      let seeing: WeatherData['seeingQuality'] = 'Good';
      if (windSpeed < 8 && cloudCover < 15) seeing = 'Excellent';
      else if (windSpeed < 18 && cloudCover < 35) seeing = 'Good';
      else if (cloudCover < 65) seeing = 'Fair';
      else seeing = 'Poor';

      // Stargazing Index (0-100)
      const cloudPenalty = cloudCover * 0.7;
      const windPenalty = Math.max(0, (windSpeed - 10) * 2);
      const index = Math.max(0, Math.min(100, Math.round(100 - cloudPenalty - windPenalty)));

      setWeather({
        temp,
        humidity,
        cloudCover,
        windSpeed,
        dewPoint,
        seeingQuality: seeing,
        stargazingIndex: index,
        locationName: locName || locationName,
      });
    } catch (err) {
      console.warn('Weather fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(lat, lon);
  }, []);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newLat = Number(pos.coords.latitude.toFixed(2));
          const newLon = Number(pos.coords.longitude.toFixed(2));
          setLat(newLat);
          setLon(newLon);
          setLocationName(`GPS [${newLat}°, ${newLon}°]`);
          fetchWeather(newLat, newLon, `GPS [${newLat}°, ${newLon}°]`);
        },
        (err) => console.warn('Geolocation denied:', err)
      );
    }
  };

  const isDewRisk = weather.temp - weather.dewPoint <= 3;
  const currentBortleData: BortleClassInfo = BORTLE_SCALE_DATA[bortleClass] || BORTLE_SCALE_DATA[4];

  return (
    <div className="space-y-4 select-none">
      {/* Sub navigation pills */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-[#06080d] border border-[#1f2b42] text-xs font-semibold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('weather')}
          className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'weather'
              ? 'bg-sky-500/20 text-sky-200 border border-sky-400/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5 text-sky-400" />
          <span>Weather & Seeing</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bortle')}
          className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'bortle'
              ? 'bg-amber-500/20 text-amber-200 border border-amber-400/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Bortle Scale ({bortleClass})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('events')}
          className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'events'
              ? 'bg-purple-500/20 text-purple-200 border border-purple-400/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-purple-400" />
          <span>Celestial Events ({UPCOMING_CELESTIAL_EVENTS.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('targets')}
          className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition ${
            activeSubTab === 'targets'
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Visible Targets</span>
        </button>
      </div>

      {/* SUBTAB 1: WEATHER & SEEING */}
      {activeSubTab === 'weather' && (
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-[#0d121d] border border-sky-500/30 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#1f2b42] pb-2">
              <div className="flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-white">Observing Conditions & Seeing</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleUseMyLocation}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#131b2b] hover:bg-[#1c273e] border border-[#1f2b42] text-slate-300 flex items-center gap-1 transition"
                  title="Use GPS Coordinates"
                >
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>My GPS</span>
                </button>
                <button
                  onClick={() => fetchWeather(lat, lon)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                  title="Refresh Weather"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Stargazing Score Banner */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#06080d] border border-[#1f2b42]">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Stargazing Rating</div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span className={weather.stargazingIndex > 70 ? 'text-emerald-400' : 'text-amber-400'}>
                    {weather.stargazingIndex}% Score
                  </span>
                  <span className="text-xs text-slate-400 font-normal">
                    • Seeing: <strong className="text-sky-300">{weather.seeingQuality}</strong>
                  </span>
                </div>
              </div>

              {/* Moon Phase Badge */}
              <div className="text-right">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Moon Phase</div>
                <div className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1">
                  <Moon className="w-3.5 h-3.5" />
                  <span>{moon.phaseName} ({moon.illumination}%)</span>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-4 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                <div className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                  <CloudSun className="w-3 h-3 text-sky-400" /> Cloud
                </div>
                <div className={`font-semibold ${weather.cloudCover > 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {weather.cloudCover}%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                <div className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" /> Temp
                </div>
                <div className="font-semibold text-slate-200">
                  {weather.temp}°C
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                <div className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-cyan-400" /> Humidity
                </div>
                <div className="font-semibold text-slate-200">
                  {weather.humidity}%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#131b2b] border border-[#1f2b42]">
                <div className="text-[9px] text-slate-400 uppercase flex items-center gap-1">
                  <Wind className="w-3 h-3 text-indigo-400" /> Wind
                </div>
                <div className="font-semibold text-slate-200">
                  {weather.windSpeed} km/h
                </div>
              </div>
            </div>

            {/* Lens Dew Warning */}
            {isDewRisk ? (
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-[11px] leading-tight">
                  <strong>High Dew Risk (Temp within 3°C of Dew Point):</strong> Turn on the Dwarf 3 lens heater or attach the lens hood to prevent optical condensation.
                </p>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Low Dew Risk (Dew Point: {weather.dewPoint}°C, Margin: {weather.temp - weather.dewPoint}°C)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: BORTLE SCALE & LIGHT POLLUTION */}
      {activeSubTab === 'bortle' && (
        <div className="space-y-3.5">
          {/* Bortle Selector Card */}
          <div className="p-4 rounded-2xl bg-[#0d121d] border border-amber-500/40 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                  Light Pollution Rating
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Bortle Class {bortleClass}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300">
                {currentBortleData.sqmRange}
              </span>
            </div>

            {/* Visual Bortle Number Slider / Chips */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>Class 1 (Darkest)</span>
                <span>Class 5 (Suburban)</span>
                <span>Class 9 (Inner City)</span>
              </div>

              <div className="grid grid-cols-9 gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                  const isCurrent = num === bortleClass;
                  return (
                    <button
                      key={num}
                      onClick={() => handleSelectBortle(num)}
                      className={`h-9 rounded-lg font-mono font-bold text-xs flex flex-col items-center justify-center transition border ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-amber-400/50 scale-105 shadow-md'
                          : 'bg-[#131b2b] text-slate-300 border-[#1f2b42] hover:bg-[#1a2337]'
                      }`}
                    >
                      <span>{num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bortle Class Details Card */}
            <div className="p-3 rounded-xl bg-[#06080d] border border-[#1f2b42] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{currentBortleData.title}</span>
                <span className="text-[10px] font-mono text-sky-300">
                  Limiting Mag: {currentBortleData.limitingMag}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentBortleData.description}
              </p>
            </div>

            {/* Dwarf 3 Filter Recommendation */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-400/40 space-y-1.5">
              <div className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-sky-400" />
                <span>Dwarf 3 Recommended Filter:</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-200 border border-sky-400/40 text-[10px] font-mono">
                  {currentBortleData.recommendedFilter}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                {currentBortleData.dwarf3Recommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: UPCOMING CELESTIAL EVENTS */}
      {activeSubTab === 'events' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Upcoming Celestial Events & Meteor Showers
            </span>
            <span className="text-[10px] font-mono text-purple-300">
              Dwarf 3 Optimized
            </span>
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {UPCOMING_CELESTIAL_EVENTS.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-xl bg-[#0d121d] border border-purple-500/30 space-y-2 hover:border-purple-400/60 transition shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-white">{event.title}</span>
                      <span className="text-[9px] font-mono uppercase px-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {event.type}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-amber-300 mt-0.5">
                      📅 Peak: {event.dateString} • {event.bestHours}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    In {event.daysAway} days
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {event.description}
                </p>

                <div className="p-2 rounded-lg bg-[#06080d] border border-[#1f2b42] text-[10px] font-mono text-amber-300/90 flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">🔭 Dwarf 3:</span>
                  <span>{event.dwarf3Tips}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 4: VISIBLE TARGETS & AIMING ANGLES */}
      {activeSubTab === 'targets' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              What's Visible Tonight & Aiming Angles
            </span>
            <span className="text-[10px] font-mono text-slate-400">Click to Align Telescope</span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {targets.map((t) => {
              const isSelected = selectedTargetId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTargetForCompass(t)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100 ring-1 ring-amber-400/50'
                      : 'bg-[#0d121d] hover:bg-[#131b2b] border-[#1f2b42] text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{t.name}</span>
                      <span className="text-[9px] font-mono uppercase px-1 rounded bg-[#131b2b] text-sky-400 border border-sky-500/20">
                        {t.type}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        t.visibilityRating === 'Optimal'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.visibilityRating === 'Good'
                          ? 'bg-sky-500/20 text-sky-300'
                          : t.visibilityRating === 'Low'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {t.visibilityRating}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{t.description}</p>
                    {t.dwarf3Tip && (
                      <p className="text-[9px] text-amber-400/90 font-mono mt-0.5">🔭 {t.dwarf3Tip}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="text-xs font-bold text-sky-300">
                      Alt: {t.altitude > 0 ? `+${t.altitude}°` : `${t.altitude}°`}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <Compass className="w-3 h-3 text-slate-500" />
                      <span>Az: {t.azimuth}° {t.compassDirection}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
