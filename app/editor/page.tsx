'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Layers, Sliders, Upload, ChevronRight, ChevronLeft } from 'lucide-react';
import Toolbar from '@/components/ui/Toolbar';
import LayerPanel from '@/components/ui/LayerPanel';
import EffectsPanel from '@/components/ui/EffectsPanel';
import MediaImport from '@/components/ui/MediaImport';
import { useAppStore } from '@/lib/store';

// Canvas uses browser APIs, load only on client
const ProjectionCanvas = dynamic(
  () => import('@/components/canvas/ProjectionCanvas'),
  { ssr: false }
);

type Panel = 'layers' | 'effects' | 'media';

const PANELS = [
  { id: 'layers' as Panel,  icon: <Layers size={16} />,  label: 'שכבות' },
  { id: 'effects' as Panel, icon: <Sliders size={16} />, label: 'אפקטים' },
  { id: 'media' as Panel,   icon: <Upload size={16} />,  label: 'מדיה' },
];

export default function EditorPage() {
  const [activePanel, setActivePanel] = useState<Panel>('layers');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isProjectorMode } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">

      {/* Left: Tool bar */}
      <Toolbar />

      {/* Center: Canvas */}
      <div className="flex-1 relative">
        <ProjectionCanvas />

        {/* Projector mode overlay */}
        {isProjectorMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-green-600/90 text-white text-xs font-semibold animate-pulse">
            ● מצב פרויקטור פעיל
          </div>
        )}
      </div>

      {/* Right: Sidebar */}
      <div className={`flex transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
        <div className="flex flex-col w-64 bg-panel border-l border-border">
          {/* Panel tabs */}
          <div className="flex border-b border-border">
            {PANELS.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePanel(p.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${
                  activePanel === p.id
                    ? 'text-white border-b-2 border-accent'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
            {activePanel === 'layers'  && <LayerPanel />}
            {activePanel === 'effects' && <EffectsPanel />}
            {activePanel === 'media'   && <MediaImport />}
          </div>
        </div>
      </div>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-12 bg-panel border border-border rounded-l-lg flex items-center justify-center text-gray-500 hover:text-white transition-colors z-10"
        style={{ right: sidebarOpen ? '256px' : '0' }}
      >
        {sidebarOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );
}
