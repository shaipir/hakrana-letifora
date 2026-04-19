'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { WorldPreset, VisualLanguagePreset } from '@/lib/types';
import PresetCard from '@/components/ui/PresetCard';
import SectionLabel from '@/components/ui/SectionLabel';

const WORLDS: { id: WorldPreset; emoji: string; label: string; accent: string }[] = [
  { id: 'forest',  emoji: '🌿', label: 'Forest',  accent: 'green' },
  { id: 'sea',     emoji: '🌊', label: 'Sea',     accent: 'blue' },
  { id: 'fire',    emoji: '🔥', label: 'Fire',    accent: 'orange' },
  { id: 'spirit',  emoji: '👻', label: 'Spirit',  accent: 'violet' },
  { id: 'cartoon', emoji: '🎨', label: 'Cartoon', accent: 'cyan' },
  { id: 'ice',     emoji: '❄️', label: 'Ice',     accent: 'cyan' },
  { id: 'crystal', emoji: '💎', label: 'Crystal', accent: 'pink' },
  { id: 'shadow',  emoji: '🌑', label: 'Shadow',  accent: 'cyan' },
  { id: 'floral',  emoji: '🌸', label: 'Floral',  accent: 'pink' },
  { id: 'machine', emoji: '⚙️', label: 'Machine', accent: 'cyan' },
];

const VISUAL_LANGS: { id: VisualLanguagePreset; emoji: string; label: string }[] = [
  { id: 'none',            emoji: '○',  label: 'None' },
  { id: 'bioluminescent',  emoji: '✨', label: 'Bioluminescent' },
  { id: 'sacred-geometry', emoji: '🔯', label: 'Sacred Geometry' },
  { id: 'mandala',         emoji: '🌀', label: 'Mandala' },
  { id: 'deep-dream',      emoji: '👁️', label: 'Deep Dream' },
  { id: 'visionary',       emoji: '🌌', label: 'Visionary' },
];

export default function StylePanel() {
  const { activeMode, project, updateRestyleSettings, updateHouseProjectionSettings, updateGlowSculptureSettings } = useArtReviveStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const rs = project.restyleSettings;
  const hp = project.houseProjectionSettings;
  const gs = project.glowSculptureSettings;

  const currentPreset = activeMode === 'restyle' ? rs.worldPreset : activeMode === 'house-projection' ? hp.worldPreset : null;
  const customPrompt = activeMode === 'restyle' ? rs.customStylePrompt : activeMode === 'house-projection' ? hp.customStylePrompt : gs.customStylePrompt;

  function setPreset(id: WorldPreset) {
    if (activeMode === 'restyle') updateRestyleSettings({ worldPreset: id });
    else if (activeMode === 'house-projection') updateHouseProjectionSettings({ worldPreset: id });
  }

  function setPrompt(val: string) {
    if (activeMode === 'restyle') updateRestyleSettings({ customStylePrompt: val });
    else if (activeMode === 'house-projection') updateHouseProjectionSettings({ customStylePrompt: val });
    else updateGlowSculptureSettings({ customStylePrompt: val });
  }

  return (
    <div className="flex flex-col gap-4 p-4 animate-fade-up">

      {/* Character mode — restyle only */}
      {activeMode === 'restyle' && (
        <div className="flex rounded-lg border border-ar-border overflow-hidden">
          {([
            { id: 'preserve-characters' as const, emoji: '🧬', label: 'Preserve Characters' },
            { id: 'rebuild-characters'  as const, emoji: '🔮', label: 'Rebuild Characters'  },
          ]).map((m, i) => (
            <button
              key={m.id}
              onClick={() => updateRestyleSettings({ mode: m.id })}
              className={[
                'flex-1 flex flex-col items-center gap-1 py-2.5 px-1 text-[10px] font-medium transition-all duration-200',
                i === 0 ? 'border-r border-ar-border' : '',
                rs.mode === m.id
                  ? 'bg-ar-accent/10 text-ar-accent shadow-[inset_0_-2px_0_rgba(0,229,255,0.5)]'
                  : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface/30',
              ].join(' ')}
            >
              <span className="text-base leading-none">{m.emoji}</span>
              <span className="leading-tight text-center">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Visual Language — restyle only */}
      {activeMode === 'restyle' && (
        <div>
          <SectionLabel>Visual Language</SectionLabel>
          <div className="flex flex-col gap-1">
            {VISUAL_LANGS.map((vl) => {
              const active = rs.visualLanguage === vl.id;
              return (
                <button
                  key={vl.id}
                  onClick={() => updateRestyleSettings({ visualLanguage: vl.id })}
                  className={[
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all duration-200',
                    active
                      ? 'bg-ar-accent/10 border-ar-accent/40 text-ar-text shadow-[0_0_10px_rgba(0,229,255,0.15)]'
                      : 'border-ar-border text-ar-text-muted hover:border-ar-border-subtle hover:text-ar-text hover:bg-ar-surface/30',
                  ].join(' ')}
                >
                  <span className="text-base leading-none w-5 text-center">{vl.emoji}</span>
                  <span>{vl.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-ar-accent animate-pulse-dot" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* World presets — restyle + house */}
      {activeMode !== 'glow-sculpture' && (
        <div>
          <SectionLabel>World Style</SectionLabel>
          <div className="grid grid-cols-5 gap-1">
            {WORLDS.map((w) => (
              <PresetCard
                key={w.id}
                active={currentPreset === w.id}
                onClick={() => setPreset(w.id)}
                accentColor={w.accent}
              >
                <span className="text-sm leading-none">{w.emoji}</span>
                <span className="leading-none">{w.label}</span>
              </PresetCard>
            ))}
          </div>
        </div>
      )}

      {/* Glow style — glow-sculpture only */}
      {activeMode === 'glow-sculpture' && (
        <div>
          <SectionLabel>Contour Style</SectionLabel>
          <div className="grid grid-cols-2 gap-1.5">
            {(['neon-sign', 'light-paint', 'plasma', 'laser', 'molten', 'ethereal'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateGlowSculptureSettings({ contourStyle: s })}
                className={`py-1.5 rounded-lg border text-xs transition-all capitalize ${gs.contourStyle === s ? 'bg-ar-accent/15 border-ar-accent/50 text-ar-accent shadow-[0_0_8px_rgba(0,229,255,0.2)]' : 'border-ar-border text-ar-text-muted hover:border-ar-border-subtle hover:text-ar-text'}`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>

          <SectionLabel className="mt-3">Color</SectionLabel>
          <div className="flex flex-wrap gap-1">
            {(['cyber', 'vapor', 'solar', 'toxic', 'ice', 'blood', 'aurora', 'mono', 'phantom'] as const).map((c) => (
              <button
                key={c}
                onClick={() => updateGlowSculptureSettings({ colorPreset: c })}
                className={`px-2 py-0.5 rounded text-[10px] border transition-all capitalize ${gs.colorPreset === c ? 'bg-ar-accent/15 border-ar-accent/50 text-ar-accent' : 'border-ar-border text-ar-text-muted hover:text-ar-text'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom prompt */}
      <div>
        <SectionLabel>Custom prompt</SectionLabel>
        <textarea
          value={customPrompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the look you want…"
          rows={3}
          className="w-full bg-ar-surface border border-ar-border rounded-lg px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-accent/50 transition-colors"
        />
      </div>

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center justify-between w-full text-[10px] text-ar-text-muted hover:text-ar-text transition-colors"
      >
        <span className="uppercase tracking-widest">Advanced</span>
        {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showAdvanced && (
        <div className="space-y-2 border-t border-ar-border pt-3 animate-fade-up">
          {activeMode === 'restyle' && (
            <>
              {[
                { key: 'transformStrength' as const, label: 'Transform' },
                { key: 'preserveStructure' as const, label: 'Preserve Structure' },
                { key: 'fantasyStrength' as const, label: 'Fantasy' },
                { key: 'atmosphereStrength' as const, label: 'Atmosphere' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-ar-text-muted w-28 shrink-0">{label}</span>
                  <input type="range" min={0} max={1} step={0.05} value={rs[key]}
                    onChange={(e) => updateRestyleSettings({ [key]: parseFloat(e.target.value) })}
                    className="flex-1 accent-ar-accent h-1" />
                  <span className="text-[10px] text-ar-text-dim w-6 text-right font-mono">{Math.round(rs[key] * 100)}</span>
                </div>
              ))}
            </>
          )}

          {activeMode === 'house-projection' && (
            <>
              {[
                { key: 'geometryPreservation' as const, label: 'Geometry' },
                { key: 'facadePreservation' as const, label: 'Facade' },
                { key: 'surfaceTransformationStrength' as const, label: 'Transform' },
                { key: 'projectionIntensity' as const, label: 'Intensity' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-ar-text-muted w-28 shrink-0">{label}</span>
                  <input type="range" min={0} max={1} step={0.05} value={hp[key]}
                    onChange={(e) => updateHouseProjectionSettings({ [key]: parseFloat(e.target.value) })}
                    className="flex-1 accent-ar-accent h-1" />
                  <span className="text-[10px] text-ar-text-dim w-6 text-right font-mono">{Math.round(hp[key] * 100)}</span>
                </div>
              ))}
            </>
          )}

          {activeMode === 'glow-sculpture' && (
            <>
              {[
                { key: 'glowIntensity' as const, label: 'Glow' },
                { key: 'lineThickness' as const, label: 'Line Width', min: 1, max: 10, step: 0.5, pct: false },
                { key: 'contourSmoothing' as const, label: 'Smoothing' },
              ].map(({ key, label, min = 0, max = 1, step = 0.05, pct = true }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-ar-text-muted w-28 shrink-0">{label}</span>
                  <input type="range" min={min} max={max} step={step} value={gs[key]}
                    onChange={(e) => updateGlowSculptureSettings({ [key]: parseFloat(e.target.value) })}
                    className="flex-1 accent-ar-accent h-1" />
                  <span className="text-[10px] text-ar-text-dim w-6 text-right font-mono">
                    {pct ? Math.round((gs[key] as number) * 100) : gs[key]}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
