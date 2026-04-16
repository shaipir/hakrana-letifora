'use client';

import { useState } from 'react';
import {
  Plus, Trash2, Copy, Eye, EyeOff, ChevronDown, ChevronRight,
  Scan, Square, Pentagon, Layers, ImageIcon,
} from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { GridFace, GridLayout, ShapeDetectionResult } from '@/lib/types';

// ─── Face row ──────────────────────────────────────────────────────────────────

function FaceRow({
  face, gridId, isActive,
}: {
  face: GridFace;
  gridId: string;
  isActive: boolean;
}) {
  const {
    project, setActiveFace, updateGridFace, removeGridFace,
  } = useArtReviveStore();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(face.name);

  const generatedAssets = project.generatedAssets;

  function commitName() {
    if (nameVal.trim()) updateGridFace(gridId, face.id, { name: nameVal.trim() });
    setEditingName(false);
  }

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer rounded text-xs transition-colors ${
        isActive ? 'bg-ar-accent/10 border border-ar-accent/30' : 'hover:bg-ar-border/30 border border-transparent'
      }`}
      onClick={() => setActiveFace(gridId, face.id)}
    >
      {/* Color swatch */}
      <span
        className="w-2.5 h-2.5 rounded-sm shrink-0 border border-white/20"
        style={{ background: face.color }}
      />

      {/* Name */}
      {editingName ? (
        <input
          autoFocus
          value={nameVal}
          onChange={(e) => setNameVal(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
          className="flex-1 bg-transparent outline-none text-ar-text min-w-0"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 truncate text-ar-text-muted"
          onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
        >
          {face.name}
        </span>
      )}

      {/* Asset indicator */}
      {face.assignedAssetId && (
        <span title="Has assigned content"><ImageIcon className="w-3 h-3 text-ar-accent shrink-0" /></span>
      )}

      {/* Visibility */}
      <button
        onClick={(e) => { e.stopPropagation(); updateGridFace(gridId, face.id, { visible: !face.visible }); }}
        className={`p-0.5 rounded transition-colors shrink-0 ${face.visible ? 'text-ar-text-dim hover:text-ar-text' : 'text-ar-text-dim/40'}`}
      >
        {face.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      </button>

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); removeGridFace(gridId, face.id); }}
        className="p-0.5 rounded text-ar-text-dim/40 hover:text-ar-neon-pink transition-colors shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Content assignment (shown when active) */}
      {isActive && generatedAssets.length > 0 && (
        <select
          value={face.assignedAssetId ?? ''}
          onChange={(e) => updateGridFace(gridId, face.id, { assignedAssetId: e.target.value || null })}
          onClick={(e) => e.stopPropagation()}
          className="mt-0 ml-auto text-[10px] bg-ar-surface border border-ar-border rounded px-1 py-0.5 text-ar-text-muted max-w-[90px]"
          title="Assign generated content to this face"
        >
          <option value="">— none —</option>
          {generatedAssets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.mode} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

// ─── Grid row ──────────────────────────────────────────────────────────────────

function GridRow({ grid }: { grid: GridLayout }) {
  const {
    project, setActiveGrid, updateGridLayout, removeGridLayout,
    duplicateGridLayout, addGridFace,
  } = useArtReviveStore();
  const [expanded, setExpanded] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(grid.name);
  const isActive = project.activeGridId === grid.id;

  function commitName() {
    if (nameVal.trim()) updateGridLayout(grid.id, { name: nameVal.trim() });
    setEditingName(false);
  }

  return (
    <div className={`border rounded mb-1.5 transition-colors ${isActive ? 'border-ar-accent/40 bg-ar-accent/5' : 'border-ar-border bg-ar-panel/30'}`}>
      {/* Header */}
      <div
        className="flex items-center gap-1 px-2 py-1.5 cursor-pointer"
        onClick={() => { setActiveGrid(grid.id); setExpanded(!expanded || !isActive || true); }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-ar-text-dim hover:text-ar-text p-0.5 transition-colors"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') setEditingName(false); }}
            className="flex-1 text-xs bg-transparent outline-none text-ar-text"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`flex-1 text-xs font-medium truncate ${isActive ? 'text-ar-accent' : 'text-ar-text'}`}
            onDoubleClick={(e) => { e.stopPropagation(); setEditingName(true); }}
          >
            {grid.name}
          </span>
        )}

        <span className="text-[10px] text-ar-text-dim shrink-0 mr-1">{grid.faces.length}f</span>

        {/* Blackout toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); updateGridLayout(grid.id, { blackoutOutside: !grid.blackoutOutside }); }}
          title={grid.blackoutOutside ? 'Blackout outside ON' : 'Blackout outside OFF'}
          className={`p-0.5 rounded transition-colors shrink-0 text-[9px] font-bold ${grid.blackoutOutside ? 'text-ar-neon-pink' : 'text-ar-text-dim/30 hover:text-ar-text-dim'}`}
        >
          ◼
        </button>

        {/* Visibility */}
        <button
          onClick={(e) => { e.stopPropagation(); updateGridLayout(grid.id, { visible: !grid.visible }); }}
          className={`p-0.5 rounded transition-colors shrink-0 ${grid.visible ? 'text-ar-text-dim hover:text-ar-text' : 'text-ar-text-dim/30'}`}
        >
          {grid.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </button>

        {/* Duplicate */}
        <button
          onClick={(e) => { e.stopPropagation(); duplicateGridLayout(grid.id); }}
          className="p-0.5 rounded text-ar-text-dim/40 hover:text-ar-text-dim transition-colors shrink-0"
        >
          <Copy className="w-3 h-3" />
        </button>

        {/* Delete */}
        <button
          onClick={(e) => { e.stopPropagation(); removeGridLayout(grid.id); }}
          className="p-0.5 rounded text-ar-text-dim/40 hover:text-ar-neon-pink transition-colors shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Faces list */}
      {expanded && (
        <div className="px-2 pb-2 space-y-0.5">
          {grid.faces.map((face) => (
            <FaceRow
              key={face.id}
              face={face}
              gridId={grid.id}
              isActive={isActive && grid.activeFaceId === face.id}
            />
          ))}

          {/* Add face buttons */}
          <div className="flex gap-1 mt-1.5">
            <button
              onClick={() => addGridFace(grid.id, {
                points: [
                  { x: 0.05, y: 0.05 }, { x: 0.45, y: 0.05 },
                  { x: 0.45, y: 0.45 }, { x: 0.05, y: 0.45 },
                ],
              })}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] border border-dashed border-ar-border/60 text-ar-text-dim hover:border-ar-accent/50 hover:text-ar-accent transition-colors"
            >
              <Square className="w-3 h-3" /> Rect
            </button>
            <button
              onClick={() => addGridFace(grid.id, {
                points: [
                  { x: 0.25, y: 0.05 }, { x: 0.45, y: 0.15 },
                  { x: 0.45, y: 0.45 }, { x: 0.25, y: 0.55 },
                  { x: 0.05, y: 0.45 }, { x: 0.05, y: 0.15 },
                ],
              })}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded text-[10px] border border-dashed border-ar-border/60 text-ar-text-dim hover:border-ar-accent/50 hover:text-ar-accent transition-colors"
            >
              <Pentagon className="w-3 h-3" /> Poly
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preset layouts ────────────────────────────────────────────────────────────

const PRESET_LAYOUTS: { label: string; faces: Array<{ name: string; points: Array<{ x: number; y: number }> }> }[] = [
  {
    label: 'Box (4-face)',
    faces: [
      { name: 'Front', points: [{ x: 0.25, y: 0.25 }, { x: 0.75, y: 0.25 }, { x: 0.75, y: 0.75 }, { x: 0.25, y: 0.75 }] },
      { name: 'Top', points: [{ x: 0.15, y: 0.1 }, { x: 0.85, y: 0.1 }, { x: 0.75, y: 0.25 }, { x: 0.25, y: 0.25 }] },
      { name: 'Left', points: [{ x: 0.05, y: 0.25 }, { x: 0.25, y: 0.25 }, { x: 0.25, y: 0.75 }, { x: 0.05, y: 0.75 }] },
      { name: 'Right', points: [{ x: 0.75, y: 0.25 }, { x: 0.95, y: 0.25 }, { x: 0.95, y: 0.75 }, { x: 0.75, y: 0.75 }] },
    ],
  },
  {
    label: 'Triptych (3 panels)',
    faces: [
      { name: 'Left Panel', points: [{ x: 0.02, y: 0.1 }, { x: 0.32, y: 0.1 }, { x: 0.32, y: 0.9 }, { x: 0.02, y: 0.9 }] },
      { name: 'Center Panel', points: [{ x: 0.35, y: 0.1 }, { x: 0.65, y: 0.1 }, { x: 0.65, y: 0.9 }, { x: 0.35, y: 0.9 }] },
      { name: 'Right Panel', points: [{ x: 0.68, y: 0.1 }, { x: 0.98, y: 0.1 }, { x: 0.98, y: 0.9 }, { x: 0.68, y: 0.9 }] },
    ],
  },
  {
    label: 'Grid 2×2',
    faces: [
      { name: 'Top-Left', points: [{ x: 0.02, y: 0.02 }, { x: 0.48, y: 0.02 }, { x: 0.48, y: 0.48 }, { x: 0.02, y: 0.48 }] },
      { name: 'Top-Right', points: [{ x: 0.52, y: 0.02 }, { x: 0.98, y: 0.02 }, { x: 0.98, y: 0.48 }, { x: 0.52, y: 0.48 }] },
      { name: 'Bot-Left', points: [{ x: 0.02, y: 0.52 }, { x: 0.48, y: 0.52 }, { x: 0.48, y: 0.98 }, { x: 0.02, y: 0.98 }] },
      { name: 'Bot-Right', points: [{ x: 0.52, y: 0.52 }, { x: 0.98, y: 0.52 }, { x: 0.98, y: 0.98 }, { x: 0.52, y: 0.98 }] },
    ],
  },
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function GridLayoutPanel() {
  const {
    project, addGridLayout, addGridFace,
  } = useArtReviveStore();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const FACE_COLORS = ['#00e5ff', '#bf5fff', '#ff6b6b', '#51cf66', '#ffd43b', '#ff922b', '#74c0fc', '#f783ac'];

  async function detectShapes() {
    if (!project.uploadedAsset) return;
    setIsDetecting(true);
    setDetectError(null);
    try {
      const res = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: project.uploadedAsset.url.split(',')[1],
          mimeType: project.uploadedAsset.mimeType,
        }),
      });
      if (!res.ok) throw new Error(`Detection failed: ${res.status}`);
      const data = await res.json();
      const regions: ShapeDetectionResult[] = data.regions ?? [];
      if (!regions.length) { setDetectError('No regions detected'); return; }

      // Create new grid from detected regions
      const newGridId = crypto.randomUUID();
      const faces: GridFace[] = regions.map((r, i) => ({
        id: crypto.randomUUID(),
        name: r.label || `Region ${i + 1}`,
        points: [
          { x: r.bbox.x, y: r.bbox.y },
          { x: r.bbox.x + r.bbox.width, y: r.bbox.y },
          { x: r.bbox.x + r.bbox.width, y: r.bbox.y + r.bbox.height },
          { x: r.bbox.x, y: r.bbox.y + r.bbox.height },
        ],
        color: FACE_COLORS[i % FACE_COLORS.length],
        assignedAssetId: null,
        visible: true,
        solo: false,
        warp: null,
      }));
      addGridLayout({
        id: newGridId,
        name: 'Detected Shapes',
        faces,
        activeFaceId: faces[0]?.id ?? null,
        blackoutOutside: false,
        visible: true,
      });
    } catch (e: any) {
      setDetectError(e?.message ?? 'Detection error');
    } finally {
      setIsDetecting(false);
    }
  }

  function applyPreset(preset: typeof PRESET_LAYOUTS[0]) {
    const colors = FACE_COLORS;
    const faces: GridFace[] = preset.faces.map((f, i) => ({
      id: crypto.randomUUID(),
      name: f.name,
      points: f.points,
      color: colors[i % colors.length],
      assignedAssetId: null,
      visible: true,
      solo: false,
      warp: null,
    }));
    addGridLayout({
      name: preset.label,
      faces,
      activeFaceId: faces[0]?.id ?? null,
      blackoutOutside: false,
      visible: true,
    });
    setShowPresets(false);
  }

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-ar-accent" />
          <span className="text-xs font-medium text-ar-text">Grid Layouts</span>
          {project.gridLayouts.length > 0 && (
            <span className="text-[9px] bg-ar-border text-ar-text-dim rounded px-1">
              {project.gridLayouts.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Detect shapes */}
          <button
            onClick={detectShapes}
            disabled={!project.uploadedAsset || isDetecting}
            title="Auto-detect projection surfaces from image"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40 text-ar-text-muted"
          >
            <Scan className={`w-3 h-3 ${isDetecting ? 'animate-pulse' : ''}`} />
            {isDetecting ? 'Detecting…' : 'Detect'}
          </button>

          {/* Add grid */}
          <button
            onClick={() => addGridLayout()}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border border-ar-accent/40 text-ar-accent hover:bg-ar-accent/10 transition-colors"
          >
            <Plus className="w-3 h-3" /> Grid
          </button>
        </div>
      </div>

      {/* Detect error */}
      {detectError && (
        <p className="text-[10px] text-ar-neon-pink">{detectError}</p>
      )}

      {/* Preset layouts */}
      <div>
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center gap-1 text-[10px] text-ar-text-dim hover:text-ar-text transition-colors"
        >
          {showPresets ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Preset Layouts
        </button>
        {showPresets && (
          <div className="mt-1.5 grid grid-cols-1 gap-1">
            {PRESET_LAYOUTS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-left px-2 py-1.5 rounded text-[10px] border border-ar-border bg-ar-surface hover:bg-ar-border hover:border-ar-accent/30 transition-colors text-ar-text-muted"
              >
                {p.label}
                <span className="ml-1 text-ar-text-dim">({p.faces.length} faces)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid list */}
      {project.gridLayouts.length === 0 ? (
        <div className="text-center py-6 text-ar-text-dim text-[10px] border border-dashed border-ar-border/30 rounded">
          No grids yet.<br />
          <span className="text-ar-text-dim/70">Add a grid or use Detect to find surfaces.</span>
        </div>
      ) : (
        <div>
          {project.gridLayouts.map((g) => (
            <GridRow key={g.id} grid={g} />
          ))}
        </div>
      )}

      {/* Hint */}
      {project.gridLayouts.length > 0 && (
        <p className="text-[9px] text-ar-text-dim/50 leading-relaxed">
          Double-click face name to rename. Assign generated images per face.
          ◼ = blackout outside faces.
        </p>
      )}
    </div>
  );
}
