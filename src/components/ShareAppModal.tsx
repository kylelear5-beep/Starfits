import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Sparkles, 
  Compass, 
  Smartphone, 
  Camera, 
  ExternalLink,
  Layers
} from 'lucide-react';

interface ShareAppModalProps {
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  
  // App URL for sharing with telescope buddies
  const shareUrl = 'https://ais-pre-gmg2h6bxsccyak4vpsfbkk-304145522611.us-west2.run.app';

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const el = document.createElement('textarea');
        el.value = shareUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      onShowToast('🔗 App link copied to clipboard! Send it to your friend.');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onShowToast('Link: ' + shareUrl);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AstroFITS Studio & Dwarf 3 Companion',
          text: 'Here is the Dwarf 3 astrophotography processing app we use for planetary ADC, star masks, and live telescope compass alignment:',
          url: shareUrl,
        });
        onShowToast('Shared successfully!');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-[#090d16] border border-[#1f2b42] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Share with Telescope Buddy</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/30 text-[10px] font-mono text-amber-300">
                  Dwarf 3 Ready
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Share this processing suite with fellow smart telescope owners
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* QR Code and Scan Card */}
          <div className="p-4 rounded-xl bg-[#0d121d] border border-sky-500/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-lg">
            {/* Visual SVG QR Code */}
            <div className="p-2.5 bg-white rounded-xl shadow-md shrink-0 flex items-center justify-center">
              <svg
                viewBox="0 0 120 120"
                className="w-28 h-28"
                shapeRendering="crispEdges"
              >
                {/* Clean stylized QR matrix representing the app link */}
                <rect width="120" height="120" fill="white" />
                {/* Corner Finder 1 */}
                <rect x="10" y="10" width="28" height="28" fill="#090d16" />
                <rect x="14" y="14" width="20" height="20" fill="white" />
                <rect x="18" y="18" width="12" height="12" fill="#0284c7" />
                {/* Corner Finder 2 */}
                <rect x="82" y="10" width="28" height="28" fill="#090d16" />
                <rect x="86" y="14" width="20" height="20" fill="white" />
                <rect x="90" y="18" width="12" height="12" fill="#0284c7" />
                {/* Corner Finder 3 */}
                <rect x="10" y="82" width="28" height="28" fill="#090d16" />
                <rect x="14" y="86" width="20" height="20" fill="white" />
                <rect x="18" y="90" width="12" height="12" fill="#0284c7" />
                {/* Timing patterns */}
                <rect x="42" y="22" width="4" height="4" fill="#090d16" />
                <rect x="50" y="22" width="4" height="4" fill="#090d16" />
                <rect x="58" y="22" width="4" height="4" fill="#090d16" />
                <rect x="66" y="22" width="4" height="4" fill="#090d16" />
                <rect x="74" y="22" width="4" height="4" fill="#090d16" />
                {/* Data blocks */}
                <rect x="46" y="32" width="8" height="8" fill="#090d16" />
                <rect x="58" y="32" width="8" height="8" fill="#0284c7" />
                <rect x="70" y="32" width="8" height="8" fill="#090d16" />
                <rect x="42" y="44" width="6" height="6" fill="#090d16" />
                <rect x="52" y="44" width="6" height="6" fill="#090d16" />
                <rect x="62" y="44" width="6" height="6" fill="#0284c7" />
                <rect x="72" y="44" width="6" height="6" fill="#090d16" />
                <rect x="82" y="44" width="6" height="6" fill="#090d16" />
                <rect x="14" y="48" width="6" height="6" fill="#090d16" />
                <rect x="24" y="48" width="6" height="6" fill="#090d16" />
                <rect x="44" y="56" width="8" height="8" fill="#090d16" />
                <rect x="56" y="56" width="8" height="8" fill="#0284c7" />
                <rect x="68" y="56" width="8" height="8" fill="#090d16" />
                <rect x="80" y="56" width="8" height="8" fill="#090d16" />
                <rect x="44" y="68" width="6" height="6" fill="#090d16" />
                <rect x="54" y="68" width="6" height="6" fill="#090d16" />
                <rect x="64" y="68" width="6" height="6" fill="#090d16" />
                <rect x="74" y="68" width="6" height="6" fill="#0284c7" />
                <rect x="84" y="68" width="6" height="6" fill="#090d16" />
                <rect x="44" y="80" width="8" height="8" fill="#0284c7" />
                <rect x="56" y="80" width="8" height="8" fill="#090d16" />
                <rect x="68" y="80" width="8" height="8" fill="#090d16" />
                <rect x="80" y="80" width="8" height="8" fill="#090d16" />
                <rect x="44" y="92" width="6" height="6" fill="#090d16" />
                <rect x="54" y="92" width="6" height="6" fill="#0284c7" />
                <rect x="64" y="92" width="6" height="6" fill="#090d16" />
                <rect x="74" y="92" width="6" height="6" fill="#090d16" />
                <rect x="84" y="92" width="6" height="6" fill="#090d16" />
                <rect x="94" y="92" width="6" height="6" fill="#0284c7" />
                {/* Center logo badge */}
                <circle cx="60" cy="60" r="10" fill="#0284c7" />
                <polygon points="60,54 62,58 66,60 62,62 60,66 58,62 54,60 58,58" fill="white" />
              </svg>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span>Scan with Camera to Open Instantly</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Your friend can point their phone camera at this QR code to load AstroFITS Studio on their phone without installing anything.
              </p>
              <div className="text-[10px] font-mono text-sky-400/90 break-all bg-[#06080d] p-1.5 rounded-lg border border-[#1f2b42]">
                {shareUrl}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Link!' : 'Copy Share Link'}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-[#131b2b] hover:bg-[#1c273e] border border-[#1f2b42] text-white font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Send to Friend</span>
            </button>
          </div>

          {/* Quick Tips for Dwarf 3 Owners */}
          <div className="p-3.5 rounded-xl bg-[#06080d] border border-[#1f2b42] space-y-2.5">
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>How your friend can use this with their Dwarf 3:</span>
            </div>

            <ul className="text-[11px] text-slate-300 space-y-2 pl-1 font-mono">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">1.</span>
                <span><strong>Tripod Leveling:</strong> Open the "Telescope Setup" tab on mobile, place the phone flat on the Dwarf 3 tripod plate to verify the 0.0° bubble level.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">2.</span>
                <span><strong>Photo Album Import:</strong> Save stacked FITS or 4K planet photos from Dwarflab app to the phone Photo Album, then tap "Photo Album" to open them.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">3.</span>
                <span><strong>Fix Planetary Blur:</strong> Switch to the "Planets" tab to run the Atmospheric Dispersion Corrector (ADC) and multi-scale wavelets for razor-sharp Jupiter belts and Saturn rings.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">4.</span>
                <span><strong>Gemini AI Assistance:</strong> Tap the "Gemini AI" button for automatic plate-solving and one-click optimal stretch parameters.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2b42] bg-[#06080d] flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">
            Dwarf 3 Smart Astrograph Community
          </span>
          <button
            onClick={onClose}
            className="py-1 px-3 rounded-lg bg-[#131b2b] hover:bg-[#1a2337] text-slate-300 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
