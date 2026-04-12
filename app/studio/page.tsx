'use client';
import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Download, Video, Square, Camera, Sparkles, RotateCcw, ChevronLeft } from 'lucide-react';

const PRESETS = [
  { emoji: '🔥', label: 'אש',      prompt: 'transform this into dramatic fire flames projection art on pure black background, high contrast' },
  { emoji: '🌌', label: 'קוסמי',  prompt: 'transform into cosmic nebula galaxy space projection, glowing colors on black' },
  { emoji: '✨', label: 'זהב',     prompt: 'transform into liquid gold metallic flowing molten art on black background' },
  { emoji: '⚡', label: 'ניאון',  prompt: 'transform into neon cyberpunk glowing electric lines on pure black' },
  { emoji: '❄️', label: 'קרח',     prompt: 'transform into ice crystal frozen blue shimmering projection on black' },
  { emoji: '🖤', label: 'עשן',     prompt: 'transform into dramatic dark smoke wisps swirling on pure black background' },
  { emoji: '🌹', label: 'פרחים',   prompt: 'transform into blooming flowers petals glowing bioluminescent on black' },
  { emoji: '🖥️', label: 'גליץ',    prompt: 'transform into digital glitch error matrix data stream art on black' },
  { emoji: '💀', label: 'איים',    prompt: 'transform into spooky skull horror dark dramatic bones on black background' },
  { emoji: '🏆', label: 'זהב-סגול',  prompt: 'transform into royal purple and gold luxury ornate pattern projection on black' },
];

const LOOP_DURATIONS = [3, 5, 8, 12];

export default function StudioPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [depth3D, setDepth3D] = useState(0.6);
  const [loopDuration, setLoopDuration] = useState(5);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedSize, setRecordedSize] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const projCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleFile = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setResultUrl(null);
    setRecordedUrl(null);
    setError('');
  };

  const generate = async () => {
    if (!imageFile) { setError('העלא תמונה תחילה'); return; }
    if (!prompt) { setError('כתוב מה אתה רוצה'); return; }
    if (!apiKey) { setError('הכנס Google API Key'); return; }
    setGenerating(true); setError(''); setRecordedUrl(null);
    try {
      const fd = new FormData();
      fd.append('prompt', prompt);
      fd.append('style', prompt);
      fd.append('regionLabel', 'image');
      fd.append('apiKey', apiKey);
      fd.append('image', imageFile);
      const res = await fetch('/api/google-imagen', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.imageUrl) {
        setResultUrl(data.imageUrl);
      } else {
        setError(data.error || 'שגיאה ביצירה');
      }
    } catch (e) { setError(String(e)); } finally { setGenerating(false); }
  };

  // 3D projection animation
  useEffect(() => {
    if (!resultUrl || !projCanvasRef.current) return;
    cancelAnimationFrame(animRef.current);
    const canvas = projCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1280; canvas.height = 720;
    const img = new Image();
    img.onload = () => {
      let t = 0;
      function frame() {
        t += 0.018;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1280, 720);
        const d = depth3D;
        for (let i = 3; i >= 0; i--) {
          const f = i / 3;
          const px = Math.sin(t * 0.8 + i * 0.6) * d * 20 * f;
          const py = Math.cos(t * 0.5 + i * 0.4) * d * 12 * f;
          const scale = 1 + f * d * 0.15;
          const alpha = i === 0 ? 1 : 0.15 * (1 - f) * d * 2;
          const dw = 1280 * 0.82 * scale, dh = 720 * 0.82 * scale;
          const dx = (1280 - dw) / 2 + px, dy = (720 - dh) / 2 + py;
          ctx.save();
          ctx.globalAlpha = alpha;
          if (i > 0) ctx.filter = `blur(${f * d * 2}px)`;
          ctx.drawImage(img, dx, dy, dw, dh);
          ctx.restore();
        }
        // glow overlay
        ctx.save();
        ctx.globalAlpha = 0.2 + Math.sin(t * 2) * 0.08;
        ctx.globalCompositeOperation = 'screen';
        const grd = ctx.createRadialGradient(640, 360, 20, 640, 360, 500);
        grd.addColorStop(0, '#7c5cfcaa');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1280, 720);
        ctx.restore();
        animRef.current = requestAnimationFrame(frame);
      }
      animRef.current = requestAnimationFrame(frame);
    };
    img.src = resultUrl;
    return () => cancelAnimationFrame(animRef.current);
  }, [resultUrl, depth3D]);

  const startRecording = () => {
    const canvas = projCanvasRef.current;
    if (!canvas) return;
    setRecordedUrl(null); chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: mime, videoBitsPerSecond: 4_000_000 });
    rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      setRecordedUrl(URL.createObjectURL(blob));
      setRecordedSize(`${(blob.size / 1024 / 1024).toFixed(1)} MB`);
      setRecording(false); setCountdown(0);
    };
    rec.start(100); recorderRef.current = rec;
    setRecording(true); setCountdown(loopDuration);
    let rem = loopDuration;
    timerRef.current = setInterval(() => {
      rem--; setCountdown(rem);
      if (rem <= 0) { clearInterval(timerRef.current!); rec.stop(); }
    }, 1000);
  };

  const stopRecording = () => { clearInterval(timerRef.current!); recorderRef.current?.stop(); };

  return (
    <div className="min-h-screen bg-black text-white" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <a href="/projects" className="text-gray-600 hover:text-white transition-colors"><ChevronLeft size={20} /></a>
        <h1 className="font-bold text-lg">🎭 Studio AI</h1>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {/* ROW 1: Upload + Prompt side by side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Upload */}
          <div
            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all min-h-48 ${
              dragOver ? 'border-violet-500 bg-violet-500/10' : imageUrl ? 'border-violet-500/40' : 'border-white/15 hover:border-violet-500/50'
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFile(f); }}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            {imageUrl ? (
              <img src={imageUrl} className="w-full h-full object-contain rounded-2xl max-h-48" alt="uploaded" />
            ) : (
              <div className="text-center p-6">
                <Upload size={36} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 font-semibold">העלאת תמונה</p>
                <p className="text-gray-600 text-sm mt-1">או גרור לכאן</p>
              </div>
            )}
            <input id="file-input" type="file" className="hidden" accept="image/*"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* Prompt + Key */}
          <div className="flex flex-col gap-3">
            {/* API Key */}
            <div className="flex gap-2 items-center">
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Google API Key (AIza...)"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm font-mono focus:border-violet-500 outline-none"
              />
              <a href="https://aistudio.google.com/apikey" target="_blank"
                className="text-xs text-violet-400 hover:underline whitespace-nowrap">קבל חינמי ↗</a>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => setPrompt(p.prompt)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    prompt === p.prompt ? 'border-violet-500 bg-violet-500/20 text-white' : 'border-white/10 text-gray-400 hover:border-violet-400/50'
                  }`}>
                  {p.emoji} {p.label}
                </button>
              ))}
            </div>

            {/* Custom prompt */}
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="או כתוב בעצמך מה אתה רוצה לעשות עם התמונה..."
              rows={4}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-violet-500 outline-none resize-none"
            />

            <button
              onClick={generate}
              disabled={generating || !imageFile || !prompt || !apiKey}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 font-bold text-base flex items-center justify-center gap-2 transition-all"
            >
              {generating
                ? <><Loader2 size={20} className="animate-spin" /> יוצר... 🥤🍌</>  
                : <><Sparkles size={20} /> צור עם Google Imagen</>}
            </button>
          </div>
        </div>

        {/* ROW 2: Result */}
        {resultUrl && (
          <div className="space-y-4">
            {/* Before / After */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2 text-center">לפני</p>
                <img src={imageUrl!} className="w-full rounded-xl border border-white/10 object-contain max-h-48 bg-black" alt="before" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2 text-center">אחרי — Google Imagen</p>
                <img src={resultUrl} className="w-full rounded-xl border border-violet-500/40 object-contain max-h-48 bg-black" alt="after" />
              </div>
            </div>

            {/* 3D Projection */}
            <div>
              <p className="text-xs text-gray-500 mb-2 text-center">📡 הקרנה תלת מימד</p>
              <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10">
                <canvas ref={projCanvasRef} className="w-full" style={{ aspectRatio: '16/9' }} />
                {recording && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/90 font-bold text-sm">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> מקליט... {countdown}s
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              {/* Depth */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>עומק 3D</span><span>{Math.round(depth3D * 100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={depth3D}
                  onChange={e => setDepth3D(+e.target.value)} className="w-full accent-violet-500" />
                <div className="flex gap-2">
                  <button onClick={() => {
                    const c = projCanvasRef.current; if (!c) return;
                    const a = document.createElement('a'); a.href = c.toDataURL('image/png');
                    a.download = `hakrana-${Date.now()}.png`; a.click();
                  }} className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold flex items-center justify-center gap-1 transition-colors">
                    <Camera size={14} /> PNG
                  </button>
                  <button onClick={() => { setPrompt(''); setResultUrl(null); setRecordedUrl(null); setImageFile(null); setImageUrl(null); }}
                    className="py-2 px-3 rounded-xl border border-white/10 text-gray-600 hover:text-white transition-colors">
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Recorder */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Video size={14} className="text-violet-400" />
                  <span className="text-xs font-semibold">לופ וידאו — חינם</span>
                </div>
                <div className="flex gap-1.5">
                  {LOOP_DURATIONS.map(d => (
                    <button key={d} onClick={() => setLoopDuration(d)} disabled={recording}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        loopDuration === d ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-500 hover:text-white'
                      }`}>{d}s</button>
                  ))}
                </div>
                <button onClick={recording ? stopRecording : startRecording}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    recording ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-violet-600 hover:bg-violet-700'
                  }`}>
                  {recording ? <><Square size={14} fill="white" />{countdown}s</> : <><Video size={14} />{loopDuration}s</>}
                </button>
                {recording && (
                  <div className="w-full bg-white/10 rounded-full h-1">
                    <div className="bg-red-500 h-1 rounded-full transition-all"
                      style={{ width: `${((loopDuration - countdown) / loopDuration) * 100}%` }} />
                  </div>
                )}
                {recordedUrl && (
                  <button onClick={() => {
                    const a = document.createElement('a'); a.href = recordedUrl;
                    a.download = `loop-${Date.now()}.webm`; a.click();
                  }} className="w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    <Download size={14} /> הורד {recordedSize}
                  </button>
                )}
              </div>
            </div>

            {/* Video preview */}
            {recordedUrl && (
              <video src={recordedUrl} className="w-full rounded-2xl border border-green-500/30" controls loop autoPlay muted />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
