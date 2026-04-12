'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import type { Layer, Point } from '@/lib/types';

const HANDLE_RADIUS = 10;

export default function ProjectionCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { layers, activeLayerId, activeTool, updateLayer, canvasWidth, canvasHeight } = useAppStore();
  const dragging = useRef<{ layerId: string; corner: keyof Layer['cornerPin'] } | null>(null);

  const activeLayer = layers.find(l => l.id === activeLayerId) ?? null;

  // Draw everything
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background grid
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw each visible layer
    layers.filter(l => l.visible).forEach(layer => {
      const { topLeft, topRight, bottomLeft, bottomRight } = layer.cornerPin;
      const isActive = layer.id === activeLayerId;

      // Draw the projection quad
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      // Fill with layer color (placeholder until real media/effects)
      ctx.beginPath();
      ctx.moveTo(topLeft.x, topLeft.y);
      ctx.lineTo(topRight.x, topRight.y);
      ctx.lineTo(bottomRight.x, bottomRight.y);
      ctx.lineTo(bottomLeft.x, bottomLeft.y);
      ctx.closePath();

      if (layer.effect === 'kaleidoscope') {
        ctx.fillStyle = `hsl(${Date.now() / 20 % 360}, 80%, 30%)`;
      } else if (layer.effect === 'colorshift') {
        ctx.fillStyle = `hsl(${Date.now() / 15 % 360}, 70%, 25%)`;
      } else if (layer.effect === 'tunnel') {
        ctx.fillStyle = '#1a0a2e';
      } else {
        ctx.fillStyle = isActive ? 'rgba(124,92,252,0.25)' : 'rgba(255,255,255,0.08)';
      }
      ctx.fill();

      // Border
      ctx.strokeStyle = isActive ? '#7c5cfc' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();
      ctx.restore();

      // Corner handles (only for active layer in cornerpin mode)
      if (isActive && activeTool === 'cornerpin') {
        const corners = [topLeft, topRight, bottomLeft, bottomRight];
        corners.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, HANDLE_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = '#7c5cfc';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }
    });
  }, [layers, activeLayerId, activeTool]);

  // Animation loop
  useEffect(() => {
    let rafId: number;
    const loop = () => { draw(); rafId = requestAnimationFrame(loop); };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [draw]);

  // Resize canvas to container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const hitCorner = (layer: Layer, pt: Point): keyof Layer['cornerPin'] | null => {
    const corners = Object.entries(layer.cornerPin) as [keyof Layer['cornerPin'], Point][];
    for (const [key, corner] of corners) {
      const dx = corner.x - pt.x, dy = corner.y - pt.y;
      if (Math.sqrt(dx * dx + dy * dy) < HANDLE_RADIUS + 4) return key;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!activeLayer || activeTool !== 'cornerpin') return;
    const pt = getCanvasPoint(e);
    const corner = hitCorner(activeLayer, pt);
    if (corner) dragging.current = { layerId: activeLayer.id, corner };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const pt = getCanvasPoint(e);
    const { layerId, corner } = dragging.current;
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;
    updateLayer(layerId, {
      cornerPin: { ...layer.cornerPin, [corner]: pt },
    });
  };

  const handleMouseUp = () => { dragging.current = null; };

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${
        activeTool === 'cornerpin' ? 'cursor-crosshair' : 'cursor-default'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
