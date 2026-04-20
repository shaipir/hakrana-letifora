'use client';

import { useRef, useState } from 'react';
import { Camera, Scan, Loader2 } from 'lucide-react';
import { useMappingStore } from '@/lib/mapping-store';
import { detectSurfaces } from '@/lib/mapping/photo-detect';

export default function PhotoUpload() {
  const { project, setReferencePhoto, setDetectedZones } = useMappingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCount, setDetectedCount] = useState<number | null>(null);

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setReferencePhoto(dataUrl);
      setDetectedCount(null);
      setError(null);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  }

  async function handleDetect() {
    if (!project.referencePhotoUrl) return;

    setDetecting(true);
    setError(null);
    setDetectedCount(null);

    try {
      const dataUrl = project.referencePhotoUrl;
      // dataUrl format: data:<mimeType>;base64,<data>
      const commaIdx = dataUrl.indexOf(',');
      const meta = dataUrl.slice(5, commaIdx); // strip "data:"
      const mimeType = meta.split(';')[0];
      const imageBase64 = dataUrl.slice(commaIdx + 1);

      const apiKey =
        typeof window !== 'undefined'
          ? (localStorage.getItem('artrevive_gemini_key') ?? undefined)
          : undefined;

      const result = await detectSurfaces(imageBase64, mimeType, apiKey ?? undefined);
      setDetectedZones(result.zones);
      setDetectedCount(result.zones.length);

      if (result.zones.length === 0) {
        setError('No surfaces detected. Try a clearer photo with visible flat surfaces.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Detection failed';
      setError(message);
    } finally {
      setDetecting(false);
    }
  }

  return (
    <div className="p-3 border-b border-ar-border">
      <p className="text-xs font-semibold uppercase tracking-wider text-ar-text-muted mb-2">
        Reference Photo
      </p>

      {/* Upload area */}
      <button
        onClick={handleUploadClick}
        className="w-full flex flex-col items-center justify-center gap-1.5 py-4 rounded-md border border-dashed border-ar-border hover:border-ar-accent hover:bg-ar-accent/5 transition-colors text-ar-text-muted hover:text-ar-accent"
      >
        {project.referencePhotoUrl ? (
          <img
            src={project.referencePhotoUrl}
            alt="Reference"
            className="w-full h-24 object-cover rounded mb-1"
          />
        ) : (
          <>
            <Camera className="w-5 h-5" />
            <span className="text-xs">Upload photo</span>
          </>
        )}
        {project.referencePhotoUrl && (
          <span className="text-xs flex items-center gap-1">
            <Camera className="w-3 h-3" /> Change photo
          </span>
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Detect button — only shown after photo is uploaded */}
      {project.referencePhotoUrl && (
        <button
          onClick={handleDetect}
          disabled={detecting}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-md bg-ar-accent text-white text-xs font-medium hover:bg-ar-accent/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {detecting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Detecting…
            </>
          ) : (
            <>
              <Scan className="w-3.5 h-3.5" />
              Detect Surfaces (AI)
            </>
          )}
        </button>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-red-400 leading-snug">{error}</p>
      )}

      {/* Zone count message */}
      {detectedCount !== null && detectedCount > 0 && (
        <p className="mt-2 text-xs text-green-400">
          {detectedCount} surface{detectedCount === 1 ? '' : 's'} detected
        </p>
      )}
    </div>
  );
}
