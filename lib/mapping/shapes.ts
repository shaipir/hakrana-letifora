// lib/mapping/shapes.ts
import { Point } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ShapeDefinition {
  id: string;
  name: string;
  category: 'hebrew' | 'latin' | 'geometric';
  path: string; // SVG path data
  viewBox: { width: number; height: number };
}

// ─── Hebrew Letters ───────────────────────────────────────────────────────────
// Each letter is a simplified stroke-based outline in ~100x120 viewBox.
// Paths are bold, geometric, and projection-friendly.

const HEBREW_LETTERS: ShapeDefinition[] = [
  {
    id: 'he-alef',
    name: 'אלף',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 L 80 60 L 50 60 L 50 100 L 20 100 M 50 60 L 80 100',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-bet',
    name: 'בית',
    category: 'hebrew',
    path: 'M 80 20 L 20 20 L 20 100 L 80 100 L 80 80 M 20 60 L 65 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-gimel',
    name: 'גימל',
    category: 'hebrew',
    path: 'M 80 20 L 20 20 L 20 80 L 50 120 M 20 60 L 60 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-dalet',
    name: 'דלת',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 L 80 100 M 20 20 L 20 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-he',
    name: 'הא',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 L 80 100 M 20 20 L 20 100 M 20 60 L 70 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-vav',
    name: 'וו',
    category: 'hebrew',
    path: 'M 50 20 L 50 100 M 40 20 L 60 20',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-zayin',
    name: 'זין',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 M 50 20 L 50 100',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-het',
    name: 'חית',
    category: 'hebrew',
    path: 'M 20 20 L 20 100 M 80 20 L 80 100 M 20 20 L 80 20 M 20 60 L 80 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-tet',
    name: 'טית',
    category: 'hebrew',
    path: 'M 20 100 L 20 20 L 80 20 L 80 100 L 20 100 M 50 40 L 50 80',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-yod',
    name: 'יוד',
    category: 'hebrew',
    path: 'M 50 20 L 60 20 L 60 60 L 50 70',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-kaf',
    name: 'כף',
    category: 'hebrew',
    path: 'M 80 20 L 20 20 L 20 100 L 80 100 L 80 60 M 20 60 L 65 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-lamed',
    name: 'למד',
    category: 'hebrew',
    path: 'M 20 10 L 20 80 L 80 80 L 80 120 M 20 40 L 60 40',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-mem',
    name: 'מם',
    category: 'hebrew',
    path: 'M 20 20 L 20 100 L 80 100 L 80 60 L 50 60 L 50 20 L 20 20',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-nun',
    name: 'נון',
    category: 'hebrew',
    path: 'M 20 20 L 20 100 M 20 20 L 70 20 L 70 80 L 20 100',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-samech',
    name: 'סמך',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 L 80 100 L 20 100 L 20 20 M 20 60 L 80 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-ayin',
    name: 'עין',
    category: 'hebrew',
    path: 'M 20 20 L 50 60 L 80 20 M 50 60 L 50 100 M 30 100 L 70 100',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-pe',
    name: 'פא',
    category: 'hebrew',
    path: 'M 80 20 L 20 20 L 20 70 L 80 70 L 80 20 M 50 70 L 50 100 M 40 100 L 70 100',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-tsadi',
    name: 'צדי',
    category: 'hebrew',
    path: 'M 20 20 L 50 60 L 80 20 M 50 60 L 50 100 L 20 120 M 50 100 L 80 120',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-qof',
    name: 'קוף',
    category: 'hebrew',
    path: 'M 80 20 L 20 20 L 20 100 M 80 20 L 80 120 M 20 60 L 80 60',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-resh',
    name: 'ריש',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 L 80 100 M 20 20 L 20 80',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-shin',
    name: 'שין',
    category: 'hebrew',
    path: 'M 50 20 L 50 70 L 20 100 M 50 70 L 80 100 M 20 20 L 80 20',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'he-tav',
    name: 'תו',
    category: 'hebrew',
    path: 'M 20 20 L 80 20 L 80 60 M 50 20 L 50 100 M 40 100 L 70 100 M 20 20 L 20 60',
    viewBox: { width: 100, height: 120 },
  },
];

// ─── Latin Letters ────────────────────────────────────────────────────────────

const LATIN_LETTERS: ShapeDefinition[] = [
  {
    id: 'lat-A',
    name: 'A',
    category: 'latin',
    path: 'M 50 10 L 10 110 M 50 10 L 90 110 M 25 70 L 75 70',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'lat-B',
    name: 'B',
    category: 'latin',
    path: 'M 20 10 L 20 110 M 20 10 L 70 10 L 80 30 L 70 55 L 20 55 M 20 55 L 75 55 L 85 78 L 75 110 L 20 110',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'lat-M',
    name: 'M',
    category: 'latin',
    path: 'M 10 110 L 10 10 L 50 70 L 90 10 L 90 110',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'lat-O',
    name: 'O',
    category: 'latin',
    path: 'M 50 10 L 80 20 L 95 50 L 90 80 L 70 110 L 50 115 L 30 110 L 10 80 L 5 50 L 20 20 L 50 10',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'lat-W',
    name: 'W',
    category: 'latin',
    path: 'M 5 10 L 20 110 L 50 60 L 80 110 L 95 10',
    viewBox: { width: 100, height: 120 },
  },
];

// ─── Geometric Shapes ─────────────────────────────────────────────────────────

const GEOMETRIC_SHAPES: ShapeDefinition[] = [
  {
    id: 'geo-rectangle',
    name: 'Rectangle',
    category: 'geometric',
    path: 'M 10 20 L 90 20 L 90 100 L 10 100 Z',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'geo-circle',
    name: 'Circle',
    category: 'geometric',
    // Approximated circle using many line segments
    path:
      'M 90 60 L 88 75 L 83 89 L 75 100 L 64 108 L 50 111 L 36 108 L 25 100 L 17 89 L 12 75 L 10 60 L 12 45 L 17 31 L 25 20 L 36 12 L 50 9 L 64 12 L 75 20 L 83 31 L 88 45 L 90 60 Z',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'geo-triangle',
    name: 'Triangle',
    category: 'geometric',
    path: 'M 50 10 L 95 110 L 5 110 Z',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'geo-hexagon',
    name: 'Hexagon',
    category: 'geometric',
    path: 'M 50 10 L 90 32 L 90 88 L 50 110 L 10 88 L 10 32 Z',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'geo-star',
    name: 'Star',
    category: 'geometric',
    path: 'M 50 8 L 61 38 L 93 38 L 67 57 L 77 88 L 50 68 L 23 88 L 33 57 L 7 38 L 39 38 Z',
    viewBox: { width: 100, height: 120 },
  },
  {
    id: 'geo-arch',
    name: 'Arch',
    category: 'geometric',
    path: 'M 10 110 L 10 60 L 15 40 L 25 25 L 38 15 L 50 10 L 62 15 L 75 25 L 85 40 L 90 60 L 90 110',
    viewBox: { width: 100, height: 120 },
  },
];

// ─── Combined Array ───────────────────────────────────────────────────────────

export const ALL_SHAPES: ShapeDefinition[] = [
  ...HEBREW_LETTERS,
  ...LATIN_LETTERS,
  ...GEOMETRIC_SHAPES,
];

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Filter shapes by category.
 */
export function getShapesByCategory(
  category: ShapeDefinition['category'],
): ShapeDefinition[] {
  return ALL_SHAPES.filter((s) => s.category === category);
}

/**
 * Extract Point[] from an SVG path string.
 * Parses M and L commands only. Applies a uniform scale factor.
 */
export function svgPathToPoints(path: string, scale: number = 1): Point[] {
  const points: Point[] = [];
  // Match M or L followed by two numbers
  const commandRegex = /[ML]\s*([\d.+-]+)\s*[,\s]\s*([\d.+-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = commandRegex.exec(path)) !== null) {
    const x = parseFloat(match[1]) * scale;
    const y = parseFloat(match[2]) * scale;
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  return points;
}
