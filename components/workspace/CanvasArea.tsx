'use client';

import { useRef, useState } from 'react';
import { Upload, Maximize2, Columns2, Layers, Crosshair, Grid, Sun } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { UploadedAsset } from '@/lib/types';
import LoopPlayer from '@/components/canvas/LoopPlayer';

type CompareMode = 'single' | 'side-by-side' | 'slider';

export default function CanvasArea() {
  const {
    project, activeMode,
    isGenerating, isGeneratingLoop, generateError,
    isUploading, uploadError,
    setUploadedAsset, setUploading, setUploadError,
    selectedResultId, generatedLoop,
    updateReferenceProjection,
  } = useArtReviveStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('single');
  const [sliderPos, setSliderPos] = useState(50);

  const refProj = project.referenceProjection;

  const selectedResult = project.generatedAssets.find((a) => a.id === selectedResultId);
  const source = project.uploadedAsset;
  const displayUrl = showOriginal ? source?.url : selectedResult?.url ?? source?.url;
  const isLoadingAny = isGenerating || isGeneratingLoop;

  async function uploadFile(file: File) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) { setUploadError('Unsupported type. Use JPEG, PNG, WebP or GIF.'); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError('File too large. Max 20 MB.'); return; }
    setUploading(true); setUploadError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const dims = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = dataUrl;
      });
      const asset: UploadedAsset = {
        id: crypto.randomUUID(), url: dataUrl, originalName: file.name,
        mimeType: file.type, width: dims.w, height: dims.h, uploadedAt: new Date().toISOString(),
      };
      setUploadedAsset(asset);
    } catch (err: any) { setUploadError(err?.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  }

  return (
    <main
      className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-ar-bg transition-all ${isDragging ? 'ring-2 ring-inset ring-ar-accent' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Empty state — corner bracket upload zone */}
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

      {/* Upload loading */}
      {isUploading && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ar-border border-t-ar-accent rounded-full animate-spin" />
          <span className="text-ar-text-muted text-sm">Loading image...</span>
        </div>
      )}

      {/* Errors */}
      {(uploadError || generateError) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ar-panel border border-ar-neon-pink/40 rounded-lg px-4 py-2 text-xs text-ar-neon-pink max-w-md text-center z-10">
          {uploadError ?? generateError}
        </div>
      )}

      {/* ── Reference Projection mode ─────────────────────────────────── */}
      {source && refProj.active && !isLoadingAny && (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Toolbar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/80 backdrop-blur-sm border border-ar-border/60 rounded-full px-2 py-1.5">
            {/* View mode toggle */}
            {(['original', 'transformed', 'overlay'] as const).map((vm) => (
              <button
                key={vm}
                onClick={() => updateReferenceProjection({ viewMode: vm })}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-colors capitalize ${
                  refProj.viewMode === vm
                    ? 'bg-ar-accent text-black'
                    : 'text-ar-text-muted hover:text-ar-text'
                }`}
              >
                {vm}
              </button>
            ))}
            <div className="w-px h-4 bg-ar-border mx-1" />
            {/* Brightness */}
            <Sun className="w-3 h-3 text-ar-text-dim shrink-0" />
            <input
              type="range" min={0.2} max={2} step={0.05}
              value={refProj.brightness}
              onChange={(e) => updateReferenceProjection({ brightness: parseFloat(e.target.value) })}
              className="w-20 accent-ar-accent h-1"
            />
            <div className="w-px h-4 bg-ar-border mx-1" />
            {/* Grid toggle */}
            <button
              onClick={() => updateReferenceProjection({ showGrid: !refProj.showGrid })}
              title="Grid overlay"
              className={`p-1 rounded transition-colors ${refProj.showGrid ? 'text-ar-accent' : 'text-ar-text-dim hover:text-ar-text'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            {/* Corner markers */}
            <button
              onClick={() => updateReferenceProjection({ showCornerMarkers: !refProj.showCornerMarkers })}
              title="Corner markers"
              className={`p-1 rounded transition-colors ${refProj.showCornerMarkers ? 'text-ar-accent' : 'text-ar-text-dim hover:text-ar-text'}`}
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-ar-border mx-1" />
            {/* Exit */}
            <button
              onClick={() => updateReferenceProjection({ active: false })}
              className="px-2 py-0.5 rounded text-[10px] text-ar-neon-pink/80 hover:text-ar-neon-pink border border-ar-neon-pink/30 hover:border-ar-neon-pink/60 transition-colors"
            >
              Exit
            </button>
          </div>

          {/* Image display */}
          <div className="relative" style={{ maxWidth: '80vw', maxHeight: '70vh' }}>
            {/* Overlay: original + transformed blended */}
            {refProj.viewMode === 'overlay' && selectedResult ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedResult.url}
                  alt="Transformed"
                  className="max-w-full max-h-full object-contain rounded-sm"
                  style={{ maxWidth: '80vw', maxHeight: '70vh', filter: `brightness(${refProj.brightness})` }}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={source.url}
                  alt="Original overlay"
                  className="absolute inset-0 max-w-full max-h-full object-contain"
                  style={{ opacity: refProj.opacity, mixBlendMode: 'screen', filter: `brightness(${refProj.brightness})` }}
                />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={refProj.viewMode === 'transformed' && selectedResult ? selectedResult.url : source.url}
                alt="Reference projection"
                className="max-w-full max-h-full object-contain rounded-sm"
                style={{ maxWidth: '80vw', maxHeight: '70vh', filter: `brightness(${refProj.brightness})` }}
              />
            )}

            {/* Grid overlay */}
            {refProj.showGrid && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(0,229,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '10% 10%',
                }}
              />
            )}

            {/* Corner markers */}
            {refProj.showCornerMarkers && (
              <>
                {[
                  { top: 0, left: 0, borderTop: true, borderLeft: true },
                  { top: 0, right: 0, borderTop: true, borderRight: true },
                  { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
                  { bottom: 0, right: 0, borderBottom: true, borderRight: true },
                ].map((pos, i) => (
                  <span
                    key={i}
                    className="absolute w-6 h-6 pointer-events-none"
                    style={{
                      ...pos,
                      borderTop: pos.borderTop ? '2px solid rgba(0,229,255,0.8)' : undefined,
                      borderBottom: pos.borderBottom ? '2px solid rgba(0,229,255,0.8)' : undefined,
                      borderLeft: pos.borderLeft ? '2px solid rgba(0,229,255,0.8)' : undefined,
                      borderRight: pos.borderRight ? '2px solid rgba(0,229,255,0.8)' : undefined,
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Overlay opacity slider when in overlay mode */}
          {refProj.viewMode === 'overlay' && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-3 py-1.5 border border-ar-border/40">
              <span className="text-[10px] text-ar-text-dim">Overlay</span>
              <input
                type="range" min={0} max={1} step={0.05}
                value={refProj.opacity}
                onChange={(e) => updateReferenceProjection({ opacity: parseFloat(e.target.value) })}
                className="w-24 accent-ar-accent h-1"
              />
              <span className="text-[10px] text-ar-text-dim">{Math.round(refProj.opacity * 100)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Loop player */}
      {source && !refProj.active && generatedLoop && generatedLoop.frames.length > 0 && !isLoadingAny && (
        <div className="w-full h-full flex flex-col">
          <LoopPlayer
            frames={generatedLoop.frames}
            fps={10}
            autoPlay
            bpmSync={project.loopSettings.bpmSync}
          />
        </div>
      )}

      {/* Still image display */}
      {source && !refProj.active && !generatedLoop && (activeMode === 'restyle' || activeMode === 'glow-sculpture' || activeMode === 'house-projection') && (
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoadingAny ? (
            <div
              className="relative rounded-sm overflow-hidden border border-ar-border/30 bg-ar-panel/40"
              style={{ width: Math.min(source.width || 600, 800), height: Math.min(source.height || 400, 600), maxWidth: '80vw', maxHeight: '70vh' }}
            >
              {/* Scanline */}
              <div className={`absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-ar-accent to-transparent animate-scanline opacity-80 ${activeMode === 'restyle' ? 'via-ar-violet' : activeMode === 'glow-sculpture' ? 'via-ar-accent' : 'via-orange-400'}`} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className={`w-5 h-5 border border-ar-border/60 rounded-full animate-spin ${activeMode === 'restyle' ? 'border-t-ar-violet' : activeMode === 'glow-sculpture' ? 'border-t-ar-accent' : 'border-t-orange-400'}`} />
                <span className="text-ar-text-dim text-[10px] tracking-[0.2em] uppercase">
                  {isGeneratingLoop ? 'Building Loop' : 'Generating'}
                </span>
              </div>
            </div>
          ) : compareMode === 'side-by-side' && selectedResult && source ? (
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
          ) : compareMode === 'slider' && selectedResult && source ? (
            <div className="relative" style={{ maxWidth: '80vw', maxHeight: '70vh' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source.url} alt="Original" className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" style={{ maxWidth: '80vw', maxHeight: '70vh' }} />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedResult.url} alt="Result" className="max-w-full max-h-full object-contain" style={{ maxWidth: '80vw', maxHeight: '70vh' }} />
              </div>
              <div className="absolute inset-0 flex items-center" style={{ left: `${sliderPos}%`, width: '2px', background: 'white', opacity: 0.8 }} />
              <input
                type="range" min={0} max={100} value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
              />
              <div className="absolute top-2 left-2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">Before</div>
              <div className="absolute top-2 right-2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded">After</div>
            </div>
          ) : displayUrl ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayUrl}
                alt={selectedResult ? 'Generated result' : 'Source image'}
                className="max-w-full max-h-full object-contain rounded-sm animate-fade-in"
                style={{
                  maxWidth: '80vw', maxHeight: '70vh',
                  boxShadow: selectedResult
                    ? '0 0 80px rgba(0,0,0,0.9), 0 0 1px rgba(255,255,255,0.04)'
                    : '0 8px 40px rgba(0,0,0,0.6)',
                }}
              />
              {selectedResult && source && (
                <button
                  onMouseEnter={() => setShowOriginal(true)}
                  onMouseLeave={() => setShowOriginal(false)}
                  className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 border border-ar-border/50 text-[10px] tracking-widest uppercase text-ar-text-dim hover:text-ar-text transition-colors"
                >
                  {showOriginal ? 'Original' : 'Compare'}
                </button>
              )}
            </div>
          ) : null}

          {/* Compare mode controls — floating pill at bottom center */}
          {selectedResult && source && !isLoadingAny && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-1 border border-ar-border/40">
              {([
                { id: 'single',       icon: <Maximize2 className="w-3 h-3" />,  title: 'Single' },
                { id: 'side-by-side', icon: <Columns2 className="w-3 h-3" />,   title: 'Side by side' },
                { id: 'slider',       icon: <Layers className="w-3 h-3" />,     title: 'Slider' },
              ] as { id: CompareMode; icon: React.ReactNode; title: string }[]).map((cm) => (
                <button
                  key={cm.id}
                  onClick={() => setCompareMode(cm.id)}
                  title={cm.title}
                  className={`p-1.5 rounded-full transition-colors ${
                    compareMode === cm.id
                      ? 'bg-ar-accent/20 text-ar-accent'
                      : 'text-ar-text-dim hover:text-ar-text'
                  }`}
                >
                  {cm.icon}
                </button>
              ))}
              <div className="w-px h-4 bg-ar-border mx-0.5" />
              <button
                onClick={() => updateReferenceProjection({ active: true, viewMode: 'original' })}
                title="Reference Projection — align projector using original image"
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-ar-text-dim hover:text-ar-accent transition-colors"
              >
                <Crosshair className="w-3 h-3" />
                Align
              </button>
            </div>
          )}
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-ar-accent/5 border-2 border-dashed border-ar-accent/60 flex items-center justify-center pointer-events-none">
          <p className="text-ar-accent text-sm font-medium">Drop to upload</p>
        </div>
      )}
    </main>
  );
}
