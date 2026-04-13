/**
 * World Transform Prompt Builder
 * Composes strong transformation prompts that preserve subjects while transforming worlds.
 */

import { RestyleSettings, WorldPreset, VisualLanguagePreset } from '../types';

const WORLD_DESCRIPTIONS: Record<WorldPreset, string> = {
  forest: 'a mystical ancient forest world — bark-skin, moss, roots, vine, glowing fungi, forest mist, woodland spirits, organic growth textures',
  sea: 'a deep ocean world — coral armor, shell surfaces, bioluminescent glow, seaweed, pearl textures, underwater light caustics, aquatic materials',
  fire: 'a fire realm world — flame-body, ember textures, cracked molten surfaces, ash and smoke, heat shimmer, volcanic atmosphere, burning materials',
  spirit: 'a spirit/ghost world — translucent ethereal forms, cold spectral glow, smoke edges, drifting energy, haunted atmosphere, supernatural translucency',
  cartoon: 'a vibrant animated cartoon world — bold illustration lines, stylized flat shading, expressive exaggerated forms, vivid saturated colors, animated character aesthetic',
  ice: 'a frozen ice world — crystalline frost surfaces, ice armor, pale cold light, frozen textures, glacier atmosphere, crystal formations',
  crystal: 'a prismatic crystal world — gem-like refracting surfaces, rainbow light dispersion, jewel textures, iridescent materials, crystalline forms',
  shadow: 'a shadow realm — deep darkness, violet energy, near-black atmosphere, high contrast silhouette, void-like textures, dark dimension materials',
  floral: 'a living floral world — petal surfaces, bloom glow, flower-skin textures, soft botanical atmosphere, organic floral forms, dreamy light',
  machine: 'a machine/cyber world — metal surfaces, circuit textures, terminal green glow, mechanical joints, hard geometric forms, technological materials',
};

const VISUAL_LANGUAGE_DESCRIPTIONS: Record<VisualLanguagePreset, string> = {
  none: '',
  bioluminescent: 'with bioluminescent internal glow, deep darkness contrast, neon blues and greens glowing from within, luminous tendrils and fractal light patterns',
  'sacred-geometry': 'with sacred geometry patterns woven into surfaces — Metatron cube structures, flower of life patterns, glowing geometric lines in cyan and magenta',
  mandala: 'with intricate mandala patterns radiating from the composition — layered radial symmetry, tapestry-like complexity, deep reds, golds, and electric accents',
  'deep-dream': 'with deep dream surreal morphing — recursive impossible forms, eyes appearing in surfaces, dreamlike organic hallucination textures',
  visionary: 'with visionary spiritual energy — glowing energy channels, luminous anatomical systems, transcendental light, deep blue and gold spiritual atmosphere',
};

const WORLD_MOTION_HINTS: Record<WorldPreset, string> = {
  forest: 'roots crawling, vines growing, leaves opening, spores drifting, organic growth movement',
  sea: 'bioluminescent pulses, water shimmer, algae drifting, bubble rising, fin-like movement',
  fire: 'flame flicker, ember drift, heat shimmer, glowing crack intensification, spark bursts',
  spirit: 'eye opening/closing, breathing glow, smoke trails drifting, spectral shimmer, ghostly light pulsing',
  cartoon: 'eye blink, subtle expression, hair movement, magical accent movement, playful bounce',
  ice: 'frost crystal spreading, cold shimmer, glacial cracking, ice sparkle',
  crystal: 'prismatic light shifting, crystal rotation, rainbow dispersion changing',
  shadow: 'shadow tendrils moving, void energy pulsing, dark energy cycling',
  floral: 'petals opening, bloom glow pulsing, pollen drifting, gentle sway',
  machine: 'scanning light movement, circuit pulse, mechanical joint movement, energy cycling',
};

export interface BuiltPrompt {
  transformPrompt: string;
  motionHint: string;
  preservationInstructions: string;
  debugInfo: {
    mode: string;
    worldPreset: string | null;
    visualLanguage: string;
    hasCustomPrompt: boolean;
    hasReshape: boolean;
  };
}

export function buildWorldTransformPrompt(settings: RestyleSettings): BuiltPrompt {
  const isPreserveMode = settings.mode === 'preserve-characters';

  // ── Preservation block ──────────────────────────────────────────────────
  const preservationInstructions = isPreserveMode
    ? [
        'CRITICAL: Preserve the original people, characters, and subjects exactly.',
        `Preserve face identity and facial features with ${Math.round(settings.facePreservation * 100)}% fidelity.`,
        `Preserve pose, body position, and placement with ${Math.round(settings.posePreservation * 100)}% fidelity.`,
        `Preserve overall image composition and structure with ${Math.round(settings.preserveStructure * 100)}% fidelity.`,
        'Keep the same people — transform the WORLD around them and ONTO them, not replace them.',
        'Do NOT change the subject into a different person or entity.',
        'The original subjects must remain recognizable.',
      ].join(' ')
    : [
        'Preserve general composition, silhouette, and pose structure.',
        `Preserve structural layout with ${Math.round(settings.preserveStructure * 100)}% fidelity.`,
        'Characters and beings may be reinvented into world-appropriate creatures or entities.',
        'Keep the same general placement and spatial logic.',
      ].join(' ');

  // ── World transformation block ──────────────────────────────────────────
  const worldDesc = settings.worldPreset ? WORLD_DESCRIPTIONS[settings.worldPreset] : null;
  const visualDesc = settings.visualLanguage !== 'none'
    ? VISUAL_LANGUAGE_DESCRIPTIONS[settings.visualLanguage]
    : null;

  const worldBlock = [
    worldDesc ? `Transform the image into ${worldDesc}.` : '',
    visualDesc ? `Apply visual language: ${visualDesc}.` : '',
    settings.customStylePrompt.trim()
      ? `Additional style direction: ${settings.customStylePrompt.trim()}.`
      : '',
  ].filter(Boolean).join(' ');

  // ── Material/environment block ──────────────────────────────────────────
  const materialBlock = [
    `Redesign all materials and surfaces with ${Math.round(settings.redesignMaterials * 100)}% transformation strength.`,
    `Rebuild the environment and background with ${Math.round(settings.redesignEnvironment * 100)}% world transformation.`,
    `Fantasy/mythic intensity: ${Math.round(settings.fantasyStrength * 100)}%.`,
    settings.realismVsStylization > 0.5
      ? 'Lean toward stylized, artistic, illustrative aesthetic.'
      : 'Lean toward realistic, photographic, natural aesthetic.',
    `Atmosphere strength: ${Math.round(settings.atmosphereStrength * 100)}%.`,
  ].join(' ');

  // ── Anti-filter instruction ─────────────────────────────────────────────
  const antiFilter = [
    'IMPORTANT: This must NOT be a color filter, texture overlay, or simple recolor.',
    'This must be a TRUE world transformation — rebuild materials, textures, environment, atmosphere.',
    'The result should feel like a different world, not the same image with a color grade.',
    'Avoid weak stylization passes. Make the transformation deep and complete.',
  ].join(' ');

  // ── Reshape block ───────────────────────────────────────────────────────
  const reshapeBlock = settings.reshapeStrength > 0 || settings.customReshapePrompt.trim()
    ? [
        settings.reshapeStrength > 0
          ? `Apply spatial reshape/distortion at ${Math.round(settings.reshapeStrength * 100)}% strength.`
          : '',
        settings.customReshapePrompt.trim()
          ? `Reshape instructions: ${settings.customReshapePrompt.trim()}.`
          : '',
      ].filter(Boolean).join(' ')
    : '';

  const transformPrompt = [
    preservationInstructions,
    worldBlock || 'Transform the image with strong artistic world-building.',
    materialBlock,
    antiFilter,
    reshapeBlock,
    'Output: high quality, detailed, cinematic, print-ready artwork.',
  ].filter(Boolean).join('\n\n');

  const motionHint = settings.worldPreset
    ? WORLD_MOTION_HINTS[settings.worldPreset]
    : settings.customStylePrompt.trim() || 'subtle energy pulse';

  return {
    transformPrompt,
    motionHint,
    preservationInstructions,
    debugInfo: {
      mode: settings.mode,
      worldPreset: settings.worldPreset,
      visualLanguage: settings.visualLanguage,
      hasCustomPrompt: !!settings.customStylePrompt.trim(),
      hasReshape: settings.reshapeStrength > 0 || !!settings.customReshapePrompt.trim(),
    },
  };
}
