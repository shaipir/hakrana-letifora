'use client';
import { useRef } from 'react';
import { Upload, Image as ImageIcon, Sliders } from 'lucide-react';
import { useStudioStore } from '@/lib/studio/store';
import { useArtReviveStore } from '@/lib/artrevive-store';

export default function ReferencePanel() {
  const { referenceUrl, setReference, showReference, setShowReference, referenceOpacity, setReferenceOpacity } = useStudioStore();
  const { project } = useArtReviveStore();
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setReference(url, img.naturalWidth, img.naturalHeight);
    img.src = url;
  }

  function useFromApp() {
    const url = project.uploadedAsset?.url ?? project.generatedAssets[0]?.url;
    if (!url) return;
    const img = new Image();
    img.onload = () => setReference(url, img.naturalWidth, img.naturalHeight);
    img.src = url;
  }

  const hasAppImage = !!(project.uploadedAsset?.url ?? project.generatedAssets[0]?.url);

  return (
    <div className="shrink-0 border-b border-ar-border bg-ar-surface/20">
      <div className="px-3 py-2">
        <span className="text-[10px] font-semibold text-ar-text-muted uppercase tracking-widest">Reference Photo</span>
      </div>

      <div className="px-2 pb-2 space-y-1.5">
        {/* Upload / use from app */}
        <div className="flex gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-ar-border hover:border-ar-accent/50 hover:bg-ar-accent/5 transition-colors text-[10px] text-ar-text-muted hover:text-ar-accent"
          >
            <Upload className="w-3 h-3" />
            Upload photo
          </button>
          {hasAppImage && (
            <button
              onClick={useFromApp}
              className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-ar-border hover:border-ar-accent/50 hover:bg-ar-accent/5 transition-colors text-[10px] text-ar-text-muted hover:text-ar-accent"
              title="Use image from generator"
            >
              <ImageIcon className="w-3 h-3" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {/* Opacity slider */}
        {referenceUrl && (
          <div className="flex items-center gap-2">
            <Sliders className="w-3 h-3 text-ar-text-dim shrink-0" />
            <input
              type="range" min="0" max="1" step="0.01"
              value={referenceOpacity}
              onChange={e => setReferenceOpacity(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-ar-accent"
            />
            <span className="text-[9px] text-ar-text-dim font-mono w-7 text-right">
              {Math.round(referenceOpacity * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
