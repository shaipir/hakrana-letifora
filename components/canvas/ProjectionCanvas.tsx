'use client';
import { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { Layer, Point, Region } from '@/lib/types';

const HANDLE_R = 10;
const FACE_ZONES = [
  { id: 'left_eye',  label: 'עין שמאלית', x: 0.35, y: 0.35, w: 0.15, h: 0.10 },
  { id: 'right_eye', label: 'עין ימנית', x: 0.50, y: 0.35, w: 0.15, h: 0.10 },
  { id: 'mouth',     label: 'פה',          x: 0.38, y: 0.62, w: 0.24, h: 0.12 },
  { id: 'forehead',  label: 'מצח',        x: 0.30, y: 0.18, w: 0.40, h: 0.14 },
  { id: 'nose',      label: 'אף',           x: 0.42, y: 0.48, w: 0.16, h: 0.12 },
  { id: 'cheeks',    label: 'לחייים',      x: 0.25, y: 0.50, w: 0.50, h: 0.15 },
];

function getColor(idx: number) {
  const COLORS = ['#7c5cfc','#f472b6','#34d399','#fb923c','#60a5fa','#a78bfa'];
  return COLORS[idx % COLORS.length];
}

export default function ProjectionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    layers, activeLayerId, activeTool, updateLayer,
    addRegionToLayer, removeRegionFromLayer
  } = useAppStore();
  const dragging = useRef<{ layerId: string; corner: keyof Layer['cornerPin'] } | null>(null);
  const drawing = useRef<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const activeLayer = layers.find(l => l.id === activeLayerId) ?? null;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Background grid
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Draw layers
    layers.filter(l => l.visible).forEach(layer => {
      const { topLeft, topRight, bottomLeft, bottomRight } = layer.cornerPin;
      const isActive = layer.id === activeLayerId;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.beginPath();
      ctx.moveTo(topLeft.x, topLeft.y);
      ctx.lineTo(topRight.x, topRight.y);
      ctx.lineTo(bottomRight.x, bottomRight.y);
      ctx.lineTo(bottomLeft.x, bottomLeft.y);
      ctx.closePath();

      // Effect fill
      const now = Date.now();
      const hue = (now / 20) % 360;
      if (layer.effect === 'kaleidoscope') ctx.fillStyle = `hsl(${hue},80%,20%)`;
      else if (layer.effect === 'colorshift') ctx.fillStyle = `hsl(${hue},70%,15%)`;
      else if (layer.effect === 'tunnel') ctx.fillStyle = '#0d0020';
      else if (layer.effect === 'fire') ctx.fillStyle = `hsl(${20 + (hue%40)},90%,20%)`;
      else if (layer.effect === 'glitch') ctx.fillStyle = `hsl(${hue},100%,15%)`;
      else ctx.fillStyle = isActive ? 'rgba(124,92,252,0.18)' : 'rgba(255,255,255,0.06)';
      ctx.fill();

      ctx.strokeStyle = isActive ? '#7c5cfc' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = isActive ? 1.5 : 0.5;
      ctx.stroke();

      // Draw regions
      layer.regions.forEach((region, idx) => {
        if (region.points.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(region.points[0].x, region.points[0].y);
        region.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = region.color + '33';
        ctx.fill();
        ctx.strokeStyle = region.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Label
        const cx = region.points.reduce((s,p) => s+p.x, 0) / region.points.length;
        const cy = region.points.reduce((s,p) => s+p.y, 0) / region.points.length;
        ctx.fillStyle = region.color;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(region.name, cx, cy);
        ctx.restore();
      });

      // Corner handles
      if (isActive && activeTool === 'cornerpin') {
        const corners = [topLeft, topRight, bottomLeft, bottomRight];
        corners.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, HANDLE_R, 0, Math.PI * 2);
          ctx.fillStyle = '#7c5cfc';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      // Face zones overlay
      if (isActive && activeTool === 'region_select') {
        const bounds = {
          x: Math.min(topLeft.x, bottomLeft.x),
          y: Math.min(topLeft.y, topRight.y),
          w: Math.max(topRight.x, bottomRight.x) - Math.min(topLeft.x, bottomLeft.x),
          h: Math.max(bottomLeft.y, bottomRight.y) - Math.min(topLeft.y, topRight.y),
        };
        FACE_ZONES.forEach((zone, i) => {
          const zx = bounds.x + zone.x * bounds.w;
          const zy = bounds.y + zone.y * bounds.h;
          const zw = zone.w * bounds.w;
          const zh = zone.h * bounds.h;
          ctx.strokeStyle = getColor(i) + 'aa';
          ctx.lineWidth = 1;
          ctx.setLineDash([3,3]);
          ctx.strokeRect(zx, zy, zw, zh);
          ctx.setLineDash([]);
          ctx.fillStyle = getColor(i) + '22';
          ctx.fillRect(zx, zy, zw, zh);
          ctx.fillStyle = getColor(i);
          ctx.font = '10px sans-serif';
          ctx.fillText(zone.label, zx + 4, zy + 12);
        });
      }
      ctx.restore();
    });

    // Active freehand drawing
    if (isDrawing && drawing.current.length > 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(drawing.current[0].x, drawing.current[0].y);
      drawing.current.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = '#7c5cfc';
      ctx.lineWidth = 2;
      ctx.setLineDash([4,3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }, [layers, activeLayerId, activeTool, isDrawing]);

  useEffect(() => {
    let raf: number;
    const loop = () => { draw(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, []);

  const pt = (e: React.MouseEvent): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const hitCorner = (layer: Layer, p: Point) => {
    for (const [k, c] of Object.entries(layer.cornerPin) as [keyof Layer['cornerPin'], Point][]) {
      const dx = c.x-p.x, dy = c.y-p.y;
      if (Math.sqrt(dx*dx+dy*dy) < HANDLE_R+4) return k;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!activeLayer) return;
    const p = pt(e);
    if (activeTool === 'cornerpin') {
      const corner = hitCorner(activeLayer, p);
      if (corner) dragging.current = { layerId: activeLayer.id, corner };
    } else if (activeTool === 'mask' || activeTool === 'draw') {
      drawing.current = [p];
      setIsDrawing(true);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const p = pt(e);
    if (dragging.current) {
      const { layerId, corner } = dragging.current;
      const layer = layers.find(l => l.id === layerId);
      if (layer) updateLayer(layerId, { cornerPin: { ...layer.cornerPin, [corner]: p } });
    } else if (isDrawing) {
      drawing.current = [...drawing.current, p];
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    dragging.current = null;
    if (isDrawing && activeLayer && drawing.current.length > 3) {
      const newRegion: Region = {
        id: Math.random().toString(36).slice(2),
        name: `אזור ${activeLayer.regions.length + 1}`,
        type: 'freehand',
        points: drawing.current,
        theme: null,
        animationPreset: 'none',
        color: getColor(activeLayer.regions.length),
        opacity: 1,
        blendMode: 'normal',
      };
      addRegionToLayer(activeLayer.id, newRegion);
    }
    drawing.current = [];
    setIsDrawing(false);
  };

  const cursor = {
    select: 'default',
    cornerpin: 'crosshair',
    mask: 'crosshair',
    draw: 'crosshair',
    warp: 'move',
    region_select: 'cell',
    brush: 'crosshair',
  }[activeTool] || 'default';

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    />
  );
}
