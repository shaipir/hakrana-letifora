/**
 * Edge-Based Frame Alignment
 *
 * Detects building bounds via Sobel edge detection at 512px,
 * computes alignment transform, applies at full resolution.
 * Keeps building pixel-locked across frames for projection mapping.
 */

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BuildingBounds {
  bbox: BBox;
  /** Ratio: analysis width / original width */
  scale: number;
  originalWidth: number;
  originalHeight: number;
}

export interface AlignTransform {
  tx: number;
  ty: number;
  sx: number;
  sy: number;
}

const ANALYSIS_WIDTH = 512;
const EDGE_THRESHOLD = 0.15;

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function sobelEdgeMap(pixels: Uint8ClampedArray, W: number, H: number): Float32Array {
  const lum = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      lum[y * W + x] = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
    }
  }

  const edges = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -lum[(y - 1) * W + (x - 1)] + lum[(y - 1) * W + (x + 1)]
        - 2 * lum[y * W + (x - 1)] + 2 * lum[y * W + (x + 1)]
        - lum[(y + 1) * W + (x - 1)] + lum[(y + 1) * W + (x + 1)];
      const gy =
        -lum[(y - 1) * W + (x - 1)] - 2 * lum[(y - 1) * W + x] - lum[(y - 1) * W + (x + 1)]
        + lum[(y + 1) * W + (x - 1)] + 2 * lum[(y + 1) * W + x] + lum[(y + 1) * W + (x + 1)];
      edges[y * W + x] = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 2.5);
    }
  }
  return edges;
}

/**
 * Find the dominant bounding box of edge-dense region.
 * Uses row/col projection to find the building mass.
 */
function findEdgeBounds(edges: Float32Array, W: number, H: number): BBox {
  // Project edge density onto rows and columns
  const rowDensity = new Float32Array(H);
  const colDensity = new Float32Array(W);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const v = edges[y * W + x] > EDGE_THRESHOLD ? 1 : 0;
      rowDensity[y] += v;
      colDensity[x] += v;
    }
  }

  // Find bounds where edge density exceeds 10% of max
  const rowMax = Math.max(...rowDensity);
  const colMax = Math.max(...colDensity);
  const rowThresh = rowMax * 0.1;
  const colThresh = colMax * 0.1;

  let top = 0, bottom = H - 1, left = 0, right = W - 1;

  for (let y = 0; y < H; y++) { if (rowDensity[y] > rowThresh) { top = y; break; } }
  for (let y = H - 1; y >= 0; y--) { if (rowDensity[y] > rowThresh) { bottom = y; break; } }
  for (let x = 0; x < W; x++) { if (colDensity[x] > colThresh) { left = x; break; } }
  for (let x = W - 1; x >= 0; x--) { if (colDensity[x] > colThresh) { right = x; break; } }

  return { x: left, y: top, w: right - left, h: bottom - top };
}

/**
 * Extract building bounds from an image at 512px analysis width.
 */
export async function extractBuildingBounds(imageDataUrl: string): Promise<BuildingBounds> {
  const img = await loadImageElement(imageDataUrl);
  const origW = img.naturalWidth;
  const origH = img.naturalHeight;

  const scale = ANALYSIS_WIDTH / origW;
  const aW = ANALYSIS_WIDTH;
  const aH = Math.round(origH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = aW;
  canvas.height = aH;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, aW, aH);
  const imageData = ctx.getImageData(0, 0, aW, aH);

  const edges = sobelEdgeMap(imageData.data, aW, aH);
  const bbox = findEdgeBounds(edges, aW, aH);

  return { bbox, scale, originalWidth: origW, originalHeight: origH };
}

/**
 * Compute alignment transform to map frame building bounds onto original bounds.
 */
export function computeAlignment(original: BuildingBounds, frame: BuildingBounds): AlignTransform {
  const oBbox = original.bbox;
  const fBbox = frame.bbox;

  // Scale to match bounding box sizes
  const sx = oBbox.w / Math.max(fBbox.w, 1);
  const sy = oBbox.h / Math.max(fBbox.h, 1);

  // Use uniform scale (average) to avoid distortion
  const s = (sx + sy) / 2;

  // After scaling, compute translation to align centers
  const oCenterX = oBbox.x + oBbox.w / 2;
  const oCenterY = oBbox.y + oBbox.h / 2;
  const fCenterX = fBbox.x + fBbox.w / 2;
  const fCenterY = fBbox.y + fBbox.h / 2;

  // Transform: scale frame around its center, then translate to match original center
  const tx = (oCenterX - fCenterX * s) / original.scale;
  const ty = (oCenterY - fCenterY * s) / original.scale;

  return { tx, ty, sx: s, sy: s };
}

/**
 * Apply alignment transform to a frame image and crop to original dimensions.
 */
export async function applyAlignment(
  frameDataUrl: string,
  transform: AlignTransform,
  originalWidth: number,
  originalHeight: number,
): Promise<string> {
  const img = await loadImageElement(frameDataUrl);

  const canvas = document.createElement('canvas');
  canvas.width = originalWidth;
  canvas.height = originalHeight;
  const ctx = canvas.getContext('2d')!;

  // Clear to black (projection mapping background)
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, originalWidth, originalHeight);

  // Apply transform: translate then scale
  ctx.save();
  ctx.translate(transform.tx, transform.ty);
  ctx.scale(transform.sx, transform.sy);
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

/**
 * Full alignment pipeline: align a generated frame to original building bounds.
 * Returns aligned + cropped dataUrl.
 */
export async function alignFrame(
  frameDataUrl: string,
  originalBounds: BuildingBounds,
): Promise<string> {
  // Skip alignment for pollinations URLs (external, not data URLs)
  if (!frameDataUrl.startsWith('data:')) return frameDataUrl;

  const frameBounds = await extractBuildingBounds(frameDataUrl);
  const transform = computeAlignment(originalBounds, frameBounds);

  // Skip if alignment is negligible (< 2px drift at analysis scale)
  const drift = Math.abs(transform.tx * originalBounds.scale) + Math.abs(transform.ty * originalBounds.scale);
  if (drift < 2 && Math.abs(transform.sx - 1) < 0.02) {
    return frameDataUrl;
  }

  return applyAlignment(
    frameDataUrl,
    transform,
    originalBounds.originalWidth,
    originalBounds.originalHeight,
  );
}

/**
 * Align multiple frames (loop). Processes in sequence to avoid memory pressure.
 */
export async function alignFrames(
  frames: string[],
  originalBounds: BuildingBounds,
): Promise<string[]> {
  const aligned: string[] = [];
  for (const frame of frames) {
    aligned.push(await alignFrame(frame, originalBounds));
  }
  return aligned;
}
