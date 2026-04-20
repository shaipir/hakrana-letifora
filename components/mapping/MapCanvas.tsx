'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMappingStore } from '@/lib/mapping-store';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { Point } from '@/lib/types';
import { Surface } from '@/lib/mapping-types';

const AR_BG = '#050507';
const GRID_COLOR = '#1c1c2e';
const NEON_GREEN = '#39ff14';
const CYAN_ACTIVE = '#00e5ff';
const BLUE_INACTIVE = '#3b82f6';
const SNAP_THRESHOLD = 15;
const POINT_HIT_RADIUS = 8;

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if ((yi > point.y) !== (yj > point.y) &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function applySnap(raw: Point, snapMode: string, gridSize: number, surfaces: Surface[]): Point {
  if (snapMode === 'grid') {
    return { x: Math.round(raw.x / gridSize) * gridSize, y: Math.round(raw.y / gridSize) * gridSize };
  }
  if (snapMode === 'edge') {
    let nearest: Point | null = null;
    let minDist = SNAP_THRESHOLD;
    for (const s of surfaces) {
      for (const p of s.outline.points) {
        const d = Math.hypot(p.x - raw.x, p.y - raw.y);
        if (d < minDist) { minDist = d; nearest = p; }
      }
    }
    return nearest ?? raw;
  }
  return raw;
}

export default function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const bgUrlRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);

  // Drag state for moving points
  const dragRef = useRef<{ surfaceId: string; pointIndex: number } | null>(null);

  const {
    project, drawing, addDrawingPoint, finishDrawing, setActiveSurface, updateSurface,
  } = useMappingStore();

  // Also get the uploaded image directly from ArtRevive store as fallback
  const uploadedAsset = useArtReviveStore((s) => s.project.uploadedAsset);

  // Determine background URL: mapping reference photo OR artrevive uploaded image
  const bgUrl = project.referencePhotoUrl || uploadedAsset?.url || null;

  // Load background image
  useEffect(() => {
    if (!bgUrl) { setBgImage(null); bgUrlRef.current = null; return; }
    if (bgUrl === bgUrlRef.current) return;
    bgUrlRef.current = bgUrl;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.onerror = () => { console.error('[MAPPING:MapCanvas] Failed to load bg image'); setBgImage(null); };
    img.src = bgUrl;
  }, [bgUrl]);

  // Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = size;

    // Background
    ctx.fillStyle = AR_BG;
    ctx.fillRect(0, 0, width, height);

    // Grid
    if (drawing.snapMode === 'grid') {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x += drawing.gridSize) {
        ctx.moveTo(x, 0); ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += drawing.gridSize) {
        ctx.moveTo(0, y); ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // Background image
    if (bgImage) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(bgImage, 0, 0, width, height);
      ctx.globalAlpha = 1;
    }

    // Surfaces
    for (const surface of project.surfaces) {
      if (!surface.visible) continue;
      const pts = surface.outline.points;
      if (pts.length < 3) continue;
      const isActive = surface.id === project.activeSurfaceId;
      const color = isActive ? CYAN_ACTIVE : BLUE_INACTIVE;

      // Fill
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = isActive ? 'rgba(0,229,255,0.12)' : 'rgba(59,130,246,0.08)';
      ctx.fill();

      // Stroke
      ctx.strokeStyle = color;
      ctx.lineWidth = isActive ? 2.5 : 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Points (larger for active to indicate draggable)
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (isActive) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Label
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(surface.name, pts[0].x + 8, pts[0].y - 8);
    }

    // In-progress drawing
    const cPts = drawing.currentPoints;
    if (cPts.length > 0) {
      ctx.beginPath();
      ctx.moveTo(cPts[0].x, cPts[0].y);
      for (let i = 1; i < cPts.length; i++) ctx.lineTo(cPts[i].x, cPts[i].y);
      ctx.strokeStyle = NEON_GREEN;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const p of cPts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = NEON_GREEN;
        ctx.fill();
      }
    }
  }, [size, project, drawing, bgImage]);

  // --- Interactions ---

  function getPoint(e: React.MouseEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // Find if mouse is near a point of the active surface
  function findHitPoint(pos: Point): { surfaceId: string; pointIndex: number } | null {
    const active = project.surfaces.find((s) => s.id === project.activeSurfaceId);
    if (!active) return null;
    for (let i = 0; i < active.outline.points.length; i++) {
      const p = active.outline.points[i];
      if (Math.hypot(p.x - pos.x, p.y - pos.y) < POINT_HIT_RADIUS) {
        return { surfaceId: active.id, pointIndex: i };
      }
    }
    return null;
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getPoint(e);

    // In select mode: check if dragging a point of active surface
    if (drawing.tool === 'select') {
      const hit = findHitPoint(pos);
      if (hit) {
        dragRef.current = hit;
        return;
      }
    }

    // Brush mode: start freehand
    if (drawing.tool === 'brush') {
      addDrawingPoint(pos);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const pos = getPoint(e);

    // Dragging a point
    if (dragRef.current && drawing.tool === 'select') {
      const { surfaceId, pointIndex } = dragRef.current;
      const surface = project.surfaces.find((s) => s.id === surfaceId);
      if (surface) {
        const newPoints = [...surface.outline.points];
        newPoints[pointIndex] = pos;
        updateSurface(surfaceId, {
          outline: { ...surface.outline, points: newPoints },
        });
      }
      return;
    }

    // Brush mode: add points while dragging
    if (drawing.tool === 'brush' && drawing.isDrawing && e.buttons === 1) {
      addDrawingPoint(pos);
    }
  }

  function handleMouseUp() {
    // End drag
    if (dragRef.current) {
      dragRef.current = null;
      return;
    }

    // End brush
    if (drawing.tool === 'brush' && drawing.isDrawing) {
      if (drawing.currentPoints.length >= 3) {
        finishDrawing();
      }
    }
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    // Don't fire click if we just finished a drag
    if (dragRef.current) return;

    const pos = getPoint(e);

    if (drawing.tool === 'select') {
      // Select surface by clicking inside
      let hit: string | null = null;
      for (const s of [...project.surfaces].reverse()) {
        if (!s.visible || s.outline.points.length < 3) continue;
        if (isPointInPolygon(pos, s.outline.points)) { hit = s.id; break; }
      }
      setActiveSurface(hit);
      return;
    }

    if (drawing.tool === 'polyline') {
      const snapped = applySnap(pos, drawing.snapMode, drawing.gridSize, project.surfaces);
      addDrawingPoint(snapped);
    }
  }

  function handleDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (drawing.tool === 'polyline' && drawing.currentPoints.length >= 3) {
      finishDrawing();
    }
  }

  // Cursor
  let cursor = 'crosshair';
  if (drawing.tool === 'select') cursor = 'default';

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      />
      {!bgImage && !bgUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-ar-text-dim text-sm">Upload an image in Create tab first, then switch here</p>
        </div>
      )}
    </div>
  );
}
