/**
 * Neon Contour Pipeline — pure Canvas 2D image processing.
 * Runs on the main thread but uses OffscreenCanvas for intermediate steps.
 *
 * Pipeline:
 *   1. Grayscale conversion
 *   2. Contrast normalization
 *   3. Gaussian blur (pre-edge)
 *   4. Sobel edge detection
 *   5. Threshold + binary mask
 *   6. Denoise (morphological erosion of tiny fragments)
 *   7. Contour simplification (Douglas-Peucker approximation via thinning)
 *   8. Build neon render data (colored lines + glow)
 */

import { NeonContourSettings } from '../types';

export interface ContourFrame {
  /** ImageData ready to draw onto the display canvas */
  imageData: ImageData;
  /** Width of the frame */
  width: number;
  /** Height of the frame */
  height: number;
  /** Edge magnitude data (0–255), used by animator for flow-dash calculation */
  edgeMagnitude: Uint8ClampedArray;
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Process an HTMLImageElement into a ContourFrame ready for display/animation.
 */
export async function processImage(
  image: HTMLImageElement,
  settings: NeonContourSettings
): Promise<ContourFrame> {
  const { width, height } = image;

  // Step 1+2: Grayscale + contrast normalize
  const gray = toGrayscale(image, width, height);
  const normalized = normalizeContrast(gray, width, height);

  // Step 3: Gaussian blur (reduces noise before edge detection)
  const blurred = gaussianBlur(normalized, width, height, 1.5);

  // Step 4: Sobel edge detection
  const { magnitude, angle } = sobelEdge(blurred, width, height);

  // Step 5: Threshold
  const threshold = 20 + (1 - settings.edgeSensitivity) * 100;
  const binary = thresholdMask(magnitude, width, height, threshold);

  // Step 6: Denoise (remove tiny 1-pixel fragments)
  const denoised = denoise(binary, width, height);

  // Step 7: Apply line density (sub-sample)
  const filtered = applyLineDensity(denoised, magnitude, width, height, settings.lineDensity);

  // Step 8: Render neon frame
  const imageData = renderNeon(filtered, magnitude, width, height, settings);

  return { imageData, width, height, edgeMagnitude: filtered };
}

// ─── Step 1: Grayscale ───────────────────────────────────────────────────────

function toGrayscale(image: HTMLImageElement, w: number, h: number): Uint8ClampedArray {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const gray = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return gray;
}

// ─── Step 2: Contrast Normalization ─────────────────────────────────────────

function normalizeContrast(gray: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  let min = 255, max = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < min) min = gray[i];
    if (gray[i] > max) max = gray[i];
  }
  const range = max - min || 1;
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) {
    out[i] = Math.round(((gray[i] - min) / range) * 255);
  }
  return out;
}

// ─── Step 3: Gaussian Blur (3×3 approximation) ───────────────────────────────

function gaussianBlur(src: Uint8ClampedArray, w: number, h: number, sigma: number): Uint8ClampedArray {
  // 3×3 kernel based on sigma
  const k = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ];
  const kSum = 16;
  const out = new Uint8ClampedArray(src.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += src[(y + ky) * w + (x + kx)] * k[ky + 1][kx + 1];
        }
      }
      out[y * w + x] = Math.round(sum / kSum);
    }
  }
  // Copy border pixels
  for (let x = 0; x < w; x++) { out[x] = src[x]; out[(h - 1) * w + x] = src[(h - 1) * w + x]; }
  for (let y = 0; y < h; y++) { out[y * w] = src[y * w]; out[y * w + (w - 1)] = src[y * w + (w - 1)]; }
  return out;
}

// ─── Step 4: Sobel Edge Detection ────────────────────────────────────────────

interface SobelResult {
  magnitude: Uint8ClampedArray;
  angle: Float32Array;
}

function sobelEdge(src: Uint8ClampedArray, w: number, h: number): SobelResult {
  const magnitude = new Uint8ClampedArray(w * h);
  const angle = new Float32Array(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = src[(y - 1) * w + (x - 1)], tc = src[(y - 1) * w + x], tr = src[(y - 1) * w + (x + 1)];
      const ml = src[y * w + (x - 1)],                                    mr = src[y * w + (x + 1)];
      const bl = src[(y + 1) * w + (x - 1)], bc = src[(y + 1) * w + x], br = src[(y + 1) * w + (x + 1)];

      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;

      magnitude[y * w + x] = Math.min(255, Math.sqrt(gx * gx + gy * gy));
      angle[y * w + x] = Math.atan2(gy, gx);
    }
  }
  return { magnitude, angle };
}

// ─── Step 5: Threshold ────────────────────────────────────────────────────────

function thresholdMask(magnitude: Uint8ClampedArray, w: number, h: number, thresh: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  for (let i = 0; i < out.length; i++) {
    out[i] = magnitude[i] >= thresh ? magnitude[i] : 0;
  }
  return out;
}

// ─── Step 6: Denoise ─────────────────────────────────────────────────────────

function denoise(binary: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(binary.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (binary[y * w + x] === 0) continue;
      // Check if pixel has at least 1 neighbor — removes isolated pixels
      const hasNeighbor =
        binary[(y - 1) * w + x] > 0 ||
        binary[(y + 1) * w + x] > 0 ||
        binary[y * w + (x - 1)] > 0 ||
        binary[y * w + (x + 1)] > 0;
      if (hasNeighbor) out[y * w + x] = binary[y * w + x];
    }
  }
  return out;
}

// ─── Step 7: Line Density ────────────────────────────────────────────────────

function applyLineDensity(
  binary: Uint8ClampedArray,
  magnitude: Uint8ClampedArray,
  w: number,
  h: number,
  density: number
): Uint8ClampedArray {
  if (density >= 1) return binary;
  const out = new Uint8ClampedArray(binary.length);
  const cutoff = (1 - density) * 255;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] > 0 && magnitude[i] >= cutoff) out[i] = binary[i];
  }
  return out;
}

// ─── Step 8: Neon Render ─────────────────────────────────────────────────────

export function renderNeon(
  edgeMask: Uint8ClampedArray,
  magnitude: Uint8ClampedArray,
  w: number,
  h: number,
  settings: NeonContourSettings,
  dashOffset = 0
): ImageData {
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d')!;

  // Background
  const bgAlpha = settings.backgroundDarkness;
  ctx.fillStyle = `rgba(${Math.round(3 + (1 - bgAlpha) * 20)},${Math.round(3 + (1 - bgAlpha) * 15)},${Math.round(8 + (1 - bgAlpha) * 30)},1)`;
  ctx.fillRect(0, 0, w, h);

  // Parse neon color
  const hex = settings.neonColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Glow layer (blurred, larger)
  const glowStrength = settings.glowStrength;
  if (glowStrength > 0.1) {
    ctx.save();
    ctx.filter = `blur(${Math.round(settings.lineThickness * 2 * glowStrength)}px)`;
    drawEdgeLines(ctx, edgeMask, w, h, r, g, b, settings.lineThickness * 1.5, 0.4 * glowStrength, dashOffset);
    ctx.restore();
  }

  // Core line layer
  ctx.save();
  ctx.filter = `blur(${settings.lineThickness > 3 ? 0.5 : 0}px)`;
  drawEdgeLines(ctx, edgeMask, w, h, r, g, b, settings.lineThickness, 0.9, dashOffset);
  ctx.restore();

  // Bright core (thin, full alpha)
  drawEdgeLines(ctx, edgeMask, w, h, 255, 255, 255, Math.max(1, settings.lineThickness * 0.3), 0.7, dashOffset);

  return ctx.getImageData(0, 0, w, h);
}

function drawEdgeLines(
  ctx: OffscreenCanvasRenderingContext2D,
  edgeMask: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  lineWidth: number,
  alpha: number,
  dashOffset: number
) {
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (dashOffset > 0) {
    const dashLen = 12;
    ctx.setLineDash([dashLen, dashLen]);
    ctx.lineDashOffset = -dashOffset;
  } else {
    ctx.setLineDash([]);
  }

  // Scan horizontal runs for efficiency
  ctx.beginPath();
  for (let y = 0; y < h; y++) {
    let inLine = false;
    let startX = 0;
    for (let x = 0; x < w; x++) {
      const active = edgeMask[y * w + x] > 0;
      if (active && !inLine) { startX = x; inLine = true; }
      else if (!active && inLine) {
        ctx.moveTo(startX, y);
        ctx.lineTo(x - 1, y);
        inLine = false;
      }
    }
    if (inLine) { ctx.moveTo(startX, y); ctx.lineTo(w - 1, y); }
  }
  ctx.stroke();
}
