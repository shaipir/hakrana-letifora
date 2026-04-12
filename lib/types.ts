// סוגי נתונים מרכזיים לאפליקציה

export interface Point {
  x: number;
  y: number;
}

// ארבע פינות של אזור Projection
export interface CornerPin {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';
export type LayerType = 'video' | 'image' | 'effect' | 'draw';
export type EffectType = 'none' | 'kaleidoscope' | 'tunnel' | 'colorshift' | 'distort' | 'mirror';

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;        // 0-1
  blendMode: BlendMode;
  cornerPin: CornerPin;
  mask: Point[] | null;   // פולגון מסכה
  effect: EffectType;
  effectParams: Record<string, number>;
  mediaUrl: string | null;
  mediaType: 'video' | 'image' | null;
}

export interface ProjectState {
  id: string;
  name: string;
  layers: Layer[];
  activeLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  isProjectorMode: boolean; // פלט נקי לפרויקטור
}

export type Tool = 'select' | 'cornerpin' | 'mask' | 'draw' | 'warp';
