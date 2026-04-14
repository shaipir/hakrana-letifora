import { GlowSculptureSettings } from '../types';

const CONTOUR_STYLE_DESCRIPTIONS: Record<string, string> = {
  'neon-sign': 'glowing neon tube sign aesthetic, uniform thick luminous tubes, even glow distribution',
  'light-paint': 'long exposure light painting aesthetic, fluid glowing strokes, hand-drawn energy',
  'plasma': 'hot plasma filaments, electric discharge lines, ionized gas threads, energy tendrils',
  'laser': 'precise laser line art, sharp crisp luminous edges, technical precision glow',
  'molten': 'molten lava light, viscous glowing liquid contours, heavy dripping luminosity',
  'ethereal': 'soft ethereal ghost light, spiritual luminous form, translucent radiant energy',
};

const COLOR_PRESET_DESCRIPTIONS: Record<string, string> = {
  cyber: 'electric cyan and magenta, #00ffff to #ff00ff gradient',
  vapor: 'synthwave pink and purple, #ff6ec7 to #8b5cf6',
  solar: 'golden yellow to orange fire, #ffd700 to #ff4500',
  toxic: 'acid green to yellow-green, #39ff14 to #ccff00',
  ice: 'pale blue to white frost, #87ceeb to #ffffff',
  blood: 'deep crimson to bright red, #8b0000 to #ff2222',
  aurora: 'multi-color aurora borealis, teal, green, pink spectrum',
  mono: 'pure white monochrome glow on black',
  phantom: 'deep violet to ghost white, #4a0080 to #f0f0ff',
};

const BACKGROUND_DESCRIPTIONS: Record<string, string> = {
  'pure-black': 'pure black void background rgb(0,0,0)',
  'deep-dark': 'near-black deep dark background, slight atmospheric darkness',
  'textured-dark': 'textured dark surface background, tactile darkness',
};

const TEXTURE_DESCRIPTIONS: Record<string, string> = {
  'dark-concrete': 'dark rough concrete surface texture',
  'black-metal': 'black brushed metal surface',
  'wet-asphalt': 'wet dark asphalt surface with subtle reflections',
  'dark-glass': 'dark glass panel with faint reflections',
  'none': '',
};

export function buildGlowSculpturePrompt(settings: GlowSculptureSettings): {
  transformPrompt: string;
  motionHint: string;
} {
  const style = CONTOUR_STYLE_DESCRIPTIONS[settings.contourStyle] ?? CONTOUR_STYLE_DESCRIPTIONS['neon-sign'];
  const color = COLOR_PRESET_DESCRIPTIONS[settings.colorPreset] ?? COLOR_PRESET_DESCRIPTIONS['cyber'];
  const colorModeDesc = settings.colorMode === 'single'
    ? 'single uniform color'
    : settings.colorMode === 'dual-gradient'
    ? 'two-color gradient flowing ' + settings.gradientFlowDirection
    : 'multi-color spectrum gradient';
  const bg = BACKGROUND_DESCRIPTIONS[settings.backgroundType] ?? BACKGROUND_DESCRIPTIONS['pure-black'];
  const texture = settings.backgroundTexture !== 'none'
    ? TEXTURE_DESCRIPTIONS[settings.backgroundTexture] ?? ''
    : '';
  const thicknessDesc = settings.lineThickness <= 2
    ? 'thin delicate'
    : settings.lineThickness <= 4
    ? 'medium weight'
    : settings.lineThickness <= 6
    ? 'thick bold'
    : settings.lineThickness <= 8
    ? 'very thick massive'
    : 'ultra-thick monumental';
  const bloomDesc = `${settings.bloomLayers} concentric bloom halo layers`;
  const glowDesc = settings.glowIntensity > 0.8
    ? 'extreme intense glow'
    : settings.glowIntensity > 0.5
    ? 'strong glow'
    : 'subtle soft glow';

  const transformPrompt = [
    `Transform this image into a premium glowing light sculpture artwork.`,
    `CRITICAL: Preserve the original subject silhouette and essential contour shape exactly.`,
    `Extract only the main subject form and essential contours — remove all photographic texture and color from the subject.`,
    `Replace the entire subject with ${thicknessDesc} glowing light contour lines in ${style}.`,
    `Color treatment: ${colorModeDesc} using ${color}.`,
    `Glow engine: ${glowDesc}, glow radius ${Math.round(settings.glowRadius * 100)}% spread, ${bloomDesc}, ambient light scatter ${Math.round(settings.ambientLightScatter * 100)}%, core brightness at ${Math.round(settings.coreBrightness * 100)}%.`,
    `Contour smoothing: ${Math.round(settings.contourSmoothing * 100)}% smooth, reduce tiny photographic detail by ${Math.round(settings.detailReduction * 100)}%.`,
    `Background: ${bg}${texture ? ', ' + texture : ''}.`,
    `The result must look like a premium framed luminous sculpture, gallery-quality glowing contour art.`,
    `NOT a thin wireframe, NOT technical line detection, NOT a weak neon effect.`,
    `Output: thick glowing contour art, deep bloom, atmospheric premium glow, projection-inspired gallery artwork.`,
    settings.customStylePrompt ? `Additional direction: ${settings.customStylePrompt}.` : '',
  ].filter(Boolean).join(' ');

  const motionHint = settings.contourStyle === 'plasma'
    ? 'electric discharge flickering, plasma filament movement'
    : settings.contourStyle === 'molten'
    ? 'molten drip movement, viscous glow flow'
    : settings.contourStyle === 'ethereal'
    ? 'spectral light breathing, ghost form pulsing'
    : 'glow pulse cycling, light trace flowing around contours';

  return { transformPrompt, motionHint };
}
