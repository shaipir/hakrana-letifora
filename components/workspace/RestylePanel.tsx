'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { StyleWorld } from '@/lib/types';
import { STYLE_WORLD_PRESETS } from '@/lib/restyle/presets';
import { ART_DIRECTION_PRESETS } from '@/lib/restyle/art-direction-presets';

// Split into visionary (top) and world (bottom) groups
const VISIONARY_PRESETS = STYLE_WORLD_PRESETS.filter((p) =>
  ['bioluminescent', 'sacred-geometry', 'kaleidoscopic', 'deep-dream', 'visionary'].includes(p.id)
);
const WORLD_PRESETS = STYLE_WORLD_PRESETS.filter((p) =>
  ['forest', 'sea', 'fire', 'spirit', 'cartoon', 'ice', 'crystal', 'shadow', 'floral', 'machine'].includes(p.id)
);

const SLIDERS = [
  { key: 'transformStrength',     label: 'Transform Strength' },
  { key: 'preserveStructure',     label: 'Preserve Structure' },
  { key: 'redesignCharacters',    label: 'Redesign Characters' },
  { key: 'redesignMaterials',     label: 'Redesign Materials' },
  { key: 'redesignEnvironment',   label: 'Redesign Environment' },
  { key: 'fantasyStrength',       label: 'Fantasy Strength' },
  { key: 'realismVsStylization',  label: 'Realism → Stylization' },
  { key: 'atmosphereStrength',    label: 'Atmosphere' },
] as const;

export default function RestylePanel() {
  const { project, updateRestyleSettings } = useArtReviveStore();
  const s = project.restyleSettings;

  return (
    <div className="flex flex-col gap-5 p-4">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-ar-text uppercase tracking-widest">World Rebuild</p>
        <p className="text-[10px] text-ar-text-dim mt-0.5">Structural re-creation into a new world</p>
      </div>

      {/* ── Art Direction ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{color: '#ff6b35'}}>
          ⚡ Art Direction
        </p>
        <p className="text-[10px] text-ar-text-dim mb-2">AI-generated from prompt. Requires Gemini key in Settings.</p>
        <div className="flex flex-col gap-1.5">
          {ART_DIRECTION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                updateRestyleSettings({ styleWorld: null, customStylePrompt: p.prompt });
              }}
              className={`w-full flex items-start gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                s.customStylePrompt === p.prompt
                  ? 'border-orange-500/60 bg-orange-500/10'
                  : 'border-ar-border bg-ar-surface hover:border-orange-500/30'
              }`}
            >
              <span className="text-base leading-none mt-0.5">{p.emoji}</span>
              <div>
                <p className={`text-xs font-semibold ${s.customStylePrompt === p.prompt ? 'text-orange-400' : 'text-ar-text'}`}>
                  {p.label}
                </p>
                <p className="text-[10px] text-ar-text-dim leading-tight mt-0.5">{p.tagline}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Visionary presets ────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-ar-accent uppercase tracking-widest mb-2">✦ Visionary</p>
        <div className="flex flex-col gap-1.5">
          {VISIONARY_PRESETS.map((p) => (
            <PresetCard key={p.id} preset={p} active={s.styleWorld === p.id}
              onSelect={() => updateRestyleSettings({ styleWorld: p.id as StyleWorld })} />
          ))}
        </div>
      </div>

      {/* ── World presets ─────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest mb-2">Worlds</p>
        <div className="grid grid-cols-2 gap-1">
          {WORLD_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateRestyleSettings({ styleWorld: p.id as StyleWorld })}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-left transition-all ${
                s.styleWorld === p.id
                  ? 'border-ar-accent/60 bg-ar-accent/10 text-ar-text'
                  : 'border-ar-border bg-ar-surface text-ar-text-muted hover:border-ar-accent/30 hover:text-ar-text'
              }`}
            >
              <span className="text-sm">{p.emoji}</span>
              <span className="text-xs font-medium">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom prompt ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest mb-1.5">Custom World Prompt</p>
        <textarea
          value={s.customStylePrompt}
          onChange={(e) => updateRestyleSettings({ customStylePrompt: e.target.value })}
          placeholder="e.g. transform the figure into a butterfly-like forest spirit made of bark, roots, glowing moss, and floating leaves..."
          rows={3}
          className="w-full bg-ar-surface border border-ar-border rounded-lg px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-accent/60"
        />
      </div>

      {/* ── Sliders ──────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest">Parameters</p>
        {SLIDERS.map(({ key, label }) => (
          <div key={key}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-ar-text-muted">{label}</span>
              <span className="text-xs text-ar-text-dim">{Math.round((s[key] as number) * 100)}%</span>
            </div>
            <input
              type="range" min={0} max={1} step={0.01}
              value={s[key] as number}
              onChange={(e) => updateRestyleSettings({ [key]: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Preset Card (visionary row) ───────────────────────────────────────────────
function PresetCard({
  preset,
  active,
  onSelect,
}: {
  preset: typeof STYLE_WORLD_PRESETS[0];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
        active
          ? 'border-ar-accent bg-ar-accent/10'
          : 'border-ar-border bg-ar-surface hover:border-ar-accent/40'
      }`}
    >
      <span className="text-xl leading-none mt-0.5">{preset.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${active ? 'text-ar-accent' : 'text-ar-text'}`}>{preset.label}</span>
        </div>
        <p className="text-[10px] text-ar-text-dim mt-0.5 leading-tight">{preset.tagline}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {preset.colorKeywords.slice(0, 3).map((kw) => (
            <span key={kw} className="px-1.5 py-0.5 rounded text-[9px] bg-ar-bg border border-ar-border/60 text-ar-text-dim">{kw}</span>
          ))}
        </div>
      </div>
    </button>
  );
}
