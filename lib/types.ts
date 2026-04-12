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
