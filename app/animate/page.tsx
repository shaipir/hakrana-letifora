'use client';
import { useState } from 'react';
import { Zap, Play, Pause } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import AppShell from '@/components/navigation/AppShell';
import type { AnimationType } from '@/lib/types';

const ANIMATIONS: { id: AnimationType; label: string; emoji: string; category: string }[] = [
  { id: 'pulse',            label: 'Pulse',            emoji: '🟣', category: 'בסיסי' },
  { id: 'glow',             label: 'Glow',             emoji: '✨', category: 'בסיסי' },
  { id: 'flicker',          label: 'Flicker',          emoji: '🕯️', category: 'בסיסי' },
  { id: 'breathing',        label: 'Breathing',        emoji: '🌬️', category: 'בסיסי' },
  { id: 'shimmer',          label: 'Shimmer',          emoji: '💚', category: 'בסיסי' },
  { id: 'flow',             label: 'Flow',             emoji: '🌊', category: 'תנועה' },
  { id: 'swirl',            label: 'Swirl',            emoji: '🌀', category: 'תנועה' },
  { id: 'drift',            label: 'Drift',            emoji: '🌫️', category: 'תנועה' },
  { id: 'ripple',           label: 'Ripple',           emoji: '📞', category: 'תנועה' },
  { id: 'liquid',           label: 'Liquid',           emoji: '🦚', category: 'תנועה' },
  { id: 'energy_veins',     label: 'Energy Veins',     emoji: '⚡', category: 'אנרגיה' },
  { id: 'crack_spread',     label: 'Crack Spread',     emoji: '🕳️', category: 'אנרגיה' },
  { id: 'inner_light',      label: 'Inner Light',      emoji: '💡', category: 'אנרגיה' },
  { id: 'fire',             label: 'Fire',             emoji: '🔥', category: 'אלמנטים' },
  { id: 'smoke',            label: 'Smoke',            emoji: '💨', category: 'אלמנטים' },
  { id: 'floating_particles',label: 'Particles',       emoji: '•••', category: 'אלמנטים' },
  { id: 'eye_shine',        label: 'Eye Shine',        emoji: '👁️', category: 'מיוחד' },
  { id: 'melting',          label: 'Melting',          emoji: '🧈', category: 'מיוחד' },
  { id: 'shadow_crawl',     label: 'Shadow Crawl',     emoji: '🐹', category: 'מיוחד' },
  { id: 'glitch',           label: 'Glitch',           emoji: '🖥️', category: 'מיוחד' },
];

const LOOP_DURATIONS = [1,2,3,4,5,8,10];
const CATEGORIES = ['בסיסי', 'תנועה', 'אנרגיה', 'אלמנטים', 'מיוחד'];

export default function AnimatePage() {
  const { layers, activeLayerId, updateLayer, loopDuration } = useAppStore();
  const layer = layers.find(l => l.id === activeLayerId);
  const [playing, setPlaying] = useState(false);
  const [activeCategory, setActiveCategory] = useState('בסיסי');
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(50);
  const [duration, setDuration] = useState(3);

  const filtered = ANIMATIONS.filter(a => a.category === activeCategory);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-5">

        {/* Preview */}
        <div className="aspect-video rounded-2xl glass relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black animate-pulse-slow" />
          <button onClick={() => setPlaying(!playing)} className="relative z-10 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
            {playing ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>
          {layer && <div className="absolute bottom-3 left-3 text-xs text-gray-400">{layer.name}</div>}
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm border transition-all ${
                activeCategory === c ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400'
              }`}>{c}</button>
          ))}
        </div>

        {/* Animation presets */}
        <div className="grid grid-cols-4 gap-2">
          {filtered.map(a => (
            <button
              key={a.id}
              onClick={() => layer && updateLayer(layer.id, { animationPreset: a.id })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                layer?.animationPreset === a.id ? 'border-accent bg-accent/20' : 'border-white/10 hover:border-white/20 bg-white/5'
              }`}
            >
              <span className="text-xl">{a.emoji}</span>
              <span className="text-[10px] text-gray-300 text-center">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Motion controls */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold">שליטת תנועה</h3>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>עוצמה</span><span>{intensity}%</span>
            </div>
            <input type="range" min="0" max="100" value={intensity} onChange={e => setIntensity(+e.target.value)}
              className="w-full accent-accent" />
          </div>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>מהירות</span><span>{speed}%</span>
            </div>
            <input type="range" min="0" max="100" value={speed} onChange={e => setSpeed(+e.target.value)}
              className="w-full accent-accent" />
          </div>

          {/* Loop duration */}
          <div>
            <div className="text-xs text-gray-400 mb-2">אורך לופ</div>
            <div className="flex gap-2">
              {LOOP_DURATIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    duration === d ? 'bg-accent text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}>{d}s</button>
              ))}
            </div>
          </div>

          {/* Loop type */}
          <div>
            <div className="text-xs text-gray-400 mb-2">סוג לופ</div>
            <div className="grid grid-cols-3 gap-1">
              {['אוטומטי', 'חיתוך', 'הלוך-חזור'].map(t => (
                <button key={t} className="py-1.5 rounded-lg text-xs bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all">{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply button */}
        <button className="w-full py-3 bg-accent hover:bg-accent-hover rounded-xl font-semibold flex items-center justify-center gap-2 transition-all accent-glow">
          <Zap size={18} /> החל אנימציה
        </button>
      </div>
    </AppShell>
  );
}
