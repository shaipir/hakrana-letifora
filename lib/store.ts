import { create } from 'zustand';
import type { Layer, ProjectState, Tool, EffectType, Theme, AnimationType, Region, Point } from './types';

const defaultCornerPin = (w = 1920, h = 1080) => ({
  topLeft:     { x: w * 0.1, y: h * 0.1 },
  topRight:    { x: w * 0.9, y: h * 0.1 },
  bottomLeft:  { x: w * 0.1, y: h * 0.9 },
  bottomRight: { x: w * 0.9, y: h * 0.9 },
});

function makeLayer(name: string, type: Layer['type'] = 'effect'): Layer {
  return {
    id: Math.random().toString(36).slice(2),
    name, type,
    visible: true, opacity: 1,
    blendMode: 'normal',
    cornerPin: defaultCornerPin(),
    mask: null,
    effect: 'none',
    effectParams: {},
    mediaUrl: null, mediaType: null,
    theme: null,
    animationPreset: 'none',
    regions: [],
    aiPrompt: null,
  };
}

interface AppStore extends ProjectState {
  activeTool: Tool;
  isGenerating: boolean;
  generatedImages: string[];
  selectedTheme: Theme | null;
  selectedMood: string | null;
  aiPrompt: string;

  addLayer: (type?: Layer['type']) => void;
  removeLayer: (id: string) => void;
  setActiveLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  setActiveTool: (tool: Tool) => void;
  toggleProjectorMode: () => void;
  setTheme: (theme: Theme | null) => void;
  setMood: (mood: string | null) => void;
  setAiPrompt: (prompt: string) => void;
  setGenerating: (v: boolean) => void;
  setGeneratedImages: (imgs: string[]) => void;
  addRegionToLayer: (layerId: string, region: Region) => void;
  removeRegionFromLayer: (layerId: string, regionId: string) => void;
  loadProject: (project: Partial<ProjectState>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  id: 'project-1',
  name: 'פרויקט חדש',
  type: 'flat_surface',
  layers: [makeLayer('Layer 1', 'effect')],
  activeLayerId: null,
  activeRegionId: null,
  canvasWidth: 1920,
  canvasHeight: 1080,
  isProjectorMode: false,
  frameRate: 30,
  loopDuration: 3,
  activeTool: 'select',
  isGenerating: false,
  generatedImages: [],
  selectedTheme: null,
  selectedMood: null,
  aiPrompt: '',

  addLayer: (type = 'effect') => set(s => {
    const layer = makeLayer(`Layer ${s.layers.length + 1}`, type);
    return { layers: [layer, ...s.layers], activeLayerId: layer.id };
  }),
  removeLayer: (id) => set(s => ({
    layers: s.layers.filter(l => l.id !== id),
    activeLayerId: s.activeLayerId === id ? null : s.activeLayerId,
  })),
  setActiveLayer: (id) => set({ activeLayerId: id }),
  updateLayer: (id, patch) => set(s => ({
    layers: s.layers.map(l => l.id === id ? { ...l, ...patch } : l),
  })),
  moveLayer: (id, direction) => set(s => {
    const idx = s.layers.findIndex(l => l.id === id);
    if (idx === -1) return {};
    const next = [...s.layers];
    const swap = direction === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return {};
    [next[idx], next[swap]] = [next[swap], next[idx]];
    return { layers: next };
  }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  toggleProjectorMode: () => set(s => ({ isProjectorMode: !s.isProjectorMode })),
  setTheme: (theme) => set({ selectedTheme: theme }),
  setMood: (mood) => set({ selectedMood: mood }),
  setAiPrompt: (prompt) => set({ aiPrompt: prompt }),
  setGenerating: (v) => set({ isGenerating: v }),
  setGeneratedImages: (imgs) => set({ generatedImages: imgs }),
  addRegionToLayer: (layerId, region) => set(s => ({
    layers: s.layers.map(l => l.id === layerId ? { ...l, regions: [...l.regions, region] } : l),
  })),
  removeRegionFromLayer: (layerId, regionId) => set(s => ({
    layers: s.layers.map(l => l.id === layerId ? { ...l, regions: l.regions.filter(r => r.id !== regionId) } : l),
  })),
  loadProject: (project) => set(s => ({ ...s, ...project })),
}));
