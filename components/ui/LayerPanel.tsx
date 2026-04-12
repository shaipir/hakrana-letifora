'use client';
import { Monitor, Plus, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Circle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Layer } from '@/lib/types';

export default function LayerPanel() {
  const { layers, activeLayerId, setActiveLayer, addLayer, removeLayer, updateLayer, moveLayer, removeRegionFromLayer } = useAppStore();
  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">שכבות</span>
        <button onClick={() => addLayer('effect')}
          className="p-1 rounded hover:bg-surface text-gray-400 hover:text-white transition-colors">
          <Plus size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 && (
          <div className="p-4 text-center text-gray-600 text-xs">לחץ + להוסיף שכבה</div>
        )}
        {layers.map((layer, idx) => (
          <div key={layer.id}>
            <div
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer border-b border-border/40 transition-colors ${
                layer.id === activeLayerId ? 'bg-accent/15 border-l-2 border-l-accent' : 'hover:bg-surface'
              }`}
              onClick={() => setActiveLayer(layer.id)}
            >
              <Monitor size={13} className="text-gray-500 shrink-0" />
              <span className="flex-1 text-xs text-gray-200 truncate">{layer.name}</span>
              {layer.theme && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">{layer.theme}</span>
              )}
              <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                <button onClick={() => moveLayer(layer.id,'up')} disabled={idx===0} className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20"><ChevronUp size={12} /></button>
                <button onClick={() => moveLayer(layer.id,'down')} disabled={idx===layers.length-1} className="p-0.5 hover:text-white text-gray-600 disabled:opacity-20"><ChevronDown size={12} /></button>
                <button onClick={() => updateLayer(layer.id,{visible:!layer.visible})} className="p-0.5 hover:text-white text-gray-500">
                  {layer.visible ? <Eye size={12}/> : <EyeOff size={12}/>}
                </button>
                <button onClick={() => removeLayer(layer.id)} className="p-0.5 hover:text-red-400 text-gray-600"><Trash2 size={12}/></button>
              </div>
            </div>
            {/* Regions under active layer */}
            {layer.id === activeLayerId && layer.regions.length > 0 && (
              <div className="bg-black/20">
                {layer.regions.map(region => (
                  <div key={region.id} className="flex items-center gap-2 px-5 py-1.5 border-b border-border/20">
                    <Circle size={8} style={{ color: region.color }} fill={region.color} className="shrink-0" />
                    <span className="flex-1 text-[11px] text-gray-400 truncate">{region.name}</span>
                    {region.animationPreset !== 'none' && (
                      <span className="text-[9px] text-purple-400">{region.animationPreset}</span>
                    )}
                    <button onClick={() => removeRegionFromLayer(layer.id, region.id)} className="p-0.5 hover:text-red-400 text-gray-700">
                      <Trash2 size={10}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick add */}
      <div className="border-t border-border p-2 grid grid-cols-2 gap-1">
        {([['effect','אפקט'],['video','וידאו'],['image','תמונה'],['draw','צייר']] as [Layer['type'],string][]).map(([t,label]) => (
          <button key={t} onClick={() => addLayer(t)}
            className="py-1 rounded-lg text-[10px] text-gray-500 hover:text-white hover:bg-surface border border-border transition-all">
            + {label}
          </button>
        ))}
      </div>
    </div>
  );
}
