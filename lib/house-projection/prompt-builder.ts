/**
 * Surface Projection Prompt Builder
 * Detects all surfaces in ANY uploaded image and applies
 * projection-mapping artwork on them at their correct angles.
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

  const surfaceDetectionBlock = [
    '====== SURFACE PROJECTION MAPPING — READ FIRST ======',
    'STEP 1 — SURFACE DETECTION:',
    'Analyze the uploaded image and identify ALL visible surfaces:',
    '• Architectural surfaces: walls, floors, ceilings, stairs, doors, windows, columns',
    '• Furniture: tables, chairs, shelves, counters, cabinets — each flat or angled face',
    '• Objects: any object with a visible flat or curved surface area',
    '• Characters or figures: body planes, clothing surfaces, visible skin planes',
    '• Natural surfaces: ground, rock, tree bark, water, grass planes',
    '',
    'STEP 2 — PERSPECTIVE-CORRECT PROJECTION:',
    'For EACH detected surface:',
    '• Respect the exact 3D angle, tilt, and perspective of that surface as it appears in the photo',
    '• Apply the projection artwork in correct perspective — surfaces at an angle get foreshortened artwork',
    '• Table surfaces get artwork viewed at the table\'s angle',
    '• Walls get artwork aligned to the wall plane',
    '• Curved objects get artwork wrapped around their contour',
    '• Characters/figures get artwork projected onto their body planes',
    '',
    'STEP 3 — PRESERVE THE ORIGINAL SCENE:',
    'Do NOT replace the scene with a fantasy world.',
    'Do NOT invent new objects or change the composition.',
    'Keep ALL original objects, people, furniture exactly where they are.',
    'The result must look like real projectors shining light patterns ONTO the existing surfaces.',
    '====================================================',
  ].join('\n');

  const projectionStyleBlock = [
    'PROJECTION STYLE TO APPLY ON ALL SURFACES:',
    worldDesc ? `World: ${worldDesc}.` : '',
    settings.customStylePrompt.trim() ? `Additional direction: ${settings.customStylePrompt.trim()}.` : '',
    `Surface transformation intensity: ${Math.round(settings.surfaceTransformationStrength * 100)}%.`,
    `Projection light intensity and luminosity: ${Math.round(settings.projectionIntensity * 100)}%.`,
    `Glow and light emission from projected elements: ${Math.round(settings.glowAmount * 100)}%.`,
    `Darkness and contrast depth: ${Math.round(settings.darknessContrast * 100)}%.`,
    `Surface detail and ornamentation density: ${Math.round(settings.ornamentationLevel * 100)}%.`,
    `Atmospheric mood strength: ${Math.round(settings.atmosphereStrength * 100)}%.`,
  ].filter(Boolean).join(' ');

  const qualityBlock = [
    'QUALITY RULES:',
    '• Every major surface in the frame must receive projection artwork',
    '• Artwork perspective must match the surface angle exactly — no flat 2D stickers',
    '• Projection light blends naturally with shadows and ambient light of the scene',
    '• Small surfaces (a cup, a phone) also get micro-projected patterns scaled to their size',
    '• The overall result looks like a professional multi-projector installation on the REAL photographed scene',
    '• Dark or night lighting preferred to make projection effects most visible',
    'Output: photorealistic, high-detail, cinematic projection-mapping aesthetic.',
  ].join(' ');

  const transformPrompt = [
    surfaceDetectionBlock,
    '\n\n',
    projectionStyleBlock,
    '\n\n',
    qualityBlock,
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
