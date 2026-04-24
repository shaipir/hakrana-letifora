'use client';
import { useEffect, useRef, useState } from 'react';
import { warpElementToQuad, denormalize } from '@/lib/studio/homography';
import type { StudioFace, StudioLayer } from '@/lib/studio/types';

interface StudioPayload {
  faces: StudioFace[];
  layers: StudioLayer[];
  blackouts: any[];
  referenceUrl: string | null;
  referenceWidth: number;
  referenceHeight: number;
}

function ProjectorFace({ face, layer, containerW, containerH }: {
  face: StudioFace;
  layer: StudioLayer;
  containerW: number;
  containerH: number;
}) {
  const dstPx = denormalize(face.corners, containerW, containerH);
  const src = layer.imageUrl ?? layer.frames?.[0];
  if (!src && layer.type !== 'blackout') return null;

  const xs = dstPx.map(p => p.x);
  const ys = dstPx.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX, bh = maxY - minY;

  if (bw < 1 || bh < 1) return null;

  const localDst = dstPx.map(p => ({ x: p.x - minX, y: p.y - minY })) as typeof dstPx;
  const clipPath = `polygon(${localDst.map(p => `${(p.x/bw*100).toFixed(2)}% ${(p.y/bh*100).toFixed(2)}%`).join(', ')})`;

  if (layer.type === 'blackout') {
    return (
      <div
        className="absolute"
        style={{
          left: minX, top: minY, width: bw, height: bh,
          backgroundColor: 'black',
          clipPath,
          opacity: layer.opacity,
        }}
      />
    );
  }

  const warpResult = warpElementToQuad(bw, bh, localDst);
  if (!warpResult) return null;

  const cssBlend: Record<string, string> = {
    normal: 'normal', screen: 'screen', multiply: 'multiply',
    overlay: 'overlay', add: 'color-dodge',
  };

  return (
    <div
      className="absolute overflow-hidden"
      style={{ left: minX, top: minY, width: bw, height: bh, clipPath, opacity: layer.opacity, mixBlendMode: (cssBlend[layer.blendMode] ?? 'normal') as any }}
    >
      {layer.type === 'loop' && layer.frames && layer.frames.length > 0
        ? <LoopFace frames={layer.frames} warpResult={warpResult} bw={bw} bh={bh} />
        : src
          ? <img src={src} alt="" className="absolute" style={{ width: bw, height: bh, transform: warpResult.transform, transformOrigin: warpResult.transformOrigin, objectFit: 'fill' }} />
          : null
      }
    </div>
  );
}

function LoopFace({ frames, warpResult, bw, bh }: {
  frames: string[]; warpResult: { transform: string; transformOrigin: string }; bw: number; bh: number;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % frames.length), 100);
    return () => clearInterval(id);
  }, [frames.length]);
  return (
    <>
      {frames.map((src, i) => (
        <img key={i} src={src} alt="" className="absolute transition-opacity duration-75"
          style={{ width: bw, height: bh, transform: warpResult.transform, transformOrigin: warpResult.transformOrigin, objectFit: 'fill', opacity: i === frame ? 1 : 0 }} />
      ))}
    </>
  );
}

export default function ProjectorPage() {
  const [state, setState] = useState<StudioPayload | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Listen for BroadcastChannel updates
  useEffect(() => {
    // Try to load from localStorage first
    try {
      const saved = localStorage.getItem('artrevive-studio');
      if (saved) {
        const parsed = JSON.parse(saved);
        const s = parsed?.state;
        if (s?.faces) setState(s);
      }
    } catch {}

    const ch = new BroadcastChannel('artrevive-studio');
    ch.onmessage = (e) => {
      if (e.data?.type === 'STUDIO_UPDATE') setState(e.data.payload);
    };
    return () => ch.close();
  }, []);

  // Container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setFullscreen(false));
    }
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col overflow-hidden">
      {/* Minimal UI bar */}
      {!fullscreen && (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/10">
          <span className="text-white/40 text-xs font-mono">PROJECTOR OUTPUT</span>
          <div className="flex-1" />
          {state?.faces?.length !== undefined && (
            <span className="text-white/30 text-xs">
              {state.faces.length} surfaces · {state.layers?.filter(l => l.visible).length ?? 0} layers
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className="text-white/40 hover:text-white text-xs px-2 py-1 border border-white/10 rounded hover:border-white/30 transition-colors"
          >
            ⛶ Fullscreen
          </button>
        </div>
      )}

      {/* Output canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative bg-black overflow-hidden"
        style={{ marginTop: fullscreen ? 0 : 36 }}
        onDoubleClick={toggleFullscreen}
      >
        {/* Render each visible layer into its face */}
        {state && size.w > 0 && state.layers.filter(l => l.visible).map(layer => {
          const face = state.faces.find(f => f.id === layer.faceId);
          if (!face) return null;
          return (
            <ProjectorFace
              key={layer.id}
              face={face}
              layer={layer}
              containerW={size.w}
              containerH={size.h}
            />
          );
        })}

        {/* No content state */}
        {(!state || state.faces.length === 0) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-white/20 text-sm">Waiting for projection data...</p>
            <p className="text-white/10 text-xs mt-1">Open Studio → Projection Studio, then map your surfaces</p>
          </div>
        )}
      </div>
    </div>
  );
}
