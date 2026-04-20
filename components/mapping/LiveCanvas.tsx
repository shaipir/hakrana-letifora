'use client';

import { useMappingStore } from '@/lib/mapping-store';

export default function LiveCanvas() {
  const { live } = useMappingStore();

  return (
    <div className="flex flex-1 items-center justify-center bg-black relative overflow-hidden">
      {live.blackout ? (
        <div className="absolute inset-0 bg-black" />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-ar-text-muted text-sm">
          {live.isLive ? 'Live output active' : 'Go live to begin projection'}
        </div>
      )}
    </div>
  );
}
