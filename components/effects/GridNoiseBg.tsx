'use client';

/**
 * Subtle animated dot-grid background.
 * Renders as an absolutely-positioned element — place inside a relative container.
 */
export default function GridNoiseBg({ opacity = 0.3 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ opacity }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="rgba(0,229,255,0.25)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      {/* Radial vignette so edges fade */}
      <div className="absolute inset-0 bg-radial-fade" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, #0c0c14 80%)',
      }} />
    </div>
  );
}
