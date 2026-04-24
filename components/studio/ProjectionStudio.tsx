'use client';
import StudioToolbar from './StudioToolbar';
import StudioCanvas from './StudioCanvas';
import FacePanel from './FacePanel';
import LayerPanel from './LayerPanel';
import ReferencePanel from './ReferencePanel';

export default function ProjectionStudio() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <StudioToolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Faces + Reference ───────────────────────────────────── */}
        <div className="w-52 shrink-0 flex flex-col border-r border-ar-border overflow-hidden bg-ar-panel/50">
          <ReferencePanel />
          <div className="flex-1 overflow-hidden">
            <FacePanel />
          </div>
        </div>

        {/* ── Main canvas ───────────────────────────────────────────────── */}
        <StudioCanvas />

        {/* ── Right: Layers ─────────────────────────────────────────────── */}
        <div className="w-52 shrink-0 flex flex-col border-l border-ar-border overflow-hidden bg-ar-panel/50">
          <LayerPanel />
        </div>
      </div>
    </div>
  );
}
