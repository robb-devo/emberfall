/**
 * Painted HD-2D title vista (round 3): 4 parallax layers at 360x640 (shown 2x):
 * dusk sky (gradient, stars, crescent moon, under-lit clouds), far snow peaks with the floating Aurora Spire,
 * forested hills over a misty valley with village lights, and a foreground cliff for the hero.
 */
import Phaser from 'phaser';
import { fbm, noise, hash, clamp, smooth, rgb, mix, mul, cells, type RGB } from './noise';

const TW = 360, TH = 640;
type Px = (x: number, y: number) => [number, number, number, number] | null;
function layer(scene: Phaser.Scene, key: string, f: Px) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, TW, TH)!; const c = t.getContext(); const img = c.createImageData(TW, TH); const d = img.data;
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) { const p = f(x, y); if (!p) continue; const k = (y * TW + x) * 4; d[k] = p[0]; d[k + 1] = p[1]; d[k + 2] = p[2]; d[k + 3] = p[3]; }
  c.putImageData(img, 0, 0); t.refresh();
}
const SKY: [number, RGB][] = [[0, rgb(0x060824)], [0.3, rgb(0x1e1850)], [0.52, rgb(0x4a2a6e)], [0.66, rgb(0x9a4a78)], [0.76, rgb(0xe8845a)], [0.84, rgb(0xffc488)]];
function skyAt(v: number): RGB { for (let i = 1; i < SKY.length; i++) if (v <= SKY[i][0]) return mix(SKY[i - 1][1], SKY[i][1], smooth(0, 1, (v - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]))); return SKY[SKY.length - 1][1]; }
const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dq = (c: RGB, x: number, y: number, a = 255): [number, number, number, number] => { const b = (BAY[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 6; return [clamp(c[0] + b, 0, 255), clamp(c[1] + b, 0, 255), clamp(c[2] + b, 0, 255), a]; };

export const FAR_Y = (x: number) => 360 + (fbm(x * 0.012, 3.1, 4) - 0.5) * 150 - Math.max(0, 1 - Math.abs(x - 110) / 90) * 60;
export const MID_Y = (x: number) => 452 + (fbm(x * 0.02, 7.7, 3) - 0.5) * 60;
export const CLIFF_Y = (x: number) => x < 170 ? 999 : 520 - smooth(170, 250, x) * 40 + (noise(x * 0.08, 2) - 0.5) * 8;

export function ensureTitleArt(scene: Phaser.Scene) {
  // ---- sky
  layer(scene, 'tt_sky', (x, y) => {
    const v = y / 520; let c = skyAt(v);
    // moon glow
    const mx = 92, my = 128, md = Math.hypot(x - mx, y - my);
    c = mix(c, rgb(0xd8d0ff), clamp(0.35 * Math.exp(-md / 50)));
    if (md < 26) { const crescent = Math.hypot(x - mx - 10, y - my + 6) > 22; c = crescent ? mix(rgb(0xfff4dc), rgb(0xd8c8f0), clamp((x - mx + 26) / 52) * 0.6 + fbm(x * 0.2, y * 0.2) * 0.25) : mix(c, rgb(0x3a3070), 0.4); }
    // stars
    if (v < 0.6 && md > 30) { const h = hash(x, y, 9); if (h > 0.9965 - (1 - v) * 0.002) c = mix(c, rgb(0xfff8e8), (0.5 + hash(x, y, 2) * 0.5) * (1 - v / 0.6)); }
    // clouds (lit from below by the sunset)
    const cy = 300 + Math.sin(x * 0.015) * 14; const band = smooth(0, 1, 1 - Math.abs(y - cy) / 70) + smooth(0, 1, 1 - Math.abs(y - 410) / 40) * 0.8;
    const n = fbm(x * 0.012 + 3, y * 0.035, 5); const cl = smooth(0.48, 0.66, n * band + band * 0.15);
    if (cl > 0) { const under = smooth(-6, 10, fbm(x * 0.012 + 3, (y + 5) * 0.035, 5) * band - n * band + 0.05); const lit = mix(rgb(0x4a2c66), rgb(0xffb070), clamp(v * 1.2 - 0.25)); c = mix(c, mix(lit, mul(lit, 0.65), under * 0.5), cl * 0.92); }
    return dq(c, x, y);
  });
  // ---- far mountains + floating spire
  layer(scene, 'tt_far', (x, y) => {
    // spire island (floats above the peaks)
    const sx = 262, sy = 210;
    const isl = y > sy && y < sy + 60 && Math.abs(x - sx) < (1 - (y - sy) / 60) * 40 + (noise(y * 0.3, 1) - 0.5) * 6;
    const tower = y > sy - 120 && y <= sy + 2 && Math.abs(x - sx) < 3.5 + (y - (sy - 120)) / 120 * 9;
    const ring = Math.abs(y - (sy - 30)) < 2 && Math.abs(x - sx) < 16;
    if (isl || tower || ring) { const l = tower || ring ? 0.5 + (x < sx ? 0.25 : 0) : 0.35 + fbm(x * 0.2, y * 0.2) * 0.25 - (y - sy) / 160; const c = mix(rgb(0x2c2458), rgb(0x8a6ab0), l); return dq(isl && y < sy + 4 ? mix(c, rgb(0x7aa070), 0.4) : c, x, y); }
    const ry = FAR_Y(x); if (y < ry) return null;
    const depth = y - ry;
    let c = mix(rgb(0x6a5494), rgb(0x3a2f66), clamp(depth / 140));
    // light-facing faces: diagonal streaks that follow the slopes down to the right, with gullies
    const st = fbm((x + depth * 0.8) * 0.022, depth * 0.006 + 2, 4), gully = Math.abs(noise((x - depth * 0.5) * 0.09, depth * 0.02) - 0.5);
    if (st < 0.47) c = mix(c, rgb(0xe8a0b0), 0.45 * smooth(0.47, 0.38, st));
    if (gully < 0.025) c = mul(c, 0.92);
    if (depth < 10 + fbm(x * 0.08, depth * 0.1) * 26 && ry < 340) c = mix(c, st < 0.5 ? rgb(0xffe4dc) : rgb(0xb0a8e0), 0.8); // snow caps
    c = mix(c, rgb(0xe8a0a0), smooth(380, 470, y) * 0.55); // haze toward the valley
    return dq(c, x, y);
  });
  // ---- mid hills, forest, valley mist + village lights
  layer(scene, 'tt_mid', (x, y) => {
    const ry = MID_Y(x); const tree = (() => { const cx = Math.floor(x / 7) * 7 + 3.5, h = 8 + hash(Math.floor(x / 7), 3) * 10; const by = MID_Y(cx); return y > by - h + Math.abs(x - cx) * (h / 4) && y < by + 2; })();
    if (y < ry && !tree) { const mist = smooth(420, 470, y) * fbm(x * 0.02, y * 0.05) * 0.0; return mist > 0 ? dq(rgb(0xffd0c0), x, y, mist * 255) : null; }
    let c = mix(rgb(0x3a2a5a), rgb(0x1c1634), clamp((y - ry) / 120));
    if (tree) c = mix(rgb(0x30264e), rgb(0x584a7a), x % 7 < 3 ? 0.4 : 0);
    // valley mist band
    const mist = smooth(470, 520, y) * (1 - smooth(560, 620, y)) * (0.5 + fbm(x * 0.015, y * 0.04) * 0.6);
    c = mix(c, rgb(0xb88aa8), mist * 0.6);
    // village lights
    if (y > 486 && y < 560) { const h = hash(Math.floor(x / 3), Math.floor(y / 3), 6); if (h > 0.985 && x > 20 && x < 230) c = mix(rgb(0xffc870), rgb(0xffffff), hash(x, y, 1) * 0.4); }
    return dq(c, x, y);
  });
  // ---- foreground cliff + grass
  layer(scene, 'tt_fore', (x, y) => {
    const cy = CLIFF_Y(x); const gy = 610 + (fbm(x * 0.03, 9) - 0.5) * 30;
    const blade = (by: number) => { const bx = Math.floor(x / 3); const h = 4 + hash(bx, 11) * 9; return y > by - h * (1 - Math.abs((x % 3) - 1) / 2) && y < by + 1; };
    if (y >= cy - 1 || blade(cy)) {
      const top = y - cy; let c: RGB;
      if (top < 9 || y < cy) { c = mix(rgb(0x4a6a48), rgb(0x23304a), clamp(top / 9)); if (x > 330 || hash(x, y, 3) > 0.7) c = mix(c, rgb(0xffb070), 0.35 * clamp(1 - top / 6)); }
      else { const [d1, d2, h, fx] = cells(x * 1.3, y * 0.55, 20); const crack = d2 - d1 < 1.6; c = mix(rgb(0x3a3058), rgb(0x161226), clamp((y - cy) / 140)); const face = clamp((x * 1.3 - fx) / 20 + 0.5); c = mix(c, rgb(0x6a5288), (1 - face) * 0.35 * clamp(1 - (y - cy) / 120)); c = mul(c, 0.9 + h * 0.2); if (crack) c = mul(c, 0.55); if (x > 340) c = mix(c, rgb(0xff9a60), 0.2 * clamp(1 - (y - cy) / 80)); }
      return dq(c, x, y);
    }
    if (y >= gy || blade(gy)) { const c = mix(rgb(0x1e2238), rgb(0x0c0c1c), clamp((y - gy) / 30)); return dq(c, x, y); }
    return null;
  });
}
