import { create } from 'zustand';
import {
  ArtReviveMode, ArtworkProject, UploadedAsset, GeneratedAsset,
  RestyleSettings, GlowSculptureSettings, HouseProjectionSettings,
  LoopSettings, GeneratedLoop,
  BpmSyncSettings, ProjectionMask, ObjectIsolationSettings,
  ProjectionZone, WarpSettings, WarpPreset, GenerationHistoryItem,
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
    // Migrate: spread saved over defaults so missing new fields are filled in
    return {
      ...saved,
      projectionMasks: saved.projectionMasks ?? [],
      activeMaskId: saved.activeMaskId ?? null,
      objectIsolation: saved.objectIsolation ?? { ...DEFAULT_OBJECT_ISOLATION },
      projectionZones: saved.projectionZones ?? [],
      activeZoneId: saved.activeZoneId ?? null,
      warpSettings: saved.warpSettings ?? { ...DEFAULT_WARP_SETTINGS },
      generationHistory: saved.generationHistory ?? [],
      loopSettings: {
        ...DEFAULT_LOOP_SETTINGS,
        ...(saved.loopSettings ?? {}),
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
    projectionMasks: [],
    activeMaskId: null,
    objectIsolation: { ...DEFAULT_OBJECT_ISOLATION },
    projectionZones: [],
    activeZoneId: null,
    warpSettings: { ...DEFAULT_WARP_SETTINGS },
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

  // Projection masks
  addProjectionMask: (mask: ProjectionMask) => void;
  updateProjectionMask: (id: string, patch: Partial<ProjectionMask>) => void;
  removeProjectionMask: (id: string) => void;
  setActiveMask: (id: string | null) => void;

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

  // ── Projection masks ────────────────────────────────────────────────────────

  addProjectionMask: (mask) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionMasks: [...s.project.projectionMasks, mask],
        activeMaskId: mask.id,
        updatedAt: new Date().toISOString(),
      },
    })),

  updateProjectionMask: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionMasks: s.project.projectionMasks.map((m) =>
          m.id === id ? { ...m, ...patch } : m
        ),
        updatedAt: new Date().toISOString(),
      },
    })),

  removeProjectionMask: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        projectionMasks: s.project.projectionMasks.filter((m) => m.id !== id),
        activeMaskId: s.project.activeMaskId === id ? null : s.project.activeMaskId,
        updatedAt: new Date().toISOString(),
      },
    })),

  setActiveMask: (id) =>
    set((s) => ({
      project: { ...s.project, activeMaskId: id, updatedAt: new Date().toISOString() },
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
      projectionMasks: [],
      activeMaskId: null,
      objectIsolation: { ...DEFAULT_OBJECT_ISOLATION },
      projectionZones: [],
      activeZoneId: null,
      warpSettings: { ...DEFAULT_WARP_SETTINGS },
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
