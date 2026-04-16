/**
 * House Projection Transform Prompt Builder
 * Builds facade-aligned projection art prompts.
 * RULE: Must always use the uploaded photo as the real contour base.
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

  // ── Rule: use the uploaded photo as the EXACT structural skeleton ────────────
  const photoContourBlock = [
    '====== CRITICAL STRUCTURAL RULE — READ FIRST ======',
    'This prompt uses the uploaded photograph as the FIXED structural and geometric base.',
    'You MUST work directly on top of the photographed building.',
    'The photographed building IS the final building. Do NOT replace it with a different building.',
    'Do NOT invent a new house, facade, or structure.',
    'Do NOT generate a fantasy building that happens to look similar.',
    'The real-world building in the photo must be VISUALLY RECOGNIZABLE in the output.',
    '====================================================',
  ].join(' ');

  const preservationBlock = [
    `Preserve the exact roofline shape, pitch, and silhouette of the photographed building with ${Math.round(settings.geometryPreservation * 100)}% fidelity.`,
    `Preserve the facade layout, wall planes, corners, and building footprint with ${Math.round(settings.facadePreservation * 100)}% fidelity.`,
    `Preserve the exact window positions, sizes, and door openings with ${Math.round(settings.windowAlignmentPreservation * 100)}% fidelity.`,
    'Window and door openings must remain in exactly the same position as the photograph.',
    'The architectural silhouette must be pixel-accurate to the uploaded photo.',
    'Preserve the original camera perspective, angle, and scale of the photographed building.',
    'Preserve all visible architectural details: balconies, ledges, cornices, dormers, chimneys, columns.',
    'Use the photo contours as projection mapping guides — every surface in the photo gets a matching transformed surface.',
  ].join(' ');

  const transformationBlock = [
    'Now apply high-end projection-mapping artwork on top of the real building structure.',
    worldDesc ? `Projection world style: ${worldDesc}.` : '',
    settings.customStylePrompt.trim() ? `Additional direction: ${settings.customStylePrompt.trim()}.` : '',
    `Surface transformation strength: ${Math.round(settings.surfaceTransformationStrength * 100)}%.`,
    `Projection intensity and luminosity: ${Math.round(settings.projectionIntensity * 100)}%.`,
    `Glow and light emission: ${Math.round(settings.glowAmount * 100)}%.`,
    `Darkness and contrast depth: ${Math.round(settings.darknessContrast * 100)}%.`,
    `Ornamentation and surface detail density: ${Math.round(settings.ornamentationLevel * 100)}%.`,
    `Atmospheric mood strength: ${Math.round(settings.atmosphereStrength * 100)}%.`,
  ].filter(Boolean).join(' ');

  const projectionBlock = [
    'Each visible surface of the photographed house is a mapped projection plane.',
    'Wall panels, window surrounds, roof sections, and structural edges receive precisely aligned surface transformation.',
    'Internal glow, patterns, and light emanate naturally from the structural openings as they exist in the photo.',
    'All artistic effects must be spatially coherent with the real photographed architecture.',
    'The result must look like a professional projection-mapping art installation running on the REAL house from the photo.',
    'Night or dark-sky atmosphere preferred — projection effect is strongest.',
    'NOT a concept art of a fantasy building. NOT a different house.',
    'The photographed house WITH a projected luminous world applied to its real surfaces.',
  ].join(' ');

  const transformPrompt = [
    photoContourBlock,
    '\n\n',
    preservationBlock,
    '\n\n',
    transformationBlock,
    '\n\n',
    projectionBlock,
    '\n\nOutput: photorealistic, high-detail, cinematic. Projection-mapping aesthetic. Real building contours intact.',
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
