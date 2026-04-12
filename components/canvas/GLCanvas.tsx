'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

const SHADERS: Record<string, string> = {
  none: `
    void main() {
      gl_FragColor = texture2D(u_image, v_texCoord);
    }
  `,
  kaleidoscope: `
    void main() {
      vec2 uv = v_texCoord - 0.5;
      float angle = atan(uv.y, uv.x);
      float r = length(uv);
      float slices = 8.0;
      angle = mod(angle, 3.14159 * 2.0 / slices);
      angle = abs(angle - 3.14159 / slices);
      uv = vec2(cos(angle), sin(angle)) * r + 0.5;
      gl_FragColor = texture2D(u_image, uv);
    }
  `,
  fire: `
    void main() {
      vec2 uv = v_texCoord;
      vec4 col = texture2D(u_image, uv);
      float heat = 1.0 - uv.y;
      col.r = min(1.0, col.r + heat * 0.6);
      col.g = max(0.0, col.g - heat * 0.4);
      col.b = max(0.0, col.b - heat * 0.8);
      gl_FragColor = col;
    }
  `,
  mirror: `
    void main() {
      vec2 uv = v_texCoord;
      if (uv.x > 0.5) uv.x = 1.0 - uv.x;
      gl_FragColor = texture2D(u_image, uv);
    }
  `,
  glitch: `
    void main() {
      vec2 uv = v_texCoord;
      float offset = sin(uv.y * 50.0 + u_time * 5.0) * 0.02;
      vec4 r = texture2D(u_image, vec2(uv.x + offset, uv.y));
      vec4 g = texture2D(u_image, uv);
      vec4 b = texture2D(u_image, vec2(uv.x - offset, uv.y));
      gl_FragColor = vec4(r.r, g.g, b.b, 1.0);
    }
  `,
  colorshift: `
    void main() {
      vec4 col = texture2D(u_image, v_texCoord);
      float shift = sin(u_time) * 0.5 + 0.5;
      gl_FragColor = vec4(col.r * shift + col.b * (1.0-shift), col.g, col.b * shift + col.r * (1.0-shift), 1.0);
    }
  `,
  tunnel: `
    void main() {
      vec2 uv = v_texCoord - 0.5;
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      vec2 tuv = vec2(0.3 / r + u_time * 0.2, a / 3.14159);
      gl_FragColor = texture2D(u_image, fract(tuv));
    }
  `,
  dream: `
    void main() {
      vec2 uv = v_texCoord;
      uv.x += sin(uv.y * 8.0 + u_time) * 0.01;
      uv.y += cos(uv.x * 8.0 + u_time) * 0.01;
      vec4 col = texture2D(u_image, uv);
      float glow = 0.3;
      col.r += glow * col.r;
      col.g += glow * col.g * 0.8;
      col.b += glow * col.b * 1.2;
      gl_FragColor = col;
    }
  `,
  cosmic: `
    void main() {
      vec2 uv = v_texCoord;
      vec4 col = texture2D(u_image, uv);
      float t = u_time * 0.5;
      float nebula = sin(uv.x * 5.0 + t) * cos(uv.y * 5.0 - t) * 0.5 + 0.5;
      col.r = col.r * 0.5 + nebula * 0.5;
      col.b = col.b * 0.5 + (1.0 - nebula) * 0.8;
      gl_FragColor = col;
    }
  `,
};

const VS = `
  attribute vec2 a_position;
  varying vec2 v_texCoord;
  uniform vec2 u_tl, u_tr, u_bl, u_br;
  void main() {
    v_texCoord = a_position;
    vec2 pos = a_position;
    vec2 mapped = u_bl * (1.0-pos.x) * (1.0-pos.y)
                + u_br * pos.x * (1.0-pos.y)
                + u_tl * (1.0-pos.x) * pos.y
                + u_tr * pos.x * pos.y;
    gl_Position = vec4(mapped * 2.0 - 1.0, 0.0, 1.0);
  }
`;

function buildFS(body: string) {
  return `precision mediump float;
  uniform sampler2D u_image;
  uniform float u_time;
  varying vec2 v_texCoord;
  ${body}`;
}

function createShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, createShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, createShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

interface Props {
  imageUrl: string | null;
  effect: string;
  corners: { tl: [number,number]; tr: [number,number]; bl: [number,number]; br: [number,number] };
  onCornersChange: (c: Props['corners']) => void;
  activeTool: string;
}

export default function GLCanvas({ imageUrl, effect, corners, onCornersChange, activeTool }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const progRef = useRef<WebGLProgram | null>(null);
  const texRef = useRef<WebGLTexture | null>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());
  const dragging = useRef<string | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<string | null>(null);

  // Init WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;
    glRef.current = gl;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
  }, []);

  // Rebuild shader when effect changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;
    const body = SHADERS[effect] ?? SHADERS.none;
    const prog = createProgram(gl, VS, buildFS(body));
    progRef.current = prog;
  }, [effect]);

  // Load image into texture
  useEffect(() => {
    const gl = glRef.current;
    if (!gl || !imageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      texRef.current = tex;
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Render loop
  useEffect(() => {
    function render() {
      const gl = glRef.current;
      const prog = progRef.current;
      const canvas = canvasRef.current;
      if (!gl || !prog || !canvas) { rafRef.current = requestAnimationFrame(render); return; }

      const W = canvas.clientWidth, H = canvas.clientHeight;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
      gl.clearColor(0.03, 0.03, 0.03, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (!texRef.current && !imageUrl) {
        // draw grid on 2d canvas fallback
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      if (!texRef.current) { rafRef.current = requestAnimationFrame(render); return; }

      gl.useProgram(prog);

      const posLoc = gl.getAttribLocation(prog, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1i(gl.getUniformLocation(prog, 'u_image'), 0);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), (Date.now() - startRef.current) / 1000);
      gl.uniform2fv(gl.getUniformLocation(prog, 'u_tl'), corners.tl);
      gl.uniform2fv(gl.getUniformLocation(prog, 'u_tr'), corners.tr);
      gl.uniform2fv(gl.getUniformLocation(prog, 'u_bl'), corners.bl);
      gl.uniform2fv(gl.getUniformLocation(prog, 'u_br'), corners.br);

      gl.bindTexture(gl.TEXTURE_2D, texRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      rafRef.current = requestAnimationFrame(render);
    }
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [imageUrl, corners]);

  const HANDLE_R = 16;
  const cornerKeys = ['tl','tr','bl','br'] as const;

  const getCanvasXY = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as [number,number];
  };

  const hitCorner = ([x,y]: [number,number]) => {
    for (const k of cornerKeys) {
      const [cx,cy] = corners[k];
      const dx = (cx - x) * (canvasRef.current?.clientWidth ?? 1);
      const dy = (cy - y) * (canvasRef.current?.clientHeight ?? 1);
      if (Math.sqrt(dx*dx+dy*dy) < HANDLE_R) return k;
    }
    return null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (activeTool !== 'cornerpin') return;
    const xy = getCanvasXY(e);
    const hit = hitCorner(xy);
    if (hit) dragging.current = hit;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const xy = getCanvasXY(e);
    setHoveredCorner(hitCorner(xy));
    if (!dragging.current) return;
    onCornersChange({ ...corners, [dragging.current]: xy });
  };

  const onMouseUp = () => { dragging.current = null; };

  const cursor = activeTool === 'cornerpin' ? (dragging.current ? 'grabbing' : hoveredCorner ? 'grab' : 'crosshair') : 'default';

  return (
    <div className="relative w-full h-full bg-black">
      <canvas ref={canvasRef} className="w-full h-full"
        style={{ cursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      />

      {/* Corner handles */}
      {activeTool === 'cornerpin' && cornerKeys.map(k => (
        <div key={k}
          style={{
            position: 'absolute',
            left: `${corners[k][0] * 100}%`,
            top: `${corners[k][1] * 100}%`,
            transform: 'translate(-50%,-50%)',
            width: 28, height: 28,
            borderRadius: '50%',
            background: dragging.current === k ? '#fff' : hoveredCorner === k ? '#a78bfa' : '#7c5cfc',
            border: '3px solid white',
            cursor: 'grab',
            boxShadow: '0 0 12px rgba(124,92,252,0.8)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        />
      ))}

      {!imageUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none">
          <div className="text-6xl mb-4">🎭</div>
          <p className="text-lg">העלה תמונה להתחלה</p>
        </div>
      )}
    </div>
  );
}
