'use client';
import { useMappingStore } from '@/lib/mapping-store';
import { WarpMode } from '@/lib/mapping-types';

const WARP_MODES: { label: string; value: WarpMode }[] = [
  { label: 'Corner Pin', value: 'corner-pin' },
  { label: 'Mesh', value: 'mesh' },
  { label: 'Bezier', value: 'bezier' },
];

const DENSITIES: { label: string; cols: number; rows: number }[] = [
  { label: '2×2', cols: 2, rows: 2 },
  { label: '3×3', cols: 3, rows: 3 },
  { label: '4×4', cols: 4, rows: 4 },
  { label: '6×6', cols: 6, rows: 6 },
  { label: '8×8', cols: 8, rows: 8 },
];

const MODE_INSTRUCTIONS: Record<WarpMode, string> = {
  'corner-pin': 'Drag the four corner handles to pin the surface.',
  mesh: 'Drag grid points to warp the surface mesh.',
  bezier: 'Drag control points to sculpt the Bezier surface.',
};

export default function WarpControls() {
  const { project, setActiveSurface, setWarpMode, setMeshDensity, assignContent } = useMappingStore();
  const { surfaces, activeSurfaceId } = project;

  const activeSurface = surfaces.find((s) => s.id === activeSurfaceId) ?? null;

  if (surfaces.length === 0) {
    return (
      <div className="p-4 text-ar-text-muted text-xs">
        Select a surface to configure warping
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Surface selector */}
      <div>
        <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">
          Surface
        </p>
        <div className="flex flex-col gap-1">
          {surfaces.map((surface) => (
            <button
              key={surface.id}
              onClick={() => setActiveSurface(surface.id)}
              className={`text-left px-3 py-2 rounded text-sm transition-colors ${
                surface.id === activeSurfaceId
                  ? 'bg-ar-accent text-white'
                  : 'bg-ar-panel-alt text-ar-text hover:bg-ar-border'
              }`}
            >
              {surface.name}
            </button>
          ))}
        </div>
      </div>

      {/* Warp mode selector */}
      {activeSurface && (
        <div>
          <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">
            Warp Mode
          </p>
          <div className="flex flex-col gap-1">
            {WARP_MODES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setWarpMode(activeSurface.id, value)}
                className={`px-3 py-2 rounded text-sm transition-colors ${
                  activeSurface.warpMode === value
                    ? 'bg-ar-accent text-white'
                    : 'bg-ar-panel-alt text-ar-text hover:bg-ar-border'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Instruction text */}
          <p className="mt-3 text-xs text-ar-text-muted leading-relaxed">
            {MODE_INSTRUCTIONS[activeSurface.warpMode]}
          </p>
        </div>
      )}

      {/* Content assignment */}
      {activeSurface && (
        <div>
          <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">
            Content
          </p>
          {project.contentItems.length === 0 ? (
            <p className="text-xs text-ar-text-dim">No content yet. Generate in Create tab first.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {project.contentItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => assignContent(activeSurface.id, item.id)}
                  className={`px-3 py-2 rounded text-xs text-left transition-colors ${
                    activeSurface.contentId === item.id
                      ? 'bg-ar-accent/20 text-ar-accent border border-ar-accent/40'
                      : 'bg-ar-surface text-ar-text-muted hover:bg-ar-border border border-transparent'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mesh density selector */}
      {activeSurface && activeSurface.warpMode === 'mesh' && (
        <div>
          <p className="text-xs font-semibold text-ar-text-muted uppercase tracking-wider mb-2">
            Mesh Density
          </p>
          <div className="grid grid-cols-3 gap-1">
            {DENSITIES.map(({ label, cols, rows }) => {
              const isActive =
                activeSurface.meshGrid.cols === cols &&
                activeSurface.meshGrid.rows === rows;
              return (
                <button
                  key={label}
                  onClick={() => setMeshDensity(activeSurface.id, cols, rows)}
                  className={`px-2 py-1.5 rounded text-xs transition-colors ${
                    isActive
                      ? 'bg-ar-accent text-white'
                      : 'bg-ar-panel-alt text-ar-text hover:bg-ar-border'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when no surface selected */}
      {!activeSurface && (
        <p className="text-xs text-ar-text-muted">
          Select a surface to configure warping
        </p>
      )}
    </div>
  );
}
