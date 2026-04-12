'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Layers, Sliders, Upload, ChevronRight, ChevronLeft, ArrowLeft, MousePointer, Maximize, Scissors, Brush, Move } from 'lucide-react';
import LayerPanel from '@/components/ui/LayerPanel';
import EffectsPanel from '@/components/ui/EffectsPanel';
import MediaImport from '@/components/ui/MediaImport';
import { useAppStore } from '@/lib/store';
import type { Tool } from '@/lib/types';
import clsx from 'clsx';

const ProjectionCanvas = dynamic(() => import('@/components/canvas/ProjectionCanvas'), { ssr: false });

type Panel = 'layers' | 'effects' | 'media';

const PANELS = [
  { id: 'layers' as Panel,  icon: <Layers size={15} />,  label: 'שכבות' },
  { id: 'effects' as Panel, icon: <Sliders size={15} />, label: 'אפקטים' },
  { id: 'media' as Panel,   icon: <Upload size={15} />,  label: 'מדיה' },
];

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer size={16} />, label: 'בחר' },
  { id: 'cornerpin', icon: <Maximize size={16} />,     label: 'Pin' },
  { id: 'mask',      icon: <Scissors size={16} />,     label: 'Mask' },
  { id: 'draw',      icon: <Brush size={16} />,        label: 'צייר' },
  { id: 'warp',      icon: <Move size={16} />,         label: 'Warp' },
];

export default function EditorPage() {
  const [activePanel, setActivePanel] = useState<Panel>('layers');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isProjectorMode, activeTool, setActiveTool } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">

      {/* Left: Tools */}
      <div className="flex flex-col items-center gap-1 py-3 px-1.5 bg-panel border-r border-border w-12">
        <Link href="/projects" className="p-2 text-gray-500 hover:text-white transition-colors mb-2">
          <ArrowLeft size={16} />
        </Link>
        <div className="w-full h-px bg-border mb-1" />
        {TOOLS.map(t => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setActiveTool(t.id)}
            className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
              activeTool === t.id ? 'bg-accent text-white shadow-lg shadow-accent/30' : 'text-gray-500 hover:text-white hover:bg-surface'
            )}
          >{t.icon}</button>
        ))}
        <div className="flex-1" />
        <div className={clsx(
          'w-3 h-3 rounded-full mb-1',
          isProjectorMode ? 'bg-green-500 animate-pulse' : 'bg-gray-600'
        )} title={isProjectorMode ? 'Live' : 'Preview'} />
      </div>

      {/* Center: Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <ProjectionCanvas />
        {isProjectorMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-green-600/90 text-white text-xs font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
          </div>
        )}
      </div>

      {/* Right: Sidebar */}
      <div className={clsx('flex transition-all duration-200', sidebarOpen ? 'w-64' : 'w-0 overflow-hidden')}>
        <div className="flex flex-col w-64 bg-panel border-l border-border">
          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {PANELS.map(p => (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                className={clsx(
                  'flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors',
                  activePanel === p.id ? 'text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300'
                )}>
                {p.icon}{p.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'layers'  && <LayerPanel />}
            {activePanel === 'effects' && <EffectsPanel />}
            {activePanel === 'media'   && <MediaImport />}
          </div>
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ right: sidebarOpen ? '256px' : '0' }}
        className="absolute top-1/2 -translate-y-1/2 w-4 h-10 bg-panel border border-border rounded-l-md flex items-center justify-center text-gray-500 hover:text-white transition-colors z-10"
      >
        {sidebarOpen ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </div>
  );
}
