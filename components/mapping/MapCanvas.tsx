'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMappingStore } from '@/lib/mapping-store';
import { Point } from '@/lib/types';
import { Surface } from '@/lib/mapping-types';

// ─── Constants ────────────────────────────────────────────────────────────────

const AR_BG = '#050507';
const GRID_COLOR = '#1c1c2e';
const NEON_GREEN = '#39ff14';
const CYAN_ACTIVE = '#00e5ff';
const BLUE_INACTIVE = '#3b82f6';
const SNAP_THRESHOLD = 15; // px

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  const { x, y } = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

function snapToEdge(point: Point, surfaces: Surface[]): Point | null {
  let nearest: Point | null = null;
  let minDist = SNAP_THRESHOLD;
  for (const surface of surfaces) {
    for (const p of surface.outline.points) {
      const dist = Math.hypot(p.x - point.x, p.y - point.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = p;
      }
    }
  }
  return nearest;
}

function applySnap(
  raw: Point,
  snapMode: string,
  gridSize: number,
  surfaces: Surface[],
): Point {
  if (snapMode === 'grid') return snapToGrid(raw, gridSize);
  if (snapMode === 'edge') {
    const snapped = snapToEdge(raw, surfaces);
    return snapped ?? raw;
  }
  return raw;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const brushPointsRef = useRef<Point[]>([]);
  const refImageRef = useRef<HTMLImageElement | null>(null);
  const refImageUrlRef = useRef<string | null>(null);

  const { project, drawing, addDrawingPoint, finishDrawing, setActiveSurface } =
    useMappingStore();

  // ── Draw ──────────────────────────────────────────────────────────────────

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = sizeRef.current;

    // Background
    ctx.fillStyle = AR_BG;
    ctx.fillRect(0, 0, width, height);

    // Grid
    if (drawing.snapMode === 'grid') {
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x += drawing.gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += drawing.gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();
    }

    // Reference photo (cached)
    if (project.referencePhotoUrl) {
      if (refImageUrlRef.current !== project.referencePhotoUrl) {
        refImageUrlRef.current = project.referencePhotoUrl;
        const img = new window.Image();
        img.src = project.referencePhotoUrl;
        img.onload = () => { refImageRef.current = img; };
        refImageRef.current = null;
      }
      if (refImageRef.current) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(refImageRef.current, 0, 0, width, height);
        ctx.globalAlpha = 1;
      }
    }

    // Existing surfaces
    for (const surface of project.surfaces) {
      if (!surface.visible) continue;
      const pts = surface.outline.points;
      if (pts.length < 3) continue;

      const isActive = surface.id === project.activeSurfaceId;
      const strokeColor = isActive ? CYAN_ACTIVE : BLUE_INACTIVE;

      // Filled polygon
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.fillStyle = isActive ? 'rgba(0,229,255,0.08)' : 'rgba(59,130,246,0.08)';
      ctx.fill();

      // Stroke outline
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isActive ? 2 : 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Vertex points
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = strokeColor;
        ctx.fill();
      }

      // Name label near first point
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = strokeColor;
      ctx.fillText(surface.name, pts[0].x + 6, pts[0].y - 6);
    }

    // Current drawing (in-progress polyline)
    const cPts = drawing.currentPoints;
    if (cPts.length > 0) {
      // Polyline
      ctx.beginPath();
      ctx.moveTo(cPts[0].x, cPts[0].y);
      for (let i = 1; i < cPts.length; i++) ctx.lineTo(cPts[i].x, cPts[i].y);
      ctx.strokeStyle = NEON_GREEN;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circles
      for (const p of cPts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = NEON_GREEN;
        ctx.fill();
      }
    }
  }, [project, drawing]);

  // Re-draw whenever state changes
  useEffect(() => {
    draw();
  }, [draw]);

  // ── ResizeObserver ────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        sizeRef.current = { width, height };
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = width;
          canvas.height = height;
        }
        draw();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  // ── Event Helpers ─────────────────────────────────────────────────────────

  function getCanvasPoint(e: React.MouseEvent<HTMLCanvasElement>): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ── Click ──────────────────────────────────────────────────────────────────

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const raw = getCanvasPoint(e);

    if (drawing.tool === 'select') {
      // Check point-in-polygon for all visible surfaces (top-most first)
      let hit: string | null = null;
      const surfaces = [...project.surfaces].reverse();
      for (const surface of surfaces) {
        if (!surface.visible) continue;
        if (surface.outline.points.length < 3) continue;
        if (isPointInPolygon(raw, surface.outline.points)) {
          hit = surface.id;
          break;
        }
      }
      setActiveSurface(hit);
      return;
    }

    if (drawing.tool === 'polyline') {
      const snapped = applySnap(
        raw,
        drawing.snapMode,
        drawing.gridSize,
        project.surfaces,
      );
      addDrawingPoint(snapped);
      return;
    }
  }

  // ── Double-click ──────────────────────────────────────────────────────────

  function handleDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (drawing.tool === 'polyline' && drawing.currentPoints.length >= 3) {
      finishDrawing();
    }
  }

  // ── Brush (mouse drag) ────────────────────────────────────────────────────

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (drawing.tool !== 'brush') return;
    brushPointsRef.current = [];
    const raw = getCanvasPoint(e);
    brushPointsRef.current.push(raw);
    addDrawingPoint(raw);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (drawing.tool !== 'brush') return;
    if (!drawing.isDrawing) return;
    if (e.buttons === 0) return; // no button held
    const raw = getCanvasPoint(e);
    brushPointsRef.current.push(raw);
    addDrawingPoint(raw);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (drawing.tool !== 'brush') return;
    if (drawing.currentPoints.length >= 3) {
      finishDrawing();
    }
    brushPointsRef.current = [];
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ cursor: drawing.tool === 'select' ? 'default' : 'crosshair' }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  );
}
