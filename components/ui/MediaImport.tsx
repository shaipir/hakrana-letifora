'use client';
import { useState } from 'react';
import { Upload, Film, Image } from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function MediaImport() {
  const { addLayer, updateLayer, layers, activeLayerId } = useAppStore();
  const [draggingOver, setDraggingOver] = useState(false);

  const handleFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    // אם יש שכבה פעילה — עדכן אותה
    if (activeLayerId) {
      updateLayer(activeLayerId, { mediaUrl: url, mediaType: type, type });
    } else {
      // אחרת — בנה שכבה חדשה
      addLayer(type);
      const newId = useAppStore.getState().layers[0].id;
      updateLayer(newId, { mediaUrl: url, mediaType: type });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      <label className="text-xs text-gray-500 uppercase tracking-wider">יבוא מדיה</label>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          draggingOver ? 'border-accent bg-accent/10' : 'border-border hover:border-muted'
        }`}
        onClick={() => document.getElementById('media-input')?.click()}
      >
        <Upload size={24} className="mx-auto mb-2 text-gray-500" />
        <p className="text-sm text-gray-400">גרור ושלח פילס, או <span className="text-accent">לחץ לבחירה</span></p>
        <p className="text-xs text-gray-600 mt-1">תומך ב-MP4, MOV, PNG, JPG, GIF</p>
        <input
          id="media-input" type="file" className="hidden"
          accept="video/*,image/*"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => addLayer('video')}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-surface border border-border text-gray-400 hover:text-white hover:border-muted text-sm transition-all"
        >
          <Film size={14} /> Video
        </button>
        <button
          onClick={() => addLayer('image')}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-surface border border-border text-gray-400 hover:text-white hover:border-muted text-sm transition-all"
        >
          <Image size={14} /> Image
        </button>
      </div>
    </div>
  );
}
