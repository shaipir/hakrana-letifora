'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useMappingStore } from '@/lib/mapping-store';
import { generateMeshGeometry, findNearestMeshPoint } from '@/lib/mapping/mesh-warp';
import { tessellateBezierSurface, findNearestBezierPoint } from '@/lib/mapping/bezier-warp';
import { Point } from '@/lib/types';
import { Surface } from '@/lib/mapping-types';

// ─── Vertex Shader ────────────────────────────────────────────────────────────

const VS = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  void main() {
    v_texCoord = a_texCoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// ─── Fragment Shader ──────────────────────────────────────────────────────────

const FS = `
  precision mediump float;
  uniform sampler2D u_image;
  uniform float u_opacity;
  varying vec2 v_texCoord;
  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    gl_FragColor = vec4(color.rgb, color.a * u_opacity);
  }
`;

// ─── WebGL Helpers ────────────────────────────────────────────────────────────

function createShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    const typeName = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
    console.error(`[MAPPING:WarpCanvas] ${typeName} shader compilation failed:`, info);
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, createShader(gl, gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, createShader(gl, gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    console.error('[MAPPING:WarpCanvas] WebGL program link failed:', info);
  } else {
    console.log('[MAPPING:WarpCanvas] WebGL program linked successfully');
  }
  return prog;
}

// ─── Texture Cache ────────────────────────────────────────────────────────────

type TexCache = Map<string, WebGLTexture | null>;

function loadTexture(gl: WebGLRenderingContext, url: string, cache: TexCache): WebGLTexture | null {
  if (cache.has(url)) return cache.get(url) ?? null;
  // Mark as loading to avoid duplicate requests
  cache.set(url, null);
  console.log('[MAPPING:WarpCanvas] Starting texture load for:', url.slice(0, 80));
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    console.log('[MAPPING:WarpCanvas] Texture image loaded OK', img.naturalWidth, 'x', img.naturalHeight, 'url:', url.slice(0, 80));
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (tex) {
      cache.set(url, tex);
    } else {
      console.error('[MAPPING:WarpCanvas] gl.createTexture() returned null for url:', url.slice(0, 80));
    }
  };
  img.onerror = (err) => {
    console.error('[MAPPING:WarpCanvas] Texture image failed to load, url:', url.slice(0, 80), err);
  };
  img.src = url;
  return null;
}

// ─── Corner-pin quad geometry ─────────────────────────────────────────────────

function buildCornerPinGeometry(
  surface: Surface,
  canvasWidth: number,
  canvasHeight: number,
): { positions: Float32Array; uvs: Float32Array } {
  const { topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br } = surface.cornerPin;

  const toClip = (p: Point) => [
    (p.x / canvasWidth) * 2 - 1,
    1 - (p.y / canvasHeight) * 2,
  ] as [number, number];

  const [tlx, tly] = toClip(tl);
  const [trx, try_] = toClip(tr);
  const [blx, bly] = toClip(bl);
  const [brx, bry] = toClip(br);

  // Two triangles: tl, bl, tr  and  tr, bl, br
  const positions = new Float32Array([
    tlx, tly, blx, bly, trx, try_,
    trx, try_, blx, bly, brx, bry,
  ]);
  const uvs = new Float32Array([
    0, 0, 0, 1, 1, 0,
    1, 0, 0, 1, 1, 1,
  ]);

  return { positions, uvs };
}

// ─── Draw a single surface ────────────────────────────────────────────────────

function drawSurface(
  gl: WebGLRenderingContext,
  prog: WebGLProgram,
  surface: Surface,
  texture: WebGLTexture,
  canvasWidth: number,
  canvasHeight: number,
): void {
  gl.useProgram(prog);

  const posLoc = gl.getAttribLocation(prog, 'a_position');
  const uvLoc = gl.getAttribLocation(prog, 'a_texCoord');
  const imageLoc = gl.getUniformLocation(prog, 'u_image');
  const opacityLoc = gl.getUniformLocation(prog, 'u_opacity');

  gl.uniform1i(imageLoc, 0);
  gl.uniform1f(opacityLoc, surface.opacity);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if (surface.warpMode === 'mesh') {
    const { positions, uvs, indices } = generateMeshGeometry(
      surface.meshGrid,
      canvasWidth,
      canvasHeight,
    );

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  } else if (surface.warpMode === 'bezier') {
    const { positions, uvs, indices } = tessellateBezierSurface(
      surface.bezierSurface,
      canvasWidth,
      canvasHeight,
    );

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
  } else {
    // corner-pin: plain quad with drawArrays
    const { positions, uvs } = buildCornerPinGeometry(surface, canvasWidth, canvasHeight);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}

// ─── Overlay drawing ──────────────────────────────────────────────────────────

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  surface: Surface,
  canvasWidth: number,
  canvasHeight: number,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);

  const toScreen = (p: Point) => ({
    x: (p.x / canvasWidth) * w,
    y: (p.y / canvasHeight) * h,
  });

  if (surface.warpMode === 'mesh') {
    const { points, cols, rows } = surface.meshGrid;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // Rows
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) {
        const s = toScreen(points[r][c]);
        if (c === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }

    // Columns
    for (let c = 0; c <= cols; c++) {
      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const s = toScreen(points[r][c]);
        if (r === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }

    // Draw control points
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const s = toScreen(points[r][c]);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'cyan';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  } else if (surface.warpMode === 'bezier') {
    const { controlPoints } = surface.bezierSurface;
    const rows = controlPoints.length;
    const cols = controlPoints[0]?.length ?? 0;

    // Draw lattice lines
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
    ctx.lineWidth = 1;

    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const s = toScreen(controlPoints[r][c]);
        if (c === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }

    for (let c = 0; c < cols; c++) {
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        const s = toScreen(controlPoints[r][c]);
        if (r === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }

    // Draw control points
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = toScreen(controlPoints[r][c]);
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WarpCanvas() {
  const { project, updateMeshPoint, updateBezierPoint } = useMappingStore();
  const { surfaces, activeSurfaceId, contentItems, canvasWidth, canvasHeight } = project;

  const containerRef = useRef<HTMLDivElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const texCacheRef = useRef<TexCache>(new Map());
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  // Drag state
  const draggingRef = useRef<{ row: number; col: number } | null>(null);
  const dragModeRef = useRef<'mesh' | 'bezier' | null>(null);

  // ── Init WebGL ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = glCanvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('[MAPPING:WarpCanvas] WebGL context creation failed — browser may not support WebGL or hardware acceleration is disabled');
      return;
    }
    console.log('[MAPPING:WarpCanvas] WebGL context created successfully');
    glRef.current = gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    progRef.current = createProgram(gl);
  }, []);

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        sizeRef.current = { w: width, h: height };
        const glCanvas = glCanvasRef.current;
        const overlay = overlayRef.current;
        if (glCanvas) { glCanvas.width = width; glCanvas.height = height; }
        if (overlay) { overlay.width = width; overlay.height = height; }
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // ── Render loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function render() {
      const gl = glRef.current;
      const prog = progRef.current;
      const glCanvas = glCanvasRef.current;
      if (!gl || !prog || !glCanvas) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      const { w, h } = sizeRef.current;
      gl.viewport(0, 0, w, h);
      gl.clearColor(0.06, 0.06, 0.08, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      for (const surface of surfaces) {
        if (!surface.visible) continue;
        if (!surface.contentId) {
          console.warn('[MAPPING:WarpCanvas] Surface has no contentId, skipping draw:', surface.id, surface.name);
          continue;
        }
        const item = contentItems.find((ci) => ci.id === surface.contentId);
        if (!item) {
          console.warn('[MAPPING:WarpCanvas] contentId not found in contentItems for surface:', surface.id, surface.name, 'contentId:', surface.contentId);
          continue;
        }

        const texture = loadTexture(gl, item.url, texCacheRef.current);
        if (!texture) {
          // Texture still loading — this is normal, not an error
          continue;
        }

        try {
          drawSurface(gl, prog, surface, texture, canvasWidth, canvasHeight);
        } catch (err) {
          console.error('[MAPPING:WarpCanvas] drawSurface threw an error for surface:', surface.id, surface.name, err);
        }
      }

      // Overlay for active surface
      const overlay = overlayRef.current;
      if (overlay) {
        const ctx = overlay.getContext('2d');
        if (ctx) {
          const activeSurface = surfaces.find((s) => s.id === activeSurfaceId);
          if (activeSurface && (activeSurface.warpMode === 'mesh' || activeSurface.warpMode === 'bezier')) {
            drawOverlay(ctx, activeSurface, canvasWidth, canvasHeight, w, h);
          } else {
            ctx.clearRect(0, 0, w, h);
          }
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [surfaces, activeSurfaceId, contentItems, canvasWidth, canvasHeight]);

  // ── Mouse helpers ───────────────────────────────────────────────────────────

  const getCanvasPoint = useCallback((e: React.MouseEvent): Point => {
    const overlay = overlayRef.current!;
    const rect = overlay.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    return { x: nx * canvasWidth, y: ny * canvasHeight };
  }, [canvasWidth, canvasHeight]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const activeSurface = surfaces.find((s) => s.id === activeSurfaceId);
    if (!activeSurface) return;

    const pos = getCanvasPoint(e);

    if (activeSurface.warpMode === 'mesh') {
      const hit = findNearestMeshPoint(activeSurface.meshGrid, pos);
      if (hit) {
        draggingRef.current = hit;
        dragModeRef.current = 'mesh';
      }
    } else if (activeSurface.warpMode === 'bezier') {
      const hit = findNearestBezierPoint(activeSurface.bezierSurface, pos);
      if (hit) {
        draggingRef.current = hit;
        dragModeRef.current = 'bezier';
      }
    }
  }, [surfaces, activeSurfaceId, getCanvasPoint]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingRef.current || !activeSurfaceId) return;
    const pos = getCanvasPoint(e);
    const { row, col } = draggingRef.current;

    if (dragModeRef.current === 'mesh') {
      updateMeshPoint(activeSurfaceId, row, col, pos);
    } else if (dragModeRef.current === 'bezier') {
      updateBezierPoint(activeSurfaceId, row, col, pos);
    }
  }, [activeSurfaceId, getCanvasPoint, updateMeshPoint, updateBezierPoint]);

  const onMouseUp = useCallback(() => {
    draggingRef.current = null;
    dragModeRef.current = null;
  }, []);

  const activeSurface = surfaces.find((s) => s.id === activeSurfaceId);
  const showOverlayCursor =
    activeSurface &&
    (activeSurface.warpMode === 'mesh' || activeSurface.warpMode === 'bezier');

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden bg-[#0f0f14]">
      {/* WebGL canvas — bottom layer */}
      <canvas
        ref={glCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />

      {/* 2D overlay canvas — top layer for control points */}
      <canvas
        ref={overlayRef}
        className="absolute inset-0 w-full h-full"
        style={{ cursor: showOverlayCursor ? 'crosshair' : 'default' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Empty state */}
      {surfaces.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-ar-text-muted pointer-events-none select-none">
          <p className="text-sm">No surfaces — create some in the Map tab</p>
        </div>
      )}
    </div>
  );
}
