'use client';
import { useState } from 'react';
import { Trash2, Eye, EyeOff, Link2, Link2Off, ChevronDown } from 'lucide-react';
import { useStudioStore } from '@/lib/studio/store';
import { useArtReviveStore } from '@/lib/artrevive-store';

export default function LayerPanel() {
  const {
    layers, activeLayerId, setActiveLayer, removeLayer, updateLayer,
    assignLayerToFace, addLayer,
    faces, activeFaceId,
  } = useStudioStore();

  const { project, loopHistory } = useArtReviveStore();
  const [showPicker, setShowPicker] = useState(false);

  function addStillFromHistory(url: string, name: string) {
    addLayer({
      name,
      faceId: activeFaceId,
      type: 'still',
      imageUrl: url,
      opacity: 1,
      visible: true,
      blendMode: 'normal',
    });
    setShowPicker(false);
  }

  function addLoopFromHistory(frames: string[], name: string) {
    addLayer({
      name,
      faceId: activeFaceId,
      type: 'loop',
      frames,
      opacity: 1,
      visible: true,
      blendMode: 'normal',
    });
    setShowPicker(false);
  }

  function addBlackout() {
    addLayer({
      name: 'Blackout',
      faceId: activeFaceId,
      type: 'blackout',
      opacity: 1,
      visible: true,
      blendMode: 'normal',
    });
  }

  const stills = project.generatedAssets;
  const loops = loopHistory;

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-ar-border flex items-center justify-between shrink-0">
        <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest">Layers</span>
        <div className="flex gap-1">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="text-[10px] text-ar-accent hover:text-ar-accent/80 transition-colors font-medium"
          >
            + Visual
          </button>
          <span className="text-ar-text-dim">·</span>
          <button
            onClick={addBlackout}
            className="text-[10px] text-ar-text-dim hover:text-ar-text transition-colors font-medium"
          >
            Blackout
          </button>
        </div>
      </div>

      {/* Visual picker */}
      {showPicker && (
        <div className="border-b border-ar-border bg-ar-surface/20 p-2 space-y-1 max-h-48 overflow-y-auto">
          {stills.length === 0 && loops.length === 0 && (
            <p className="text-[10px] text-ar-text-dim text-center py-2">Generate images first</p>
          )}
          {stills.map(a => (
            <button
              key={a.id}
              onClick={() => addStillFromHistory(a.url, 'Still')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-ar-border/40 transition-colors text-left"
            >
              <img src={a.url} className="w-8 h-6 object-cover rounded" alt="" />
              <span className="text-[10px] text-ar-text">Still image</span>
            </button>
          ))}
          {loops.map((l: any, i: number) => (
            <button
              key={l.id ?? i}
              onClick={() => addLoopFromHistory(l.frames, `Loop ${i + 1}`)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-ar-border/40 transition-colors text-left"
            >
              <img src={l.frames?.[0]} className="w-8 h-6 object-cover rounded" alt="" />
              <span className="text-[10px] text-ar-text">Loop ({l.frames?.length}f)</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.length === 0 && (
          <div className="text-center py-8 px-3">
            <div className="text-2xl mb-2">🎨</div>
            <p className="text-[11px] text-ar-text-dim">No layers</p>
            <p className="text-[10px] text-ar-text-dim/60 mt-1">Add a visual or blackout from above</p>
          </div>
        )}

        {/* Layers in reverse order (top = drawn last = visually on top) */}
        {[...layers].reverse().map(layer => {
          const isActive = activeLayerId === layer.id;
          const face = faces.find(f => f.id === layer.faceId);

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(isActive ? null : layer.id)}
              className={`group rounded-lg border cursor-pointer transition-all ${
                isActive
                  ? 'border-ar-accent/50 bg-ar-accent/5'
                  : 'border-ar-border hover:border-ar-border/80 hover:bg-ar-surface/30'
              }`}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                {/* Type dot */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  layer.type === 'loop' ? 'bg-violet-400' :
                  layer.type === 'blackout' ? 'bg-gray-600 border border-gray-500' : 'bg-cyan-400'
                }`} />

                {/* Thumbnail */}
                {(layer.imageUrl || layer.frames?.[0]) && (
                  <img
                    src={layer.imageUrl ?? layer.frames![0]}
                    className="w-7 h-5 object-cover rounded shrink-0"
                    alt=""
                  />
                )}

                {/* Name */}
                <span className="flex-1 text-[11px] font-medium text-ar-text truncate">{layer.name}</span>

                {/* Face assignment */}
                {face && (
                  <div
                    className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/20"
                    style={{ backgroundColor: face.color }}
                    title={`Assigned to ${face.name}`}
                  />
                )}

                {/* Visibility */}
                <button
                  onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                  className="p-0.5 text-ar-text-dim hover:text-ar-text transition-colors"
                >
                  {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-ar-text-dim transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Expanded controls */}
              {isActive && (
                <div className="px-2.5 pb-2.5 space-y-2">
                  {/* Opacity */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-ar-text-dim w-12">Opacity</span>
                    <input
                      type="range" min="0" max="1" step="0.01"
                      value={layer.opacity}
                      onChange={e => updateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                      className="flex-1 h-1 accent-ar-accent"
                    />
                    <span className="text-[9px] text-ar-text-dim font-mono w-7 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>

                  {/* Blend mode */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-ar-text-dim w-12">Blend</span>
                    <select
                      value={layer.blendMode}
                      onChange={e => updateLayer(layer.id, { blendMode: e.target.value as any })}
                      className="flex-1 text-[10px] bg-ar-surface border border-ar-border rounded px-1.5 py-0.5 text-ar-text"
                    >
                      {['normal','screen','multiply','overlay','add'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {/* Face assignment */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-ar-text-dim w-12">Surface</span>
                    <select
                      value={layer.faceId ?? ''}
                      onChange={e => assignLayerToFace(layer.id, e.target.value || null)}
                      className="flex-1 text-[10px] bg-ar-surface border border-ar-border rounded px-1.5 py-0.5 text-ar-text"
                    >
                      <option value="">— none —</option>
                      {faces.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
