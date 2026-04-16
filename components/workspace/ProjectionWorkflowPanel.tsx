'use client';

import { useState } from 'react';
import {
  ChevronDown, ChevronUp, Plus, Trash2, Copy, Eye, EyeOff,
  Square, Pentagon, Brush, RotateCcw, Grid3x3,
} from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { ProjectionMask, ProjectionZone, WarpPreset } from '@/lib/types';

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title, badge, children, defaultOpen = false,
}: { title: string; badge?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-ar-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-ar-border/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-widest uppercase text-ar-text-muted">{title}</span>
          {badge && (
            <span className="text-[10px] bg-ar-accent/15 text-ar-accent px-1.5 py-0.5 rounded font-mono">{badge}</span>
          )}
        </div>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-ar-text-dim" /> : <ChevronUp className="w-3.5 h-3.5 text-ar-text-dim" />}
      </button>
      {open && <div className="pb-3">{children}</div>}
    </div>
  );
}

// ─── 1. Projection Area / Mask ────────────────────────────────────────────────

function ProjectionMaskSection() {
  const { project, addProjectionMask, updateProjectionMask, removeProjectionMask, setActiveMask } = useArtReviveStore();
  const { projectionMasks, activeMaskId } = project;

  function createMask(type: ProjectionMask['type']) {
    const mask: ProjectionMask = {
      id: crypto.randomUUID(),
      type,
      points: [],
      feather: 0,
      inverted: false,
    };
    addProjectionMask(mask);
  }

  const activeMask = projectionMasks.find((m) => m.id === activeMaskId);

  return (
    <div className="px-4 space-y-3">
      {/* Tool buttons */}
      <div className="grid grid-cols-3 gap-1">
        {([
          { type: 'rectangle' as const, icon: <Square className="w-3.5 h-3.5" />, label: 'Rectangle' },
          { type: 'polygon' as const,   icon: <Pentagon className="w-3.5 h-3.5" />, label: 'Polygon' },
          { type: 'painted' as const,   icon: <Brush className="w-3.5 h-3.5" />, label: 'Paint' },
        ]).map(({ type, icon, label }) => (
          <button
            key={type}
            onClick={() => createMask(type)}
            className="flex flex-col items-center gap-1 py-2 rounded-md border border-ar-border bg-ar-surface hover:bg-ar-border/30 text-ar-text-muted hover:text-ar-text text-[10px] transition-colors"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Mask list */}
      {projectionMasks.length > 0 && (
        <div className="space-y-1">
          {projectionMasks.map((mask) => (
            <div
              key={mask.id}
              onClick={() => setActiveMask(mask.id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md border cursor-pointer transition-colors ${
                activeMaskId === mask.id
                  ? 'bg-ar-accent/10 border-ar-accent/40 text-ar-accent'
                  : 'bg-ar-surface border-ar-border text-ar-text-muted hover:text-ar-text'
              }`}
            >
              <span className="text-xs flex-1 truncate capitalize">{mask.type} mask</span>
              <button
                onClick={(e) => { e.stopPropagation(); updateProjectionMask(mask.id, { inverted: !mask.inverted }); }}
                title="Invert mask"
                className="text-ar-text-dim hover:text-ar-text transition-colors p-0.5"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeProjectionMask(mask.id); }}
                className="text-ar-text-dim hover:text-ar-neon-pink transition-colors p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active mask controls */}
      {activeMask && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ar-text-muted w-24 shrink-0">Feather Edge</span>
            <input
              type="range" min={0} max={50} step={1}
              value={activeMask.feather}
              onChange={(e) => updateProjectionMask(activeMask.id, { feather: Number(e.target.value) })}
              className="flex-1 accent-ar-accent h-1"
            />
            <span className="text-xs text-ar-text-dim w-8 text-right">{activeMask.feather}px</span>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => updateProjectionMask(activeMask.id, { inverted: !activeMask.inverted })}
              className={`flex-1 py-1.5 rounded border text-xs transition-colors ${
                activeMask.inverted
                  ? 'bg-ar-violet/15 border-ar-violet/40 text-ar-violet'
                  : 'border-ar-border text-ar-text-muted hover:text-ar-text'
              }`}
            >
              Invert Mask
            </button>
            <button
              onClick={() => updateProjectionMask(activeMask.id, { points: [] })}
              className="flex-1 py-1.5 rounded border border-ar-border text-xs text-ar-text-muted hover:text-ar-text transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {projectionMasks.length === 0 && (
        <p className="text-[10px] text-ar-text-dim text-center py-2">
          Draw a mask to restrict the projection area
        </p>
      )}
    </div>
  );
}

// ─── 2. Object Isolation ──────────────────────────────────────────────────────

function ObjectIsolationSection() {
  const { project, updateObjectIsolation } = useArtReviveStore();
  const iso = project.objectIsolation;

  return (
    <div className="px-4 space-y-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-ar-text-muted">Object Isolation</span>
        <button
          onClick={() => updateObjectIsolation({ enabled: !iso.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${iso.enabled ? 'bg-ar-accent' : 'bg-ar-border'}`}
        >
          <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${iso.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {iso.enabled && (
        <>
          {/* Background treatment */}
          <div>
            <span className="text-xs text-ar-text-muted block mb-1.5">Background Treatment</span>
            <div className="flex rounded border border-ar-border overflow-hidden text-xs">
              {([
                { value: 'blackout', label: 'Blackout' },
                { value: 'darken',   label: 'Darken' },
                { value: 'hide',     label: 'Hide' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateObjectIsolation({ backgroundMode: value })}
                  className={`flex-1 py-1.5 transition-colors ${
                    iso.backgroundMode === value
                      ? 'bg-ar-accent/20 text-ar-accent'
                      : 'text-ar-text-muted hover:text-ar-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {iso.backgroundMode === 'darken' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ar-text-muted w-24 shrink-0">Darken Amount</span>
              <input
                type="range" min={0} max={1} step={0.05}
                value={iso.darkenAmount}
                onChange={(e) => updateObjectIsolation({ darkenAmount: parseFloat(e.target.value) })}
                className="flex-1 accent-ar-accent h-1"
              />
              <span className="text-xs text-ar-text-dim w-8 text-right">{Math.round(iso.darkenAmount * 100)}%</span>
            </div>
          )}

          {/* Object region count */}
          <div className="flex items-center justify-between text-xs text-ar-text-dim">
            <span>{iso.regions.length} object{iso.regions.length !== 1 ? 's' : ''} selected</span>
            {iso.regions.length > 0 && (
              <button
                onClick={() => updateObjectIsolation({ regions: [] })}
                className="text-ar-text-dim hover:text-ar-neon-pink transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <p className="text-[10px] text-ar-text-dim">
            Use the canvas selection tools to click objects to isolate. Everything else will be {iso.backgroundMode === 'blackout' ? 'blacked out' : iso.backgroundMode === 'darken' ? 'darkened' : 'hidden'}.
          </p>
        </>
      )}
    </div>
  );
}

// ─── 3. Projection Zones ──────────────────────────────────────────────────────

function ProjectionZonesSection() {
  const {
    project, addProjectionZone, updateProjectionZone,
    removeProjectionZone, setActiveZone, duplicateProjectionZone,
  } = useArtReviveStore();
  const { projectionZones, activeZoneId } = project;

  return (
    <div className="px-4 space-y-2">
      {projectionZones.map((zone) => (
        <div
          key={zone.id}
          className={`rounded-md border transition-colors ${
            activeZoneId === zone.id
              ? 'border-ar-accent/50 bg-ar-accent/5'
              : 'border-ar-border bg-ar-surface'
          }`}
        >
          <div
            className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
            onClick={() => setActiveZone(zone.id)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); updateProjectionZone(zone.id, { visible: !zone.visible }); }}
              className="text-ar-text-dim hover:text-ar-text transition-colors"
            >
              {zone.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <input
              type="text"
              value={zone.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateProjectionZone(zone.id, { name: e.target.value })}
              className="flex-1 text-xs bg-transparent text-ar-text focus:outline-none min-w-0"
            />
            <button
              onClick={(e) => { e.stopPropagation(); duplicateProjectionZone(zone.id); }}
              className="text-ar-text-dim hover:text-ar-text transition-colors p-0.5"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeProjectionZone(zone.id); }}
              className="text-ar-text-dim hover:text-ar-neon-pink transition-colors p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={() => addProjectionZone()}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md border border-dashed border-ar-border text-xs text-ar-text-muted hover:text-ar-text hover:border-ar-accent/40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Projection Zone
      </button>

      {projectionZones.length === 0 && (
        <p className="text-[10px] text-ar-text-dim text-center py-1">
          Split the output into independent projection zones for multi-projector setups
        </p>
      )}

      {projectionZones.length > 1 && (
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={() => projectionZones.forEach((z) => updateProjectionZone(z.id, { visible: true }))}
            className="flex-1 py-1 rounded border border-ar-border text-[10px] text-ar-text-muted hover:text-ar-text transition-colors"
          >
            Show All
          </button>
          <button
            onClick={() => {
              projectionZones.forEach((z) =>
                updateProjectionZone(z.id, { visible: z.id === activeZoneId })
              );
            }}
            className="flex-1 py-1 rounded border border-ar-border text-[10px] text-ar-text-muted hover:text-ar-text transition-colors"
          >
            Solo Active
          </button>
        </div>
      )}
    </div>
  );
}

// ─── 4. Projection Warp ───────────────────────────────────────────────────────

function ProjectionWarpSection() {
  const { project, updateWarpSettings, addWarpPreset, removeWarpPreset, applyWarpPreset, resetWarp } = useArtReviveStore();
  const warp = project.warpSettings;
  const [presetName, setPresetName] = useState('');

  function savePreset() {
    if (!presetName.trim()) return;
    const preset: WarpPreset = {
      id: crypto.randomUUID(),
      name: presetName.trim(),
      type: warp.mode,
      points: warp.mode === 'corner-pin' ? [
        warp.cornerPin.topLeft,
        warp.cornerPin.topRight,
        warp.cornerPin.bottomLeft,
        warp.cornerPin.bottomRight,
      ] : undefined,
      meshGrid: warp.mode === 'mesh' && warp.meshGrid ? warp.meshGrid : undefined,
    };
    addWarpPreset(preset);
    setPresetName('');
  }

  return (
    <div className="px-4 space-y-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-ar-text-muted">Surface Mapping</span>
        <button
          onClick={() => updateWarpSettings({ enabled: !warp.enabled })}
          className={`w-9 h-5 rounded-full transition-colors relative ${warp.enabled ? 'bg-ar-accent' : 'bg-ar-border'}`}
        >
          <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${warp.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {warp.enabled && (
        <>
          {/* Warp mode */}
          <div>
            <span className="text-xs text-ar-text-muted block mb-1.5">Mapping Type</span>
            <div className="flex rounded border border-ar-border overflow-hidden text-xs">
              {([
                { value: 'corner-pin',  label: 'Corner Pin' },
                { value: 'perspective', label: 'Perspective' },
                { value: 'mesh',        label: 'Mesh Warp' },
              ] as const).map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => updateWarpSettings({ mode: value })}
                  className={`flex-1 py-1.5 transition-colors ${
                    warp.mode === value
                      ? 'bg-ar-accent/20 text-ar-accent'
                      : 'text-ar-text-muted hover:text-ar-text'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Corner pin info */}
          {warp.mode === 'corner-pin' && (
            <p className="text-[10px] text-ar-text-dim">
              Drag the 4 corner handles on the canvas to fit the projection to your target surface.
            </p>
          )}

          {/* Mesh warp config */}
          {warp.mode === 'mesh' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Grid3x3 className="w-3.5 h-3.5 text-ar-text-dim" />
                <span className="text-xs text-ar-text-muted">Grid</span>
                <div className="flex items-center gap-1 ml-auto">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateWarpSettings({ meshCols: n, meshRows: n, meshGrid: null })}
                      className={`w-6 h-6 rounded text-[10px] border transition-colors ${
                        warp.meshCols === n
                          ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent'
                          : 'border-ar-border text-ar-text-dim hover:text-ar-text'
                      }`}
                    >
                      {n}×{n}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-ar-text-dim">
                Drag grid control points on the canvas to warp the output onto curved or angled surfaces.
              </p>
            </div>
          )}

          {/* Warp reset */}
          <button
            onClick={resetWarp}
            className="w-full py-1.5 rounded border border-ar-border text-xs text-ar-text-muted hover:text-ar-text hover:border-ar-accent/30 transition-colors"
          >
            Reset Mapping
          </button>

          {/* Save preset */}
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Preset name…"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') savePreset(); }}
              className="flex-1 bg-ar-surface border border-ar-border rounded px-2 py-1 text-xs text-ar-text placeholder:text-ar-text-dim focus:outline-none focus:border-ar-accent/60"
            />
            <button
              onClick={savePreset}
              disabled={!presetName.trim()}
              className="px-3 py-1 rounded border border-ar-border text-xs text-ar-text-muted hover:text-ar-text transition-colors disabled:opacity-40"
            >
              Save
            </button>
          </div>

          {/* Saved presets */}
          {warp.presets.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-ar-text-dim uppercase tracking-widest">Saved Presets</span>
              {warp.presets.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <button
                    onClick={() => applyWarpPreset(p.id)}
                    className={`flex-1 text-left px-2 py-1 rounded text-xs border transition-colors ${
                      warp.activePresetId === p.id
                        ? 'bg-ar-accent/15 border-ar-accent/40 text-ar-accent'
                        : 'border-ar-border text-ar-text-muted hover:text-ar-text'
                    }`}
                  >
                    {p.name}
                    <span className="ml-1 text-[10px] text-ar-text-dim capitalize">({p.type})</span>
                  </button>
                  <button
                    onClick={() => removeWarpPreset(p.id)}
                    className="text-ar-text-dim hover:text-ar-neon-pink transition-colors p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function ProjectionWorkflowPanel() {
  const { project } = useArtReviveStore();
  const hasResult = project.generatedAssets.length > 0;

  if (!hasResult) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-2">
        <p className="text-xs text-ar-text-dim">
          Generate a result first to access projection workflow tools.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-y-auto">
      <Section
        title="Projection Area"
        badge={project.projectionMasks.length > 0 ? `${project.projectionMasks.length}` : undefined}
      >
        <ProjectionMaskSection />
      </Section>

      <Section title="Object Isolation" badge={project.objectIsolation.enabled ? 'ON' : undefined}>
        <ObjectIsolationSection />
      </Section>

      <Section
        title="Projection Zones"
        badge={project.projectionZones.length > 0 ? `${project.projectionZones.length}` : undefined}
      >
        <ProjectionZonesSection />
      </Section>

      <Section title="Surface Mapping" badge={project.warpSettings.enabled ? 'ON' : undefined}>
        <ProjectionWarpSection />
      </Section>
    </div>
  );
}
