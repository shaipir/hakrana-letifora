/**
 * Surface Projection Prompt Builder
 * Identifies the central object in the image and projects artwork onto it only.
 */

import { HouseProjectionSettings, HouseWorldPreset } from '../types';

const WORLD_DESCRIPTIONS: Record<HouseWorldPreset, string> = {
  forest:  'enchanted forest — glowing roots, moss textures, spore-light, bark surfaces, vine networks, soft green woodland glow',
  sea:     'underwater coral — bioluminescent coral textures, seaweed, bubble streams, shell ornamentation, deep teal and cyan glow',
  fire:    'fire temple — molten crack textures, amber and red ember glow, smoke, lava-like surface channels, volcanic light',
  spirit:  'spirit world — cold spectral light, ghostly smoke, translucent energy patterns, pale blue and white ethereal glow',
  cartoon: 'vibrant cartoon fantasy — bold illustrated outlines along edges, vivid flat-color fills, playful animated textures, dynamic cartoon aesthetic',
  ice:     'ice crystal — frost crystal formations, icy blue-white glow, crystalline lattice patterns, frozen surface textures, glacial cold-light',
  crystal: 'crystal palace — prismatic gem textures, rainbow light dispersion, jewel-like surface patterns, refractive iridescent materials',
  shadow:  'shadow realm — deep darkness with violet energy lines tracing edges, near-black with spectral purple glow, void-like panels with dark energy',
  floral:  'living floral — petal and bloom textures mapped to surfaces, soft magical glow, vines and blossoms tracing structural lines, warm dreamlike botanical light',
  machine: 'machine world — glowing circuit patterns, terminal green scanning light, mechanical joint textures, grid-like ornamentation, technological glow',
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

  const transformPrompt = `
====== SURFACE PROJECTION MAPPING INSTRUCTIONS ======

STEP 1 — IDENTIFY THE CENTRAL SUBJECT:
Look at the uploaded image and identify the PRIMARY central object or structure.
This is typically the most prominent element at or near the center of the frame:
• A building or architectural structure
• A box, crate, container, or geometric shape
• A sculpture, statue, or large object
• Any dominant 3D form that fills the center of the composition

STEP 2 — MAP ITS SURFACES:
For the central object ONLY, identify each visible face/surface:
• Each flat plane (front face, side face, top face)
• Respect the exact perspective and 3D angle of each face as seen in the photo
• A box has up to 3 visible faces — map each one separately
• A building has a facade, side walls, roofline — map each plane
• Respect foreshortening: angled surfaces get perspective-correct artwork

STEP 3 — PROJECT ARTWORK ON THE CENTRAL OBJECT ONLY:
Apply the projection artwork EXCLUSIVELY on the identified central object.
${worldDesc ? `Projection world style: ${worldDesc}.` : ''}
${settings.customStylePrompt.trim() ? `Additional direction: ${settings.customStylePrompt.trim()}.` : ''}

STRICT RULES — READ CAREFULLY:

OBJECT LOCK (most important):
• The central object is COMPLETELY FROZEN — zero movement, zero deformation, zero shape change
• The object's silhouette, edges, corners, proportions, and 3D structure are IDENTICAL to the input photo
• The object does NOT rotate, shift, scale, lean, or morph in ANY way
• Camera angle and composition are IDENTICAL to the input — no camera drift, no zoom
• Background, floor, sky, surrounding elements are PIXEL-IDENTICAL to the original photo

PROJECTION SEPARATION (critical visual goal):
• The projected light must be clearly distinguishable FROM the object's own surface
• Render projected artwork as glowing LIGHT PAINTED ON TOP of the object's real surface texture
• The object's real surface material (stone, concrete, brick, metal) must remain VISIBLE UNDERNEATH the projection
• Projection light does NOT replace the surface — it layers over it, like a real projector beam
• Object edges should have a subtle dark rim/gap that separates the projection glow from the surrounding darkness
• This creates the visual illusion of a real projection mapping performance on a physical structure

PROJECTION CONTENT (what changes):
• ONLY the light pattern, color, glow intensity, and artistic motif projected onto the object changes
• The projection itself should be VIVID, VARIED, and DYNAMIC — rich with the world's visual language
• Each face/panel of the object can show a different phase or composition of the projected artwork
• ${worldDesc ? `Projection world style: ${worldDesc}.` : ''}
• ${settings.customStylePrompt.trim() ? `Additional direction: ${settings.customStylePrompt.trim()}.` : ''}

TECHNICAL:
• Surface transformation intensity: ${Math.round(settings.surfaceTransformationStrength * 100)}%
• Projection light intensity: ${Math.round(settings.projectionIntensity * 100)}%
• Glow emission: ${Math.round(settings.glowAmount * 100)}%
• Darkness contrast: ${Math.round(settings.darknessContrast * 100)}%
• Detail density: ${Math.round(settings.ornamentationLevel * 100)}%
• Dark or night atmosphere preferred for maximum projection visibility

Output: photorealistic, cinematic, high-detail. Frozen object. Living light projection on its surfaces.
====================================================
`.trim();

  return {
    transformPrompt,
    debugInfo: {
      worldPreset: settings.worldPreset,
      hasCustomPrompt: !!settings.customStylePrompt.trim(),
      geometryPreservation: settings.geometryPreservation,
    },
  };
}
