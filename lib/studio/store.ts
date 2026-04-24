'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  StudioState, StudioFace, StudioLayer, StudioBlackout,
  StudioPoint, StudioTool, FACE_COLORS,
} from './types';

function uid() { return Math.random().toString(36).slice(2, 9); }

interface StudioStore extends StudioState {
  // Reference
  setReference(url: string, w: number, h: number): void;

  // Faces
  addFace(corners: [StudioPoint, StudioPoint, StudioPoint, StudioPoint]): string;
  removeFace(id: string): void;
  setActiveFace(id: string | null): void;
  updateFaceCorner(faceId: string, cornerIndex: number, point: StudioPoint): void;
  renameFace(id: string, name: string): void;

  // Pending corner clicks (while addFace tool active)
  addPendingCorner(p: StudioPoint): void;
  clearPendingCorners(): void;

  // Layers
  addLayer(layer: Omit<StudioLayer, 'id'>): string;
  removeLayer(id: string): void;
  setActiveLayer(id: string | null): void;
  updateLayer(id: string, patch: Partial<StudioLayer>): void;
  assignLayerToFace(layerId: string, faceId: string | null): void;
  reorderLayers(ids: string[]): void;

  // Blackout
  addBlackout(b: Omit<StudioBlackout, 'id'>): void;
  removeBlackout(id: string): void;

  // Tool
  setTool(t: StudioTool): void;

  // UI
  setShowReference(v: boolean): void;
  setReferenceOpacity(v: number): void;
  setShowGrid(v: boolean): void;
  setProjectorOpen(v: boolean): void;
}

export const useStudioStore = create<StudioStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      referenceUrl: null,
      referenceWidth: 1920,
      referenceHeight: 1080,
      faces: [],
      activeFaceId: null,
      layers: [],
      activeLayerId: null,
      blackouts: [],
      tool: 'select',
      pendingCorners: [],
      showReference: true,
      referenceOpacity: 0.5,
      showGrid: false,
      projectorOpen: false,

      // ── Reference ────────────────────────────────────────────────────────
      setReference: (url, w, h) => set({ referenceUrl: url, referenceWidth: w, referenceHeight: h }),

      // ── Faces ────────────────────────────────────────────────────────────
      addFace: (corners) => {
        const id = uid();
        const existing = get().faces.length;
        const color = FACE_COLORS[existing % FACE_COLORS.length];
        const name = `Surface ${existing + 1}`;
        set(s => ({ faces: [...s.faces, { id, name, corners, color }] }));
        return id;
      },
      removeFace: (id) =>
        set(s => ({
          faces: s.faces.filter(f => f.id !== id),
          layers: s.layers.map(l => l.faceId === id ? { ...l, faceId: null } : l),
          activeFaceId: s.activeFaceId === id ? null : s.activeFaceId,
        })),
      setActiveFace: (id) => set({ activeFaceId: id }),
      updateFaceCorner: (faceId, idx, point) =>
        set(s => ({
          faces: s.faces.map(f => {
            if (f.id !== faceId) return f;
            const c = [...f.corners] as typeof f.corners;
            c[idx] = point;
            return { ...f, corners: c };
          }),
        })),
      renameFace: (id, name) =>
        set(s => ({ faces: s.faces.map(f => f.id === id ? { ...f, name } : f) })),

      // ── Pending corners ──────────────────────────────────────────────────
      addPendingCorner: (p) =>
        set(s => {
          const next = [...s.pendingCorners, p];
          if (next.length === 4) {
            // Commit face
            const id = uid();
            const existing = s.faces.length;
            const color = FACE_COLORS[existing % FACE_COLORS.length];
            return {
              pendingCorners: [],
              faces: [...s.faces, {
                id,
                name: `Surface ${existing + 1}`,
                corners: next as [StudioPoint, StudioPoint, StudioPoint, StudioPoint],
                color,
              }],
              activeFaceId: id,
            };
          }
          return { pendingCorners: next };
        }),
      clearPendingCorners: () => set({ pendingCorners: [] }),

      // ── Layers ───────────────────────────────────────────────────────────
      addLayer: (layer) => {
        const id = uid();
        set(s => ({ layers: [...s.layers, { ...layer, id }], activeLayerId: id }));
        return id;
      },
      removeLayer: (id) =>
        set(s => ({
          layers: s.layers.filter(l => l.id !== id),
          activeLayerId: s.activeLayerId === id ? null : s.activeLayerId,
        })),
      setActiveLayer: (id) => set({ activeLayerId: id }),
      updateLayer: (id, patch) =>
        set(s => ({ layers: s.layers.map(l => l.id === id ? { ...l, ...patch } : l) })),
      assignLayerToFace: (layerId, faceId) =>
        set(s => ({ layers: s.layers.map(l => l.id === layerId ? { ...l, faceId } : l) })),
      reorderLayers: (ids) =>
        set(s => ({ layers: ids.map(id => s.layers.find(l => l.id === id)!).filter(Boolean) })),

      // ── Blackout ─────────────────────────────────────────────────────────
      addBlackout: (b) => set(s => ({ blackouts: [...s.blackouts, { ...b, id: uid() }] })),
      removeBlackout: (id) => set(s => ({ blackouts: s.blackouts.filter(b => b.id !== id) })),

      // ── Tool ─────────────────────────────────────────────────────────────
      setTool: (t) => set({ tool: t, pendingCorners: [] }),

      // ── UI ───────────────────────────────────────────────────────────────
      setShowReference: (v) => set({ showReference: v }),
      setReferenceOpacity: (v) => set({ referenceOpacity: v }),
      setShowGrid: (v) => set({ showGrid: v }),
      setProjectorOpen: (v) => set({ projectorOpen: v }),
    }),
    {
      name: 'artrevive-studio',
      partialize: (s) => ({
        referenceUrl: s.referenceUrl,
        referenceWidth: s.referenceWidth,
        referenceHeight: s.referenceHeight,
        faces: s.faces,
        layers: s.layers,
        blackouts: s.blackouts,
        showReference: s.showReference,
        referenceOpacity: s.referenceOpacity,
        showGrid: s.showGrid,
      }),
    },
  ),
);

// Broadcast studio state to projector window
export function broadcastStudioState() {
  if (typeof window === 'undefined') return;
  const s = useStudioStore.getState();
  const payload = {
    faces: s.faces,
    layers: s.layers,
    blackouts: s.blackouts,
    referenceUrl: s.referenceUrl,
    referenceWidth: s.referenceWidth,
    referenceHeight: s.referenceHeight,
  };
  try {
    const ch = new BroadcastChannel('artrevive-studio');
    ch.postMessage({ type: 'STUDIO_UPDATE', payload });
    ch.close();
  } catch {}
}
