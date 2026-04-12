'use client';
import { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import AppShell from '@/components/navigation/AppShell';
import type { Theme, Mood } from '@/lib/types';

const THEMES: { id: Theme; label: string; emoji: string; color: string }[] = [
  { id: 'fire',           label: 'Fire',           emoji: '🔥', color: 'from-orange-600 to-red-800' },
  { id: 'cosmic',         label: 'Cosmic',         emoji: '🌌', color: 'from-purple-700 to-blue-900' },
  { id: 'gold',           label: 'Gold',           emoji: '✨', color: 'from-yellow-500 to-amber-700' },
  { id: 'ice',            label: 'Ice',            emoji: '🧀', color: 'from-blue-400 to-cyan-700' },
  { id: 'lava',           label: 'Lava',           emoji: '🌋', color: 'from-red-600 to-orange-900' },
  { id: 'electricity',    label: 'Electricity',    emoji: '⚡', color: 'from-yellow-300 to-blue-600' },
  { id: 'divine',         label: 'Divine',         emoji: '✨😇', color: 'from-amber-300 to-white' },
  { id: 'cyberpunk',      label: 'Cyberpunk',      emoji: '🤖', color: 'from-pink-500 to-blue-600' },
  { id: 'smoke',          label: 'Smoke',          emoji: '💨', color: 'from-gray-600 to-gray-900' },
  { id: 'horror',         label: 'Horror',         emoji: '💀', color: 'from-red-900 to-black' },
  { id: 'glitch',         label: 'Glitch',         emoji: '🖥️', color: 'from-green-400 to-purple-700' },
  { id: 'crystal',        label: 'Crystal',        emoji: '💎', color: 'from-blue-300 to-purple-500' },
  { id: 'tribal',         label: 'Tribal',         emoji: '🥁', color: 'from-amber-700 to-red-900' },
  { id: 'sacred_geometry',label: 'Sacred',         emoji: '🔮', color: 'from-gold-400 to-purple-800' },
  { id: 'neon_club',      label: 'Neon Club',      emoji: '🎛️', color: 'from-pink-500 to-cyan-500' },
  { id: 'alien',          label: 'Alien',          emoji: '👽', color: 'from-green-400 to-gray-900' },
  { id: 'organic',        label: 'Organic Veins',  emoji: '🦠', color: 'from-red-400 to-green-900' },
  { id: 'psychedelic',    label: 'Psychedelic',    emoji: '🌈', color: 'from-pink-400 via-yellow-400 to-blue-600' },
  { id: 'mechanical',     label: 'Mechanical',     emoji: '⚙️', color: 'from-gray-500 to-gray-800' },
  { id: 'water',          label: 'Water',          emoji: '🌊', color: 'from-blue-500 to-teal-700' },
];

const MOODS: { id: Mood; label: string; emoji: string }[] = [
  { id: 'calm',        label: 'שלוו',       emoji: '🌊' },
  { id: 'mysterious',  label: 'מסתורי',  emoji: '🌙' },
  { id: 'divine',      label: 'אלוהי',    emoji: '✨' },
  { id: 'aggressive',  label: 'אגרסיבי', emoji: '🔥' },
  { id: 'energetic',   label: 'אנרגטי',  emoji: '⚡' },
  { id: 'sacred',      label: 'קדוש',      emoji: '🕎' },
  { id: 'dreamy',      label: 'חלומי',    emoji: '🌙' },
  { id: 'tense',       label: 'מתוח',      emoji: '‹' },
  { id: 'euphoric',    label: 'אופורי',    emoji: '😍' },
  { id: 'melancholic', label: 'מלנכולי', emoji: '🦋' },
];

export default function CreatePage() {
  const { selectedTheme, selectedMood, aiPrompt, isGenerating, generatedImages,
    setTheme, setMood, setAiPrompt, setGenerating, setGeneratedImages } = useAppStore();
  const [count, setCount] = useState(4);

  async function generate() {
    if (!selectedTheme && !aiPrompt) return;
    setGenerating(true);
    setGeneratedImages([]);
    try {
      const prompt = aiPrompt || `${selectedTheme} projection mapping visual, ${selectedMood || ''} mood, dark background, suitable for projection on surfaces`;
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count, theme: selectedTheme, mood: selectedMood }),
      });
      const data = await res.json();
      setGeneratedImages(data.images ?? []);
    } catch { /* silent */ } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="p-4 max-w-2xl mx-auto space-y-6">

        {/* Prompt */}
        <div className="glass rounded-2xl p-4">
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">תאר את החזון</label>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="giant stone face with glowing cracks, cosmic eyes with nebula motion..."
            rows={3}
            className="w-full bg-white/5 rounded-xl px-3 py-2 text-sm resize-none border border-white/10 focus:border-accent outline-none transition-colors"
          />
        </div>

        {/* Themes */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">תמה ויזואלית</label>
          <div className="grid grid-cols-4 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setTheme(selectedTheme === t.id ? null : t.id)}
                className={`relative p-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                  selectedTheme === t.id ? 'border-accent bg-accent/20 scale-105' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center text-lg`}>
                  {t.emoji}
                </div>
                <span className="text-[10px] text-gray-300">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">מצב רוח</label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(m => (
              <button
                key={m.id}
                onClick={() => setMood(selectedMood === m.id ? null : m.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                  selectedMood === m.id ? 'border-accent bg-accent/20 text-white' : 'border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Count + Generate */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
            <span className="text-xs text-gray-400">כמות:</span>
            {[1,2,4,8].map(n => (
              <button key={n} onClick={() => setCount(n)}
                className={`w-7 h-7 rounded-lg text-sm font-bold transition-all ${
                  count === n ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'
                }`}>{n}</button>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={isGenerating || (!selectedTheme && !aiPrompt)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-semibold transition-all accent-glow"
          >
            {isGenerating ? <><Loader2 size={18} className="animate-spin" /> מייצר...</> : <><Sparkles size={18} /> יצור תוכן</>}
          </button>
        </div>

        {/* Results */}
        {generatedImages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs text-gray-400 uppercase tracking-wider">תוצאות</label>
              <button onClick={generate} className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover">
                <RefreshCw size={12} /> שנה
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {generatedImages.map((img, i) => (
                <div key={i} className="aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-accent transition-colors">
                  <img src={img} alt={`generated ${i+1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder when generating */}
        {isGenerating && (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({length: count}).map((_,i) => (
              <div key={i} className="aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                <Sparkles size={24} className="text-accent/50" />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
