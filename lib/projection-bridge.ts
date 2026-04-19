'use client';

import type { GridLayout, GeneratedAsset } from './types';

export const PROJECTION_CHANNEL = 'artrevive-projection';

export interface ProjectionState {
  gridLayouts: GridLayout[];
  activeGridId: string | null;
  generatedAssets: GeneratedAsset[];
  generatedLoopFrames: Record<string, string[]>;
  activeLoopId: string | null;
  blackoutOutside: boolean;
  viewMode: 'original' | 'final' | 'overlay';
  uploadedAssetUrl: string | null;
}

export type ProjectionMessage =
  | { type: 'STATE_UPDATE'; payload: ProjectionState }
  | { type: 'PING' }
  | { type: 'PONG' };

export function sendProjectionState(state: object) {
  if (typeof window === 'undefined') return;
  try {
    const ch = new BroadcastChannel(PROJECTION_CHANNEL);
    ch.postMessage({ type: 'STATE_UPDATE', payload: state });
    ch.close();
    // Also write to localStorage as fallback
    localStorage.setItem('artrevive_projection_state', JSON.stringify(state));
  } catch {}
}

export function createProjectionSender() {
  const channel = new BroadcastChannel(PROJECTION_CHANNEL);
  return {
    send(state: ProjectionState) {
      const msg: ProjectionMessage = { type: 'STATE_UPDATE', payload: state };
      channel.postMessage(msg);
      try { localStorage.setItem('artrevive_projection_state', JSON.stringify(state)); } catch {}
    },
    destroy() { channel.close(); },
  };
}

export function createProjectionReceiver() {
  const channel = new BroadcastChannel(PROJECTION_CHANNEL);
  return {
    onMessage(cb: (msg: ProjectionMessage) => void) {
      channel.onmessage = (e) => cb(e.data as ProjectionMessage);
    },
    destroy() { channel.close(); },
  };
}
