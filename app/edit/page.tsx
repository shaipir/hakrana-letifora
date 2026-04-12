'use client';
import { useState } from 'react';
import { Pencil, Wand2, Brush, Layers, Box, Droplets, Sparkle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import AppShell from '@/components/navigation/AppShell';

const REGION_ACTIONS = [
  { id: 'replace',    label: 'החלף',      icon: <Wand2 size={18} />,    color: 'text-purple-400' },
  { id: 'restyle',   label: 'עיצוב מחדש', icon: <Brush size={18} />,    color: 'text-blue-400' },
  { id: 'add_light', label: 'אור',       icon: <Sparkle size={18} />,  color: 'text-yellow-400' },
  { id: 'texture',   label: 'טקסטורה',  icon: <Box size={18} />,      color: 'text-teal-400' },
  { id: 'particles', label: 'פרטיקלים', icon: <Droplets size={18} />, color: 'text-cyan-400' },
  { id: 'animate',   label: 'הנפש',     icon: <Layers size={18} />,  color: 'text-pink-400' },
];

const MATERIALS = [
  'עור', 'אבן', 'שיש ', 'לבה אובקית', 'מתכת', 'זהב', 'קרח', 'זכוכית', 'קריסטל', 'עץ', 'חול', 'עקרית', 'מסטה'
];

export default function EditPage() {
  const { layers, activeLayerId, aiPrompt, setAiPrompt } = useAppStore();
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const layer = layers.find(l => l.id === activeLayerId);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-5">

        {/* Canvas preview */}
        <div className="aspect-video rounded-2xl glass flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-black" />
          <div className="relative text-center">
            <div className="text-4xl mb-2">🎭</div>
            <p className="text-sm text-gray-400">בחר שכבה מה-Editor כדי לערוך</p>
          </div>
        </div>

        {/* Edit by prompt */}
        <div className="glass rounded-2xl p-4">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">ערוך בטקסט</label>
          <div className="flex gap-2">
            <input
              value={editPrompt}
              onChange={e => setEditPrompt(e.target.value)}
              placeholder="add glowing cracks, make eyes shine, remove background..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:border-accent outline-none transition-colors"
            />
            <button className="px-4 py-2 bg-accent rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors">
              <Pencil size={16} />
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">פעולות על אזור</label>
          <div className="grid grid-cols-3 gap-2">
            {REGION_ACTIONS.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAction(selectedAction === a.id ? null : a.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
                  selectedAction === a.id ? 'border-accent bg-accent/20' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <span className={a.color}>{a.icon}</span>
                <span className="text-gray-300">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Material presets */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">חומר משטח</label>
          <div className="flex flex-wrap gap-2">
            {MATERIALS.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMaterial(selectedMaterial === m ? null : m)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedMaterial === m ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >{m}</button>
            ))}
          </div>
        </div>

        {/* Background controls */}
        <div className="glass rounded-2xl p-4">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">רקע</label>
          <div className="grid grid-cols-2 gap-2">
            {['הסר רקע', 'החלף רקע', 'טשטש רקע', 'שחר להקרנה'].map(a => (
              <button key={a} className="p-2.5 rounded-xl border border-white/10 text-gray-400 text-sm hover:border-white/20 hover:text-white transition-all">{a}</button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
