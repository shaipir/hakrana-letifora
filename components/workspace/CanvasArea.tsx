'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { UploadedAsset } from '@/lib/types';
import NeonContourCanvas from '@/components/canvas/NeonContourCanvas';

export default function CanvasArea() {
  const {
    project, activeMode,
    isGenerating, generateError,
    isUploading, uploadError,
    setUploadedAsset, setUploading, setUploadError,
    selectedResultId,
  } = useArtReviveStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const selectedResult = project.generatedAssets.find((a) => a.id === selectedResultId);
  const source = project.uploadedAsset;

  // ── Upload via drag/drop or click (client-side — no server) ─────────────
  async function uploadFile(file: File) {
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      setUploadError('Unsupported type. Use JPEG, PNG, WebP or GIF.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File too large. Max 20 MB.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 0, h: 0 });
        img.src = dataUrl;
      });
      const asset: UploadedAsset = {
        id: crypto.randomUUID(),
        url: dataUrl,
        originalName: file.name,
        mimeType: file.type,
        width: w,
        height: h,
        uploadedAt: new Date().toISOString(),
      };
      setUploadedAsset(asset);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  }

  // ── Display logic ────────────────────────────────────────────────────────
  // What to show in the canvas center:
  //  - no image → empty/drop state
  //  - image + neon-contour mode → live NeonContourCanvas
  //  - image + restyle mode + generating → skeleton
  //  - image + restyle mode + result → result image
  //  - image + restyle mode + no result → source image

  const showNeonContour = !!source && activeMode === 'neon-contour';
  const displayUrl = showOriginal
    ? source?.url
    : selectedResult?.url ?? source?.url;

  return (
    <main
      className={`flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-ar-bg transition-all ${
        isDragging ? 'ring-2 ring-inset ring-ar-accent' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* ── Empty state ───────────────────────────────────────────────── */}
      {!source && !isUploading && (
        <div
          className="flex flex-col items-center gap-4 cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-ar-border group-hover:border-ar-accent/50 flex items-center justify-center transition-colors">
            <Upload className="w-8 h-8 text-ar-text-dim group-hover:text-ar-accent/60 transition-colors" />
          </div>
          <div className="text-center">
            <p className="text-ar-text text-sm font-medium">Drop an image here</p>
            <p className="text-ar-text-dim text-xs mt-1">or click to upload · JPEG, PNG, WebP · max 20 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
        </div>
      )}

      {/* ── Upload loading ────────────────────────────────────────────── */}
      {isUploading && (
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-ar-border border-t-ar-accent rounded-full animate-spin" />
          <span className="text-ar-text-muted text-sm">Uploading image…</span>
        </div>
      )}

      {/* ── Upload / generate error ───────────────────────────────────── */}
      {(uploadError || generateError) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-ar-panel border border-ar-neon-pink/40 rounded-lg px-4 py-2 text-xs text-ar-neon-pink max-w-sm text-center">
          ⚠ {uploadError ?? generateError}
        </div>
      )}

      {/* ── Neon Contour live canvas ──────────────────────────────────── */}
      {showNeonContour && (
        <NeonContourCanvas
          imageUrl={source.url}
          settings={project.neonContourSettings}
          className="w-full h-full"
        />
      )}

      {/* ── Restyle: result or source image ──────────────────────────── */}
      {source && activeMode === 'restyle' && (
        <div className="relative w-full h-full flex items-center justify-center">
          {isGenerating ? (
            // Skeleton/loading state
            <div className="relative">
              <div
                className="animate-shimmer rounded-lg"
                style={{
                  width: Math.min(source.width || 600, 800),
                  height: Math.min(source.height || 400, 600),
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-ar-border border-t-ar-violet rounded-full animate-spin" />
                <span className="text-ar-text-muted text-sm">Generating…</span>
              </div>
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

              {/* Before/after toggle (when result exists) */}
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
        </div>
      )}

      {/* ── Drag overlay ─────────────────────────────────────────────── */}
      {isDragging && (
        <div className="absolute inset-0 bg-ar-accent/5 border-2 border-dashed border-ar-accent/60 flex items-center justify-center pointer-events-none">
          <p className="text-ar-accent text-sm font-medium">Drop to upload</p>
        </div>
      )}
    </main>
  );
}
