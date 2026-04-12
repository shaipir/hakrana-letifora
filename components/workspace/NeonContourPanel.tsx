'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { NeonContourSettings, NeonAnimationMode, FlowDirection } from '@/lib/types';

const NEON_PRESETS = [
  { label: 'Cyan', color: '#00ffff' },
  { label: 'Magenta', color: '#ff00ff' },
  { label: 'Electric', color: '#39ff14' },
  { label: 'Gold', color: '#f0c040' },
  { label: 'Orange', color: '#ff6b00' },
  { label: 'Violet', color: '#8b5cf6' },
  { label: 'White', color: '#e8e8f0' },
  { label: 'Pink', color: '#ff2d78' },
];

const ANIMATION_MODES: { value: NeonAnimationMode; label: string; desc: string }[] = [
  { value: 'flow', label: 'Flow', desc: 'Light dashes travel along edges' },
  { value: 'pulse', label: 'Pulse', desc: 'Glow breathes in and out' },
  { value: 'electric', label: 'Electric', desc: 'Rapid flicker + lightning' },
];

const FLOW_DIRECTIONS: { value: FlowDirection; label: string }[] = [
  { value: 'left-right', label: '→ Right' },
  { value: 'right-left', label: '← Left' },
  { value: 'top-bottom', label: '↓ Down' },
  { value: 'bottom-top', label: '↑ Up' },
  { value: 'radial', label: '◎ Radial' },
];

export default function NeonContourPanel() {
  const { project, updateNeonContourSettings } = useArtReviveStore();
  const s = project.neonContourSettings;

  function update(patch: Partial<NeonContourSettings>) {
    updateNeonContourSettings(patch);
  }

  function slider(
    label: string,
    key: keyof Pick<NeonContourSettings, 'edgeSensitivity' | 'lineDensity' | 'contourSimplification' | 'backgroundDarkness' | 'glowStrength' | 'speed'>,
    min = 0,
    max = 1,
    step = 0.05
  ) {
    const val = s[key] as number;
    return (
      <div key={key} className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-ar-text-muted">{label}</span>
          <span className="text-xs text-ar-text-dim font-mono">{Math.round(val * 100)}%</span>
        </div>
        <input
          type="range"
          min={min} max={max} step={step}
          value={val}
          onChange={(e) => update({ [key]: parseFloat(e.target.value) })}
        />
      </div>
    );
  }

  return (
    <aside className="w-64 shrink-0 bg-ar-panel border-r border-ar-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ar-border">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-ar-accent">Neon Contour</h2>
        <p className="text-xs text-ar-text-muted mt-0.5">Animated edge art</p>
      </div>

      <div className="flex flex-col gap-5 p-4 flex-1">
        {/* Neon Color */}
        <section>
          <p className="text-xs text-ar-text-muted uppercase tracking-widest mb-2">Neon Color</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {NEON_PRESETS.map((p) => (
              <button
                key={p.color}
                onClick={() => update({ neonColor: p.color })}
                title={p.label}
                className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  s.neonColor === p.color ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}60` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={s.neonColor}
              onChange={(e) => update({ neonColor: e.target.value })}
              className="w-8 h-8 rounded border border-ar-border bg-ar-surface cursor-pointer"
            />
            <span className="text-xs text-ar-text-dim font-mono">{s.neonColor}</span>
          </div>
        </section>

        <div className="ar-divider" />

        {/* Edge controls */}
        <section className="space-y-4">
          <p className="text-xs text-ar-text-muted uppercase tracking-widest">Edge Detection</p>
          {slider('Edge Sensitivity', 'edgeSensitivity')}
          {slider('Line Density', 'lineDensity')}
          {slider('Simplification', 'contourSimplification')}

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-ar-text-muted">Line Thickness</span>
              <span className="text-xs text-ar-text-dim font-mono">{s.lineThickness}px</span>
            </div>
            <input
              type="range" min={1} max={8} step={0.5}
              value={s.lineThickness}
              onChange={(e) => update({ lineThickness: parseFloat(e.target.value) })}
            />
          </div>
        </section>

        <div className="ar-divider" />

        {/* Glow + bg */}
        <section className="space-y-4">
          <p className="text-xs text-ar-text-muted uppercase tracking-widest">Appearance</p>
          {slider('Glow Strength', 'glowStrength')}
          {slider('Background Darkness', 'backgroundDarkness')}
        </section>

        <div className="ar-divider" />

        {/* Animation mode */}
        <section>
          <p className="text-xs text-ar-text-muted uppercase tracking-widest mb-2">Animation</p>
          <div className="space-y-1.5">
            {ANIMATION_MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => update({ animationMode: m.value })}
                className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${
                  s.animationMode === m.value
                    ? 'bg-ar-accent/10 border border-ar-accent/40 text-ar-accent'
                    : 'bg-ar-surface border border-ar-border text-ar-text-muted hover:text-ar-text'
                }`}
              >
                <span className="font-medium">{m.label}</span>
                <span className="block text-ar-text-dim mt-0.5">{m.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Flow direction (only for 'flow' mode) */}
        {s.animationMode === 'flow' && (
          <section>
            <p className="text-xs text-ar-text-muted uppercase tracking-widest mb-2">Flow Direction</p>
            <div className="grid grid-cols-2 gap-1">
              {FLOW_DIRECTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => update({ flowDirection: d.value })}
                  className={`px-2 py-1.5 rounded text-xs transition-all ${
                    s.flowDirection === d.value
                      ? 'bg-ar-accent/10 border border-ar-accent/40 text-ar-accent'
                      : 'bg-ar-surface border border-ar-border text-ar-text-muted hover:text-ar-text'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Speed */}
        <section className="space-y-4">
          {slider('Speed', 'speed')}
        </section>
      </div>
    </aside>
  );
}
