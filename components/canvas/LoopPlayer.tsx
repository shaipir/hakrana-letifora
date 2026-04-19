'use client';

import { useEffect, useRef, useState } from 'react';
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

  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(isPlaying);
  const currentFrameRef = useRef(0);
  const speedRef = useRef(speed);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { currentFrameRef.current = currentFrame; }, [currentFrame]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  // Frame interval in ms
  const frameIntervalMs = bpmSync?.enabled
    ? bpmToFrameIntervalMs(bpmSync.bpm, bpmSync.beatDivision) / speed
    : (1000 / fps) / speed;

  const frameIntervalRef = useRef(frameIntervalMs);
  useEffect(() => { frameIntervalRef.current = frameIntervalMs; }, [frameIntervalMs]);

  // RAF animation loop
  useEffect(() => {
    if (!isPlaying || !frames.length) return;
    lastFrameTimeRef.current = 0;

    const animate = (timestamp: number) => {
      if (!isPlayingRef.current) return;
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed >= frameIntervalRef.current) {
        lastFrameTimeRef.current = timestamp;
        setCurrentFrame((f) => (f + 1) % frames.length);
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, frames.length]);

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

  // Transition duration for CSS
  const useBlend = transitionMode !== 'hard-cut';
  const transitionDuration = useBlend ? Math.round(frameIntervalMs * blendAmount) : 0;

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      {/* Image display — CSS opacity crossfade, no canvas */}
      <div
        className="flex-1 flex items-center justify-center w-full relative"
        style={{ minHeight: '200px', maxHeight: '65vh' }}
      >
        {/* Stack all frames, show current via opacity */}
        <div className="relative" style={{ width: '100%', maxWidth: '80vw', maxHeight: '65vh', aspectRatio: '4/3' }}>
          {frames.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt={`Frame ${i + 1}`}
              className="absolute inset-0 w-full h-full object-contain rounded-sm shadow-2xl"
              style={{
                opacity: i === currentFrame ? 1 : 0,
                transition: transitionDuration > 0
                  ? `opacity ${transitionDuration}ms ease-in-out`
                  : 'none',
              }}
            />
          ))}
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
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
          onChange={(e) => { setIsPlaying(false); setCurrentFrame(Number(e.target.value)); }}
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
            onClick={() => { setCurrentFrame(0); setIsPlaying(true); lastFrameTimeRef.current = 0; }}
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
