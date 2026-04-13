'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { HouseWorldPreset } from '@/lib/types';

const WORLD_PRESETS: { id: HouseWorldPreset; label: string; emoji: string }[] = [
  { id: 'forest',  label: 'Forest',  emoji: '🌿' },
  { id: 'sea',     label: 'Sea',     emoji: '🌊' },
  { id: 'fire',    label: 'Fire',    emoji: '🔥' },
  { id: 'spirit',  label: 'Spirit',  emoji: '👻' },
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨' },
  { id: 'ice',     label: 'Ice',     emoji: '❄️' },
  { id: 'crystal', label: 'Crystal', emoji: '💎' },
  { id: 'shadow',  label: 'Shadow',  emoji: '🌑' },
  { id: 'floral',  label: 'Floral',  emoji: '🌸' },
  { id: 'machine', label: 'Machine', emoji: '⚙️' },
];

const SLIDERS = [
  { key: 'geometryPreservation',          label: 'Geometry Preservation',  color: 'accent' },
  { key: 'facadePreservation',            label: 'Facade Preservation',    color: 'accent' },
  { key: 'windowAlignmentPreservation',   label: 'Window Alignment',       color: 'accent' },
  { key: 'surfaceTransformationStrength', label: 'Surface Transform',      color: 'violet' },
  { key: 'projectionIntensity',           label: 'Projection Intensity',   color: 'violet' },
  { key: 'glowAmount',                    label: 'Glow Amount',            color: 'violet' },
  { key: 'darknessContrast',              label: 'Darkness & Contrast',    color: 'violet' },
  { key: 'ornamentationLevel',            label: 'Ornamentation Level',    color: 'violet' },
  { key: 'atmosphereStrength',            label: 'Atmosphere',             color: 'violet' },
] as const;

export default function HouseProjectionPanel() {
  const { project, updateHouseProjectionSettings } = useArtReviveStore();
  const s = project.houseProjectionSettings;

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-ar-text uppercase tracking-widest">🏠 House Projection</p>
        <p className="text-[10px] text-ar-text-dim mt-0.5">Facade-aligned projection art — preserves building geometry</p>
      </div>

      {/* ── World presets ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">Projection World</p>
        <div className="grid grid-cols-2 gap-1">
          {WORLD_PRESETS.map((w) => (
            <button key={w.id}
              onClick={() => updateHouseProjectionSettings({ worldPreset: w.id })}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-sm transition-all ${
                s.worldPreset === w.id
                  ? 'border-ar-accent bg-ar-accent/10 text-ar-text'
                  : 'border-ar-border bg-ar-surface text-ar-text-muted hover:border-ar-accent/40 hover:text-ar-text'
              }`}>
              <span>{w.emoji}</span>
              <span className="text-xs font-medium">{w.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => updateHouseProjectionSettings({ worldPreset: null })}
          className={`mt-1 w-full py-1.5 rounded-md border text-xs transition-all ${
            s.worldPreset === null
              ? 'border-ar-accent/60 bg-ar-accent/10 text-ar-accent'
              : 'border-ar-border bg-ar-surface text-ar-text-dim hover:border-ar-accent/30'
          }`}>
          ✕ Custom prompt only
        </button>
      </div>

      {/* ── Custom prompt ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-1.5">Custom Projection Prompt</p>
        <textarea value={s.customStylePrompt}
          onChange={(e) => updateHouseProjectionSettings({ customStylePrompt: e.target.value })}
          placeholder="e.g. enchanted forest facade with glowing roots crawling up walls, moss filling facade panels..."
          rows={3}
          className="w-full bg-ar-surface border border-ar-border rounded-lg px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-accent/60"
        />
      </div>

      {/* ── Preservation sliders ─────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-accent uppercase tracking-widest mb-2">↑ Preservation</p>
        <div className="space-y-2.5">
          {SLIDERS.filter(sl => sl.color === 'accent').map(({ key, label }) => (
            <SliderRow key={key} label={label} value={s[key] as number}
              onChange={(v) => updateHouseProjectionSettings({ [key]: v })} />
          ))}
        </div>
      </div>

      {/* ── Projection sliders ───────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">↓ Projection Art</p>
        <div className="space-y-2.5">
          {SLIDERS.filter(sl => sl.color === 'violet').map(({ key, label }) => (
            <SliderRow key={key} label={label} value={s[key] as number}
              onChange={(v) => updateHouseProjectionSettings({ [key]: v })} />
          ))}
        </div>
      </div>

    </div>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-ar-text-muted">{label}</span>
        <span className="text-xs text-ar-text-dim">{Math.round(value * 100)}%</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full" />
    </div>
  );
}
