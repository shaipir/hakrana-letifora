'use client';

import { MousePointer, PenTool, Pencil, Square } from 'lucide-react';
import { useMappingStore } from '@/lib/mapping-store';
import { DrawingTool, SnapMode } from '@/lib/mapping-types';

const TOOLS: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',   icon: <MousePointer size={16} />, label: 'Select' },
  { id: 'polyline', icon: <PenTool size={16} />,      label: 'Polyline' },
  { id: 'brush',    icon: <Pencil size={16} />,        label: 'Freehand' },
  { id: 'shape',    icon: <Square size={16} />,        label: 'Shape' },
];

const SNAP_MODES: { id: SnapMode; label: string }[] = [
  { id: 'grid', label: 'Grid' },
  { id: 'edge', label: 'Edge' },
  { id: 'none', label: 'Off' },
];

const GRID_SIZES = [10, 20, 40, 60];

export default function DrawingToolbar() {
  const { drawing, setDrawingTool, setSnapMode, setGridSize, cancelDrawing } =
    useMappingStore();

  return (
    <div className="p-3 space-y-3 border-b border-ar-border">
      {/* Heading */}
      <p className="text-xs uppercase tracking-wider text-ar-text-muted">Tools</p>

      {/* Tool buttons */}
      <div className="flex items-center gap-1">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setDrawingTool(tool.id)}
            className={`flex-1 flex items-center justify-center py-1.5 rounded text-xs transition-all ${
              drawing.tool === tool.id
                ? 'bg-ar-accent/15 text-ar-accent border border-ar-accent/40'
                : 'text-ar-text-muted hover:text-ar-text bg-ar-surface border border-transparent'
            }`}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Snap subsection */}
      <div className="space-y-1.5">
        <p className="text-xs uppercase tracking-wider text-ar-text-muted">Snap</p>
        <div className="flex items-center gap-1">
          {SNAP_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setSnapMode(mode.id)}
              className={`flex-1 py-1 rounded text-xs transition-all ${
                drawing.snapMode === mode.id
                  ? 'bg-ar-accent/15 text-ar-accent border border-ar-accent/40'
                  : 'text-ar-text-muted hover:text-ar-text bg-ar-surface border border-transparent'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid size selector (only when snapMode === 'grid') */}
      {drawing.snapMode === 'grid' && (
        <div className="flex items-center gap-1">
          {GRID_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setGridSize(size)}
              className={`flex-1 py-1 rounded text-xs transition-all ${
                drawing.gridSize === size
                  ? 'bg-ar-accent/15 text-ar-accent border border-ar-accent/40'
                  : 'text-ar-text-muted hover:text-ar-text bg-ar-surface border border-transparent'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {/* Cancel drawing button */}
      {drawing.isDrawing && (
        <button
          onClick={cancelDrawing}
          className="w-full text-xs text-ar-neon-pink hover:opacity-80 transition-opacity text-left"
        >
          Cancel (Esc)
        </button>
      )}
    </div>
  );
}
