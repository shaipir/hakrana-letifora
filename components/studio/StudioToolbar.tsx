'use client';
import { MousePointer2, Plus, Square, Wand2, Grid3X3, Eye, EyeOff, Monitor, Trash2, Undo2 } from 'lucide-react';
import { useStudioStore } from '@/lib/studio/store';
import { StudioTool } from '@/lib/studio/types';

const TOOLS: { id: StudioTool; icon: React.ReactNode; label: string; hint: string }[] = [
  { id: 'select',  icon: <MousePointer2 className="w-4 h-4" />, label: 'Select',   hint: 'Select & move faces' },
  { id: 'addFace', icon: <Plus className="w-4 h-4" />,          label: 'Add Face', hint: 'Click 4 corners to define a surface' },
  { id: 'warp',    icon: <Wand2 className="w-4 h-4" />,         label: 'Warp',     hint: 'Drag corners to refine alignment' },
  { id: 'blackout',icon: <Square className="w-4 h-4" />,        label: 'Blackout', hint: 'Paint areas that stay black' },
];

export default function StudioToolbar() {
  const {
    tool, setTool,
    showReference, setShowReference,
    showGrid, setShowGrid,
    pendingCorners, clearPendingCorners,
    projectorOpen, setProjectorOpen,
    faces, layers, blackouts,
  } = useStudioStore();

  function openProjector() {
    const w = window.open('/projector', 'artrevive-projector', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
    if (w) {
      setProjectorOpen(true);
      w.addEventListener('close', () => setProjectorOpen(false));
      // Broadcast state after short delay (page needs to load)
      setTimeout(() => {
        const { broadcastStudioState } = require('@/lib/studio/store');
        broadcastStudioState();
      }, 800);
    }
  }

  return (
    <div className="h-11 shrink-0 flex items-center gap-1 px-3 border-b border-ar-border bg-ar-panel">
      {/* Tool buttons */}
      <div className="flex items-center gap-0.5 border border-ar-border rounded-lg p-0.5 bg-ar-surface/30">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            title={t.hint}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              tool === t.id
                ? 'bg-ar-accent text-black shadow-sm'
                : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-border/40'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Pending corners indicator */}
      {tool === 'addFace' && pendingCorners.length > 0 && (
        <div className="flex items-center gap-2 ml-1 px-2.5 py-1.5 rounded-lg bg-ar-accent/10 border border-ar-accent/30 text-ar-accent text-xs">
          <span>{pendingCorners.length}/4 corners placed</span>
          <button onClick={clearPendingCorners} className="hover:text-white transition-colors" title="Cancel">
            <Undo2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* View toggles */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowReference(!showReference)}
          title={showReference ? 'Hide reference image' : 'Show reference image'}
          className={`p-2 rounded-lg text-xs transition-colors ${
            showReference ? 'text-ar-accent bg-ar-accent/10' : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface'
          }`}
        >
          {showReference ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          title={showGrid ? 'Hide grid' : 'Show grid'}
          className={`p-2 rounded-lg text-xs transition-colors ${
            showGrid ? 'text-ar-accent bg-ar-accent/10' : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface'
          }`}
        >
          <Grid3X3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-ar-border mx-1" />

        {/* Stats */}
        <span className="text-[10px] text-ar-text-dim font-mono px-1">
          {faces.length}F · {layers.filter(l => l.type !== 'blackout').length}L
        </span>

        <div className="w-px h-5 bg-ar-border mx-1" />

        {/* Projector output */}
        <button
          onClick={openProjector}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300 hover:bg-violet-500/30 transition-colors text-xs font-medium"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Projector</span>
          {projectorOpen && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
        </button>
      </div>
    </div>
  );
}
