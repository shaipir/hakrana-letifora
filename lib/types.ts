export interface Point { x: number; y: number; }

export interface CornerPin {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'soft_light' | 'difference' | 'color_dodge';
export type LayerType = 'video' | 'image' | 'effect' | 'draw' | 'ai_generated' | 'particles' | 'glow';
export type EffectType = 'none' | 'kaleidoscope' | 'tunnel' | 'colorshift' | 'distort' | 'mirror' | 'pulse' | 'glitch' | 'fire' | 'smoke' | 'electricity';
export type AnimationType = 'none' | 'pulse' | 'glow' | 'flicker' | 'flow' | 'swirl' | 'drift' | 'breathing' | 'ripple' | 'crack_spread' | 'energy_veins' | 'floating_particles' | 'smoke' | 'fire' | 'sparks' | 'liquid' | 'glitch' | 'tunnel' | 'shimmer' | 'melting' | 'eye_shine' | 'inner_light' | 'shadow_crawl';
export type Theme = 'fire' | 'water' | 'smoke' | 'electricity' | 'cosmic' | 'jungle' | 'divine' | 'gothic' | 'cyberpunk' | 'glitch' | 'crystal' | 'gold' | 'ice' | 'lava' | 'tribal' | 'sacred_geometry' | 'neon_club' | 'horror' | 'dreamy' | 'alien' | 'mechanical' | 'organic' | 'psychedelic' | 'floral';
export type Mood = 'calm' | 'tense' | 'mysterious' | 'divine' | 'aggressive' | 'seductive' | 'sacred' | 'energetic' | 'melancholic' | 'euphoric' | 'dreamy';
export type ProjectType = 'flat_surface' | 'face_mapping' | 'sculpture_mapping' | 'multi_surface';
export type Tool = 'select' | 'cornerpin' | 'mask' | 'draw' | 'warp' | 'region_select' | 'brush';
export type SelectionType = 'freehand' | 'polygon' | 'rectangle' | 'magic' | 'auto_face' | 'auto_object';

export interface Region {
  id: string;
  name: string;
  type: SelectionType;
  points: Point[];
  theme: Theme | null;
  animationPreset: AnimationType;
  color: string;
  opacity: number;
  blendMode: BlendMode;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  blendMode: BlendMode;
  cornerPin: CornerPin;
  mask: Point[] | null;
  effect: EffectType;
  effectParams: Record<string, number>;
  mediaUrl: string | null;
  mediaType: 'video' | 'image' | null;
  theme: Theme | null;
  animationPreset: AnimationType;
  regions: Region[];
  aiPrompt: string | null;
}

export interface ProjectState {
  id: string;
  name: string;
  type: ProjectType;
  layers: Layer[];
  activeLayerId: string | null;
  activeRegionId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  isProjectorMode: boolean;
  frameRate: number;
  loopDuration: number;
}

// ─── ArtRevive Domain Types ────────────────────────────────────────────────

export type ArtReviveMode = 'restyle' | 'glow-sculpture' | 'house-projection';

export type HouseWorldPreset =
  | 'forest' | 'sea' | 'fire' | 'spirit' | 'cartoon'
  | 'ice' | 'crystal' | 'shadow' | 'floral' | 'machine';

export interface HouseProjectionSettings {
  worldPreset: HouseWorldPreset | null;
  customStylePrompt: string;
  geometryPreservation: number;
  facadePreservation: number;
  windowAlignmentPreservation: number;
  surfaceTransformationStrength: number;
  projectionIntensity: number;
  glowAmount: number;
  darknessContrast: number;
  ornamentationLevel: number;
  atmosphereStrength: number;
}

export type StyleWorld =
  | 'forest' | 'sea' | 'fire' | 'spirit' | 'cartoon'
  | 'ice' | 'crystal' | 'shadow' | 'floral' | 'machine'
  | 'bioluminescent' | 'sacred-geometry' | 'kaleidoscopic' | 'deep-dream' | 'visionary';

export interface StyleWorldPreset {
  id: StyleWorld;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  visualKeywords: string[];
  materialKeywords: string[];
  atmosphereKeywords: string[];
  colorKeywords: string[];
}

export type RestyleMode = 'preserve-characters' | 'rebuild-characters';

export type WorldPreset =
  | 'forest' | 'sea' | 'fire' | 'spirit' | 'cartoon'
  | 'ice' | 'crystal' | 'shadow' | 'floral' | 'machine';

export type VisualLanguagePreset =
  | 'bioluminescent' | 'sacred-geometry' | 'mandala' | 'deep-dream' | 'visionary' | 'none';

export interface RestyleSettings {
  mode: RestyleMode;
  worldPreset: WorldPreset | null;
  visualLanguage: VisualLanguagePreset;
  customStylePrompt: string;
  preserveStructure: number;
  identityPreservation: number;
  facePreservation: number;
  posePreservation: number;
  redesignMaterials: number;
  redesignEnvironment: number;
  fantasyStrength: number;
  realismVsStylization: number;
  atmosphereStrength: number;
  reshapeStrength: number;
  customReshapePrompt: string;
  transformStrength: number;
}

// Glow Sculpture (replaces old NeonContour)
export type GlowContourStyle = 'neon-sign' | 'light-paint' | 'plasma' | 'laser' | 'molten' | 'ethereal';
export type GlowColorMode = 'single' | 'dual-gradient' | 'multi-gradient';
export type GlowColorPreset = 'cyber' | 'vapor' | 'solar' | 'toxic' | 'ice' | 'blood' | 'aurora' | 'mono' | 'phantom';
export type GlowBackgroundType = 'pure-black' | 'deep-dark' | 'textured-dark';
export type GlowBackgroundTexture = 'dark-concrete' | 'black-metal' | 'wet-asphalt' | 'dark-glass' | 'none';

export interface GlowSculptureSettings {
  contourStyle: GlowContourStyle;
  lineThickness: number;        // 1–10
  contourSmoothing: number;     // 0–1
  detailReduction: number;      // 0–1
  lineTaper: number;            // 0–1
  glowIntensity: number;        // 0–1
  glowRadius: number;           // 0–1
  glowSoftness: number;         // 0–1
  coreBrightness: number;       // 0–1
  bloomLayers: number;          // 1–5
  ambientLightScatter: number;  // 0–1
  colorMode: GlowColorMode;
  colorPreset: GlowColorPreset;
  gradientFlowDirection: string;
  backgroundType: GlowBackgroundType;
  backgroundTexture: GlowBackgroundTexture;
  customStylePrompt: string;
}

// Loop settings
export type LoopMotionType = 'breathe' | 'trace' | 'pulse' | 'flicker' | 'reveal' | 'flow';

export type BeatDivision = '1/4' | '1/2' | '1' | '2' | '4';

export interface BpmSyncSettings {
  enabled: boolean;
  bpm: number;             // 90–160
  beatDivision: BeatDivision;
  motionToBeatStrength: number;  // 0–1
}

export interface LoopSettings {
  outputMode: 'still' | 'loop';
  frameCount: number;           // default 10
  motionIntensity: number;      // 0–1
  motionType: LoopMotionType;
  loopSoftness: number;         // 0–1
  eyeBlink: boolean;
  breathing: boolean;
  environmentalMotion: boolean;
  organicGrowth: boolean;
  bpmSync: BpmSyncSettings;
}

// ─── Projection Mask ──────────────────────────────────────────────────────────
export interface ProjectionMask {
  id: string;
  type: 'rectangle' | 'polygon' | 'painted';
  points: { x: number; y: number }[];
  feather: number;   // 0–50 px
  inverted: boolean;
}

// ─── Object Isolation ─────────────────────────────────────────────────────────
export interface SelectedObjectRegion {
  id: string;
  label?: string;
  points: { x: number; y: number }[];
}

export interface ObjectIsolationSettings {
  enabled: boolean;
  regions: SelectedObjectRegion[];
  backgroundMode: 'blackout' | 'darken' | 'hide';
  darkenAmount: number;  // 0–1
}

// ─── Projection Zones ─────────────────────────────────────────────────────────
export interface ProjectionZone {
  id: string;
  name: string;
  maskId?: string;
  assignedMode?: ArtReviveMode;
  assignedPreset?: string;
  visible: boolean;
  generatedAssetId?: string;
}

// ─── Warp / Surface Mapping ───────────────────────────────────────────────────
export interface WarpPoint { x: number; y: number; }

export interface WarpPreset {
  id: string;
  name: string;
  type: 'corner-pin' | 'perspective' | 'mesh';
  points?: WarpPoint[];
  meshGrid?: { x: number; y: number }[][];
}

export interface WarpSettings {
  enabled: boolean;
  activePresetId: string | null;
  presets: WarpPreset[];
  // Current corner-pin corners (normalized 0–1 relative to canvas)
  cornerPin: {
    topLeft: WarpPoint;
    topRight: WarpPoint;
    bottomLeft: WarpPoint;
    bottomRight: WarpPoint;
  };
  meshCols: number;
  meshRows: number;
  meshGrid: WarpPoint[][] | null;
  mode: 'corner-pin' | 'perspective' | 'mesh';
}

// ─── Generation History ───────────────────────────────────────────────────────
export interface GenerationHistoryItem {
  id: string;
  createdAt: string;
  mode: ArtReviveMode;
  outputType: 'still' | 'loop';
  prompt: string;
  settingsSnapshot: Record<string, unknown>;
  sourceAssetId?: string;
  resultAssetIds: string[];
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
}

export interface GeneratedLoop {
  id: string;
  frames: string[];             // data URLs or blob URLs
  gifUrl?: string;
  webmUrl?: string;
  frameCount: number;
  mode: ArtReviveMode;
  motionType: LoopMotionType;
  sourceAssetId: string;
  createdAt: string;
}

// Keep NeonContourSettings for backward compat (not actively used)
export type NeonAnimationMode = 'flow' | 'pulse' | 'electric';
export type FlowDirection = 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top' | 'radial';

export interface NeonContourSettings {
  edgeSensitivity: number;
  lineThickness: number;
  lineDensity: number;
  contourSimplification: number;
  backgroundDarkness: number;
  neonColor: string;
  glowStrength: number;
  animationMode: NeonAnimationMode;
  speed: number;
  flowDirection: FlowDirection;
}

export interface UploadedAsset {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: string;
}

export interface GeneratedAsset {
  id: string;
  url: string;
  mode: ArtReviveMode;
  settings: RestyleSettings | HouseProjectionSettings | GlowSculptureSettings;
  sourceAssetId: string;
  createdAt: string;
}

export interface ArtworkProject {
  id: string;
  name: string;
  uploadedAsset: UploadedAsset | null;
  generatedAssets: GeneratedAsset[];
  activeMode: ArtReviveMode;
  restyleSettings: RestyleSettings;
  glowSculptureSettings: GlowSculptureSettings;
  houseProjectionSettings: HouseProjectionSettings;
  loopSettings: LoopSettings;
  // Projection workflow
  projectionMasks: ProjectionMask[];
  activeMaskId: string | null;
  objectIsolation: ObjectIsolationSettings;
  projectionZones: ProjectionZone[];
  activeZoneId: string | null;
  warpSettings: WarpSettings;
  // History
  generationHistory: GenerationHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerationResult {
  success: boolean;
  asset?: GeneratedAsset;
  error?: string;
}

export interface ExportRequest {
  assetId: string;
  format: 'png' | 'jpg' | 'webp';
  quality?: number;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export type ArtDirectionId =
  | 'fluid-dynamics' | 'fibonacci-spiral' | 'volcanic-glass' | 'neon-glitch'
  | 'watercolor-bleed' | 'voronoi-earth' | 'smoke-architecture' | 'chromatic-fluid';

export interface ArtDirectionPreset {
  id: ArtDirectionId;
  label: string;
  emoji: string;
  tagline: string;
  prompt: string;
  canvasWorldFallback: string;
}
