import React, { useState } from 'react';
import { X, Search, Copy, Check, Download, FileCode } from 'lucide-react';
import { FitsHeader } from '../types/fits';

interface FitsHeaderModalProps {
  header: FitsHeader;
  fileName: string;
  onClose: () => void;
}

export const FitsHeaderModal: React.FC<FitsHeaderModalProps> = ({
  header,
  fileName,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredCards = header.cards.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.key.toLowerCase().includes(q) ||
      (c.value !== null && String(c.value).toLowerCase().includes(q)) ||
      c.comment.toLowerCase().includes(q)
    );
  });

  const handleCopy = () => {
    const text = header.cards.map((c) => c.raw).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const jsonStr = JSON.stringify(header, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, '')}_header.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-[#0d121d] border border-[#1f2b42] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2b42] flex items-center justify-between bg-[#080c14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Astronomical FITS Header Cards</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30">
                  {header.cards.length} Cards
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono truncate">{fileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded-lg bg-[#131b2b] hover:bg-[#1f2b42] border border-[#1f2b42] text-xs text-slate-300 flex items-center gap-1.5 transition"
              title="Copy all cards to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-lg bg-[#131b2b] hover:bg-[#1f2b42] border border-[#1f2b42] text-xs text-slate-300 flex items-center gap-1.5 transition"
              title="Download header as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#1f2b42] bg-[#090d16]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword (e.g. OBJECT, TELESCOP, EXPTIME, GAIN, RA, DEC)..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#04060a] border border-[#1f2b42] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Cards Table */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#1f2b42] text-[10px] text-slate-400 uppercase tracking-wider text-left">
                <th className="py-2 px-3 w-28">Keyword</th>
                <th className="py-2 px-3">Value</th>
                <th className="py-2 px-3 text-slate-500">Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151d2e]">
              {filteredCards.length > 0 ? (
                filteredCards.map((card, idx) => (
                  <tr key={idx} className="hover:bg-[#131b2b]/50 transition">
                    <td className="py-2 px-3 font-bold text-sky-400 select-all">{card.key}</td>
                    <td className="py-2 px-3 text-emerald-300 select-all break-all">
                      {card.value !== null ? String(card.value) : ''}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px]">{card.comment}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    No matching FITS keywords found for "{query}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
