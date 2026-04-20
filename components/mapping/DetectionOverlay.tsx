'use client';

import { Check, X } from 'lucide-react';
import { useMappingStore } from '@/lib/mapping-store';

export default function DetectionOverlay() {
  const { project, acceptZone, rejectZone } = useMappingStore();
  const { detectedZones } = project;

  if (!detectedZones || detectedZones.length === 0) return null;

  return (
    <div className="p-3 border-b border-ar-border">
      <p className="text-xs font-semibold uppercase tracking-wider text-ar-text-muted mb-2">
        Detected Zones
      </p>

      <ul className="flex flex-col gap-1.5">
        {detectedZones.map((zone) => (
          <li
            key={zone.id}
            className={`flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
              zone.accepted
                ? 'bg-green-900/30 border border-green-700/40 text-green-300'
                : 'bg-ar-panel border border-ar-border text-ar-text'
            }`}
          >
            <div className="flex flex-col min-w-0 mr-2">
              <span className="font-medium truncate">{zone.label}</span>
              <span className="text-ar-text-muted text-[10px]">
                {zone.points.length} pts
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {zone.accepted ? (
                <span className="text-[10px] font-semibold text-green-400 bg-green-900/40 px-1.5 py-0.5 rounded">
                  Added
                </span>
              ) : (
                <>
                  <button
                    onClick={() => acceptZone(zone.id)}
                    title="Accept zone"
                    className="p-1 rounded hover:bg-green-700/30 text-green-400 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => rejectZone(zone.id)}
                    title="Reject zone"
                    className="p-1 rounded hover:bg-pink-700/30 text-pink-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
