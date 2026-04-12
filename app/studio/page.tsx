'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Scan, Scissors, Box, Sparkles, Loader2, ChevronRight, ChevronLeft, Check, RotateCcw } from 'lucide-react';

type Step = 'upload' | 'detect' | 'select' | 'project' | 'style';

interface BBox { x: number; y: number; width: number; height: number; }
interface Region {
  id: string; label: string; type: string; bbox: BBox;
  description: string; projectionPotential: string; suggestedStyles: string[];
}
interface Analysis {
  subject: string; regions: Region[];
  mappingType: string; dominantColors: string[]; mood: string;
}
interface Style {
  id: string; name: string; tagline: string; effect: string;
  palette: string[]; animation: string; depth3D: number;
  intensity: number; tags: string[]; projectionTip: string;
}

const STEP_LABELS: Record<Step, string> = {
  upload: 'העלאה', detect: 'זיהוי', select: 'בחירה', project: 'הקרנה', style: 'סגנון',
};
const STEPS: Step[] = ['upload', 'detect', 'select', 'project', 'style'];

export default function StudioPage() {
  const [step, setStep] = useState<Step>('upload');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDims, setImageDims] = useState({ w: 1, h: 1 });
  const [detecting, setDetecting] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');
  const [generatingStyles, setGeneratingStyles] = useState(false);
  const [styles, setStyles] = useState<Style[]>([]);
  const [activeStyle, setActiveStyle] = useState<Style | null>(null);
  const [depth3D, setDepth3D] = useState(0.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef<number>(0);

  // Load image
  const handleFile = useCallback((file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const img = new Image();
    img.onload = () => setImageDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    setStep('detect');
    setAnalysis(null);
    setSelectedRegion(null);
    setStyles([]);
    setActiveStyle(null);
  }, []);

  // Detect regions
  const detect = async () => {
    if (!imageFile) return;
    setDetecting(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await fetch('/api/detect', { method: 'POST', body: fd });
      const data: Analysis = await res.json();
      setAnalysis(data);
      setStep('select');
    } catch { /* silent */ } finally { setDetecting(false); }
  };

  // Draw detection canvas
  useEffect(() => {
    if (step !== 'select' || !analysis || !imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      drawDetections(ctx, img, analysis.regions, selectedRegion);
    };
    img.src = imageUrl;
  }, [step, analysis, imageUrl, selectedRegion]);

  function drawDetections(ctx: CanvasRenderingContext2D, img: HTMLImageElement, regions: Region[], selected: Region | null) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(img, 0, 0);
    const W = ctx.canvas.width, H = ctx.canvas.height;
    regions.forEach(r => {
      const x = r.bbox.x * W, y = r.bbox.y * H, w = r.bbox.width * W, h = r.bbox.height * H;
      const isSelected = selected?.id === r.id;
      const potential = r.projectionPotential;
      const color = potential === 'high' ? '#7c5cfc' : potential === 'medium' ? '#34d399' : '#9ca3af';
      ctx.strokeStyle = isSelected ? '#fff' : color;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.setLineDash(isSelected ? [] : [8, 4]);
      ctx.strokeRect(x, y, w, h);
      // Label background
      ctx.fillStyle = isSelected ? '#7c5cfc' : color + 'cc';
      const labelH = 28;
      ctx.fillRect(x, y - labelH, Math.max(w, ctx.measureText(r.label).width + 16), labelH);
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${isSelected ? 14 : 12}px sans-serif`;
      ctx.fillText(r.label, x + 8, y - 8);
      ctx.setLineDash([]);
    });
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!analysis || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const W = canvas.width, H = canvas.height;
    // Find clicked region
    const hit = analysis.regions.find(r => {
      const x = r.bbox.x * W, y = r.bbox.y * H, w = r.bbox.width * W, h = r.bbox.height * H;
      return cx >= x && cx <= x+w && cy >= y && cy <= y+h;
    });
    if (hit) {
      setSelectedRegion(hit);
      const ctx = canvas.getContext('2d')!;
      if (imgRef.current) drawDetections(ctx, imgRef.current, analysis.regions, hit);
    }
  }

  // Project step — draw masked region on black canvas with 3D effect
  useEffect(() => {
    if (step !== 'project' && step !== 'style') return;
    if (!selectedRegion || !imageUrl || !projCanvasRef.current) return;
    const canvas = projCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => startProjectionLoop(ctx, img);
    img.src = imageUrl;
    return () => cancelAnimationFrame(animRef.current);
  }, [step, selectedRegion, imageUrl, depth3D, activeStyle]);

  function startProjectionLoop(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const canvas = ctx.canvas;
    canvas.width = 1200;
    canvas.height = 675;
    const r = selectedRegion!;
    const W = img.naturalWidth, H = img.naturalHeight;
    const sx = r.bbox.x * W, sy = r.bbox.y * H;
    const sw = r.bbox.width * W, sh = r.bbox.height * H;
    let t = 0;

    function frame() {
      t += 0.02;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center the region
      const aspect = sw / sh;
      const outH = Math.min(canvas.height * 0.85, canvas.width * 0.85 / aspect);
      const outW = outH * aspect;
      const cx = (canvas.width - outW) / 2;
      const cy = (canvas.height - outH) / 2;

      const d = depth3D;
      const style = activeStyle;
      const effect = style?.effect ?? 'none';

      // 3D parallax layers
      const layers = 4;
      for (let i = layers; i >= 0; i--) {
        const factor = i / layers;
        const parallaxX = Math.sin(t * 0.7 + i * 0.5) * d * 15 * factor;
        const parallaxY = Math.cos(t * 0.5 + i * 0.3) * d * 8 * factor;
        const scale = 1 + factor * d * 0.12;
        const alpha = i === 0 ? 1.0 : 0.15 * (1 - factor) * d;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Apply style effect via filters
        if (effect === 'fire' && i === 0) {
          ctx.filter = `hue-rotate(${t*30}deg) saturate(2) brightness(1.2)`;
        } else if (effect === 'glitch') {
          const glitchX = (Math.random() - 0.5) * d * 20 * (i === 0 ? 1 : 0);
          ctx.translate(glitchX, 0);
        } else if (effect === 'dream') {
          ctx.filter = `blur(${factor * d}px) brightness(${1 + factor * 0.3})`;
        } else if (effect === 'cosmic') {
          ctx.filter = `hue-rotate(${t * 20 + i * 45}deg) saturate(${1.5 + Math.sin(t) * 0.5})`;
        } else if (effect === 'colorshift') {
          ctx.filter = `hue-rotate(${t * 40}deg)`;
        }

        const dw = outW * scale;
        const dh = outH * scale;
        const dx = cx - (dw - outW) / 2 + parallaxX;
        const dy = cy - (dh - outH) / 2 + parallaxY;

        // Clip to oval for face/sculpture
        if (r.type === 'face' || r.type === 'sculpture') {
          ctx.beginPath();
          ctx.ellipse(canvas.width/2, canvas.height/2, dw/2 * 1.05, dh/2 * 1.05, 0, 0, Math.PI*2);
          ctx.clip();
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        ctx.restore();
      }

      // Style overlay effects
      if (effect === 'kaleidoscope') {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(t) * 0.1;
        ctx.globalCompositeOperation = 'screen';
        ctx.filter = `hue-rotate(${t * 60}deg) saturate(3)`;
        ctx.scale(-1, 1);
        ctx.drawImage(canvas, -canvas.width, 0);
        ctx.restore();
      }

      if (effect === 'tunnel') {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.15;
        for (let i = 1; i < 5; i++) {
          const s = 1 - i * 0.15 + Math.sin(t + i) * 0.05;
          ctx.drawImage(canvas, canvas.width*(1-s)/2, canvas.height*(1-s)/2, canvas.width*s, canvas.height*s);
        }
        ctx.restore();
      }

      // Glow pulse
      const glowIntensity = (style?.intensity ?? 0.5) * (0.5 + Math.sin(t * 2) * 0.3);
      const glowColor = style?.palette?.[0] ?? '#7c5cfc';
      ctx.save();
      ctx.globalAlpha = glowIntensity * 0.4;
      ctx.globalCompositeOperation = 'screen';
      const grd = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 10, canvas.width/2, canvas.height/2, canvas.width * 0.4);
      grd.addColorStop(0, glowColor + 'ff');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }

  // Generate styles
  const generateStyles = async () => {
    if (!stylePrompt) return;
    setGeneratingStyles(true);
    try {
      const res = await fetch('/api/nano-banana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: stylePrompt,
          region: selectedRegion,
          mood: analysis?.mood,
          intensity: 'high',
        }),
      });
      const data = await res.json();
      setStyles(data.styles ?? []);
    } catch { /* silent */ } finally { setGeneratingStyles(false); }
  };

  const applyStyle = (s: Style) => {
    setActiveStyle(s);
    setDepth3D(s.depth3D ?? 0.5);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Steps bar */}
      <div className="sticky top-0 z-50 flex items-center gap-0 bg-black/90 backdrop-blur border-b border-white/10 px-6 py-3">
        <button onClick={() => window.location.href='/'} className="text-gray-500 hover:text-white mr-4 transition-colors">
          <ChevronLeft size={20} />
        </button>
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => {
                if (s === 'upload' || (s === 'detect' && imageUrl) || (s === 'select' && analysis) || (s === 'project' && selectedRegion) || (s === 'style' && selectedRegion))
                  setStep(s);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                step === s ? 'bg-violet-600 text-white' :
                STEPS.indexOf(s) < STEPS.indexOf(step) ? 'text-violet-400' : 'text-gray-600'
              }`}>
              {STEPS.indexOf(s) < STEPS.indexOf(step) ? <Check size={14} /> : <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs">{i+1}</span>}
              {STEP_LABELS[s]}
            </button>
            {i < STEPS.length-1 && <ChevronRight size={16} className="text-white/20 mx-1" />}
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* STEP 1: Upload */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <h1 className="text-4xl font-bold mb-2">🎭 הקרנה לתפאורה</h1>
            <p className="text-gray-400 mb-10">העלאתמונה ובוא נזהה את האזורים להקרנה</p>
            <label className="cursor-pointer group">
              <div className="w-96 h-64 border-2 border-dashed border-white/20 rounded-3xl flex flex-col items-center justify-center gap-4 group-hover:border-violet-500 group-hover:bg-violet-500/5 transition-all">
                <Upload size={48} className="text-gray-600 group-hover:text-violet-400 transition-colors" />
                <div className="text-center">
                  <p className="text-gray-400">PNG · JPG · WebP</p>
                  <p className="text-violet-400 font-semibold mt-1">לחץ לבחירה</p>
                </div>
              </div>
              <input type="file" className="hidden" accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
          </div>
        )}

        {/* STEP 2: Detect */}
        {step === 'detect' && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">🔍 זיהוי אזורים</h2>
              <p className="text-gray-400">Claude ינתח את התמונה ויזהה את כל האזורים</p>
            </div>
            {imageUrl && (
              <img src={imageUrl} className="max-h-80 rounded-2xl border border-white/10" alt="uploaded" />
            )}
            <button onClick={detect} disabled={detecting}
              className="flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 rounded-2xl font-bold text-lg transition-colors">
              {detecting ? <><Loader2 size={22} className="animate-spin" /> מנתח תמונה...</> : <><Scan size={22} /> זהה אזורים</>}
            </button>
          </div>
        )}

        {/* STEP 3: Select */}
        {step === 'select' && analysis && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">🎟️ בחר אזור להקרנה</h2>
              <p className="text-gray-400">לחץ על אזור בתמונה</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {/* Annotated image */}
              <div className="relative">
                <canvas ref={canvasRef}
                  className="w-full rounded-2xl border border-white/10 cursor-crosshair"
                  onClick={handleCanvasClick}
                />
              </div>
              {/* Region list */}
              <div className="space-y-3">
                <p className="text-sm text-gray-500">🧠 {analysis.subject}</p>
                {analysis.regions.map(r => (
                  <button key={r.id}
                    onClick={() => {
                      setSelectedRegion(r);
                      const canvas = canvasRef.current;
                      if (canvas && imgRef.current) {
                        const ctx = canvas.getContext('2d')!;
                        drawDetections(ctx, imgRef.current, analysis.regions, r);
                      }
                    }}
                    className={`w-full text-right p-4 rounded-2xl border transition-all ${
                      selectedRegion?.id === r.id
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-white/10 hover:border-white/30 bg-white/5'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        r.projectionPotential === 'high' ? 'bg-violet-500/30 text-violet-300' :
                        r.projectionPotential === 'medium' ? 'bg-green-500/30 text-green-300' :
                        'bg-gray-500/30 text-gray-400'
                      }`}>{r.projectionPotential}</span>
                      <span className="font-semibold text-white">{r.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{r.description}</p>
                    <div className="flex justify-end gap-1 mt-2">
                      {r.suggestedStyles.map(s => (
                        <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-400">{s}</span>
                      ))}
                    </div>
                  </button>
                ))}
                {selectedRegion && (
                  <button onClick={() => setStep('project')}
                    className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 font-bold flex items-center justify-center gap-2 transition-colors">
                    <Box size={18} /> המשך להקרנה תלת מימד
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Project 3D */}
        {step === 'project' && selectedRegion && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-1">📡 הקרנה תלת מימד</h2>
              <p className="text-gray-400">אזור: <span className="text-violet-400 font-semibold">{selectedRegion.label}</span></p>
            </div>
            <div className="relative bg-black rounded-3xl overflow-hidden border border-white/10">
              <canvas ref={projCanvasRef} className="w-full" style={{aspectRatio:'16/9'}} />
              <div className="absolute bottom-4 right-4 text-xs text-gray-600">הקרנה תלת מימד</div>
            </div>
            <div className="max-w-md mx-auto space-y-3">
              <label className="text-xs text-gray-500 uppercase tracking-wider block">עומק תלת מימד</label>
              <input type="range" min="0" max="1" step="0.05" value={depth3D}
                onChange={e => setDepth3D(+e.target.value)}
                className="w-full accent-violet-500" />
              <button onClick={() => setStep('style')}
                className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 font-bold flex items-center justify-center gap-2 transition-colors">
                <Sparkles size={18} /> צור סגנונות
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Style */}
        {step === 'style' && selectedRegion && (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">✨ סגנונות</h2>
                <p className="text-gray-400">כתוב מה אתה רוצה לראות</p>
              </div>
              <div className="space-y-2">
                <textarea
                  value={stylePrompt}
                  onChange={e => setStylePrompt(e.target.value)}
                  placeholder="פנים עם סדקים בוערים, אבן קוסמית, עיניים שמזיקות, צללים שזורמים..."
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-600 focus:border-violet-500 outline-none resize-none text-sm"
                />
                <button onClick={generateStyles} disabled={generatingStyles || !stylePrompt}
                  className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 font-bold flex items-center justify-center gap-2 transition-colors">
                  {generatingStyles
                    ? <><Loader2 size={16} className="animate-spin" /> יוצר סגנונות...</>
                    : <><Sparkles size={16} /> צור סגנונות</>}
                </button>
              </div>

              <div className="space-y-3">
                {styles.map(s => (
                  <button key={s.id} onClick={() => applyStyle(s)}
                    className={`w-full text-right p-4 rounded-2xl border transition-all ${
                      activeStyle?.id === s.id
                        ? 'border-violet-500 bg-violet-500/20'
                        : 'border-white/10 bg-white/5 hover:border-violet-500/50'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">{s.effect}</span>
                      <span className="font-bold text-white">{s.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{s.tagline}</p>
                    <div className="flex justify-end gap-1 mt-2">
                      {s.palette?.map((c,i) => <div key={i} className="w-5 h-5 rounded-full border border-white/20" style={{background:c}} />)}
                    </div>
                    {activeStyle?.id === s.id && (
                      <p className="text-xs text-violet-300 mt-2 text-right">💡 {s.projectionTip}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Live 3D preview */}
            <div className="space-y-4">
              <div className="relative bg-black rounded-3xl overflow-hidden border border-white/10">
                <canvas ref={projCanvasRef} className="w-full" style={{aspectRatio:'16/9'}} />
                {activeStyle && (
                  <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-black/70 text-xs font-semibold text-violet-300">
                    {activeStyle.name}
                  </div>
                )}
              </div>
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>עומק 3D</span><span>{Math.round(depth3D*100)}%</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={depth3D}
                  onChange={e => setDepth3D(+e.target.value)}
                  className="w-full accent-violet-500" />
              </div>
              <button onClick={() => setStep('upload')}
                className="w-full py-2 rounded-xl border border-white/10 text-gray-500 hover:text-white text-sm flex items-center justify-center gap-2 transition-colors">
                <RotateCcw size={14} /> התחל מחדש
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
