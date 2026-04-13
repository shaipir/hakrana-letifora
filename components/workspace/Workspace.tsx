'use client';

import { useArtReviveStore } from '@/lib/artrevive-store';
import TopBar from './TopBar';
import RestylePanel from './RestylePanel';
import NeonContourPanel from './NeonContourPanel';
import HouseProjectionPanel from './HouseProjectionPanel';
import CanvasArea from './CanvasArea';
import HistoryPanel from './HistoryPanel';

export default function Workspace() {
  const { activeMode } = useArtReviveStore();

  return (
    <div className="flex flex-col h-screen bg-ar-bg text-ar-text overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: mode-specific controls */}
        {activeMode === 'restyle' ? <RestylePanel /> : activeMode === 'neon-contour' ? <NeonContourPanel /> : <HouseProjectionPanel />}

        {/* Center: canvas */}
        <CanvasArea />

        {/* Right: history / versions */}
        <HistoryPanel />
      </div>
    </div>
  );
}
