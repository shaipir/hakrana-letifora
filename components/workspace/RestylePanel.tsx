'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { WorldPreset, VisualLanguagePreset, RestyleMode } from '@/lib/types';

const WORLD_PRESETS: { id: WorldPreset; label: string; emoji: string; hoverClass: string }[] = [
  { id: 'forest',  label: 'Forest',  emoji: '🌿', hoverClass: 'hover:border-green-500/50 hover:text-green-400' },
  { id: 'sea',     label: 'Sea',     emoji: '🌊', hoverClass: 'hover:border-blue-400/50 hover:text-blue-300' },
  { id: 'fire',    label: 'Fire',    emoji: '🔥', hoverClass: 'hover:border-orange-500/50 hover:text-orange-400' },
  { id: 'spirit',  label: 'Spirit',  emoji: '👻', hoverClass: 'hover:border-purple-400/50 hover:text-purple-300' },
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨', hoverClass: 'hover:border-yellow-400/50 hover:text-yellow-300' },
  { id: 'ice',     label: 'Ice',     emoji: '❄️', hoverClass: 'hover:border-cyan-300/50 hover:text-cyan-200' },
  { id: 'crystal', label: 'Crystal', emoji: '💎', hoverClass: 'hover:border-pink-400/50 hover:text-pink-300' },
  { id: 'shadow',  label: 'Shadow',  emoji: '🌑', hoverClass: 'hover:border-gray-400/50 hover:text-gray-300' },
  { id: 'floral',  label: 'Floral',  emoji: '🌸', hoverClass: 'hover:border-rose-400/50 hover:text-rose-300' },
  { id: 'machine', label: 'Machine', emoji: '⚙️', hoverClass: 'hover:border-zinc-400/50 hover:text-zinc-300' },
];

const VISUAL_LANGUAGES: { id: VisualLanguagePreset; label: string }[] = [
  { id: 'none',            label: 'None' },
  { id: 'bioluminescent',  label: '✨ Bioluminescent' },
  { id: 'sacred-geometry', label: '🔯 Sacred Geometry' },
  { id: 'mandala',         label: '🌀 Mandala' },
  { id: 'deep-dream',      label: '👁️ Deep Dream' },
  { id: 'visionary',       label: '🌌 Visionary' },
];

const PRESERVE_SLIDERS = [
  { key: 'identityPreservation', label: 'Identity Preservation' },
  { key: 'facePreservation',     label: 'Face Preservation' },
  { key: 'posePreservation',     label: 'Pose Preservation' },
  { key: 'preserveStructure',    label: 'Structure Preservation' },
] as const;

const TRANSFORM_SLIDERS = [
  { key: 'transformStrength',    label: 'Transform Strength' },
  { key: 'redesignMaterials',    label: 'Redesign Materials' },
  { key: 'redesignEnvironment',  label: 'Redesign Environment' },
  { key: 'fantasyStrength',      label: 'Fantasy Strength' },
  { key: 'realismVsStylization', label: 'Realism → Stylization' },
  { key: 'atmosphereStrength',   label: 'Atmosphere' },
] as const;

export default function RestylePanel() {
  const { project, updateRestyleSettings } = useArtReviveStore();
  const s = project.restyleSettings;

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">

      {/* ── Mode selector ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">Mode</p>
        <div className="flex rounded-lg border border-ar-border overflow-hidden">
          {(['preserve-characters', 'rebuild-characters'] as RestyleMode[]).map((m) => (
            <button key={m} onClick={() => updateRestyleSettings({ mode: m })}
              className={`flex-1 py-2 text-xs font-medium transition-colors ${
                s.mode === m
                  ? 'bg-ar-accent/15 text-ar-accent'
                  : 'bg-ar-surface text-ar-text-muted hover:text-ar-text'
              }`}>
              {m === 'preserve-characters' ? '🧬 Preserve Characters' : '🔮 Rebuild Characters'}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-ar-text-dim mt-1.5">
          {s.mode === 'preserve-characters'
            ? 'Keeps the original people/subjects. Transforms the world around them.'
            : 'Preserves composition only. Reinvents characters into world beings.'}
        </p>
      </div>

      {/* ── World presets ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">World</p>
        <div className="grid grid-cols-2 gap-1">
          {WORLD_PRESETS.map((w) => (
            <button key={w.id}
              onClick={() => updateRestyleSettings({ worldPreset: w.id })}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md border text-sm transition-all ${
                s.worldPreset === w.id
                  ? 'border-ar-accent bg-ar-accent/10 text-ar-text'
                  : `border-ar-border bg-ar-surface text-ar-text-muted ${w.hoverClass}`
              }`}>
              <span>{w.emoji}</span>
              <span className="text-xs font-medium">{w.label}</span>
            </button>
          ))}
        </div>
        <button onClick={() => updateRestyleSettings({ worldPreset: null })}
          className={`mt-1 w-full py-1.5 rounded-md border text-xs transition-all ${
            s.worldPreset === null
              ? 'border-ar-accent/60 bg-ar-accent/10 text-ar-accent'
              : 'border-ar-border bg-ar-surface text-ar-text-dim hover:border-ar-accent/30'
          }`}>
          ✕ No preset (use custom prompt only)
        </button>
      </div>

      {/* ── Visual language ──────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">Visual Language</p>
        <div className="flex flex-col gap-1">
          {VISUAL_LANGUAGES.map((v) => (
            <button key={v.id}
              onClick={() => updateRestyleSettings({ visualLanguage: v.id })}
              className={`px-2.5 py-1.5 rounded-md border text-xs text-left transition-all ${
                s.visualLanguage === v.id
                  ? 'border-ar-violet/60 bg-ar-violet/10 text-ar-text'
                  : 'border-ar-border bg-ar-surface text-ar-text-muted hover:border-ar-violet/30 hover:text-ar-text'
              }`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Custom prompt ────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-1.5">Custom Style Prompt</p>
        <textarea value={s.customStylePrompt}
          onChange={(e) => updateRestyleSettings({ customStylePrompt: e.target.value })}
          placeholder="e.g. transform the subject into a living forest spirit made of bark, roots, and glowing moss..."
          rows={3}
          className="w-full bg-ar-surface border border-ar-border rounded-lg px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-accent/60"
        />
      </div>

      {/* ── Preservation sliders ──────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-accent uppercase tracking-widest mb-2">↑ Preservation</p>
        <div className="space-y-2.5">
          {PRESERVE_SLIDERS.map(({ key, label }) => (
            <SliderRow key={key} label={label} value={s[key] as number}
              onChange={(v) => updateRestyleSettings({ [key]: v })} />
          ))}
        </div>
      </div>

      {/* ── Transform sliders ─────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">↓ Transformation</p>
        <div className="space-y-2.5">
          {TRANSFORM_SLIDERS.map(({ key, label }) => (
            <SliderRow key={key} label={label} value={s[key] as number}
              onChange={(v) => updateRestyleSettings({ [key]: v })} />
          ))}
        </div>
      </div>

      {/* ── Reshape ───────────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold text-ar-text-muted uppercase tracking-widest mb-2">✦ Reshape</p>
        <SliderRow label="Reshape Strength" value={s.reshapeStrength}
          onChange={(v) => updateRestyleSettings({ reshapeStrength: v })} />
        <textarea value={s.customReshapePrompt}
          onChange={(e) => updateRestyleSettings({ customReshapePrompt: e.target.value })}
          placeholder="e.g. make the silhouette taller and more elegant, widen the shoulders..."
          rows={2}
          className="mt-2 w-full bg-ar-surface border border-ar-border rounded-lg px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-accent/60"
        />
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
