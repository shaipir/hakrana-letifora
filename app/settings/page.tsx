'use client';
import { useState } from 'react';
import { Globe, Monitor, Cpu, Music2 } from 'lucide-react';
import AppShell from '@/components/navigation/AppShell';

const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
  <button onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-white/10'}`}>
    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

export default function SettingsPage() {
  const [lang, setLang] = useState<'he' | 'en'>('he');
  const [autosave, setAutosave] = useState(true);
  const [quality, setQuality] = useState<'performance' | 'quality'>('quality');
  const [defaultFps, setDefaultFps] = useState(30);
  const [brightness, setBrightness] = useState(100);
  const [blackBg, setBlackBg] = useState(true);
  const [creativity, setCreativity] = useState(70);
  const [consistency, setConsistency] = useState(80);
  const [audioInput, setAudioInput] = useState('microphone');
  const [fadeDuration, setFadeDuration] = useState(1);
  const [defaultResolution, setDefaultResolution] = useState('1920x1080');

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Globe size={16} className="text-accent" /> כללי</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">שפה</span>
            <div className="flex gap-2">
              {(['he','en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${lang===l?'bg-accent text-white':'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {l==='he'?'עברית':'English'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">שמירה אוטומטית</span>
            <Toggle on={autosave} onChange={() => setAutosave(!autosave)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">מצב עיבוד</span>
            <div className="flex gap-2">
              {(['performance','quality'] as const).map(m => (
                <button key={m} onClick={() => setQuality(m)}
                  className={`px-3 py-1 rounded-lg text-sm transition-all ${quality===m?'bg-accent text-white':'bg-white/5 text-gray-400 hover:text-white'}`}>
                  {m==='performance'?'מהיר':'איכותי'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>FPS ברירת מחדל</span><span>{defaultFps}</span>
            </div>
            <div className="flex gap-2">
              {[24,30,60].map(f => (
                <button key={f} onClick={() => setDefaultFps(f)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${defaultFps===f?'bg-accent text-white':'bg-white/5 text-gray-400 hover:text-white'}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Monitor size={16} className="text-accent" /> הקרנה</h3>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>בהירות</span><span>{brightness}%</span></div>
            <input type="range" min="0" max="100" value={brightness} onChange={e => setBrightness(+e.target.value)} className="w-full accent-accent" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">רקע שחור</span>
            <Toggle on={blackBg} onChange={() => setBlackBg(!blackBg)} />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">רזולוציה</label>
            <div className="flex flex-wrap gap-2">
              {['1280x720','1920x1080','2560x1440','3840x2160'].map(r => (
                <button key={r} onClick={() => setDefaultResolution(r)}
                  className={`px-3 py-1 rounded-lg text-xs border transition-all ${defaultResolution===r?'border-accent bg-accent/20 text-white':'border-white/10 text-gray-400'}`}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Cpu size={16} className="text-accent" /> הגדרות AI</h3>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>יצירתיות</span><span>{creativity}%</span></div>
            <input type="range" min="0" max="100" value={creativity} onChange={e => setCreativity(+e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>עקביות</span><span>{consistency}%</span></div>
            <input type="range" min="0" max="100" value={consistency} onChange={e => setConsistency(+e.target.value)} className="w-full accent-accent" />
          </div>
        </div>

        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Music2 size={16} className="text-accent" /> שידור חי</h3>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>זמן דהייה</span><span>{fadeDuration}s</span></div>
            <input type="range" min="0" max="5" step="0.5" value={fadeDuration} onChange={e => setFadeDuration(+e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">מקור שמע</label>
            <div className="flex gap-2">
              {['מיקרופון','AUX','Bluetooth'].map(s => (
                <button key={s} onClick={() => setAudioInput(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs border transition-all ${audioInput===s?'border-accent bg-accent/20 text-white':'border-white/10 text-gray-400'}`}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-accent hover:bg-accent-hover rounded-xl font-semibold transition-all accent-glow">שמור הגדרות</button>
      </div>
    </AppShell>
  );
}
