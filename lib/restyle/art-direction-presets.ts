import { ArtDirectionPreset } from '../types';

export const ART_DIRECTION_PRESETS: ArtDirectionPreset[] = [
  {
    id: 'fluid-dynamics',
    label: 'Fluid Dynamics',
    emoji: '🌊',
    tagline: 'Ink in water — fractal pigment collision',
    prompt: 'Crimson and midnight-blue ink released simultaneously into still water, the two pigments colliding in slow-motion fractal tendrils — feathered edges bleeding into each other, forming cloud-like formations of deep violet where they meet. Macro shot filling the entire frame, no horizon. Scientific visualization meets fine art print. Preserve the composition and subject of the original image but transform its visual world into this fluid ink aesthetic.',
    canvasWorldFallback: 'sea',
  },
  {
    id: 'fibonacci-spiral',
    label: 'Fibonacci Spiral',
    emoji: '🌀',
    tagline: 'Iridescent geometry, teal to molten gold',
    prompt: 'A mathematically precise Fibonacci spiral constructed from thousands of tiny iridescent triangles, each facet shifting from deep teal to molten gold as the spiral tightens toward the center. Dark charcoal background, the structure self-illuminating from within. Perfect radial symmetry. Generative art in the style of Refik Anadol data sculpture. Apply this geometric world to the original image composition.',
    canvasWorldFallback: 'sacred-geometry',
  },
  {
    id: 'volcanic-glass',
    label: 'Volcanic Glass',
    emoji: '🖤',
    tagline: 'Obsidian fracture planes — macro mineral',
    prompt: 'Extreme macro photograph of obsidian volcanic glass fracture planes — conchoidal breaks revealing sharp mirror-like surfaces in layered black with faint olive and deep burgundy undertones. Light raking across the surface at 15 degrees creating microscopic shadow topography. Smithsonian mineral collection documentation aesthetic. Transform the original image into this volcanic glass material world.',
    canvasWorldFallback: 'shadow',
  },
  {
    id: 'neon-glitch',
    label: 'Neon Glitch',
    emoji: '📺',
    tagline: 'Scan-line corruption, cyan and magenta decay',
    prompt: 'Abstract digital glitch art: horizontal scan-line corruption across a deep black canvas, neon cyan and hot magenta pixel fragments displaced in diagonal cascades. Chromatic aberration splitting elements into RGB ghost offsets. CRT monitor phosphor glow bleeding from the tears. Static noise texture underlying everything. Dark net art aesthetic, Electronic Superhighway exhibition piece. Apply this digital decay transformation to the original image.',
    canvasWorldFallback: 'bioluminescent',
  },
  {
    id: 'watercolor-bleed',
    label: 'Watercolor Bleed',
    emoji: '💧',
    tagline: 'Prussian blue bleeding across wet paper',
    prompt: 'A single drop of deep Prussian blue watercolor expanding across wet cold-press paper — the pigment granulating along the rough texture, pooling in valleys, leaving stark white peaks at the tooth of the paper. The bloom still wet and glistening at the edges. Fine art print edition. Transform the original image into this Prussian blue watercolor world.',
    canvasWorldFallback: 'spirit',
  },
  {
    id: 'voronoi-earth',
    label: 'Voronoi Earth',
    emoji: '🏜️',
    tagline: 'Parched earth tessellation — aerial geometry',
    prompt: 'Aerial-view abstract of parched earth tessellated into irregular voronoi cells — each polygon section a slightly different tone of burnt sienna to pale sand, deep shadow cracks defining the boundaries. Two or three cells catching specular reflection from sun at low angle, the rest matte. National Geographic climate photography aesthetic. Apply this cracked earth voronoi aesthetic to the original image.',
    canvasWorldFallback: 'machine',
  },
  {
    id: 'smoke-architecture',
    label: 'Smoke Architecture',
    emoji: '🌫️',
    tagline: 'Ceremonial smoke forming vaulted columns',
    prompt: 'White ceremonial smoke rising against pure matte black in complex architectural columns — the wisps forming arched vaulted structures before dissolving into chaos at the top. Subsurface translucency visible where layers overlap. Long exposure, sharp at the base, motion blur at the crown. Museum fine art print series. Transform the original image into this monochrome smoke architecture world.',
    canvasWorldFallback: 'spirit',
  },
  {
    id: 'chromatic-fluid',
    label: 'Chromatic Fluid',
    emoji: '🌈',
    tagline: 'Oil film iridescence — rainbow interference',
    prompt: 'Oil film on water surface, backlit — iridescent rainbow interference patterns shifting from electric violet to acid yellow to deep teal across organic constantly morphing shapes. Slightly convex meniscus distorting reflections at the edges. Extreme close-up, fills frame. Cooper Hewitt design collection. Apply this chromatic iridescent fluid transformation to the original image.',
    canvasWorldFallback: 'crystal',
  },
];

export const ART_DIRECTION_MAP = Object.fromEntries(
  ART_DIRECTION_PRESETS.map((p) => [p.id, p])
);
