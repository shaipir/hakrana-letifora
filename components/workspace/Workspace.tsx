'use client';

import { useEffect } from 'react';
import { useMappingStore, syncContentFromArtRevive } from '@/lib/mapping-store';
import { useArtReviveStore } from '@/lib/artrevive-store';
import ModeTabBar from '@/components/mapping/ModeTabBar';
import DrawingToolbar from '@/components/mapping/DrawingToolbar';
import ShapeLibrary from '@/components/mapping/ShapeLibrary';
import SurfacePanel from '@/components/mapping/SurfacePanel';
import PhotoUpload from '@/components/mapping/PhotoUpload';
import DetectionOverlay from '@/components/mapping/DetectionOverlay';
import MapCanvas from '@/components/mapping/MapCanvas';
import WarpCanvas from '@/components/mapping/WarpCanvas';
import WarpControls from '@/components/mapping/WarpControls';
import LiveCanvas from '@/components/mapping/LiveCanvas';
import LiveControls from '@/components/mapping/LiveControls';
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

  useEffect(() => {
    console.log('[MAPPING:Workspace] Tab switched to:', activeTab);
    if (activeTab !== 'create') {
      console.log('[MAPPING:Workspace] Calling syncContentFromArtRevive for tab:', activeTab);
      syncContentFromArtRevive();
    }
  }, [activeTab]);

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
          <>
            <div className="w-[240px] flex flex-col shrink-0 overflow-y-auto border-r border-ar-border bg-ar-panel">
              <PhotoUpload />
              <DetectionOverlay />
              <DrawingToolbar />
              <ShapeLibrary />
              <SurfacePanel />
            </div>
            <MapCanvas />
          </>
        )}
        {activeTab === 'warp' && (
          <>
            <div className="w-[240px] flex flex-col shrink-0 overflow-y-auto border-r border-ar-border bg-ar-panel">
              <WarpControls />
              <SurfacePanel />
            </div>
            <WarpCanvas />
          </>
        )}
        {activeTab === 'live' && (
          <>
            <div className="w-[260px] flex flex-col shrink-0 overflow-y-auto border-r border-ar-border bg-ar-panel">
              <LiveControls />
            </div>
            <LiveCanvas />
          </>
        )}
      </div>
    </div>
  );
}
