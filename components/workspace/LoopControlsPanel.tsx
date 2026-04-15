'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { LoopMotionType } from '@/lib/types';

const MOTION_TYPES: { id: LoopMotionType; label: string; emoji: string }[] = [
  { id: 'breathe', label: 'Breathe', emoji: '🫁' },
  { id: 'trace',   label: 'Trace',   emoji: '✏️' },
  { id: 'pulse',   label: 'Pulse',   emoji: '💫' },
  { id: 'flicker', label: 'Flicker', emoji: '⚡' },
  { id: 'reveal',  label: 'Reveal',  emoji: '🌅' },
  { id: 'flow',    label: 'Flow',    emoji: '🌊' },
];

export default function LoopControlsPanel() {
  const { project, updateLoopSettings } = useArtReviveStore();
  const s = project.loopSettings;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-t border-ar-border bg-ar-panel shrink-0">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex rounded border border-ar-border overflow-hidden text-xs">
          <button
            onClick={() => updateLoopSettings({ outputMode: 'still' })}
            className={`px-4 py-1.5 transition-colors font-medium ${
              s.outputMode === 'still'
                ? 'bg-ar-violet/20 text-ar-violet'
                : 'text-ar-text-muted hover:text-ar-text'
            }`}
          >
            Still
          </button>
          <button
            onClick={() => { updateLoopSettings({ outputMode: 'loop' }); setExpanded(true); }}
            className={`flex items-center gap-1.5 px-4 py-1.5 transition-colors font-medium ${
              s.outputMode === 'loop'
                ? 'bg-ar-accent/20 text-ar-accent'
                : 'text-ar-text-muted hover:text-ar-text'
            }`}
          >
            {s.outputMode === 'loop' && (
              <span className="w-1.5 h-1.5 rounded-full bg-ar-accent animate-pulse-dot" />
            )}
            🎞 Loop
          </button>
        </div>

        {s.outputMode === 'loop' && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-ar-text-muted hover:text-ar-text p-1 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Loop settings (expanded) */}
      {s.outputMode === 'loop' && expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Frame count */}
          <div>
            <span className="text-xs text-ar-text-muted block mb-1.5">Frame Count</span>
            <div className="flex rounded border border-ar-border overflow-hidden text-xs">
              {[5, 8, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => updateLoopSettings({ frameCount: n })}
                  className={`flex-1 py-1.5 transition-colors ${
                    s.frameCount === n ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-muted hover:text-ar-text'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Motion type */}
          <div>
            <span className="text-xs text-ar-text-muted block mb-1.5">Motion Type</span>
            <div className="grid grid-cols-3 gap-1">
              {MOTION_TYPES.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => updateLoopSettings({ motionType: mt.id })}
                  className={`px-2 py-1.5 rounded border text-xs flex items-center gap-1 justify-center transition-colors ${
                    s.motionType === mt.id
                      ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent'
                      : 'bg-ar-surface border-ar-border text-ar-text-muted hover:text-ar-text'
                  }`}
                >
                  <span>{mt.emoji}</span>
                  <span>{mt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-ar-text-muted w-32 shrink-0">Motion Intensity</span>
              <input type="range" min={0} max={1} step={0.05} value={s.motionIntensity}
                onChange={(e) => updateLoopSettings({ motionIntensity: parseFloat(e.target.value) })}
                className="flex-1 accent-ar-accent h-1" />
              <span className="text-xs text-ar-text-dim w-8 text-right">{Math.round(s.motionIntensity * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ar-text-muted w-32 shrink-0">Loop Softness</span>
              <input type="range" min={0} max={1} step={0.05} value={s.loopSoftness}
                onChange={(e) => updateLoopSettings({ loopSoftness: parseFloat(e.target.value) })}
                className="flex-1 accent-ar-accent h-1" />
              <span className="text-xs text-ar-text-dim w-8 text-right">{Math.round(s.loopSoftness * 100)}%</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-1.5">
            {([
              { key: 'eyeBlink',            label: '👁 Eye Blink' },
              { key: 'breathing',           label: '🫁 Breathing' },
              { key: 'environmentalMotion', label: '🌿 Environment' },
              { key: 'organicGrowth',       label: '🌱 Organic Growth' },
            ] as { key: keyof typeof s; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => updateLoopSettings({ [key]: !s[key] } as any)}
                className={`px-2 py-1.5 rounded border text-xs transition-colors ${
                  s[key]
                    ? 'bg-ar-accent/15 border-ar-accent/40 text-ar-accent'
                    : 'bg-ar-surface border-ar-border text-ar-text-muted hover:text-ar-text'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
