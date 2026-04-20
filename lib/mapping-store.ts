// lib/mapping-store.ts
import { create } from 'zustand';
import { Point } from './types';
import {
  MappingTab,
  WarpMode,
  DrawingTool,
  SnapMode,
  MeshGrid,
  BezierSurface,
  Surface,
  SurfaceOutline,
  ContentItem,
  DetectedZone,
  MappingProject,
  DrawingState,
  LiveState,
} from './mapping-types';

// ─── Helper Functions ────────────────────────────────────────────────────────

export function createDefaultMeshGrid(
  cols: number,
  rows: number,
  width: number,
  height: number,
): MeshGrid {
  const points: Point[][] = [];
  for (let r = 0; r <= rows; r++) {
    const row: Point[] = [];
    for (let c = 0; c <= cols; c++) {
      row.push({
        x: (c / cols) * width,
        y: (r / rows) * height,
      });
    }
    points.push(row);
  }
  return { cols, rows, points };
}

export function createDefaultBezierSurface(width: number, height: number): BezierSurface {
  const size = 4;
  const controlPoints: Point[][] = [];
  const handles = [];
  for (let r = 0; r < size; r++) {
    const cpRow: Point[] = [];
    const hRow = [];
    for (let c = 0; c < size; c++) {
      cpRow.push({
        x: (c / (size - 1)) * width,
        y: (r / (size - 1)) * height,
      });
      hRow.push({
        inTangent: { x: -20, y: 0 },
        outTangent: { x: 20, y: 0 },
      });
    }
    controlPoints.push(cpRow);
    handles.push(hRow);
  }
  return { controlPoints, handles };
}

export function createDefaultSurface(index: number): Surface {
  const width = 800;
  const height = 600;
  const emptyOutline: SurfaceOutline = {
    type: 'freehand',
    path: '',
    points: [],
  };
  return {
    id: crypto.randomUUID(),
    name: `Surface ${index + 1}`,
    outline: emptyOutline,
    contentId: null,
    warpMode: 'corner-pin',
    cornerPin: {
      topLeft: { x: 0, y: 0 },
      topRight: { x: width, y: 0 },
      bottomLeft: { x: 0, y: height },
      bottomRight: { x: width, y: height },
    },
    meshGrid: createDefaultMeshGrid(4, 4, width, height),
    bezierSurface: createDefaultBezierSurface(width, height),
    opacity: 1,
    blendMode: 'normal',
    visible: true,
  };
}

export function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  const parts = [`M ${first.x} ${first.y}`];
  for (const p of rest) {
    parts.push(`L ${p.x} ${p.y}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

// ─── Default State Factories ─────────────────────────────────────────────────

function makeDefaultProject(): MappingProject {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Mapping',
    surfaces: [],
    activeSurfaceId: null,
    referencePhotoUrl: null,
    detectedZones: [],
    contentItems: [],
    canvasWidth: 1920,
    canvasHeight: 1080,
  };
}

function makeDefaultDrawingState(): DrawingState {
  return {
    tool: 'select',
    snapMode: 'grid',
    gridSize: 20,
    currentPoints: [],
    isDrawing: false,
  };
}

function makeDefaultLiveState(): LiveState {
  return {
    isLive: false,
    projectorWindowRef: null,
    masterOpacity: 1,
    blackout: false,
    frozen: false,
    crossfadeDuration: 500,
  };
}

// ─── State Interface ──────────────────────────────────────────────────────────

export interface MappingState {
  activeTab: MappingTab;
  project: MappingProject;
  drawing: DrawingState;
  live: LiveState;

  // Tab
  setActiveTab: (tab: MappingTab) => void;

  // Surfaces
  addSurface: () => void;
  removeSurface: (id: string) => void;
  setActiveSurface: (id: string | null) => void;
  updateSurface: (id: string, patch: Partial<Surface>) => void;
  setWarpMode: (id: string, mode: WarpMode) => void;
  updateMeshPoint: (surfaceId: string, row: number, col: number, point: Point) => void;
  updateBezierPoint: (surfaceId: string, row: number, col: number, point: Point) => void;
  setMeshDensity: (surfaceId: string, cols: number, rows: number) => void;

  // Content
  addContentItem: (item: ContentItem) => void;
  assignContent: (surfaceId: string, contentId: string) => void;

  // Reference photo / zones
  setReferencePhoto: (url: string | null) => void;
  setDetectedZones: (zones: DetectedZone[]) => void;
  acceptZone: (zoneId: string) => void;
  rejectZone: (zoneId: string) => void;

  // Drawing
  setDrawingTool: (tool: DrawingTool) => void;
  setSnapMode: (mode: SnapMode) => void;
  setGridSize: (size: number) => void;
  addDrawingPoint: (point: Point) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;

  // Live
  setLive: (isLive: boolean) => void;
  setBlackout: (b: boolean) => void;
  setFrozen: (f: boolean) => void;
  setMasterOpacity: (o: number) => void;
  setCrossfadeDuration: (ms: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useMappingStore = create<MappingState>((set, get) => ({
  activeTab: 'create',
  project: makeDefaultProject(),
  drawing: makeDefaultDrawingState(),
  live: makeDefaultLiveState(),

  // ── Tab ──────────────────────────────────────────────────────────────────
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Surfaces ──────────────────────────────────────────────────────────────
  addSurface: () =>
    set((s) => {
      if (s.project.surfaces.length >= 4) return s;
      const newSurface = createDefaultSurface(s.project.surfaces.length);
      return {
        project: {
          ...s.project,
          surfaces: [...s.project.surfaces, newSurface],
          activeSurfaceId: newSurface.id,
        },
      };
    }),

  removeSurface: (id) =>
    set((s) => {
      const surfaces = s.project.surfaces.filter((surf) => surf.id !== id);
      const activeSurfaceId =
        s.project.activeSurfaceId === id ? null : s.project.activeSurfaceId;
      return {
        project: { ...s.project, surfaces, activeSurfaceId },
      };
    }),

  setActiveSurface: (id) =>
    set((s) => ({ project: { ...s.project, activeSurfaceId: id } })),

  updateSurface: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        surfaces: s.project.surfaces.map((surf) =>
          surf.id === id ? { ...surf, ...patch } : surf,
        ),
      },
    })),

  setWarpMode: (id, mode) =>
    set((s) => ({
      project: {
        ...s.project,
        surfaces: s.project.surfaces.map((surf) =>
          surf.id === id ? { ...surf, warpMode: mode } : surf,
        ),
      },
    })),

  updateMeshPoint: (surfaceId, row, col, point) =>
    set((s) => ({
      project: {
        ...s.project,
        surfaces: s.project.surfaces.map((surf) => {
          if (surf.id !== surfaceId) return surf;
          const points = surf.meshGrid.points.map((r, ri) =>
            r.map((p, ci) => (ri === row && ci === col ? point : p)),
          );
          return { ...surf, meshGrid: { ...surf.meshGrid, points } };
        }),
      },
    })),

  updateBezierPoint: (surfaceId, row, col, point) =>
    set((s) => ({
      project: {
        ...s.project,
        surfaces: s.project.surfaces.map((surf) => {
          if (surf.id !== surfaceId) return surf;
          const controlPoints = surf.bezierSurface.controlPoints.map((r, ri) =>
            r.map((p, ci) => (ri === row && ci === col ? point : p)),
          );
          return {
            ...surf,
            bezierSurface: { ...surf.bezierSurface, controlPoints },
          };
        }),
      },
    })),

  setMeshDensity: (surfaceId, cols, rows) =>
    set((s) => {
      const { canvasWidth, canvasHeight } = s.project;
      return {
        project: {
          ...s.project,
          surfaces: s.project.surfaces.map((surf) =>
            surf.id === surfaceId
              ? {
                  ...surf,
                  meshGrid: createDefaultMeshGrid(cols, rows, canvasWidth, canvasHeight),
                }
              : surf,
          ),
        },
      };
    }),

  // ── Content ───────────────────────────────────────────────────────────────
  addContentItem: (item) =>
    set((s) => ({
      project: {
        ...s.project,
        contentItems: [...s.project.contentItems, item],
      },
    })),

  assignContent: (surfaceId, contentId) =>
    set((s) => ({
      project: {
        ...s.project,
        surfaces: s.project.surfaces.map((surf) =>
          surf.id === surfaceId ? { ...surf, contentId } : surf,
        ),
      },
    })),

  // ── Reference photo / zones ───────────────────────────────────────────────
  setReferencePhoto: (url) =>
    set((s) => ({
      project: {
        ...s.project,
        referencePhotoUrl: url,
        detectedZones: [],
      },
    })),

  setDetectedZones: (zones) =>
    set((s) => ({
      project: { ...s.project, detectedZones: zones },
    })),

  acceptZone: (zoneId) =>
    set((s) => ({
      project: {
        ...s.project,
        detectedZones: s.project.detectedZones.map((z) =>
          z.id === zoneId ? { ...z, accepted: true } : z,
        ),
      },
    })),

  rejectZone: (zoneId) =>
    set((s) => ({
      project: {
        ...s.project,
        detectedZones: s.project.detectedZones.filter((z) => z.id !== zoneId),
      },
    })),

  // ── Drawing ───────────────────────────────────────────────────────────────
  setDrawingTool: (tool) =>
    set((s) => ({
      drawing: { ...s.drawing, tool, currentPoints: [], isDrawing: false },
    })),

  setSnapMode: (mode) =>
    set((s) => ({ drawing: { ...s.drawing, snapMode: mode } })),

  setGridSize: (size) =>
    set((s) => ({ drawing: { ...s.drawing, gridSize: size } })),

  addDrawingPoint: (point) =>
    set((s) => ({
      drawing: {
        ...s.drawing,
        currentPoints: [...s.drawing.currentPoints, point],
        isDrawing: true,
      },
    })),

  finishDrawing: () =>
    set((s) => {
      const { currentPoints } = s.drawing;
      if (currentPoints.length < 3) {
        return {
          drawing: { ...s.drawing, currentPoints: [], isDrawing: false },
        };
      }
      const path = pointsToSvgPath(currentPoints);
      const outline: SurfaceOutline = {
        type: 'freehand',
        path,
        points: currentPoints,
      };
      const newSurface: Surface = {
        ...createDefaultSurface(s.project.surfaces.length),
        outline,
      };
      return {
        project: {
          ...s.project,
          surfaces: [...s.project.surfaces, newSurface],
          activeSurfaceId: newSurface.id,
        },
        drawing: { ...s.drawing, currentPoints: [], isDrawing: false },
      };
    }),

  cancelDrawing: () =>
    set((s) => ({
      drawing: { ...s.drawing, currentPoints: [], isDrawing: false },
    })),

  // ── Live ──────────────────────────────────────────────────────────────────
  setLive: (isLive) => set((s) => ({ live: { ...s.live, isLive } })),
  setBlackout: (blackout) => set((s) => ({ live: { ...s.live, blackout } })),
  setFrozen: (frozen) => set((s) => ({ live: { ...s.live, frozen } })),
  setMasterOpacity: (masterOpacity) =>
    set((s) => ({ live: { ...s.live, masterOpacity } })),
  setCrossfadeDuration: (crossfadeDuration) =>
    set((s) => ({ live: { ...s.live, crossfadeDuration } })),
}));
