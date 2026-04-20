// lib/mapping-types.ts
import { Point, BlendMode } from './types';

export type MappingTab = 'create' | 'map' | 'warp' | 'live';
export type WarpMode = 'corner-pin' | 'mesh' | 'bezier';
export type DrawingTool = 'select' | 'polyline' | 'brush' | 'shape';
export type SnapMode = 'grid' | 'edge' | 'none';

export interface BezierHandle {
  inTangent: Point;
  outTangent: Point;
}

export interface MeshGrid {
  cols: number;
  rows: number;
  points: Point[][];
}

export interface BezierSurface {
  controlPoints: Point[][];
  handles: BezierHandle[][];
}

export interface SurfaceOutline {
  type: 'freehand' | 'shape' | 'detected';
  path: string;
  points: Point[];
}

export interface Surface {
  id: string;
  name: string;
  outline: SurfaceOutline;
  contentId: string | null;
  warpMode: WarpMode;
  cornerPin: { topLeft: Point; topRight: Point; bottomLeft: Point; bottomRight: Point };
  meshGrid: MeshGrid;
  bezierSurface: BezierSurface;
  opacity: number;
  blendMode: BlendMode;
  visible: boolean;
}

export interface ContentItem {
  id: string;
  url: string;
  name: string;
  sourceMode: string;
}

export interface DetectedZone {
  id: string;
  label: string;
  points: Point[];
  accepted: boolean;
}

export interface MappingProject {
  id: string;
  name: string;
  surfaces: Surface[];
  activeSurfaceId: string | null;
  referencePhotoUrl: string | null;
  detectedZones: DetectedZone[];
  contentItems: ContentItem[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface DrawingState {
  tool: DrawingTool;
  snapMode: SnapMode;
  gridSize: number;
  currentPoints: Point[];
  isDrawing: boolean;
}

export interface LiveState {
  isLive: boolean;
  projectorWindowRef: Window | null;
  masterOpacity: number;
  blackout: boolean;
  frozen: boolean;
  crossfadeDuration: number;
}
