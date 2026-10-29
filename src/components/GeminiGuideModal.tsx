import React from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  Sliders, 
  Eye, 
  ShieldCheck, 
  Zap, 
  FolderOpen, 
  Compass, 
  HelpCircle,
  KeyRound,
  ArrowRight
} from 'lucide-react';

interface GeminiGuideModalProps {
  onClose: () => void;
  onOpenGeminiAi: () => void;
  onLoadSample?: (sampleId: string) => void;
}

export const GeminiGuideModal: React.FC<GeminiGuideModalProps> = ({
  onClose,
  onOpenGeminiAi,
  onLoadSample,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-[#090d16] border border-purple-500/40 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 via-indigo-500/30 to-sky-500/30 border border-purple-400/50 flex items-center justify-center text-purple-300 shadow-inner">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">
                  How to Use Gemini AI Assistant
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  No API Key Needed
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated Plate Solving, Seeing Quality Diagnosis & 1-Click Stretch Optimization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#131b2b] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar text-xs">
          {/* Highlight Key Status Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#0d121d] border border-purple-500/30 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-purple-200">
                Zero Configuration Required
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                You do <span className="text-emerald-400 font-semibold">NOT</span> need to copy-paste or pay for an API key manually. The built-in backend server proxy connects securely to Google Gemini using pre-configured environment credentials. Everything is ready to use immediately!
              </p>
            </div>
          </div>

          {/* 4 Step Workflow */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>Quick 4-Step Walkthrough</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] hover:border-sky-500/40 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-[11px] font-bold flex items-center justify-center font-mono">
                      1
                    </span>
                    <h4 className="font-semibold text-slate-100">Load Any Image</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Drop a raw <span className="text-slate-200 font-mono">.fits</span> file, click <span className="text-indigo-300 font-medium">Photo Album</span> to import from phone, or pick any Dwarf 3 sample (Orion, Andromeda, Jupiter, Birds, UFOs).
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-sky-400/90 font-mono flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" />
                  <span>Supports FITS, PNG, JPG, WebP</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] hover:border-purple-500/40 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-[11px] font-bold flex items-center justify-center font-mono">
                      2
                    </span>
                    <h4 className="font-semibold text-slate-100">Click "Gemini AI"</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click the purple <span className="text-purple-300 font-medium">✨ Gemini AI</span> button located in the top navigation bar at any time to initiate AI inspection.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-purple-400/90 font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Always visible in header bar</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] hover:border-indigo-500/40 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold flex items-center justify-center font-mono">
                      3
                    </span>
                    <h4 className="font-semibold text-slate-100">Review Diagnosis</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Gemini plate-solves the target object, grades atmospheric seeing & focus, and computes optimal MTF stretch, SCNR green removal, and star mask protection.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-indigo-400/90 font-mono flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>Sub-second multimodal vision</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] hover:border-emerald-500/40 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold flex items-center justify-center font-mono">
                      4
                    </span>
                    <h4 className="font-semibold text-slate-100">1-Click Apply</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Click <span className="text-emerald-400 font-semibold">"Apply Gemini AI Settings"</span>. The curves, HDR core recovery, and star protection shield are configured instantly.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-emerald-400/90 font-mono flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Reversible & fully adjustable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Common Questions */}
          <div className="p-3.5 rounded-xl bg-[#0d121d] border border-[#1f2b42] space-y-2">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>Helpful Tips & Answers</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] text-slate-300">
              <div className="p-2 rounded-lg bg-[#090d16] border border-[#1f2b42]">
                <span className="font-semibold text-slate-100 block mb-0.5">Can I re-adjust after applying?</span>
                Yes! All sliders (Midtones, Saturation, HDR Core, Wavelets) remain live so you can fine-tune to taste.
              </div>
              <div className="p-2 rounded-lg bg-[#090d16] border border-[#1f2b42]">
                <span className="font-semibold text-slate-100 block mb-0.5">Does it support Dwarf 3 Tracking?</span>
                Yes! Gemini recognizes Birds, UFOs, Planes, Animals, and Cars in addition to galaxies and planets.
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#1f2b42] flex items-center justify-between bg-[#06080d]">
          <button
            onClick={() => {
              if (onLoadSample) onLoadSample('m42');
              onClose();
              setTimeout(() => {
                onOpenGeminiAi();
              }, 200);
            }}
            className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
          >
            <span>Try on Orion Nebula M42</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenGeminiAi();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Gemini AI Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
