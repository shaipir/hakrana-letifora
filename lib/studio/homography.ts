// ─── 4-point homography → CSS matrix3d ───────────────────────────────────────
// Maps a w×h source element to an arbitrary destination quad using perspective.
// Returns a CSS matrix3d() string that can be applied as a transform.

import { StudioPoint } from './types';

type Vec8 = [number,number,number,number,number,number,number,number];

/** Solve Ax = b via Gaussian elimination (8×8). Returns x or null on failure. */
function solve8(A: number[][], b: number[]): number[] | null {
  const n = 8;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pivot
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) { maxVal = Math.abs(M[row][col]); maxRow = row; }
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-10) return null;

    const pivot = M[col][col];
    for (let j = col; j <= n; j++) M[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
    }
  }
  return M.map(row => row[n]);
}

/**
 * Compute the 3×3 homography matrix mapping src quad → dst quad.
 * Points are in pixel coordinates.
 */
export function computeHomography(
  src: [StudioPoint, StudioPoint, StudioPoint, StudioPoint],
  dst: [StudioPoint, StudioPoint, StudioPoint, StudioPoint],
): number[][] | null {
  // Build 8×8 system from 4 point correspondences
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const { x: sx, y: sy } = src[i];
    const { x: dx, y: dy } = dst[i];
    A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy]);
    b.push(dy);
  }

  const h = solve8(A, b);
  if (!h) return null;

  return [
    [h[0], h[1], h[2]],
    [h[3], h[4], h[5]],
    [h[6], h[7], 1],
  ];
}

/**
 * Convert a 3×3 homography to a CSS matrix3d string.
 * The CSS 4×4 matrix is column-major.
 * Embeds the homography into rows/cols 0,1,3 (skipping Z).
 */
export function homographyToCSSMatrix(H: number[][]): string {
  // Layout: from 3x3 H to 4x4 CSS matrix3d
  // CSS matrix3d order: m11,m12,m13,m14, m21... (column-major)
  // We embed: skip Z row/col
  const [
    [h11, h12, h13],
    [h21, h22, h23],
    [h31, h32, h33],
  ] = H;

  // 4×4 column-major matrix
  const m = [
    h11,  h21,  0,  h31,
    h12,  h22,  0,  h32,
    0,    0,    1,  0,
    h13,  h23,  0,  h33,
  ];

  return `matrix3d(${m.join(',')})`;
}

/**
 * Compute CSS matrix3d that warps a (w×h) element into the given destination quad.
 * dst: [TL, TR, BR, BL] in pixel coordinates of the container.
 * Returns the transform origin and matrix3d string to apply.
 */
export function warpElementToQuad(
  w: number,
  h: number,
  dst: [StudioPoint, StudioPoint, StudioPoint, StudioPoint],
): { transform: string; transformOrigin: string } | null {
  // Source: the 4 corners of the w×h element
  const src: [StudioPoint, StudioPoint, StudioPoint, StudioPoint] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];

  const H = computeHomography(src, dst);
  if (!H) return null;

  return {
    transform: homographyToCSSMatrix(H),
    transformOrigin: '0 0',
  };
}

/** Convert normalized StudioPoints (0–1) to pixel coordinates. */
export function denormalize(
  pts: [StudioPoint, StudioPoint, StudioPoint, StudioPoint],
  W: number,
  H: number,
): [StudioPoint, StudioPoint, StudioPoint, StudioPoint] {
  return pts.map(p => ({ x: p.x * W, y: p.y * H })) as [StudioPoint, StudioPoint, StudioPoint, StudioPoint];
}
