/**
 * World Transform Engine — client-side canvas restyle
 * Multi-pass pixel transformation that makes images feel like a different world.
 */

import { RestyleSettings, StyleWorld } from '../types';

interface RGB { r: number; g: number; b: number }
interface WorldConfig {
  palette: RGB[];           // color palette for this world
  colorShift: number;       // hue rotation in degrees (-180 to 180)
  saturationMult: number;   // multiply saturation
  contrastBoost: number;    // 0–2 contrast curve strength
  darknessPush: number;     // push darks darker (0–1)
  brightnessPush: number;   // push lights brighter (0–1)
  glowColor: RGB;           // bloom/glow color
  glowStrength: number;     // bloom opacity
  atmosphereColor: RGB;     // atmospheric fog/haze color
  vignetteStrength: number; // vignette darkness
  posterize?: number;       // if set, posterize to N levels
  channelSplit?: number;    // chromatic aberration pixels
  noiseAmount?: number;     // grain 0–1
}

const WORLD_CONFIGS: Record<StyleWorld, WorldConfig> = {
  forest: {
    palette: [{ r:20,g:50,b:10 }, { r:60,g:120,b:30 }, { r:140,g:180,b:60 }, { r:200,g:160,b:80 }],
    colorShift: 30, saturationMult: 1.4, contrastBoost: 1.1,
    darknessPush: 0.3, brightnessPush: 0,
    glowColor: { r:80,g:200,b:60 }, glowStrength: 0.25,
    atmosphereColor: { r:60,g:120,b:40 }, vignetteStrength: 0.5,
    noiseAmount: 0.08,
  },
  sea: {
    palette: [{ r:0,g:30,b:80 }, { r:0,g:80,b:160 }, { r:0,g:180,b:200 }, { r:160,g:240,b:255 }],
    colorShift: 195, saturationMult: 1.5, contrastBoost: 0.9,
    darknessPush: 0.2, brightnessPush: 0.1,
    glowColor: { r:0,g:200,b:255 }, glowStrength: 0.3,
    atmosphereColor: { r:0,g:60,b:120 }, vignetteStrength: 0.4,
    noiseAmount: 0.04,
  },
  fire: {
    palette: [{ r:20,g:0,b:0 }, { r:180,g:30,b:0 }, { r:255,g:120,b:0 }, { r:255,g:240,b:100 }],
    colorShift: -30, saturationMult: 2.0, contrastBoost: 1.6,
    darknessPush: 0.5, brightnessPush: 0.2,
    glowColor: { r:255,g:100,b:0 }, glowStrength: 0.45,
    atmosphereColor: { r:180,g:40,b:0 }, vignetteStrength: 0.6,
    noiseAmount: 0.06,
  },
  spirit: {
    palette: [{ r:10,g:10,b:30 }, { r:80,g:80,b:140 }, { r:160,g:160,b:220 }, { r:240,g:240,b:255 }],
    colorShift: 210, saturationMult: 0.4, contrastBoost: 0.7,
    darknessPush: 0.15, brightnessPush: 0.3,
    glowColor: { r:180,g:200,b:255 }, glowStrength: 0.5,
    atmosphereColor: { r:100,g:100,b:180 }, vignetteStrength: 0.55,
    channelSplit: 4, noiseAmount: 0.12,
  },
  cartoon: {
    palette: [{ r:20,g:20,b:60 }, { r:60,g:120,b:220 }, { r:255,g:200,b:0 }, { r:255,g:80,b:60 }],
    colorShift: 0, saturationMult: 2.5, contrastBoost: 2.0,
    darknessPush: 0.4, brightnessPush: 0.2,
    glowColor: { r:255,g:255,b:100 }, glowStrength: 0.1,
    atmosphereColor: { r:40,g:40,b:80 }, vignetteStrength: 0.3,
    posterize: 5,
  },
  ice: {
    palette: [{ r:180,g:220,b:255 }, { r:200,g:240,b:255 }, { r:220,g:250,b:255 }, { r:255,g:255,b:255 }],
    colorShift: 200, saturationMult: 0.6, contrastBoost: 1.2,
    darknessPush: 0, brightnessPush: 0.4,
    glowColor: { r:180,g:230,b:255 }, glowStrength: 0.35,
    atmosphereColor: { r:160,g:210,b:255 }, vignetteStrength: 0.3,
    channelSplit: 2,
  },
  crystal: {
    palette: [{ r:255,g:100,b:200 }, { r:100,g:200,b:255 }, { r:200,g:255,b:150 }, { r:255,g:230,b:100 }],
    colorShift: 0, saturationMult: 2.2, contrastBoost: 1.4,
    darknessPush: 0.2, brightnessPush: 0.3,
    glowColor: { r:200,g:180,b:255 }, glowStrength: 0.4,
    atmosphereColor: { r:180,g:140,b:255 }, vignetteStrength: 0.35,
    channelSplit: 6,
  },
  shadow: {
    palette: [{ r:5,g:0,b:20 }, { r:40,g:0,b:80 }, { r:100,g:40,b:160 }, { r:200,g:160,b:255 }],
    colorShift: 260, saturationMult: 1.2, contrastBoost: 2.2,
    darknessPush: 0.7, brightnessPush: 0,
    glowColor: { r:150,g:50,b:255 }, glowStrength: 0.4,
    atmosphereColor: { r:30,g:0,b:60 }, vignetteStrength: 0.75,
    noiseAmount: 0.05,
  },
  floral: {
    palette: [{ r:255,g:160,b:200 }, { r:255,g:120,b:180 }, { r:200,g:240,b:160 }, { r:255,g:230,b:200 }],
    colorShift: 320, saturationMult: 1.8, contrastBoost: 0.8,
    darknessPush: 0, brightnessPush: 0.3,
    glowColor: { r:255,g:180,b:220 }, glowStrength: 0.35,
    atmosphereColor: { r:255,g:200,b:230 }, vignetteStrength: 0.2,
    noiseAmount: 0.03,
  },
  machine: {
    palette: [{ r:10,g:20,b:10 }, { r:0,g:80,b:40 }, { r:0,g:180,b:80 }, { r:180,g:200,b:100 }],
    colorShift: 100, saturationMult: 0.3, contrastBoost: 1.8,
    darknessPush: 0.4, brightnessPush: 0.1,
    glowColor: { r:0,g:255,b:100 }, glowStrength: 0.3,
    atmosphereColor: { r:0,g:60,b:20 }, vignetteStrength: 0.5,
    noiseAmount: 0.07,
  },
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
        resolve(applyWorldTransform(img, settings));
      } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

function applyWorldTransform(img: HTMLImageElement, settings: RestyleSettings): string {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const cfg = settings.styleWorld ? WORLD_CONFIGS[settings.styleWorld] : null;

  // ── Layer 0: source canvas ────────────────────────────────────────────
  const src = makeCanvas(W, H);
  src.ctx.drawImage(img, 0, 0);
  const srcData = src.ctx.getImageData(0, 0, W, H);

  // ── Layer 1: base transform canvas ────────────────────────────────────
  const base = makeCanvas(W, H);
  const baseData = base.ctx.createImageData(W, H);
  const s = srcData.data;
  const d = baseData.data;

  const strength = settings.transformStrength;
  const matStr = settings.materialTransformationStrength;
  const preserve = settings.preserveSubject;
  const stylize = settings.realismVsStylization;

  // Normalize luminance for contrast
  let minL = 1, maxL = 0;
  for (let i = 0; i < s.length; i += 4) {
    const l = lum(s[i], s[i+1], s[i+2]);
    if (l < minL) minL = l;
    if (l > maxL) maxL = l;
  }
  const lRange = maxL - minL || 1;

  for (let i = 0; i < s.length; i += 4) {
    let r = s[i], g = s[i+1], b = s[i+2];
    const a = s[i+3];
    const l = (lum(s[i], s[i+1], s[i+2]) - minL) / lRange;

    if (cfg) {
      // 1. Hue rotation
      let [h, sat, v] = rgbToHsv(r, g, b);
      h = (h + cfg.colorShift / 360 + 1) % 1;
      sat = Math.min(1, sat * cfg.saturationMult);
      const [nr, ng, nb] = hsvToRgb(h, sat, v);
      r = lerp(r, nr, strength * matStr);
      g = lerp(g, ng, strength * matStr);
      b = lerp(b, nb, strength * matStr);

      // 2. Map luminance onto palette
      const palColor = samplePalette(cfg.palette, l);
      const palMix = strength * matStr * stylize;
      r = lerp(r, palColor.r, palMix);
      g = lerp(g, palColor.g, palMix);
      b = lerp(b, palColor.b, palMix);

      // 3. Darks pushed darker
      const darkFactor = 1 - cfg.darknessPush * strength * (1 - l);
      r *= darkFactor; g *= darkFactor; b *= darkFactor;

      // 4. Lights pushed brighter
      const brightFactor = 1 + cfg.brightnessPush * strength * l;
      r = Math.min(255, r * brightFactor);
      g = Math.min(255, g * brightFactor);
      b = Math.min(255, b * brightFactor);

      // 5. Contrast S-curve
      const cl = settings.realismVsStylization * cfg.contrastBoost;
      const lc = sCurve(l, cl);
      const lOrig = lum(r, g, b) / 255 || 0.001;
      const scale = lc / lOrig;
      r = clamp(r * scale);
      g = clamp(g * scale);
      b = clamp(b * scale);

      // 6. Posterize (cartoon world)
      if (cfg.posterize) {
        const levels = cfg.posterize;
        r = Math.round(r / 255 * levels) / levels * 255;
        g = Math.round(g / 255 * levels) / levels * 255;
        b = Math.round(b / 255 * levels) / levels * 255;
      }

      // 7. Noise grain
      if (cfg.noiseAmount) {
        const n = (Math.random() - 0.5) * cfg.noiseAmount * 255 * strength;
        r = clamp(r + n); g = clamp(g + n); b = clamp(b + n);
      }

      // 8. Blend back original based on preserve slider
      r = lerp(r, s[i], preserve * (1 - strength * 0.5));
      g = lerp(g, s[i+1], preserve * (1 - strength * 0.5));
      b = lerp(b, s[i+2], preserve * (1 - strength * 0.5));
    }

    d[i] = clamp(r); d[i+1] = clamp(g); d[i+2] = clamp(b); d[i+3] = a;
  }

  base.ctx.putImageData(baseData, 0, 0);

  // ── Layer 2: chromatic aberration ─────────────────────────────────────
  if (cfg?.channelSplit && strength > 0.3) {
    const split = Math.round(cfg.channelSplit * strength);
    applyChannelSplit(base.canvas, base.ctx, W, H, split);
  }

  // ── Layer 3: atmospheric glow bloom ───────────────────────────────────
  if (cfg) {
    const glowOpacity = cfg.glowStrength * settings.atmosphereStrength * strength;
    if (glowOpacity > 0.05) {
      const bloomScreen = makeCanvas(W, H);
      bloomScreen.ctx.filter = `blur(${Math.round(8 + strength * 16)}px)`;
      bloomScreen.ctx.drawImage(base.canvas, 0, 0);

      base.ctx.globalCompositeOperation = 'screen';
      base.ctx.globalAlpha = glowOpacity;
      base.ctx.drawImage(bloomScreen.canvas, 0, 0);
      base.ctx.globalCompositeOperation = 'source-over';
      base.ctx.globalAlpha = 1;
    }

    // ── Layer 4: atmosphere color overlay ─────────────────────────────
    const atmoOpacity = settings.atmosphereStrength * settings.environmentTransformationStrength * strength * 0.35;
    if (atmoOpacity > 0.02) {
      const ac = cfg.atmosphereColor;
      base.ctx.globalCompositeOperation = 'overlay';
      base.ctx.globalAlpha = atmoOpacity;
      base.ctx.fillStyle = `rgb(${ac.r},${ac.g},${ac.b})`;
      base.ctx.fillRect(0, 0, W, H);
      base.ctx.globalCompositeOperation = 'source-over';
      base.ctx.globalAlpha = 1;
    }

    // ── Layer 5: vignette ─────────────────────────────────────────────
    const vigOpacity = cfg.vignetteStrength * settings.backgroundIntegration * strength;
    if (vigOpacity > 0.05) {
      const grad = base.ctx.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.max(W,H)*0.8);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${vigOpacity})`);
      base.ctx.globalCompositeOperation = 'multiply';
      base.ctx.fillStyle = grad;
      base.ctx.fillRect(0, 0, W, H);
      base.ctx.globalCompositeOperation = 'source-over';
    }
  }

  return base.canvas.toDataURL('image/jpeg', 0.93);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeCanvas(w: number, h: number) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function applyChannelSplit(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, w: number, h: number, px: number) {
  const tmp = makeCanvas(w, h);
  tmp.ctx.drawImage(canvas, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // Red channel shifted right
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(tmp.canvas, px, 0);
  // Blue channel shifted left — simulate via hue blending
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.4;
  ctx.drawImage(tmp.canvas, -px, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function lum(r: number, g: number, b: number) {
  return 0.299*r/255 + 0.587*g/255 + 0.114*b/255;
}

function sCurve(x: number, s: number): number {
  const t = Math.max(0, Math.min(1, x));
  if (t < 0.5) return 0.5 * Math.pow(2*t, 1+s);
  return 1 - 0.5 * Math.pow(2*(1-t), 1+s);
}

function clamp(v: number) { return Math.min(255, Math.max(0, Math.round(v))); }
function lerp(a: number, b: number, t: number) { return a + (b-a)*Math.max(0,Math.min(1,t)); }

function samplePalette(palette: RGB[], t: number): RGB {
  const scaled = t * (palette.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  const a = palette[Math.min(idx, palette.length-1)];
  const b = palette[Math.min(idx+1, palette.length-1)];
  return { r: lerp(a.r,b.r,frac), g: lerp(a.g,b.g,frac), b: lerp(a.b,b.b,frac) };
}

function rgbToHsv(r: number, g: number, b: number): [number,number,number] {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0, s=max===0?0:d/max, v=max;
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
