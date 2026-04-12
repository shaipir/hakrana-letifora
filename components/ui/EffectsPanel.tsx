'use client';
import { useAppStore } from '@/lib/store';
import type { EffectType } from '@/lib/types';

const EFFECTS: { id: EffectType; label: string; emoji: string }[] = [
  { id: 'none',        label: 'אין',          emoji: '-' },
  { id: 'kaleidoscope', label: 'Kaleidoscope', emoji: '✨' },
  { id: 'tunnel',      label: 'Tunnel',       emoji: '🌀' },
  { id: 'colorshift',  label: 'Color Shift',  emoji: '🌈' },
  { id: 'distort',     label: 'Distort',      emoji: '🌊' },
  { id: 'mirror',      label: 'Mirror',       emoji: '🔄' },
];

export default function EffectsPanel() {
  const { layers, activeLayerId, updateLayer } = useAppStore();
  const layer = layers.find(l => l.id === activeLayerId);

  if (!layer) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        בחר שכבה כדי לערוך אפקטים
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">אפקט</label>
        <div className="grid grid-cols-2 gap-1">
          {EFFECTS.map(fx => (
            <button
              key={fx.id}
              onClick={() => updateLayer(layer.id, { effect: fx.id })}
              className={`py-2 px-2 rounded-lg text-xs text-right transition-all ${
                layer.effect === fx.id
                  ? 'bg-accent text-white'
                  : 'bg-surface text-gray-400 hover:text-white hover:bg-muted'
              }`}
            >
              {fx.emoji} {fx.label}
            </button>
          ))}
        </div>
      </div>

      {/* Opacity */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">
          שקיפות — {Math.round(layer.opacity * 100)}%
        </label>
        <input
          type="range" min="0" max="100" value={Math.round(layer.opacity * 100)}
          onChange={e => updateLayer(layer.id, { opacity: Number(e.target.value) / 100 })}
          className="w-full accent-accent"
        />
      </div>

      {/* Blend Mode */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block">מצב עירבוב</label>
        <select
          value={layer.blendMode}
          onChange={e => updateLayer(layer.id, { blendMode: e.target.value as Layer['blendMode'] })}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-gray-200"
        >
          <option value="normal">Normal</option>
          <option value="multiply">Multiply</option>
          <option value="screen">Screen</option>
          <option value="overlay">Overlay</option>
          <option value="add">Add</option>
        </select>
      </div>
    </div>
  );
}
