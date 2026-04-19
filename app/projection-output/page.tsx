'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createProjectionReceiver, type ProjectionState } from '@/lib/projection-bridge';

type ViewMode = 'original' | 'final' | 'overlay';

function drawState(canvas: HTMLCanvasElement, state: ProjectionState, frameIdxMap: Record<string, number>) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = canvas;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  const activeGrid = state.gridLayouts.find((g) => g.id === state.activeGridId);

  function drawFaces(alpha = 1) {
    if (!activeGrid || !ctx) return;
    for (const face of activeGrid.faces) {
      if (!face.visible || !face.assignedAssetId) continue;

      // Determine image URL: loop frame or static asset
      const loopFrames = face.assignedAssetId ? state.generatedLoopFrames[face.assignedAssetId] : null;
      let imgUrl: string | null = null;
      if (loopFrames?.length) {
        const idx = frameIdxMap[face.id] ?? 0;
        imgUrl = loopFrames[idx % loopFrames.length];
      } else {
        const asset = state.generatedAssets.find((a) => a.id === face.assignedAssetId);
        imgUrl = asset?.url ?? null;
      }
      if (!imgUrl) continue;

      const img = new Image();
      img.src = imgUrl;
      if (!img.complete) continue;

      // Build clip path
      const pts = face.points;
      if (pts.length < 3) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * W, pts[0].y * H);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * W, pts[i].y * H);
      ctx.closePath();
      ctx.clip();

      // Bounding box for cover fit
      const xs = pts.map((p) => p.x * W);
      const ys = pts.map((p) => p.y * H);
      const bx = Math.min(...xs), by = Math.min(...ys);
      const bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
      const scale = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
      const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh);
      ctx.restore();
    }
  }

  function drawOriginal(alpha = 1) {
    if (!state.uploadedAssetUrl || !ctx) return;
    const img = new Image();
    img.src = state.uploadedAssetUrl;
    if (!img.complete) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    ctx.restore();
  }

  if (state.viewMode === 'original') {
    drawOriginal();
  } else if (state.viewMode === 'final') {
    drawFaces();
  } else {
    drawFaces();
    drawOriginal(0.5);
  }
}

export default function ProjectionOutputPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [projState, setProjState] = useState<ProjectionState | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('final');
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameIdxMap = useRef<Record<string, number>>({});
  const animRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});

  const mergedState = projState ? { ...projState, viewMode } : null;

  // Preload images and keep cache
  useEffect(() => {
    if (!projState) return;
    const urls = [
      projState.uploadedAssetUrl,
      ...projState.generatedAssets.map((a) => a.url),
      ...Object.values(projState.generatedLoopFrames).flat(),
    ].filter(Boolean) as string[];
    urls.forEach((url) => {
      if (!imageCache.current[url]) {
        const img = new Image();
        img.src = url;
        imageCache.current[url] = img;
      }
    });
  }, [projState]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function loop(ts: number) {
      animRef.current = requestAnimationFrame(loop);
      const canvas = canvasRef.current;
      if (!canvas || !mergedState) return;

      // Advance loop frame indices at ~10fps
      if (ts - lastFrameTime.current > 100) {
        lastFrameTime.current = ts;
        if (mergedState.activeGridId) {
          const grid = mergedState.gridLayouts.find((g) => g.id === mergedState.activeGridId);
          grid?.faces.forEach((face) => {
            const frames = face.assignedAssetId ? mergedState.generatedLoopFrames[face.assignedAssetId] : null;
            if (frames?.length) {
              frameIdxMap.current[face.id] = ((frameIdxMap.current[face.id] ?? 0) + 1) % frames.length;
            }
          });
        }
      }

      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      drawState(canvas, mergedState, frameIdxMap.current);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [mergedState]);

  // BroadcastChannel + localStorage fallback
  useEffect(() => {
    try {
      const saved = localStorage.getItem('artrevive_projection_state');
      if (saved) setProjState(JSON.parse(saved));
    } catch {}

    const receiver = createProjectionReceiver();
    receiver.onMessage((msg) => {
      if (msg.type === 'STATE_UPDATE') setProjState(msg.payload);
    });
    return () => receiver.destroy();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'o' || e.key === 'O') setViewMode('original');
      else if (e.key === 'f' || e.key === 'F') setViewMode('final');
      else if (e.key === 'v' || e.key === 'V') setViewMode('overlay');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Toolbar auto-hide
  const showToolbar = useCallback(() => {
    setToolbarVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setToolbarVisible(false), 3000);
  }, []);

  useEffect(() => { showToolbar(); }, [showToolbar]);

  return (
    <div
      style={{ background: '#000', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', cursor: toolbarVisible ? 'default' : 'none' }}
      onMouseMove={showToolbar}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {!projState && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontFamily: 'sans-serif', fontSize: 18, letterSpacing: 2 }}>
          Waiting for connection...
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
        transition: 'opacity 0.4s', opacity: toolbarVisible ? 1 : 0,
        fontFamily: 'sans-serif', fontSize: 13, color: '#aaa',
      }}>
        {(['original', 'final', 'overlay'] as ViewMode[]).map((m) => (
          <button key={m} onClick={() => setViewMode(m)} style={{
            background: viewMode === m ? 'rgba(255,255,255,0.15)' : 'transparent',
            border: '1px solid', borderColor: viewMode === m ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
            color: viewMode === m ? '#fff' : '#888', borderRadius: 4, padding: '4px 12px', cursor: 'pointer', textTransform: 'capitalize',
          }}>{m}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={() => document.documentElement.requestFullscreen()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#888', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>
          Fullscreen
        </button>
        <button onClick={() => window.close()} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#888', borderRadius: 4, padding: '4px 12px', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
}
