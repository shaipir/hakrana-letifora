'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Layers, Sliders, Upload, Save, Monitor, MousePointer, Maximize, Scissors, Brush, Move, Target } from 'lucide-react';
import LayerPanel from '@/components/ui/LayerPanel';
import EffectsPanel from '@/components/ui/EffectsPanel';
import MediaImport from '@/components/ui/MediaImport';
import { useAppStore } from '@/lib/store';
import { saveProject, loadProject } from '@/lib/projectUtils';
import type { Tool } from '@/lib/types';
import clsx from 'clsx';

const ProjectionCanvas = dynamic(() => import('@/components/canvas/ProjectionCanvas'), { ssr: false });

type Panel = 'layers' | 'effects' | 'media';

const PANELS = [
  { id: 'layers' as Panel,  icon: <Layers size={14} />,  label: 'שכבות' },
  { id: 'effects' as Panel, icon: <Sliders size={14} />, label: 'אפקטים' },
  { id: 'media' as Panel,   icon: <Upload size={14} />,  label: 'מדיה' },
];

const TOOLS: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select',      icon: <MousePointer size={15} />, label: 'בחר',        shortcut: 'V' },
  { id: 'cornerpin',   icon: <Maximize size={15} />,     label: 'Corner Pin', shortcut: 'C' },
  { id: 'mask',        icon: <Scissors size={15} />,     label: 'Mask',       shortcut: 'M' },
  { id: 'draw',        icon: <Brush size={15} />,        label: 'צייר',        shortcut: 'D' },
  { id: 'warp',        icon: <Move size={15} />,         label: 'Warp',       shortcut: 'W' },
  { id: 'region_select', icon: <Target size={15} />,     label: 'אזורים',      shortcut: 'R' },
];

function EditorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams.get('project');
  const { layers, name, activeTool, isProjectorMode, setActiveTool, toggleProjectorMode, loadProject: loadStore } = useAppStore();
  const [panel, setPanel] = useState<Panel>('layers');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load project from Supabase
  useEffect(() => {
    if (!projectId) return;
    loadProject(projectId).then(data => {
      if (data?.project) {
        loadStore({
          id: data.project.id,
          name: data.project.name,
          type: data.project.type,
          canvasWidth: data.project.canvas_width,
          canvasHeight: data.project.canvas_height,
        });
      }
    });
  }, [projectId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const tool = TOOLS.find(t => t.shortcut === e.key.toUpperCase());
      if (tool) setActiveTool(tool.id);
      if (e.key === 'p' || e.key === 'P') toggleProjectorMode();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveTool, toggleProjectorMode]);

  const handleSave = useCallback(async () => {
    if (!projectId) return;
    setSaving(true);
    await saveProject(projectId, name, layers);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [projectId, name, layers]);

  // Autosave every 30s
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(handleSave, 30000);
    return () => clearInterval(interval);
  }, [handleSave, projectId]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      {/* Left toolbar */}
      <div className="flex flex-col items-center gap-1 py-2 px-1 bg-panel border-r border-border w-11 shrink-0">
        <button onClick={() => router.push('/projects')} className="p-2 text-gray-500 hover:text-white transition-colors mb-1">
          <ChevronLeft size={15} />
        </button>
        <div className="w-full h-px bg-border" />
        {TOOLS.map(t => (
          <button key={t.id} title={`${t.label} (${t.shortcut})`} onClick={() => setActiveTool(t.id)}
            className={clsx('w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              activeTool === t.id ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-gray-500 hover:text-white hover:bg-surface'
            )}>{t.icon}</button>
        ))}
        <div className="flex-1" />
        {/* Projector toggle */}
        <button onClick={toggleProjectorMode} title="Projector (P)"
          className={clsx('w-9 h-9 rounded-lg flex items-center justify-center transition-all mb-1',
            isProjectorMode ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white hover:bg-surface'
          )}>
          <Monitor size={15} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <ProjectionCanvas />

        {/* Projector badge */}
        {isProjectorMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-600/90 text-white text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        )}

        {/* Tool hint */}
        <div className="absolute bottom-3 left-3 text-[10px] text-gray-600">
          {activeTool === 'cornerpin' && 'גרור פינות כדי לעוות'}
          {activeTool === 'mask' && 'צייר מסכה חופשית'}
          {activeTool === 'draw' && 'צייר ישירות על הקנבס'}
          {activeTool === 'region_select' && 'בחר אזור אוטומטי מהפרצוף'}
        </div>

        {/* Save button */}
        {projectId && (
          <button onClick={handleSave} disabled={saving}
            className={clsx(
              'absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              saved ? 'bg-green-600 text-white' : 'glass text-gray-300 hover:text-white'
            )}>
            <Save size={13} />
            {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור'}
          </button>
        )}
      </div>

      {/* Right sidebar */}
      <div className={clsx('flex transition-all duration-200 shrink-0', sidebarOpen ? 'w-60' : 'w-0 overflow-hidden')}>
        <div className="flex flex-col w-60 bg-panel border-l border-border">
          <div className="flex border-b border-border shrink-0">
            {PANELS.map(p => (
              <button key={p.id} onClick={() => setPanel(p.id)}
                className={clsx('flex-1 flex flex-col items-center gap-0.5 py-2 text-[9px] transition-colors',
                  panel === p.id ? 'text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
                )}>
                {p.icon}{p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {panel === 'layers'  && <LayerPanel />}
            {panel === 'effects' && <EffectsPanel />}
            {panel === 'media'   && <MediaImport />}
          </div>
        </div>
      </div>

      {/* Sidebar toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ right: sidebarOpen ? '240px' : '0' }}
        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-10 bg-panel border border-border rounded-l-md flex items-center justify-center text-gray-600 hover:text-white transition-colors z-10">
        {sidebarOpen ? '›' : '‹'}
      </button>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-gray-500">טוען עורך...</div>}>
      <EditorInner />
    </Suspense>
  );
}
