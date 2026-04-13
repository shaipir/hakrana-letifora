/**
 * House Projection Transform Prompt Builder
 * Builds facade-aligned projection art prompts.
 */

import { HouseProjectionSettings, HouseWorldPreset } from '../types';

const WORLD_DESCRIPTIONS: Record<HouseWorldPreset, string> = {
  forest: 'enchanted forest projection — glowing roots crawling along walls, moss textures filling facade panels, spore-light drifting from windows, bark-skin surfaces, vine networks tracing rooflines, soft green woodland glow',
  sea: 'underwater coral projection — bioluminescent coral textures on walls, seaweed trailing from windows, bubble streams rising along facade, shell-like ornamentation on doors and trim, deep teal and cyan glow emanating from building surfaces',
  fire: 'fire temple projection — molten crack textures across facade planes, amber and red ember glow from windows, smoke rising from roofline, lava-like surface channels tracing structural lines, volcanic light emanating from interior',
  spirit: 'spirit world projection — cold spectral light emanating from windows, ghostly smoke tracing wall planes, translucent energy patterns mapped to facade, pale blue and white ethereal glow, supernatural atmospheric haze',
  cartoon: 'vibrant cartoon fantasy projection — bold illustrated outlines traced along facade edges, vivid painted flat-color surface panels, playful animated texture fills on walls, exaggerated light and shadow, dynamic cartoon world aesthetic',
  ice: 'ice crystal projection — frost crystal formations on wall panels, icy blue-white glow from windows, crystalline lattice patterns mapped to facade, frozen surface textures, glacial cold-light atmosphere emanating from building',
  crystal: 'crystal palace projection — prismatic gem textures on facade panels, rainbow light dispersion from windows, jewel-like surface patterns, refractive iridescent materials mapped to walls, radiant inner light emanating from building',
  shadow: 'shadow realm projection — deep darkness with violet energy lines tracing structural edges, near-black facade with spectral purple glow from windows, void-like surface panels with dark energy patterns, ominous high-contrast atmosphere',
  floral: 'living floral projection — petal and bloom textures mapped to wall panels, soft magical glow from floral patterns on facade, vines and blossoms tracing structural lines, warm dreamlike botanical light emanating from windows',
  machine: 'machine world projection — glowing circuit patterns mapped to facade panels, terminal green scanning light on walls, mechanical joint textures at structural corners, grid-like ornamentation on surfaces, technological glow from building',
};

export interface HouseBuiltPrompt {
  transformPrompt: string;
  debugInfo: {
    worldPreset: string | null;
    hasCustomPrompt: boolean;
    geometryPreservation: number;
  };
}

export function buildHouseProjectionPrompt(settings: HouseProjectionSettings): HouseBuiltPrompt {
  const worldDesc = settings.worldPreset ? WORLD_DESCRIPTIONS[settings.worldPreset] : null;

  const preservationBlock = [
    'CRITICAL: Preserve the real building geometry exactly.',
    `Preserve the house silhouette, rooflines, roof shape, and overall structural outline with ${Math.round(settings.geometryPreservation * 100)}% fidelity.`,
    `Preserve the facade layout, wall planes, and building boundaries with ${Math.round(settings.facadePreservation * 100)}% fidelity.`,
    `Preserve window placement, door placement, and facade openings with ${Math.round(settings.windowAlignmentPreservation * 100)}% fidelity.`,
    'Do NOT invent a new building shape. Do NOT move or remove windows or doors.',
    'The house structure must remain fully recognizable and architecturally coherent.',
    'Preserve the original perspective and camera angle of the building.',
  ].join(' ');

  const transformationBlock = [
    'Transform the building into a premium projection-mapped facade artwork.',
    worldDesc ? `Apply world style: ${worldDesc}.` : '',
    settings.customStylePrompt.trim() ? `Additional direction: ${settings.customStylePrompt.trim()}.` : '',
    `Surface transformation strength: ${Math.round(settings.surfaceTransformationStrength * 100)}%.`,
    `Projection intensity: ${Math.round(settings.projectionIntensity * 100)}%.`,
    `Glow and luminosity: ${Math.round(settings.glowAmount * 100)}%.`,
    `Darkness and contrast: ${Math.round(settings.darknessContrast * 100)}%.`,
    `Ornamentation and surface detail: ${Math.round(settings.ornamentationLevel * 100)}%.`,
    `Atmospheric mood strength: ${Math.round(settings.atmosphereStrength * 100)}%.`,
  ].filter(Boolean).join(' ');

  const projectionBlock = [
    'Each visible surface of the house should be treated as a mapped projection surface.',
    'Facade panels, wall planes, window surrounds, roof sections, and structural edges should receive aligned surface transformation.',
    'The transformation should be spatially coherent with the real architecture — not randomly placed.',
    'Internal glow, light, and patterns should emanate naturally from the structural openings.',
    'The result should look like a high-end professional projection-mapping art installation on the real building.',
    'Do NOT make this look like a simple filter, color overlay, or neon outline.',
    'This must feel like a real luminous world transformation applied precisely to the building facade.',
    'Night-time or dark-sky atmosphere preferred — makes projection effect stronger.',
  ].join(' ');

  const transformPrompt = [
    preservationBlock,
    '\n\n',
    transformationBlock,
    '\n\n',
    projectionBlock,
    '\n\nOutput: high quality, detailed, cinematic, print-ready artwork. Photorealistic projection mapping aesthetic.',
  ].join('');

  return {
    transformPrompt,
    debugInfo: {
      worldPreset: settings.worldPreset,
      hasCustomPrompt: !!settings.customStylePrompt.trim(),
      geometryPreservation: settings.geometryPreservation,
    },
  };
}
