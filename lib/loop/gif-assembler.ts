/**
 * Client-side loop assembly — no server required.
 * Assembles frames into GIF (via gif.js) or WebM (via MediaRecorder).
 */

export async function assembleWebM(
  frames: string[],
  fps: number = 12,
): Promise<string> {
  const firstImg = await loadImage(frames[0]);
  const width = firstImg.naturalWidth || 512;
  const height = firstImg.naturalHeight || 512;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const stream = canvas.captureStream(fps);
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 4_000_000,
    });

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(URL.createObjectURL(blob));
    };
    recorder.onerror = reject;

    recorder.start();

    let frameIdx = 0;
    const frameMs = 1000 / fps;

    function renderFrame() {
      if (frameIdx >= frames.length) {
        setTimeout(() => recorder.stop(), frameMs);
        return;
      }
      loadImage(frames[frameIdx]).then((img) => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        frameIdx++;
        setTimeout(renderFrame, frameMs);
      }).catch(reject);
    }

    renderFrame();
  });
}

export async function assembleGif(
  frames: string[],
  fps: number = 10,
): Promise<string> {
  // Dynamic import of gif.js — falls back gracefully if not available
  try {
    // @ts-ignore
    const GIF = (await import('gif.js')).default;
    const firstImg = await loadImage(frames[0]);
    const width = firstImg.naturalWidth || 512;
    const height = firstImg.naturalHeight || 512;

    return new Promise((resolve, reject) => {
      const gif = new GIF({
        workers: 2,
        quality: 8,
        width,
        height,
        workerScript: '/gif.worker.js',
      });

      Promise.all(frames.map(loadImage)).then((imgs) => {
        imgs.forEach((img) => gif.addFrame(img, { delay: Math.round(1000 / fps) }));
        gif.on('finished', (blob: Blob) => resolve(URL.createObjectURL(blob)));
        gif.on('error', reject);
        gif.render();
      }).catch(reject);
    });
  } catch {
    // gif.js not available — fall back to WebM
    return assembleWebM(frames, fps);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
