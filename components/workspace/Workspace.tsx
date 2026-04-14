'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import TopBar from './TopBar';
import RestylePanel from './RestylePanel';
import GlowSculpturePanel from './GlowSculpturePanel';
import HouseProjectionPanel from './HouseProjectionPanel';
import LoopControlsPanel from './LoopControlsPanel';
import CanvasArea from './CanvasArea';
import HistoryPanel from './HistoryPanel';

export default function Workspace() {
  const { activeMode } = useArtReviveStore();

  return (
    <div className="flex flex-col h-screen bg-ar-bg text-ar-text overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="flex flex-col shrink-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {activeMode === 'restyle'
              ? <RestylePanel />
              : activeMode === 'glow-sculpture'
              ? <GlowSculpturePanel />
              : <HouseProjectionPanel />}
          </div>
          <LoopControlsPanel />
        </div>
        <CanvasArea />
        <HistoryPanel />
      </div>
    </div>
  );
}
