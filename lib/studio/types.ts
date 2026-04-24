// ─── Projection Mapping Studio Types ─────────────────────────────────────────

export interface StudioPoint { x: number; y: number; } // normalized 0-1

// A quad face on the canvas — 4 corners pinned to the reference image
export interface StudioFace {
  id: string;
  name: string;
  // [TL, TR, BR, BL] normalized 0–1 relative to canvas
  corners: [StudioPoint, StudioPoint, StudioPoint, StudioPoint];
  color: string; // for UI color coding
}

// A visual layer assigned to a face
export interface StudioLayer {
  id: string;
  name: string;
  faceId: string | null; // null = unassigned
  type: 'still' | 'loop' | 'blackout';
  imageUrl?: string;       // still image
  frames?: string[];       // loop frames (base64 or urls)
  opacity: number;         // 0–1
  visible: boolean;
  blendMode: 'normal' | 'screen' | 'multiply' | 'overlay' | 'add';
}

export type StudioTool =
  | 'select'     // click to select face/layer
  | 'addFace'    // click 4 corners to define a quad face
  | 'blackout'   // paint blackout regions
  | 'warp';      // drag individual face corners

export interface StudioBlackout {
  id: string;
  points: StudioPoint[];
  type: 'rect' | 'polygon' | 'paint';
}

export interface StudioState {
  // Reference image (source photo of the real surface)
  referenceUrl: string | null;
  referenceWidth: number;
  referenceHeight: number;

  // Faces (projection surfaces)
  faces: StudioFace[];
  activeFaceId: string | null;

  // Layers (visuals assigned to faces)
  layers: StudioLayer[];
  activeLayerId: string | null;

  // Blackout regions
  blackouts: StudioBlackout[];

  // Active tool
  tool: StudioTool;

  // Corner-adding state (when tool === 'addFace')
  pendingCorners: StudioPoint[];

  // UI state
  showReference: boolean;
  referenceOpacity: number;
  showGrid: boolean;
  projectorOpen: boolean;
}

export const FACE_COLORS = [
  '#00d4ff', '#a855f7', '#f97316', '#22c55e',
  '#ec4899', '#eab308', '#14b8a6', '#f43f5e',
];
