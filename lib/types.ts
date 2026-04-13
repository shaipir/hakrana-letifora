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

export type ArtReviveMode = 'restyle' | 'neon-contour';

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

export interface RestyleSettings {
  styleWorld: StyleWorld | null;
  customStylePrompt: string;
  preserveStructure: number;           // 0–1: how much silhouette/composition to keep
  redesignCharacters: number;          // 0–1: how much to reinvent the figures/beings
  redesignMaterials: number;           // 0–1: how much to rebuild surfaces/textures
  redesignEnvironment: number;         // 0–1: how much to rebuild background/world
  realismVsStylization: number;        // 0–1: 0=realistic creature, 1=fully stylized
  fantasyStrength: number;             // 0–1: how mythic/imaginative the result is
  atmosphereStrength: number;          // 0–1: environmental mood intensity
  transformStrength: number;           // 0–1: overall transformation power
}

export type NeonAnimationMode = 'flow' | 'pulse' | 'electric';
export type FlowDirection = 'left-right' | 'right-left' | 'top-bottom' | 'bottom-top' | 'radial';

export interface NeonContourSettings {
  edgeSensitivity: number;        // 0–1
  lineThickness: number;          // 1–10 px
  lineDensity: number;            // 0–1
  contourSimplification: number;  // 0–1
  backgroundDarkness: number;     // 0–1
  neonColor: string;              // hex
  glowStrength: number;           // 0–1
  animationMode: NeonAnimationMode;
  speed: number;                  // 0–1
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
  settings: RestyleSettings | NeonContourSettings;
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
  neonContourSettings: NeonContourSettings;
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
  quality?: number; // 0–1 for jpg/webp
}

export interface ExportResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

// ─── Future 2D-to-3D Pipeline (placeholders) ──────────────────────────────

export interface ThreeDGenerationRequest {
  sourceAssetId: string;
  prompt?: string;
  outputFormat: 'glb' | 'obj' | 'splat';
}

export interface ThreeDGenerationJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  sourceAssetId: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

export interface ThreeDAsset {
  id: string;
  jobId: string;
  url: string;
  format: 'glb' | 'obj' | 'splat';
  createdAt: string;
}

export interface ThreeDPreviewState {
  isLoading: boolean;
  asset: ThreeDAsset | null;
  rotationX: number;
  rotationY: number;
  zoom: number;
}
