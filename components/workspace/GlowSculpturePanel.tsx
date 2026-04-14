'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { GlowContourStyle, GlowColorPreset, GlowBackgroundType } from '@/lib/types';

const CONTOUR_STYLES: { id: GlowContourStyle; label: string; emoji: string }[] = [
  { id: 'neon-sign',    label: 'Neon Sign',   emoji: '💡' },
  { id: 'light-paint',  label: 'Light Paint', emoji: '🖌' },
  { id: 'plasma',       label: 'Plasma',      emoji: '⚡' },
  { id: 'laser',        label: 'Laser',       emoji: '🔴' },
  { id: 'molten',       label: 'Molten',      emoji: '🌋' },
  { id: 'ethereal',     label: 'Ethereal',    emoji: '👻' },
];

const COLOR_PRESETS: { id: GlowColorPreset; label: string; colors: string[] }[] = [
  { id: 'cyber',    label: 'Cyber',    colors: ['#00ffff', '#ff00ff'] },
  { id: 'vapor',    label: 'Vapor',    colors: ['#ff6ec7', '#8b5cf6'] },
  { id: 'solar',    label: 'Solar',    colors: ['#ffd700', '#ff4500'] },
  { id: 'toxic',    label: 'Toxic',    colors: ['#39ff14', '#ccff00'] },
  { id: 'ice',      label: 'Ice',      colors: ['#87ceeb', '#ffffff'] },
  { id: 'blood',    label: 'Blood',    colors: ['#8b0000', '#ff2222'] },
  { id: 'aurora',   label: 'Aurora',   colors: ['#00ffcc', '#ff66ff', '#66ff99'] },
  { id: 'mono',     label: 'Mono',     colors: ['#ffffff'] },
  { id: 'phantom',  label: 'Phantom',  colors: ['#4a0080', '#f0f0ff'] },
];

function SliderRow({ label, value, min = 0, max = 1, step = 0.05, onChange, displayAs }: {
  label: string; value: number; min?: number; max?: number; step?: number;
  onChange: (v: number) => void; displayAs?: 'pct' | 'raw';
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ar-text-muted w-36 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-ar-accent h-1"
      />
      <span className="text-xs text-ar-text-dim w-8 text-right">
        {displayAs === 'raw' ? Math.round(value) : `${Math.round(value * 100)}%`}
      </span>
    </div>
  );
}

export default function GlowSculpturePanel() {
  const { project, updateGlowSculptureSettings } = useArtReviveStore();
  const s = project.glowSculptureSettings;
  const upd = updateGlowSculptureSettings;

  return (
    <aside className="w-72 shrink-0 border-r border-ar-border bg-ar-panel flex flex-col overflow-y-auto">
      <div className="p-4 space-y-5">

        {/* Contour Style */}
        <section>
          <h3 className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">Contour Style</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {CONTOUR_STYLES.map((cs) => (
              <button
                key={cs.id}
                onClick={() => upd({ contourStyle: cs.id })}
                className={`px-2 py-2 rounded-md text-xs border transition-colors flex flex-col items-center gap-0.5 ${
                  s.contourStyle === cs.id
                    ? 'bg-ar-accent/20 border-ar-accent/60 text-ar-accent'
                    : 'bg-ar-surface border-ar-border text-ar-text-muted hover:text-ar-text hover:border-ar-text-dim'
                }`}
              >
                <span>{cs.emoji}</span>
                <span>{cs.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Color */}
        <section>
          <h3 className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">Color</h3>
          <div className="flex rounded border border-ar-border overflow-hidden mb-2 text-xs">
            {(['single', 'dual-gradient', 'multi-gradient'] as const).map((m) => (
              <button
                key={m}
                onClick={() => upd({ colorMode: m })}
                className={`flex-1 py-1.5 transition-colors ${
                  s.colorMode === m ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-muted hover:text-ar-text'
                }`}
              >
                {m === 'single' ? 'Single' : m === 'dual-gradient' ? 'Dual' : 'Multi'}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {COLOR_PRESETS.map((cp) => (
              <button
                key={cp.id}
                onClick={() => upd({ colorPreset: cp.id })}
                className={`px-2 py-1.5 rounded-md border text-xs transition-colors flex items-center gap-1.5 ${
                  s.colorPreset === cp.id
                    ? 'border-ar-accent/60 text-ar-accent bg-ar-accent/10'
                    : 'border-ar-border text-ar-text-muted hover:text-ar-text bg-ar-surface'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    background: cp.colors.length === 1
                      ? cp.colors[0]
                      : `linear-gradient(135deg, ${cp.colors.join(', ')})`,
                  }}
                />
                {cp.label}
              </button>
            ))}
          </div>
        </section>

        {/* Background */}
        <section>
          <h3 className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">Background</h3>
          <div className="flex rounded border border-ar-border overflow-hidden text-xs">
            {([
              { id: 'pure-black',    label: 'Pure Black' },
              { id: 'deep-dark',     label: 'Deep Dark' },
              { id: 'textured-dark', label: 'Textured' },
            ] as { id: GlowBackgroundType; label: string }[]).map((b) => (
              <button
                key={b.id}
                onClick={() => upd({ backgroundType: b.id })}
                className={`flex-1 py-1.5 transition-colors ${
                  s.backgroundType === b.id ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-muted hover:text-ar-text'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </section>

        {/* Shape controls */}
        <section>
          <h3 className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">Shape</h3>
          <div className="space-y-2">
            <SliderRow label="Line Thickness" value={s.lineThickness} min={1} max={10} step={0.5} displayAs="raw" onChange={(v) => upd({ lineThickness: v })} />
            <SliderRow label="Contour Smoothing" value={s.contourSmoothing} onChange={(v) => upd({ contourSmoothing: v })} />
            <SliderRow label="Detail Reduction" value={s.detailReduction} onChange={(v) => upd({ detailReduction: v })} />
            <SliderRow label="Line Taper" value={s.lineTaper} onChange={(v) => upd({ lineTaper: v })} />
          </div>
        </section>

        {/* Glow controls */}
        <section>
          <h3 className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">Glow Engine</h3>
          <div className="space-y-2">
            <SliderRow label="Glow Intensity" value={s.glowIntensity} onChange={(v) => upd({ glowIntensity: v })} />
            <SliderRow label="Glow Radius" value={s.glowRadius} onChange={(v) => upd({ glowRadius: v })} />
            <SliderRow label="Glow Softness" value={s.glowSoftness} onChange={(v) => upd({ glowSoftness: v })} />
            <SliderRow label="Core Brightness" value={s.coreBrightness} onChange={(v) => upd({ coreBrightness: v })} />
            <SliderRow label="Bloom Layers" value={s.bloomLayers} min={1} max={5} step={1} displayAs="raw" onChange={(v) => upd({ bloomLayers: v })} />
            <SliderRow label="Ambient Scatter" value={s.ambientLightScatter} onChange={(v) => upd({ ambientLightScatter: v })} />
          </div>
        </section>

        {/* Custom prompt */}
        <section>
          <h3 className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">Custom Direction</h3>
          <textarea
            value={s.customStylePrompt}
            onChange={(e) => upd({ customStylePrompt: e.target.value })}
            placeholder="Additional style direction..."
            rows={3}
            className="w-full bg-ar-surface border border-ar-border rounded-md px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim focus:outline-none focus:border-ar-accent/60 resize-none"
          />
        </section>

      </div>
    </aside>
  );
}
