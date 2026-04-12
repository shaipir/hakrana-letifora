'use client';
import { MousePointer, Move, Scissors, Brush, Maximize, Monitor } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Tool } from '@/lib/types';
import clsx from 'clsx';

const TOOLS: { id: Tool; icon: React.ReactNode; label: string }[] = [
  { id: 'select',    icon: <MousePointer size={18} />, label: 'בחר' },
  { id: 'cornerpin', icon: <Maximize size={18} />,     label: 'Corner Pin' },
  { id: 'mask',      icon: <Scissors size={18} />,     label: 'Mask' },
  { id: 'draw',      icon: <Brush size={18} />,        label: 'צייר' },
  { id: 'warp',      icon: <Move size={18} />,         label: 'Warp' },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, isProjectorMode, toggleProjectorMode } = useAppStore();

  return (
    <div className="flex flex-col items-center gap-1 py-3 px-1 bg-panel border-r border-border h-full">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          title={tool.label}
          onClick={() => setActiveTool(tool.id)}
          className={clsx(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150',
            activeTool === tool.id
              ? 'bg-accent text-white shadow-lg shadow-accent/30'
              : 'text-gray-500 hover:text-white hover:bg-surface'
          )}
        >
          {tool.icon}
        </button>
      ))}

      <div className="flex-1" />

      {/* Projector mode toggle */}
      <button
        title="מצב פרויקטור"
        onClick={toggleProjectorMode}
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150',
          isProjectorMode
            ? 'bg-green-600 text-white animate-pulse'
            : 'text-gray-500 hover:text-white hover:bg-surface'
        )}
      >
        <Monitor size={18} />
      </button>
    </div>
  );
}
