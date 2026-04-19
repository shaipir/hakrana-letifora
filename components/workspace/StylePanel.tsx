'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { WorldPreset } from '@/lib/types';

const WORLDS: { id: WorldPreset; emoji: string; label: string; color: string }[] = [
  { id: 'forest',  emoji: '🌿', label: 'Forest',  color: 'hover:border-green-500/60 data-[active=true]:border-green-500/70 data-[active=true]:bg-green-500/10 data-[active=true]:text-green-300' },
  { id: 'sea',     emoji: '🌊', label: 'Sea',     color: 'hover:border-blue-400/60 data-[active=true]:border-blue-400/70 data-[active=true]:bg-blue-400/10 data-[active=true]:text-blue-200' },
  { id: 'fire',    emoji: '🔥', label: 'Fire',    color: 'hover:border-orange-400/60 data-[active=true]:border-orange-400/70 data-[active=true]:bg-orange-400/10 data-[active=true]:text-orange-300' },
  { id: 'spirit',  emoji: '👻', label: 'Spirit',  color: 'hover:border-purple-400/60 data-[active=true]:border-purple-400/70 data-[active=true]:bg-purple-400/10 data-[active=true]:text-purple-300' },
  { id: 'cartoon', emoji: '🎨', label: 'Cartoon', color: 'hover:border-yellow-400/60 data-[active=true]:border-yellow-400/70 data-[active=true]:bg-yellow-400/10 data-[active=true]:text-yellow-200' },
  { id: 'ice',     emoji: '❄️', label: 'Ice',     color: 'hover:border-cyan-300/60 data-[active=true]:border-cyan-300/70 data-[active=true]:bg-cyan-300/10 data-[active=true]:text-cyan-200' },
  { id: 'crystal', emoji: '💎', label: 'Crystal', color: 'hover:border-pink-400/60 data-[active=true]:border-pink-400/70 data-[active=true]:bg-pink-400/10 data-[active=true]:text-pink-300' },
  { id: 'shadow',  emoji: '🌑', label: 'Shadow',  color: 'hover:border-gray-400/60 data-[active=true]:border-gray-400/70 data-[active=true]:bg-gray-400/10 data-[active=true]:text-gray-300' },
  { id: 'floral',  emoji: '🌸', label: 'Floral',  color: 'hover:border-rose-400/60 data-[active=true]:border-rose-400/70 data-[active=true]:bg-rose-400/10 data-[active=true]:text-rose-300' },
  { id: 'machine', emoji: '⚙️', label: 'Machine', color: 'hover:border-zinc-400/60 data-[active=true]:border-zinc-400/70 data-[active=true]:bg-zinc-400/10 data-[active=true]:text-zinc-300' },
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
    <div className="flex flex-col gap-4 p-4">

      {/* World presets — only for restyle + house */}
      {activeMode !== 'glow-sculpture' && (
        <div>
          <p className="text-[10px] text-ar-text-muted uppercase tracking-widest mb-2">Style</p>
          <div className="grid grid-cols-5 gap-1">
            {WORLDS.map((w) => (
              <button
                key={w.id}
                data-active={currentPreset === w.id}
                onClick={() => setPreset(w.id)}
                className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border border-ar-border text-[10px] text-ar-text-muted transition-all ${w.color}`}
              >
                <span className="text-sm leading-none">{w.emoji}</span>
                <span className="leading-none">{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Glow style — only for glow-sculpture */}
      {activeMode === 'glow-sculpture' && (
        <div>
          <p className="text-[10px] text-ar-text-muted uppercase tracking-widest mb-2">Contour Style</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(['neon-sign', 'light-paint', 'plasma', 'laser', 'molten', 'ethereal'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateGlowSculptureSettings({ contourStyle: s })}
                className={`py-1.5 rounded-lg border text-xs transition-all capitalize ${gs.contourStyle === s ? 'bg-ar-accent/15 border-ar-accent/50 text-ar-accent' : 'border-ar-border text-ar-text-muted hover:border-ar-border-subtle hover:text-ar-text'}`}
              >
                {s.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Color preset */}
          <p className="text-[10px] text-ar-text-muted uppercase tracking-widest mb-2 mt-3">Color</p>
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
        <p className="text-[10px] text-ar-text-muted uppercase tracking-widest mb-1.5">Custom prompt</p>
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
        <div className="space-y-2 border-t border-ar-border pt-3">
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
