'use client';

import { useRef, useState } from 'react';
import { Upload, Maximize2, Columns2, Layers } from 'lucide-react';
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
  } = useArtReviveStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [compareMode, setCompareMode] = useState<CompareMode>('single');
  const [sliderPos, setSliderPos] = useState(50);

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
      {/* Empty state */}
      {!source && !isUploading && (
        <div className="flex flex-col items-center gap-4 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-ar-border group-hover:border-ar-accent/50 flex items-center justify-center transition-colors">
            <Upload className="w-8 h-8 text-ar-text-dim group-hover:text-ar-accent/60 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-ar-text text-sm font-medium">Drop an image here</p>
            <p className="text-ar-text-dim text-xs mt-1">or click to upload · JPEG, PNG, WebP · max 20 MB</p>
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

      {/* Loop player */}
      {source && generatedLoop && generatedLoop.frames.length > 0 && !isLoadingAny && (
        <div className="w-full h-full flex flex-col">
          <LoopPlayer frames={generatedLoop.frames} fps={10} autoPlay />
        </div>
      )}

      {/* Still image display */}
      {source && !generatedLoop && (activeMode === 'restyle' || activeMode === 'glow-sculpture' || activeMode === 'house-projection') && (
        <div className="relative w-full h-full flex items-center justify-center">
          {isLoadingAny ? (
            <div className="relative">
              <div
                className="animate-shimmer rounded-lg"
                style={{ width: Math.min(source.width || 600, 800), height: Math.min(source.height || 400, 600), maxWidth: '80vw', maxHeight: '70vh' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className={`w-8 h-8 border-2 border-ar-border rounded-full animate-spin ${activeMode === 'restyle' ? 'border-t-ar-violet' : activeMode === 'glow-sculpture' ? 'border-t-ar-accent' : 'border-t-orange-400'}`} />
                <span className="text-ar-text-muted text-sm">
                  {isGeneratingLoop ? 'Generating loop frames...' : 'Generating...'}
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
                className="max-w-full max-h-full object-contain rounded-sm shadow-2xl animate-fade-in"
                style={{ maxWidth: '80vw', maxHeight: '70vh' }}
              />
              {selectedResult && source && (
                <button
                  onMouseEnter={() => setShowOriginal(true)}
                  onMouseLeave={() => setShowOriginal(false)}
                  className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 border border-ar-border text-xs text-ar-text-muted hover:text-ar-text transition-colors"
                >
                  {showOriginal ? 'Original' : 'Hold to compare'}
                </button>
              )}
            </div>
          ) : null}

          {/* Compare mode controls */}
          {selectedResult && source && !isLoadingAny && (
            <div className="absolute top-3 right-3 flex gap-1">
              {([
                { id: 'single',       icon: <Maximize2 className="w-3 h-3" />,  title: 'Single view' },
                { id: 'side-by-side', icon: <Columns2 className="w-3 h-3" />,   title: 'Side by side' },
                { id: 'slider',       icon: <Layers className="w-3 h-3" />,     title: 'Slider compare' },
              ] as { id: CompareMode; icon: React.ReactNode; title: string }[]).map((cm) => (
                <button
                  key={cm.id}
                  onClick={() => setCompareMode(cm.id)}
                  title={cm.title}
                  className={`p-1.5 rounded border transition-colors ${
                    compareMode === cm.id
                      ? 'bg-ar-accent/20 border-ar-accent/50 text-ar-accent'
                      : 'bg-black/50 border-ar-border text-ar-text-muted hover:text-ar-text'
                  }`}
                >
                  {cm.icon}
                </button>
              ))}
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
