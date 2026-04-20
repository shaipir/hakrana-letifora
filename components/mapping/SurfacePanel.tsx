'use client';

import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useMappingStore } from '@/lib/mapping-store';

export default function SurfacePanel() {
  const { project, addSurface, removeSurface, setActiveSurface, updateSurface } =
    useMappingStore();

  const { surfaces, activeSurfaceId } = project;
  const atLimit = surfaces.length >= 4;

  return (
    <div className="p-3 space-y-3 border-b border-ar-border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-ar-text-muted">
          Surfaces ({surfaces.length}/4)
        </p>
        <button
          onClick={addSurface}
          disabled={atLimit}
          title="Add surface"
          className={`flex items-center justify-center w-5 h-5 rounded transition-all ${
            atLimit
              ? 'text-ar-text-dim cursor-not-allowed opacity-40'
              : 'text-ar-text-muted hover:text-ar-accent'
          }`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Surface list */}
      {surfaces.length === 0 ? (
        <p className="text-xs text-ar-text-dim text-center py-2">
          No surfaces yet. Draw or pick a shape.
        </p>
      ) : (
        <div className="space-y-1">
          {surfaces.map((surface) => {
            const isActive = surface.id === activeSurfaceId;
            return (
              <div
                key={surface.id}
                onClick={() => setActiveSurface(surface.id)}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all ${
                  isActive
                    ? 'bg-ar-accent/10 border border-ar-accent/30'
                    : 'bg-ar-surface border border-transparent hover:border-ar-border'
                }`}
              >
                {/* Colored dot */}
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-cyan-400' : 'bg-ar-text-dim'
                  }`}
                />

                {/* Surface name */}
                <span className="text-xs text-ar-text truncate flex-1 min-w-0">
                  {surface.name}
                </span>

                {/* Visibility toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateSurface(surface.id, { visible: !surface.visible });
                  }}
                  title={surface.visible ? 'Hide surface' : 'Show surface'}
                  className="flex-shrink-0 text-ar-text-muted hover:text-ar-text transition-colors"
                >
                  {surface.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSurface(surface.id);
                  }}
                  title="Delete surface"
                  className="flex-shrink-0 text-ar-text-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
