/**
 * Round 4 – real 3D diorama renderer (Octopath-style HD-2D).
 *
 * The Phaser WorldScene stays the game logic and owns its display list; its camera no longer draws.
 * Every frame this module mirrors that display list into a Three.js scene rendered on a canvas *behind*
 * the transparent Phaser canvas (UI, dialogue and menus stay Phaser, on top):
 *  - painted ground / water / decals lie flat on the ground plane,
 *  - characters, trees, props, grass stand up as pixel billboards with their feet on the ground,
 *  - houses become real extruded geometry (front wall, side walls, gables, sloped roofs, chimney),
 *  - solid wall/cliff tiles are extruded into blocks (see addBlocks),
 *  - a perspective camera pitched like OT2, depth-buffer occlusion (walk behind things),
 *  - cast shadows: all standing geometry is flattened along the sun direction into a shadow map,
 *  - night/dungeon light map (ambient + flickering point lights) applied to everything,
 *  - post pass: tilt-shift DOF, bloom, god rays, grade, fog, vignette, camera fades/flashes.
 * Fast mode skips the post pass and uses cheaper shadows.
 */
import * as THREE from 'three';
import Phaser from 'phaser';
import { DioramaFX } from './diorama';

THREE.ColorManagement.enabled = false;
/** camera elevation, field of view, vertical stretch of standing art (keeps on-screen proportions of the 2D art) */
export const ELEV = 47 * Math.PI / 180, FOV = 30;
export const SV = 1.32;
/** shadow direction: ground offset per unit of height (sun low in the front-left, shadows fall back-right) */
const SUN = { x: 0.62, z: -0.78 };
const UP = new THREE.Vector3(0, Math.cos(ELEV), -Math.sin(ELEV));

// ---- bump a version on Phaser canvases whenever Phaser re-uploads them, so mirrored textures stay in sync
{
  const CT: any = (Phaser.Textures as any).CanvasTexture.prototype; const r0 = CT.refresh;
  CT.refresh = function (this: any) { const out = r0.call(this); const c = this.canvas || this.getSourceImage?.(); if (c) c.__v = (c.__v || 0) + 1; return out; };
  const TX: any = (Phaser.GameObjects as any).Text.prototype; const u0 = TX.updateText;
  TX.updateText = function (this: any) { const out = u0.call(this); if (this.canvas) this.canvas.__v = (this.canvas.__v || 0) + 1; return out; };
}

const VERT = `
attribute vec4 color; attribute vec2 foot;
varying vec2 vUv; varying vec4 vCol; varying vec2 vFoot;
void main() { vUv = uv; vCol = color; vFoot = foot; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG = `
uniform sampler2D map; uniform sampler2D lightMap; uniform sampler2D shadowMap;
uniform vec2 mapSize; uniform float useLight; uniform float useShadow; uniform float alphaTest; uniform float shadowK; uniform vec3 shadowTint; uniform float soft;
varying vec2 vUv; varying vec4 vCol; varying vec2 vFoot;
void main() {
  vec4 c = texture2D(map, vUv) * vCol;
  if (c.a < alphaTest) discard;
  vec2 g = vec2(vFoot.x / mapSize.x, 1.0 - vFoot.y / mapSize.y);
  if (useShadow > 0.5) {
    vec2 px = 1.0 / mapSize; float s = texture2D(shadowMap, g).r;
    if (soft > 0.5) s = s * 0.4 + 0.15 * (texture2D(shadowMap, g + vec2(px.x * 1.5, 0.0)).r + texture2D(shadowMap, g - vec2(px.x * 1.5, 0.0)).r + texture2D(shadowMap, g + vec2(0.0, px.y * 1.5)).r + texture2D(shadowMap, g - vec2(0.0, px.y * 1.5)).r);
    c.rgb *= mix(vec3(1.0), shadowTint, s * shadowK);
  }
  if (useLight > 0.5) c.rgb *= texture2D(lightMap, g).rgb * 1.08;
  gl_FragColor = c;
}`;
/** shadow pass: flatten geometry along the sun onto the ground, top-down orthographic into the shadow map */
const SVERT = `
uniform vec2 mapSize; uniform vec2 sun;
varying vec2 vUv; varying float vA;
attribute vec4 color;
void main() { vUv = uv; vA = color.a; vec2 gp = vec2(position.x + position.y * sun.x, position.z + position.y * sun.y);
  gl_Position = vec4(gp.x / mapSize.x * 2.0 - 1.0, 1.0 - gp.y / mapSize.y * 2.0, 0.0, 1.0); }`;
const SFRAG = `
uniform sampler2D map; varying vec2 vUv; varying float vA;
void main() { if (texture2D(map, vUv).a * vA < 0.5) discard; gl_FragColor = vec4(1.0); }`;
const WFRAG = `
uniform sampler2D map; uniform sampler2D lightMap; uniform sampler2D shadowMap; uniform vec2 mapSize; uniform float useLight; uniform float uTime; uniform vec3 uSky; uniform float uNight; uniform vec2 texSize;
varying vec2 vUv; varying vec4 vCol; varying vec2 vFoot;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec4 base = texture2D(map, vUv); if (base.a < 0.02) discard;
  vec2 w = vFoot; float t = uTime;
  vec2 d = vec2(sin(w.y * 0.35 + t * 1.7) + sin(w.x * 0.21 + w.y * 0.13 + t * 1.1), cos(w.x * 0.3 + t * 1.4) + sin(w.y * 0.17 - t * 0.9)) * 0.45;
  vec4 c = texture2D(map, vUv + d / texSize); if (c.a < 0.5) c = base;
  vec3 col = c.rgb;
  float ca = n(w * 0.18 + vec2(t * 0.35, t * 0.2)) + n(w * 0.25 - vec2(t * 0.25, -t * 0.3));
  col += smoothstep(1.25, 1.6, ca) * 0.16 * (1.0 - uNight * 0.6);
  vec2 g = vec2(vFoot.x / mapSize.x, 1.0 - vFoot.y / mapSize.y);
  col *= mix(vec3(1.0), vec3(0.55, 0.6, 0.8), texture2D(shadowMap, g).r * 0.7);
  col = mix(col, uSky, 0.16);
  float gl = step(0.985, n(floor(w * 0.9) + floor(t * 3.0) * 13.1)) * (0.6 + 0.4 * sin(t * 9.0 + w.x));
  col += vec3(1.0, 0.97, 0.88) * gl * (uNight > 0.5 ? 0.5 : 0.9);
  if (useLight > 0.5) col *= texture2D(lightMap, g).rgb * 1.08;
  gl_FragColor = vec4(col, base.a * vCol.a);
}`;
/** post: the round-3 diorama grade without the fake screen tilt (real perspective now), plus camera fades/flashes */
const PFRAG = `
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTime; uniform float uBlur; uniform float uBloom; uniform float uRays; uniform float uFogAmt;
uniform vec3 uFog; uniform vec3 uWarm; uniform vec3 uCool; uniform float uVig; uniform float uFocus; uniform float uSat; uniform vec4 uFade; uniform vec4 uFlash;
varying vec2 vUv;
vec3 tap(vec2 uv) { return texture2D(tDiffuse, clamp(uv, vec2(0.001), vec2(0.999))).rgb; }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 uv = vUv; float top = uv.y; vec3 col = tap(uv); vec2 px = 1.0 / uRes;
  float df = top - uFocus;
  float coc = df > 0.0 ? smoothstep(0.08, 0.45, df) : smoothstep(0.18, 0.5, -df) * 0.8;
  float r = uBlur * coc;
  if (r > 0.25) { vec3 acc = col; float ws = 1.0;
    for (int i = 0; i < 12; i++) { float fi = float(i); float an = fi * 2.39996; float rr = r * sqrt((fi + 0.5) / 12.0);
      vec3 c = tap(uv + vec2(cos(an), sin(an)) * px * rr); float w = 1.0 + luma(c) * 1.5; acc += c * w; ws += w; }
    col = acc / ws; }
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 10; i++) { float an = float(i) * 0.6283 + 0.3; vec2 d = vec2(cos(an), sin(an)) * px;
    vec3 c1 = tap(uv + d * 9.0); vec3 c2 = tap(uv + d * 22.0); glow += max(c1 - 0.62, 0.0) + max(c2 - 0.6, 0.0) * 0.6; }
  col += glow * uBloom * 0.16 * mix(vec3(1.0), uWarm, 0.35);
  vec2 q = vec2(uv.x * uRes.x / uRes.y, 1.0 - uv.y); float p = q.x * 0.82 + q.y * 0.57;
  float beams = sin(p * 9.0 + uTime * 0.13) * 0.5 + 0.5; beams *= sin(p * 23.0 - uTime * 0.21 + 1.7) * 0.35 + 0.65; beams *= sin(p * 4.0 + uTime * 0.07) * 0.5 + 0.5;
  beams = pow(beams, 3.0) * smoothstep(0.05, 1.0, top) * (0.6 + 0.4 * smoothstep(0.9, 0.2, q.x));
  col += uWarm * beams * uRays * 1.6;
  float l = luma(col);
  col += uWarm * 0.09 * smoothstep(0.45, 1.0, l) + uCool * 0.11 * (1.0 - smoothstep(0.0, 0.5, l));
  col = mix(vec3(l), col, uSat); col = clamp(col, 0.0, 1.2);
  col = mix(col, col * col * (3.0 - 2.0 * min(col, 1.0)), 0.38);
  col = mix(col, uFog, smoothstep(0.7, 1.0, top) * uFogAmt);
  vec2 v = uv - 0.5; v.x *= uRes.x / uRes.y; col *= 1.0 - uVig * smoothstep(0.38, 0.9, length(v));
  col = mix(col, uFlash.rgb, uFlash.a); col = mix(col, uFade.rgb, uFade.a);
  gl_FragColor = vec4(col, 1.0);
}`;

type Tex = THREE.Texture & { __src?: any; __v?: number };
interface Quad { p: number[]; uv: number[]; c: number[]; f: number[] }
/** A dynamic batch of textured quads drawn with one material. */
class Batch {
  geo = new THREE.BufferGeometry(); cap = 0; n = 0; pos = new Float32Array(0); uv = new Float32Array(0); col = new Float32Array(0); foot = new Float32Array(0);
  mesh: THREE.Mesh; smesh?: THREE.Mesh; mat: THREE.ShaderMaterial; smat?: THREE.ShaderMaterial;
  constructor(mat: THREE.ShaderMaterial, scene: THREE.Scene, smat?: THREE.ShaderMaterial, sscene?: THREE.Scene) {
    this.mat = mat; this.mesh = new THREE.Mesh(this.geo, mat); this.mesh.frustumCulled = false; scene.add(this.mesh);
    if (smat && sscene) { this.smat = smat; this.smesh = new THREE.Mesh(this.geo, smat); this.smesh.frustumCulled = false; sscene.add(this.smesh); }
    this.grow(64);
  }
  grow(q: number) {
    const cap = Math.max(q, this.cap * 2); const np = new Float32Array(cap * 12), nu = new Float32Array(cap * 8), nc = new Float32Array(cap * 16), nf = new Float32Array(cap * 8);
    np.set(this.pos); nu.set(this.uv); nc.set(this.col); nf.set(this.foot); this.pos = np; this.uv = nu; this.col = nc; this.foot = nf; this.cap = cap;
    const idx = new Uint32Array(cap * 6); for (let i = 0; i < cap; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    const g = this.geo;
    g.setAttribute('position', new THREE.BufferAttribute(np, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('uv', new THREE.BufferAttribute(nu, 2).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(nc, 4).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('foot', new THREE.BufferAttribute(nf, 2).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
  }
  reset() { this.n = 0; }
  add(q: Quad) {
    if (this.n >= this.cap) this.grow(this.n + 1);
    const i = this.n++; this.pos.set(q.p, i * 12); this.uv.set(q.uv, i * 8);
    for (let k = 0; k < 4; k++) { this.col.set(q.c, i * 16 + k * 4); } this.foot.set(q.f, i * 8);
  }
  finish(order: number) {
    const g = this.geo; for (const a of ['position', 'uv', 'color', 'foot']) { const at = g.getAttribute(a) as THREE.BufferAttribute; at.needsUpdate = true; at.clearUpdateRanges(); }
    g.setDrawRange(0, this.n * 6); this.mesh.visible = this.n > 0; this.mesh.renderOrder = order; if (this.smesh) this.smesh.visible = this.n > 0;
  }
}

interface Item { pass: 0 | 1 | 2 | 3; key: number; tex: Tex; blend: number; q: Quad; water?: boolean }

export class World3D {
  static inst?: World3D;
  renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement; scene = new THREE.Scene(); sscene = new THREE.Scene(); cam: THREE.PerspectiveCamera;
  rt?: THREE.WebGLRenderTarget; srt: THREE.WebGLRenderTarget; post?: { scene: THREE.Scene; cam: THREE.OrthographicCamera; mat: THREE.ShaderMaterial };
  texCache = new Map<any, Tex>(); white: Tex; lightTex: THREE.CanvasTexture; lightCv: HTMLCanvasElement;
  pools: Batch[][] = [[], [], [], [], []]; waterBatch?: Batch; staticMeshes: THREE.Object3D[] = [];
  world?: any; mapW = 1; mapH = 1; active = false; W: number; H: number; time0 = performance.now(); quality = 1;
  uniforms: any; xray?: Batch;
  static get(game: Phaser.Game, W: number, H: number) { if (!this.inst) this.inst = new World3D(game, W, H); return this.inst; }
  constructor(public game: Phaser.Game, W: number, H: number) {
    this.W = W; this.H = H;
    this.canvas = document.createElement('canvas'); this.canvas.id = 'world3d';
    Object.assign(this.canvas.style, { position: 'absolute', left: '0', top: '0', zIndex: '0', imageRendering: 'pixelated', display: 'none', pointerEvents: 'none' });
    const parent = (game.canvas.parentElement as HTMLElement); parent.style.position = 'relative'; parent.insertBefore(this.canvas, game.canvas);
    game.canvas.style.position = 'relative'; game.canvas.style.zIndex = '1';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(1); this.renderer.setSize(W, H, false); this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace; this.renderer.autoClear = false;
    this.cam = new THREE.PerspectiveCamera(FOV, W / H, 20, 6000);
    this.srt = new THREE.WebGLRenderTarget(256, 256, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    const wc = document.createElement('canvas'); wc.width = wc.height = 4; const wx = wc.getContext('2d')!; wx.fillStyle = '#fff'; wx.fillRect(0, 0, 4, 4);
    this.white = new THREE.CanvasTexture(wc); this.white.magFilter = this.white.minFilter = THREE.NearestFilter;
    this.lightCv = document.createElement('canvas'); this.lightCv.width = this.lightCv.height = 8;
    this.lightTex = new THREE.CanvasTexture(this.lightCv); this.lightTex.flipY = true; this.lightTex.minFilter = this.lightTex.magFilter = THREE.LinearFilter; this.lightTex.generateMipmaps = false;
    this.uniforms = { mapSize: { value: new THREE.Vector2(1, 1) }, lightMap: { value: this.lightTex }, shadowMap: { value: this.srt.texture }, useLight: { value: 0 }, shadowK: { value: 0.55 }, shadowTint: { value: new THREE.Color(0x283a78) }, soft: { value: 1 }, sun: { value: new THREE.Vector2(SUN.x, SUN.z) }, uTime: { value: 0 } };
    game.events.on('postrender', () => this.frame());
    window.addEventListener('resize', () => this.syncCss(true));
  }
  // ------------------------------------------------------------------ materials & textures
  tex(src: any): Tex {
    let t = this.texCache.get(src);
    if (!t) {
      t = (src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(src) : new THREE.Texture(src)) as Tex;
      t.flipY = false; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true; t.__v = src.__v || 0;
      this.texCache.set(src, t);
    } else if ((src.__v || 0) !== t.__v) { t.__v = src.__v || 0; t.needsUpdate = true; }
    return t;
  }
  mat(pass: number, water = false): THREE.ShaderMaterial {
    const u = this.uniforms;
    const m = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: water ? WFRAG : FRAG, transparent: pass !== 1, depthWrite: pass === 1, depthTest: true, side: THREE.DoubleSide,
      uniforms: { map: { value: this.white }, lightMap: u.lightMap, shadowMap: u.shadowMap, mapSize: u.mapSize, useLight: u.useLight, shadowK: u.shadowK, shadowTint: u.shadowTint, soft: u.soft,
        useShadow: { value: pass === 0 || pass === 1 ? 1 : 0 }, alphaTest: { value: pass === 1 ? 0.5 : 0.004 }, uTime: u.uTime, uSky: { value: new THREE.Color(0xd8ecff) }, uNight: { value: 0 }, texSize: { value: new THREE.Vector2(512, 512) } },
    });
    return m;
  }
  smat(): THREE.ShaderMaterial { return new THREE.ShaderMaterial({ vertexShader: SVERT, fragmentShader: SFRAG, uniforms: { map: { value: this.white }, mapSize: this.uniforms.mapSize, sun: this.uniforms.sun }, depthTest: false, depthWrite: false, side: THREE.DoubleSide }); }
  batch(pass: number, i: number, tex: Tex, blend: number): Batch {
    const pool = this.pools[pass];
    let b = pool[i];
    if (!b) { b = new Batch(this.mat(pass), this.scene, pass === 1 ? this.smat() : undefined, this.sscene); pool[i] = b; }
    b.mat.uniforms.map.value = tex; if (b.smat) b.smat.uniforms.map.value = tex;
    const bl = blend === 1 ? THREE.AdditiveBlending : blend === 2 ? THREE.MultiplyBlending : THREE.NormalBlending;
    if (b.mat.blending !== bl) { b.mat.blending = bl; b.mat.needsUpdate = true; }
    if (pass === 1) { b.mat.uniforms.useShadow.value = 1; }
    if (pass === 3) b.mat.uniforms.useShadow.value = 0;
    return b;
  }
  // ------------------------------------------------------------------ lifecycle
  attach(world: any) {
    this.detach(); this.world = world; this.active = true;
    this.mapW = world.grid[0].length * 16; this.mapH = world.grid.length * 16; this.uniforms.mapSize.value.set(this.mapW, this.mapH);
    this.srt.setSize(Math.min(1024, this.mapW), Math.min(1024, this.mapH));
    this.quality = DioramaFX.quality; this.uniforms.soft.value = this.quality;
    this.lightCv.width = Math.ceil(this.mapW / 4); this.lightCv.height = Math.ceil(this.mapH / 4); this.lightTex.dispose(); this.lightTex.image = this.lightCv; this.lightTex.needsUpdate = true;
    const bg = new THREE.Color(world.def.outdoor ? (world.isNight() ? 0x070a18 : 0x1b2a1a) : 0x05040a); this.bg = bg;
    this.scene.fog = null;
    this.canvas.style.display = 'block'; this.syncCss(true);
    world.events.once('shutdown', () => this.detach());
    if (this.quality > 0 && !this.rt) {
      this.rt = new THREE.WebGLRenderTarget(this.W, this.H, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
      const mat = new THREE.ShaderMaterial({ vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: PFRAG, depthTest: false, depthWrite: false,
        uniforms: { tDiffuse: { value: this.rt.texture }, uRes: { value: new THREE.Vector2(this.W, this.H) }, uTime: { value: 0 }, uBlur: { value: 0 }, uBloom: { value: 1 }, uRays: { value: 0 }, uFogAmt: { value: 0 }, uFog: { value: new THREE.Color() }, uWarm: { value: new THREE.Color() }, uCool: { value: new THREE.Color() }, uVig: { value: 0.5 }, uFocus: { value: 0.47 }, uSat: { value: 1.2 }, uFade: { value: new THREE.Vector4() }, uFlash: { value: new THREE.Vector4() } } });
      const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)); this.post = { scene: s, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), mat };
    }
  }
  bg = new THREE.Color(0);
  detach() {
    this.active = false; this.world = undefined; this.canvas.style.display = 'none';
    for (const m of this.staticMeshes) { m.parent?.remove(m); (m as any).geometry?.dispose?.(); }
    this.staticMeshes = [];
    for (const pool of this.pools) for (const b of pool) { b.reset(); b.finish(0); }
    // drop textures of the old map (houses/ground are per map); characters re-upload on demand
    for (const [k, t] of this.texCache) { if (!(k as any).isConnected && (k as any).__keep !== true) { t.dispose(); this.texCache.delete(k); } }
  }
  cssKey = '';
  syncCss(force = false) {
    const g = this.game.canvas; const k = g.style.width + g.style.height + g.style.marginLeft + g.style.marginTop + g.offsetLeft + ',' + g.offsetTop;
    if (!force && k === this.cssKey) return; this.cssKey = k;
    Object.assign(this.canvas.style, { width: g.style.width || g.clientWidth + 'px', height: g.style.height || g.clientHeight + 'px', left: g.offsetLeft + 'px', top: g.offsetTop + 'px' });
  }
  // ------------------------------------------------------------------ static geometry (houses, blocks)
  addStatic(quads: Quad[], tex: Tex, shadow = true) {
    const b = new Batch(this.mat(1), this.scene, shadow ? this.smat() : undefined, this.sscene);
    b.mat.uniforms.map.value = tex; if (b.smat) b.smat.uniforms.map.value = tex;
    for (const q of quads) b.add(q); b.finish(10);
    this.staticMeshes.push(b.mesh); if (b.smesh) this.staticMeshes.push(b.smesh);
  }
  /** Extruded OT2 house from the round-3 painted facade: front wall, side walls, gables, two roof slopes, chimney. */
  addHouse(h: { x0: number; y0: number; x1: number; y1: number; key: string; chimney?: [number, number] }, phaserTex: Phaser.Textures.Texture) {
    const src: any = phaserTex.getSourceImage(); const tex = this.tex(src); const TW = src.width, TH = src.height; const OH = 8;
    const faceTop = TH - 80, roofBot = faceTop + 10, roofTop = 2;
    const X0 = h.x0 * 16, X1 = (h.x1 + 1) * 16, Zf = (h.y1 + 1) * 16, Zb = h.y0 * 16 + 4;
    const Hw = (TH - roofBot) / 2 * SV, D = Zf - Zb, ridgeZ = Zb + D * 0.45, ridgeY = Hw + Math.min(48, D * 0.62), ov = OH / 2;
    const U = (x: number) => x / TW, V = (y: number) => y / TH;
    const q: Quad[] = []; const C = (k: number) => [k, k, k, 1];
    const quad = (p: number[], uv: number[], k: number) => q.push({ p, uv, c: C(k), f: [p[0], p[2], p[3], p[5], p[6], p[8], p[9], p[11]] });
    // front wall (below the eave)
    quad([X0, Hw, Zf, X1, Hw, Zf, X1, 0, Zf, X0, 0, Zf], [U(OH), V(roofBot), U(TW - OH), V(roofBot), U(TW - OH), V(TH), U(OH), V(TH)], 1);
    // side walls + gable triangles: a plain panel of the facade (no door/window), stretched over the depth
    const su0 = U(OH + 4), su1 = U(OH + 30), sv0 = V(roofBot + 4), sv1 = V(TH - 16);
    for (const [X, k] of [[X0, 0.82], [X1, 0.6]] as const) {
      quad([X, Hw, Zb, X, Hw, Zf, X, 0, Zf, X, 0, Zb], [su0, sv0, su1, sv0, su1, V(TH), su0, V(TH)], k);
      quad([X, ridgeY, ridgeZ, X, ridgeY, ridgeZ, X, Hw, Zf, X, Hw, Zb], [(su0 + su1) / 2, sv0, (su0 + su1) / 2, sv0, su1, sv1, su0, sv1], k * 0.95);
    }
    // back wall (seen only through gaps / in shadows)
    quad([X0, Hw, Zb, X1, Hw, Zb, X1, 0, Zb, X0, 0, Zb], [su0, sv0, su1, sv0, su1, V(TH), su0, V(TH)], 0.5);
    // roof: painted front slope from the eave up to the ridge (with overhang), back slope reuses it darker
    const eY = Hw - 3, eZ = Zf + 4;
    quad([X0 - ov, ridgeY, ridgeZ, X1 + ov, ridgeY, ridgeZ, X1 + ov, eY, eZ, X0 - ov, eY, eZ], [0, V(roofTop), 1, V(roofTop), 1, V(roofBot), 0, V(roofBot)], 1.04);
    quad([X0 - ov, ridgeY, ridgeZ, X1 + ov, ridgeY, ridgeZ, X1 + ov, eY, Zb - 4, X0 - ov, eY, Zb - 4], [0, V(roofTop + 6), 1, V(roofTop + 6), 1, V(roofBot - 4), 0, V(roofBot - 4)], 0.62);
    // chimney: the painted chimney column as a little box on the back slope
    if (h.chimney) { const cx = X0 - ov + h.chimney[0] / 2, cw = 5, cz = ridgeZ - 4, top = ridgeY + 14, u0 = U(h.chimney[0] - 5), u1 = U(h.chimney[0] + 5);
      quad([cx - cw / 2, top, cz + 2, cx + cw / 2, top, cz + 2, cx + cw / 2, ridgeY - 6, cz + 2, cx - cw / 2, ridgeY - 6, cz + 2], [u0, V(1), u1, V(1), u1, V(roofTop + 18), u0, V(roofTop + 18)], 1);
      quad([cx + cw / 2, top, cz + 2, cx + cw / 2, top, cz - 3, cx + cw / 2, ridgeY - 6, cz - 3, cx + cw / 2, ridgeY - 6, cz + 2], [u0, V(1), u1, V(1), u1, V(roofTop + 18), u0, V(roofTop + 18)], 0.6); }
    this.addStatic(q, tex);
    return { ridgeY, ridgeZ, Hw, X0, Zf };
  }
  // ------------------------------------------------------------------ per-frame mirroring
  items: Item[] = [];
  push(pass: 0 | 1 | 2 | 3, key: number, tex: Tex, blend: number, q: Quad, water = false) { this.items.push({ pass, key, tex, blend, q, water }); }
  /** UVs of a Phaser frame (with flipX) */
  fuv(fr: any, flip: boolean, src: any) { const W = src.width, H = src.height; let u0 = fr.cutX / W, u1 = (fr.cutX + fr.cutWidth) / W; const v0 = fr.cutY / H, v1 = (fr.cutY + fr.cutHeight) / H; if (flip) [u0, u1] = [u1, u0]; return [u0, v0, u1, v0, u1, v1, u0, v1]; }
  color(o: any, a: number) { const t = o.tintTopLeft ?? 0xffffff; return [((t >> 16) & 255) / 255, ((t >> 8) & 255) / 255, (t & 255) / 255, a]; }
  collect(list: any[], ox = 0, oy = 0, sc = 1, pa = 1) {
    let idx = 0;
    for (const o of list) {
      idx++;
      if (!o.visible || o.__l3 === 'skip') continue;
      const alpha = (o.alpha ?? 1) * pa; if (alpha <= 0.003) continue;
      if (o.scrollFactorX === 0) continue;
      const type = o.type;
      if (type === 'Container') { this.collect(o.list, ox + o.x * sc, oy + o.y * sc, sc * o.scaleX, alpha); continue; }
      if (type === 'ParticleEmitter') { this.emitter(o, ox, oy, alpha); continue; }
      if (type === 'TilemapLayer') { this.tilemap(o); continue; }
      if (type === 'RenderTexture' || type === 'Graphics') continue;
      let fr = o.frame; if (!fr || !fr.source) continue;
      let src = fr.source.image; if (type === 'Text') src = o.canvas; if (type === 'Rectangle') continue;
      if (!src) continue;
      const tex = this.tex(src);
      const w = fr.cutWidth * Math.abs(o.scaleX) * sc, h = fr.cutHeight * Math.abs(o.scaleY) * sc;
      const x = ox + o.x * sc, y = oy + o.y * sc; const flip = !!o.flipX;
      const x0 = x - (flip ? 1 - o.originX : o.originX) * w, y0 = y - o.originY * h;
      const d = o.depth; const mode = o.__l3 || (d < 10 ? 'ground' : d < 5000 ? 'stand' : 'fx');
      const uv = this.fuv(fr, flip, src); const c = this.color(o, alpha); const blend = o.blendMode | 0;
      const rot = o.rotation || 0; const cs = Math.cos(rot), sn = Math.sin(rot);
      const corner = (cx: number, cy: number) => rot ? [x + (cx - x) * cs - (cy - y) * sn, y + (cx - x) * sn + (cy - y) * cs] : [cx, cy];
      const P = [corner(x0, y0), corner(x0 + w, y0), corner(x0 + w, y0 + h), corner(x0, y0 + h)];
      if (mode === 'ground') {
        const e = 0.02 + Math.max(0, d + 3) * 0.004;
        this.push(0, d, tex, blend, { p: [P[0][0], e, P[0][1], P[1][0], e, P[1][1], P[2][0], e, P[2][1], P[3][0], e, P[3][1]], uv, c, f: [P[0][0], P[0][1], P[1][0], P[1][1], P[2][0], P[2][1], P[3][0], P[3][1]] }, !!o.__water);
      } else if (mode === 'stand') {
        const foot = o.__foot ?? (y0 + h); const z = foot + (o.__dz || 0) + idx * 0.0004;
        const lift = o.__lift || 0;
        const p: number[] = []; const f: number[] = [];
        for (const [cx, cy] of P) { p.push(cx, lift + (foot - cy) * SV, z); f.push(cx, foot - 3); }
        // translucent standing sprites (ghosts, fading) go in the sorted pass; opaque pixel art is alpha-tested with depth
        this.push(alpha < 0.98 || blend === 1 ? 2 : 1, z, tex, blend, { p, uv, c, f });
      } else {
        const foot = o.__foot ?? (y + 8); this.fxQuad(x, y, foot, o.__lift || 0, w, h, rot, uv, c, tex, blend, d);
      }
    }
  }
  fxQuad(x: number, y: number, foot: number, lift: number, w: number, h: number, rot: number, uv: number[], c: number[], tex: Tex, blend: number, d: number, ref = foot) {
    const cx = x, cy = lift + (ref - y) * SV, cz = foot; const cs = Math.cos(rot), sn = Math.sin(rot);
    const pts = [[-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2, -h / 2]]; const p: number[] = []; const f: number[] = [];
    for (const [a, b] of pts) { const ax = a * cs - b * sn, by = a * sn + b * cs; p.push(cx + ax, cy + by * UP.y, cz + by * UP.z); f.push(cx, foot); }
    this.push(3, d, tex, blend, { p, uv, c, f });
  }
  emitter(e: any, ox: number, oy: number, pa: number) {
    const alive = e.alive; if (!alive?.length) return;
    const ex = ox + e.x, ey = oy + e.y; const global = e.x === 0 && e.y === 0; const blend = e.blendMode | 0; const sc = e.scaleX || 1;
    const fx = e.__foot, fl = e.__lift || 0; const groundE = e.__l3 === 'ground' || (e.depth < 10);
    for (const p of alive) {
      const fr = p.frame || e.defaultFrame; if (!fr?.source) continue; const src = fr.source.image; const tex = this.tex(src);
      const x = ex + p.x * sc, y = ey + p.y * sc; const w = fr.cutWidth * p.scaleX * sc, h = fr.cutHeight * p.scaleY * sc;
      const t = p.tint ?? 0xffffff; const c = [((t >> 16) & 255) / 255, ((t >> 8) & 255) / 255, (t & 255) / 255, (p.alpha ?? 1) * pa * (e.alpha ?? 1)];
      if (c[3] <= 0.003) continue;
      const uv = this.fuv(fr, false, src);
      if (groundE) { const e2 = 0.3; this.push(0, e.depth, tex, blend, { p: [x - w / 2, e2, y - h / 2, x + w / 2, e2, y - h / 2, x + w / 2, e2, y + h / 2, x - w / 2, e2, y + h / 2], uv, c, f: [x, y, x, y, x, y, x, y] }); continue; }
      const foot = fx ?? (global ? y + 20 : ey + 8);
      this.fxQuad(x, y, foot, fl, w, h, (p.angle || 0) * Math.PI / 180, uv, c, tex, blend, e.depth, fx !== undefined ? ey : foot);
    }
  }
  tilemap(L: any) {
    const data = L.layer.data; const ts = L.tileset[0]; if (!ts) return; const src = ts.image.getSourceImage(); const tex = this.tex(src); const d = L.depth;
    const W = src.width, H = src.height; const alpha = L.alpha ?? 1;
    for (let y = 0; y < data.length; y++) for (let x = 0; x < data[y].length; x++) {
      const t = data[y][x]; if (!t || t.index < 0) continue; const co = ts.getTileTextureCoordinates(t.index); if (!co) continue;
      const uv = [co.x / W, co.y / H, (co.x + 16) / W, co.y / H, (co.x + 16) / W, (co.y + 16) / H, co.x / W, (co.y + 16) / H];
      const X = x * 16, Y = y * 16;
      if (d < 10) { const e = 0.01 + d * 0.004; this.push(0, d, tex, 0, { p: [X, e, Y, X + 16, e, Y, X + 16, e, Y + 16, X, e, Y + 16], uv, c: [1, 1, 1, alpha], f: [X, Y, X + 16, Y, X + 16, Y + 16, X, Y + 16] }); }
      else { const foot = Y + 32; this.push(1, foot, tex, 0, { p: [X, 32 * SV, foot, X + 16, 32 * SV, foot, X + 16, 16 * SV, foot, X, 16 * SV, foot], uv, c: [1, 1, 1, alpha], f: [X, foot, X + 16, foot, X + 16, foot, X, foot] }); }
    }
  }
  // ------------------------------------------------------------------ light map (night / dungeons)
  drawLight() {
    const w = this.world; const { c, a } = w.darkness(); const u = this.uniforms;
    if (a <= 0.01) { u.useLight.value = 0; return; }
    u.useLight.value = 1;
    const cv = this.lightCv, g = cv.getContext('2d')!; const S = 0.25;
    const k = Math.min(0.86, a * 1.1), cr = (c >> 16) & 255, cg = (c >> 8) & 255, cb = c & 255;
    const amb = [Math.round(255 + (cr * 1.6 - 255) * k), Math.round(255 + (cg * 1.6 - 255) * k), Math.round(255 + (Math.min(255, cb * 2.2) - 255) * k)];
    g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgb(${amb[0]},${amb[1]},${amb[2]})`; g.fillRect(0, 0, cv.width, cv.height);
    g.globalCompositeOperation = 'lighter'; const t = w.time.now / 1000;
    const disc = (x: number, y: number, r: number, col: number, al: number) => { const gr = g.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S); const R = (col >> 16) & 255, G = (col >> 8) & 255, B = col & 255;
      gr.addColorStop(0, `rgba(${R},${G},${B},${al})`); gr.addColorStop(0.45, `rgba(${R},${G},${B},${al * 0.45})`); gr.addColorStop(1, `rgba(${R},${G},${B},0)`); g.fillStyle = gr; g.fillRect((x - r) * S, (y - r) * S, r * 2 * S, r * 2 * S); };
    for (const l of w.lightImgs) {
      const f = 1 + Math.sin(t * 7 + l.flick) * 0.05 + Math.sin(t * 13.3 + l.flick) * 0.04 + (Math.sin(t * 31 + l.flick * 3) > 0.92 ? -0.06 : 0);
      disc(l.x, l.y, l.r * 17 * f, l.img ? l.img.tintTopLeft : 0xffe0b0, Math.min(1, 0.45 + a * 0.6));
      disc(l.x, l.y, l.r * 7 * f, 0xfff0d0, 0.4);
    }
    const hr = w.def.outdoor ? 2.2 : (w.def.dark ?? 0) > 0.5 ? 4.6 : 1.8;
    disc(w.hero.spr.x, w.hero.spr.y - 4, hr * 21, w.def.outdoor ? 0x8090c0 : 0xc8b090, 0.9);
    this.lightTex.needsUpdate = true;
  }
  // ------------------------------------------------------------------ render
  /** world-px centre of the view, clamped like Phaser's camera bounds */
  viewCentre(zr: number) {
    const w = this.world; const vw = this.W / 4.6 / zr;
    let x = w.camX, y = w.camY; const mw = this.mapW, mh = this.mapH;
    x = mw <= vw ? mw / 2 : Math.min(mw - vw / 2, Math.max(vw / 2, x));
    const vh = vw * this.H / this.W * 0.62; y = mh <= vh ? mh / 2 : Math.min(mh - vh * 0.42, Math.max(vh * 0.5, y));
    return [x, y];
  }
  frame() {
    const w = this.world;
    if (!this.active || !w || !w.hero) { if (this.canvas.style.display !== 'none' && !this.active) this.canvas.style.display = 'none'; return; }
    const vis = w.scene.isActive() && w.scene.isVisible() && !w.scene.isPaused();
    if (!vis) { this.canvas.style.display = 'none'; return; }
    this.canvas.style.display = 'block'; this.syncCss();
    this.render(); 
  }
  render() {
    const w = this.world; const pc = w.cameras.main; const t = (performance.now() - this.time0) / 1000; this.uniforms.uTime.value = t;
    // camera: Phaser zoom tweens / shake / rotation carry over
    const zr = pc.zoom / 4.6; const [cx, cy] = this.viewCentre(zr);
    let sx = 0, sy = 0; const sh: any = pc.shakeEffect; if (sh?.isRunning) { sx = (sh._offsetX || 0) / pc.zoom; sy = (sh._offsetY || 0) / pc.zoom; }
    const vw = this.W / 4.6 / zr; const D = vw / (2 * Math.tan(FOV / 2 * Math.PI / 180) * (this.W / this.H));
    const tx = cx + sx, tz = cy + 20 + sy;
    this.cam.position.set(tx, D * Math.sin(ELEV), tz + D * Math.cos(ELEV)); this.cam.up.set(0, 1, 0); this.cam.lookAt(tx, 0, tz); this.cam.rotateZ(-(pc.rotation || 0));
    this.cam.near = D * 0.3; this.cam.far = D * 3 + 800; this.cam.updateProjectionMatrix();
    // mirror the display list into batches
    this.items.length = 0; this.collect(w.children.list);
    const per: Item[][] = [[], [], [], []]; for (const it of this.items) per[it.pass].push(it);
    per[0].sort((a, b) => a.key - b.key); per[2].sort((a, b) => a.key - b.key); per[3].sort((a, b) => a.key - b.key);
    let order = 0;
    const fill = (pass: number, list: Item[], group: boolean) => {
      const pool = this.pools[pass]; let bi = 0; let cur: Batch | null = null; let ct: Tex | null = null, cb = -1, cw = false;
      if (group) { const m = new Map<Tex, Item[]>(); for (const it of list) { let a = m.get(it.tex); if (!a) m.set(it.tex, a = []); a.push(it); } list = [...m.values()].flat(); }
      for (const it of list) {
        if (it.water) { if (!this.waterBatch) { const m = this.mat(0, true); this.waterBatch = new Batch(m, this.scene); } const wb = this.waterBatch; wb.mat.uniforms.map.value = it.tex; wb.mat.uniforms.texSize.value.set((it.tex.image as any).width, (it.tex.image as any).height); wb.mat.uniforms.uNight.value = w.isNight() || !w.def.outdoor ? 1 : 0; (wb.mat.uniforms.uSky.value as THREE.Color).setHex(w.isNight() ? 0x203060 : 0xd8ecff); wb.reset(); wb.add(it.q); wb.finish(order++); cur = null; ct = null; continue; }
        if (!cur || it.tex !== ct || it.blend !== cb) { if (cur) cur.finish(order++); cur = this.batch(pass, bi++, it.tex, it.blend); cur.reset(); ct = it.tex; cb = it.blend; }
        cur.add(it.q);
      }
      if (cur) cur.finish(order++);
      for (let i = bi; i < pool.length; i++) { pool[i].reset(); pool[i].finish(0); }
    };
    if (this.waterBatch) this.waterBatch.mesh.visible = false;
    fill(0, per[0], false); order = Math.max(order, 100); fill(1, per[1], true); order = Math.max(order, 1000); fill(2, per[2], false); order = Math.max(order, 2000); fill(3, per[3], false);
    // light map + shadow map
    this.drawLight();
    const r = this.renderer; r.setRenderTarget(this.srt); r.setClearColor(0x000000, 1); r.clear(); r.render(this.sscene, this.cam); 
    // main render
    const fx = w.fx?.p; const post = this.quality > 0 && this.post && fx;
    r.setRenderTarget(post ? this.rt! : null); r.setClearColor(this.bg, 1); r.clear(); r.render(this.scene, this.cam);
    if (post) {
      const u = this.post!.mat.uniforms; u.uTime.value = t; u.uBlur.value = fx.blur; u.uBloom.value = fx.bloom; u.uRays.value = fx.rays; u.uFogAmt.value = fx.fogAmt; u.uFog.value.setHex(fx.fog); u.uWarm.value.setHex(fx.warm); u.uCool.value.setHex(fx.cool); u.uVig.value = fx.vig; u.uFocus.value = fx.focus; u.uSat.value = fx.sat;
      this.camFx(u.uFade.value, u.uFlash.value);
      r.setRenderTarget(null); r.clear(); r.render(this.post!.scene, this.post!.cam);
    } else if (this.post) { /* fast mode keeps fades via a cheap overlay */ }
    if (!post) this.fastFade();
  }
  camFx(fade: THREE.Vector4, flash: THREE.Vector4) {
    const pc = this.world.cameras.main; const fe: any = pc.fadeEffect, fl: any = pc.flashEffect;
    fade.set(0, 0, 0, 0); flash.set(0, 0, 0, 0);
    if (fe && (fe.isRunning || (fe.isComplete && fe.direction))) fade.set(fe.red / 255, fe.green / 255, fe.blue / 255, fe.alpha);
    if (fl?.isRunning) flash.set(fl.red / 255, fl.green / 255, fl.blue / 255, fl.alpha);
  }
  fadeMesh?: { scene: THREE.Scene; cam: THREE.OrthographicCamera; mat: THREE.MeshBasicMaterial };
  fastFade() {
    const f = new THREE.Vector4(), fl = new THREE.Vector4(); this.camFx(f, fl); const v = fl.w > f.w ? fl : f; if (v.w <= 0.003) return;
    if (!this.fadeMesh) { const mat = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false }); const s = new THREE.Scene(); s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat)); this.fadeMesh = { scene: s, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), mat }; }
    this.fadeMesh.mat.color.setRGB(v.x, v.y, v.z); this.fadeMesh.mat.opacity = v.w; this.renderer.render(this.fadeMesh.scene, this.fadeMesh.cam);
  }
  /** Synchronously render and copy the 3D frame (for the battle shatter freeze-frame). */
  grab(): HTMLCanvasElement | null {
    if (!this.active || this.canvas.style.display === 'none') return null;
    this.render(); const c = document.createElement('canvas'); c.width = this.canvas.width; c.height = this.canvas.height; c.getContext('2d')!.drawImage(this.canvas, 0, 0); return c;
  }
}
/** Tag a Phaser object for the 3D mirror: 'ground' | 'stand' | 'fx' | 'skip', optional foot (world y) and lift (3D height). */
export function tag3(o: any, mode?: string, foot?: number, lift?: number) { if (mode) o.__l3 = mode; if (foot !== undefined) o.__foot = foot; if (lift !== undefined) o.__lift = lift; return o; }
