'use client';
import { useState, useRef, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Upload, Wand2, Maximize, Play, Square, Download, Sparkles, Loader2, RefreshCw, ChevronLeft, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';

const GLCanvas = dynamic(() => import('@/components/canvas/GLCanvas'), { ssr: false });

type Effect = 'none'|'kaleidoscope'|'fire'|'mirror'|'glitch'|'colorshift'|'tunnel'|'dream'|'cosmic';
const EFFECTS: { id: Effect; label: string; emoji: string }[] = [
  { id: 'none',         label: 'אוריגינל',    emoji: '□' },
  { id: 'kaleidoscope', label: 'Kaleidoscope', emoji: '✨' },
  { id: 'fire',         label: 'Fire',         emoji: '🔥' },
  { id: 'mirror',       label: 'Mirror',       emoji: '🔄' },
  { id: 'glitch',       label: 'Glitch',       emoji: '🖥️' },
  { id: 'colorshift',   label: 'Color Shift',  emoji: '🌈' },
  { id: 'tunnel',       label: 'Tunnel',       emoji: '🌀' },
  { id: 'dream',        label: 'Dream',        emoji: '🌙' },
  { id: 'cosmic',       label: 'Cosmic',       emoji: '🌌' },
];

const DEFAULT_CORNERS = {
  tl: [0.1, 0.1] as [number,number],
  tr: [0.9, 0.1] as [number,number],
  bl: [0.1, 0.9] as [number,number],
  br: [0.9, 0.9] as [number,number],
};

interface StyleConcept {
  name: string;
  description: string;
  effect: Effect;
  palette: string[];
  intensity: string;
  tags: string[];
}

interface Analysis {
  subject: string;
  suggestedEffects: string[];
  suggestedStyles: string[];
  mappingType: string;
  mood: string;
  colors: string[];
}

function EditorContent() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [effect, setEffect] = useState<Effect>('none');
  const [corners, setCorners] = useState(DEFAULT_CORNERS);
  const [activeTool, setActiveTool] = useState<'select'|'cornerpin'>('select');
  const [tab, setTab] = useState<'upload'|'effects'|'ai'|'record'>('upload');

  // AI state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generatingStyles, setGeneratingStyles] = useState(false);
  const [styles, setStyles] = useState<StyleConcept[]>([]);
  const [stylePrompt, setStylePrompt] = useState('');

  // Recording state
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState<string | null>(null);
  const [loopDuration, setLoopDuration] = useState(3);

  const handleFile = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setAnalysis(null);
    setStyles([]);
    setTab('effects');
  }, []);

  const analyzeImage = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      setAnalysis(data);
      if (data.suggestedEffects?.[0]) {
        setEffect((data.suggestedEffects[0] as Effect) ?? 'none');
      }
      setTab('ai');
    } catch { /* silent */ } finally { setAnalyzing(false); }
  };

  const generateStyles = async () => {
    setGeneratingStyles(true);
    try {
      const res = await fetch('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: stylePrompt || analysis?.subject || 'projection mapping',
          style: analysis?.mappingType,
          mood: analysis?.mood,
        }),
      });
      const data = await res.json();
      setStyles(data.styles ?? []);
    } catch { /* silent */ } finally { setGeneratingStyles(false); }
  };

  const startRecording = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    chunksRef.current = [];
    recorder.ondataavailable = e => chunksRef.current.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecorded(URL.createObjectURL(blob));
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
    setTimeout(() => stopRecording(), loopDuration * 1000);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const downloadRecording = () => {
    if (!recorded) return;
    const a = document.createElement('a');
    a.href = recorded;
    a.download = `hakrana-loop-${Date.now()}.webm`;
    a.click();
  };

  const takeScreenshot = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `hakrana-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex h-screen bg-black overflow-hidden">

      {/* Left panel */}
      <div className="w-72 bg-[#0a0a0a] border-r border-white/10 flex flex-col shrink-0">

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <button onClick={() => router.push('/projects')} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-white">הקרנה לתפאורה</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {(['upload','effects','ai','record'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                tab === t ? 'text-violet-400 border-b-2 border-violet-400' : 'text-gray-600 hover:text-gray-400'
              }`}>
              {t === 'upload' ? 'תמונה' : t === 'effects' ? 'אפקטים' : t === 'ai' ? 'AI' : 'לופ'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {tab === 'upload' && (
            <div className="space-y-3">
              <label className="block">
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-violet-500 hover:bg-violet-500/5 ${
                  imageUrl ? 'border-violet-500/50 bg-violet-500/10' : 'border-white/10'
                }`}>
                  <Upload size={28} className="mx-auto mb-3 text-gray-500" />
                  <p className="text-sm text-gray-400">גרור תמונה או</p>
                  <p className="text-violet-400 text-sm font-semibold">לחץ לבחירה</p>
                  <p className="text-xs text-gray-600 mt-1">PNG · JPG · WebP</p>
                  <input type="file" className="hidden" accept="image/*"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              </label>

              {imageUrl && (
                <div className="rounded-xl overflow-hidden aspect-video bg-black">
                  <img src={imageUrl} className="w-full h-full object-contain" alt="uploaded" />
                </div>
              )}

              {imageUrl && (
                <button onClick={analyzeImage} disabled={analyzing}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
                  {analyzing ? <><Loader2 size={16} className="animate-spin" /> מנתח תמונה...</> : <><Wand2 size={16} /> נתח ב-AI</>}
                </button>
              )}
            </div>
          )}

          {tab === 'effects' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">אפקט WebGL</p>
              <div className="grid grid-cols-3 gap-1.5">
                {EFFECTS.map(fx => (
                  <button key={fx.id} onClick={() => setEffect(fx.id)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs transition-all border ${
                      effect === fx.id
                        ? 'border-violet-500 bg-violet-500/20 text-white'
                        : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                    }`}>
                    <span className="text-lg">{fx.emoji}</span>
                    <span>{fx.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">כלי</p>
                <div className="flex gap-2">
                  <button onClick={() => setActiveTool('select')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition-all ${
                      activeTool === 'select' ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-white/10 text-gray-500'
                    }`}>בחר</button>
                  <button onClick={() => setActiveTool('cornerpin')}
                    className={`flex-1 py-2 rounded-lg text-xs border transition-all flex items-center justify-center gap-1 ${
                      activeTool === 'cornerpin' ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-white/10 text-gray-500'
                    }`}>
                    <Maximize size={12} /> Corner Pin
                  </button>
                </div>
                {activeTool === 'cornerpin' && (
                  <button onClick={() => setCorners(DEFAULT_CORNERS)}
                    className="w-full mt-2 py-1.5 rounded-lg text-xs border border-white/10 text-gray-500 hover:text-white transition-colors">
                    אפס פינות
                  </button>
                )}
              </div>
            </div>
          )}

          {tab === 'ai' && (
            <div className="space-y-4">
              {analysis && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-xs text-gray-400">🔍 זוהה: <span className="text-white font-semibold">{analysis.subject}</span></p>
                  <p className="text-xs text-gray-400">🎭 סוג: <span className="text-violet-400">{analysis.mappingType}</span></p>
                  <p className="text-xs text-gray-400">🌟 מצב: <span className="text-yellow-400">{analysis.mood}</span></p>
                  <div className="flex gap-1 mt-2">
                    {analysis.colors?.map((c,i) => (
                      <div key={i} className="w-6 h-6 rounded-full border border-white/20" style={{background:c}} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {analysis.suggestedEffects?.map(e => (
                      <button key={e} onClick={() => setEffect(e as Effect)}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 hover:bg-violet-500/40 transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider">יצירת סגנונות</p>
                <input value={stylePrompt} onChange={e => setStylePrompt(e.target.value)}
                  placeholder="תאר את הסגנון..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-violet-500 outline-none"
                />
                <button onClick={generateStyles} disabled={generatingStyles}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                  {generatingStyles ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generatingStyles ? 'יוצר...' : 'יצור 4 סגנונות'}
                </button>
              </div>

              {styles.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-violet-500/50 transition-all"
                  onClick={() => setEffect(s.effect)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white">{s.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">{s.effect}</span>
                  </div>
                  <p className="text-xs text-gray-400">{s.description}</p>
                  <div className="flex gap-1 mt-2">
                    {s.palette?.map((c,j) => (
                      <div key={j} className="w-5 h-5 rounded-full border border-white/20" style={{background:c}} />
                    ))}
                    {s.tags?.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 rounded bg-white/10 text-gray-400">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'record' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider">אורך לופ</p>
                <div className="flex gap-2">
                  {[2,3,5,8,10].map(s => (
                    <button key={s} onClick={() => setLoopDuration(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        loopDuration === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white'
                      }`}>{s}s</button>
                  ))}
                </div>

                <button onClick={recording ? stopRecording : startRecording}
                  disabled={!imageUrl}
                  className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    recording
                      ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                      : 'bg-violet-600 hover:bg-violet-700 disabled:opacity-40'
                  }`}>
                  {recording ? <><Square size={16} /> עצור הקלטה</> : <><Play size={16} /> הקלט לופ</>}
                </button>
              </div>

              {recorded && (
                <div className="space-y-3">
                  <video src={recorded} className="w-full rounded-xl" controls loop autoPlay muted />
                  <button onClick={downloadRecording}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Download size={16} /> הורד וידאו (WebM)
                  </button>
                </div>
              )}

              <button onClick={takeScreenshot} disabled={!imageUrl}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-sm flex items-center justify-center gap-2 transition-colors">
                <Camera size={15} /> צילום מסך
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <GLCanvas
          imageUrl={imageUrl}
          effect={effect}
          corners={corners}
          onCornersChange={setCorners}
          activeTool={activeTool}
        />

        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {EFFECTS.map(fx => (
              <button key={fx.id} onClick={() => setEffect(fx.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border backdrop-blur-sm ${
                  effect === fx.id
                    ? 'border-violet-500 bg-violet-500/30 text-white'
                    : 'border-white/10 bg-black/40 text-gray-500 hover:text-white'
                }`}>
                {fx.emoji} {fx.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            {recording && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> REC {loopDuration}s
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-black text-gray-500">טוען...</div>}>
      <EditorContent />
    </Suspense>
  );
}
