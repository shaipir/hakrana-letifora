'use client';
import { useAppStore } from '@/lib/store';
import type { EffectType, Layer, Theme, AnimationType } from '@/lib/types';

const EFFECTS: { id: EffectType; label: string; emoji: string }[] = [
  { id: 'none',         label: 'אין',         emoji: '□' },
  { id: 'kaleidoscope', label: 'Kaleidoscope', emoji: '✨' },
  { id: 'tunnel',       label: 'Tunnel',       emoji: '🌀' },
  { id: 'colorshift',   label: 'Color Shift',  emoji: '🌈' },
  { id: 'distort',      label: 'Distort',      emoji: '🌊' },
  { id: 'mirror',       label: 'Mirror',       emoji: '🔄' },
  { id: 'fire',         label: 'Fire',         emoji: '🔥' },
  { id: 'smoke',        label: 'Smoke',        emoji: '💨' },
  { id: 'glitch',       label: 'Glitch',       emoji: '🖥️' },
  { id: 'electricity',  label: 'Electric',     emoji: '⚡' },
  { id: 'pulse',        label: 'Pulse',        emoji: '🟣' },
];

const THEMES: { id: Theme; label: string; color: string }[] = [
  { id: 'cosmic',      label: 'Cosmic',    color: 'bg-purple-900/60' },
  { id: 'fire',        label: 'Fire',      color: 'bg-orange-900/60' },
  { id: 'ice',         label: 'Ice',       color: 'bg-cyan-900/60' },
  { id: 'gold',        label: 'Gold',      color: 'bg-yellow-900/60' },
  { id: 'cyberpunk',   label: 'Cyber',     color: 'bg-pink-900/60' },
  { id: 'divine',      label: 'Divine',    color: 'bg-amber-900/60' },
  { id: 'horror',      label: 'Horror',    color: 'bg-red-900/60' },
  { id: 'glitch',      label: 'Glitch',    color: 'bg-green-900/60' },
];

export default function EffectsPanel() {
  const { layers, activeLayerId, updateLayer } = useAppStore();
  const layer = layers.find(l => l.id === activeLayerId);

  if (!layer) {
    return <div className="p-4 text-center text-gray-600 text-xs">בחר שכבה כדי לערוך</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-3">

      {/* Theme */}
      <div>
        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">תמה</label>
        <div className="grid grid-cols-4 gap-1">
          {THEMES.map(t => (
            <button key={t.id} onClick={() => updateLayer(layer.id, { theme: layer.theme === t.id ? null : t.id })}
              className={`py-1.5 rounded-lg text-[10px] transition-all border ${
                layer.theme === t.id ? 'border-accent bg-accent/20 text-white' : `border-white/10 ${t.color} text-gray-400 hover:text-white`
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Effect */}
      <div>
        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">אפקט</label>
        <div className="grid grid-cols-3 gap-1">
          {EFFECTS.map(fx => (
            <button key={fx.id} onClick={() => updateLayer(layer.id, { effect: fx.id })}
              className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] transition-all border ${
                layer.effect === fx.id ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:text-white'
              }`}>
              <span>{fx.emoji}</span>{fx.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>שקיפות</span><span>{Math.round(layer.opacity * 100)}%</span>
        </div>
        <input type="range" min="0" max="100" value={Math.round(layer.opacity * 100)}
          onChange={e => updateLayer(layer.id, { opacity: +e.target.value / 100 })}
          className="w-full accent-accent" />
      </div>

      {/* Blend Mode */}
      <div>
        <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 block">מצב עירבוב</label>
        <select value={layer.blendMode}
          onChange={e => updateLayer(layer.id, { blendMode: e.target.value as Layer['blendMode'] })}
          className="w-full bg-surface border border-border rounded-lg px-2 py-1.5 text-xs text-gray-200">
          {['normal','multiply','screen','overlay','add','soft_light','difference','color_dodge'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Active region effects */}
      {layer.regions.length > 0 && (
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 block">אפקטים לאזורים</label>
          <div className="space-y-1">
            {layer.regions.map(region => (
              <div key={region.id} className="flex items-center gap-2 p-2 rounded-lg bg-surface border border-border/50">
                <span className="w-2 h-2 rounded-full shrink-0" style={{background: region.color}} />
                <span className="flex-1 text-[11px] text-gray-300 truncate">{region.name}</span>
                <select
                  value={region.animationPreset}
                  onChange={e => {
                    const updated = layer.regions.map(r =>
                      r.id === region.id ? {...r, animationPreset: e.target.value as AnimationType} : r
                    );
                    updateLayer(layer.id, { regions: updated });
                  }}
                  className="bg-transparent text-[10px] text-accent border border-accent/30 rounded px-1"
                >
                  {['none','pulse','glow','fire','smoke','glitch','inner_light','breathing'].map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
