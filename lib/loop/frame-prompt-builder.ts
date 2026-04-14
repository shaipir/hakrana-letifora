import { LoopSettings, ArtReviveMode, WorldPreset } from '../types';

const WORLD_MOTION_HINTS: Record<string, string[]> = {
  forest: ['roots crawling along surfaces', 'vines slowly growing', 'leaves gently opening', 'moss pulsing', 'spores drifting upward'],
  sea: ['underwater light shimmer', 'algae drifting gently', 'bioluminescent pulse', 'coral glow shifting', 'bubbles rising'],
  fire: ['flames flickering', 'ember drift upward', 'smoke tendrils moving', 'glowing cracks intensifying', 'sparks floating'],
  spirit: ['spectral light pulsing', 'ghostly smoke drifting', 'ethereal breathing motion', 'energy orbs floating', 'eye opening slowly'],
  cartoon: ['eye blink animation', 'subtle expression shift', 'hair slight movement', 'animated bounce accent'],
  ice: ['frost crystal growing', 'ice shimmer shifting', 'cold mist drifting', 'crystalline refraction changing'],
  crystal: ['crystal facet light shifting', 'prismatic color movement', 'gem refraction rotating', 'sparkle point traveling'],
  shadow: ['shadow tendrils moving', 'dark smoke flowing', 'void depth pulsing', 'shadow creature stirring'],
  floral: ['petals slowly opening', 'pollen drifting', 'leaf gentle sway', 'blossom unfolding'],
  machine: ['scanning laser line moving', 'circuit pulse traveling', 'gear rotation trace', 'mechanical panel opening', 'LED pattern cycling'],
};

const MOTION_TYPE_PHASES: Record<string, (frame: number, total: number) => string> = {
  breathe: (f, t) => {
    const phase = Math.sin((f / t) * Math.PI * 2);
    const pct = Math.round((phase + 1) * 50);
    return `breathing cycle at ${pct}% — ${phase > 0 ? 'inhale phase, subtle expansion, soft light increase' : 'exhale phase, gentle contraction, light dimming'}`;
  },
  trace: (f, t) => {
    const pct = Math.round((f / t) * 100);
    return `glow trace at ${pct}% along the contour circuit, light traveling clockwise around the form`;
  },
  pulse: (f, t) => {
    const phase = Math.sin((f / t) * Math.PI * 2);
    const intensity = Math.round((phase + 1) * 50);
    return `glow pulse at ${intensity}% intensity — ${intensity > 70 ? 'peak brightness' : intensity > 30 ? 'mid cycle' : 'low phase'}`;
  },
  flicker: (f, _t) => {
    const states = ['steady glow', 'brief flicker dim', 'sharp bright flash', 'slow fade', 'steady glow', 'micro flicker', 'steady glow', 'dim phase', 'bright surge', 'steady glow'];
    return `glow flicker state: ${states[f % states.length]}`;
  },
  reveal: (f, t) => {
    const pct = Math.round((f / t) * 100);
    return `${pct}% of the form revealed, emerging from darkness, progressive left-to-right unveil`;
  },
  flow: (f, t) => {
    const pct = Math.round((f / t) * 100);
    return `energy flowing top-to-bottom at ${pct}% through the cycle, directional light movement`;
  },
};

export function buildFrameMotionPrompt(
  basePrompt: string,
  loopSettings: LoopSettings,
  frameIndex: number,
  totalFrames: number,
  worldPreset?: WorldPreset | null,
  mode?: ArtReviveMode,
): string {
  const phaseBuilder = MOTION_TYPE_PHASES[loopSettings.motionType] ?? MOTION_TYPE_PHASES.breathe;
  const phaseDesc = phaseBuilder(frameIndex, totalFrames);

  const worldHints = worldPreset && WORLD_MOTION_HINTS[worldPreset]
    ? WORLD_MOTION_HINTS[worldPreset]
    : [];
  const worldHint = worldHints.length > 0
    ? `World-specific motion: ${worldHints[frameIndex % worldHints.length]}.`
    : '';

  const intensityDesc = loopSettings.motionIntensity > 0.7
    ? 'strong'
    : loopSettings.motionIntensity > 0.4
    ? 'moderate'
    : 'subtle';

  const optionalMotion = [
    loopSettings.eyeBlink && frameIndex % 4 === 2 ? 'subject eyes gently blinking' : '',
    loopSettings.breathing ? 'very subtle chest breathing motion' : '',
    loopSettings.environmentalMotion ? 'environment has slight atmospheric motion' : '',
    loopSettings.organicGrowth && worldPreset ? `slight organic growth energy from ${worldPreset} world` : '',
  ].filter(Boolean).join(', ');

  return [
    basePrompt,
    `ANIMATION FRAME ${frameIndex + 1} OF ${totalFrames}.`,
    `CRITICAL: Maintain IDENTICAL subject pose, silhouette, composition, and identity from the reference. Only motion state changes.`,
    `Motion state: ${phaseDesc}.`,
    `Motion intensity: ${intensityDesc}.`,
    worldHint,
    optionalMotion ? `Additional motion: ${optionalMotion}.` : '',
    `Loop softness: ${Math.round(loopSettings.loopSoftness * 100)}% — frame must seamlessly loop with frame 1 and frame ${totalFrames}.`,
    `This is part of a seamless loop animation sequence. Keep consistency with all other frames.`,
  ].filter(Boolean).join(' ');
}
