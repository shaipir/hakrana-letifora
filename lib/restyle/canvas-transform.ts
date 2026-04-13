/**
 * Client-side canvas restyle transformation.
 * Produces projection-ready neon/dark art from any photo.
 * No API key required.
 */

import { RestyleSettings } from '../types';

interface RGB { r: number; g: number; b: number }

const PRESET_COLORS: Record<RestyleSettings['preset'], RGB> = {
  'neon-projection':    { r: 0,   g: 229, b: 255 },
  'dark-futuristic':    { r: 100, g: 80,  b: 255 },
  'electric-energy':    { r: 255, g: 210, b: 0   },
  'liquid-light':       { r: 0,   g: 255, b: 160 },
  'minimal-glow':       { r: 200, g: 180, b: 255 },
  'glowing-sculpture':  { r: 255, g: 140, b: 0   },
};

export async function canvasRestyle(
  imageUrl: string,
  settings: RestyleSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const result = applyRestyle(img, settings);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

function applyRestyle(img: HTMLImageElement, settings: RestyleSettings): string {
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Draw source
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, W, H);
  const src = imageData.data;

  // Output buffer
  const out = new Uint8ClampedArray(src.length);

  const color = PRESET_COLORS[settings.preset];
  const darkness = settings.backgroundDarkness;       // 0–1
  const glow = settings.glowAmount;                   // 0–1
  const stylization = settings.stylizationStrength;   // 0–1
  const clarity = settings.subjectClarity;            // 0–1

  // Pass 1 — gather luminance for contrast normalization
  let minL = 1, maxL = 0;
  for (let i = 0; i < src.length; i += 4) {
    const l = luminance(src[i], src[i + 1], src[i + 2]);
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }
  const lRange = maxL - minL || 1;

  // Pass 2 — apply transformation per pixel
  for (let i = 0; i < src.length; i += 4) {
    const r = src[i], g = src[i + 1], b = src[i + 2];
    const a = src[i + 3];

    // Normalize luminance 0–1
    let l = (luminance(r, g, b) - minL) / lRange;

    // Boost contrast (S-curve)
    l = sCurve(l, 0.5 + stylization * 0.8);

    // Background suppression — dark pixels go darker
    const bgSuppress = Math.pow(l, 1 + darkness * 2);

    // Glow intensity on bright areas
    const glowI = Math.pow(bgSuppress, 1 - glow * 0.6) * (0.4 + glow * 0.6);

    // Subject clarity adds back some original color on bright areas
    const keepOriginal = clarity * bgSuppress;

    // Blend: neon color * glow + original * keepOriginal
    const nr = clamp(color.r * glowI + r * keepOriginal * 0.3);
    const ng = clamp(color.g * glowI + g * keepOriginal * 0.3);
    const nb = clamp(color.b * glowI + b * keepOriginal * 0.3);

    out[i]     = nr;
    out[i + 1] = ng;
    out[i + 2] = nb;
    out[i + 3] = a;
  }

  // Write transformed pixels
  const outData = new ImageData(out, W, H);
  ctx.putImageData(outData, 0, 0);

  // Pass 3 — glow bloom: draw the result blurred on top with screen blend
  if (glow > 0.2) {
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = W;
    glowCanvas.height = H;
    const gCtx = glowCanvas.getContext('2d')!;
    gCtx.filter = `blur(${Math.round(glow * 12 + 2)}px)`;
    gCtx.drawImage(canvas, 0, 0);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = glow * 0.5;
    ctx.drawImage(glowCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

function luminance(r: number, g: number, b: number): number {
  return 0.299 * r / 255 + 0.587 * g / 255 + 0.114 * b / 255;
}

function sCurve(x: number, strength: number): number {
  // Soft S-curve contrast boost
  if (x < 0.5) return 0.5 * Math.pow(2 * x, 1 + strength);
  return 1 - 0.5 * Math.pow(2 * (1 - x), 1 + strength);
}

function clamp(v: number): number {
  return Math.min(255, Math.max(0, Math.round(v)));
}
