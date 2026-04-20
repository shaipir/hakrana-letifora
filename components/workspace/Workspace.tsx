'use client';

import { useMappingStore } from '@/lib/mapping-store';
import { useArtReviveStore } from '@/lib/artrevive-store';
import ModeTabBar from '@/components/mapping/ModeTabBar';
import TopBar from './TopBar';
import RestylePanel from './RestylePanel';
import GlowSculpturePanel from './GlowSculpturePanel';
import HouseProjectionPanel from './HouseProjectionPanel';
import LoopControlsPanel from './LoopControlsPanel';
import CanvasArea from './CanvasArea';
import HistoryPanel from './HistoryPanel';

export default function Workspace() {
  const { activeTab } = useMappingStore();
  const { activeMode } = useArtReviveStore();

  return (
    <div className="flex flex-col h-screen bg-ar-bg text-ar-text overflow-hidden">
      <TopBar />
      <ModeTabBar />
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'create' && (
          <>
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
          </>
        )}
        {activeTab === 'map' && (
          <div className="flex flex-1 items-center justify-center text-ar-text-muted text-sm">
            Map tab — coming next
          </div>
        )}
        {activeTab === 'warp' && (
          <div className="flex flex-1 items-center justify-center text-ar-text-muted text-sm">
            Warp tab — coming next
          </div>
        )}
        {activeTab === 'live' && (
          <div className="flex flex-1 items-center justify-center text-ar-text-muted text-sm">
            Live tab — coming next
          </div>
        )}
      </div>
    </div>
  );
}
