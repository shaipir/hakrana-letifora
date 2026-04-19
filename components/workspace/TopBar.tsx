'use client';

import { useRef, useState, useEffect } from 'react';
import { Upload, Zap, Download, RotateCcw, Layers, Settings, X, Eye, EyeOff } from 'lucide-react';
import { useArtReviveStore } from '@/lib/artrevive-store';
import { UploadedAsset, GeneratedAsset, GeneratedLoop, GenerationHistoryItem } from '@/lib/types';

const GEMINI_KEY_STORAGE = 'artrevive_gemini_key';

export default function TopBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    activeMode, setMode,
    project,
    isUploading, isGenerating, isGeneratingLoop, isExporting,
    setUploadedAsset, setUploading, setUploadError,
    selectedResultId, project: { generatedAssets, loopSettings },
    setGenerating, setGeneratingLoop, setGenerateError, addGeneratedAsset, setGeneratedLoop,
    setExporting, resetProject, generatedLoop, addGenerationHistory, pushLoopHistory,
  } = useArtReviveStore();

  const hasImage = !!project.uploadedAsset;
  const selectedAsset = generatedAssets.find((a) => a.id === selectedResultId);
  const isLoopMode = loopSettings.outputMode === 'loop';
  const isBusy = isGenerating || isGeneratingLoop;

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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED.includes(file.type)) { setUploadError('Unsupported type. Use JPEG, PNG, WebP or GIF.'); return; }
    if (file.size > 20 * 1024 * 1024) { setUploadError('File too large. Max 20 MB.'); return; }
    setUploading(true); setUploadError(null);
    try {
      const dataUrl = await readAsDataURL(file);
      const { width, height } = await measureImage(dataUrl);
      const asset: UploadedAsset = {
        id: crypto.randomUUID(), url: dataUrl, originalName: file.name,
        mimeType: file.type, width, height, uploadedAt: new Date().toISOString(),
      };
      setUploadedAsset(asset);
    } catch (err: any) { setUploadError(err?.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  }

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
      const img = new window.Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = src;
    });
  }

  async function loadPollinationsUrl(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Pollinations fetch failed: ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }

  async function handleGenerate() {
    if (!project.uploadedAsset || isBusy) return;

    const storedKey = getStoredKey();

    if (isLoopMode) {
      setGeneratingLoop(true);
      setGenerateError(null);
      setGeneratedLoop(null);
      try {
        const { base64: imageBase64, mimeType } = await resizeImageForApi(project.uploadedAsset.url, 1024);
        const settings = activeMode === 'restyle'
          ? project.restyleSettings
          : activeMode === 'glow-sculpture'
          ? project.glowSculptureSettings
          : project.houseProjectionSettings;

        const res = await fetch('/api/generate-loop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64, mimeType, mode: activeMode,
            settings, loopSettings: project.loopSettings,
            apiKey: storedKey || undefined,
          }),
        });
        const text = await res.text();
        let json: any;
        try { json = JSON.parse(text); }
        catch { throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`); }
        if (!res.ok) throw new Error(json?.error ?? `Loop failed (${res.status})`);

        const resolvedFrames = await Promise.all(
          (json.frames as string[]).map(async (f: string) => {
            if (f.startsWith('http')) {
              try { return await loadPollinationsUrl(f); } catch { return f; }
            }
            return f;
          })
        );

        const loop: GeneratedLoop = {
          id: crypto.randomUUID(),
          frames: resolvedFrames,
          frameCount: json.frameCount,
          mode: activeMode,
          motionType: json.motionType,
          sourceAssetId: project.uploadedAsset.id,
          createdAt: new Date().toISOString(),
        };
        setGeneratedLoop(loop);
        pushLoopHistory(loop);
        addGenerationHistory({
          id: crypto.randomUUID(), createdAt: new Date().toISOString(),
          mode: activeMode, outputType: 'loop',
          prompt: (settings as any).customStylePrompt ?? '',
          settingsSnapshot: settings as unknown as Record<string, unknown>,
          sourceAssetId: project.uploadedAsset.id,
          resultAssetIds: [],
          fallbackUsed: json.fallbackUsed ?? false,
        });
      } catch (err: any) {
        setGenerateError(err?.message ?? 'Loop generation failed');
      } finally {
        setGeneratingLoop(false);
      }
      return;
    }

    setGenerating(true);
    setGenerateError(null);
    setGeneratedLoop(null);  // clear loop so still image is visible
    try {
      const { base64: imageBase64, mimeType } = await resizeImageForApi(project.uploadedAsset.url, 1024);

      async function safePost(url: string, body: object) {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const text = await res.text();
        let json: any;
        try { json = JSON.parse(text); }
        catch { throw new Error(`Server error (${res.status}): ${text.slice(0, 200)}`); }
        if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`);
        return json;
      }

      if (activeMode === 'restyle') {
        const json = await safePost('/api/world-transform', {
          imageBase64, mimeType, settings: project.restyleSettings, apiKey: storedKey || undefined,
        });
        if (json.fallback) setGenerateError(`⚠ Gemini fallback: ${json.fallbackReason}`);
        const resultUrl = json.url ?? await loadPollinationsUrl(json.pollinationsUrl);
        const assetId = crypto.randomUUID();
        addGeneratedAsset({ id: assetId, url: resultUrl, mode: 'restyle',
          settings: project.restyleSettings, sourceAssetId: project.uploadedAsset.id, createdAt: new Date().toISOString() });
        addGenerationHistory({ id: crypto.randomUUID(), createdAt: new Date().toISOString(),
          mode: 'restyle', outputType: 'still',
          prompt: project.restyleSettings.customStylePrompt,
          settingsSnapshot: project.restyleSettings as unknown as Record<string, unknown>,
          sourceAssetId: project.uploadedAsset.id, resultAssetIds: [assetId],
          fallbackUsed: !!json.fallback });

      } else if (activeMode === 'glow-sculpture') {
        const json = await safePost('/api/glow-sculpture', {
          imageBase64, mimeType, settings: project.glowSculptureSettings, apiKey: storedKey || undefined,
        });
        if (json.fallback) setGenerateError(`⚠ Gemini fallback: ${json.fallbackReason}`);
        const resultUrl = json.url ?? await loadPollinationsUrl(json.pollinationsUrl);
        const assetId2 = crypto.randomUUID();
        addGeneratedAsset({ id: assetId2, url: resultUrl, mode: 'glow-sculpture',
          settings: project.glowSculptureSettings, sourceAssetId: project.uploadedAsset.id, createdAt: new Date().toISOString() });
        addGenerationHistory({ id: crypto.randomUUID(), createdAt: new Date().toISOString(),
          mode: 'glow-sculpture', outputType: 'still',
          prompt: project.glowSculptureSettings.customStylePrompt,
          settingsSnapshot: project.glowSculptureSettings as unknown as Record<string, unknown>,
          sourceAssetId: project.uploadedAsset.id, resultAssetIds: [assetId2],
          fallbackUsed: !!json.fallback });

      } else if (activeMode === 'house-projection') {
        const json = await safePost('/api/house-projection', {
          imageBase64, mimeType, settings: project.houseProjectionSettings, apiKey: storedKey || undefined,
        });
        if (json.fallback) setGenerateError(`⚠ Gemini fallback: ${json.fallbackReason}`);
        const resultUrl = json.url ?? await loadPollinationsUrl(json.pollinationsUrl);
        const assetId3 = crypto.randomUUID();
        addGeneratedAsset({ id: assetId3, url: resultUrl, mode: 'house-projection',
          settings: project.houseProjectionSettings, sourceAssetId: project.uploadedAsset.id, createdAt: new Date().toISOString() });
        addGenerationHistory({ id: crypto.randomUUID(), createdAt: new Date().toISOString(),
          mode: 'house-projection', outputType: 'still',
          prompt: project.houseProjectionSettings.customStylePrompt,
          settingsSnapshot: project.houseProjectionSettings as unknown as Record<string, unknown>,
          sourceAssetId: project.uploadedAsset.id, resultAssetIds: [assetId3],
          fallbackUsed: !!json.fallback });
      }
    } catch (err: any) {
      setGenerateError(err?.message ?? 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport() {
    const exportAsset = selectedAsset ?? project.uploadedAsset;
    if (!exportAsset && !generatedLoop) return;
    setExporting(true);
    try {
      const a = document.createElement('a');
      a.href = (exportAsset ?? project.uploadedAsset)!.url;
      a.download = `artrevive-export.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  }

  const hasKey = !!apiKeyInput.trim();
  const modeAccentClass = activeMode === 'restyle'
    ? 'bg-ar-violet hover:bg-ar-violet/80 text-white'
    : activeMode === 'glow-sculpture'
    ? 'bg-ar-accent/10 hover:bg-ar-accent/20 text-ar-accent border border-ar-accent/40'
    : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/40';

  return (
    <>
      <header className="h-[52px] flex items-center px-4 gap-3 border-b border-ar-border bg-ar-panel shrink-0 z-20">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded bg-ar-accent/10 border border-ar-accent/30 flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-ar-accent" />
          </div>
          <span className="font-semibold text-xs tracking-[0.12em] uppercase text-ar-text">ArtRevive</span>
        </div>

        <div className="w-px h-4 bg-ar-border mx-1" />

        {/* Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs border border-ar-border bg-ar-surface hover:bg-ar-border hover:border-ar-text-dim transition-colors disabled:opacity-50 tracking-wide"
        >
          <Upload className="w-3 h-3" />
          {isUploading ? 'Loading…' : hasImage ? 'Replace' : 'Upload'}
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

        {/* Mode switch */}
        <div className="flex rounded border border-ar-border bg-ar-surface overflow-hidden">
          {([
            { id: 'restyle',          label: 'World Transform' },
            { id: 'glow-sculpture',   label: 'Glow Sculpture' },
            { id: 'house-projection', label: 'House Projection' },
          ] as const).map((m, i, arr) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1 text-xs tracking-wide transition-all ${i < arr.length - 1 ? 'border-r border-ar-border' : ''} ${
                activeMode === m.id
                  ? m.id === 'restyle'
                    ? 'bg-ar-violet/20 text-ar-violet shadow-[inset_0_-1px_0_rgba(139,92,246,0.5)]'
                    : m.id === 'glow-sculpture'
                    ? 'bg-ar-accent/10 text-ar-accent shadow-[inset_0_-1px_0_rgba(0,229,255,0.5)]'
                    : 'bg-orange-500/10 text-orange-400 shadow-[inset_0_-1px_0_rgba(249,115,22,0.5)]'
                  : 'text-ar-text-muted hover:text-ar-text'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Generate */}
        <button
          onClick={handleGenerate}
          disabled={!hasImage || isBusy}
          className={`flex items-center gap-1.5 px-4 py-1 rounded text-xs font-medium tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${modeAccentClass}`}
        >
          <Zap className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
          {isBusy
            ? (isGeneratingLoop ? 'Building Loop…' : 'Generating…')
            : isLoopMode ? 'Generate Loop' : 'Generate'}
        </button>

        {/* Export */}
        <button
          onClick={handleExport}
          disabled={(!selectedAsset && !generatedLoop) || isExporting}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs border border-ar-border bg-ar-surface hover:bg-ar-border transition-colors disabled:opacity-40 tracking-wide"
        >
          <Download className="w-3 h-3" />
          {isExporting ? 'Exporting…' : 'Export'}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          title={hasKey ? 'Settings' : 'Add Gemini API key'}
          className="relative p-1.5 rounded transition-colors text-ar-text-muted hover:text-ar-text hover:bg-ar-border"
        >
          <Settings className="w-3.5 h-3.5" />
          {!hasKey && (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-ar-neon-pink" />
          )}
        </button>

        {/* Reset */}
        {hasImage && (
          <button onClick={resetProject} title="Reset project"
            className="p-1.5 rounded text-ar-text-muted hover:text-ar-text hover:bg-ar-border transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false); }}>
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
                  <span className="ml-1 text-ar-text-dim">(required for AI generation)</span>
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
                    <button type="button" onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ar-text-dim hover:text-ar-text">
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button onClick={saveApiKey}
                    className="px-4 py-2 rounded-md text-sm bg-ar-accent/10 text-ar-accent border border-ar-accent/30 hover:bg-ar-accent/20 transition-colors">
                    {keySaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-ar-text-dim mt-1.5">
                  Get a free key at{' '}
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-ar-accent hover:underline">
                    aistudio.google.com
                  </a>. Stored in your browser only.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
