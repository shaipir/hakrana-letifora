'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import { GeneratedAsset } from '@/lib/types';
import { Download, Clock } from 'lucide-react';

export default function HistoryPanel() {
  const { project, selectedResultId, selectResult, setExporting } = useArtReviveStore();
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

  return (
    <aside className="w-48 shrink-0 bg-ar-panel border-l border-ar-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-ar-border flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-ar-text-dim" />
        <h2 className="text-xs font-semibold tracking-widest uppercase text-ar-text-muted">History</h2>
        {generatedAssets.length > 0 && (
          <span className="ml-auto text-xs text-ar-text-dim bg-ar-surface rounded px-1.5 py-0.5">
            {generatedAssets.length}
          </span>
        )}
      </div>

      {/* Asset list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {generatedAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 gap-2">
            <div className="w-8 h-8 rounded-md border border-ar-border flex items-center justify-center opacity-30">
              <Clock className="w-4 h-4 text-ar-text-dim" />
            </div>
            <p className="text-xs text-ar-text-dim text-center">
              Generated results will appear here
            </p>
          </div>
        ) : (
          generatedAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => selectResult(asset.id)}
              className={`group relative rounded-md overflow-hidden border cursor-pointer transition-all ${
                selectedResultId === asset.id
                  ? asset.mode === 'restyle'
                    ? 'border-ar-violet/60 ring-1 ring-ar-violet/30'
                    : 'border-ar-accent/60 ring-1 ring-ar-accent/30'
                  : 'border-ar-border hover:border-ar-text-dim'
              }`}
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt="Generated result"
                className="w-full aspect-square object-cover bg-ar-bg"
              />

              {/* Mode badge */}
              <div className="absolute top-1 left-1">
                <span
                  className={`text-[10px] px-1 py-0.5 rounded font-mono uppercase tracking-wide ${
                    asset.mode === 'restyle'
                      ? 'bg-ar-violet/30 text-ar-violet'
                      : 'bg-ar-accent/20 text-ar-accent'
                  }`}
                >
                  {asset.mode === 'restyle' ? 'RS' : 'NC'}
                </span>
              </div>

              {/* Download on hover */}
              <button
                onClick={(e) => { e.stopPropagation(); downloadAsset(asset); }}
                className="absolute bottom-1 right-1 p-1 rounded bg-black/60 border border-ar-border text-ar-text-muted hover:text-ar-text opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-3 h-3" />
              </button>

              {/* Timestamp */}
              <div className="px-2 py-1 bg-ar-panel/80">
                <p className="text-[10px] text-ar-text-dim">
                  {new Date(asset.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
