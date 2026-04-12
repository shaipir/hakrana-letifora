'use client';
import { useState } from 'react';
import { Download, Film, Image, FileJson, Layers } from 'lucide-react';
import AppShell from '@/components/navigation/AppShell';

const FORMATS = [
  { id: 'mp4',      label: 'MP4 Video',     icon: <Film size={20} />,     desc: 'לופ וידאו מלא',         color: 'text-red-400' },
  { id: 'mov',      label: 'MOV',           icon: <Film size={20} />,     desc: 'Apple פורמט',             color: 'text-orange-400' },
  { id: 'gif',      label: 'GIF',           icon: <Image size={20} />,    desc: 'לופ קצר',               color: 'text-green-400' },
  { id: 'png_seq',  label: 'PNG Sequence',  icon: <Layers size={20} />,   desc: 'תמונות נפרדות',         color: 'text-blue-400' },
  { id: 'png',      label: 'Still PNG',     icon: <Image size={20} />,    desc: 'תמונה סטטית',           color: 'text-purple-400' },
  { id: 'project',  label: 'Project File',  icon: <FileJson size={20} />, desc: 'שמירת פרויקט מלא', color: 'text-accent' },
];

const RESOLUTIONS = ['1920×1080', '3840×2160 (4K)', '1280×720', '2048×1080 (2K)', 'Custom'];

export default function ExportPage() {
  const [format, setFormat] = useState('mp4');
  const [resolution, setResolution] = useState('1920×1080');
  const [fps, setFps] = useState(30);
  const [duration, setDuration] = useState(3);
  const [quality, setQuality] = useState(90);
  const [transparent, setTransparent] = useState(false);
  const [exporting, setExporting] = useState(false);

  function handleExport() {
    setExporting(true);
    setTimeout(() => setExporting(false), 3000);
  }

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-5">

        {/* Format */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">פורמט יצוא</label>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map(f => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all ${
                  format === f.id ? 'border-accent bg-accent/20' : 'border-white/10 hover:border-white/20 bg-white/5'
                }`}
              >
                <span className={format === f.id ? 'text-accent' : f.color}>{f.icon}</span>
                <span className="text-xs font-semibold text-white">{f.label}</span>
                <span className="text-[9px] text-gray-500 text-center">{f.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold">הגדרות</h3>

          {/* Resolution */}
          <div>
            <label className="text-xs text-gray-400 mb-2 block">רזולוציה</label>
            <div className="flex flex-wrap gap-2">
              {RESOLUTIONS.map(r => (
                <button key={r} onClick={() => setResolution(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    resolution === r ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          {/* FPS */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>FPS</span><span>{fps}</span></div>
              <div className="flex gap-2">
                {[24, 30, 60].map(f => (
                  <button key={f} onClick={() => setFps(f)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      fps === f ? 'bg-accent text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}>{f}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>אורך (שניות)</span><span>{duration}s</span></div>
              <input type="range" min="1" max="60" value={duration} onChange={e => setDuration(+e.target.value)} className="w-full accent-accent" />
            </div>
          </div>

          {/* Quality */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>איכות</span><span>{quality}%</span></div>
            <input type="range" min="50" max="100" value={quality} onChange={e => setQuality(+e.target.value)} className="w-full accent-accent" />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">רקע שקוף (Alpha)</span>
            <button onClick={() => setTransparent(!transparent)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                transparent ? 'bg-accent' : 'bg-white/10'
              }`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                transparent ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="glass rounded-xl p-3 text-xs text-gray-400 flex justify-between">
          <span>{format.toUpperCase()} · {resolution} · {fps}fps · {duration}s</span>
          <span>איכות {quality}%</span>
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full py-4 bg-accent hover:bg-accent-hover disabled:opacity-60 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all accent-glow"
        >
          <Download size={22} />
          {exporting ? 'מייצא...' : 'ייצא'}
        </button>
      </div>
    </AppShell>
  );
}
