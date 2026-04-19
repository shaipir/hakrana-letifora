'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Maximize2, Columns2, Layers, Crosshair, Grid, Sun, Square, X, Crop } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { UploadedAsset, GridLayout, SelectedRegion } from '@/lib/types';
import LoopPlayer from '@/components/canvas/LoopPlayer';

// ─── Grid Face SVG Overlay ────────────────────────────────────────────────────

function GridFaceOverlay({ gridLayouts, activeGridId }: { gridLayouts: GridLayout[]; activeGridId: string | null }) {
  const visibleGrids = gridLayouts.filter((g) => g.visible);
  if (!visibleGrids.length) return null;
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet" style={{ zIndex: 10 }}>
      {visibleGrids.map((grid) =>
        grid.faces.filter((f) => f.visible).map((face) => {
          const pts = face.points.map((p) => `${p.x},${p.y}`).join(' ');
          const isActive = grid.id === activeGridId && grid.activeFaceId === face.id;
          const cx = face.points.reduce((s, p) => s + p.x, 0) / face.points.length;
          const cy = face.points.reduce((s, p) => s + p.y, 0) / face.points.length;
          return (
            <g key={face.id}>
              <polygon points={pts} fill={face.color} fillOpacity={isActive ? 0.18 : 0.08}
                stroke={face.color} strokeWidth={isActive ? 0.005 : 0.003}
                strokeOpacity={isActive ? 0.9 : 0.55}
                strokeDasharray={isActive ? undefined : '0.015 0.008'} />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                fontSize="0.022" fill={face.color} fillOpacity={isActive ? 1 : 0.6}
                style={{ fontFamily: 'monospace', pointerEvents: 'none' }}>
                {face.name}
              </text>
            </g>
          );
        })
      )}
    </svg>
  );
}

// ─── Selection overlay ────────────────────────────────────────────────────────

type DrawMode = 'off' | 'rect';

interface DragState { startX: number; startY: number; curX: number; curY: number; active: boolean }

function getImageBounds(imgEl: HTMLImageElement): { left: number; top: number; width: number; height: number } {
  const rect = imgEl.getBoundingClientRect();
  const natW = imgEl.naturalWidth || 1;
  const natH = imgEl.naturalHeight || 1;
  const elW = rect.width;
  const elH = rect.height;
  const scale = Math.min(elW / natW, elH / natH);
  const rendW = natW * scale;
  const rendH = natH * scale;
  return {
    left: rect.left + (elW - rendW) / 2,
    top: rect.top + (elH - rendH) / 2,
    width: rendW,
    height: rendH,
  };
}

type CompareMode = 'single' | 'side-by-side' | 'slider';

export default function CanvasArea() {
  const {
    project, activeMode,
    isGenerating, isGeneratingLoop, generateError,
    isUploading, uploadError,
    setUploadedAsset, setUploading, setUploadError,
    selectedResultId, generatedLoop,
    updateReferenceProjection,
    setSelectedRegion,
  } = useArtReviveStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('single');
  const [sliderPos, setSliderPos] = useState(50);
  const [drawMode, setDrawMode] = useState<DrawMode>('off');
  const [drag, setDrag] = useState<DragState>({ startX: 0, startY: 0, curX: 0, curY: 0, active: false });

  const refProj = project.referenceProjection;
  const selectedResult = project.generatedAssets.find((a) => a.id === selectedResultId);
  const source = project.uploadedAsset;
  const displayUrl = showOriginal ? source?.url : selectedResult?.url ?? source?.url;
  const isLoadingAny = isGenerating || isGeneratingLoop;
  const selection = project.selectedRegion;

  // ── Upload ──────────────────────────────────────────────────────────────────

  async function uploadFile(file: File) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) { setUploadError('Unsupported type. Use JPEG, PNG, WebP or GIF.'); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError('File too large. Max 20 MB.'); return; }
    setUploading(true); setUploadError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file);
      });
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = dataUrl;
      });
      const asset: UploadedAsset = { id: crypto.randomUUID(), url: dataUrl, originalName: file.name, mimeType: file.type, width: dims.w, height: dims.h, uploadedAt: new Date().toISOString() };
      setUploadedAsset(asset);
      setSelectedRegion(null);
    } catch (err: any) { setUploadError(err?.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  }

  // ── Selection drawing ───────────────────────────────────────────────────────

  function toNorm(clientX: number, clientY: number) {
    const img = imgRef.current;
    if (!img) return null;
    const b = getImageBounds(img);
    const nx = Math.max(0, Math.min(1, (clientX - b.left) / b.width));
    const ny = Math.max(0, Math.min(1, (clientY - b.top) / b.height));
    return { nx, ny };
  }

  function onPointerDown(e: React.PointerEvent) {
    if (drawMode !== 'rect' || !imgRef.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const n = toNorm(e.clientX, e.clientY);
    if (!n) return;
    setDrag({ startX: n.nx, startY: n.ny, curX: n.nx, curY: n.ny, active: true });
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.active) return;
    const n = toNorm(e.clientX, e.clientY);
    if (!n) return;
    setDrag((d) => ({ ...d, curX: n.nx, curY: n.ny }));
  }

  function onPointerUp() {
    if (!drag.active) return;
    const x = Math.min(drag.startX, drag.curX);
    const y = Math.min(drag.startY, drag.curY);
    const w = Math.abs(drag.curX - drag.startX);
    const h = Math.abs(drag.curY - drag.startY);
    if (w > 0.01 && h > 0.01) {
      setSelectedRegion({ x, y, width: w, height: h });
    }
    setDrag((d) => ({ ...d, active: false }));
    setDrawMode('off');
  }

  // Compute live drag rect in % for SVG overlay
  const liveRect = drag.active ? {
    x: Math.min(drag.startX, drag.curX) * 100,
    y: Math.min(drag.startY, drag.curY) * 100,
    w: Math.abs(drag.curX - drag.startX) * 100,
    h: Math.abs(drag.curY - drag.startY) * 100,
  } : null;

  // ── Image wrapper with overlays ─────────────────────────────────────────────

  function ImageWithOverlays({ url, alt }: { url: string; alt: string }) {
    const cursor = drawMode === 'rect' ? 'crosshair' : 'default';
    return (
      <div
        className="relative select-none"
        style={{ cursor, userSelect: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={url}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-sm animate-fade-in"
          style={{
            maxWidth: '80vw', maxHeight: '70vh',
            boxShadow: selectedResult ? '0 0 60px rgba(0,0,0,0.8)' : '0 8px 40px rgba(0,0,0,0.5)',
            pointerEvents: drawMode === 'rect' ? 'none' : 'auto',
          }}
          draggable={false}
        />

        {/* Selection SVG overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Committed selection */}
          {selection && !drag.active && (
            <>
              {/* Dimming outside selection */}
              <defs>
                <mask id="sel-mask">
                  <rect width="100" height="100" fill="white" />
                  <rect x={selection.x * 100} y={selection.y * 100} width={selection.width * 100} height={selection.height * 100} fill="black" />
                </mask>
              </defs>
              <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#sel-mask)" />
              <rect
                x={selection.x * 100} y={selection.y * 100}
                width={selection.width * 100} height={selection.height * 100}
                fill="none" stroke="#00e5ff" strokeWidth="0.5"
                strokeDasharray="2 1.5"
              />
              {/* Corner marks */}
              {[
                [selection.x * 100, selection.y * 100],
                [(selection.x + selection.width) * 100, selection.y * 100],
                [selection.x * 100, (selection.y + selection.height) * 100],
                [(selection.x + selection.width) * 100, (selection.y + selection.height) * 100],
              ].map(([cx, cy], i) => (
                <g key={i}>
                  <line x1={cx - 1.5} y1={cy} x2={cx + 1.5} y2={cy} stroke="#00e5ff" strokeWidth="0.6" />
                  <line x1={cx} y1={cy - 1.5} x2={cx} y2={cy + 1.5} stroke="#00e5ff" strokeWidth="0.6" />
                </g>
              ))}
            </>
          )}
          {/* Live drag rect */}
          {liveRect && (
            <rect x={liveRect.x} y={liveRect.y} width={liveRect.w} height={liveRect.h}
              fill="rgba(0,229,255,0.08)" stroke="#00e5ff" strokeWidth="0.5" strokeDasharray="2 1.5" />
          )}
        </svg>

        {/* Grid face overlay */}
        {project.gridLayouts.length > 0 && (
          <GridFaceOverlay gridLayouts={project.gridLayouts} activeGridId={project.activeGridId} />
        )}

        {/* Selection badge */}
        {selection && !drag.active && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/75 border border-ar-accent/40 rounded px-1.5 py-0.5 z-20">
            <Crop className="w-3 h-3 text-ar-accent" />
            <span className="text-[10px] text-ar-accent font-mono">
              {Math.round(selection.width * 100)}×{Math.round(selection.height * 100)}%
            </span>
            <button onClick={(e) => { e.stopPropagation(); setSelectedRegion(null); }}
              className="ml-0.5 text-ar-text-dim hover:text-ar-neon-pink transition-colors">
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <main
      className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-ar-bg transition-all ${isDragging ? 'ring-2 ring-inset ring-ar-accent' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Empty state */}
      {!source && !isUploading && (
        <div className="relative w-56 h-56 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-ar-border/40 group-hover:border-ar-accent/70 transition-colors" />
          <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-ar-border/40 group-hover:border-ar-accent/70 transition-colors" />
          <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-ar-border/40 group-hover:border-ar-accent/70 transition-colors" />
          <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-ar-border/40 group-hover:border-ar-accent/70 transition-colors" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Upload className="w-6 h-6 text-ar-text-dim group-hover:text-ar-accent/60 transition-colors" />
            <div className="text-center">
              <p className="text-ar-text text-xs font-medium tracking-wide">Drop source image</p>
              <p className="text-ar-text-dim text-[10px] mt-1.5 tracking-[0.12em] uppercase">JPEG · PNG · WebP · 20MB</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
        </div>
      )}

      {isUploading && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ar-border border-t-ar-accent rounded-full animate-spin" />
          <span className="text-ar-text-muted text-sm">Loading image...</span>
        </div>
      )}

      {(uploadError || generateError) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ar-panel border border-ar-neon-pink/40 rounded-lg px-4 py-2 text-xs text-ar-neon-pink max-w-md text-center z-10">
          {uploadError ?? generateError}
        </div>
      )}

      {/* Reference Projection mode */}
      {source && refProj.active && !isLoadingAny && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-ar-border/60 rounded-full px-2 py-1.5">
            {(['original', 'transformed', 'overlay'] as const).map((vm) => (
              <button key={vm} onClick={() => updateReferenceProjection({ viewMode: vm })}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors capitalize ${refProj.viewMode === vm ? 'bg-ar-accent text-black' : 'text-ar-text-muted hover:text-ar-text'}`}>
                {vm}
              </button>
            ))}
            <div className="w-px h-4 bg-ar-border mx-1" />
            <Sun className="w-3 h-3 text-ar-text-dim shrink-0" />
            <input type="range" min={0.2} max={2} step={0.05} value={refProj.brightness}
              onChange={(e) => updateReferenceProjection({ brightness: parseFloat(e.target.value) })}
              className="w-20 accent-ar-accent h-1" />
            <div className="w-px h-4 bg-ar-border mx-1" />
            <button onClick={() => updateReferenceProjection({ showGrid: !refProj.showGrid })}
              className={`p-1 rounded transition-colors ${refProj.showGrid ? 'text-ar-accent' : 'text-ar-text-dim hover:text-ar-text'}`}>
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => updateReferenceProjection({ showCornerMarkers: !refProj.showCornerMarkers })}
              className={`p-1 rounded transition-colors ${refProj.showCornerMarkers ? 'text-ar-accent' : 'text-ar-text-dim hover:text-ar-text'}`}>
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-ar-border mx-1" />
            <button onClick={() => updateReferenceProjection({ active: false })}
              className="px-2 py-0.5 rounded text-[10px] text-ar-neon-pink/80 hover:text-ar-neon-pink border border-ar-neon-pink/30 hover:border-ar-neon-pink/60 transition-colors">
              Exit
            </button>
          </div>
          <div className="relative" style={{ maxWidth: '80vw', maxHeight: '70vh' }}>
            {refProj.viewMode === 'overlay' && selectedResult ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedResult.url} alt="Transformed" className="max-w-full max-h-full object-contain rounded-sm"
                  style={{ maxWidth: '80vw', maxHeight: '70vh', filter: `brightness(${refProj.brightness})` }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={source.url} alt="Original overlay" className="absolute inset-0 max-w-full max-h-full object-contain"
                  style={{ opacity: refProj.opacity, mixBlendMode: 'screen', filter: `brightness(${refProj.brightness})` }} />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={refProj.viewMode === 'transformed' && selectedResult ? selectedResult.url : source.url}
                alt="Reference projection" className="max-w-full max-h-full object-contain rounded-sm"
                style={{ maxWidth: '80vw', maxHeight: '70vh', filter: `brightness(${refProj.brightness})` }} />
            )}
            {refProj.showGrid && (
              <div className="absolute inset-0 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.15) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
            )}
          </div>
          {refProj.viewMode === 'overlay' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1.5 border border-ar-border/40">
              <span className="text-[10px] text-ar-text-dim">Overlay</span>
              <input type="range" min={0} max={1} step={0.05} value={refProj.opacity}
                onChange={(e) => updateReferenceProjection({ opacity: parseFloat(e.target.value) })}
                className="w-24 accent-ar-accent h-1" />
              <span className="text-[10px] text-ar-text-dim">{Math.round(refProj.opacity * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Loop player */}
      {source && !refProj.active && generatedLoop && generatedLoop.frames.length > 0 && !isLoadingAny && (
        <div className="w-full h-full flex flex-col relative">
          <button onClick={() => useArtReviveStore.getState().setGeneratedLoop(null)}
            className="absolute top-3 left-3 z-20 px-2 py-0.5 rounded text-[10px] bg-black/70 border border-ar-border/60 text-ar-text-dim hover:text-ar-text transition-colors">
            ← Stills
          </button>
          <LoopPlayer frames={generatedLoop.frames} fps={10} autoPlay
            bpmSync={project.loopSettings.bpmSync}
            transitionMode={project.loopSettings.transitionMode}
            blendAmount={project.loopSettings.blendAmount} />
        </div>
      )}

      {/* Still image display */}
      {source && !refProj.active && !generatedLoop && (
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoadingAny ? (
            <div className="relative rounded-sm overflow-hidden border border-ar-border/30 bg-ar-panel/40"
              style={{ width: Math.min(source.width || 600, 800), height: Math.min(source.height || 400, 600), maxWidth: '80vw', maxHeight: '70vh' }}>
              <div className={`absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-ar-accent to-transparent animate-scanline opacity-80 ${activeMode === 'restyle' ? 'via-ar-violet' : activeMode === 'glow-sculpture' ? 'via-ar-accent' : 'via-orange-400'}`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className={`w-5 h-5 border border-ar-border/60 rounded-full animate-spin ${activeMode === 'restyle' ? 'border-t-ar-violet' : activeMode === 'glow-sculpture' ? 'border-t-ar-accent' : 'border-t-orange-400'}`} />
                <span className="text-ar-text-dim text-[10px] tracking-[0.2em] uppercase">
                  {isGeneratingLoop ? 'Building Loop' : 'Generating'}
                </span>
              </div>
            </div>
          ) : compareMode === 'side-by-side' && selectedResult ? (
            <div className="flex gap-2 w-full h-full items-center justify-center px-4">
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-ar-text-muted">Original</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={source.url} alt="Original" className="max-w-full max-h-full object-contain rounded-sm" style={{ maxHeight: '60vh' }} />
              </div>
              <div className="w-px h-full bg-ar-border" />
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-ar-text-muted">Result</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedResult.url} alt="Result" className="max-w-full max-h-full object-contain rounded-sm" style={{ maxHeight: '60vh' }} />
              </div>
            </div>
          ) : compareMode === 'slider' && selectedResult ? (
            <div className="relative" style={{ maxWidth: '80vw', maxHeight: '70vh' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.url} alt="Original" className="max-w-full max-h-full object-contain rounded-sm" style={{ maxWidth: '80vw', maxHeight: '70vh' }} />
              <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedResult.url} alt="Result" className="max-w-full max-h-full object-contain" style={{ maxWidth: '80vw', maxHeight: '70vh' }} />
              </div>
              <div className="absolute inset-0 flex items-center" style={{ left: `${sliderPos}%`, width: '2px', background: 'white', opacity: 0.8 }} />
              <input type="range" min={0} max={100} value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
              <div className="absolute top-2 left-2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Before</div>
              <div className="absolute top-2 right-2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">After</div>
            </div>
          ) : displayUrl ? (
            <ImageWithOverlays url={displayUrl} alt={selectedResult ? 'Generated result' : 'Source image'} />
          ) : null}

          {/* Bottom toolbar */}
          {!isLoadingAny && source && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-1 border border-ar-border/40">
              {/* Select region */}
              <button
                onClick={() => setDrawMode(drawMode === 'rect' ? 'off' : 'rect')}
                title="Select region to transform"
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] transition-colors ${drawMode === 'rect' ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-dim hover:text-ar-text'}`}
              >
                <Square className="w-3 h-3" />
                {drawMode === 'rect' ? 'Drawing…' : selection ? 'Reselect' : 'Select'}
              </button>

              {selection && (
                <button onClick={() => setSelectedRegion(null)}
                  className="px-1.5 py-0.5 rounded-full text-[10px] text-ar-neon-pink/70 hover:text-ar-neon-pink transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}

              {selectedResult && source && (
                <>
                  <div className="w-px h-4 bg-ar-border mx-0.5" />
                  {([
                    { id: 'single', icon: <Maximize2 className="w-3 h-3" />, title: 'Single' },
                    { id: 'side-by-side', icon: <Columns2 className="w-3 h-3" />, title: 'Side by side' },
                    { id: 'slider', icon: <Layers className="w-3 h-3" />, title: 'Slider' },
                  ] as { id: CompareMode; icon: React.ReactNode; title: string }[]).map((cm) => (
                    <button key={cm.id} onClick={() => setCompareMode(cm.id)} title={cm.title}
                      className={`p-1.5 rounded-full transition-colors ${compareMode === cm.id ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-dim hover:text-ar-text'}`}>
                      {cm.icon}
                    </button>
                  ))}
                </>
              )}

              <div className="w-px h-4 bg-ar-border mx-0.5" />
              <button onClick={() => updateReferenceProjection({ active: true, viewMode: 'original' })}
                title="Align projector"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-ar-text-dim hover:text-ar-accent transition-colors">
                <Crosshair className="w-3 h-3" />
                Align
              </button>
            </div>
          )}
        </div>
      )}

      {isDragging && (
        <div className="absolute inset-0 bg-ar-accent/5 border-2 border-dashed border-ar-accent/60 flex items-center justify-center pointer-events-none">
          <p className="text-ar-accent text-sm font-medium">Drop to upload</p>
        </div>
      )}
    </main>
  );
}
