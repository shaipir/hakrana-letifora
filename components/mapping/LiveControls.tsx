'use client';

import { useMappingStore } from '@/lib/mapping-store';

export default function LiveControls() {
  const { live, setLive, setBlackout, setFrozen, setMasterOpacity, setCrossfadeDuration } =
    useMappingStore();

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ar-text-muted">
        Live Controls
      </h2>

      <button
        onClick={() => setLive(!live.isLive)}
        className={`w-full py-2 rounded text-sm font-medium transition-colors ${
          live.isLive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-ar-accent hover:bg-ar-accent/80 text-white'
        }`}
      >
        {live.isLive ? 'Stop Live' : 'Go Live'}
      </button>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-ar-text-muted">Master Opacity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={live.masterOpacity}
          onChange={(e) => setMasterOpacity(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs text-ar-text-muted">Crossfade (ms)</label>
        <input
          type="range"
          min={0}
          max={2000}
          step={50}
          value={live.crossfadeDuration}
          onChange={(e) => setCrossfadeDuration(Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-ar-text-muted text-right">{live.crossfadeDuration}ms</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setBlackout(!live.blackout)}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
            live.blackout ? 'bg-yellow-600 text-white' : 'bg-ar-surface text-ar-text hover:bg-ar-border'
          }`}
        >
          Blackout
        </button>
        <button
          onClick={() => setFrozen(!live.frozen)}
          className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
            live.frozen ? 'bg-blue-600 text-white' : 'bg-ar-surface text-ar-text hover:bg-ar-border'
          }`}
        >
          Freeze
        </button>
      </div>
    </div>
  );
}
