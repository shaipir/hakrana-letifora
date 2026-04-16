import { create } from 'zustand';
import {
  ArtReviveMode, ArtworkProject, UploadedAsset, GeneratedAsset,
  RestyleSettings, GlowSculptureSettings, HouseProjectionSettings,
  LoopSettings, GeneratedLoop,
  BpmSyncSettings, ProjectionArea, ObjectIsolationSettings,
  ProjectionZone, WarpSettings, WarpPreset, GenerationHistoryItem,
  ReferenceProjectionSettings, GridLayout, GridFace,
} from './types';
import { loadProjectFromStorage, saveProjectToStorage, appendGenerationHistory } from './project-persistence';

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_RESTYLE_SETTINGS: RestyleSettings = {
  mode: 'preserve-characters',
  worldPreset: 'forest',
  visualLanguage: 'none',
  customStylePrompt: '',
  preserveStructure: 0.85,
  identityPreservation: 0.9,
  facePreservation: 0.9,
  posePreservation: 0.85,
  redesignMaterials: 0.8,
  redesignEnvironment: 0.85,
  fantasyStrength: 0.7,
  realismVsStylization: 0.5,
  atmosphereStrength: 0.75,
  reshapeStrength: 0.0,
  customReshapePrompt: '',
  transformStrength: 0.85,
};

export const DEFAULT_GLOW_SCULPTURE_SETTINGS: GlowSculptureSettings = {
  contourStyle: 'neon-sign',
  lineThickness: 4,
  contourSmoothing: 0.6,
  detailReduction: 0.4,
  lineTaper: 0.3,
  glowIntensity: 0.85,
  glowRadius: 0.65,
  glowSoftness: 0.5,
  coreBrightness: 0.9,
  bloomLayers: 3,
  ambientLightScatter: 0.4,
  colorMode: 'dual-gradient',
  colorPreset: 'cyber',
  gradientFlowDirection: 'top-bottom',
  backgroundType: 'pure-black',
  backgroundTexture: 'none',
  customStylePrompt: '',
};

export const DEFAULT_HOUSE_PROJECTION_SETTINGS: HouseProjectionSettings = {
  worldPreset: 'forest',
  customStylePrompt: '',
  geometryPreservation: 0.95,
  facadePreservation: 0.92,
  windowAlignmentPreservation: 0.9,
  surfaceTransformationStrength: 0.85,
  projectionIntensity: 0.88,
  glowAmount: 0.75,
  darknessContrast: 0.8,
  ornamentationLevel: 0.7,
  atmosphereStrength: 0.75,
  usePhotoContoursAsBase: true,
};

export const DEFAULT_REFERENCE_PROJECTION: ReferenceProjectionSettings = {
  active: false,
  viewMode: 'original',
  showGrid: false,
  showCornerMarkers: false,
  brightness: 1.0,
  opacity: 0.5,
};

export const DEFAULT_BPM_SYNC: BpmSyncSettings = {
  enabled: false,
  bpm: 120,
  beatDivision: '1',
  motionToBeatStrength: 0.8,
};

export const DEFAULT_LOOP_SETTINGS: LoopSettings = {
  outputMode: 'still',
  frameCount: 10,
  motionIntensity: 0.5,
  motionType: 'breathe',
  loopSoftness: 0.7,
  continuityStrength: 0.9,
  transitionMode: 'dissolve',
  transitionStrength: 0.7,
  blendAmount: 0.5,
  eyeBlink: false,
  breathing: true,
  environmentalMotion: true,
  organicGrowth: false,
  bpmSync: { ...DEFAULT_BPM_SYNC },
};

export const DEFAULT_OBJECT_ISOLATION: ObjectIsolationSettings = {
  enabled: false,
  regions: [],
  backgroundMode: 'blackout',
  darkenAmount: 0.85,
};

export const DEFAULT_WARP_SETTINGS: WarpSettings = {
  enabled: false,
  activePresetId: null,
  presets: [],
  cornerPin: {
    topLeft:     { x: 0, y: 0 },
    topRight:    { x: 1, y: 0 },
    bottomLeft:  { x: 0, y: 1 },
    bottomRight: { x: 1, y: 1 },
  },
  meshCols: 4,
  meshRows: 4,
  meshGrid: null,
  mode: 'corner-pin',
};

function makeDefaultProject(): ArtworkProject {
  // Try to restore from localStorage on first init
  const saved = loadProjectFromStorage();
  if (saved) {
    // Migrate old projectionMasks → projectionAreas
    const legacyAreas: ProjectionArea[] = (saved.projectionMasks ?? []).map((m: any) => ({
      ...m,
      kind: 'project' as const,
    }));
    return {
      ...saved,
      projectionAreas: saved.projectionAreas ?? legacyAreas,
      activeAreaId: (saved as any).activeAreaId ?? (saved as any).activeMaskId ?? null,
      objectIsolation: saved.objectIsolation ?? { ...DEFAULT_OBJECT_ISOLATION },
      projectionZones: saved.projectionZones ?? [],
      activeZoneId: saved.activeZoneId ?? null,
      warpSettings: saved.warpSettings ?? { ...DEFAULT_WARP_SETTINGS },
      referenceProjection: saved.referenceProjection ?? { ...DEFAULT_REFERENCE_PROJECTION },
      gridLayouts: (saved as any).gridLayouts ?? [],
      activeGridId: (saved as any).activeGridId ?? null,
      generationHistory: saved.generationHistory ?? [],
      houseProjectionSettings: {
        ...DEFAULT_HOUSE_PROJECTION_SETTINGS,
        ...(saved.houseProjectionSettings ?? {}),
        usePhotoContoursAsBase: true as const,
      },
      loopSettings: {
        ...DEFAULT_LOOP_SETTINGS,
        ...(saved.loopSettings ?? {}),
        // Ensure new fields are filled in for saved projects that pre-date them
        continuityStrength: (saved.loopSettings as any)?.continuityStrength ?? DEFAULT_LOOP_SETTINGS.continuityStrength,
        transitionMode: (saved.loopSettings as any)?.transitionMode ?? DEFAULT_LOOP_SETTINGS.transitionMode,
        transitionStrength: (saved.loopSettings as any)?.transitionStrength ?? DEFAULT_LOOP_SETTINGS.transitionStrength,
        blendAmount: (saved.loopSettings as any)?.blendAmount ?? DEFAULT_LOOP_SETTINGS.blendAmount,
        bpmSync: {
          ...DEFAULT_BPM_SYNC,
          ...((saved.loopSettings as any)?.bpmSync ?? {}),
        },
      },
    };
  }

  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    uploadedAsset: null,
    generatedAssets: [],
    activeMode: 'restyle',
    restyleSettings: { ...DEFAULT_RESTYLE_SETTINGS },
    glowSculptureSettings: { ...DEFAULT_GLOW_SCULPTURE_SETTINGS },
    houseProjectionSettings: { ...DEFAULT_HOUSE_PROJECTION_SETTINGS },
    loopSettings: { ...DEFAULT_LOOP_SETTINGS },
    projectionAreas: [],
    activeAreaId: null,
    objectIsolation: { ...DEFAULT_OBJECT_ISOLATION },
    projectionZones: [],
    activeZoneId: null,
    warpSettings: { ...DEFAULT_WARP_SETTINGS },
    referenceProjection: { ...DEFAULT_REFERENCE_PROJECTION },
    gridLayouts: [],
    activeGridId: null,
    generationHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Store Interface ───────────────────────────────────────────────────────────

interface ArtReviveState {
  project: ArtworkProject;
  activeMode: ArtReviveMode;
  selectedResultId: string | null;
  generatedLoop: GeneratedLoop | null;
  isUploading: boolean;
  isGenerating: boolean;
  isGeneratingLoop: boolean;
  isExporting: boolean;
  uploadError: string | null;
  generateError: string | null;

  // Core project actions
  setMode: (mode: ArtReviveMode) => void;
  setUploadedAsset: (asset: UploadedAsset) => void;
  clearUploadedAsset: () => void;
  updateRestyleSettings: (settings: Partial<RestyleSettings>) => void;
  updateGlowSculptureSettings: (settings: Partial<GlowSculptureSettings>) => void;
  updateHouseProjectionSettings: (partial: Partial<HouseProjectionSettings>) => void;
  updateLoopSettings: (partial: Partial<LoopSettings>) => void;
  addGeneratedAsset: (asset: GeneratedAsset) => void;
  removeGeneratedAsset: (id: string) => void;
  setGeneratedLoop: (loop: GeneratedLoop | null) => void;
  selectResult: (id: string | null) => void;
  setUploading: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setGeneratingLoop: (v: boolean) => void;
  setExporting: (v: boolean) => void;
  setUploadError: (err: string | null) => void;
  setGenerateError: (err: string | null) => void;
  resetProject: () => void;
  renameProject: (name: string) => void;

  // Projection areas
  addProjectionArea: (area: ProjectionArea) => void;
  updateProjectionArea: (id: string, patch: Partial<ProjectionArea>) => void;
  removeProjectionArea: (id: string) => void;
  setActiveArea: (id: string | null) => void;

  // Reference projection
  updateReferenceProjection: (patch: Partial<ReferenceProjectionSettings>) => void;

  // Object isolation
  updateObjectIsolation: (patch: Partial<ObjectIsolationSettings>) => void;

  // Projection zones
  addProjectionZone: (zone?: Partial<ProjectionZone>) => void;
  updateProjectionZone: (id: string, patch: Partial<ProjectionZone>) => void;
  removeProjectionZone: (id: string) => void;
  setActiveZone: (id: string | null) => void;
  duplicateProjectionZone: (id: string) => void;

  // Warp / surface mapping
  updateWarpSettings: (patch: Partial<WarpSettings>) => void;
  addWarpPreset: (preset: WarpPreset) => void;
  removeWarpPreset: (id: string) => void;
  applyWarpPreset: (id: string) => void;
  resetWarp: () => void;

  // Grid layouts
  addGridLayout: (override?: Partial<GridLayout>) => void;
  updateGridLayout: (id: string, patch: Partial<GridLayout>) => void;
  removeGridLayout: (id: string) => void;
  setActiveGrid: (id: string | null) => void;
  duplicateGridLayout: (id: string) => void;
  addGridFace: (gridId: string, face?: Partial<GridFace>) => void;
  updateGridFace: (gridId: string, faceId: string, patch: Partial<GridFace>) => void;
  removeGridFace: (gridId: string, faceId: string) => void;
  setActiveFace: (gridId: string, faceId: string | null) => void;

  // Generation history
  addGenerationHistory: (item: GenerationHistoryItem) => void;
  removeGenerationHistory: (id: string) => void;
  clearGenerationHistory: () => void;

  // Persistence
  saveProject: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useArtReviveStore = create<ArtReviveState>((set, get) => ({
  project: makeDefaultProject(),
  activeMode: 'restyle',
  selectedResultId: null,
  generatedLoop: null,
  isUploading: false,
  isGenerating: false,
  isGeneratingLoop: false,
  isExporting: false,
  uploadError: null,
  generateError: null,

  setMode: (mode) =>
    set((s) => ({
      activeMode: mode,
      project: { ...s.project, activeMode: mode, updatedAt: new Date().toISOString() },
    })),

  setUploadedAsset: (asset) =>
    set((s) => ({
      project: {
        ...s.project,
        uploadedAsset: asset,
        generatedAssets: [],
        updatedAt: new Date().toISOString(),
      },
      selectedResultId: null,
      generatedLoop: null,
      uploadError: null,
    })),

  clearUploadedAsset: () =>
    set((s) => ({
      project: {
        ...s.project,
        uploadedAsset: null,
        generatedAssets: [],
        updatedAt: new Date().toISOString(),
      },
      selectedResultId: null,
      generatedLoop: null,
    })),

  updateRestyleSettings: (settings) =>
    set((s) => ({
      project: {
        ...s.project,
        restyleSettings: { ...s.project.restyleSettings, ...settings },
        updatedAt: new Date().toISOString(),
      },
    })),

  updateGlowSculptureSettings: (settings) =>
    set((s) => ({
      project: {
        ...s.project,
        glowSculptureSettings: { ...s.project.glowSculptureSettings, ...settings },
        updatedAt: new Date().toISOString(),
      },
    })),

  updateHouseProjectionSettings: (partial) =>
    set((s) => ({
      project: {
        ...s.project,
        houseProjectionSettings: { ...s.project.houseProjectionSettings, ...partial },
        updatedAt: new Date().toISOString(),
      },
    })),

  updateLoopSettings: (partial) =>
    set((s) => ({
      project: {
        ...s.project,
        loopSettings: { ...s.project.loopSettings, ...partial },
        updatedAt: new Date().toISOString(),
      },
    })),

  addGeneratedAsset: (asset) =>
    set((s) => ({
      project: {
        ...s.project,
        generatedAssets: [asset, ...s.project.generatedAssets],
        updatedAt: new Date().toISOString(),
      },
      selectedResultId: asset.id,
    })),

  removeGeneratedAsset: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        generatedAssets: s.project.generatedAssets.filter((a) => a.id !== id),
        updatedAt: new Date().toISOString(),
      },
      selectedResultId: s.selectedResultId === id ? null : s.selectedResultId,
    })),

  setGeneratedLoop: (loop) => set({ generatedLoop: loop }),
  selectResult: (id) => set({ selectedResultId: id }),
  setUploading: (v) => set({ isUploading: v }),
  setGenerating: (v) => set({ isGenerating: v }),
  setGeneratingLoop: (v) => set({ isGeneratingLoop: v }),
  setExporting: (v) => set({ isExporting: v }),
  setUploadError: (err) => set({ uploadError: err }),
  setGenerateError: (err) => set({ generateError: err }),

  renameProject: (name) =>
    set((s) => ({
      project: { ...s.project, name, updatedAt: new Date().toISOString() },
    })),

  // ── Projection areas ────────────────────────────────────────────────────────

  addProjectionArea: (area) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionAreas: [...s.project.projectionAreas, area],
        activeAreaId: area.id,
        updatedAt: new Date().toISOString(),
      },
    })),

  updateProjectionArea: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionAreas: s.project.projectionAreas.map((a) =>
          a.id === id ? { ...a, ...patch } : a
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  removeProjectionArea: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionAreas: s.project.projectionAreas.filter((a) => a.id !== id),
        activeAreaId: s.project.activeAreaId === id ? null : s.project.activeAreaId,
        updatedAt: new Date().toISOString(),
      },
    })),

  setActiveArea: (id) =>
    set((s) => ({
      project: { ...s.project, activeAreaId: id, updatedAt: new Date().toISOString() },
    })),

  // ── Reference projection ─────────────────────────────────────────────────────

  updateReferenceProjection: (patch) =>
    set((s) => ({
      project: {
        ...s.project,
        referenceProjection: { ...s.project.referenceProjection, ...patch },
        updatedAt: new Date().toISOString(),
      },
    })),

  // ── Object isolation ────────────────────────────────────────────────────────

  updateObjectIsolation: (patch) =>
    set((s) => ({
      project: {
        ...s.project,
        objectIsolation: { ...s.project.objectIsolation, ...patch },
        updatedAt: new Date().toISOString(),
      },
    })),

  // ── Projection zones ────────────────────────────────────────────────────────

  addProjectionZone: (override = {}) => {
    const count = get().project.projectionZones.length + 1;
    const zone: ProjectionZone = {
      id: crypto.randomUUID(),
      name: `Zone ${count}`,
      visible: true,
      ...override,
    };
    set((s) => ({
      project: {
        ...s.project,
        projectionZones: [...s.project.projectionZones, zone],
        activeZoneId: zone.id,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateProjectionZone: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionZones: s.project.projectionZones.map((z) =>
          z.id === id ? { ...z, ...patch } : z
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  removeProjectionZone: (id) =>
    set((s) => {
      const remaining = s.project.projectionZones.filter((z) => z.id !== id);
      return {
        project: {
          ...s.project,
          projectionZones: remaining,
          activeZoneId:
            s.project.activeZoneId === id
              ? (remaining[0]?.id ?? null)
              : s.project.activeZoneId,
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  setActiveZone: (id) =>
    set((s) => ({
      project: { ...s.project, activeZoneId: id, updatedAt: new Date().toISOString() },
    })),

  duplicateProjectionZone: (id) => {
    const zone = get().project.projectionZones.find((z) => z.id === id);
    if (!zone) return;
    const dupe: ProjectionZone = {
      ...zone,
      id: crypto.randomUUID(),
      name: `${zone.name} (copy)`,
    };
    set((s) => ({
      project: {
        ...s.project,
        projectionZones: [...s.project.projectionZones, dupe],
        activeZoneId: dupe.id,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  // ── Warp / surface mapping ──────────────────────────────────────────────────

  updateWarpSettings: (patch) =>
    set((s) => ({
      project: {
        ...s.project,
        warpSettings: { ...s.project.warpSettings, ...patch },
        updatedAt: new Date().toISOString(),
      },
    })),

  addWarpPreset: (preset) =>
    set((s) => ({
      project: {
        ...s.project,
        warpSettings: {
          ...s.project.warpSettings,
          presets: [...s.project.warpSettings.presets, preset],
        },
        updatedAt: new Date().toISOString(),
      },
    })),

  removeWarpPreset: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        warpSettings: {
          ...s.project.warpSettings,
          presets: s.project.warpSettings.presets.filter((p) => p.id !== id),
          activePresetId:
            s.project.warpSettings.activePresetId === id
              ? null
              : s.project.warpSettings.activePresetId,
        },
        updatedAt: new Date().toISOString(),
      },
    })),

  applyWarpPreset: (id) => {
    const preset = get().project.warpSettings.presets.find((p) => p.id === id);
    if (!preset) return;
    set((s) => ({
      project: {
        ...s.project,
        warpSettings: {
          ...s.project.warpSettings,
          activePresetId: id,
          mode: preset.type,
          ...(preset.type === 'corner-pin' && preset.points?.length === 4
            ? {
                cornerPin: {
                  topLeft:     preset.points[0],
                  topRight:    preset.points[1],
                  bottomLeft:  preset.points[2],
                  bottomRight: preset.points[3],
                },
              }
            : {}),
          ...(preset.type === 'mesh' && preset.meshGrid
            ? { meshGrid: preset.meshGrid }
            : {}),
        },
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  resetWarp: () =>
    set((s) => ({
      project: {
        ...s.project,
        warpSettings: {
          ...s.project.warpSettings,
          cornerPin: { ...DEFAULT_WARP_SETTINGS.cornerPin },
          meshGrid: null,
          activePresetId: null,
        },
        updatedAt: new Date().toISOString(),
      },
    })),

  // ── Grid layouts ────────────────────────────────────────────────────────────

  addGridLayout: (override = {}) => {
    const count = get().project.gridLayouts.length + 1;
    const layout: GridLayout = {
      id: crypto.randomUUID(),
      name: `Grid ${count}`,
      faces: [],
      activeFaceId: null,
      blackoutOutside: false,
      visible: true,
      ...override,
    };
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: [...s.project.gridLayouts, layout],
        activeGridId: layout.id,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateGridLayout: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: s.project.gridLayouts.map((g) => g.id === id ? { ...g, ...patch } : g),
        updatedAt: new Date().toISOString(),
      },
    })),

  removeGridLayout: (id) =>
    set((s) => {
      const remaining = s.project.gridLayouts.filter((g) => g.id !== id);
      return {
        project: {
          ...s.project,
          gridLayouts: remaining,
          activeGridId: s.project.activeGridId === id ? (remaining[0]?.id ?? null) : s.project.activeGridId,
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  setActiveGrid: (id) =>
    set((s) => ({
      project: { ...s.project, activeGridId: id, updatedAt: new Date().toISOString() },
    })),

  duplicateGridLayout: (id) => {
    const grid = get().project.gridLayouts.find((g) => g.id === id);
    if (!grid) return;
    const dupe: GridLayout = {
      ...grid,
      id: crypto.randomUUID(),
      name: `${grid.name} (copy)`,
      faces: grid.faces.map((f) => ({ ...f, id: crypto.randomUUID() })),
      activeFaceId: null,
    };
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: [...s.project.gridLayouts, dupe],
        activeGridId: dupe.id,
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  addGridFace: (gridId, override = {}) => {
    const grid = get().project.gridLayouts.find((g) => g.id === gridId);
    if (!grid) return;
    const count = grid.faces.length + 1;
    const FACE_COLORS = ['#00e5ff', '#bf5fff', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#74c0fc', '#f783ac'];
    const face: GridFace = {
      id: crypto.randomUUID(),
      name: `Face ${count}`,
      points: [
        { x: 0.1, y: 0.1 }, { x: 0.4, y: 0.1 },
        { x: 0.4, y: 0.4 }, { x: 0.1, y: 0.4 },
      ],
      color: FACE_COLORS[(grid.faces.length) % FACE_COLORS.length],
      assignedAssetId: null,
      visible: true,
      solo: false,
      warp: null,
      ...override,
    };
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: s.project.gridLayouts.map((g) =>
          g.id === gridId
            ? { ...g, faces: [...g.faces, face], activeFaceId: face.id }
            : g
        ),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  updateGridFace: (gridId, faceId, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: s.project.gridLayouts.map((g) =>
          g.id === gridId
            ? { ...g, faces: g.faces.map((f) => f.id === faceId ? { ...f, ...patch } : f) }
            : g
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  removeGridFace: (gridId, faceId) =>
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: s.project.gridLayouts.map((g) =>
          g.id === gridId
            ? {
                ...g,
                faces: g.faces.filter((f) => f.id !== faceId),
                activeFaceId: g.activeFaceId === faceId ? null : g.activeFaceId,
              }
            : g
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  setActiveFace: (gridId, faceId) =>
    set((s) => ({
      project: {
        ...s.project,
        gridLayouts: s.project.gridLayouts.map((g) =>
          g.id === gridId ? { ...g, activeFaceId: faceId } : g
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  // ── Generation history ──────────────────────────────────────────────────────

  addGenerationHistory: (item) => {
    appendGenerationHistory(item);
    set((s) => ({
      project: {
        ...s.project,
        generationHistory: [item, ...s.project.generationHistory].slice(0, 50),
        updatedAt: new Date().toISOString(),
      },
    }));
  },

  removeGenerationHistory: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        generationHistory: s.project.generationHistory.filter((h) => h.id !== id),
        updatedAt: new Date().toISOString(),
      },
    })),

  clearGenerationHistory: () =>
    set((s) => ({
      project: {
        ...s.project,
        generationHistory: [],
        updatedAt: new Date().toISOString(),
      },
    })),

  // ── Persistence ─────────────────────────────────────────────────────────────

  saveProject: () => {
    saveProjectToStorage(get().project);
  },

  resetProject: () => {
    const newProject = {
      id: crypto.randomUUID(),
      name: 'Untitled Project',
      uploadedAsset: null,
      generatedAssets: [],
      activeMode: 'restyle' as ArtReviveMode,
      restyleSettings: { ...DEFAULT_RESTYLE_SETTINGS },
      glowSculptureSettings: { ...DEFAULT_GLOW_SCULPTURE_SETTINGS },
      houseProjectionSettings: { ...DEFAULT_HOUSE_PROJECTION_SETTINGS },
      loopSettings: { ...DEFAULT_LOOP_SETTINGS },
      projectionAreas: [],
      activeAreaId: null,
      objectIsolation: { ...DEFAULT_OBJECT_ISOLATION },
      projectionZones: [],
      activeZoneId: null,
      warpSettings: { ...DEFAULT_WARP_SETTINGS },
      referenceProjection: { ...DEFAULT_REFERENCE_PROJECTION },
      gridLayouts: [],
      activeGridId: null,
      generationHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set({
      project: newProject,
      activeMode: 'restyle',
      selectedResultId: null,
      generatedLoop: null,
      isUploading: false,
      isGenerating: false,
      isGeneratingLoop: false,
      isExporting: false,
      uploadError: null,
      generateError: null,
    });
  },
}));
