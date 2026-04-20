'use client';

import { useEffect } from 'react';
import { Monitor, MonitorOff, Moon, Play, Pause } from 'lucide-react';
import { useMappingStore } from '@/lib/mapping-store';
import {
  openProjectorWindow,
  closeProjectorWindow,
  isProjectorOpen,
} from '@/lib/mapping/live-output';

export default function LiveControls() {
  const {
    live,
    project,
    setLive,
    setBlackout,
    setFrozen,
    setMasterOpacity,
    setCrossfadeDuration,
    updateSurface,
  } = useMappingStore();

  const { isLive, blackout, frozen, masterOpacity, crossfadeDuration } = live;

  // ── Projector toggle ────────────────────────────────────────────────────────
  function handleProjectorToggle() {
    if (isLive) {
      closeProjectorWindow();
      setLive(false);
    } else {
      try {
        openProjectorWindow();
        setLive(true);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // ── Keyboard shortcuts (active only when live) ──────────────────────────────
  useEffect(() => {
    if (!isLive) return;

    function onKeyDown(e: KeyboardEvent) {
      // Ignore when typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const state = useMappingStore.getState();
      const surfaces = state.project.surfaces;

      switch (e.key) {
        case '1':
        case '2':
        case '3':
        case '4': {
          const idx = parseInt(e.key, 10) - 1;
          const surf = surfaces[idx];
          if (surf) {
            state.updateSurface(surf.id, { visible: !surf.visible });
          }
          break;
        }
        case 'b':
        case 'B': {
          state.setBlackout(!state.live.blackout);
          break;
        }
        case ' ': {
          e.preventDefault();
          state.setFrozen(!state.live.frozen);
          break;
        }
        case 'F11': {
          e.preventDefault();
          if (isProjectorOpen()) {
            try {
              const win = openProjectorWindow();
              win.document.documentElement.requestFullscreen?.();
            } catch {
              // ignore
            }
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLive]);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ── Projector toggle ── */}
      <button
        onClick={handleProjectorToggle}
        className={[
          'flex items-center justify-center gap-2 w-full rounded-lg px-4 py-3 font-semibold text-sm transition-all',
          isLive
            ? 'bg-ar-neon-green/10 border border-ar-neon-green text-ar-neon-green shadow-[0_0_12px_rgba(0,255,128,0.35)]'
            : 'bg-ar-panel border border-ar-border text-ar-text hover:border-ar-neon-green/50',
        ].join(' ')}
      >
        {isLive ? (
          <>
            <Monitor className="w-4 h-4" />
            Projector Active
          </>
        ) : (
          <>
            <MonitorOff className="w-4 h-4" />
            Open Projector Window
          </>
        )}
      </button>

      {/* ── Live controls (only when live) ── */}
      {isLive && (
        <>
          {/* Blackout + Freeze */}
          <div className="flex gap-2">
            <button
              onClick={() => setBlackout(!blackout)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all border',
                blackout
                  ? 'bg-red-600/20 border-red-500 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                  : 'bg-ar-panel border-ar-border text-ar-text-muted hover:border-red-500/50',
              ].join(' ')}
            >
              <Moon className="w-3.5 h-3.5" />
              Blackout
            </button>

            <button
              onClick={() => setFrozen(!frozen)}
              className={[
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all border',
                frozen
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  : 'bg-ar-panel border-ar-border text-ar-text-muted hover:border-cyan-400/50',
              ].join(' ')}
            >
              {frozen ? (
                <Play className="w-3.5 h-3.5" />
              ) : (
                <Pause className="w-3.5 h-3.5" />
              )}
              {frozen ? 'Unfreeze' : 'Freeze'}
            </button>
          </div>

          {/* Master opacity */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-ar-text-muted">
              <span>Master Opacity</span>
              <span>{Math.round(masterOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(masterOpacity * 100)}
              onChange={(e) => setMasterOpacity(parseInt(e.target.value, 10) / 100)}
              className="w-full accent-ar-neon-green"
            />
          </div>

          {/* Crossfade duration */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-ar-text-muted">
              <span>Crossfade</span>
              <span>{crossfadeDuration} ms</span>
            </div>
            <input
              type="range"
              min={0}
              max={3000}
              step={50}
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(parseInt(e.target.value, 10))}
              className="w-full accent-ar-neon-green"
            />
          </div>

          {/* Per-surface toggles */}
          {project.surfaces.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider">
                Surfaces
              </span>
              {project.surfaces.map((surf, idx) => (
                <div
                  key={surf.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 bg-ar-bg border border-ar-border"
                >
                  <span className="text-xs text-ar-text truncate max-w-[140px]">
                    <span className="text-ar-text-muted mr-1">{idx + 1}.</span>
                    {surf.name}
                  </span>
                  <button
                    onClick={() => updateSurface(surf.id, { visible: !surf.visible })}
                    className={[
                      'text-xs font-bold px-2 py-0.5 rounded transition-colors',
                      surf.visible
                        ? 'text-ar-neon-green bg-ar-neon-green/10'
                        : 'text-ar-text-muted bg-ar-panel',
                    ].join(' ')}
                  >
                    {surf.visible ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Keyboard shortcuts reference */}
          <div className="rounded-lg border border-ar-border bg-ar-bg p-3 flex flex-col gap-1">
            <span className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-1">
              Shortcuts
            </span>
            {[
              ['1 – 4', 'Toggle surface'],
              ['B', 'Blackout'],
              ['Space', 'Freeze / Unfreeze'],
              ['F11', 'Fullscreen projector'],
            ].map(([key, label]) => (
              <div key={key} className="flex justify-between text-xs">
                <kbd className="bg-ar-panel border border-ar-border rounded px-1.5 py-0.5 font-mono text-ar-neon-green">
                  {key}
                </kbd>
                <span className="text-ar-text-muted">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
