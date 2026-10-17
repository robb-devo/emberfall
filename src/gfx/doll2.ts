/**
 * HD paper-doll (round 3): 32x48 per frame, drawn from shaded primitives (spheres, capsules, boxes),
 * quantised to 5-tone hue-shifted ramps with ordered dithering, occlusion lines between parts and a
 * coloured sel-out outline. Same layout as the classic doll (4 dirs x 3 frames: dir*3+step), same Look and
 * equipment `vis` data, so every piece of gear is visible on the overworld, in menus and in battle.
 */
import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { Mature } from '../systems/mature';
import { SKIN, HAIR, EYES, OUTFIT, HAIR_STYLES, shade, type DollSpec } from '../systems/paperdoll';

export const FW2 = 32, FH2 = 48;
type Dir = 'F' | 'S' | 'B';
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.47);

export class Canvas {
  col: Int32Array; lit: Float32Array; ord: Int16Array; flat: Uint8Array;
  constructor(public W = FW2, public H = FH2) { const n = W * H; this.col = new Int32Array(n).fill(-1); this.lit = new Float32Array(n); this.ord = new Int16Array(n); this.flat = new Uint8Array(n); }
  o = 0;
  part() { return ++this.o; }
  set(x: number, y: number, c: number, l = 0, flat = false) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.W || y >= this.H || c < 0) return; const i = y * this.W + x; this.col[i] = c; this.lit[i] = l; this.ord[i] = this.o; this.flat[i] = flat ? 1 : 0; }
  has(x: number, y: number) { return x >= 0 && y >= 0 && x < this.W && y < this.H && this.col[y * this.W + x] >= 0; }
  /** sphere-lit ellipse; clip(x,y) can reject pixels */
  ell(cx: number, cy: number, rx: number, ry: number, c: number, clip?: (x: number, y: number) => boolean, bias = 0) {
    this.part();
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, r = nx * nx + ny * ny; if (r > 1) continue; if (clip && !clip(x, y)) continue;
      const nz = Math.sqrt(1 - r); this.set(x, y, c, -nx * 0.75 - ny * 0.65 + nz * 0.55 - 0.15 + bias);
    }
  }
  /** cylinder-lit capsule from (x0,y0) to (x1,y1) */
  cyl(x0: number, y0: number, x1: number, y1: number, r: number, c: number, bias = 0) {
    this.part(); const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
    for (let y = Math.floor(Math.min(y0, y1) - r); y <= Math.ceil(Math.max(y0, y1) + r); y++) for (let x = Math.floor(Math.min(x0, x1) - r); x <= Math.ceil(Math.max(x0, x1) + r); x++) {
      const px = x + 0.5, py = y + 0.5; const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / L2)); const qx = x0 + dx * t, qy = y0 + dy * t;
      const d = Math.hypot(px - qx, py - qy); if (d > r) continue; const n = (px - qx) / r; // signed across (x)
      this.set(x, y, c, -n * 0.9 + (1 - Math.abs(n)) * 0.25 - t * 0.25 + bias);
    }
  }
  /** box with horizontal (cylindrical) shading */
  box(x0: number, y0: number, w: number, h: number, c: number, bias = 0, round = 0) {
    this.part();
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      if (round && ((y - y0 < round && (x - x0 < round - (y - y0) || x0 + w - 1 - x < round - (y - y0))))) continue;
      const n = ((x + 0.5 - x0) / w) * 2 - 1; this.set(x, y, c, -n * 0.8 + (1 - Math.abs(n)) * 0.2 - ((y - y0) / h) * 0.3 + bias);
    }
  }
  poly(pts: [number, number][], c: number, bias = 0) {
    this.part(); let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9; for (const [x, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
    for (let y = Math.floor(minY); y <= maxY; y++) { const xs: number[] = []; const yy = y + 0.5;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy) !== (b[1] <= yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) { const n = ((x + 0.5 - minX) / Math.max(1, maxX - minX)) * 2 - 1; this.set(x, y, c, -n * 0.7 - ((y - minY) / Math.max(1, maxY - minY)) * 0.35 + 0.15 + bias); }
    }
  }
  /** final: ramp + dither + occlusion + sel-out outline -> RGBA */
  render(data: Uint8ClampedArray, stride: number, ox: number, oy: number) {
    const out = new Int32Array(this.W * this.H).fill(-1);
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const i = y * this.W + x; const c = this.col[i]; if (c < 0) continue;
      if (this.flat[i]) { out[i] = c; continue; }
      let l = this.lit[i];
      // occlusion: a neighbour drawn later (in front) shades me
      for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0]] as const) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= this.W) continue; const j = yy * this.W + xx; if (this.col[j] >= 0 && this.ord[j] > this.ord[i] && !this.flat[j]) { l -= dy ? 0.75 : 0.45; break; } }
      const q = Math.max(-2, Math.min(2, Math.round(l * 2.2 + BAYER[(y & 3) * 4 + (x & 3)] * 0.7)));
      out[i] = ramp(c, q);
    }
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      const i = y * this.W + x; let c = out[i];
      if (c < 0) {
        let nb = -1; for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]] as const) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < this.W && yy < this.H && this.col[yy * this.W + xx] >= 0) { nb = this.col[yy * this.W + xx]; break; } }
        if (nb < 0) continue; c = selout(nb);
      }
      const k = ((oy + y) * stride + ox + x) * 4; data[k] = (c >> 16) & 255; data[k + 1] = (c >> 8) & 255; data[k + 2] = c & 255; data[k + 3] = 255;
    }
  }
}
function hueShift(c: number, f: number, cool: boolean) {
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (cool) { r = r * f * 0.92; g = g * f * 0.95; b = Math.min(255, b * f * 1.08 + 12 * (1 - f)); }
  else { const t = f - 1; r += (255 - r) * t * 1.05; g += (255 - g) * t * 0.95; b += (255 - b) * t * 0.7; }
  return (Math.max(0, Math.min(255, Math.round(r))) << 16) | (Math.max(0, Math.min(255, Math.round(g))) << 8) | Math.max(0, Math.min(255, Math.round(b)));
}
const RC = new Map<number, number[]>();
export function ramp(c: number, q: number) { let r = RC.get(c); if (!r) { r = [hueShift(c, 0.52, true), hueShift(c, 0.74, true), c, hueShift(c, 1.16, false), hueShift(c, 1.36, false)]; RC.set(c, r); } return r[q + 2]; }
export const selout = (c: number) => hueShift(c, 0.3, true);

// ------------------------------------------------------------------ parts
function head(cv: Canvas, d: Dir, skin: number) {
  if (d === 'S') { cv.ell(16, 13, 7, 7.4, skin); cv.ell(12.5, 16.5, 4.5, 4, skin); cv.set(8, 15, skin, 0.4); cv.set(8, 16, skin, 0); cv.ell(18.5, 14.5, 1.6, 2, skin, undefined, -0.3); }
  else { cv.ell(16, 12.8, 7.6, 7.4, skin); cv.ell(16, 15.6, 6.2, 4.8, skin); if (d === 'F') { cv.ell(8.6, 14.5, 1.5, 2, skin, undefined, 0.2); cv.ell(23.4, 14.5, 1.5, 2, skin, undefined, -0.5); } }
}
function face(cv: Canvas, d: Dir, f: number, eye: number, skin: number, hair: number) {
  const dark = 0x1e1626, white = 0xfdfcff, irisD = shade(eye, 0.55), irisL = shade(eye, 1.35), brow = shade(hair, 0.55), blush = 0xf29a9a, mouth = 0xb0505a;
  const eyesX = d === 'S' ? [11] : [11, 18];
  for (const ex of eyesX) {
    const inner = d === 'S' ? -1 : ex < 16 ? 1 : -1;
    switch (f % 4) {
      case 0: // bright: big anime eyes
        cv.set(ex, 13, dark, 0, true); cv.set(ex + 1, 13, dark, 0, true); cv.set(ex + 2, 13, dark, 0, true);
        cv.set(ex, 14, irisD, 0, true); cv.set(ex + 1, 14, irisD, 0, true); cv.set(ex + 2, 14, d === 'S' ? irisD : white, 0, true);
        cv.set(ex, 15, eye, 0, true); cv.set(ex + 1, 15, irisL, 0, true); if (d !== 'S') cv.set(ex + 2, 15, eye, 0, true);
        if (d !== 'S') cv.set(ex + (inner > 0 ? 2 : 0), 14, white, 0, true);
        break;
      case 1: // gentle: soft half-lidded
        cv.set(ex, 14, dark, 0, true); cv.set(ex + 1, 13, dark, 0, true); cv.set(ex + 2, 14, dark, 0, true);
        cv.set(ex + 1, 14, eye, 0, true); cv.set(ex, 15, irisD, 0, true); cv.set(ex + 1, 15, irisL, 0, true); if (d !== 'S') cv.set(ex + 2, 15, irisD, 0, true);
        break;
      case 2: // sleepy
        cv.set(ex, 15, dark, 0, true); cv.set(ex + 1, 15, dark, 0, true); cv.set(ex + 2, 15, dark, 0, true); cv.set(ex + 1, 14, shade(skin, 0.8), 0, true);
        break;
      case 3: // fierce: sharp, narrowed
        cv.set(ex, 14, dark, 0, true); cv.set(ex + 1, 14, dark, 0, true); cv.set(ex + 2, 14, dark, 0, true);
        cv.set(ex + (inner > 0 ? 1 : 0), 15, eye, 0, true); cv.set(ex + (inner > 0 ? 2 : 1), 15, irisL, 0, true); cv.set(ex + (inner > 0 ? 0 : 2), 15, dark, 0, true);
        break;
    }
    // brows
    const by = f % 4 === 3 ? 12 : 11;
    for (let i = 0; i < 3; i++) cv.set(ex + i, by + (f % 4 === 3 ? (inner > 0 ? (i === 2 ? 1 : 0) : (i === 0 ? 1 : 0)) : 0), brow, 0, true);
  }
  if (d === 'F') { cv.set(16, 16, shade(skin, 0.82), 0, true); cv.set(15, 18, mouth, 0, true); cv.set(16, 18, f % 4 === 0 ? 0xd06a70 : mouth, 0, true); cv.set(10, 17, blush, 0, true); cv.set(21, 17, blush, 0, true); }
  if (d === 'S') { cv.set(9, 18, mouth, 0, true); cv.set(11, 17, blush, 0, true); }
}
type HairFn = (x: number, y: number) => boolean;
function hairMask(style: string, d: Dir): { front: HairFn; back?: HairFn } {
  const inHead = (x: number, y: number, rx = 8.7, ry = 8.4, cy = 12.2) => ((x + 0.5 - 16) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1;
  if (d === 'B') {
    const base: HairFn = (x, y) => inHead(x, y, 8.8, 8.8) && y < 20;
    const ext: Record<string, HairFn> = {
      Flowing: (x, y) => base(x, y) || (y >= 14 && y < 31 && Math.abs(x + 0.5 - 16) < 8.5 - (y - 14) * 0.12),
      Ponytail: (x, y) => base(x, y) || (y >= 15 && y < 30 && Math.abs(x + 0.5 - 16 - Math.sin(y * 0.4) * 0.8) < 2.4 - (y - 15) * 0.06),
      Bob: (x, y) => base(x, y) || (y < 21 && inHead(x, y, 9.4, 9.6, 12.4)),
      Spiky: (x, y) => base(x, y) || (y >= 1 && y < 7 && [10, 14, 18, 22].some(s => Math.abs(x + 0.5 - s) < (y - 1) * 0.55)),
      Crest: (x, y) => (Math.abs(x + 0.5 - 16) < 3 && y >= 2 && y < 19 && inHead(x, y, 8.8, 10, 11)),
    };
    return { front: ext[style] || base };
  }
  if (d === 'S') {
    const cap: HairFn = (x, y) => inHead(x, y, 8, 8.2, 12) && (y < 11 || x > 16 + (y - 11) * 0.1 || (y < 12 && x < 11)) && y < 19;
    const ext: Record<string, HairFn> = {
      Flowing: (x, y) => cap(x, y) || (x >= 15 && x < 24 && y >= 12 && y < 30 - (x - 15) * 0.3),
      Ponytail: (x, y) => cap(x, y) || (y >= 9 && y < 26 && Math.abs(x + 0.5 - (23 + (y - 9) * 0.25)) < 2.2 - (y - 9) * 0.05),
      Bob: (x, y) => cap(x, y) || (x >= 13 && y < 20 && inHead(x, y, 9, 9.3, 12.3)),
      Spiky: (x, y) => cap(x, y) || (y >= 1 && y < 7 && [12, 16, 20].some(s => Math.abs(x + 0.5 - s - (7 - y) * 0.5) < (y - 1) * 0.5)) || (x >= 21 && x < 25 && y > 6 && y < 13 && (x + y) % 3 !== 0),
      Crest: (x, y) => (y >= 2 && y < 10 && x > 11 && x < 21 && inHead(x, y, 8, 10, 11)) || (x >= 16 && y < 17 && inHead(x, y, 8, 8.2, 12) && y > 8 && x > 18),
      Tousled: (x, y) => cap(x, y) || (x >= 18 && x < 24 && y >= 10 && y < 19 && (y < 17 || x % 2 === 0)),
    };
    return { front: ext[style] || cap };
  }
  // front
  const top: HairFn = (x, y) => inHead(x, y, 8.8, 8.4, 12) && y < 12;
  const bangsY: Record<string, (x: number) => number> = {
    Tousled: x => 11 + ((x * 7) % 3 === 0 ? 3 : (x % 2 ? 1 : 2)),
    Spiky: x => 11 + ((x % 4) < 2 ? 2 : 0),
    Flowing: x => 11 + Math.min(3, Math.abs(x + 0.5 - 15) * 0.45),
    Ponytail: x => 11 + ((x * 5) % 3 === 0 ? 2 : 1),
    Bob: x => 13,
    Crest: x => 0,
  };
  const sides: Record<string, number> = { Tousled: 17, Spiky: 16, Flowing: 30, Ponytail: 16, Bob: 20, Crest: 0 };
  const by = bangsY[style] || bangsY.Tousled, sd = sides[style] ?? 17;
  if (style === 'Crest') return { front: (x, y) => Math.abs(x + 0.5 - 16) < 3 && y >= 2 && y < 10 && inHead(x, y, 8.8, 10, 11) };
  const front: HairFn = (x, y) => {
    if (top(x, y)) return true;
    if (inHead(x, y, 8.8, 8.6, 12.2) && y < by(x)) return true;
    if ((x < 9.5 || x > 21.5) && y < Math.min(sd, 20) && inHead(x, y, 9.3, 9.8, 12.6)) return true;
    if (style === 'Spiky' && y >= 1 && y < 6 && [10, 14, 18, 22].some(s => Math.abs(x + 0.5 - s) < (y - 0.5) * 0.6)) return true;
    return false;
  };
  const back: HairFn | undefined = style === 'Flowing' ? (x, y) => y >= 12 && y < 31 && Math.abs(x + 0.5 - 16) < 9.5 - (y - 12) * 0.08 : style === 'Ponytail' ? (x, y) => y >= 2 && y < 9 && Math.abs(x + 0.5 - 16) < 4 : undefined;
  return { front, back };
}
function paintHair(cv: Canvas, fn: HairFn, hair: number, d: Dir) {
  cv.part();
  for (let y = 0; y < 34; y++) for (let x = 0; x < FW2; x++) {
    if (!fn(x, y)) continue;
    const nx = (x + 0.5 - 16) / 9, ny = (y + 0.5 - 11) / 10, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let l = -nx * 0.7 - ny * 0.6 + nz * 0.5 - 0.1;
    if (((x * 2 + y * 3) % 7) === 0) l -= 0.45;                 // strands
    if (y >= 6 && y <= 7 && d !== 'B' && Math.abs(x - 14) < 4) l += 0.9; // anime sheen
    if (y >= 7 && y <= 8 && d === 'B' && Math.abs(x - 15) < 5) l += 0.7;
    cv.set(x, y, hair, l);
  }
}
export function weapon(cv: Canvas, v: { type: string; c1: number; c2?: number }, hx: number, hy: number, d: Dir) {
  const c = v.c1, h = v.c2 ?? 0x6b4220, grip = 0x5a3820;
  const S = d === 'S' ? -1 : 1; // side view: blade points forward-up to the left
  switch (v.type) {
    case 'sword': { cv.part(); for (let i = 2; i < 17; i++) { const x = hx + (d === 'S' ? -i * 0.45 : 0), y = hy - i; cv.set(x, y, c, 0.9, false); cv.set(x + 1, y, c, -0.3); } cv.set(hx + (d === 'S' ? -7.6 : 0), hy - 17, c, 1.2); cv.box(hx - 2, hy - 2, 6, 2, h, 0.2); cv.box(hx, hy, 2, 3, grip); cv.ell(hx + 1, hy + 3.5, 1.2, 1.2, h); break; }
    case 'dagger': { cv.part(); for (let i = 2; i < 9; i++) { cv.set(hx, hy - i, c, 1); cv.set(hx + 1, hy - i, c, -0.2); } cv.box(hx - 1, hy - 2, 4, 1, h); cv.box(hx, hy - 1, 2, 3, h); break; }
    case 'axe': { cv.cyl(hx + 0.5, hy - 12, hx + 0.5, hy + 4, 1, h); cv.poly([[hx - 6, hy - 14], [hx, hy - 12], [hx, hy - 7], [hx - 6, hy - 5], [hx - 4, hy - 9.5]], c, 0.3); break; }
    case 'mace': { cv.cyl(hx + 0.5, hy - 7, hx + 0.5, hy + 4, 0.9, h); cv.ell(hx + 0.5, hy - 10, 3.4, 3.4, c); for (const [a, b] of [[-4, -10], [5, -10], [0.5, -14.5]]) cv.set(hx + a, hy + b, c, 0.8); break; }
    case 'spear': { cv.cyl(hx + 0.5, hy - 22, hx + 0.5, hy + 8, 0.8, h, 0.2); cv.poly([[hx - 1.5, hy - 22], [hx + 0.5, hy - 29], [hx + 2.5, hy - 22], [hx + 0.5, hy - 20]], c, 0.4); cv.box(hx - 1, hy - 21, 3, 1, 0xf0c75e); break; }
    case 'bow': { cv.part(); for (let j = -12; j <= 10; j++) { const x = hx - 1 + Math.cos((j + 1) / 11.5) * 4 * S - 4 * S; cv.set(x, hy + j, c, 0.4); cv.set(x + S, hy + j, c, -0.4); } for (let j = -11; j <= 9; j++) cv.set(hx - 4 * S + (S < 0 ? 1 : -1), hy + j, h, 0.8, true); break; }
    case 'lute': { cv.box(hx, hy - 16, 2, 10, h); cv.box(hx - 1, hy - 18, 4, 2, shade(h, 0.8)); cv.ell(hx + 1, hy - 2, 4.5, 5, c); cv.ell(hx + 1, hy - 3, 1.3, 1.3, 0x2a1a10, undefined, -1); break; }
    case 'hammer': { cv.cyl(hx + 0.5, hy - 12, hx + 0.5, hy + 5, 0.9, h); cv.box(hx - 4, hy - 17, 9, 6, c, 0.2, 1); break; }
    default: { cv.cyl(hx + 0.5, hy - 20, hx + 0.5, hy + 8, 0.9, c, 0.1); cv.ell(hx + 0.5, hy - 22, 2.6, 2.6, h, undefined, 0.4); cv.set(hx - 0.5, hy - 23, 0xffffff, 0, true); break; }
  }
}
export function shield(cv: Canvas, v: { type: string; c1: number; c2?: number }, x: number, y: number) {
  const c = v.c1, b = v.c2 ?? shade(c, 1.3);
  if (v.type === 'kite') { cv.poly([[x - 5, y - 6], [x + 5, y - 6], [x + 5, y], [x, y + 8], [x - 5, y]], b); cv.poly([[x - 3.5, y - 4.5], [x + 3.5, y - 4.5], [x + 3.5, y - 0.5], [x, y + 5.5], [x - 3.5, y - 0.5]], c); cv.box(x - 0.5, y - 4, 1, 8, b, 0.6); cv.box(x - 3, y - 2, 6, 1, b, 0.6); }
  else { cv.ell(x, y, 5.5, 5.5, b); cv.ell(x, y, 4.2, 4.2, c); cv.ell(x - 0.5, y - 0.5, 1.6, 1.6, b, undefined, 0.6); }
}

function frame(sp: DollSpec, d: Dir, step: number, cv: Canvas) {
  const L = sp.look, E = sp.equip;
  const skin = SKIN[L.skin % SKIN.length], hair = HAIR[L.hair % HAIR.length], eye = EYES[L.eyes % EYES.length];
  const out1 = OUTFIT[L.outfit % OUTFIT.length], out2 = OUTFIT[L.outfit2 % OUTFIT.length];
  const style = HAIR_STYLES[L.hairStyle % HAIR_STYLES.length]; const sturdy = L.body === 1;
  const vis = (id?: string) => id ? (ITEMS[id] as any)?.vis : undefined;
  const armor = vis(E.armor), wpn = vis(E.weapon), shd = vis(E.shield), hd = vis(E.head), acc = vis(E.acc);
  let body = out1, trim = out2; if (armor && armor.c1 >= 0) { body = armor.c1; trim = armor.c2 ?? shade(armor.c1, 0.7); }
  let pants = shade(out2, 0.5), boot = 0x5a3a26; const leather = 0x7a4e2a;
  // round 4 underwear layer: party members (sp.voc set – never NPCs) with no body armour wear plain underwear;
  // with Settings → Adult ON they are unclothed instead (simple low-res body, no poses). Joke 'undies' armour always shows.
  const bare = !armor && !!sp.voc; const undiesItem = armor?.type === 'undies';
  // round 5: doll2 is now the CHILD sprite set only (adults use doll3) - it is never drawn unclothed.
  const nude = false && bare && Mature.on, undies = undiesItem || (bare && !nude); const fem = (L.fig || 0) === 1;
  const uw = undiesItem ? armor.c1 : 0xf2efe8, uw2 = undiesItem ? (armor.c2 ?? shade(armor.c1, 0.7)) : 0xd8d2c8;
  if (undies || nude) { body = skin; trim = skin; pants = skin; boot = shade(skin, 0.86); }
  const robe = armor?.type === 'robe' && !undies, plate = armor?.type === 'plate', jerkin = armor?.type === 'jerkin';
  const tx = sturdy ? 9 : 10, tw = sturdy ? 14 : 12; // torso
  const sw = step === 0 ? 0 : step === 1 ? 1 : -1;  // swing
  const hm = hairMask(style, d);
  const capeC = acc?.type === 'cape' ? acc.c1 : -1;

  if (d === 'S') {
    // ---- side view (facing left)
    if (capeC >= 0) cv.poly([[16, 21], [21, 21], [24 + Math.abs(sw), 41], [17, 42]], capeC, -0.3);
    if (hm.back) paintHair(cv, hm.back, hair, d);
    if (shd) shield(cv, shd, 20, 29);
    // back leg, back arm
    const st = step === 0 ? 0 : 1.5, fwd = step === 1 ? 1 : -1;
    cv.cyl(16, 35, 16 + (st ? 3 * fwd : 1), 42, 2.3, shade(pants, 0.82)); cv.box(16 + (st ? 3 * fwd : 1) - 2, 42, 5, 4, shade(boot, 0.85), 0, 1);
    cv.cyl(18, 23, 18 - sw * 2.5, 32, 1.9, shade(body, 0.8));
    // torso
    if (robe) cv.poly([[12, 21], [20, 21], [22, 43], [10, 43]], body); else cv.box(12, 21, 9, 15, body, 0, 2);
    if (!robe && !undies && !nude) { cv.box(12, 30, 9, 2, trim, 0.2); cv.set(12, 30.5, 0xf0c75e, 0.8); }
    if (plate) { cv.ell(16.5, 23, 4.5, 3.2, shade(body, 1.1)); for (let y = 25; y < 30; y += 2) cv.box(12, y, 9, 1, shade(body, 1.2), 0.3); }
    if (jerkin) { cv.box(13, 21, 2, 9, trim, 0.2); }
    // front leg
    cv.cyl(15, 35, 15 - (st ? 3 * fwd : 0), 42, 2.4, pants); cv.box(15 - (st ? 3 * fwd : 0) - 3, 42, 6, 4, boot, 0.1, 1); cv.box(15 - (st ? 3 * fwd : 0) - 3, 42, 6, 1, shade(boot, 1.3), 0.5);
    if (robe) cv.poly([[11, 34], [21, 34], [22, 43], [10, 43]], body, -0.1);
    if (undies) { cv.box(12, 32, 9, 5, uw, 0.1, 1); cv.box(12, 32, 9, 1, uw2, 0.3); if (fem) cv.box(12, 23, 8, 4, uw, 0.15, 1); if (undiesItem) { cv.set(15, 34.5, uw2, 0.4, true); cv.set(18, 33.5, uw2, 0.4, true); } }
    if (nude) { cv.set(12.5, 30, shade(skin, 0.8), 0.2, true); cv.box(12, 34, 3, 1, shade(skin, 0.9), 0.1); }
    // neck + head
    cv.box(14, 19, 4, 3, skin, -0.4);
    head(cv, d, skin); face(cv, d, L.face, eye, skin, hair);
    paintHair(cv, hm.front, hair, d);
    headgear(cv, hd, d);
    // near arm + weapon
    const hx = 14 + sw * 2.5, hy = 32;
    if (wpn) weapon(cv, wpn, hx - 1, hy, d);
    cv.cyl(15, 22.5, hx, hy - 1, 2, body); cv.ell(hx, hy, 1.8, 1.8, skin);
    if (acc?.type === 'amulet') cv.set(13, 23, acc.c1, 0.6, true);
    return;
  }
  // ---- front / back
  const F = d === 'F';
  const lhx = tx - 1.5, rhx = tx + tw + 0.5; // hand x (viewer's left / right)
  const lhy = 33 + (F ? -sw : sw), rhy = 33 + (F ? sw : -sw);
  if (capeC >= 0 && F) cv.poly([[tx - 1, 21], [tx + tw + 1, 21], [tx + tw + 3, 42], [tx - 3, 42]], shade(capeC, 0.8), -0.4);
  if (hm.back && F) paintHair(cv, hm.back, hair, d);
  if (!F) { if (wpn) weapon(cv, wpn, rhx, rhy, d); }
  if (shd && !F) shield(cv, shd, lhx - 1, 29);
  // legs
  const lift = (n: number) => (step === 0 ? 0 : (step === 1) === (n === 0) ? 2 : 0);
  const lx = [tx + 2, tx + tw - 2];
  for (let n = 0; n < 2; n++) { const up = lift(n); const x = lx[n]; cv.cyl(x, 34, x, 42 - up, 2.4, n ? shade(pants, 0.86) : pants); cv.box(x - 2.5, 41 - up, 5, 5, boot, n ? -0.2 : 0.1, 1); cv.box(x - 2.5, 41 - up, 5, 1, shade(boot, 1.3), 0.4); }
  // torso
  if (robe) cv.poly([[tx, 21], [tx + tw, 21], [tx + tw + 2, 44], [tx - 2, 44]], body); else cv.box(tx, 21, tw, 15, body, 0, 3);
  if (F && !robe && !plate && !undies && !nude) { cv.poly([[14, 21], [18, 21], [16, 25]], (armor?.type === 'tunic' || !armor) ? skin : trim, -0.2); }
  if (undies || nude) {
    // body shading: collarbone + waist, so a bare torso still reads as a figure at sprite scale
    cv.box(tx + 1, 21, tw - 2, 1, shade(skin, 0.9), 0.2); if (fem) { cv.set(tx, 30, shade(skin, 0.86), 0, true); cv.set(tx + tw - 1, 30, shade(skin, 0.86), 0, true); }
    if (undies) { cv.box(tx, 32, tw, 5, uw, 0.1, 2); cv.box(tx, 32, tw, 1, uw2, 0.3); if (F) cv.box(15, 33, 2, 2, shade(uw, 0.85), 0); if (fem) { cv.box(tx + 1, 23, tw - 2, 4, uw, 0.15, 1); if (F) cv.set(16, 25, shade(uw, 0.8), 0, true); } if (undiesItem) { for (const [a, b] of [[tx + 2, 34], [tx + tw - 3, 33], [tx + 5, 35]]) cv.set(a, b, uw2, 0.4, true); } }
    else if (F) { // Adult ON: featureless mannequin body. The chibi sprites read young, so no anatomical detail is drawn on them.
      cv.set(16, 29.5, shade(skin, 0.75), 0, true); cv.box(tx + 3, 33, tw - 6, 2, shade(skin, 0.92), 0);
    } else { cv.box(tx + 3, 33, tw - 6, 2, shade(skin, 0.9), 0); }
  } else if (!robe) { cv.box(tx, 31, tw, 2, jerkin ? leather : trim, 0.2); if (F) cv.box(15, 31, 2, 2, 0xf0c75e, 0.6); }
  else { cv.box(tx - 2, 42, tw + 4, 2, trim, 0.2); if (F) cv.box(15, 21, 2, 21, trim, 0.4); }
  if (jerkin && F) { cv.poly([[tx + 1, 21], [tx + 3, 21], [tx + tw - 1, 31], [tx + tw - 3, 31]], trim, 0.1); }
  if (plate) { for (let y = 24; y < 31; y += 3) cv.box(tx, y, tw, 1, shade(body, 1.25), 0.4); cv.ell(tx + 1, 22.5, 3.6, 2.8, shade(body, 1.1)); cv.ell(tx + tw - 1, 22.5, 3.6, 2.8, shade(body, 1.1)); }
  if (capeC >= 0 && !F) cv.poly([[tx - 1, 20], [tx + tw + 1, 20], [tx + tw + 3, 43], [tx - 3, 43]], capeC, -0.1);
  if (capeC >= 0 && F) { cv.box(tx, 21, tw, 2, capeC, 0.3); cv.ell(16, 22, 1.4, 1.4, 0xf0c75e, undefined, 0.5); }
  // arms
  const sleeve = robe ? body : plate ? shade(body, 0.95) : body;
  cv.cyl(tx + 0.5, 22.5, lhx, lhy - 1.5, 2.1, F ? sleeve : shade(sleeve, 0.9)); cv.ell(lhx, lhy, 1.9, 1.9, skin);
  cv.cyl(tx + tw - 0.5, 22.5, rhx, rhy - 1.5, 2.1, shade(sleeve, 0.85)); cv.ell(rhx, rhy, 1.9, 1.9, skin);
  if (acc?.type === 'amulet' && F) { cv.set(15, 23, 0xd8d8e0, 0.4, true); cv.set(17, 23, 0xd8d8e0, 0.4, true); cv.ell(16, 25, 1.4, 1.5, acc.c1, undefined, 0.5); }
  // neck + head
  cv.box(14, 19, 4, 3, skin, -0.5);
  head(cv, d, skin);
  if (F) face(cv, d, L.face, eye, skin, hair);
  paintHair(cv, hm.front, hair, d);
  headgear(cv, hd, d);
  if (F) { if (wpn) weapon(cv, wpn, lhx - 0.5, lhy, d); if (shd) shield(cv, shd, rhx + 1, 29); }
}
function headgear(cv: Canvas, v: any, d: Dir) {
  if (!v) return; const a = v.c1, b = v.c2 ?? shade(a, 1.3);
  switch (v.type) {
    case 'bandana': cv.box(7, 8, 18, 3, a, 0.2); if (d !== 'F') cv.poly([[d === 'S' ? 22 : 15, 9], [d === 'S' ? 27 : 17, 12], [d === 'S' ? 25 : 16, 15]], shade(a, 0.85)); break;
    case 'wizard': cv.poly([[6, 9], [26, 9], [24, 11], [8, 11]], a, 0.1); cv.poly([[10, 9], [22, 9], [19, 1], [14, -1]], a); cv.box(10, 7, 12, 2, b, 0.4); break;
    case 'helm': cv.ell(16, 10, 9.2, 7.6, a, (x, y) => y < 11 || (d === 'B' && y < 17) || (d === 'S' && x > 13 && y < 17) || (d === 'F' && (x < 10 || x > 21) && y < 17)); cv.box(d === 'S' ? 9 : 7, 10, d === 'S' ? 16 : 18, 2, shade(a, 0.8), 0.2); cv.ell(16, 2, 2, 2.6, b); break;
    case 'circlet': cv.box(8, 9, 16, 1, a, 0.6); if (d === 'F') { cv.ell(16, 9.5, 1.6, 1.6, b, undefined, 0.6); } break;
    case 'hood': cv.ell(16, 12, 9, 9.2, a, (x, y) => d === 'B' ? y < 21 : d === 'S' ? (x > 13 || y < 9) && y < 21 : (y < 9 || x < 9 || x > 22) && y < 21, -0.1); if (d === 'B') cv.poly([[13, 19], [19, 19], [16, 25]], shade(a, 0.9)); break;
    case 'cap': cv.ell(16, 8.5, 8.6, 5, a, (x, y) => y < 10); cv.box(d === 'S' ? 4 : 7, 9, d === 'S' ? 12 : 18, 2, shade(a, 0.75)); cv.poly([[20, 6], [27, -1], [24, 6]], b, 0.5); break;
  }
}

/** Build (or reuse) the HD sprite sheet. Frames dir*3+step, 32x48 each. */
export function ensureDoll2(scene: Phaser.Scene, sp: DollSpec, key: string): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, FW2 * 3, FH2 * 4)!; const ctx = tex.getContext(); const img = ctx.createImageData(FW2 * 3, FH2 * 4);
  const dirs: Dir[] = ['F', 'S', 'S', 'B'];
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) {
    const cv = new Canvas(); frame(sp, dirs[d], s, cv);
    if (d === 2) { // mirror the left-facing frame
      const tmp = new Uint8ClampedArray(FW2 * FH2 * 4); cv.render(tmp, FW2, 0, 0);
      for (let y = 0; y < FH2; y++) for (let x = 0; x < FW2; x++) { const a = (y * FW2 + x) * 4, b = (((d * FH2) + y) * FW2 * 3 + s * FW2 + (FW2 - 1 - x)) * 4; for (let k = 0; k < 4; k++) img.data[b + k] = tmp[a + k]; }
    } else cv.render(img.data, FW2 * 3, s * FW2, d * FH2);
  }
  ctx.putImageData(img, 0, 0);
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) tex.add(d * 3 + s, 0, s * FW2, d * FH2, FW2, FH2);
  tex.refresh(); return key;
}
