import { create } from 'zustand';
import {
  ArtReviveMode, ArtworkProject, UploadedAsset, GeneratedAsset,
  RestyleSettings, GlowSculptureSettings, HouseProjectionSettings,
  LoopSettings, GeneratedLoop,
} from './types';
import { BuildingBounds } from './alignment/edge-register';

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
};

function makeDefaultProject(): ArtworkProject {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

interface ArtReviveState {
  project: ArtworkProject;
  activeMode: ArtReviveMode;
  selectedResultId: string | null;
  generatedLoop: GeneratedLoop | null;
  originalBounds: BuildingBounds | null;
  isUploading: boolean;
  isGenerating: boolean;
  isGeneratingLoop: boolean;
  isExporting: boolean;
  uploadError: string | null;
  generateError: string | null;

  setMode: (mode: ArtReviveMode) => void;
  setUploadedAsset: (asset: UploadedAsset) => void;
  setOriginalBounds: (bounds: BuildingBounds | null) => void;
  clearUploadedAsset: () => void;
  updateRestyleSettings: (settings: Partial<RestyleSettings>) => void;
  updateGlowSculptureSettings: (settings: Partial<GlowSculptureSettings>) => void;
  updateHouseProjectionSettings: (partial: Partial<HouseProjectionSettings>) => void;
  updateLoopSettings: (partial: Partial<LoopSettings>) => void;
  addGeneratedAsset: (asset: GeneratedAsset) => void;
  setGeneratedLoop: (loop: GeneratedLoop | null) => void;
  selectResult: (id: string | null) => void;
  setUploading: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setGeneratingLoop: (v: boolean) => void;
  setExporting: (v: boolean) => void;
  setUploadError: (err: string | null) => void;
  setGenerateError: (err: string | null) => void;
  resetProject: () => void;
}

export const useArtReviveStore = create<ArtReviveState>((set) => ({
  project: makeDefaultProject(),
  activeMode: 'restyle',
  selectedResultId: null,
  generatedLoop: null,
  originalBounds: null,
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

  setOriginalBounds: (bounds) => set({ originalBounds: bounds }),

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
      originalBounds: null,
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

  setGeneratedLoop: (loop) => set({ generatedLoop: loop }),
  selectResult: (id) => set({ selectedResultId: id }),
  setUploading: (v) => set({ isUploading: v }),
  setGenerating: (v) => set({ isGenerating: v }),
  setGeneratingLoop: (v) => set({ isGeneratingLoop: v }),
  setExporting: (v) => set({ isExporting: v }),
  setUploadError: (err) => set({ uploadError: err }),
  setGenerateError: (err) => set({ generateError: err }),

  resetProject: () =>
    set({
      project: makeDefaultProject(),
      activeMode: 'restyle',
      selectedResultId: null,
      generatedLoop: null,
      originalBounds: null,
      isUploading: false,
      isGenerating: false,
      isGeneratingLoop: false,
      isExporting: false,
      uploadError: null,
      generateError: null,
    }),
}));
