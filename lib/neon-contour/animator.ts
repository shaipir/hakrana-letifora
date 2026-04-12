/**
 * Neon Contour Animator
 *
 * Drives three animation modes on top of the processed edge mask:
 *   flow     — dash offset scrolls along edges in flowDirection
 *   pulse    — overall opacity/glow breathes in and out
 *   electric — rapid random flicker + brief bright flash segments
 */

import { NeonContourSettings } from '../types';
import { renderNeon } from './pipeline';

export type AnimationHandle = { stop: () => void };

interface AnimatorOptions {
  canvas: HTMLCanvasElement;
  edgeMask: Uint8ClampedArray;
  width: number;
  height: number;
  settings: NeonContourSettings;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function startAnimation(opts: AnimatorOptions): AnimationHandle {
  const { canvas, edgeMask, width, height, settings } = opts;
  const ctx = canvas.getContext('2d')!;

  let rafId: number;
  let stopped = false;
  let startTime = performance.now();

  function tick(now: number) {
    if (stopped) return;
    const elapsed = (now - startTime) / 1000; // seconds

    switch (settings.animationMode) {
      case 'flow':    renderFlow(ctx, edgeMask, width, height, settings, elapsed);    break;
      case 'pulse':   renderPulse(ctx, edgeMask, width, height, settings, elapsed);   break;
      case 'electric': renderElectric(ctx, edgeMask, width, height, settings, elapsed); break;
    }

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);
  return { stop: () => { stopped = true; cancelAnimationFrame(rafId); } };
}

// ─── Flow Mode ───────────────────────────────────────────────────────────────

function renderFlow(
  ctx: CanvasRenderingContext2D,
  edgeMask: Uint8ClampedArray,
  w: number,
  h: number,
  settings: NeonContourSettings,
  elapsed: number
) {
  const speed = settings.speed * 120; // pixels/sec at max speed
  const dashOffset = (elapsed * speed) % 200;

  const frame = renderNeon(edgeMask, edgeMask, w, h, settings, dashOffset);
  ctx.putImageData(frame, 0, 0);
}

// ─── Pulse Mode ──────────────────────────────────────────────────────────────

function renderPulse(
  ctx: CanvasRenderingContext2D,
  edgeMask: Uint8ClampedArray,
  w: number,
  h: number,
  settings: NeonContourSettings,
  elapsed: number
) {
  const freq = 0.4 + settings.speed * 1.2; // Hz
  const pulseAlpha = 0.5 + 0.5 * Math.sin(elapsed * freq * Math.PI * 2);

  // Render base frame then apply global composite alpha
  const frame = renderNeon(edgeMask, edgeMask, w, h, settings, 0);

  // Write to offscreen, composite with opacity
  const offscreen = new OffscreenCanvas(w, h);
  const octx = offscreen.getContext('2d')!;
  octx.putImageData(frame, 0, 0);

  // Draw background
  const bgAlpha = settings.backgroundDarkness;
  ctx.fillStyle = `rgb(${Math.round(3 + (1 - bgAlpha) * 20)},${Math.round(3 + (1 - bgAlpha) * 15)},${Math.round(8 + (1 - bgAlpha) * 30)})`;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.6 + 0.4 * pulseAlpha;
  ctx.drawImage(offscreen, 0, 0);
  ctx.globalAlpha = 1;
}

// ─── Electric Mode ───────────────────────────────────────────────────────────

function renderElectric(
  ctx: CanvasRenderingContext2D,
  edgeMask: Uint8ClampedArray,
  w: number,
  h: number,
  settings: NeonContourSettings,
  elapsed: number
) {
  const freq = 8 + settings.speed * 20; // Hz — fast flicker
  const t = elapsed * freq;

  // Random-ish flicker using sine harmonics (deterministic, no random seed needed)
  const flicker = 0.5 + 0.5 * Math.sin(t * 1.3) * Math.sin(t * 0.7 + 1) * Math.sin(t * 2.1 + 2);

  // Override glowStrength temporarily
  const modifiedSettings: NeonContourSettings = {
    ...settings,
    glowStrength: settings.glowStrength * (0.4 + 0.6 * flicker),
  };

  const dashOffset = flicker > 0.7 ? (elapsed * 200) % 200 : 0;
  const frame = renderNeon(edgeMask, edgeMask, w, h, modifiedSettings, dashOffset);
  ctx.putImageData(frame, 0, 0);
}
