'use client';
import { Trash2, Eye, EyeOff, Edit3, ChevronRight } from 'lucide-react';
import { useStudioStore } from '@/lib/studio/store';

export default function FacePanel() {
  const { faces, activeFaceId, setActiveFace, removeFace, renameFace, setTool, layers } = useStudioStore();

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-ar-border flex items-center justify-between shrink-0">
        <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest">Surfaces</span>
        <button
          onClick={() => setTool('addFace')}
          className="text-[10px] text-ar-accent hover:text-ar-accent/80 transition-colors font-medium"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {faces.length === 0 && (
          <div className="text-center py-8 px-3">
            <div className="text-2xl mb-2">📐</div>
            <p className="text-[11px] text-ar-text-dim">No surfaces yet</p>
            <p className="text-[10px] text-ar-text-dim/60 mt-1">Use &quot;Add Face&quot; tool to click 4 corners on the canvas</p>
          </div>
        )}

        {faces.map(face => {
          const assignedLayers = layers.filter(l => l.faceId === face.id);
          const isActive = activeFaceId === face.id;

          return (
            <div
              key={face.id}
              onClick={() => setActiveFace(isActive ? null : face.id)}
              className={`group rounded-lg border cursor-pointer transition-all ${
                isActive
                  ? 'border-ar-accent/50 bg-ar-accent/5'
                  : 'border-ar-border hover:border-ar-border/80 hover:bg-ar-surface/30'
              }`}
            >
              <div className="flex items-center gap-2 px-2.5 py-2">
                {/* Color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-white/10"
                  style={{ backgroundColor: face.color }}
                />

                {/* Name */}
                <span className="flex-1 text-[11px] font-medium text-ar-text truncate">{face.name}</span>

                {/* Layer count badge */}
                {assignedLayers.length > 0 && (
                  <span className="text-[9px] bg-ar-surface border border-ar-border rounded-full px-1.5 py-0.5 text-ar-text-muted font-mono">
                    {assignedLayers.length}L
                  </span>
                )}

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFace(face.id); }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-ar-text-dim transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Assigned layers preview */}
              {isActive && assignedLayers.length > 0 && (
                <div className="px-2.5 pb-2 space-y-1">
                  {assignedLayers.map(l => (
                    <div key={l.id} className="flex items-center gap-1.5 text-[10px] text-ar-text-dim">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        l.type === 'loop' ? 'bg-violet-400' :
                        l.type === 'blackout' ? 'bg-gray-600' : 'bg-cyan-400'
                      }`} />
                      <span className="truncate">{l.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
