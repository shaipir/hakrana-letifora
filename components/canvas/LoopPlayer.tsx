'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Music } from 'lucide-react';
import { assembleWebM, assembleGif } from '@/lib/loop/gif-assembler';
import { BpmSyncSettings, TransitionMode } from '@/lib/types';
import { effectiveFps, bpmToFrameIntervalMs } from '@/lib/bpm-utils';

interface LoopPlayerProps {
  frames: string[];
  fps?: number;
  autoPlay?: boolean;
  bpmSync?: BpmSyncSettings;
  transitionMode?: TransitionMode;
  blendAmount?: number;
}

// ─── Preload images into HTMLImageElement cache ───────────────────────────────

function usePreloadedImages(frames: string[]) {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!frames.length) return;
    setReady(false);
    let cancelled = false;
    const imgs = frames.map((src) => {
      const img = new window.Image();
      img.src = src;
      return img;
    });
    let loaded = 0;
    imgs.forEach((img) => {
      const onDone = () => {
        loaded++;
        if (loaded === imgs.length && !cancelled) {
          setImages(imgs);
          setReady(true);
        }
      };
      img.onload = onDone;
      img.onerror = onDone; // still mark as done even on error
    });
    return () => { cancelled = true; };
  }, [frames]);

  return { images, ready };
}

// ─── Canvas renderer ──────────────────────────────────────────────────────────

function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  images: HTMLImageElement[],
  currentFrame: number,
  subProgress: number, // 0–1 within the current frame's transition
  transitionMode: TransitionMode,
  blendAmount: number,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !images.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const curr = images[currentFrame];
    const next = images[(currentFrame + 1) % images.length];

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (transitionMode === 'hard-cut' || subProgress < 0.01) {
      // Hard cut or before transition starts: draw current frame only
      if (curr?.complete && curr.naturalWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.drawImage(curr, 0, 0, w, h);
      }
      return;
    }

    // Blend progress: how far into the transition we are
    // blendAmount controls what fraction of the frame duration is spent blending
    const blendWindow = Math.max(0.1, blendAmount);
    const blendProgress = Math.min(1, subProgress / blendWindow);

    if (transitionMode === 'dissolve' || transitionMode === 'crossfade') {
      // Draw current frame
      if (curr?.complete && curr.naturalWidth > 0) {
        ctx.globalAlpha = 1;
        ctx.drawImage(curr, 0, 0, w, h);
      }
      // Dissolve next frame on top with increasing opacity
      if (next?.complete && next.naturalWidth > 0) {
        ctx.globalAlpha = transitionMode === 'crossfade'
          ? blendProgress * 0.85       // crossfade: slightly gentler
          : blendProgress;              // dissolve: full
        ctx.drawImage(next, 0, 0, w, h);
      }
      ctx.globalAlpha = 1;
    } else if (transitionMode === 'morph-blend') {
      // Morph blend: draw both frames and use screen blend for a morphing feel
      if (curr?.complete && curr.naturalWidth > 0) {
        ctx.globalAlpha = 1 - blendProgress * 0.6;
        ctx.drawImage(curr, 0, 0, w, h);
      }
      if (next?.complete && next.naturalWidth > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = blendProgress * 0.8;
        ctx.drawImage(next, 0, 0, w, h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    } else if (transitionMode === 'optical-flow') {
      // Optical flow approximation: warp by translating slightly
      const shift = Math.round(blendProgress * 8);
      if (curr?.complete && curr.naturalWidth > 0) {
        ctx.globalAlpha = 1 - blendProgress;
        ctx.drawImage(curr, -shift, 0, w + shift, h);
      }
      if (next?.complete && next.naturalWidth > 0) {
        ctx.globalAlpha = blendProgress;
        ctx.drawImage(next, shift, 0, w - shift, h);
      }
      ctx.globalAlpha = 1;
    }
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LoopPlayer({
  frames,
  fps = 10,
  autoPlay = true,
  bpmSync,
  transitionMode = 'dissolve',
  blendAmount = 0.5,
}: LoopPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [subProgress, setSubProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const subProgressRef = useRef(0);
  const currentFrameRef = useRef(0);

  const { images, ready } = usePreloadedImages(frames);

  // Sync refs
  useEffect(() => { currentFrameRef.current = currentFrame; }, [currentFrame]);
  useEffect(() => { subProgressRef.current = subProgress; }, [subProgress]);

  // Frame interval in ms
  const frameIntervalMs = bpmSync?.enabled
    ? bpmToFrameIntervalMs(bpmSync.bpm, bpmSync.beatDivision) / speed
    : (1000 / fps) / speed;

  // RAF-based animation loop (smoother than setInterval for blending)
  const animate = useCallback((timestamp: number) => {
    if (!isPlaying) return;

    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
    const elapsed = timestamp - lastFrameTimeRef.current;
    const sub = Math.min(1, elapsed / frameIntervalMs);

    setSubProgress(sub);

    if (elapsed >= frameIntervalMs) {
      lastFrameTimeRef.current = timestamp;
      setCurrentFrame((f) => (f + 1) % frames.length);
      setSubProgress(0);
    }

    rafRef.current = requestAnimationFrame(animate);
  }, [isPlaying, frameIntervalMs, frames.length]);

  useEffect(() => {
    if (isPlaying && ready) {
      lastFrameTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(animate);
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, animate, ready]);

  // Fit canvas to first image dimensions on load
  useEffect(() => {
    if (!images.length || !canvasRef.current) return;
    const img = images[0];
    const onLoad = () => {
      if (canvasRef.current) {
        canvasRef.current.width = img.naturalWidth || 1024;
        canvasRef.current.height = img.naturalHeight || 1024;
      }
    };
    if (img.complete) onLoad();
    else img.onload = onLoad;
  }, [images]);

  useCanvasRenderer(canvasRef, images, currentFrame, subProgress, transitionMode, blendAmount);

  const exportFps = bpmSync?.enabled ? effectiveFps(fps, bpmSync) * speed : fps * speed;

  async function handleExportWebM() {
    setIsExporting(true);
    try {
      const url = await assembleWebM(frames, exportFps);
      const a = document.createElement('a'); a.href = url; a.download = 'artrevive-loop.webm'; a.click();
    } catch (e) { console.error('WebM export failed:', e); }
    finally { setIsExporting(false); }
  }

  async function handleExportGif() {
    setIsExporting(true);
    try {
      const url = await assembleGif(frames, exportFps);
      const a = document.createElement('a'); a.href = url; a.download = 'artrevive-loop.gif'; a.click();
    } catch (e) { console.error('GIF export failed:', e); }
    finally { setIsExporting(false); }
  }

  if (!frames.length) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      {/* Canvas display */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {ready ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
            style={{ maxWidth: '80vw', maxHeight: '65vh' }}
          />
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={frames[currentFrame]}
            alt={`Frame ${currentFrame + 1}`}
            className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
            style={{ maxWidth: '80vw', maxHeight: '65vh' }}
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {bpmSync?.enabled && (
            <div className="flex items-center gap-1 bg-ar-accent/20 border border-ar-accent/40 rounded px-2 py-0.5 text-xs text-ar-accent">
              <Music className="w-3 h-3" />
              <span>{bpmSync.bpm} BPM</span>
            </div>
          )}
          {transitionMode !== 'hard-cut' && (
            <div className="bg-black/60 border border-ar-border rounded px-2 py-0.5 text-[10px] text-ar-text-dim capitalize">
              {transitionMode.replace('-', ' ')}
            </div>
          )}
          <div className="bg-black/60 border border-ar-border rounded px-2 py-0.5 text-xs text-ar-text-muted">
            {currentFrame + 1}/{frames.length}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 pb-2">
        {/* Scrubber */}
        <input
          type="range" min={0} max={frames.length - 1} value={currentFrame}
          onChange={(e) => { setIsPlaying(false); setCurrentFrame(Number(e.target.value)); setSubProgress(0); }}
          className="w-64 accent-ar-accent"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsPlaying(!isPlaying); lastFrameTimeRef.current = 0; }}
            className="p-2 rounded-full bg-ar-accent/10 border border-ar-accent/30 text-ar-accent hover:bg-ar-accent/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => { setCurrentFrame(0); setSubProgress(0); setIsPlaying(true); lastFrameTimeRef.current = 0; }}
            className="p-1.5 rounded text-ar-text-muted hover:text-ar-text transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {!bpmSync?.enabled && (
            <div className="flex rounded border border-ar-border overflow-hidden text-xs">
              {[0.5, 1, 2].map((s) => (
                <button key={s} onClick={() => setSpeed(s)}
                  className={`px-2 py-1 transition-colors ${speed === s ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-muted hover:text-ar-text'}`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-1">
            <button onClick={handleExportWebM} disabled={isExporting}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40">
              <Download className="w-3 h-3" /> WebM
            </button>
            <button onClick={handleExportGif} disabled={isExporting}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40">
              <Download className="w-3 h-3" /> GIF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
