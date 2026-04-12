'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { NeonContourSettings } from '@/lib/types';
import { processImage, ContourFrame } from '@/lib/neon-contour/pipeline';
import { startAnimation, AnimationHandle } from '@/lib/neon-contour/animator';

interface NeonContourCanvasProps {
  imageUrl: string | null;
  settings: NeonContourSettings;
  className?: string;
}

type ProcessingState = 'idle' | 'loading' | 'processing' | 'ready' | 'error';

export default function NeonContourCanvas({ imageUrl, settings, className = '' }: NeonContourCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const frameRef = useRef<ContourFrame | null>(null);
  const animHandleRef = useRef<AnimationHandle | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ── Load image ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!imageUrl) {
      setState('idle');
      frameRef.current = null;
      imageRef.current = null;
      return;
    }

    setState('loading');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setState('processing');
    };
    img.onerror = () => {
      setState('error');
      setError('Failed to load image');
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // ── Process image when state = processing ─────────────────────────────
  useEffect(() => {
    if (state !== 'processing' || !imageRef.current) return;

    let cancelled = false;

    processImage(imageRef.current, settingsRef.current)
      .then((frame) => {
        if (cancelled) return;
        frameRef.current = frame;
        setState('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message ?? 'Processing failed');
        setState('error');
      });

    return () => { cancelled = true; };
  }, [state]);

  // ── Re-process when settings change (debounced) ─────────────────────────
  useEffect(() => {
    if (state !== 'ready' && state !== 'processing') return;
    if (!imageRef.current) return;

    const timer = setTimeout(() => {
      setState('processing');
    }, 250);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    settings.edgeSensitivity,
    settings.lineThickness,
    settings.lineDensity,
    settings.contourSimplification,
    settings.backgroundDarkness,
    settings.neonColor,
    settings.glowStrength,
  ]);

  // ── Start animation when ready ──────────────────────────────────────────
  useEffect(() => {
    if (state !== 'ready' || !frameRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const frame = frameRef.current;

    // Resize canvas to match image
    canvas.width = frame.width;
    canvas.height = frame.height;

    // Stop previous animation
    animHandleRef.current?.stop();

    const handle = startAnimation({
      canvas,
      edgeMask: frame.edgeMagnitude,
      width: frame.width,
      height: frame.height,
      settings: settingsRef.current,
    });
    animHandleRef.current = handle;

    return () => handle.stop();
  }, [state]);

  // ── Restart animation when animation-only settings change ───────────────
  useEffect(() => {
    if (state !== 'ready' || !frameRef.current || !canvasRef.current) return;

    animHandleRef.current?.stop();

    const handle = startAnimation({
      canvas: canvasRef.current,
      edgeMask: frameRef.current.edgeMagnitude,
      width: frameRef.current.width,
      height: frameRef.current.height,
      settings,
    });
    animHandleRef.current = handle;

    return () => handle.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.animationMode, settings.speed, settings.flowDirection]);

  // Cleanup on unmount
  useEffect(() => () => animHandleRef.current?.stop(), []);

  // ── Export still ────────────────────────────────────────────────────────
  const exportStill = useCallback((): string | null => {
    if (!canvasRef.current || state !== 'ready') return null;
    return canvasRef.current.toDataURL('image/png');
  }, [state]);

  // Expose via ref for parent access
  useEffect(() => {
    if (canvasRef.current) {
      (canvasRef.current as any).__exportStill = exportStill;
    }
  }, [exportStill]);

  return (
    <div className={`relative flex items-center justify-center bg-ar-bg ${className}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${
          state === 'ready' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Loading overlay */}
      {(state === 'loading' || state === 'processing') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-ar-border border-t-ar-accent rounded-full animate-spin" />
          <span className="text-ar-text-muted text-sm">
            {state === 'loading' ? 'Loading image…' : 'Detecting contours…'}
          </span>
        </div>
      )}

      {/* Error overlay */}
      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <span className="text-ar-neon-pink text-sm">⚠ {error}</span>
        </div>
      )}

      {/* Idle (no image) */}
      {state === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-ar-text-dim text-sm">Upload an image to begin</span>
        </div>
      )}
    </div>
  );
}
