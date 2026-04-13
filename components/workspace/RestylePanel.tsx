'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { StyleWorld } from '@/lib/types';

const WORLDS: { id: StyleWorld; label: string; emoji: string; desc: string }[] = [
  { id: 'forest',  label: 'Forest',  emoji: '🌿', desc: 'bark, moss, roots, mist' },
  { id: 'sea',     label: 'Sea',     emoji: '🌊', desc: 'coral, water, deep glow' },
  { id: 'fire',    label: 'Fire',    emoji: '🔥', desc: 'flame, ember, molten heat' },
  { id: 'spirit',  label: 'Spirit',  emoji: '👻', desc: 'ethereal, ghostly, cold glow' },
  { id: 'cartoon', label: 'Cartoon', emoji: '🎨', desc: 'bold lines, vivid stylization' },
  { id: 'ice',     label: 'Ice',     emoji: '❄️', desc: 'frost, crystal, pale light' },
  { id: 'crystal', label: 'Crystal', emoji: '💎', desc: 'prismatic, rainbow refraction' },
  { id: 'shadow',  label: 'Shadow',  emoji: '🌑', desc: 'dark, purple, high contrast' },
  { id: 'floral',  label: 'Floral',  emoji: '🌸', desc: 'bloom, petal, dreamy soft' },
  { id: 'machine', label: 'Machine', emoji: '⚙️', desc: 'green terminal, metal, grid' },
];

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
    <aside className="w-64 shrink-0 bg-ar-panel border-r border-ar-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ar-border">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-ar-accent">WORLD REBUILD</h2>
        <p className="text-xs text-ar-text-muted mt-0.5">Structural re-creation into a new world</p>
      </div>

      <div className="flex flex-col gap-5 p-4">
        <div>
          <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-widest mb-3">World</p>
          <div className="grid grid-cols-2 gap-1.5">
            {WORLDS.map((w) => (
              <button
                key={w.id}
                onClick={() => updateRestyleSettings({ styleWorld: w.id })}
                className={`flex flex-col items-start px-2.5 py-2 rounded-lg border text-left transition-all ${
                  s.styleWorld === w.id
                    ? 'border-ar-accent bg-ar-accent/10 text-ar-text'
                    : 'border-ar-border bg-ar-surface text-ar-text-muted hover:border-ar-accent/40 hover:text-ar-text'
                }`}
              >
                <span className="text-base leading-none mb-0.5">{w.emoji}</span>
                <span className="text-xs font-medium">{w.label}</span>
                <span className="text-[10px] text-ar-text-dim leading-tight mt-0.5">{w.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-widest mb-2">Custom Style</p>
          <textarea
            value={s.customStylePrompt}
            onChange={(e) => updateRestyleSettings({ customStylePrompt: e.target.value })}
            placeholder="e.g. transform the subject into a living forest spirit made of bark, roots, and glowing moss..."
            rows={3}
            className="w-full bg-ar-surface border border-ar-border rounded-lg px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-accent/60"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-widest">Parameters</p>
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
    </aside>
  );
}
