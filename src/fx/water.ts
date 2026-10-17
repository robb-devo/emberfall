/** Animated water (round 3): ripple distortion, moving caustic highlights, sun/moon glints and sky reflection. */
import Phaser from 'phaser';
const FRAG = `
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uRes; uniform vec2 uScroll; uniform float uZoom; uniform float uTime; uniform vec3 uSky; uniform float uNight;
varying vec2 outTexCoord;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec2 uv = outTexCoord;
  vec4 base = texture2D(uMainSampler, uv);
  if (base.a < 0.01) { gl_FragColor = vec4(0.0); return; }
  vec2 sp = vec2(uv.x, 1.0 - uv.y) * uRes;           // screen px (y down)
  vec2 w = uScroll + sp / uZoom;                        // world px
  float t = uTime;
  vec2 d = vec2(sin(w.y * 0.35 + t * 1.7) + sin(w.x * 0.21 + w.y * 0.13 + t * 1.1), cos(w.x * 0.3 + t * 1.4) + sin(w.y * 0.17 - t * 0.9)) * 0.9;
  vec4 c = texture2D(uMainSampler, uv + d / uRes);
  if (c.a < 0.5) c = base;
  vec3 col = c.rgb;
  // caustic bands
  float ca = n(w * 0.18 + vec2(t * 0.35, t * 0.2)) + n(w * 0.25 - vec2(t * 0.25, -t * 0.3));
  col += smoothstep(1.25, 1.6, ca) * 0.16 * (1.0 - uNight * 0.6);
  // sky reflection, stronger toward the top of the screen
  col = mix(col, uSky, 0.12 + 0.12 * uv.y);
  // glints
  float g = n(floor(w * 0.9) + floor(t * 3.0) * 13.1);
  float glint = step(0.985, g) * (0.6 + 0.4 * sin(t * 9.0 + w.x));
  col += vec3(1.0, 0.97, 0.88) * glint * (uNight > 0.5 ? 0.5 : 0.9);
  gl_FragColor = vec4(col * base.a, base.a);
}`;
export class WaterFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  sky = 0xbfe0ff; night = 0;
  constructor(game: Phaser.Game) { super({ game, name: 'WaterFX', fragShader: FRAG }); }
  onPreRender() {
    const cam = (this as any).gameObject?.scene?.cameras?.main as Phaser.Cameras.Scene2D.Camera | undefined;
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uRes', this.renderer.width, this.renderer.height);
    if (cam) { this.set2f('uScroll', cam.worldView.x, cam.worldView.y); this.set1f('uZoom', cam.zoom); }
    this.set3f('uSky', ((this.sky >> 16) & 255) / 255, ((this.sky >> 8) & 255) / 255, (this.sky & 255) / 255); this.set1f('uNight', this.night);
  }
}
