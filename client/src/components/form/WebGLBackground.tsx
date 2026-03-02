/**
 * WebGL Background Component
 * Renders animated WebGL backgrounds for forms.
 * Supports: gradient-flow, particles, aurora, waves, mesh-gradient
 */

import { useRef, useEffect, useCallback } from "react";
import type { WebGLEffect } from "@/lib/builderTypes";

interface WebGLBackgroundProps {
  effect: WebGLEffect;
  intensity: number; // 0-100
  baseColor: string;
  className?: string;
}

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16) / 255,
    parseInt(h.substring(2, 4), 16) / 255,
    parseInt(h.substring(4, 6), 16) / 255,
  ];
}

// ─── Shader Programs ───

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADERS: Record<WebGLEffect, string> = {
  "gradient-flow": `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color;
    uniform float u_intensity;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float speed = u_intensity * 0.5;
      
      float wave1 = sin(uv.x * 3.0 + u_time * speed * 0.4) * 0.5 + 0.5;
      float wave2 = sin(uv.y * 2.5 + u_time * speed * 0.3 + 1.5) * 0.5 + 0.5;
      float wave3 = sin((uv.x + uv.y) * 2.0 + u_time * speed * 0.5) * 0.5 + 0.5;
      
      vec3 color1 = u_color;
      vec3 color2 = u_color * 0.6 + vec3(0.1, 0.05, 0.2);
      vec3 color3 = u_color * 0.4 + vec3(0.05, 0.1, 0.15);
      
      vec3 finalColor = mix(color1, color2, wave1);
      finalColor = mix(finalColor, color3, wave2 * 0.5);
      finalColor += wave3 * 0.08;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,

  particles: `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color;
    uniform float u_intensity;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      vec3 bg = u_color * 0.15;
      float brightness = 0.0;
      float speed = u_intensity * 0.3;
      
      for (float i = 0.0; i < 30.0; i++) {
        vec2 pos = vec2(
          random(vec2(i, 0.0)),
          fract(random(vec2(0.0, i)) + u_time * speed * (0.02 + random(vec2(i, i)) * 0.03))
        );
        float size = 0.002 + random(vec2(i, i * 2.0)) * 0.004;
        float d = length(uv - pos);
        float glow = size / (d * d + 0.001);
        brightness += glow * 0.0008;
      }
      
      vec3 particleColor = u_color * brightness;
      gl_FragColor = vec4(bg + particleColor, 1.0);
    }
  `,

  aurora: `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color;
    uniform float u_intensity;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float speed = u_intensity * 0.4;
      
      float aurora = 0.0;
      for (float i = 1.0; i < 5.0; i++) {
        float freq = i * 1.5;
        float amp = 0.08 / i;
        aurora += amp * sin(uv.x * freq + u_time * speed * 0.3 * i + i * 1.3);
      }
      
      float band = smoothstep(0.3, 0.5, uv.y + aurora) * smoothstep(0.8, 0.6, uv.y + aurora);
      
      vec3 color1 = u_color;
      vec3 color2 = vec3(u_color.g, u_color.b, u_color.r);
      vec3 auroraColor = mix(color1, color2, sin(uv.x * 3.0 + u_time * speed * 0.2) * 0.5 + 0.5);
      
      vec3 bg = u_color * 0.08;
      vec3 finalColor = bg + auroraColor * band * 0.8;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,

  waves: `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color;
    uniform float u_intensity;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float speed = u_intensity * 0.5;
      
      float wave = 0.0;
      for (float i = 1.0; i < 6.0; i++) {
        wave += sin(uv.x * i * 2.0 + u_time * speed * 0.2 * i + i) / i;
      }
      wave = wave * 0.15 + 0.5;
      
      float dist = abs(uv.y - wave);
      float line = smoothstep(0.08, 0.0, dist);
      float glow = smoothstep(0.3, 0.0, dist) * 0.3;
      
      vec3 bg = u_color * 0.12;
      vec3 waveColor = u_color * (line + glow);
      
      // Second wave
      float wave2 = 0.0;
      for (float i = 1.0; i < 4.0; i++) {
        wave2 += sin(uv.x * i * 1.5 + u_time * speed * 0.15 * i + i * 2.0 + 2.0) / i;
      }
      wave2 = wave2 * 0.12 + 0.35;
      float dist2 = abs(uv.y - wave2);
      float line2 = smoothstep(0.06, 0.0, dist2);
      float glow2 = smoothstep(0.25, 0.0, dist2) * 0.2;
      waveColor += u_color * 0.7 * (line2 + glow2);
      
      gl_FragColor = vec4(bg + waveColor, 1.0);
    }
  `,

  "mesh-gradient": `
    precision mediump float;
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform vec3 u_color;
    uniform float u_intensity;

    void main() {
      vec2 uv = gl_FragCoord.xy / u_resolution;
      float speed = u_intensity * 0.3;
      
      float t = u_time * speed * 0.15;
      
      vec2 p1 = vec2(0.3 + sin(t * 0.7) * 0.2, 0.3 + cos(t * 0.5) * 0.2);
      vec2 p2 = vec2(0.7 + sin(t * 0.5 + 2.0) * 0.2, 0.7 + cos(t * 0.8 + 1.0) * 0.2);
      vec2 p3 = vec2(0.5 + sin(t * 0.9 + 4.0) * 0.3, 0.5 + cos(t * 0.6 + 3.0) * 0.3);
      
      float d1 = 1.0 - smoothstep(0.0, 0.6, length(uv - p1));
      float d2 = 1.0 - smoothstep(0.0, 0.6, length(uv - p2));
      float d3 = 1.0 - smoothstep(0.0, 0.5, length(uv - p3));
      
      vec3 c1 = u_color;
      vec3 c2 = vec3(u_color.b, u_color.r, u_color.g) * 0.8 + 0.2;
      vec3 c3 = vec3(u_color.g, u_color.b, u_color.r) * 0.6 + 0.1;
      
      vec3 finalColor = c1 * d1 + c2 * d2 + c3 * d3;
      finalColor = mix(u_color * 0.1, finalColor, 0.8);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};

export function WebGLBackground({ effect, intensity, baseColor, className = "" }: WebGLBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return;

    glRef.current = gl;

    // Create shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADERS[effect]);
    gl.compileShader(fs);

    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.warn("WebGL shader compile error:", gl.getShaderInfoLog(fs));
      return;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("WebGL program link error:", gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;
    gl.useProgram(program);

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    startTimeRef.current = Date.now();
  }, [effect]);

  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    // Resize if needed
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = canvas.clientWidth * dpr;
    const h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }

    const time = (Date.now() - startTimeRef.current) / 1000;
    const [r, g, b] = hexToRGB(baseColor);
    const normalizedIntensity = intensity / 100;

    gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), w, h);
    gl.uniform3f(gl.getUniformLocation(program, "u_color"), r, g, b);
    gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), normalizedIntensity);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animFrameRef.current = requestAnimationFrame(render);
  }, [baseColor, intensity]);

  useEffect(() => {
    initGL();
    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      const gl = glRef.current;
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
    };
  }, [initGL, render]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}

// ─── Effect Metadata ───

export const WEBGL_EFFECTS: { id: WebGLEffect; label: string; description: string }[] = [
  { id: "gradient-flow", label: "Gradiente Fluido", description: "Gradientes suaves em movimento" },
  { id: "particles", label: "Partículas", description: "Partículas luminosas flutuantes" },
  { id: "aurora", label: "Aurora Boreal", description: "Faixas de luz ondulantes" },
  { id: "waves", label: "Ondas", description: "Ondas sinuosas animadas" },
  { id: "mesh-gradient", label: "Mesh Gradient", description: "Bolhas de cor em movimento" },
];
