'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Scan, Sparkles, Loader2, ChevronRight, ChevronLeft, Check, RotateCcw, Key, ImageIcon, Wand2, Download, Video, Square, Camera } from 'lucide-react';

type Step = 'upload' | 'detect' | 'select' | 'generate' | 'project';
interface BBox { x: number; y: number; width: number; height: number; }
interface Region { id: string; label: string; type: string; bbox: BBox; description: string; projectionPotential: string; suggestedStyles: string[]; }
interface Analysis { subject: string; regions: Region[]; mappingType: string; dominantColors: string[]; mood: string; }
interface GeneratedImage { imageUrl: string; prompt: string; style: string; }

const STEPS: Step[] = ['upload','detect','select','generate','project'];
const STEP_LABELS: Record<Step,string> = { upload:'העלאה', detect:'זיהוי', select:'בחירה', generate:'יצירה', project:'הקרנה' };
const STYLE_PRESETS = [
  { label: 'אש בוער', prompt: 'fire flames burning dramatic projection on black background' },
  { label: 'קוסמי',   prompt: 'cosmic nebula galaxy space stars glowing projection mapping' },
  { label: 'זהב',    prompt: 'liquid gold metallic flowing molten projection art' },
  { label: 'קרח',    prompt: 'ice crystal frozen blue cold shimmering projection' },
  { label: 'ניאון',   prompt: 'neon cyberpunk glowing lines electric club projection' },
  { label: 'קדוש',   prompt: 'divine sacred light rays ethereal angelic projection' },
  { label: 'גליץ',   prompt: 'glitch digital error matrix data stream projection art' },
  { label: 'שבטי',   prompt: 'tribal ancient ritual symbols fire projection mapping' },
];
const LOOP_DURATIONS = [3,5,8,12];

export default function StudioPage() {
  const [step, setStep] = useState<Step>('upload');
  const [imageUrl, setImageUrl] = useState<string|null>(null);
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [regionFile, setRegionFile] = useState<File|null>(null);
  const [detecting, setDetecting] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis|null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region|null>(null);
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage|null>(null);
  const [depth3D, setDepth3D] = useState(0.6);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [error, setError] = useState('');
  const [loopDuration, setLoopDuration] = useState(5);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState<string|null>(null);
  const [recordedSize, setRecordedSize] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const projCanvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement|null>(null);
  const animRef = useRef<number>(0);
  const recorderRef = useRef<MediaRecorder|null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null);

  const handleFile = useCallback((file: File) => {
    setImageFile(file); setImageUrl(URL.createObjectURL(file));
    setStep('detect'); setAnalysis(null); setSelectedRegion(null);
    setGeneratedImages([]); setActiveImage(null); setRecordedUrl(null); setError('');
  }, []);

  const detect = async () => {
    if (!imageFile) return;
    setDetecting(true); setError('');
    try {
      const fd = new FormData(); fd.append('image', imageFile);
      const res = await fetch('/api/detect', { method: 'POST', body: fd });
      const data: Analysis = await res.json();
      if (data.regions) { setAnalysis(data); setStep('select'); }
      else setError('שגיאה בזיהוי. נסה שנית.');
    } catch { setError('שגיאת רשת'); } finally { setDetecting(false); }
  };

  useEffect(() => {
    if (step !== 'select' || !analysis || !imageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current, ctx = canvas.getContext('2d')!;
    const img = new Image();
    img.onload = () => { imgRef.current = img; canvas.width = img.naturalWidth; canvas.height = img.naturalHeight; drawDetections(ctx, img, analysis.regions, selectedRegion); };
    img.src = imageUrl;
  }, [step, analysis, imageUrl, selectedRegion]);

  function drawDetections(ctx: CanvasRenderingContext2D, img: HTMLImageElement, regions: Region[], sel: Region|null) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.drawImage(img, 0, 0);
    if (sel) { ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0,0,W,H); }
    regions.forEach(r => {
      const x=r.bbox.x*W, y=r.bbox.y*H, w=r.bbox.width*W, h=r.bbox.height*H;
      const isSel = sel?.id===r.id;
      const color = r.projectionPotential==='high'?'#a78bfa':r.projectionPotential==='medium'?'#34d399':'#6b7280';
      if (isSel) { ctx.drawImage(img,x,y,w,h,x,y,w,h); ctx.shadowColor=color; ctx.shadowBlur=20; }
      ctx.strokeStyle=isSel?'#fff':color; ctx.lineWidth=isSel?3:1.5;
      ctx.setLineDash(isSel?[]:[6,4]); ctx.strokeRect(x,y,w,h); ctx.shadowBlur=0;
      const tw=ctx.measureText(r.label).width+16;
      ctx.fillStyle=isSel?'#7c5cfc':color+'bb'; ctx.fillRect(x,y-26,Math.max(tw,60),26);
      ctx.fillStyle='#fff'; ctx.font=`${isSel?'bold ':''}${isSel?13:11}px sans-serif`;
      ctx.setLineDash([]); ctx.fillText(r.label,x+8,y-8);
    });
  }

  function extractRegion(r: Region) {
    if (!imgRef.current) return;
    const W=imgRef.current.naturalWidth, H=imgRef.current.naturalHeight;
    const tmp=document.createElement('canvas');
    tmp.width=r.bbox.width*W; tmp.height=r.bbox.height*H;
    tmp.getContext('2d')!.drawImage(imgRef.current,r.bbox.x*W,r.bbox.y*H,r.bbox.width*W,r.bbox.height*H,0,0,tmp.width,tmp.height);
    tmp.toBlob(b=>{if(b)setRegionFile(new File([b],'region.jpg',{type:'image/jpeg'}));},'image/jpeg',0.9);
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!analysis||!canvasRef.current||!imgRef.current) return;
    const canvas=canvasRef.current, rect=canvas.getBoundingClientRect();
    const cx=(e.clientX-rect.left)*(canvas.width/rect.width);
    const cy=(e.clientY-rect.top)*(canvas.height/rect.height);
    const W=canvas.width, H=canvas.height;
    const hit=analysis.regions.find(r=>{ const x=r.bbox.x*W,y=r.bbox.y*H,w=r.bbox.width*W,h=r.bbox.height*H; return cx>=x&&cx<=x+w&&cy>=y&&cy<=y+h; });
    if (hit) { setSelectedRegion(hit); extractRegion(hit); drawDetections(canvas.getContext('2d')!,imgRef.current,analysis.regions,hit); }
  }

  const generate = async () => {
    if (!googleApiKey){setError('נדרש Google API Key');return;}
    if (!stylePrompt){setError('כתוב מה אתה רוצה לראות');return;}
    setGenerating(true); setError(''); setRecordedUrl(null);
    try {
      const fd=new FormData();
      fd.append('prompt',stylePrompt); fd.append('style',stylePrompt);
      fd.append('regionLabel',selectedRegion?.label||'surface');
      fd.append('apiKey',googleApiKey);
      if (regionFile) fd.append('image',regionFile);
      const res=await fetch('/api/google-imagen',{method:'POST',body:fd});
      const data=await res.json();
      if (data.imageUrl) {
        const ni={imageUrl:data.imageUrl,prompt:stylePrompt,style:stylePrompt};
        setGeneratedImages(p=>[ni,...p]); setActiveImage(ni); setStep('project');
      } else setError(data.error||'לא נוצרה תמונה');
    } catch(e){setError(String(e));} finally{setGenerating(false);}
  };

  useEffect(() => {
    if (step!=='project'||!activeImage||!projCanvasRef.current) return;
    const canvas=projCanvasRef.current, ctx=canvas.getContext('2d')!;
    canvas.width=1280; canvas.height=720;
    const img=new Image();
    img.onload=()=>startProjection(ctx,img);
    img.src=activeImage.imageUrl;
    return ()=>cancelAnimationFrame(animRef.current);
  }, [step,activeImage,depth3D]);

  function startProjection(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
    const W=ctx.canvas.width, H=ctx.canvas.height;
    let t=0;
    const isOval=selectedRegion?.type==='face'||selectedRegion?.type==='sculpture';
    function frame() {
      t+=0.018;
      ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
      const d=depth3D;
      for (let i=3;i>=0;i--) {
        const f=i/3, px=Math.sin(t*0.8+i*0.6)*d*18*f, py=Math.cos(t*0.5+i*0.4)*d*10*f;
        const scale=1+f*d*0.15, alpha=i===0?1:0.12*(1-f)*d*2;
        const dw=W*0.8*scale, dh=H*0.8*scale, dx=(W-dw)/2+px, dy=(H-dh)/2+py;
        ctx.save(); ctx.globalAlpha=alpha;
        if(i>0) ctx.filter=`blur(${f*d*2}px)`;
        if(isOval){ ctx.beginPath(); ctx.ellipse(W/2+px*0.5,H/2+py*0.5,dw/2,dh/2,0,0,Math.PI*2); ctx.clip(); }
        ctx.drawImage(img,dx,dy,dw,dh); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha=0.25+Math.sin(t*2)*0.1; ctx.globalCompositeOperation='screen';
      const grd=ctx.createRadialGradient(W/2,H/2,20,W/2,H/2,W*0.45);
      grd.addColorStop(0,'#7c5cfcaa'); grd.addColorStop(1,'transparent');
      ctx.fillStyle=grd; ctx.fillRect(0,0,W,H); ctx.restore();
      animRef.current=requestAnimationFrame(frame);
    }
    animRef.current=requestAnimationFrame(frame);
  }

  const startRecording = () => {
    const canvas=projCanvasRef.current;
    if (!canvas) return;
    setRecordedUrl(null); chunksRef.current=[];
    const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
    const stream=canvas.captureStream(30);
    const rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:4_000_000});
    rec.ondataavailable=e=>{if(e.data.size>0)chunksRef.current.push(e.data);};
    rec.onstop=()=>{
      const blob=new Blob(chunksRef.current,{type:mime});
      setRecordedUrl(URL.createObjectURL(blob));
      setRecordedSize(`${(blob.size/1024/1024).toFixed(1)} MB`);
      setRecording(false); setCountdown(0);
    };
    rec.start(100); recorderRef.current=rec;
    setRecording(true); setCountdown(loopDuration);
    let rem=loopDuration;
    timerRef.current=setInterval(()=>{ rem-=1; setCountdown(rem); if(rem<=0){clearInterval(timerRef.current!);rec.stop();} },1000);
  };

  const stopRecording = () => { clearInterval(timerRef.current!); recorderRef.current?.stop(); };

  const downloadVideo = () => {
    if (!recordedUrl) return;
    const a=document.createElement('a'); a.href=recordedUrl;
    a.download=`hakrana-loop-${Date.now()}.webm`; a.click();
  };

  const downloadPng = () => {
    const c=projCanvasRef.current; if(!c) return;
    const a=document.createElement('a'); a.href=c.toDataURL('image/png');
    a.download=`hakrana-${Date.now()}.png`; a.click();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 flex items-center gap-1 bg-black/95 backdrop-blur border-b border-white/10 px-4 py-3">
        <a href="/projects" className="p-2 text-gray-600 hover:text-white transition-colors mr-2"><ChevronLeft size={18}/></a>
        <span className="text-sm font-bold mr-4">🎭 Studio</span>
        {STEPS.map((s,i)=>(
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${ step===s?'bg-violet-600 text-white':STEPS.indexOf(s)<STEPS.indexOf(step)?'text-violet-400':'text-gray-700' }`}>
              {STEPS.indexOf(s)<STEPS.indexOf(step)?<Check size={12}/>:<span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">{i+1}</span>}
              {STEP_LABELS[s]}
            </div>
            {i<STEPS.length-1&&<ChevronRight size={14} className="text-white/15 mx-0.5"/>}
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error&&<div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

        {step==='upload'&&(
          <div className="flex flex-col items-center justify-center min-h-[65vh] gap-8">
            <div className="text-center">
              <h1 className="text-5xl font-black mb-3">🎭 Studio AI</h1>
              <p className="text-gray-400 text-lg">תמונה → זיהוי → Google Imagen → הקרנה 3D → לופ וידאו</p>
            </div>
            <label className="cursor-pointer group">
              <div className="w-80 h-56 border-2 border-dashed border-white/15 rounded-3xl flex flex-col items-center justify-center gap-4 group-hover:border-violet-500 group-hover:bg-violet-500/5 transition-all">
                <Upload size={40} className="text-gray-600 group-hover:text-violet-400 transition-colors"/>
                <div className="text-center"><p className="text-violet-400 font-bold">לחץ לבחירת תמונה</p><p className="text-gray-600 text-sm mt-1">PNG · JPG · WebP</p></div>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
            </label>
          </div>
        )}

        {step==='detect'&&(
          <div className="flex flex-col items-center gap-8">
            <div className="text-center"><h2 className="text-3xl font-bold mb-2">🔍 זיהוי אזורים</h2><p className="text-gray-400">Claude Vision מנתח ומזהה כל אזור בתמונה</p></div>
            {imageUrl&&<img src={imageUrl} className="max-h-72 rounded-2xl border border-white/10" alt=""/>}
            <button onClick={detect} disabled={detecting} className="flex items-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 rounded-2xl font-bold text-lg transition-colors">
              {detecting?<><Loader2 size={22} className="animate-spin"/>מנתח...</>:<><Scan size={22}/>זהה אזורים</>}
            </button>
          </div>
        )}

        {step==='select'&&analysis&&(
          <div className="space-y-6">
            <div className="text-center"><h2 className="text-3xl font-bold mb-1">▢ בחר אזור להקרנה</h2><p className="text-gray-400">לחץ על אזור בתמונה</p></div>
            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-3"><canvas ref={canvasRef} className="w-full rounded-2xl border border-white/10 cursor-crosshair" onClick={handleCanvasClick}/></div>
              <div className="col-span-2 space-y-3">
                <p className="text-xs text-gray-500">{analysis.subject}</p>
                {analysis.regions.map(r=>(
                  <button key={r.id} onClick={()=>{setSelectedRegion(r);extractRegion(r);if(canvasRef.current&&imgRef.current)drawDetections(canvasRef.current.getContext('2d')!,imgRef.current,analysis.regions,r);}}
                    className={`w-full p-3 rounded-xl border text-right transition-all ${ selectedRegion?.id===r.id?'border-violet-500 bg-violet-500/20':'border-white/10 bg-white/5 hover:border-violet-500/40' }`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${ r.projectionPotential==='high'?'bg-violet-500/30 text-violet-300':r.projectionPotential==='medium'?'bg-green-500/30 text-green-300':'bg-gray-700 text-gray-400' }`}>{r.projectionPotential}</span>
                      <span className="font-semibold text-sm">{r.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{r.description}</p>
                  </button>
                ))}
                {selectedRegion&&<button onClick={()=>setStep('generate')} className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold flex items-center justify-center gap-2 transition-colors"><Wand2 size={16}/> בחר — המשך</button>}
              </div>
            </div>
          </div>
        )}

        {step==='generate'&&selectedRegion&&(
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center"><h2 className="text-3xl font-bold mb-2">✨ יצירת סגנון</h2><p className="text-gray-400">אזור: <span className="text-violet-400 font-semibold">{selectedRegion.label}</span></p></div>
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center gap-2"><Key size={16} className="text-violet-400"/><span className="font-semibold text-sm">Google AI Studio API Key</span><a href="https://aistudio.google.com/apikey" target="_blank" className="text-xs text-violet-400 hover:underline mr-auto">קבל חינמי ↗</a></div>
              <div className="flex gap-2">
                <input type={apiKeyVisible?'text':'password'} value={googleApiKey} onChange={e=>setGoogleApiKey(e.target.value)} placeholder="AIza..." className="flex-1 bg-black border border-white/20 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:border-violet-500 outline-none"/>
                <button onClick={()=>setApiKeyVisible(!apiKeyVisible)} className="px-4 py-2 rounded-xl border border-white/10 text-gray-500 hover:text-white text-xs transition-colors">{apiKeyVisible?'הסתר':'הצג'}</button>
              </div>
              <p className="text-xs text-gray-600">המפתח נשמר אצלך בדפדפן בלבד</p>
            </div>
            <div className="space-y-3"><p className="text-xs text-gray-500 uppercase tracking-wider">סגנונות מוכנים</p>
              <div className="flex flex-wrap gap-2">{STYLE_PRESETS.map(s=>(<button key={s.label} onClick={()=>setStylePrompt(s.prompt)} className={`px-4 py-2 rounded-full text-sm border transition-all ${ stylePrompt===s.prompt?'border-violet-500 bg-violet-500/20 text-white':'border-white/10 text-gray-400 hover:border-violet-500/50' }`}>{s.label}</button>))}</div>
            </div>
            <div className="space-y-2"><p className="text-xs text-gray-500 uppercase tracking-wider">או כתוב בעצמך</p>
              <textarea value={stylePrompt} onChange={e=>setStylePrompt(e.target.value)} placeholder="פנים עם סדקים ועיניים קוסמיות... זהב נזלי..." rows={3} className="w-full bg-black border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-700 focus:border-violet-500 outline-none resize-none text-sm"/>
            </div>
            {regionFile&&(
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <img src={URL.createObjectURL(regionFile)} className="w-24 h-24 object-contain rounded-xl bg-black" alt="region"/>
                <div><p className="font-semibold">{selectedRegion.label}</p><p className="text-xs text-gray-500 mt-1">האזור יישלח ל-Google Imagen לשינוי סגנון</p></div>
              </div>
            )}
            <button onClick={generate} disabled={generating||!googleApiKey||!stylePrompt} className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 font-bold text-lg flex items-center justify-center gap-3 transition-all">
              {generating?<><Loader2 size={22} className="animate-spin"/>Google Imagen יוצר...</>:<><ImageIcon size={22}/>צור עם Google Imagen</>}
            </button>
            {generatedImages.length>0&&(
              <div className="space-y-3"><p className="text-xs text-gray-500 uppercase tracking-wider">תמונות קודמות</p>
                <div className="grid grid-cols-3 gap-3">{generatedImages.map((img,i)=>(
                  <div key={i} className="relative cursor-pointer rounded-xl overflow-hidden border border-white/10 hover:border-violet-500 transition-all" onClick={()=>{setActiveImage(img);setStep('project');}}>
                    <img src={img.imageUrl} className="w-full aspect-square object-cover" alt=""/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2"><span className="text-[10px] text-gray-300 truncate">{img.style}</span></div>
                  </div>
                ))}</div>
              </div>
            )}
          </div>
        )}

        {step==='project'&&activeImage&&(
          <div className="space-y-6">
            <div className="text-center"><h2 className="text-3xl font-bold mb-1">📡 הקרנה תלת מימד</h2><p className="text-gray-400">אזור: <span className="text-violet-400 font-semibold">{selectedRegion?.label}</span></p></div>
            <div className="relative bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
              <canvas ref={projCanvasRef} className="w-full" style={{aspectRatio:'16/9'}}/>
              {recording&&(
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/90 font-bold text-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>מקליט... {countdown}s
                </div>
              )}
            </div>
            <div className="max-w-xl mx-auto space-y-5">
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-2"><span>עומק תלת מימד</span><span>{Math.round(depth3D*100)}%</span></div>
                <input type="range" min="0" max="1" step="0.05" value={depth3D} onChange={e=>setDepth3D(+e.target.value)} className="w-full accent-violet-500"/>
              </div>

              {/* RECORDER */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center gap-2"><Video size={16} className="text-violet-400"/><span className="font-semibold text-sm">הקלטת לופ — חינם, בדפדפן</span></div>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">אורך הלופ</p>
                  <div className="flex gap-2">
                    {LOOP_DURATIONS.map(d=>(
                      <button key={d} onClick={()=>setLoopDuration(d)} disabled={recording}
                        className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${ loopDuration===d?'bg-violet-600 text-white':'bg-white/5 text-gray-500 hover:text-white disabled:opacity-40' }`}>{d}s</button>
                    ))}
                  </div>
                </div>
                <button onClick={recording?stopRecording:startRecording}
                  className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${ recording?'bg-red-600 hover:bg-red-700 animate-pulse':'bg-violet-600 hover:bg-violet-700' }`}>
                  {recording?<><Square size={18} fill="white"/>עצור ({countdown}s)</>:<><Video size={18}/>הקלט לופ {loopDuration} שניות</>}
                </button>
                {recording&&(
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{width:`${((loopDuration-countdown)/loopDuration)*100}%`}}/>
                  </div>
                )}
                {recordedUrl&&(
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-400 font-semibold">✅ הלופ מוכן!</span>
                      <span className="text-xs text-gray-500">{recordedSize}</span>
                    </div>
                    <video src={recordedUrl} className="w-full rounded-xl border border-white/10" controls loop autoPlay muted/>
                    <button onClick={downloadVideo} className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 font-bold flex items-center justify-center gap-2 transition-colors text-base">
                      <Download size={18}/> הורד וידאו WebM
                    </button>
                    <p className="text-xs text-gray-600 text-center">WebM נתמך בכל דפדפן מודרני</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={downloadPng} className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"><Camera size={15}/> PNG</button>
                <button onClick={()=>setStep('generate')} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"><Sparkles size={15}/> סגנון אחר</button>
                <button onClick={()=>{setStep('upload');setImageUrl(null);setImageFile(null);setRecordedUrl(null);}} className="py-2.5 px-4 rounded-xl border border-white/10 text-gray-600 hover:text-white transition-colors"><RotateCcw size={15}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
