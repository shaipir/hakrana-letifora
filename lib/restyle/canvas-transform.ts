/**
 * World Transform Engine v2 — Structural Re-creation
 *
 * Extracts the structural skeleton of the image, then repaints the content
 * using world-appropriate procedural textures. The result preserves silhouette
 * and composition but completely reinvents the visual content.
 */

import { RestyleSettings, StyleWorld, WorldPreset } from '../types';

interface RGB { r: number; g: number; b: number }

interface WorldConfig {
  // Color zones mapped from dark→mid→bright luminance
  darkColor: RGB;
  midColor: RGB;
  brightColor: RGB;
  accentColor: RGB;   // edge lines / highlights

  // Texture parameters
  noiseScale1: number;  // large-scale structure noise
  noiseScale2: number;  // fine detail noise
  noiseMix: number;     // how much noise affects color (0–1)

  // Atmosphere
  glowColor: RGB;
  glowRadius: number;
  glowStrength: number;
  vignetteColor: RGB;
  vignetteStrength: number;
  atmosphereColor: RGB;
  atmosphereStrength: number;

  // Style
  edgeStrength: number;    // how visible structural edges are
  contrastPower: number;   // contrast S-curve power
  saturation: number;      // output saturation mult
}

// Keep StyleWorld for canvas configs (includes legacy visual language worlds)
const W_CONFIGS: Record<StyleWorld, WorldConfig> = {
  forest: {
    darkColor:   { r: 8,   g: 25,  b: 5   },
    midColor:    { r: 40,  g: 100, b: 20  },
    brightColor: { r: 120, g: 200, b: 50  },
    accentColor: { r: 180, g: 255, b: 80  },
    noiseScale1: 0.015, noiseScale2: 0.06, noiseMix: 0.55,
    glowColor: { r: 80, g: 220, b: 40 }, glowRadius: 18, glowStrength: 0.3,
    vignetteColor: { r: 0, g: 20, b: 0 }, vignetteStrength: 0.6,
    atmosphereColor: { r: 30, g: 80, b: 10 }, atmosphereStrength: 0.2,
    edgeStrength: 0.9, contrastPower: 1.4, saturation: 1.5,
  },
  sea: {
    darkColor:   { r: 0,   g: 15,  b: 60  },
    midColor:    { r: 0,   g: 80,  b: 160 },
    brightColor: { r: 0,   g: 200, b: 220 },
    accentColor: { r: 140, g: 255, b: 255 },
    noiseScale1: 0.01, noiseScale2: 0.04, noiseMix: 0.5,
    glowColor: { r: 0, g: 180, b: 255 }, glowRadius: 22, glowStrength: 0.35,
    vignetteColor: { r: 0, g: 0, b: 40 }, vignetteStrength: 0.5,
    atmosphereColor: { r: 0, g: 40, b: 100 }, atmosphereStrength: 0.25,
    edgeStrength: 0.85, contrastPower: 1.1, saturation: 1.6,
  },
  fire: {
    darkColor:   { r: 10,  g: 0,   b: 0   },
    midColor:    { r: 200, g: 30,  b: 0   },
    brightColor: { r: 255, g: 180, b: 0   },
    accentColor: { r: 255, g: 255, b: 180 },
    noiseScale1: 0.02, noiseScale2: 0.08, noiseMix: 0.65,
    glowColor: { r: 255, g: 80, b: 0 }, glowRadius: 20, glowStrength: 0.5,
    vignetteColor: { r: 40, g: 0, b: 0 }, vignetteStrength: 0.65,
    atmosphereColor: { r: 180, g: 30, b: 0 }, atmosphereStrength: 0.3,
    edgeStrength: 0.95, contrastPower: 1.8, saturation: 2.0,
  },
  spirit: {
    darkColor:   { r: 5,   g: 5,   b: 20  },
    midColor:    { r: 80,  g: 80,  b: 160 },
    brightColor: { r: 200, g: 200, b: 255 },
    accentColor: { r: 240, g: 240, b: 255 },
    noiseScale1: 0.008, noiseScale2: 0.03, noiseMix: 0.35,
    glowColor: { r: 160, g: 180, b: 255 }, glowRadius: 28, glowStrength: 0.55,
    vignetteColor: { r: 0, g: 0, b: 30 }, vignetteStrength: 0.6,
    atmosphereColor: { r: 80, g: 80, b: 180 }, atmosphereStrength: 0.35,
    edgeStrength: 0.6, contrastPower: 0.7, saturation: 0.5,
  },
  cartoon: {
    darkColor:   { r: 20,  g: 20,  b: 50  },
    midColor:    { r: 60,  g: 140, b: 240 },
    brightColor: { r: 255, g: 220, b: 60  },
    accentColor: { r: 0,   g: 0,   b: 0   },
    noiseScale1: 0.0, noiseScale2: 0.0, noiseMix: 0.0,
    glowColor: { r: 255, g: 255, b: 100 }, glowRadius: 8, glowStrength: 0.1,
    vignetteColor: { r: 0, g: 0, b: 0 }, vignetteStrength: 0.2,
    atmosphereColor: { r: 40, g: 40, b: 80 }, atmosphereStrength: 0.1,
    edgeStrength: 1.0, contrastPower: 2.5, saturation: 2.8,
  },
  ice: {
    darkColor:   { r: 100, g: 160, b: 220 },
    midColor:    { r: 180, g: 220, b: 255 },
    brightColor: { r: 230, g: 248, b: 255 },
    accentColor: { r: 255, g: 255, b: 255 },
    noiseScale1: 0.025, noiseScale2: 0.1, noiseMix: 0.4,
    glowColor: { r: 180, g: 230, b: 255 }, glowRadius: 16, glowStrength: 0.4,
    vignetteColor: { r: 60, g: 100, b: 160 }, vignetteStrength: 0.35,
    atmosphereColor: { r: 160, g: 210, b: 255 }, atmosphereStrength: 0.3,
    edgeStrength: 0.8, contrastPower: 1.2, saturation: 0.6,
  },
  crystal: {
    darkColor:   { r: 40,  g: 0,   b: 80  },
    midColor:    { r: 160, g: 60,  b: 255 },
    brightColor: { r: 255, g: 200, b: 255 },
    accentColor: { r: 255, g: 255, b: 255 },
    noiseScale1: 0.03, noiseScale2: 0.12, noiseMix: 0.6,
    glowColor: { r: 200, g: 160, b: 255 }, glowRadius: 18, glowStrength: 0.45,
    vignetteColor: { r: 20, g: 0, b: 60 }, vignetteStrength: 0.4,
    atmosphereColor: { r: 160, g: 100, b: 255 }, atmosphereStrength: 0.25,
    edgeStrength: 0.9, contrastPower: 1.5, saturation: 2.2,
  },
  shadow: {
    darkColor:   { r: 2,   g: 0,   b: 10  },
    midColor:    { r: 40,  g: 0,   b: 80  },
    brightColor: { r: 160, g: 80,  b: 255 },
    accentColor: { r: 200, g: 160, b: 255 },
    noiseScale1: 0.012, noiseScale2: 0.05, noiseMix: 0.45,
    glowColor: { r: 140, g: 40, b: 255 }, glowRadius: 20, glowStrength: 0.4,
    vignetteColor: { r: 0, g: 0, b: 20 }, vignetteStrength: 0.85,
    atmosphereColor: { r: 20, g: 0, b: 50 }, atmosphereStrength: 0.4,
    edgeStrength: 0.95, contrastPower: 2.5, saturation: 1.3,
  },
  floral: {
    darkColor:   { r: 80,  g: 30,  b: 80  },
    midColor:    { r: 255, g: 130, b: 180 },
    brightColor: { r: 255, g: 220, b: 240 },
    accentColor: { r: 255, g: 255, b: 200 },
    noiseScale1: 0.018, noiseScale2: 0.07, noiseMix: 0.5,
    glowColor: { r: 255, g: 180, b: 220 }, glowRadius: 20, glowStrength: 0.35,
    vignetteColor: { r: 60, g: 0, b: 60 }, vignetteStrength: 0.25,
    atmosphereColor: { r: 255, g: 180, b: 220 }, atmosphereStrength: 0.2,
    edgeStrength: 0.75, contrastPower: 0.9, saturation: 1.9,
  },
  machine: {
    darkColor:   { r: 5,   g: 15,  b: 5   },
    midColor:    { r: 0,   g: 100, b: 40  },
    brightColor: { r: 0,   g: 220, b: 80  },
    accentColor: { r: 180, g: 255, b: 120 },
    noiseScale1: 0.04, noiseScale2: 0.16, noiseMix: 0.3,
    glowColor: { r: 0, g: 255, b: 80 }, glowRadius: 12, glowStrength: 0.3,
    vignetteColor: { r: 0, g: 20, b: 0 }, vignetteStrength: 0.55,
    atmosphereColor: { r: 0, g: 60, b: 20 }, atmosphereStrength: 0.2,
    edgeStrength: 1.0, contrastPower: 2.0, saturation: 0.4,
  },
  'bioluminescent': {
    darkColor:   { r: 0,   g: 0,   b: 20  },
    midColor:    { r: 0,   g: 80,  b: 160 },
    brightColor: { r: 0,   g: 255, b: 200 },
    accentColor: { r: 180, g: 255, b: 255 },
    noiseScale1: 0.008, noiseScale2: 0.04, noiseMix: 0.7,
    glowColor: { r: 0, g: 220, b: 255 }, glowRadius: 28, glowStrength: 0.6,
    vignetteColor: { r: 0, g: 0, b: 0 }, vignetteStrength: 0.8,
    atmosphereColor: { r: 0, g: 80, b: 120 }, atmosphereStrength: 0.3,
    edgeStrength: 1.0, contrastPower: 1.6, saturation: 2.0,
  },
  'sacred-geometry': {
    darkColor:   { r: 0,   g: 0,   b: 0   },
    midColor:    { r: 0,   g: 120, b: 160 },
    brightColor: { r: 0,   g: 240, b: 255 },
    accentColor: { r: 255, g: 100, b: 255 },
    noiseScale1: 0.03, noiseScale2: 0.09, noiseMix: 0.2,
    glowColor: { r: 0, g: 200, b: 255 }, glowRadius: 16, glowStrength: 0.45,
    vignetteColor: { r: 0, g: 0, b: 0 }, vignetteStrength: 0.75,
    atmosphereColor: { r: 0, g: 60, b: 100 }, atmosphereStrength: 0.2,
    edgeStrength: 1.0, contrastPower: 2.2, saturation: 1.8,
  },
  'kaleidoscopic': {
    darkColor:   { r: 20,  g: 0,   b: 0   },
    midColor:    { r: 180, g: 60,  b: 0   },
    brightColor: { r: 255, g: 200, b: 50  },
    accentColor: { r: 255, g: 255, b: 180 },
    noiseScale1: 0.02, noiseScale2: 0.08, noiseMix: 0.5,
    glowColor: { r: 255, g: 160, b: 0 }, glowRadius: 14, glowStrength: 0.35,
    vignetteColor: { r: 10, g: 0, b: 20 }, vignetteStrength: 0.65,
    atmosphereColor: { r: 120, g: 40, b: 0 }, atmosphereStrength: 0.25,
    edgeStrength: 0.9, contrastPower: 1.8, saturation: 2.5,
  },
  'deep-dream': {
    darkColor:   { r: 5,   g: 0,   b: 15  },
    midColor:    { r: 80,  g: 20,  b: 120 },
    brightColor: { r: 220, g: 100, b: 255 },
    accentColor: { r: 255, g: 220, b: 100 },
    noiseScale1: 0.025, noiseScale2: 0.1, noiseMix: 0.75,
    glowColor: { r: 200, g: 80, b: 255 }, glowRadius: 18, glowStrength: 0.4,
    vignetteColor: { r: 0, g: 0, b: 20 }, vignetteStrength: 0.6,
    atmosphereColor: { r: 80, g: 20, b: 120 }, atmosphereStrength: 0.35,
    edgeStrength: 0.85, contrastPower: 1.5, saturation: 2.2,
  },
  'visionary': {
    darkColor:   { r: 0,   g: 5,   b: 30  },
    midColor:    { r: 40,  g: 40,  b: 180 },
    brightColor: { r: 200, g: 180, b: 80  },
    accentColor: { r: 255, g: 230, b: 120 },
    noiseScale1: 0.01, noiseScale2: 0.05, noiseMix: 0.45,
    glowColor: { r: 200, g: 160, b: 80 }, glowRadius: 22, glowStrength: 0.45,
    vignetteColor: { r: 0, g: 0, b: 30 }, vignetteStrength: 0.65,
    atmosphereColor: { r: 40, g: 40, b: 140 }, atmosphereStrength: 0.3,
    edgeStrength: 0.9, contrastPower: 1.4, saturation: 1.7,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function canvasRestyle(
  imageUrl: string,
  settings: RestyleSettings
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try { resolve(worldTransform(img, settings)); }
      catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

// ─── Core Transform ───────────────────────────────────────────────────────────

function worldTransform(img: HTMLImageElement, settings: RestyleSettings): string {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  // Map new worldPreset to StyleWorld for canvas config lookup
  const styleWorldKey: StyleWorld | null = settings.worldPreset as StyleWorld | null;
  const cfg = styleWorldKey ? W_CONFIGS[styleWorldKey] ?? W_CONFIGS.forest : W_CONFIGS.forest;

  const transformStr  = settings.transformStrength;
  const matStr        = settings.redesignMaterials;
  const envStr        = settings.redesignEnvironment;
  const charStr       = 1 - settings.identityPreservation; // rebuild characters = less preservation
  const preserveStr   = settings.preserveStructure;
  const fantasy       = settings.fantasyStrength;
  const atmosphere    = settings.atmosphereStrength;

  // ── Read source pixels ───────────────────────────────────────────────────
  const readCv = mc(W, H); readCv.ctx.drawImage(img, 0, 0);
  const src = readCv.ctx.getImageData(0, 0, W, H).data;

  // ── Compute luminance + edge map ─────────────────────────────────────────
  const lumMap  = new Float32Array(W * H);
  const edgeMap = new Float32Array(W * H);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      lumMap[y * W + x] = lum(src[i], src[i+1], src[i+2]);
    }
  }

  // Sobel edge detection
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const gx =
        -lumMap[(y-1)*W+(x-1)] + lumMap[(y-1)*W+(x+1)]
        -2*lumMap[y*W+(x-1)]   + 2*lumMap[y*W+(x+1)]
        -lumMap[(y+1)*W+(x-1)] + lumMap[(y+1)*W+(x+1)];
      const gy =
        -lumMap[(y-1)*W+(x-1)] -2*lumMap[(y-1)*W+x] -lumMap[(y-1)*W+(x+1)]
        +lumMap[(y+1)*W+(x-1)] +2*lumMap[(y+1)*W+x] +lumMap[(y+1)*W+(x+1)];
      edgeMap[y * W + x] = Math.min(1, Math.sqrt(gx*gx + gy*gy) * 2.5);
    }
  }

  // Normalize luminance
  let minL = 1, maxL = 0;
  for (let i = 0; i < lumMap.length; i++) {
    if (lumMap[i] < minL) minL = lumMap[i];
    if (lumMap[i] > maxL) maxL = lumMap[i];
  }
  const lRange = maxL - minL || 1;

  // ── Build output pixels ──────────────────────────────────────────────────
  const outCv = mc(W, H);
  const outData = outCv.ctx.createImageData(W, H);
  const d = outData.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      const i = idx * 4;

      const rawL  = lumMap[idx];
      const normL = (rawL - minL) / lRange;
      const edge  = edgeMap[idx];

      // ── 1. World color from luminance zone ─────────────────────────────
      const worldColor = triLerp(
        cfg.darkColor, cfg.midColor, cfg.brightColor,
        sCurve(normL, cfg.contrastPower)
      );

      // ── 2. Add position-based procedural noise ─────────────────────────
      let noised = { ...worldColor };
      if (cfg.noiseScale1 > 0) {
        const n1 = valueNoise(x * cfg.noiseScale1, y * cfg.noiseScale1, 0);
        const n2 = valueNoise(x * cfg.noiseScale2, y * cfg.noiseScale2, 42);
        const n  = n1 * 0.6 + n2 * 0.4;
        // modulate towards accent on bright noise, dark on low noise
        const nColor = n > 0.5 ? cfg.accentColor : cfg.darkColor;
        const nMix = Math.abs(n - 0.5) * 2 * cfg.noiseMix * matStr * fantasy;
        noised = lerpRGB(noised, nColor, nMix);
      }

      // ── 3. Edge overlay — structural skeleton in accent color ──────────
      const edgeMix = edge * cfg.edgeStrength * preserveStr;
      const edgeColor = lerpRGB(noised, cfg.accentColor, edgeMix);

      // ── 4. Apply transform strength + blend back original ──────────────
      const origR = src[i], origG = src[i+1], origB = src[i+2];

      // Environment pixels (low-lum areas near edge): full world replacement
      // Subject pixels (high-lum core): more preserving of structure
      const isSubject = normL > 0.3;
      const blendBack = isSubject
        ? (1 - transformStr) * (1 - charStr * 0.5) * preserveStr
        : (1 - transformStr) * (1 - envStr * 0.8);

      const fr = lerp(edgeColor.r, origR, clamp01(blendBack));
      const fg = lerp(edgeColor.g, origG, clamp01(blendBack));
      const fb = lerp(edgeColor.b, origB, clamp01(blendBack));

      // ── 5. Saturation boost ────────────────────────────────────────────
      const [h, s, v] = rgbToHsv(fr, fg, fb);
      const [sr, sg, sb] = hsvToRgb(h, Math.min(1, s * cfg.saturation), v);

      d[i]   = clamp(sr);
      d[i+1] = clamp(sg);
      d[i+2] = clamp(sb);
      d[i+3] = src[i+3];
    }
  }

  outCv.ctx.putImageData(outData, 0, 0);

  // ── Kaleidoscopic: 4-fold mirror symmetry ──────────────────────────────
  if ((settings as any).styleWorld === 'kaleidoscopic') {
    const mirrorCv = mc(W, H);
    // top-left quadrant → mirror to all 4 quadrants
    const hw = Math.floor(W/2), hh = Math.floor(H/2);
    // top-left
    mirrorCv.ctx.drawImage(outCv.canvas, 0, 0, hw, hh, 0, 0, hw, hh);
    // top-right (flip horizontal)
    mirrorCv.ctx.save();
    mirrorCv.ctx.translate(W, 0); mirrorCv.ctx.scale(-1, 1);
    mirrorCv.ctx.drawImage(outCv.canvas, 0, 0, hw, hh, 0, 0, hw, hh);
    mirrorCv.ctx.restore();
    // bottom-left (flip vertical)
    mirrorCv.ctx.save();
    mirrorCv.ctx.translate(0, H); mirrorCv.ctx.scale(1, -1);
    mirrorCv.ctx.drawImage(outCv.canvas, 0, 0, hw, hh, 0, 0, hw, hh);
    mirrorCv.ctx.restore();
    // bottom-right (flip both)
    mirrorCv.ctx.save();
    mirrorCv.ctx.translate(W, H); mirrorCv.ctx.scale(-1, -1);
    mirrorCv.ctx.drawImage(outCv.canvas, 0, 0, hw, hh, 0, 0, hw, hh);
    mirrorCv.ctx.restore();
    // blend mirror back with original transform
    outCv.ctx.globalAlpha = 0.7;
    outCv.ctx.drawImage(mirrorCv.canvas, 0, 0);
    outCv.ctx.globalAlpha = 1;
  }

  // ── Post-processing passes ───────────────────────────────────────────────

  // Bloom glow
  if (atmosphere > 0.1 && cfg.glowStrength > 0) {
    const bloomCv = mc(W, H);
    bloomCv.ctx.filter = `blur(${Math.round(cfg.glowRadius * atmosphere)}px)`;
    bloomCv.ctx.drawImage(outCv.canvas, 0, 0);
    outCv.ctx.globalCompositeOperation = 'screen';
    outCv.ctx.globalAlpha = cfg.glowStrength * atmosphere;
    outCv.ctx.drawImage(bloomCv.canvas, 0, 0);
    outCv.ctx.globalCompositeOperation = 'source-over';
    outCv.ctx.globalAlpha = 1;
  }

  // Atmosphere color overlay
  if (atmosphere > 0.1 && cfg.atmosphereStrength > 0) {
    const { r, g, b } = cfg.atmosphereColor;
    outCv.ctx.globalCompositeOperation = 'overlay';
    outCv.ctx.globalAlpha = cfg.atmosphereStrength * atmosphere * transformStr * 0.4;
    outCv.ctx.fillStyle = `rgb(${r},${g},${b})`;
    outCv.ctx.fillRect(0, 0, W, H);
    outCv.ctx.globalCompositeOperation = 'source-over';
    outCv.ctx.globalAlpha = 1;
  }

  // Vignette
  if (cfg.vignetteStrength > 0) {
    const { r, g, b } = cfg.vignetteColor;
    const vign = outCv.ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.3, W/2, H/2, Math.max(W,H)*0.85);
    vign.addColorStop(0, 'rgba(0,0,0,0)');
    vign.addColorStop(1, `rgba(${r},${g},${b},${cfg.vignetteStrength * atmosphere})`);
    outCv.ctx.globalCompositeOperation = 'multiply';
    outCv.ctx.fillStyle = vign;
    outCv.ctx.fillRect(0, 0, W, H);
    outCv.ctx.globalCompositeOperation = 'source-over';
  }

  return outCv.canvas.toDataURL('image/jpeg', 0.94);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mc(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d')! };
}

function lum(r: number, g: number, b: number) {
  return 0.299*r/255 + 0.587*g/255 + 0.114*b/255;
}

function sCurve(x: number, power: number): number {
  const t = Math.max(0, Math.min(1, x));
  if (t < 0.5) return 0.5 * Math.pow(2*t, power);
  return 1 - 0.5 * Math.pow(2*(1-t), power);
}

function triLerp(a: RGB, b: RGB, c: RGB, t: number): RGB {
  if (t < 0.5) {
    const u = t * 2;
    return { r: lerp(a.r,b.r,u), g: lerp(a.g,b.g,u), b: lerp(a.b,b.b,u) };
  }
  const u = (t - 0.5) * 2;
  return { r: lerp(b.r,c.r,u), g: lerp(b.g,c.g,u), b: lerp(b.b,c.b,u) };
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return { r: lerp(a.r,b.r,t), g: lerp(a.g,b.g,t), b: lerp(a.b,b.b,t) };
}

function lerp(a: number, b: number, t: number) { return a + (b-a)*t; }
function clamp(v: number) { return Math.min(255, Math.max(0, Math.round(v))); }
function clamp01(v: number) { return Math.min(1, Math.max(0, v)); }

// Simple value noise — deterministic per pixel position
function valueNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx*fx*(3-2*fx), v = fy*fy*(3-2*fy);
  const a = hash(ix,   iy,   seed);
  const b = hash(ix+1, iy,   seed);
  const c2 = hash(ix,   iy+1, seed);
  const dd = hash(ix+1, iy+1, seed);
  return lerp(lerp(a,b,u), lerp(c2,dd,u), v);
}

function hash(x: number, y: number, seed: number): number {
  const n = Math.sin(x*127.1 + y*311.7 + seed*74.3) * 43758.5453;
  return n - Math.floor(n);
}

function rgbToHsv(r: number, g: number, b: number): [number,number,number] {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0;
  const s=max===0?0:d/max, v=max;
  if(d!==0){
    if(max===r) h=((g-b)/d%6)/6;
    else if(max===g) h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6;
    if(h<0) h+=1;
  }
  return [h,s,v];
}

function hsvToRgb(h: number, s: number, v: number): [number,number,number] {
  const i=Math.floor(h*6), f=h*6-i, p=v*(1-s), q=v*(1-f*s), t=v*(1-(1-f)*s);
  let r=0,g=0,b=0;
  switch(i%6){
    case 0:r=v;g=t;b=p;break; case 1:r=q;g=v;b=p;break;
    case 2:r=p;g=v;b=t;break; case 3:r=p;g=q;b=v;break;
    case 4:r=t;g=p;b=v;break; case 5:r=v;g=p;b=q;break;
  }
  return [r*255,g*255,b*255];
}
