'use client';
import { Monitor, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Layer } from '@/lib/types';

export default function LayerPanel() {
  const { layers, activeLayerId, setActiveLayer, addLayer, removeLayer, updateLayer, moveLayer } = useAppStore();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-gray-300">שכבות</span>
        <button
          onClick={() => addLayer('effect')}
          className="p-1 rounded hover:bg-surface text-gray-400 hover:text-white transition-colors"
          title="הוסף שכבה"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            אין שכבות. לחץ + להוסיף.
          </div>
        )}
        {layers.map((layer, idx) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isActive={layer.id === activeLayerId}
            isFirst={idx === 0}
            isLast={idx === layers.length - 1}
            onSelect={() => setActiveLayer(layer.id)}
            onToggleVisible={() => updateLayer(layer.id, { visible: !layer.visible })}
            onDelete={() => removeLayer(layer.id)}
            onMoveUp={() => moveLayer(layer.id, 'up')}
            onMoveDown={() => moveLayer(layer.id, 'down')}
          />
        ))}
      </div>
    </div>
  );
}

function LayerItem({
  layer, isActive, isFirst, isLast,
  onSelect, onToggleVisible, onDelete, onMoveUp, onMoveDown
}: {
  layer: Layer;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border/50 transition-colors ${
        isActive ? 'bg-accent/20 border-l-2 border-l-accent' : 'hover:bg-surface'
      }`}
      onClick={onSelect}
    >
      {/* Type icon */}
      <Monitor size={14} className="text-gray-500 shrink-0" />

      {/* Name */}
      <span className="flex-1 text-sm text-gray-200 truncate">{layer.name}</span>

      {/* Controls */}
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button onClick={onMoveUp} disabled={isFirst} className="p-0.5 hover:text-white text-gray-500 disabled:opacity-20">
          <ChevronUp size={13} />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="p-0.5 hover:text-white text-gray-500 disabled:opacity-20">
          <ChevronDown size={13} />
        </button>
        <button onClick={onToggleVisible} className="p-0.5 hover:text-white text-gray-500">
          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button onClick={onDelete} className="p-0.5 hover:text-red-400 text-gray-500">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
