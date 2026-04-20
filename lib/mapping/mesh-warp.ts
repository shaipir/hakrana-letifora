// lib/mapping/mesh-warp.ts
import { Point } from '@/lib/types';
import { MeshGrid } from '@/lib/mapping-types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MeshGeometry {
  positions: Float32Array; // x,y pairs in clip space (-1..1)
  uvs: Float32Array;       // u,v pairs (0..1)
  indices: Uint16Array;
}

// ─── generateMeshGeometry ─────────────────────────────────────────────────────

/**
 * Converts a MeshGrid to GPU-ready geometry arrays.
 * Vertex count: (cols+1)*(rows+1)
 * Index count: cols*rows*6 (two triangles per quad)
 */
export function generateMeshGeometry(
  grid: MeshGrid,
  canvasWidth: number,
  canvasHeight: number,
): MeshGeometry {
  const { cols, rows, points } = grid;
  const vertexCount = (cols + 1) * (rows + 1);
  const indexCount = cols * rows * 6;

  const positions = new Float32Array(vertexCount * 2);
  const uvs = new Float32Array(vertexCount * 2);
  const indices = new Uint16Array(indexCount);

  // Fill positions and UVs
  let vi = 0;
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const pt = points[r][c];
      // Convert to clip space
      const cx = (pt.x / canvasWidth) * 2 - 1;
      const cy = 1 - (pt.y / canvasHeight) * 2;
      positions[vi * 2] = cx;
      positions[vi * 2 + 1] = cy;
      // UV from grid position
      uvs[vi * 2] = c / cols;
      uvs[vi * 2 + 1] = r / rows;
      vi++;
    }
  }

  // Fill indices — two triangles per quad cell
  // Vertices in row-major order: index(r,c) = r*(cols+1) + c
  let ii = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tl = r * (cols + 1) + c;
      const tr = tl + 1;
      const bl = (r + 1) * (cols + 1) + c;
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

// ─── findNearestMeshPoint ─────────────────────────────────────────────────────

/**
 * Finds the closest mesh control point within `threshold` pixels of `pos`.
 * Returns { row, col } or null if none found within threshold.
 */
export function findNearestMeshPoint(
  grid: MeshGrid,
  pos: Point,
  threshold: number = 15,
): { row: number; col: number } | null {
  const { cols, rows, points } = grid;
  let bestDist = threshold;
  let result: { row: number; col: number } | null = null;

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const pt = points[r][c];
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

// ─── bilinearInterpolate ──────────────────────────────────────────────────────

/**
 * Standard bilinear interpolation over a quad defined by four corner points.
 * @param tl - top-left corner
 * @param tr - top-right corner
 * @param bl - bottom-left corner
 * @param br - bottom-right corner
 * @param u  - horizontal parameter [0..1]
 * @param v  - vertical parameter [0..1]
 */
export function bilinearInterpolate(
  tl: Point,
  tr: Point,
  bl: Point,
  br: Point,
  u: number,
  v: number,
): Point {
  const topX = tl.x + (tr.x - tl.x) * u;
  const topY = tl.y + (tr.y - tl.y) * u;
  const botX = bl.x + (br.x - bl.x) * u;
  const botY = bl.y + (br.y - bl.y) * u;
  return {
    x: topX + (botX - topX) * v,
    y: topY + (botY - topY) * v,
  };
}
