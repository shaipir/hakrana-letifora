'use client';
import { useState, useRef } from 'react';
import { Radio, Mic, Music2, Maximize2, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import AppShell from '@/components/navigation/AppShell';
import { useAppStore } from '@/lib/store';

const SCENES = [
  { id: 'fire',    label: 'Fire Scene',    emoji: '🔥', color: 'from-orange-600 to-red-900' },
  { id: 'cosmic',  label: 'Cosmic Scene',  emoji: '🌌', color: 'from-purple-700 to-blue-900' },
  { id: 'gold',    label: 'Gold Scene',    emoji: '✨', color: 'from-yellow-500 to-amber-800' },
  { id: 'ritual',  label: 'Ritual Scene',  emoji: '🕎', color: 'from-amber-700 to-purple-900' },
  { id: 'dark',    label: 'Dark Scene',    emoji: '💀', color: 'from-gray-800 to-black' },
];

const TRANSITIONS = ['חתיכה', 'דהייה', 'הבזק', 'דעיכה', 'גליץ'];

export default function LivePage() {
  const { isProjectorMode, toggleProjectorMode } = useAppStore();
  const [activeScene, setActiveScene] = useState('cosmic');
  const [blackout, setBlackout] = useState(false);
  const [audioReactive, setAudioReactive] = useState(false);
  const [sensitivity, setSensitivity] = useState(60);
  const [transition, setTransition] = useState('דהייה');
  const [masterBrightness, setMasterBrightness] = useState(100);

  const scene = SCENES.find(s => s.id === activeScene)!;

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-5">

        {/* Live output preview */}
        <div className={`aspect-video rounded-2xl relative overflow-hidden bg-gradient-to-br ${scene.color}`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-6xl animate-float mb-2">{scene.emoji}</div>
            <p className="text-white/60 text-sm">{scene.label}</p>
          </div>

          {blackout && <div className="absolute inset-0 bg-black" />}

          {/* Top controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${
              isProjectorMode ? 'bg-green-500/90 text-white' : 'bg-white/10 text-gray-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isProjectorMode ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
              {isProjectorMode ? 'LIVE' : 'PREVIEW'}
            </div>
            <button
              onClick={() => setBlackout(!blackout)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                blackout ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >שחור
            </button>
          </div>
        </div>

        {/* Scene switcher */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">סצנה</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SCENES.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveScene(s.id)}
                className={`shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  activeScene === s.id ? 'border-accent bg-accent/20' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-[10px] text-gray-300">{s.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Transition */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">מעבר:</span>
          {TRANSITIONS.map(t => (
            <button key={t} onClick={() => setTransition(t)}
              className={`px-3 py-1 rounded-full text-sm border transition-all ${
                transition === t ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-500'
              }`}>{t}</button>
          ))}
        </div>

        {/* Controls */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold">שליטה בזמן אמת</h3>

          {/* Master brightness */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>בהירות כללית</span><span>{masterBrightness}%</span></div>
            <input type="range" min="0" max="100" value={masterBrightness} onChange={e => setMasterBrightness(+e.target.value)} className="w-full accent-accent" />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-2">
            {['הפעל', 'עצור', 'סיבוב', 'אקראי'].map(a => (
              <button key={a} className="py-2 rounded-xl text-xs bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 transition-all">{a}</button>
            ))}
          </div>
        </div>

        {/* Audio reactive */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Music2 size={16} className="text-accent" /> Audio Reactive
            </h3>
            <button
              onClick={() => setAudioReactive(!audioReactive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                audioReactive ? 'bg-accent' : 'bg-white/10'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                audioReactive ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {audioReactive && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {['מיקרופון', 'AUX', 'Bluetooth'].map(src => (
                  <button key={src} className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 hover:bg-white/10 transition-all border border-white/10">{src}</button>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1"><span>רגישות</span><span>{sensitivity}%</span></div>
                <input type="range" min="0" max="100" value={sensitivity} onChange={e => setSensitivity(+e.target.value)} className="w-full accent-accent" />
              </div>
              {/* Fake audio visualizer */}
              <div className="flex items-end gap-0.5 h-8">
                {Array.from({length: 24}).map((_,i) => (
                  <div key={i} className="flex-1 bg-accent/40 rounded-sm animate-pulse" style={{height: `${20 + Math.random()*60}%`, animationDelay: `${i*50}ms`}} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Projector toggle */}
        <button
          onClick={toggleProjectorMode}
          className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
            isProjectorMode
              ? 'bg-green-600 hover:bg-green-700 accent-glow'
              : 'bg-accent hover:bg-accent-hover accent-glow'
          }`}
        >
          <Radio size={22} />
          {isProjectorMode ? 'עצור שידור' : 'התחל שידור'}
        </button>
      </div>
    </AppShell>
  );
}
