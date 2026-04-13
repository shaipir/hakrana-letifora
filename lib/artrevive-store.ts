import { create } from 'zustand';
import {
  ArtReviveMode,
  ArtworkProject,
  UploadedAsset,
  GeneratedAsset,
  RestyleSettings,
  NeonContourSettings,
} from './types';

// ─── Defaults ──────────────────────────────────────────────────────────────

export const DEFAULT_RESTYLE_SETTINGS: RestyleSettings = {
  styleWorld: 'forest',
  customStylePrompt: '',
  preserveSubject: 0.75,
  transformStrength: 0.8,
  materialTransformationStrength: 0.7,
  environmentTransformationStrength: 0.75,
  realismVsStylization: 0.6,
  backgroundIntegration: 0.8,
  atmosphereStrength: 0.7,
};

export const DEFAULT_NEON_CONTOUR_SETTINGS: NeonContourSettings = {
  edgeSensitivity: 0.5,
  lineThickness: 2,
  lineDensity: 0.6,
  contourSimplification: 0.3,
  backgroundDarkness: 0.97,
  neonColor: '#00ffff',
  glowStrength: 0.7,
  animationMode: 'flow',
  speed: 0.5,
  flowDirection: 'left-right',
};

function makeDefaultProject(): ArtworkProject {
  return {
    id: crypto.randomUUID(),
    name: 'Untitled Project',
    uploadedAsset: null,
    generatedAssets: [],
    activeMode: 'restyle',
    restyleSettings: { ...DEFAULT_RESTYLE_SETTINGS },
    neonContourSettings: { ...DEFAULT_NEON_CONTOUR_SETTINGS },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Store Shape ───────────────────────────────────────────────────────────

interface ArtReviveState {
  project: ArtworkProject;
  activeMode: ArtReviveMode;
  selectedResultId: string | null;
  isUploading: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  uploadError: string | null;
  generateError: string | null;

  // Actions
  setMode: (mode: ArtReviveMode) => void;
  setUploadedAsset: (asset: UploadedAsset) => void;
  clearUploadedAsset: () => void;
  updateRestyleSettings: (settings: Partial<RestyleSettings>) => void;
  updateNeonContourSettings: (settings: Partial<NeonContourSettings>) => void;
  addGeneratedAsset: (asset: GeneratedAsset) => void;
  selectResult: (id: string | null) => void;
  setUploading: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setExporting: (v: boolean) => void;
  setUploadError: (err: string | null) => void;
  setGenerateError: (err: string | null) => void;
  resetProject: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useArtReviveStore = create<ArtReviveState>((set, get) => ({
  project: makeDefaultProject(),
  activeMode: 'restyle',
  selectedResultId: null,
  isUploading: false,
  isGenerating: false,
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
    })),

  updateRestyleSettings: (settings) =>
    set((s) => ({
      project: {
        ...s.project,
        restyleSettings: { ...s.project.restyleSettings, ...settings },
        updatedAt: new Date().toISOString(),
      },
    })),

  updateNeonContourSettings: (settings) =>
    set((s) => ({
      project: {
        ...s.project,
        neonContourSettings: { ...s.project.neonContourSettings, ...settings },
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

  selectResult: (id) => set({ selectedResultId: id }),

  setUploading: (v) => set({ isUploading: v }),
  setGenerating: (v) => set({ isGenerating: v }),
  setExporting: (v) => set({ isExporting: v }),
  setUploadError: (err) => set({ uploadError: err }),
  setGenerateError: (err) => set({ generateError: err }),

  resetProject: () =>
    set({
      project: makeDefaultProject(),
      activeMode: 'restyle',
      selectedResultId: null,
      isUploading: false,
      isGenerating: false,
      isExporting: false,
      uploadError: null,
      generateError: null,
    }),
}));
