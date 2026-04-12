'use client';
import { useState, useCallback } from 'react';
import { Upload, Film, Image, X, Link } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function MediaImport() {
  const { addLayer, updateLayer, layers, activeLayerId } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    if (activeLayerId) {
      updateLayer(activeLayerId, { mediaUrl: url, mediaType: type, type });
    } else {
      addLayer(type);
      setTimeout(() => {
        const newId = useAppStore.getState().layers[0]?.id;
        if (newId) updateLayer(newId, { mediaUrl: url, mediaType: type });
      }, 50);
    }
  }, [activeLayerId, addLayer, updateLayer]);

  const handleUrl = () => {
    if (!urlInput.trim()) return;
    const isVideo = /\.(mp4|mov|webm|avi)$/i.test(urlInput);
    const type = isVideo ? 'video' : 'image';
    if (activeLayerId) {
      updateLayer(activeLayerId, { mediaUrl: urlInput, mediaType: type, type });
    } else {
      addLayer(type);
      setTimeout(() => {
        const newId = useAppStore.getState().layers[0]?.id;
        if (newId) updateLayer(newId, { mediaUrl: urlInput, mediaType: type });
      }, 50);
    }
    setUrlInput('');
    setShowUrl(false);
  };

  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div className="p-3 flex flex-col gap-3">

      {/* Current media preview */}
      {activeLayer?.mediaUrl && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          {activeLayer.mediaType === 'video' ? (
            <video src={activeLayer.mediaUrl} className="w-full h-full object-contain" autoPlay loop muted />
          ) : (
            <img src={activeLayer.mediaUrl} className="w-full h-full object-contain" alt="media" />
          )}
          <button
            onClick={() => activeLayerId && updateLayer(activeLayerId, { mediaUrl: null, mediaType: null })}
            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-red-600 transition-colors">
            <X size={12} />
          </button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        onClick={() => document.getElementById('media-input')?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          dragOver ? 'border-accent bg-accent/10' : 'border-border hover:border-muted'
        }`}
      >
        <Upload size={20} className="mx-auto mb-2 text-gray-500" />
        <p className="text-xs text-gray-400">גרור פילס או <span className="text-accent">לחץ לבחירה</span></p>
        <p className="text-[10px] text-gray-600 mt-1">MP4 · MOV · PNG · JPG · GIF</p>
        <input id="media-input" type="file" className="hidden" accept="video/*,image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* URL import */}
      {showUrl ? (
        <div className="flex gap-1">
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 bg-surface border border-border rounded-lg px-2 py-1.5 text-xs focus:border-accent outline-none"
            onKeyDown={e => e.key === 'Enter' && handleUrl()}
          />
          <button onClick={handleUrl} className="px-3 py-1.5 bg-accent rounded-lg text-xs hover:bg-accent-hover transition-colors">טען</button>
          <button onClick={() => setShowUrl(false)} className="p-1.5 text-gray-500 hover:text-white"><X size={14}/></button>
        </div>
      ) : (
        <button onClick={() => setShowUrl(true)}
          className="flex items-center gap-2 p-2 rounded-xl border border-border text-gray-400 hover:text-white hover:border-muted text-xs transition-all">
          <Link size={13} /> יבוא מ-URL
        </button>
      )}

      {/* Quick add buttons */}
      <div className="grid grid-cols-2 gap-1">
        <button onClick={() => addLayer('video')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface border border-border text-gray-400 hover:text-white text-xs transition-all">
          <Film size={13} /> שכבת Video
        </button>
        <button onClick={() => addLayer('image')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface border border-border text-gray-400 hover:text-white text-xs transition-all">
          <Image size={13} /> שכבת Image
        </button>
      </div>
    </div>
  );
}
