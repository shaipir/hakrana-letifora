'use client';

/**
 * Orbital ring loader — replaces the scanline spinner for generation state.
 * Pure CSS, no canvas, no heavy deps.
 */
export default function OrbitLoader({ label = 'Generating…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      {/* Rings */}
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <span
          className="absolute inset-0 rounded-full border-2 border-ar-accent/30 border-t-ar-accent"
          style={{ animation: 'spin 1.2s linear infinite' }}
        />
        {/* Inner ring (counter-rotate) */}
        <span
          className="absolute inset-2 rounded-full border-2 border-ar-violet/20 border-b-ar-violet"
          style={{ animation: 'spin 0.8s linear infinite reverse' }}
        />
        {/* Core dot */}
        <span className="absolute inset-[18px] rounded-full bg-ar-accent/60 animate-pulse" />
      </div>

      <p className="text-[11px] text-ar-text-muted tracking-wider animate-pulse-slow">{label}</p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
