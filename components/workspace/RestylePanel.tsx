'use client';

import { useArtReviveStore, RESTYLE_PRESET_PROMPTS } from '@/lib/artrevive-store';
import { RestyleSettings } from '@/lib/types';

const PRESETS: RestyleSettings['preset'][] = [
  'neon-projection',
  'dark-futuristic',
  'electric-energy',
  'liquid-light',
  'minimal-glow',
  'glowing-sculpture',
];

const PRESET_LABELS: Record<RestyleSettings['preset'], string> = {
  'neon-projection': 'Neon Projection',
  'dark-futuristic': 'Dark Futuristic',
  'electric-energy': 'Electric Energy',
  'liquid-light': 'Liquid Light',
  'minimal-glow': 'Minimal Glow',
  'glowing-sculpture': 'Glowing Sculpture',
};

export default function RestylePanel() {
  const { project, updateRestyleSettings, applyRestylePreset } = useArtReviveStore();
  const s = project.restyleSettings;

  function slider(
    label: string,
    key: keyof Omit<RestyleSettings, 'prompt' | 'preset'>,
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
          className="violet"
          onChange={(e) => updateRestyleSettings({ [key]: parseFloat(e.target.value) })}
        />
      </div>
    );
  }

  return (
    <aside className="w-64 shrink-0 bg-ar-panel border-r border-ar-border flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-ar-border">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-ar-violet">Restyle</h2>
        <p className="text-xs text-ar-text-muted mt-0.5">AI image stylization</p>
      </div>

      <div className="flex flex-col gap-5 p-4 flex-1">
        {/* Presets */}
        <section>
          <p className="text-xs text-ar-text-muted uppercase tracking-widest mb-2">Preset</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => applyRestylePreset(preset)}
                className={`px-2 py-2 rounded text-xs text-left transition-all ${
                  s.preset === preset
                    ? 'bg-ar-violet/20 border border-ar-violet/50 text-ar-violet'
                    : 'bg-ar-surface border border-ar-border text-ar-text-muted hover:text-ar-text hover:border-ar-text-dim'
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </section>

        <div className="ar-divider" />

        {/* Prompt */}
        <section>
          <p className="text-xs text-ar-text-muted uppercase tracking-widest mb-2">Style Prompt</p>
          <textarea
            value={s.prompt}
            onChange={(e) => updateRestyleSettings({ prompt: e.target.value })}
            placeholder="Describe your desired style… (optional)"
            rows={3}
            className="w-full bg-ar-surface border border-ar-border rounded-md px-3 py-2 text-xs text-ar-text placeholder:text-ar-text-dim resize-none focus:outline-none focus:border-ar-violet/50 transition-colors"
          />
        </section>

        <div className="ar-divider" />

        {/* Controls */}
        <section className="space-y-4">
          <p className="text-xs text-ar-text-muted uppercase tracking-widest">Parameters</p>
          {slider('Preserve Structure', 'preserveStructure')}
          {slider('Stylization', 'stylizationStrength')}
          {slider('Background Darkness', 'backgroundDarkness')}
          {slider('Glow Amount', 'glowAmount')}
          {slider('Subject Clarity', 'subjectClarity')}
          {slider('Detail Retention', 'detailRetention')}
        </section>
      </div>
    </aside>
  );
}
