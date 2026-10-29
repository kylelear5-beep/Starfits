import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Users, 
  QrCode, 
  Tv, 
  ListOrdered, 
  Heart, 
  Compass, 
  Moon, 
  Eye, 
  Share2, 
  Orbit, 
  CheckCircle2, 
  Radio, 
  Clock, 
  Maximize2, 
  Plus, 
  Flame, 
  Star,
  Check
} from 'lucide-react';
import { StarPartyTarget, StarPartySession, LoadedAstroImage } from '../types/fits';

interface StarPartyModalProps {
  currentImage: LoadedAstroImage | null;
  bortleNumber: number;
  onSelectTarget: (targetId: string) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  nightMode: boolean;
  onToggleNightMode: () => void;
}

export const StarPartyModal: React.FC<StarPartyModalProps> = ({
  currentImage,
  bortleNumber,
  onSelectTarget,
  onClose,
  onShowToast,
  nightMode,
  onToggleNightMode,
}) => {
  const [activeTab, setActiveTab] = useState<'tour' | 'kiosk' | 'requests' | 'broadcast'>('tour');

  const [session, setSession] = useState<StarPartySession>({
    partyName: 'Dwarf 3 Night Sky Gathering',
    hostName: 'Astronomy Host',
    location: 'Dark Sky Meadow (Bortle 4)',
    bortle: bortleNumber,
    attendeeCount: 14,
    telescopeModel: 'Dwarflab Dwarf 3 Dual-Lens',
    isBroadcasting: true,
    broadcastCode: 'STAR-7749',
    kioskMode: false,
    activeTargetId: 'm42',
  });

  const [targets, setTargets] = useState<StarPartyTarget[]>([
    {
      id: 'm42',
      name: 'M42 Great Orion Nebula & Trapezium',
      catalog: 'NGC 1976',
      constellation: 'Orion',
      targetType: 'Nebula',
      ra: '05h 35m 17s',
      dec: "-05° 23' 28\"",
      magnitude: 4.0,
      distanceLy: '1,344 Light-Years',
      status: 'active',
      partyNotes: 'Stellar nursery where new stars are forming right now. Point out Trapezium 4-star cluster!',
      guestVotes: 12,
      telescopeExposureSec: 15,
    },
    {
      id: 'jupiter_dwarf3',
      name: 'Jupiter & Galilean Moons (Io, Europa, Ganymede, Callisto)',
      catalog: 'Solar System',
      constellation: 'Taurus',
      targetType: 'Planetary',
      ra: '04h 48m 10s',
      dec: "+21° 30' 00\"",
      magnitude: -2.6,
      distanceLy: '43 Light-Minutes (628M km)',
      status: 'queued',
      partyNotes: 'Look for two main brown equatorial cloud belts and Great Red Spot transit.',
      guestVotes: 9,
      telescopeExposureSec: 0.016,
    },
    {
      id: 'm31',
      name: 'M31 Andromeda Spiral Galaxy',
      catalog: 'NGC 224',
      constellation: 'Andromeda',
      targetType: 'Galaxy',
      ra: '00h 42m 44s',
      dec: "+41° 16' 09\"",
      magnitude: 3.4,
      distanceLy: '2.5 Million Light-Years',
      status: 'queued',
      partyNotes: 'The most distant object visible to the naked eye. 1 trillion stars in this giant spiral!',
      guestVotes: 15,
      telescopeExposureSec: 10,
    },
    {
      id: 'm45',
      name: 'M45 Pleiades / Seven Sisters',
      catalog: 'Melotte 22',
      constellation: 'Taurus',
      targetType: 'Cluster',
      ra: '03h 47m 24s',
      dec: "+24° 07' 00\"",
      magnitude: 1.6,
      distanceLy: '444 Light-Years',
      status: 'observed',
      partyNotes: 'Young blue cluster wrapped in luminous interstellar reflection dust veil.',
      guestVotes: 8,
      telescopeExposureSec: 30,
    },
    {
      id: 'veil',
      name: 'NGC 6960 Western Veil Nebula',
      catalog: 'Supernova Remnant',
      constellation: 'Cygnus',
      targetType: 'Nebula',
      ra: '20h 45m 38s',
      dec: "+30° 42' 30\"",
      magnitude: 7.0,
      distanceLy: '2,400 Light-Years',
      status: 'queued',
      partyNotes: 'Debris shockwave expanding from a massive supernova explosion 10,000 years ago.',
      guestVotes: 7,
      telescopeExposureSec: 60,
    },
  ]);

  const [newRequestText, setNewRequestText] = useState('');
  const [guestName, setGuestName] = useState('');

  const handleSlewToTarget = (t: StarPartyTarget) => {
    setTargets((prev) =>
      prev.map((item) => ({
        ...item,
        status: item.id === t.id ? 'active' : item.status === 'active' ? 'observed' : item.status,
      }))
    );
    setSession((prev) => ({ ...prev, activeTargetId: t.id }));
    onSelectTarget(t.id);
    onShowToast(`🔭 Telescope slewing to ${t.name}!`);
  };

  const handleAddRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestText.trim()) return;

    const newTarget: StarPartyTarget = {
      id: `req_${Date.now()}`,
      name: newRequestText.trim(),
      catalog: 'Guest Request',
      constellation: 'Sky Tonight',
      targetType: 'Cluster',
      ra: 'TBD',
      dec: 'TBD',
      magnitude: 6.0,
      distanceLy: 'Deep Sky',
      status: 'queued',
      partyNotes: `Requested by ${guestName.trim() || 'Star Party Guest'}`,
      guestVotes: 1,
      requestedBy: guestName.trim() || 'Guest',
    };

    setTargets((prev) => [newTarget, ...prev]);
    setNewRequestText('');
    setGuestName('');
    onShowToast(`⭐ Added "${newTarget.name}" to the Star Party Queue!`);
  };

  const handleVote = (id: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, guestVotes: t.guestVotes + 1 } : t))
    );
    onShowToast('👍 Upvoted target request!');
  };

  const activeTarget = targets.find((t) => t.status === 'active') || targets[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[94vh] rounded-2xl bg-[#090d16] border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-sky-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-inner">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  <span>Star Party & Public Outreach Suite</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  Live Broadcast Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Host astronomical gatherings, run guided sky tours, log guest requests, and stream live views to attendee phones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleNightMode}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition ${
                nightMode
                  ? 'bg-red-500/25 border-red-500/50 text-red-300'
                  : 'bg-[#131b2b] border-[#1f2b42] text-slate-300 hover:text-white'
              }`}
              title="Red Night-Vision Mode (Preserves eye dark adaptation)"
            >
              <Moon className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline text-[11px]">Dark Mode</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#131b2b] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#1f2b42] bg-[#0c101a] px-4 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('tour')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'tour'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Sky Tour Showcase ({targets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kiosk')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'kiosk'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Audience Projector HUD</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'requests'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Guest Requests & Votes</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'broadcast'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>Share to Phones (QR)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar text-xs">
          {/* TAB 1: SKY TOUR SHOWCASE PLAYLIST */}
          {activeTab === 'tour' && (
            <div className="space-y-4">
              {/* Star Party Status Banner */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/30 via-[#0d121d] to-[#0d121d] border border-amber-500/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-white font-bold text-xs flex items-center gap-2">
                    <span>{session.partyName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Bortle {session.bortle}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Host: <strong className="text-slate-200">{session.hostName}</strong> • {session.attendeeCount} Guests Observing Tonight
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('kiosk')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Launch Audience HUD</span>
                </button>
              </div>

              {/* Target List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-[10px] font-mono uppercase tracking-wider">
                  <span>Showcase Targets (Curated for High-Impact Public Viewing)</span>
                  <span>1-Click Slew & Capture</span>
                </div>

                <div className="space-y-2">
                  {targets.map((t) => {
                    const isActive = t.status === 'active';
                    const isObserved = t.status === 'observed';
                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isActive
                            ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400/30'
                            : isObserved
                            ? 'bg-[#0d121d]/60 border-[#1f2b42] text-slate-400'
                            : 'bg-[#0d121d] border-[#1f2b42] hover:border-amber-500/40'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {t.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#131b2b] text-[10px] font-mono text-sky-400 border border-sky-500/20">
                              {t.constellation}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-[#131b2b] text-[10px] font-mono text-purple-300 border border-purple-500/20">
                              {t.targetType}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/40 animate-pulse">
                                TELESCOPE LIVE ON TARGET
                              </span>
                            )}
                            {isObserved && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono text-[9px]">
                                OBSERVED
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {t.partyNotes}
                          </p>

                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-0.5">
                            <span>Distance: <strong className="text-slate-200">{t.distanceLy}</strong></span>
                            <span>•</span>
                            <span>Brightness: <strong className="text-amber-300">Mag {t.magnitude}</strong></span>
                            <span>•</span>
                            <button
                              onClick={() => handleVote(t.id)}
                              className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
                            >
                              <Heart className="w-3 h-3 fill-current" />
                              <span>{t.guestVotes} Votes</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleSlewToTarget(t)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                              isActive
                                ? 'bg-amber-400 text-slate-950 shadow-md'
                                : 'bg-[#151e30] hover:bg-amber-500/20 border border-[#1f2b42] hover:border-amber-400 text-slate-200'
                            }`}
                          >
                            <Orbit className="w-3.5 h-3.5" />
                            <span>{isActive ? 'Current View' : 'Slew Telescope'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIENCE PROJECTOR / KIOSK HUD */}
          {activeTab === 'kiosk' && (
            <div className="p-4 sm:p-6 rounded-2xl bg-black border border-amber-500/30 flex flex-col justify-between min-h-[460px] text-white space-y-5 relative overflow-hidden">
              {/* Subtle celestial background grid watermark */}
              <div className="absolute top-3 right-4 opacity-10 pointer-events-none">
                <Compass className="w-64 h-64 text-amber-400" />
              </div>

              {/* Top Observatory Banner */}
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <h3 className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
                      {session.partyName} • Live Observatory Kiosk
                    </h3>
                    <p className="text-[10px] font-mono text-slate-400">
                      Telescope: {session.telescopeModel} • Seeing: 1.4" Arcsec
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                    Bortle {session.bortle} Sky
                  </span>
                  <span className="text-slate-400">Attendees: {session.attendeeCount}</span>
                </div>
              </div>

              {/* Main Audience Target Spotlight */}
              <div className="space-y-3 max-w-2xl py-4">
                <div className="text-xs font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current" />
                  <span>Currently Viewing in Eyepiece & Sensor</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  {activeTarget.name}
                </h1>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
                  <div className="p-2.5 rounded-xl bg-[#0c101a] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Constellation</span>
                    <span className="font-bold text-sky-300">{activeTarget.constellation}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0c101a] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Light Travel Time</span>
                    <span className="font-bold text-amber-300">{activeTarget.distanceLy}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0c101a] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Classification</span>
                    <span className="font-bold text-purple-300">{activeTarget.targetType}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#0c101a] border border-[#1f2b42]">
                    <span className="text-slate-500 block text-[9px] uppercase">Apparent Brightness</span>
                    <span className="font-bold text-emerald-400">Magnitude {activeTarget.magnitude}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0c101a]/80 border border-amber-500/30 text-xs sm:text-sm text-slate-200 leading-relaxed">
                  <p>
                    <strong className="text-amber-300">Observer's Guide for Guests:</strong> {activeTarget.partyNotes}
                  </p>
                </div>
              </div>

              {/* Bottom Quick Host Controls */}
              <div className="pt-3 border-t border-[#1f2b42] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Audience Broadcast Code:</span>
                  <strong className="text-emerald-400 font-mono tracking-widest text-sm bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                    {session.broadcastCode}
                  </strong>
                </div>

                <button
                  onClick={() => setActiveTab('tour')}
                  className="px-3 py-1.5 rounded-lg bg-[#151e30] hover:bg-[#1c273e] border border-[#1f2b42] text-slate-200 transition"
                >
                  Return to Sky Tour
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: GUEST TARGET REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Add Request Form */}
              <form onSubmit={handleAddRequest} className="p-4 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-3">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Request a Celestial Target for Tonight</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newRequestText}
                    onChange={(e) => setNewRequestText(e.target.value)}
                    placeholder="e.g. Ring Nebula M57, Saturn, Crab Nebula"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#090d16] border border-[#1f2b42] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your Name / Table #"
                    className="px-3 py-2 rounded-xl bg-[#090d16] border border-[#1f2b42] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-md"
                  >
                    <span>Submit Request to Queue</span>
                  </button>
                </div>
              </form>

              {/* Requests List */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Guest Requests Ranked by Votes
                </h4>
                <div className="space-y-2">
                  {targets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl bg-[#0d121d] border border-[#1f2b42] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <span>{t.name}</span>
                          {t.requestedBy && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 font-mono text-[9px] border border-amber-500/20">
                              By {t.requestedBy}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">{t.partyNotes}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVote(t.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                          <span>{t.guestVotes}</span>
                        </button>
                        <button
                          onClick={() => handleSlewToTarget(t)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 text-xs font-semibold transition"
                        >
                          Slew
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BROADCAST TO ATTENDEE PHONES */}
          {activeTab === 'broadcast' && (
            <div className="p-4 sm:p-6 rounded-2xl bg-[#0d121d] border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <QrCode className="w-6 h-6" />
              </div>

              <div className="space-y-1 max-w-md">
                <h3 className="text-base font-bold text-white">
                  Live Star Party Mobile Broadcast
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Guests at your star party can point their phone camera at this QR code or enter the party code to view your Dwarf 3 telescope feed live from their lawn chairs!
                </p>
              </div>

              {/* Simulated QR Code Canvas */}
              <div className="p-3 bg-white rounded-2xl shadow-2xl inline-block border-4 border-emerald-500">
                <div className="w-44 h-44 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="grid grid-cols-4 gap-1.5 w-32 h-32 p-1 bg-black rounded-lg">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-sm ${
                          (i % 3 === 0 || i === 0 || i === 3 || i === 12 || i === 15)
                            ? 'bg-emerald-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-emerald-300 font-bold">
                    SCAN TO CONNECT
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 text-xs font-mono">
                <div className="px-3 py-2 rounded-xl bg-[#090d16] border border-[#1f2b42] text-slate-300">
                  Broadcast Code: <strong className="text-emerald-400 tracking-wider font-bold">{session.broadcastCode}</strong>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText?.(window.location.href);
                    onShowToast('📋 Star Party Link copied to clipboard!');
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Attendee Link</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
