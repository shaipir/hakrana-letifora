import { LoopSettings, ArtReviveMode, WorldPreset } from '../types';

// ─── World motion progressions ────────────────────────────────────────────────
// Each array = sequential progression steps, NOT random per-frame hints.
// Frame N uses hint[floor(N / total * hints.length)] to describe where in the
// motion arc the scene currently is.

const WORLD_MOTION_PROGRESSIONS: Record<string, string[]> = {
  forest: [
    'roots are dormant, faint glow in bark crevices',
    'first root filaments begin extending along wall base',
    'roots crawl further upward, vines starting to emerge',
    'vines extend across the lower half of the surface',
    'moss begins pulsing with light, spores appear',
    'vines reach the middle, moss brightens, spores drift upward',
    'canopy light filters down through dense vine network',
    'leaves begin opening fully, full bioluminescent bloom',
    'peak forest state — full glow, swaying vines, active spores',
    'scene begins to softly breathe back to a calm state',
  ],
  sea: [
    'water surface barely shimmers, first bioluminescent spark',
    'subtle underwater shimmer begins across the surface',
    'coral textures start glowing, first bubble trails rise',
    'bioluminescent pulse sweeps from bottom to top',
    'algae drift left to right, deep blue glow intensifies',
    'coral bloom brightens, bubble streams multiply',
    'full underwater light field — multiple pulse sources active',
    'tidal rhythm sway, shimmer at peak intensity',
    'light pulses recede, deep seafloor glow remains',
    'water motion settles, soft ambient bioluminescence persists',
  ],
  fire: [
    'embers dormant in cracks, low amber glow',
    'first flame tongues appear along structural edges',
    'flames grow and flicker upward, lava crack extends',
    'sparks begin drifting, fire climbs the facade',
    'heat waves visible, flames mid-height, smoke beginning',
    'fire at full intensity, sparks arc overhead',
    'peak flame state — roaring fire, maximum ember scatter',
    'fire begins to shift and surge in a new direction',
    'hot embers slowly settle, structural glow remains',
    'fire dims to a steady amber pulse',
  ],
  spirit: [
    'cold stillness — faint spectral outline barely visible',
    'pale mist starts forming at the edges',
    'ghostly energy begins coiling around the silhouette',
    'spectral light pulses from the core outward',
    'eyes begin to open — first glint of light in irises',
    'eyes half open, ethereal glow at mid-intensity',
    'full spectral presence — eyes open, energy at peak',
    'ghostly tendrils reach outward then recede',
    'spectral breathing visible — glow expands and contracts',
    'spirit glow settles to a steady soft radiance',
  ],
  cartoon: [
    'subject neutral, subtle painted light on surfaces',
    'slight energy spark at the eye corners',
    'eyes begin to widen, animated expression building',
    'bold outline brightens, flat color panels vivify',
    'full cartoon energy — exaggerated bright palette at peak',
    'animated motion lines appear briefly',
    'expression softens to a warm smile',
    'gentle bounce motion in the silhouette',
    'animated glow twinkles around the subject',
    'returns to calm illustrated form',
  ],
  ice: [
    'frost dormant, cool blue ambient on surfaces',
    'first ice crystal nucleates at a corner',
    'crystal lattice grows from nucleation point outward',
    'frost spreads across lower surface panels',
    'crystalline branching reaches mid-surface',
    'prismatic refraction active across crystal coverage',
    'full frost coverage — iridescent blue-white shimmer',
    'cold mist drifts from crystal surfaces',
    'ice shimmer pulses in a wave pattern',
    'frost settles into a steady crystalline glow',
  ],
  crystal: [
    'gem surfaces dull — faint inner light only',
    'first prismatic refraction spark appears',
    'gem faces begin rotating light dispersion',
    'rainbow spectrum visible in lower crystals',
    'full prismatic rainbow spread across surface',
    'inner light at mid-intensity, jewel color shift',
    'peak gem brilliance — maximum color dispersion',
    'light beam arcs from one gem cluster to another',
    'radiant inner glow pulses outward',
    'gem glow settles to a steady prismatic radiance',
  ],
  shadow: [
    'near total darkness, faint violet edge trace',
    'shadow tendrils emerge from the edges',
    'void energy lines trace the structural outline',
    'dark smoke forms and drifts across the surface',
    'spectral purple glow pulses from within',
    'shadow creature silhouette briefly visible',
    'void depth at maximum — full dark energy field',
    'shadows shift and reshape across the surface',
    'dark energy recedes inward',
    'quiet darkness with steady violet ambient glow',
  ],
  floral: [
    'buds closed, soft warm ambient light',
    'first petal begins to unfurl',
    'two or three blossoms partially open',
    'petals extending, pollen begins drifting',
    'half-bloom state — warm glow from open flowers',
    'vines extend, new blossom emerging',
    'full bloom — peak floral light and fragrance glow',
    'petals sway in a gentle breeze',
    'pollen cloud drifts across the scene',
    'blossoms settle into full open resting state',
  ],
  machine: [
    'circuits dark, only basic LED pilot lights',
    'boot sequence begins — green scan line at base',
    'circuit traces light up from base to mid',
    'mechanical joints activate at corners',
    'scanning line passes over the full surface',
    'panel grid fully illuminated, pulsing in sequence',
    'peak active state — all circuits and panels live',
    'LED pattern cycles through a color shift',
    'data transmission pulse travels surface-to-surface',
    'system idle — steady green circuit glow',
  ],
};

const MOTION_TYPE_PHASES: Record<string, (frame: number, total: number) => string> = {
  breathe: (f, t) => {
    const phase = Math.sin((f / t) * Math.PI * 2);
    const pct = Math.round((phase + 1) * 50);
    return `breathing at ${pct}% — ${phase > 0 ? 'inhale, subtle expansion, soft glow increase' : 'exhale, gentle contraction, glow dimming'}`;
  },
  trace: (f, t) => {
    const pct = Math.round((f / t) * 100);
    return `glow trace at ${pct}% along the contour path — light traveling clockwise`;
  },
  pulse: (f, t) => {
    const phase = Math.sin((f / t) * Math.PI * 2);
    const intensity = Math.round((phase + 1) * 50);
    return `pulse at ${intensity}% intensity — ${intensity > 70 ? 'peak brightness burst' : intensity > 30 ? 'mid-cycle sustain' : 'low phase decay'}`;
  },
  flicker: (f, _t) => {
    const states = ['steady glow', 'brief dim flicker', 'sharp bright flash', 'slow fade down', 'steady glow', 'micro flutter', 'steady glow', 'dim valley', 'bright surge', 'steady hold'];
    return `flicker: ${states[f % states.length]}`;
  },
  reveal: (f, t) => {
    const pct = Math.round((f / t) * 100);
    return `${pct}% of form revealed — emerging progressively from shadow, left-to-right unveil`;
  },
  flow: (f, t) => {
    const pct = Math.round((f / t) * 100);
    return `energy flowing top-to-bottom at ${pct}% through the cycle, directional luminous movement`;
  },
};

export function buildFrameMotionPrompt(
  basePrompt: string,
  loopSettings: LoopSettings,
  frameIndex: number,
  totalFrames: number,
  worldPreset?: WorldPreset | null,
  mode?: ArtReviveMode,
  isFirstFrame?: boolean,
): string {
  const phaseDesc = (MOTION_TYPE_PHASES[loopSettings.motionType] ?? MOTION_TYPE_PHASES.breathe)(frameIndex, totalFrames);

  // Sequential world progression: which step in the motion arc are we at?
  const progression = worldPreset && WORLD_MOTION_PROGRESSIONS[worldPreset];
  const progressionStep = progression
    ? progression[Math.floor((frameIndex / totalFrames) * progression.length)]
    : null;

  const intensityDesc =
    loopSettings.motionIntensity > 0.7 ? 'strong' :
    loopSettings.motionIntensity > 0.4 ? 'moderate' : 'subtle';

  const continuityLevel = Math.round((loopSettings.continuityStrength ?? 0.9) * 100);

  const optionalMotion = [
    loopSettings.eyeBlink && frameIndex % 4 === 2 ? 'subject eyes gently blinking mid-motion' : '',
    loopSettings.breathing ? 'very subtle chest breathing visible' : '',
    loopSettings.environmentalMotion ? 'environment has gentle atmospheric motion' : '',
    loopSettings.organicGrowth && worldPreset ? `organic growth energy from ${worldPreset} world continues progressing` : '',
  ].filter(Boolean).join(', ');

  const isProjectionMode = mode === 'house-projection';

  const continuityBlock = isFirstFrame
    ? [
        `ANIMATION FRAME 1 OF ${totalFrames} — OPENING STATE.`,
        `This is the FIRST frame of a short coherent animated shot.`,
        `Establish the scene clearly. Subject, composition, lighting, and world-style must be exactly as defined above.`,
        `This frame is the visual anchor — all subsequent frames will evolve from this exact state.`,
        isProjectionMode
          ? `PROJECTION MODE: The object/building is the static canvas — it does NOT move. Only the projected light on its surface animates.`
          : '',
      ].filter(Boolean).join(' ')
    : [
        `ANIMATION FRAME ${frameIndex + 1} OF ${totalFrames} — CONTINUATION.`,
        `CRITICAL: This frame is a DIRECT CONTINUATION of frame ${frameIndex}.`,
        `The input image IS frame ${frameIndex}. You are producing the next moment in the same scene.`,
        isProjectionMode
          ? [
              `OBJECT LOCK — ABSOLUTE RULE: The building/object structure is COMPLETELY FROZEN.`,
              `Its shape, silhouette, position, camera angle, and all physical geometry are IDENTICAL to the input.`,
              `The object does NOT move, rotate, shift, or deform by even one pixel.`,
              `The background is also FROZEN — pixel-identical to the input.`,
              `ONLY the projected light artwork on the object's surfaces changes between frames.`,
              `The projection light must look clearly separate from the object's real surface — glowing on top, not replacing the material.`,
              `Make the projection artwork distinctly DIFFERENT from the previous frame — varied colors, patterns, or phase of the world animation — while the object stays perfectly still.`,
            ].join(' ')
          : [
              `Preserve ${continuityLevel}% structural continuity: same subject, same identity, same silhouette, same face, same pose base, same composition, same object boundaries.`,
              `Only the motion state and world-specific animation advances. Nothing else changes.`,
              `Do NOT drift the subject. Do NOT change the composition. Do NOT introduce new elements.`,
              `Frame ${frameIndex + 1} must feel like the next video frame of the exact same scene — not a re-generation.`,
            ].join(' '),
      ].filter(Boolean).join(' ');

  const progressionBlock = progressionStep
    ? `World motion progression step: ${progressionStep}.`
    : '';

  const loopClose = frameIndex >= totalFrames - 2
    ? `This is near the end of the loop. Begin smoothly returning toward the opening state so the loop cycles seamlessly.`
    : '';

  return [
    basePrompt,
    continuityBlock,
    `Motion state: ${phaseDesc}.`,
    `Motion intensity: ${intensityDesc}.`,
    progressionBlock,
    optionalMotion ? `Additional motion: ${optionalMotion}.` : '',
    loopClose,
    `Loop softness ${Math.round(loopSettings.loopSoftness * 100)}% — frame must flow cleanly into the next.`,
  ].filter(Boolean).join('\n\n');
}
