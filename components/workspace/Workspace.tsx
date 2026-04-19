'use client';

import { useEffect, useRef, useState } from 'react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { saveProjectToStorage } from '@/lib/project-persistence';
import TopBar from './TopBar';
import StylePanel from './StylePanel';
import LoopControlsPanel from './LoopControlsPanel';
import CanvasArea from './CanvasArea';
import HistoryPanel from './HistoryPanel';
import ProjectionWorkflowPanel from './ProjectionWorkflowPanel';
import ProjectHistoryPanel from './ProjectHistoryPanel';
import GridLayoutPanel from './GridLayoutPanel';

type LeftTab = 'settings' | 'projection';
type RightTab = 'history' | 'generations';

const AUTOSAVE_DEBOUNCE_MS = 2000;

export default function Workspace() {
  const { activeMode, project } = useArtReviveStore();
  const [leftTab, setLeftTab] = useState<LeftTab>('settings');
  const [rightTab, setRightTab] = useState<RightTab>('history');
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Autosave on project change ────────────────────────────────────────────
  useEffect(() => {
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveProjectToStorage(project);
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [project.updatedAt]); // only fires when something actually changed

  // Broadcast state to projection output window whenever project changes
  const projBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (projBroadcastRef.current) clearTimeout(projBroadcastRef.current);
    projBroadcastRef.current = setTimeout(() => {
      // Only broadcast if projection channel might be open
      if (typeof window === 'undefined') return;
      const projState = {
        gridLayouts: project.gridLayouts,
        activeGridId: project.activeGridId,
        generatedAssets: project.generatedAssets,
        uploadedAssetUrl: project.uploadedAsset?.url ?? null,
        viewMode: 'final',
      };
      try {
        localStorage.setItem('artrevive_projection_state', JSON.stringify(projState));
        const ch = new BroadcastChannel('artrevive-projection');
        ch.postMessage({ type: 'STATE_UPDATE', payload: projState });
        ch.close();
      } catch {}
    }, 500);
    return () => { if (projBroadcastRef.current) clearTimeout(projBroadcastRef.current); };
  }, [project.updatedAt]);

  // Switch to projection tab automatically when first result comes in
  const prevAssetCount = useRef(project.generatedAssets.length);
  useEffect(() => {
    if (project.generatedAssets.length > prevAssetCount.current) {
      prevAssetCount.current = project.generatedAssets.length;
      // Show generation history tab when new result arrives
      setRightTab('history');
    }
  }, [project.generatedAssets.length]);

  return (
    <div className="flex flex-col h-screen bg-ar-bg text-ar-text overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel ───────────────────────────────────────────────── */}
        <div className="flex flex-col w-64 shrink-0 overflow-hidden border-r border-ar-border">
          {/* Tab switcher */}
          <div className="flex border-b border-ar-border shrink-0 bg-ar-panel">
            <button
              onClick={() => setLeftTab('settings')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                leftTab === 'settings'
                  ? 'text-ar-text border-b-2 border-ar-accent bg-ar-surface/40'
                  : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface/20'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setLeftTab('projection')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                leftTab === 'projection'
                  ? 'text-ar-text border-b-2 border-ar-accent bg-ar-surface/40'
                  : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface/20'
              }`}
            >
              Projection
              {(project.projectionAreas.length > 0 ||
                project.projectionZones.length > 0 ||
                project.objectIsolation.enabled ||
                project.warpSettings.enabled ||
                project.gridLayouts.length > 0) && (
                <span className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-ar-accent" />
              )}
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {leftTab === 'settings' ? (
              <StylePanel />
            ) : (
              <>
                <ProjectionWorkflowPanel />
                <div className="border-t border-ar-border/50 mt-1" />
                <GridLayoutPanel />
              </>
            )}
          </div>

          <LoopControlsPanel />
        </div>

        {/* ── Canvas ───────────────────────────────────────────────────── */}
        <CanvasArea />

        {/* ── Right panel ──────────────────────────────────────────────── */}
        <div className="flex flex-col w-48 shrink-0 overflow-hidden border-l border-ar-border">
          {/* Tab switcher */}
          <div className="flex border-b border-ar-border shrink-0 bg-ar-panel">
            <button
              onClick={() => setRightTab('history')}
              className={`flex-1 py-2.5 text-[10px] font-medium transition-colors ${
                rightTab === 'history'
                  ? 'text-ar-text border-b-2 border-ar-accent bg-ar-surface/40'
                  : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface/20'
              }`}
            >
              Results
            </button>
            <button
              onClick={() => setRightTab('generations')}
              className={`flex-1 py-2.5 text-[10px] font-medium transition-colors relative ${
                rightTab === 'generations'
                  ? 'text-ar-text border-b-2 border-ar-accent bg-ar-surface/40'
                  : 'text-ar-text-muted hover:text-ar-text hover:bg-ar-surface/20'
              }`}
            >
              History
              {project.generationHistory.length > 0 && (
                <span className="absolute top-2 right-2 text-[9px] bg-ar-accent/15 text-ar-accent border border-ar-accent/20 rounded-full px-1 leading-none py-0.5 font-mono">
                  {project.generationHistory.length}
                </span>
              )}
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {rightTab === 'history' ? (
              <HistoryPanel />
            ) : (
              <ProjectHistoryPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
