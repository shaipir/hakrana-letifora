'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';
import { assembleWebM, assembleGif } from '@/lib/loop/gif-assembler';

interface LoopPlayerProps {
  frames: string[];
  fps?: number;
  autoPlay?: boolean;
}

export default function LoopPlayer({ frames, fps = 10, autoPlay = true }: LoopPlayerProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying && frames.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((f) => (f + 1) % frames.length);
      }, (1000 / fps) / speed);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, fps, speed, frames.length]);

  async function handleExportWebM() {
    setIsExporting(true);
    try {
      const url = await assembleWebM(frames, fps * speed);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'artrevive-loop.webm';
      a.click();
    } catch (e) {
      console.error('WebM export failed:', e);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportGif() {
    setIsExporting(true);
    try {
      const url = await assembleGif(frames, fps * speed);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'artrevive-loop.gif';
      a.click();
    } catch (e) {
      console.error('GIF export failed:', e);
    } finally {
      setIsExporting(false);
    }
  }

  if (!frames.length) return null;

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      {/* Frame display */}
      <div className="flex-1 flex items-center justify-center w-full relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frames[currentFrame]}
          alt={`Frame ${currentFrame + 1} of ${frames.length}`}
          className="max-w-full max-h-full object-contain rounded-sm shadow-2xl"
          style={{ maxWidth: '80vw', maxHeight: '65vh', transition: 'opacity 80ms' }}
        />
        {/* Frame counter badge */}
        <div className="absolute top-3 right-3 bg-black/60 border border-ar-border rounded px-2 py-0.5 text-xs text-ar-text-muted">
          {currentFrame + 1}/{frames.length}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-2 pb-2">
        {/* Progress scrubber */}
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={currentFrame}
          onChange={(e) => { setIsPlaying(false); setCurrentFrame(Number(e.target.value)); }}
          className="w-64 accent-ar-accent"
        />

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-full bg-ar-accent/10 border border-ar-accent/30 text-ar-accent hover:bg-ar-accent/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Restart */}
          <button
            onClick={() => { setCurrentFrame(0); setIsPlaying(true); }}
            className="p-1.5 rounded text-ar-text-muted hover:text-ar-text transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed */}
          <div className="flex rounded border border-ar-border overflow-hidden text-xs">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 transition-colors ${speed === s ? 'bg-ar-accent/20 text-ar-accent' : 'text-ar-text-muted hover:text-ar-text'}`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Export */}
          <div className="flex gap-1">
            <button
              onClick={handleExportWebM}
              disabled={isExporting}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40"
            >
              <Download className="w-3 h-3" />
              WebM
            </button>
            <button
              onClick={handleExportGif}
              disabled={isExporting}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40"
            >
              <Download className="w-3 h-3" />
              GIF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
