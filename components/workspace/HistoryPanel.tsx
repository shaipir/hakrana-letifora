'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { GeneratedAsset } from '@/lib/types';
import { Download, Clock, Trash2, Film, Play } from 'lucide-react';

export default function HistoryPanel() {
  const {
    project, selectedResultId, selectResult,
    setExporting, removeGeneratedAsset,
    generatedLoop, loopHistory, setGeneratedLoop,
  } = useArtReviveStore();
  const { generatedAssets } = project;

  async function downloadAsset(asset: GeneratedAsset) {
    setExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: asset.url, format: 'png' }),
      });
      const json = await res.json();
      if (json.url) {
        const a = document.createElement('a');
        a.href = json.url;
        a.download = json.filename ?? 'artrevive-export.png';
        a.click();
      }
    } finally {
      setExporting(false);
    }
  }

  const totalCount = generatedAssets.length + loopHistory.length;

  return (
    <aside className="flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-ar-border flex items-center gap-2 shrink-0">
        <Clock className="w-3.5 h-3.5 text-ar-accent/60" />
        <h2 className="text-[11px] font-semibold tracking-widest uppercase text-ar-text">Results</h2>
        {totalCount > 0 && (
          <span className="ml-auto text-[10px] font-mono text-ar-accent bg-ar-accent/10 border border-ar-accent/20 rounded-full px-1.5 py-0.5 leading-none">
            {totalCount}
          </span>
        )}
      </div>

      {/* Unified scrollable gallery */}
      <div className="flex-1 overflow-y-auto">
        {totalCount === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full py-10 px-4 gap-3">
            <div className="w-10 h-10 rounded-xl border border-ar-border/60 bg-ar-surface flex items-center justify-center">
              <Clock className="w-5 h-5 text-ar-text-dim/40" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-medium text-ar-text-muted">No results yet</p>
              <p className="text-[10px] text-ar-text-dim leading-relaxed">
                Generate a still or loop to build your gallery
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {/* Loop section */}
            {loopHistory.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1 pt-1">
                  <Film className="w-3 h-3 text-ar-accent/50" />
                  <span className="text-[9px] font-semibold text-ar-text-dim uppercase tracking-widest">Loops</span>
                  <span className="text-[9px] text-ar-text-dim/60 ml-auto">{loopHistory.length}</span>
                </div>
                {loopHistory.map((loop) => {
                  const isActive = generatedLoop?.id === loop.id;
                  return (
                    <div
                      key={loop.id}
                      onClick={() => setGeneratedLoop(isActive ? null : loop)}
                      role="button"
                      aria-pressed={isActive}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer border transition-all ${
                        isActive
                          ? 'bg-ar-accent/10 border-ar-accent/40 text-ar-accent shadow-[0_0_12px_rgba(0,229,255,0.12)]'
                          : 'bg-ar-surface border-ar-border text-ar-text-muted hover:border-ar-accent/30 hover:bg-ar-surface/80'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${isActive ? 'bg-ar-accent/20' : 'bg-ar-border/60'}`}>
                        <Play className="w-3 h-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium truncate capitalize">{loop.mode.replace('-', ' ')}</p>
                        <p className="text-[9px] text-ar-text-dim mt-0.5">{loop.frameCount} frames &middot; {new Date(loop.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-ar-accent animate-pulse-dot shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stills section */}
            {generatedAssets.length > 0 && (
              <div className="space-y-1.5">
                {loopHistory.length > 0 && (
                  <div className="flex items-center gap-1.5 px-1 pt-1">
                    <span className="text-[9px] font-semibold text-ar-text-dim uppercase tracking-widest">Stills</span>
                    <span className="text-[9px] text-ar-text-dim/60 ml-auto">{generatedAssets.length}</span>
                  </div>
                )}
                {generatedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => selectResult(asset.id)}
                    role="button"
                    aria-pressed={selectedResultId === asset.id}
                    className={`group relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
                      selectedResultId === asset.id
                        ? asset.mode === 'restyle'
                          ? 'border-ar-violet/60 ring-1 ring-ar-violet/30 shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                          : asset.mode === 'glow-sculpture'
                          ? 'border-ar-accent/60 ring-1 ring-ar-accent/30 shadow-[0_0_16px_rgba(0,229,255,0.25)]'
                          : 'border-orange-500/60 ring-1 ring-orange-500/30 shadow-[0_0_16px_rgba(249,115,22,0.25)]'
                        : 'border-ar-border hover:border-ar-border-subtle hover:shadow-[0_0_12px_rgba(0,229,255,0.08)]'
                    }`}
                  >
                    {/* Thumbnail */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={`${asset.mode} result`}
                      className="w-full aspect-square object-cover bg-ar-bg"
                    />

                    {/* Mode badge */}
                    <div className="absolute top-1.5 left-1.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
                          asset.mode === 'restyle'
                            ? 'bg-ar-violet/40 text-ar-violet'
                            : asset.mode === 'glow-sculpture'
                            ? 'bg-ar-accent/25 text-ar-accent'
                            : 'bg-orange-500/25 text-orange-400'
                        }`}
                      >
                        {asset.mode === 'restyle' ? 'RS' : asset.mode === 'glow-sculpture' ? 'GS' : 'HP'}
                      </span>
                    </div>

                    {/* Hover actions */}
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadAsset(asset); }}
                        className="p-1.5 rounded-md bg-black/70 border border-white/10 text-ar-text-muted hover:text-ar-text hover:bg-black/90 transition-colors"
                        title="Download"
                        aria-label="Download result"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeGeneratedAsset(asset.id); }}
                        className="p-1.5 rounded-md bg-black/70 border border-white/10 text-ar-text-muted hover:text-ar-neon-pink hover:bg-black/90 transition-colors"
                        title="Remove"
                        aria-label="Remove result"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Footer meta */}
                    <div className="px-2 py-1.5 bg-ar-panel/90 flex items-center justify-between">
                      <p className="text-[9px] text-ar-text-dim font-mono">
                        {new Date(asset.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {selectedResultId === asset.id && (
                        <span className="text-[9px] text-ar-accent font-medium">Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
