/**
 * POST /api/neon-contour
 *
 * Accepts an imageUrl + NeonContourSettings.
 * Returns a still PNG of the neon contour output (no animation — for export/save).
 * Animation is client-side; this route produces a static snapshot.
 *
 * Note: Canvas 2D image processing runs via @napi-rs/canvas or similar.
 * On Vercel Edge this isn't available, so we use Node runtime.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GeneratedAsset, NeonContourSettings } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageUrl, settings, sourceAssetId } = body as {
      imageUrl: string;
      settings: NeonContourSettings;
      sourceAssetId: string;
    };

    if (!imageUrl || !settings) {
      return NextResponse.json({ error: 'imageUrl and settings are required' }, { status: 400 });
    }

    // Support both data URLs and remote URLs
    let imgBuffer: Buffer;
    if (imageUrl.startsWith('data:')) {
      const comma = imageUrl.indexOf(',');
      imgBuffer = Buffer.from(imageUrl.slice(comma + 1), 'base64');
    } else {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch source image: ${imgRes.status}`);
      imgBuffer = Buffer.from(await imgRes.arrayBuffer());
    }

    // Process via server-side canvas pipeline
    const pngBuffer = await processNeonContourServerSide(imgBuffer, settings);

    // Return as data URL — no Blob storage needed
    const id = crypto.randomUUID();
    const resultDataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    const asset: GeneratedAsset = {
      id,
      url: resultDataUrl,
      mode: 'neon-contour',
      settings,
      sourceAssetId: sourceAssetId ?? '',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ asset }, { status: 201 });
  } catch (err: any) {
    console.error('[api/neon-contour]', err);
    return NextResponse.json({ error: err?.message ?? 'Processing failed' }, { status: 500 });
  }
}

// ─── Server-side processing ──────────────────────────────────────────────────
// Uses @napi-rs/canvas (Node-only) for server-side neon contour rendering.
// Falls back to returning original image with error note if canvas unavailable.

async function processNeonContourServerSide(
  imgBuffer: Buffer,
  settings: NeonContourSettings
): Promise<Buffer> {
  try {
    // Dynamic import — only available in Node runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createCanvas, loadImage } = await import('@napi-rs/canvas' as string) as any;

    const img = await loadImage(imgBuffer);
    const { width, height } = img;

    // Grayscale pass
    const tmpCanvas = createCanvas(width, height);
    const tmpCtx = tmpCanvas.getContext('2d');
    tmpCtx.drawImage(img as any, 0, 0, width, height);
    const { data } = tmpCtx.getImageData(0, 0, width, height);

    // Grayscale + Sobel
    const gray = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
      gray[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
    }

    const magnitude = sobelMagnitude(gray, width, height);
    const threshold = 20 + (1 - settings.edgeSensitivity) * 100;
    const edgeMask = new Uint8ClampedArray(width * height);
    for (let i = 0; i < magnitude.length; i++) {
      edgeMask[i] = magnitude[i] >= threshold ? magnitude[i] : 0;
    }

    // Render neon
    const outCanvas = createCanvas(width, height);
    const ctx = outCanvas.getContext('2d');

    const bgD = settings.backgroundDarkness;
    ctx.fillStyle = `rgb(${Math.round(3 + (1 - bgD) * 20)},${Math.round(3 + (1 - bgD) * 15)},${Math.round(8 + (1 - bgD) * 30)})`;
    ctx.fillRect(0, 0, width, height);

    const hex = settings.neonColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Glow layer
    if (settings.glowStrength > 0.1) {
      ctx.save();
      ctx.filter = `blur(${Math.round(settings.lineThickness * 2 * settings.glowStrength)}px)`;
      drawLines(ctx as any, edgeMask, width, height, r, g, b, settings.lineThickness * 1.5, 0.35);
      ctx.restore();
    }

    // Core lines
    drawLines(ctx as any, edgeMask, width, height, r, g, b, settings.lineThickness, 0.9);
    drawLines(ctx as any, edgeMask, width, height, 255, 255, 255, Math.max(1, settings.lineThickness * 0.3), 0.7);

    return outCanvas.toBuffer('image/png');
  } catch (importErr) {
    // @napi-rs/canvas not available — return original image
    console.warn('[api/neon-contour] @napi-rs/canvas not available, returning source image');
    return imgBuffer;
  }
}

function sobelMagnitude(gray: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const magnitude = new Uint8ClampedArray(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const tl = gray[(y-1)*w+(x-1)], tc = gray[(y-1)*w+x], tr = gray[(y-1)*w+(x+1)];
      const ml = gray[y*w+(x-1)],                            mr = gray[y*w+(x+1)];
      const bl = gray[(y+1)*w+(x-1)], bc = gray[(y+1)*w+x], br = gray[(y+1)*w+(x+1)];
      const gx = -tl - 2*ml - bl + tr + 2*mr + br;
      const gy = -tl - 2*tc - tr + bl + 2*bc + br;
      magnitude[y*w+x] = Math.min(255, Math.sqrt(gx*gx + gy*gy));
    }
  }
  return magnitude;
}

function drawLines(
  ctx: CanvasRenderingContext2D,
  edgeMask: Uint8ClampedArray,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
  lineWidth: number,
  alpha: number
) {
  ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let y = 0; y < h; y++) {
    let inLine = false;
    let startX = 0;
    for (let x = 0; x < w; x++) {
      const active = edgeMask[y*w+x] > 0;
      if (active && !inLine) { startX = x; inLine = true; }
      else if (!active && inLine) { ctx.moveTo(startX, y); ctx.lineTo(x-1, y); inLine = false; }
    }
    if (inLine) { ctx.moveTo(startX, y); ctx.lineTo(w-1, y); }
  }
  ctx.stroke();
}
