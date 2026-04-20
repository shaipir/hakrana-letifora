'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useMappingStore } from '@/lib/mapping-store';
import { getProjectorCanvas } from '@/lib/mapping/live-output';

export default function LiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  // Keep a ref to the last rendered ImageData so we can freeze
  const lastFrameRef = useRef<ImageData | null>(null);
  // Track loaded content images by contentId
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  const store = useMappingStore;

  // ── Resize observer ────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = Math.floor(width);
        canvas.height = Math.floor(height);
      }
    });

    ro.observe(container);
    // Initial size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    return () => ro.disconnect();
  }, []);

  // ── Image loader helper ────────────────────────────────────────────────────
  const getImage = useCallback((id: string, url: string): HTMLImageElement => {
    const cache = imageCache.current;
    if (cache.has(id)) return cache.get(id)!;
    console.log('[MAPPING:LiveCanvas] Loading content image id:', id, 'url:', url.slice(0, 80));
    const img = new Image();
    img.onload = () => {
      console.log('[MAPPING:LiveCanvas] Content image loaded OK id:', id, img.naturalWidth, 'x', img.naturalHeight);
    };
    img.onerror = (err) => {
      console.error('[MAPPING:LiveCanvas] Content image failed to load id:', id, 'url:', url.slice(0, 80), err);
    };
    img.src = url;
    cache.set(id, img);
    return img;
  }, []);

  // ── Render loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function render() {
      const { live, project } = store.getState();
      const { isLive, blackout, frozen, masterOpacity } = live;
      const ctx = canvas!.getContext('2d');
      if (!ctx) {
        console.error('[MAPPING:LiveCanvas] Failed to get 2D canvas context');
        return;
      }

      const W = canvas!.width;
      const H = canvas!.height;

      if (frozen && lastFrameRef.current) {
        // Restore last frame — don't redraw
        ctx.putImageData(lastFrameRef.current, 0, 0);
      } else if (blackout) {
        // Black screen
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);
        lastFrameRef.current = ctx.getImageData(0, 0, W, H);
      } else {
        // Normal render: black background then each visible surface
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, W, H);

        // Render surfaces (both preview and live)
        if (project.contentItems.length === 0) {
          console.warn('[MAPPING:LiveCanvas] No content items available in project');
        }
        for (const surf of project.surfaces) {
          if (!surf.visible) continue;
          if (!surf.contentId) {
            console.warn('[MAPPING:LiveCanvas] Surface has no contentId:', surf.id, surf.name);
            continue;
          }
          const content = project.contentItems.find((c) => c.id === surf.contentId);
          if (!content) {
            console.warn('[MAPPING:LiveCanvas] contentId not found in contentItems for surface:', surf.id, surf.name, 'contentId:', surf.contentId);
            continue;
          }
          const img = getImage(content.id, content.url);
          if (!img.complete || img.naturalWidth === 0) continue;

          const alpha = surf.opacity * masterOpacity;
          ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
          ctx.drawImage(img, 0, 0, W, H);
          ctx.globalAlpha = 1;
        }

        // If no surfaces with content, show latest content item as preview
        if (project.surfaces.every((s) => !s.contentId) && project.contentItems.length > 0) {
          const latest = project.contentItems[project.contentItems.length - 1];
          const img = getImage(latest.id, latest.url);
          if (img.complete && img.naturalWidth > 0) {
            ctx.globalAlpha = masterOpacity;
            ctx.drawImage(img, 0, 0, W, H);
            ctx.globalAlpha = 1;
          }
        }

        lastFrameRef.current = ctx.getImageData(0, 0, W, H);
      }

      // Mirror to projector window
      const projCanvas = getProjectorCanvas();
      if (!projCanvas) {
        // Only warn once per render — check isLive to avoid spam when projector not open
        const { live: liveState } = store.getState();
        if (liveState.isLive) {
          console.warn('[MAPPING:LiveCanvas] Projector canvas not available despite isLive=true');
        }
      } else {
        const pCtx = projCanvas.getContext('2d');
        if (pCtx && canvas!.width > 0 && canvas!.height > 0) {
          pCtx.drawImage(canvas!, 0, 0, projCanvas.width, projCanvas.height);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [getImage]);

  // ── Live state subscriptions for overlay re-renders ────────────────────────
  const { live } = useMappingStore();
  const { blackout, frozen, isLive } = live;

  return (
    <div ref={containerRef} className="relative flex-1 bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* BLACKOUT overlay */}
      {blackout && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="text-red-500 text-4xl font-black tracking-widest uppercase select-none"
            style={{ animation: 'pulse 1.2s ease-in-out infinite' }}
          >
            BLACKOUT
          </span>
        </div>
      )}

      {/* FROZEN badge */}
      {frozen && (
        <div className="absolute top-3 right-3 pointer-events-none">
          <span className="bg-cyan-500/20 border border-cyan-400 text-cyan-300 text-xs font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
            FROZEN
          </span>
        </div>
      )}

      {/* Idle state prompt */}
      {!isLive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-ar-text-muted text-sm select-none">
            Open a projector window to begin live output
          </span>
        </div>
      )}

      {/* Keyframe animation for blackout pulse */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
