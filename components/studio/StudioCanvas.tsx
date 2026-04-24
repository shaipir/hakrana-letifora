'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useStudioStore } from '@/lib/studio/store';
import { warpElementToQuad, denormalize } from '@/lib/studio/homography';
import { StudioFace, StudioLayer, StudioPoint } from '@/lib/studio/types';
import { broadcastStudioState } from '@/lib/studio/store';

// ── Warped face visual ────────────────────────────────────────────────────────
function WarpedLayer({ layer, face, containerW, containerH }: {
  layer: StudioLayer;
  face: StudioFace;
  containerW: number;
  containerH: number;
}) {
  const dstPx = denormalize(face.corners, containerW, containerH);
  const src = layer.imageUrl ?? layer.frames?.[0];
  if (!src) return null;

  // Compute bounding box of the face
  const xs = dstPx.map(p => p.x);
  const ys = dstPx.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX;
  const bh = maxY - minY;

  if (bw < 1 || bh < 1) return null;

  // Destination corners relative to bounding box origin
  const localDst = dstPx.map(p => ({ x: p.x - minX, y: p.y - minY })) as typeof dstPx;

  const warpResult = warpElementToQuad(bw, bh, localDst);
  if (!warpResult) return null;

  const cssBlend: Record<string, string> = {
    normal: 'normal', screen: 'screen', multiply: 'multiply',
    overlay: 'overlay', add: 'color-dodge',
  };

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: minX, top: minY, width: bw, height: bh,
        opacity: layer.opacity,
        mixBlendMode: (cssBlend[layer.blendMode] ?? 'normal') as any,
        pointerEvents: 'none',
      }}
    >
      {/* Clip to face polygon */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          clipPath: `polygon(${localDst.map(p => `${(p.x/bw*100).toFixed(2)}% ${(p.y/bh*100).toFixed(2)}%`).join(', ')})`,
        }}
      >
        {layer.type === 'loop' && layer.frames && layer.frames.length > 0
          ? <LoopWarp frames={layer.frames} warpResult={warpResult} bw={bw} bh={bh} />
          : (
            <img
              src={src}
              alt=""
              className="absolute"
              style={{
                width: bw, height: bh,
                transform: warpResult.transform,
                transformOrigin: warpResult.transformOrigin,
                objectFit: 'fill',
              }}
            />
          )
        }
      </div>
    </div>
  );
}

function LoopWarp({ frames, warpResult, bw, bh }: {
  frames: string[];
  warpResult: { transform: string; transformOrigin: string };
  bw: number; bh: number;
}) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % frames.length), 100);
    return () => clearInterval(id);
  }, [frames.length]);

  return (
    <>
      {frames.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          className="absolute transition-opacity duration-75"
          style={{
            width: bw, height: bh,
            transform: warpResult.transform,
            transformOrigin: warpResult.transformOrigin,
            objectFit: 'fill',
            opacity: i === frame ? 1 : 0,
          }}
        />
      ))}
    </>
  );
}

// ── Corner handle ─────────────────────────────────────────────────────────────
function CornerHandle({ cx, cy, color, onDrag }: {
  cx: number; cy: number; color: string;
  onDrag: (x: number, y: number) => void;
}) {
  const dragging = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    e.stopPropagation();
    dragging.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
    onDrag(
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    );
  }
  function onPointerUp() { dragging.current = false; }

  return (
    <div
      className="absolute z-20 cursor-grab active:cursor-grabbing"
      style={{ left: `calc(${cx * 100}% - 7px)`, top: `calc(${cy * 100}% - 7px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div
        className="w-3.5 h-3.5 rounded-full border-2 shadow-lg"
        style={{ backgroundColor: color + '33', borderColor: color }}
      />
    </div>
  );
}

// ── Face SVG overlay ──────────────────────────────────────────────────────────
function FaceOverlay({ face, isActive, containerW, containerH }: {
  face: StudioFace; isActive: boolean; containerW: number; containerH: number;
}) {
  const pts = face.corners.map(p => `${p.x * 100}%,${p.y * 100}%`).join(' ');
  const { updateFaceCorner, setActiveFace, tool } = useStudioStore();

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
      <polygon
        points={pts}
        fill={face.color + (isActive ? '22' : '11')}
        stroke={face.color}
        strokeWidth={isActive ? 2 : 1}
        strokeDasharray={isActive ? undefined : '4,3'}
        style={{ pointerEvents: 'all', cursor: 'pointer' }}
        onClick={() => setActiveFace(isActive ? null : face.id)}
      />
      {/* Corner labels */}
      {face.corners.map((c, i) => (
        <text
          key={i}
          x={`${c.x * 100}%`}
          y={`${c.y * 100}%`}
          dx="8" dy="-8"
          fontSize="9"
          fill={face.color}
          opacity="0.7"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {face.name}
        </text>
      ))}
    </svg>
  );
}

// ── Main canvas ───────────────────────────────────────────────────────────────
export default function StudioCanvas() {
  const {
    referenceUrl, showReference, referenceOpacity, showGrid,
    faces, activeFaceId, setActiveFace, updateFaceCorner,
    layers,
    tool, pendingCorners, addPendingCorner,
  } = useStudioStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Broadcast on any change
  useEffect(() => { broadcastStudioState(); }, [faces, layers]);

  function handleCanvasClick(e: React.PointerEvent<HTMLDivElement>) {
    if (tool !== 'addFace') return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    addPendingCorner({ x, y });
  }

  const activeFace = faces.find(f => f.id === activeFaceId) ?? null;
  const isWarpMode = tool === 'warp';

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-black select-none"
      style={{ cursor: tool === 'addFace' ? 'crosshair' : 'default' }}
      onPointerDown={handleCanvasClick}
    >
      {/* Reference image */}
      {referenceUrl && showReference && (
        <img
          src={referenceUrl}
          alt="reference"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ opacity: referenceOpacity }}
          draggable={false}
        />
      )}

      {/* Grid overlay */}
      {showGrid && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={i}>
              <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%"
                stroke="#ffffff" strokeWidth="0.5" />
              <line x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`}
                stroke="#ffffff" strokeWidth="0.5" />
            </g>
          ))}
        </svg>
      )}

      {/* Warped layer visuals */}
      {size.w > 0 && layers.filter(l => l.visible).map(layer => {
        if (layer.type === 'blackout') {
          const face = faces.find(f => f.id === layer.faceId);
          if (!face) return null;
          const pts = face.corners.map(p => `${(p.x * 100).toFixed(2)}% ${(p.y * 100).toFixed(2)}%`).join(', ');
          return (
            <div
              key={layer.id}
              className="absolute inset-0 pointer-events-none"
              style={{ clipPath: `polygon(${pts})`, backgroundColor: 'black', opacity: layer.opacity, zIndex: 5 }}
            />
          );
        }
        const face = faces.find(f => f.id === layer.faceId);
        if (!face) return null;
        return (
          <WarpedLayer
            key={layer.id}
            layer={layer}
            face={face}
            containerW={size.w}
            containerH={size.h}
          />
        );
      })}

      {/* Face SVG overlays */}
      {faces.map(face => (
        <FaceOverlay
          key={face.id}
          face={face}
          isActive={face.id === activeFaceId}
          containerW={size.w}
          containerH={size.h}
        />
      ))}

      {/* Warp handles for active face */}
      {isWarpMode && activeFace && size.w > 0 && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
          <div className="absolute inset-0 pointer-events-auto">
            {activeFace.corners.map((c, i) => (
              <CornerHandle
                key={i}
                cx={c.x}
                cy={c.y}
                color={activeFace.color}
                onDrag={(x, y) => updateFaceCorner(activeFace.id, i, { x, y })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending corners while adding face */}
      {tool === 'addFace' && pendingCorners.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 15 }}>
          {pendingCorners.length > 1 && (
            <polyline
              points={pendingCorners.map(p => `${p.x * 100}%,${p.y * 100}%`).join(' ')}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          )}
          {pendingCorners.map((p, i) => (
            <circle
              key={i}
              cx={`${p.x * 100}%`}
              cy={`${p.y * 100}%`}
              r={5}
              fill="#00d4ff"
              fillOpacity="0.8"
              stroke="white"
              strokeWidth="1"
            />
          ))}
          <text x="12" y="20" fontSize="11" fill="#00d4ff" opacity="0.9">
            {4 - pendingCorners.length} more corner{4 - pendingCorners.length !== 1 ? 's' : ''}
          </text>
        </svg>
      )}

      {/* Empty state */}
      {!referenceUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-5xl mb-4 opacity-30">📸</div>
          <p className="text-ar-text-muted text-sm opacity-60">Upload a reference image to begin</p>
        </div>
      )}
    </div>
  );
}
