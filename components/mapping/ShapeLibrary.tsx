'use client';

// components/mapping/ShapeLibrary.tsx
import { useState } from 'react';
import { useMappingStore } from '@/lib/mapping-store';
import {
  ALL_SHAPES,
  getShapesByCategory,
  svgPathToPoints,
  ShapeDefinition,
} from '@/lib/mapping/shapes';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_SURFACES = 4;

type Category = ShapeDefinition['category'];

const CATEGORY_TABS: { id: Category; label: string }[] = [
  { id: 'hebrew', label: 'עברית' },
  { id: 'latin', label: 'Latin' },
  { id: 'geometric', label: 'Shapes' },
];

// ─── ShapeButton ──────────────────────────────────────────────────────────────

interface ShapeButtonProps {
  shape: ShapeDefinition;
  disabled: boolean;
  onClick: (shape: ShapeDefinition) => void;
}

function ShapeButton({ shape, disabled, onClick }: ShapeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(shape)}
      title={shape.name}
      className={[
        'flex flex-col items-center justify-center gap-1 rounded-lg border p-2 transition-colors',
        disabled
          ? 'cursor-not-allowed border-ar-700/30 opacity-40'
          : 'cursor-pointer border-ar-600/40 hover:border-ar-400 hover:bg-ar-800/60 active:scale-95',
      ].join(' ')}
    >
      <svg
        viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
        className="h-10 w-10"
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={shape.path} />
      </svg>
      <span className="max-w-full truncate text-center text-[10px] leading-tight text-ar-300">
        {shape.name}
      </span>
    </button>
  );
}

// ─── ShapeLibrary ─────────────────────────────────────────────────────────────

export function ShapeLibrary() {
  const [activeCategory, setActiveCategory] = useState<Category>('hebrew');

  const surfaces = useMappingStore((s) => s.project.surfaces);
  const isAtLimit = surfaces.length >= MAX_SURFACES;

  if (isAtLimit) {
    console.log('[MAPPING:ShapeLibrary] Max surfaces reached:', surfaces.length, '/', MAX_SURFACES);
  }

  const shapes = getShapesByCategory(activeCategory);

  function handleShapeClick(shape: ShapeDefinition) {
    if (isAtLimit) {
      console.warn('[MAPPING:ShapeLibrary] Max surfaces reached (', MAX_SURFACES, ') — cannot add shape:', shape.name);
      return;
    }

    console.log('[MAPPING:ShapeLibrary] Shape selected:', shape.id, shape.name, 'category:', shape.category);

    try {
      const store = useMappingStore.getState();
      // Capture length before adding so we can identify the new surface
      const prevCount = store.project.surfaces.length;

      store.addSurface();

      // After addSurface the new surface is the last one
      const updatedSurfaces = useMappingStore.getState().project.surfaces;
      if (updatedSurfaces.length <= prevCount) {
        console.error('[MAPPING:ShapeLibrary] addSurface did not add a new surface — limit may have been hit inside store');
        return; // guard: limit hit inside store
      }

      const newSurface = updatedSurfaces[updatedSurfaces.length - 1];
      console.log('[MAPPING:ShapeLibrary] New surface created:', newSurface.id, '— applying shape outline');

      const points = svgPathToPoints(shape.path, 4);
      store.updateSurface(newSurface.id, {
        name: shape.name,
        outline: {
          type: 'shape',
          path: shape.path,
          points,
        },
      });
    } catch (err) {
      console.error('[MAPPING:ShapeLibrary] Error during shape selection:', shape.id, shape.name, err);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ar-700/40 bg-ar-900/80 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ar-100">Shape Library</span>
        <span className="text-xs text-ar-400">
          {surfaces.length}/{MAX_SURFACES} surfaces
        </span>
      </div>

      {/* Limit warning */}
      {isAtLimit && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-300">
          Max {MAX_SURFACES} surfaces reached
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex gap-1 rounded-lg bg-ar-800/50 p-1">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategory(tab.id)}
            className={[
              'flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors',
              activeCategory === tab.id
                ? 'bg-ar-600 text-ar-50 shadow'
                : 'text-ar-400 hover:text-ar-200',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Shape Grid */}
      <div className="grid grid-cols-5 gap-2">
        {shapes.map((shape) => (
          <ShapeButton
            key={shape.id}
            shape={shape}
            disabled={isAtLimit}
            onClick={handleShapeClick}
          />
        ))}
      </div>
    </div>
  );
}

export default ShapeLibrary;
