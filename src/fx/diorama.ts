/**
 * HD-2D "diorama" post-process: pseudo-3D tilted perspective, tilt-shift depth of field,
 * bloom, faux volumetric light shafts, warm/cool colour grading, depth fog and vignette.
 * One full-screen pass (WebGL). Quality presets keep mid-range phones at 60fps.
 */
import Phaser from 'phaser';

const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uRes;
uniform float uTime;
uniform float uPersp;   // perspective strength (0..0.3)
uniform float uBlur;    // tilt-shift radius in px
uniform float uBloom;   // bloom amount
uniform float uRays;    // light shaft intensity
uniform float uFogAmt;
uniform vec3 uFog;
uniform vec3 uWarm;     // highlight tint
uniform vec3 uCool;     // shadow tint
uniform float uVig;
uniform float uQuality; // 0 low, 1 high
varying vec2 outTexCoord;

vec3 tap(vec2 uv) { return texture2D(uMainSampler, clamp(uv, vec2(0.001), vec2(0.999))).rgb; }

void main() {
  vec2 uv = outTexCoord;
  float top = uv.y;                       // 1 = top of screen (far), 0 = bottom (near)
  // perspective: magnify the foreground, keep the horizon
  float s = 1.0 - uPersp * (1.0 - top);
  float a = uPersp * 0.9;
  vec2 src = vec2(0.5 + (uv.x - 0.5) * s, top - a * top * (1.0 - top));
  vec3 col = tap(src);
  vec2 px = 1.0 / uRes;
  if (uQuality > 0.5) {
    // tilt-shift: blur near and far bands
    float band = smoothstep(0.30, 0.0, top) * 0.8 + smoothstep(0.66, 1.0, top);
    float r = uBlur * band;
    vec3 acc = col; vec3 glow = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float an = float(i) * 0.785398;
      vec2 d = vec2(cos(an), sin(an));
      vec3 c1 = tap(src + d * px * r);
      acc += c1;
      vec3 c2 = tap(src + d * px * (10.0 + r));
      glow += max(c2 - 0.74, 0.0);
    }
    col = mix(col, acc / 9.0, clamp(band * 1.4, 0.0, 1.0));
    col += glow * uBloom * 0.22;
  }
  // light shafts (diagonal, slowly drifting)
  float sh = sin((uv.x * 1.1 + uv.y * 0.55) * 14.0 + uTime * 0.25) * 0.5 + 0.5;
  sh = pow(sh, 18.0) * smoothstep(0.2, 1.0, top);
  col += uWarm * sh * uRays;
  // colour grading: cool shadows, warm highlights, gentle contrast & saturation
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col += uWarm * 0.10 * smoothstep(0.45, 1.0, l) + uCool * 0.10 * (1.0 - smoothstep(0.0, 0.45, l));
  col = mix(vec3(l), col, 1.12);
  col = (col - 0.5) * 1.06 + 0.5;
  // depth fog toward the horizon
  col = mix(col, uFog, smoothstep(0.72, 1.0, top) * uFogAmt);
  // vignette
  vec2 q = uv - 0.5; q.x *= uRes.x / uRes.y;
  col *= 1.0 - uVig * smoothstep(0.35, 0.85, length(q));
  gl_FragColor = vec4(col, 1.0);
}`;

export interface DioramaParams { persp: number; blur: number; bloom: number; rays: number; fogAmt: number; fog: number; warm: number; cool: number; vig: number }
export const PRESETS: Record<string, Partial<DioramaParams>> = {
  outdoor: { persp: 0.22, blur: 3.2, bloom: 1.0, rays: 0.10, fogAmt: 0.35, fog: 0xbfd8f0, warm: 0xffc890, cool: 0x3050a0, vig: 0.55 },
  night: { persp: 0.22, blur: 3.2, bloom: 1.5, rays: 0.0, fogAmt: 0.35, fog: 0x101838, warm: 0xffb070, cool: 0x2040a0, vig: 0.7 },
  indoor: { persp: 0.12, blur: 2.4, bloom: 1.2, rays: 0.05, fogAmt: 0.0, fog: 0x000000, warm: 0xffb070, cool: 0x302060, vig: 0.65 },
  dungeon: { persp: 0.2, blur: 3.0, bloom: 1.8, rays: 0.0, fogAmt: 0.4, fog: 0x0a0610, warm: 0xff9050, cool: 0x302070, vig: 0.8 },
  sky: { persp: 0.2, blur: 3.0, bloom: 1.8, rays: 0.14, fogAmt: 0.25, fog: 0x2a2060, warm: 0xffe0a0, cool: 0x5040c0, vig: 0.6 },
  battle: { persp: 0.0, blur: 0, bloom: 0.8, rays: 0.06, fogAmt: 0.0, fog: 0x000000, warm: 0xffc890, cool: 0x3040a0, vig: 0.6 },
};

export class DioramaFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  p: DioramaParams = { persp: 0.2, blur: 3, bloom: 1, rays: 0.08, fogAmt: 0.3, fog: 0x000000, warm: 0xffc890, cool: 0x3050a0, vig: 0.6 };
  static quality = typeof localStorage !== 'undefined' && localStorage.getItem('ember_gfx') === '0' ? 0 : 1;
  constructor(game: Phaser.Game) { super({ game, name: 'DioramaFX', fragShader: FRAG }); }
  apply(preset: string, over: Partial<DioramaParams> = {}) { Object.assign(this.p, PRESETS[preset] || {}, over); return this; }
  onPreRender() {
    const c = (v: number) => [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255] as const;
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uRes', this.renderer.width, this.renderer.height);
    this.set1f('uPersp', this.p.persp); this.set1f('uBlur', this.p.blur); this.set1f('uBloom', this.p.bloom); this.set1f('uRays', this.p.rays);
    this.set1f('uFogAmt', this.p.fogAmt); this.set3f('uFog', ...c(this.p.fog)); this.set3f('uWarm', ...c(this.p.warm)); this.set3f('uCool', ...c(this.p.cool));
    this.set1f('uVig', this.p.vig); this.set1f('uQuality', DioramaFX.quality);
  }
}
/** Attach the diorama pass to a camera (no-op on Canvas renderer). */
export function diorama(cam: Phaser.Cameras.Scene2D.Camera, preset: string, over: Partial<DioramaParams> = {}): DioramaFX | undefined {
  if (!(cam.scene.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer)) return;
  cam.setPostPipeline(DioramaFX);
  const p = cam.getPostPipeline(DioramaFX) as DioramaFX | DioramaFX[];
  const fx = Array.isArray(p) ? p[p.length - 1] : p; fx?.apply(preset, over); return fx;
}
