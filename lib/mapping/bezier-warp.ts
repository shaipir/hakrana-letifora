// lib/mapping/bezier-warp.ts
import { Point } from '@/lib/types';
import { BezierSurface } from '@/lib/mapping-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BezierGeometry {
  positions: Float32Array; // x,y pairs in clip space (-1..1)
  uvs: Float32Array;       // u,v pairs (0..1)
  indices: Uint16Array;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Iterative binomial coefficient C(n, k).
 */
function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  const kClamped = Math.min(k, n - k);
  for (let i = 0; i < kClamped; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/**
 * Bernstein basis polynomial B(n, i, t).
 * B(n,i,t) = C(n,i) * t^i * (1-t)^(n-i)
 */
function bernstein(n: number, i: number, t: number): number {
  return binomial(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
}

// ─── evaluateBezierSurface ────────────────────────────────────────────────────

/**
 * Evaluate a bicubic Bezier surface at parameter (u, v) using Bernstein polynomials.
 * Assumes a 4×4 grid of control points (standard bicubic).
 * If the surface has a different grid size, the degree adapts automatically.
 */
export function evaluateBezierSurface(
  surface: BezierSurface,
  u: number,
  v: number,
): Point {
  const { controlPoints } = surface;
  const rowCount = controlPoints.length;
  const colCount = controlPoints[0].length;
  const n = rowCount - 1; // degree in v
  const m = colCount - 1; // degree in u

  let x = 0;
  let y = 0;

  for (let i = 0; i <= n; i++) {
    const bv = bernstein(n, i, v);
    for (let j = 0; j <= m; j++) {
      const bu = bernstein(m, j, u);
      const w = bv * bu;
      x += w * controlPoints[i][j].x;
      y += w * controlPoints[i][j].y;
    }
  }

  return { x, y };
}

// ─── tessellateBezierSurface ──────────────────────────────────────────────────

/**
 * Tessellates a BezierSurface into GPU-ready geometry arrays.
 * Creates (subdivisions+1)^2 vertices and subdivisions^2 * 6 indices.
 */
export function tessellateBezierSurface(
  surface: BezierSurface,
  canvasWidth: number,
  canvasHeight: number,
  subdivisions: number = 16,
): BezierGeometry {
  const steps = subdivisions;
  const vertexCount = (steps + 1) * (steps + 1);
  const indexCount = steps * steps * 6;

  const positions = new Float32Array(vertexCount * 2);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint16Array(indexCount);

  // Sample surface at regular u,v intervals
  let vi = 0;
  for (let ri = 0; ri <= steps; ri++) {
    const v = ri / steps;
    for (let ci = 0; ci <= steps; ci++) {
      const u = ci / steps;
      const pt = evaluateBezierSurface(surface, u, v);
      // Convert to clip space
      positions[vi * 2] = (pt.x / canvasWidth) * 2 - 1;
      positions[vi * 2 + 1] = 1 - (pt.y / canvasHeight) * 2;
      // UV = raw u,v
      uvs[vi * 2] = u;
      uvs[vi * 2 + 1] = v;
      vi++;
    }
  }

  // Fill indices — same two-triangle-per-quad pattern as mesh
  let ii = 0;
  for (let r = 0; r < steps; r++) {
    for (let c = 0; c < steps; c++) {
      const tl = r * (steps + 1) + c;
      const tr = tl + 1;
      const bl = (r + 1) * (steps + 1) + c;
      const br = bl + 1;
      // Triangle 1: tl, bl, tr
      indices[ii++] = tl;
      indices[ii++] = bl;
      indices[ii++] = tr;
      // Triangle 2: tr, bl, br
      indices[ii++] = tr;
      indices[ii++] = bl;
      indices[ii++] = br;
    }
  }

  return { positions, uvs, indices };
}

// ─── findNearestBezierPoint ───────────────────────────────────────────────────

/**
 * Finds the closest control point in a BezierSurface within `threshold` pixels.
 * Searches the full 4×4 (or whatever size) control point grid.
 * Returns { row, col } or null if none found within threshold.
 */
export function findNearestBezierPoint(
  surface: BezierSurface,
  pos: Point,
  threshold: number = 15,
): { row: number; col: number } | null {
  const { controlPoints } = surface;
  let bestDist = threshold;
  let result: { row: number; col: number } | null = null;

  for (let r = 0; r < controlPoints.length; r++) {
    for (let c = 0; c < controlPoints[r].length; c++) {
      const pt = controlPoints[r][c];
      const dx = pt.x - pos.x;
      const dy = pt.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= bestDist) {
        bestDist = dist;
        result = { row: r, col: c };
      }
    }
  }

  return result;
}
