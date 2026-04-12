'use client';

import { useRef } from 'react';
import { Upload, Zap, Download, RotateCcw, Layers } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { UploadedAsset } from '@/lib/types';

export default function TopBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    activeMode, setMode,
    project,
    isUploading, isGenerating, isExporting,
    setUploadedAsset, setUploading, setUploadError,
    selectedResultId, project: { generatedAssets },
    setGenerating, setGenerateError, addGeneratedAsset,
    setExporting, resetProject,
  } = useArtReviveStore();

  const hasImage = !!project.uploadedAsset;
  const selectedAsset = generatedAssets.find((a) => a.id === selectedResultId);

  // ── Upload ──────────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setUploadError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Upload failed');
      setUploadedAsset(json.asset as UploadedAsset);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // ── Generate ────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!project.uploadedAsset || isGenerating) return;
    setGenerating(true);
    setGenerateError(null);

    try {
      const endpoint = activeMode === 'restyle' ? '/api/restyle' : '/api/neon-contour';
      const body =
        activeMode === 'restyle'
          ? {
              imageUrl: project.uploadedAsset.url,
              mimeType: project.uploadedAsset.mimeType,
              settings: project.restyleSettings,
              sourceAssetId: project.uploadedAsset.id,
            }
          : {
              imageUrl: project.uploadedAsset.url,
              settings: project.neonContourSettings,
              sourceAssetId: project.uploadedAsset.id,
            };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Generation failed');
      addGeneratedAsset(json.asset);
    } catch (err: any) {
      setGenerateError(err?.message ?? 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────
  async function handleExport() {
    if (!selectedAsset && !project.uploadedAsset) return;
    setExporting(true);

    try {
      const exportUrl = selectedAsset?.url ?? project.uploadedAsset!.url;
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId: exportUrl, format: 'png' }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Export failed');

      // Trigger download
      const a = document.createElement('a');
      a.href = json.url;
      a.download = json.filename ?? 'artrevive-export.png';
      a.click();
    } catch (err: any) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <header className="h-14 flex items-center px-4 gap-3 border-b border-ar-border bg-ar-panel shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-md bg-ar-accent/10 border border-ar-accent/30 flex items-center justify-center">
          <Layers className="w-4 h-4 text-ar-accent" />
        </div>
        <span className="font-semibold text-sm tracking-wide text-ar-text">ArtRevive</span>
      </div>

      <div className="ar-divider w-px h-5 bg-ar-border mx-1" />

      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-ar-border bg-ar-surface hover:bg-ar-border hover:border-ar-text-dim transition-colors disabled:opacity-50"
      >
        <Upload className="w-3.5 h-3.5" />
        {isUploading ? 'Uploading…' : hasImage ? 'Replace Image' : 'Upload Image'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mode switch */}
      <div className="flex rounded-md border border-ar-border bg-ar-surface overflow-hidden">
        {(['restyle', 'neon-contour'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-sm transition-colors ${
              activeMode === m
                ? m === 'restyle'
                  ? 'bg-ar-violet/20 text-ar-violet border-r border-ar-border'
                  : 'bg-ar-accent/10 text-ar-accent'
                : 'text-ar-text-muted hover:text-ar-text'
            }`}
          >
            {m === 'restyle' ? 'Restyle' : 'Neon Contour'}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={!hasImage || isGenerating}
        className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          activeMode === 'restyle'
            ? 'bg-ar-violet hover:bg-ar-violet/80 text-white glow-violet'
            : 'bg-ar-accent/10 hover:bg-ar-accent/20 text-ar-accent border border-ar-accent/40 glow-sm'
        }`}
      >
        <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin-slow' : ''}`} />
        {isGenerating ? 'Generating…' : 'Generate'}
      </button>

      {/* Export */}
      <button
        onClick={handleExport}
        disabled={!selectedAsset || isExporting}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40"
      >
        <Download className="w-3.5 h-3.5" />
        {isExporting ? 'Exporting…' : 'Export'}
      </button>

      {/* Reset */}
      {hasImage && (
        <button
          onClick={resetProject}
          title="Reset project"
          className="p-2 rounded-md text-ar-text-muted hover:text-ar-text hover:bg-ar-border transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </header>
  );
}
