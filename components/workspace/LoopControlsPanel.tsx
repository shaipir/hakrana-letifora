'use client';

import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Music, Zap } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { LoopMotionType, BeatDivision, TransitionMode } from '@/lib/types';
import { BPM_PRESETS, BEAT_DIVISIONS, tapTempoToBpm, bpmToFrameIntervalMs } from '@/lib/bpm-utils';

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
  const [bpmExpanded, setBpmExpanded] = useState(false);

  // Tap-tempo state
  const tapTimestampsRef = useRef<number[]>([]);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleTapTempo() {
    const now = Date.now();
    tapTimestampsRef.current.push(now);
    // Keep only last 6 taps
    if (tapTimestampsRef.current.length > 6) {
      tapTimestampsRef.current = tapTimestampsRef.current.slice(-6);
    }
    // Reset tap history after 3s of inactivity
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => {
      tapTimestampsRef.current = [];
    }, 3000);

    const bpm = tapTempoToBpm(tapTimestampsRef.current);
    if (bpm !== null) {
      const clamped = Math.min(160, Math.max(90, bpm));
      updateLoopSettings({ bpmSync: { ...s.bpmSync, bpm: clamped } });
    }
  }

  const frameIntervalMs = s.bpmSync.enabled
    ? Math.round(bpmToFrameIntervalMs(s.bpmSync.bpm, s.bpmSync.beatDivision))
    : Math.round(1000 / 10);

  return (
    <div className="border-t border-ar-border bg-ar-panel shrink-0">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex rounded-md border border-ar-border overflow-hidden text-xs bg-ar-surface">
          <button
            onClick={() => updateLoopSettings({ outputMode: 'still' })}
            className={`px-3.5 py-1.5 transition-colors font-medium ${
              s.outputMode === 'still'
                ? 'bg-ar-violet/20 text-ar-violet'
                : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-border/40'
            }`}
          >
            Still
          </button>
          <button
            onClick={() => { updateLoopSettings({ outputMode: 'loop' }); setExpanded(true); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 transition-colors font-medium ${
              s.outputMode === 'loop'
                ? 'bg-ar-accent/20 text-ar-accent'
                : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-border/40'
            }`}
          >
            {s.outputMode === 'loop' && (
              <span className="w-1.5 h-1.5 rounded-full bg-ar-accent animate-pulse-dot" />
            )}
            Loop
          </button>
        </div>

        {s.outputMode === 'loop' && (
          <button
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Collapse loop settings' : 'Expand loop settings'}
            className="text-ar-text-muted hover:text-ar-text p-1.5 rounded hover:bg-ar-border/40 transition-colors"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Loop settings (expanded) */}
      {s.outputMode === 'loop' && expanded && (
        <div className="px-3 pb-4 space-y-4">
          {/* Frame count */}
          <div>
            <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest block mb-2">Frames</span>
            <div className="flex rounded-md border border-ar-border overflow-hidden text-xs bg-ar-surface">
              {[5, 8, 10, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => updateLoopSettings({ frameCount: n })}
                  className={`flex-1 py-1.5 transition-colors font-medium ${
                    s.frameCount === n
                      ? 'bg-ar-accent/20 text-ar-accent'
                      : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-border/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Motion type */}
          <div>
            <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest block mb-2">Motion</span>
            <div className="grid grid-cols-3 gap-1">
              {MOTION_TYPES.map((mt) => (
                <button
                  key={mt.id}
                  onClick={() => updateLoopSettings({ motionType: mt.id })}
                  className={`px-1.5 py-1.5 rounded-md border text-[10px] flex flex-col items-center gap-0.5 justify-center transition-all ${
                    s.motionType === mt.id
                      ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent shadow-[0_0_8px_rgba(0,229,255,0.12)]'
                      : 'bg-ar-surface border-ar-border text-ar-text-muted hover:text-ar-text hover:border-ar-border-subtle'
                  }`}
                >
                  <span className="text-sm leading-none">{mt.emoji}</span>
                  <span className="font-medium">{mt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-ar-text-muted">Motion Intensity</span>
                <span className="text-[10px] font-mono text-ar-accent">{Math.round(s.motionIntensity * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={s.motionIntensity}
                onChange={(e) => updateLoopSettings({ motionIntensity: parseFloat(e.target.value) })}
                className="w-full accent-ar-accent h-1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-medium text-ar-text-muted">Loop Softness</span>
                <span className="text-[10px] font-mono text-ar-accent">{Math.round(s.loopSoftness * 100)}%</span>
              </div>
              <input type="range" min={0} max={1} step={0.05} value={s.loopSoftness}
                onChange={(e) => updateLoopSettings({ loopSoftness: parseFloat(e.target.value) })}
                className="w-full accent-ar-accent h-1" />
            </div>
          </div>

          {/* ── Transition / Continuity ──────────────────────────────── */}
          <div className="space-y-2.5">
            <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest block">Transition</span>
            <div className="grid grid-cols-3 gap-1">
              {([
                { value: 'hard-cut',     label: 'Hard Cut' },
                { value: 'dissolve',     label: 'Dissolve' },
                { value: 'crossfade',    label: 'Crossfade' },
                { value: 'morph-blend',  label: 'Morph' },
                { value: 'optical-flow', label: 'Optical' },
              ] as { value: TransitionMode; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateLoopSettings({ transitionMode: value })}
                  className={`py-1.5 rounded-md border text-[10px] font-medium transition-colors ${
                    s.transitionMode === value
                      ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent'
                      : 'border-ar-border text-ar-text-dim hover:text-ar-text hover:border-ar-border-subtle'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {s.transitionMode !== 'hard-cut' && (
              <div className="space-y-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-ar-text-muted">Blend Amount</span>
                    <span className="text-[10px] font-mono text-ar-accent">{Math.round(s.blendAmount * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={s.blendAmount}
                    onChange={(e) => updateLoopSettings({ blendAmount: parseFloat(e.target.value) })}
                    className="w-full accent-ar-accent h-1" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-ar-text-muted">Continuity</span>
                    <span className="text-[10px] font-mono text-ar-accent">{Math.round(s.continuityStrength * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05} value={s.continuityStrength}
                    onChange={(e) => updateLoopSettings({ continuityStrength: parseFloat(e.target.value) })}
                    className="w-full accent-ar-accent h-1" />
                </div>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div>
            <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest block mb-2">Effects</span>
            <div className="grid grid-cols-2 gap-1.5">
              {([
                { key: 'eyeBlink',            label: 'Eye Blink' },
                { key: 'breathing',           label: 'Breathing' },
                { key: 'environmentalMotion', label: 'Environment' },
                { key: 'organicGrowth',       label: 'Organic' },
              ] as { key: keyof typeof s; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => updateLoopSettings({ [key]: !s[key] } as any)}
                  aria-pressed={!!s[key]}
                  className={`px-2 py-1.5 rounded-md border text-[10px] font-medium transition-all ${
                    s[key]
                      ? 'bg-ar-accent/15 border-ar-accent/40 text-ar-accent shadow-[0_0_8px_rgba(0,229,255,0.1)]'
                      : 'bg-ar-surface border-ar-border text-ar-text-muted hover:text-ar-text hover:border-ar-border-subtle'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── BPM Sync ─────────────────────────────────────────────────── */}
          <div className="border border-ar-border rounded-lg overflow-hidden">
            {/* BPM header toggle */}
            <button
              onClick={() => setBpmExpanded(!bpmExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-ar-surface hover:bg-ar-border/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-ar-text-dim" />
                <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest">BPM Sync</span>
                {s.bpmSync.enabled && (
                  <span className="text-[9px] bg-ar-accent/20 text-ar-accent border border-ar-accent/30 px-1.5 py-0.5 rounded-full font-mono leading-none">
                    {s.bpmSync.bpm}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLoopSettings({ bpmSync: { ...s.bpmSync, enabled: !s.bpmSync.enabled } });
                  }}
                  aria-label={s.bpmSync.enabled ? 'Disable BPM sync' : 'Enable BPM sync'}
                  className={`w-8 h-4 rounded-full transition-colors relative ${
                    s.bpmSync.enabled ? 'bg-ar-accent' : 'bg-ar-border'
                  }`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                    s.bpmSync.enabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`} />
                </button>
                {bpmExpanded ? <ChevronDown className="w-3.5 h-3.5 text-ar-text-dim" /> : <ChevronUp className="w-3.5 h-3.5 text-ar-text-dim" />}
              </div>
            </button>

            {bpmExpanded && (
              <div className="px-3 py-3 space-y-3 bg-ar-panel">
                {/* BPM slider + input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-ar-text-muted">BPM</span>
                    <input
                      type="number"
                      min={90} max={160} step={1}
                      value={s.bpmSync.bpm}
                      onChange={(e) => {
                        const v = Math.min(160, Math.max(90, Number(e.target.value)));
                        updateLoopSettings({ bpmSync: { ...s.bpmSync, bpm: v } });
                      }}
                      className="w-14 bg-ar-surface border border-ar-border rounded-md px-1.5 py-0.5 text-xs font-mono text-ar-accent text-center focus:outline-none focus:border-ar-accent/60"
                    />
                  </div>
                  <input
                    type="range" min={90} max={160} step={1}
                    value={s.bpmSync.bpm}
                    onChange={(e) => updateLoopSettings({ bpmSync: { ...s.bpmSync, bpm: Number(e.target.value) } })}
                    className="w-full accent-ar-accent h-1"
                  />
                  {/* BPM presets */}
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {BPM_PRESETS.map((b) => (
                      <button
                        key={b}
                        onClick={() => updateLoopSettings({ bpmSync: { ...s.bpmSync, bpm: b } })}
                        className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                          s.bpmSync.bpm === b
                            ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent'
                            : 'border-ar-border text-ar-text-dim hover:text-ar-text hover:border-ar-border-subtle'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Beat division */}
                <div>
                  <span className="text-[10px] font-medium text-ar-text-muted block mb-1.5">Beat Division</span>
                  <div className="flex gap-1">
                    {BEAT_DIVISIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => updateLoopSettings({ bpmSync: { ...s.bpmSync, beatDivision: value as BeatDivision } })}
                        className={`flex-1 py-1 rounded border text-[10px] font-medium transition-colors ${
                          s.bpmSync.beatDivision === value
                            ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent'
                            : 'border-ar-border text-ar-text-dim hover:text-ar-text hover:border-ar-border-subtle'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Motion-to-beat strength */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-medium text-ar-text-muted">Beat Strength</span>
                    <span className="text-[10px] font-mono text-ar-accent">{Math.round(s.bpmSync.motionToBeatStrength * 100)}%</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.05}
                    value={s.bpmSync.motionToBeatStrength}
                    onChange={(e) => updateLoopSettings({ bpmSync: { ...s.bpmSync, motionToBeatStrength: parseFloat(e.target.value) } })}
                    className="w-full accent-ar-accent h-1" />
                </div>

                {/* Tap tempo */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTapTempo}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-ar-border bg-ar-surface hover:bg-ar-border/40 hover:border-ar-border-subtle text-xs font-medium text-ar-text-muted hover:text-ar-text transition-colors active:scale-95"
                  >
                    <Zap className="w-3 h-3" />
                    Tap Tempo
                  </button>
                  <span className="text-[10px] font-mono text-ar-text-dim">
                    {frameIntervalMs}ms
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
