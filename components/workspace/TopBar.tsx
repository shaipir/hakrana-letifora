'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, Zap, Download, RotateCcw, Layers, Settings, X, Eye, EyeOff } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { UploadedAsset, GeneratedAsset } from '@/lib/types';
import { canvasRestyle } from '@/lib/restyle/canvas-transform';

const GEMINI_KEY_STORAGE = 'artrevive_gemini_key';

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

  // ── Settings modal ───────────────────────────────────────────────────────
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(GEMINI_KEY_STORAGE) ?? '';
    setApiKeyInput(saved);
  }, []);

  function saveApiKey() {
    localStorage.setItem(GEMINI_KEY_STORAGE, apiKeyInput.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  function getStoredKey(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(GEMINI_KEY_STORAGE) ?? '';
  }

  // ── Upload (client-side — no server required) ───────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) {
      setUploadError(`Unsupported type. Use JPEG, PNG, WebP or GIF.`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('File too large. Max 20 MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const dataUrl = await readAsDataURL(file);
      const { width, height } = await measureImage(dataUrl);
      const asset: UploadedAsset = {
        id: crypto.randomUUID(),
        url: dataUrl,
        originalName: file.name,
        mimeType: file.type,
        width,
        height,
        uploadedAt: new Date().toISOString(),
      };
      setUploadedAsset(asset);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Resize image to maxPx on longest side, return base64 + mimeType
  function resizeImageForApi(dataUrl: string, maxPx: number): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        cv.getContext('2d')!.drawImage(img, 0, 0, w, h);
        const resized = cv.toDataURL('image/jpeg', 0.85);
        const comma = resized.indexOf(',');
        resolve({ base64: resized.slice(comma + 1), mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function measureImage(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = src;
    });
  }

  // ── Generate ────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!project.uploadedAsset || isGenerating) return;
    setGenerating(true);
    setGenerateError(null);

    try {
      if (activeMode === 'restyle') {
        const { base64: imageBase64, mimeType } = await resizeImageForApi(
          project.uploadedAsset.url, 1024
        );
        const storedKey = getStoredKey();

        const res = await fetch('/api/world-transform', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType,
            settings: project.restyleSettings,
            apiKey: storedKey || undefined,
          }),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? 'World Transform failed');
        }

        if (json.fallback) {
          setGenerateError(`Note: Using ${json.model} fallback (Gemini key not set or unavailable)`);
        }

        const asset: GeneratedAsset = {
          id: crypto.randomUUID(),
          url: json.url,
          mode: 'restyle',
          settings: project.restyleSettings,
          sourceAssetId: project.uploadedAsset.id,
          createdAt: new Date().toISOString(),
        };
        addGeneratedAsset(asset);
      } else if (activeMode === 'neon-contour') {
        // Neon contour — server-side
        const res = await fetch('/api/neon-contour', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: project.uploadedAsset.url,
            settings: project.neonContourSettings,
            sourceAssetId: project.uploadedAsset.id,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Generation failed');
        addGeneratedAsset(json.asset);
      } else if (activeMode === 'house-projection') {
        const { base64: imageBase64, mimeType } = await resizeImageForApi(
          project.uploadedAsset.url, 1024
        );
        const storedKey = getStoredKey();

        const res = await fetch('/api/house-projection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            mimeType,
            settings: project.houseProjectionSettings,
            apiKey: storedKey || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'House Projection failed');

        if (json.fallback) {
          setGenerateError(`Note: Using ${json.model} fallback (Gemini unavailable)`);
        }

        const asset: GeneratedAsset = {
          id: crypto.randomUUID(),
          url: json.url,
          mode: 'house-projection',
          settings: project.houseProjectionSettings,
          sourceAssetId: project.uploadedAsset.id,
          createdAt: new Date().toISOString(),
        };
        addGeneratedAsset(asset);
      }
    } catch (err: any) {
      setGenerateError(err?.message ?? 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  // ── Export ──────────────────────────────────────────────────────────────
  async function handleExport() {
    const exportAsset = selectedAsset ?? project.uploadedAsset;
    if (!exportAsset) return;
    setExporting(true);
    try {
      const a = document.createElement('a');
      a.href = exportAsset.url;
      a.download = `artrevive-export.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const hasKey = !!apiKeyInput.trim();

  return (
    <>
      <header className="h-14 flex items-center px-4 gap-3 border-b border-ar-border bg-ar-panel shrink-0 z-20">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-md bg-ar-accent/10 border border-ar-accent/30 flex items-center justify-center">
            <Layers className="w-4 h-4 text-ar-accent" />
          </div>
          <span className="font-semibold text-sm tracking-wide text-ar-text">ArtRevive</span>
        </div>

        <div className="w-px h-5 bg-ar-border mx-1" />

        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm border border-ar-border bg-ar-surface hover:bg-ar-border hover:border-ar-text-dim transition-colors disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {isUploading ? 'Loading…' : hasImage ? 'Replace Image' : 'Upload Image'}
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
          {([
            { id: 'restyle', label: 'Restyle' },
            { id: 'neon-contour', label: 'Neon Contour' },
            { id: 'house-projection', label: '🏠 House' },
          ] as const).map((m, i, arr) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 text-sm transition-colors ${i < arr.length - 1 ? 'border-r border-ar-border' : ''} ${
                activeMode === m.id
                  ? m.id === 'restyle'
                    ? 'bg-ar-violet/20 text-ar-violet'
                    : m.id === 'neon-contour'
                    ? 'bg-ar-accent/10 text-ar-accent'
                    : 'bg-orange-500/10 text-orange-400'
                  : 'text-ar-text-muted hover:text-ar-text'
              }`}
            >
              {m.label}
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
              ? 'bg-ar-violet hover:bg-ar-violet/80 text-white'
              : activeMode === 'neon-contour'
              ? 'bg-ar-accent/10 hover:bg-ar-accent/20 text-ar-accent border border-ar-accent/40'
              : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/40'
          }`}
        >
          <Zap className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
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

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          title="Settings"
          className={`p-2 rounded-md transition-colors ${
            hasKey
              ? 'text-ar-accent hover:bg-ar-accent/10'
              : 'text-ar-neon-pink hover:bg-ar-neon-pink/10'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
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

      {/* ── Settings modal ─────────────────────────────────────────────────── */}
      {showSettings && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}
        >
          <div className="bg-ar-panel border border-ar-border rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-ar-text">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-ar-text-muted hover:text-ar-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-ar-text-muted mb-1.5">
                  Google Gemini API Key
                  <span className="ml-1 text-ar-text-dim">(for Restyle mode)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="AIza..."
                      className="w-full bg-ar-surface border border-ar-border rounded-md px-3 py-2 text-sm text-ar-text placeholder:text-ar-text-dim focus:outline-none focus:border-ar-accent/60 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ar-text-dim hover:text-ar-text"
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    onClick={saveApiKey}
                    className="px-4 py-2 rounded-md text-sm bg-ar-accent/10 text-ar-accent border border-ar-accent/30 hover:bg-ar-accent/20 transition-colors"
                  >
                    {keySaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-ar-text-dim mt-1.5">
                  Get a free key at{' '}
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ar-accent hover:underline"
                  >
                    aistudio.google.com
                  </a>
                  . Stored in your browser only.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
