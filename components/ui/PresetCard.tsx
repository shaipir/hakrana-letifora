'use client';

import { ReactNode } from 'react';

interface PresetCardProps {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  accentColor?: string; // tailwind color class suffix for active ring, e.g. 'cyan' | 'violet' | 'orange'
  className?: string;
}

/**
 * Clickable preset card with glow ring when active.
 * Used for world preset buttons, visual language chips, etc.
 */
export default function PresetCard({
  active = false,
  onClick,
  children,
  accentColor = 'cyan',
  className = '',
}: PresetCardProps) {
  const glowMap: Record<string, string> = {
    cyan:   'border-cyan-400/70 bg-cyan-400/10 shadow-[0_0_10px_rgba(0,229,255,0.25)]',
    violet: 'border-violet-400/70 bg-violet-400/10 shadow-[0_0_10px_rgba(139,92,246,0.25)]',
    orange: 'border-orange-400/70 bg-orange-400/10 shadow-[0_0_10px_rgba(249,115,22,0.25)]',
    green:  'border-green-400/70 bg-green-400/10 shadow-[0_0_10px_rgba(74,222,128,0.25)]',
    pink:   'border-pink-400/70 bg-pink-400/10 shadow-[0_0_10px_rgba(244,114,182,0.25)]',
    blue:   'border-blue-400/70 bg-blue-400/10 shadow-[0_0_10px_rgba(96,165,250,0.25)]',
  };

  return (
    <button
      onClick={onClick}
      className={[
        'relative flex flex-col items-center gap-0.5 py-2 rounded-lg border text-[10px] transition-all duration-200 overflow-hidden group cursor-pointer',
        active
          ? `text-ar-text ${glowMap[accentColor] ?? glowMap.cyan}`
          : 'border-ar-border text-ar-text-muted hover:border-ar-border-subtle hover:text-ar-text hover:bg-ar-surface/30',
        className,
      ].join(' ')}
    >
      {/* Shimmer on hover */}
      <span
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/4 to-transparent pointer-events-none"
        aria-hidden
      />
      {children}
    </button>
  );
}
