'use client';
import { useState } from 'react';
import { Map, Maximize, Grid, Move, User, Target, RefreshCw, SlidersHorizontal } from 'lucide-react';
import AppShell from '@/components/navigation/AppShell';

const MAPPING_TYPES = [
  { id: 'corner_pin',   label: 'Corner Pin',    icon: <Maximize size={20} />,         desc: 'גרירת 4 פינות' },
  { id: 'mesh_warp',    label: 'Mesh Warp',     icon: <Grid size={20} />,              desc: 'רשת וקטורים' },
  { id: 'face',         label: 'Face Mapping',  icon: <User size={20} />,              desc: 'זיהוי אוטומטי' },
  { id: 'surface_warp', label: 'Surface Warp',  icon: <Move size={20} />,              desc: 'עיוות חופשי' },
  { id: 'multi_plane',  label: 'Multi-Plane',   icon: <Map size={20} />,               desc: 'כמה משטחים' },
  { id: 'calibration',  label: 'Calibration',   icon: <Target size={20} />,            desc: 'כיוון פרויקטור' },
];

const DEPTH_RESPONSES = [
  'התעלם מעומק', 'הקף למשטח', 'הדגש קצוות', 'זוהר בשקעים', 'הדגש בליטות', 'אנימציה לפי עקמומיות'
];

export default function MapPage() {
  const [mappingType, setMappingType] = useState('corner_pin');
  const [depthResponse, setDepthResponse] = useState<string | null>(null);
  const [keystoneH, setKeystoneH] = useState(0);
  const [keystoneV, setKeystoneV] = useState(0);
  const [brightness, setBrightness] = useState(100);

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-5">

        {/* Canvas with corner handles */}
        <div className="aspect-video rounded-2xl glass relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-black">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-32 border-2 border-accent/50 relative">
                {/* Corner handles */}
                {['top-0 left-0 -translate-x-1/2 -translate-y-1/2',
                  'top-0 right-0 translate-x-1/2 -translate-y-1/2',
                  'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
                  'bottom-0 right-0 translate-x-1/2 translate-y-1/2'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-4 h-4 rounded-full bg-accent border-2 border-white cursor-grab`} />
                ))}
              </div>
            </div>
          </div>
          <div className="absolute bottom-3 right-3">
            <button className="flex items-center gap-1 px-3 py-1 glass rounded-lg text-xs text-gray-300 hover:text-white transition-colors">
              <RefreshCw size={12} /> אפס
            </button>
          </div>
        </div>

        {/* Mapping type */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">סוג מיפוי</label>
          <div className="grid grid-cols-3 gap-2">
            {MAPPING_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setMappingType(t.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all ${
                  mappingType === t.id ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {t.icon}
                <span className="text-xs font-medium">{t.label}</span>
                <span className="text-[9px] text-gray-500">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Depth response */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">תגובת עומק</label>
          <div className="flex flex-wrap gap-2">
            {DEPTH_RESPONSES.map(r => (
              <button key={r} onClick={() => setDepthResponse(depthResponse === r ? null : r)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  depthResponse === r ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}>{r}</button>
            ))}
          </div>
        </div>

        {/* Projector calibration */}
        <div className="glass rounded-2xl p-4 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-accent" /> כיוון פרויקטור
          </h3>

          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Keystone אופקי</span><span>{keystoneH > 0 ? '+' : ''}{keystoneH}</span></div>
            <input type="range" min="-50" max="50" value={keystoneH} onChange={e => setKeystoneH(+e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Keystone אנכי</span><span>{keystoneV > 0 ? '+' : ''}{keystoneV}</span></div>
            <input type="range" min="-50" max="50" value={keystoneV} onChange={e => setKeystoneV(+e.target.value)} className="w-full accent-accent" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1"><span>בהירות</span><span>{brightness}%</span></div>
            <input type="range" min="0" max="100" value={brightness} onChange={e => setBrightness(+e.target.value)} className="w-full accent-accent" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['גריד יישור', 'מבחן צבע', 'תבנית'].map(btn => (
              <button key={btn} className="py-2 rounded-xl text-xs bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-white/10">{btn}</button>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
