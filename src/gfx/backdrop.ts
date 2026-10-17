/**
 * Cinematic battle backdrops (round 3): 480x400 painted dioramas shown at 2x (960x800, wider than the
 * screen for parallax drift). Gradient skies with volumetric clouds, layered ridges with aerial perspective,
 * tree lines / stalactites / crystals, and a true perspective ground plane under the combatants.
 */
import Phaser from 'phaser';
import { hash, noise, fbm, clamp, smooth, rgb, mix, mul, RGB } from './noise';

export const BW = 480, BH = 400, HZ = 196; // horizon row
type Px = (x: number, y: number) => RGB;
interface Spec {
  skyTop: number; skyHz: number; sun?: [number, number, number]; clouds?: number; cave?: boolean;
  ridges: { base: number; amp: number; f: number; col: number; kind?: 'mount' | 'trees' | 'rocks' | 'pines' | 'spires'; seed: number }[];
  floor: (wx: number, wz: number, x: number, y: number) => RGB; fog: number; fogK?: number;
  ceiling?: { col: number; len: number; seed: number };
  glow?: { x: number; y: number; r: number; c: number }[];
  post?: (x: number, y: number, c: RGB) => RGB;
}
function paint(spec: Spec): Uint8ClampedArray {
  const d = new Uint8ClampedArray(BW * BH * 4);
  const top = rgb(spec.skyTop), hz = rgb(spec.skyHz), fog = rgb(spec.fog);
  // ridge heights per column
  const R = spec.ridges.map(r => { const hs = new Float32Array(BW); for (let x = 0; x < BW; x++) {
    let h: number;
    if (r.kind === 'trees') { const cs = 14, c0 = Math.floor(x / cs); let best = 0; for (let k = -2; k <= 2; k++) { const cc = c0 + k, cx = cc * cs + hash(cc, r.seed, 1) * cs, rad = 9 + hash(cc, r.seed, 2) * 10, hh = rad * 0.9 + hash(cc, r.seed, 3) * r.amp; const dx = (x - cx) / rad; if (Math.abs(dx) < 1) best = Math.max(best, hh + Math.sqrt(1 - dx * dx) * rad * 0.6); } h = best; }
    else if (r.kind === 'pines') { const cs = 9, c0 = Math.floor(x / cs); let best = 0; for (let k = -2; k <= 2; k++) { const cc = c0 + k, cx = cc * cs + hash(cc, r.seed, 1) * cs, hh = r.amp * (0.5 + hash(cc, r.seed, 2) * 0.7); best = Math.max(best, hh - Math.abs(x - cx) * 2.2); } h = best; }
    else if (r.kind === 'spires') { const cs = 22, c0 = Math.floor(x / cs); let best = 0; for (let k = -1; k <= 1; k++) { const cc = c0 + k, cx = cc * cs + hash(cc, r.seed, 1) * cs, hh = r.amp * (0.4 + hash(cc, r.seed, 2) * 0.8), w = 4 + hash(cc, r.seed, 4) * 6; best = Math.max(best, hh - Math.max(0, Math.abs(x - cx) - w) * 3); } h = best; }
    else h = (fbm(x * r.f + r.seed * 10, r.seed, 4) - 0.3) * r.amp + (r.kind === 'rocks' ? Math.abs(Math.sin(x * r.f * 9)) * 6 : 0);
    hs[x] = HZ - r.base - Math.max(0, h); } return hs; });
  for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
    let c: RGB;
    if (y < HZ) {
      // sky
      const t = y / HZ; c = mix(top, hz, Math.pow(t, 1.3));
      if (spec.sun) { const [sx, sy, sr] = spec.sun; const dd = Math.hypot(x - sx, (y - sy) * 1.2); c = mix(c, rgb(0xfff4d8), clamp(1 - dd / sr) ** 2 * 0.9); if (dd < sr * 0.18) c = rgb(0xfffbf0); }
      if (spec.clouds) { const n = fbm(x * 0.012, y * 0.035, 5), m = noise(x * 0.05 + 3, y * 0.09); const cl = smooth(0.52, 0.72, n + (1 - t) * 0.05 - t * 0.12);
        if (cl > 0) { const lit = clamp(0.75 - (fbm(x * 0.012, (y + 4) * 0.035, 5) - n) * 9 + m * 0.2); c = mix(c, mix(mul(rgb(spec.clouds), 0.78), rgb(0xffffff), lit), cl * 0.92); } }
      if (spec.cave) { const n = fbm(x * 0.02, y * 0.04, 4); c = mix(c, mul(hz, 0.5), n * 0.6); }
      // ridges back to front
      spec.ridges.forEach((r, i) => { const h = R[i][x]; if (y >= h) {
        const depth = (i + 1) / spec.ridges.length; const base = rgb(r.col);
        let lc = base; const yy = y - h;
        if (r.kind === 'trees' || r.kind === 'pines') { const l = (noise(x * 0.25, y * 0.25) - 0.5) * 0.5 + (yy < 3 ? 0.35 : 0) - yy * 0.012; lc = mul(base, 1 + l); }
        else { const l = (fbm(x * 0.06, y * 0.06, 3) - 0.5) * 0.6 + (yy < 2 ? 0.3 : 0); lc = mul(base, 1 + l - yy * 0.004); if ((x * 3 + y) % 23 === 0) lc = mul(lc, 1.1); }
        c = mix(lc, mix(hz, fog, 0.5), (1 - depth) * 0.55);
      } });
    } else {
      // perspective ground plane
      const dz = y - HZ + 1.5; const wz = 1400 / dz; const wx = (x - BW / 2) * wz / 300;
      c = spec.floor(wx, wz, x, y);
      const fk = spec.fogK ?? 1; c = mix(c, fog, clamp(Math.exp(-dz * 0.045 * fk) * 1.1));
    }
    if (spec.ceiling) { const cl = spec.ceiling; const L = cl.len * (0.25 + fbm(x * 0.05, cl.seed, 3) * 0.9) * (0.4 + Math.abs(Math.sin(x * 0.11 + cl.seed)) * 0.8) + 10 * noise(x * 0.3, 1);
      if (y < L) { const k = y / L; c = mix(mul(rgb(cl.col), 1.0 + (noise(x * 0.3, y * 0.1) - 0.5) * 0.6 - (Math.sin(x * 0.11 + cl.seed) > 0.2 ? 0.1 : 0)), c, k > 0.92 ? (k - 0.92) * 6 : 0); if (y > L - 2) c = mul(c, 1.25); } }
    if (spec.glow) for (const g of spec.glow) { const dd = Math.hypot(x - g.x, y - g.y); if (dd < g.r) c = mix(c, rgb(g.c), (1 - dd / g.r) ** 2 * 0.8); }
    if (spec.post) c = spec.post(x, y, c);
    const i = (y * BW + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
  }
  return d;
}
const grassFloor = (g0: number, g1: number, g2: number, pathC?: number): Spec['floor'] => (wx, wz, x, y) => {
  const n = fbm(wx * 0.4, wz * 0.4, 3), m = noise(wx * 3, wz * 3);
  let c = mix(rgb(g0), rgb(g1), clamp(n * 1.7 - 0.3)); c = mix(c, rgb(g2), clamp((m - 0.6) * 2.5) * 0.6);
  // blades: brighter streaks that get finer with distance
  if (hash(Math.floor(wx * 6), Math.floor(wz * 6), 3) < 0.18 && wz < 30) c = mul(c, 1.18);
  if (pathC !== undefined) { const pw = 1.6 + Math.sin(wz * 0.2) * 0.3, px = Math.sin(wz * 0.08) * 1.2; const dd = Math.abs(wx - px); if (dd < pw) { c = mix(c, mul(rgb(pathC), 0.9 + fbm(wx * 2, wz * 2, 2) * 0.3), smooth(pw, pw - 0.4, dd)); } }
  return c;
};
const stoneFloor = (a: number, b: number, crack: number): Spec['floor'] => (wx, wz) => {
  const n = fbm(wx * 0.5, wz * 0.5, 3); let c = mix(rgb(a), rgb(b), clamp(n * 1.6 - 0.3));
  const cx = Math.floor(wx * 0.9 + (Math.floor(wz * 0.9) % 2) * 0.5), cz = Math.floor(wz * 0.9); const fx = wx * 0.9 + (Math.floor(wz * 0.9) % 2) * 0.5 - cx, fz = wz * 0.9 - cz;
  c = mul(c, 0.9 + hash(cx, cz, 7) * 0.2); if (fx < 0.05 || fz < 0.06) c = mul(c, 0.6); else if (fz < 0.14) c = mul(c, 1.1);
  if (Math.abs(Math.sin(wx * 1.3 + Math.sin(wz * 0.7) * 2)) < 0.02) c = rgb(crack);
  return c;
};
const SPECS: Record<string, Spec> = {
  fields: { skyTop: 0x4f8fe0, skyHz: 0xd8ecf4, sun: [110, 40, 120], clouds: 0xe8eef8, fog: 0xc8e0e8,
    ridges: [{ base: 18, amp: 60, f: 0.008, col: 0x7d98c0, seed: 1 }, { base: 6, amp: 34, f: 0.014, col: 0x5f8a7a, seed: 2 }, { base: -2, amp: 14, f: 0.02, col: 0x3c6e3a, kind: 'trees', seed: 3 }],
    floor: grassFloor(0x3f7f36, 0x6aa84a, 0xa8c860, 0xc8a26a) },
  road: { skyTop: 0x5a6ab8, skyHz: 0xf8c890, sun: [380, 120, 140], clouds: 0xffd8b0, fog: 0xf0c8a0,
    ridges: [{ base: 16, amp: 50, f: 0.009, col: 0x9a7a9a, seed: 4 }, { base: 2, amp: 22, f: 0.02, col: 0xb8582a, kind: 'trees', seed: 5 }, { base: -6, amp: 26, f: 0.02, col: 0xd8782a, kind: 'trees', seed: 6 }],
    floor: grassFloor(0x8a7a2a, 0xb89a3a, 0xe0a040, 0xb8875a) },
  coast: { skyTop: 0x3a88e0, skyHz: 0xe0f4ff, sun: [360, 50, 110], clouds: 0xffffff, fog: 0xd0ecf8,
    ridges: [{ base: 0, amp: 0, f: 0.01, col: 0x2a6ab0, seed: 7 }, { base: 2, amp: 30, f: 0.03, col: 0x8a8070, kind: 'rocks', seed: 8 }],
    floor: (wx, wz) => { const n = fbm(wx * 0.5, wz * 0.5, 3); let c = mix(rgb(0xd8bc84), rgb(0xf0dcac), clamp(n * 1.5 - 0.2)); if (Math.sin(wx * 2 + fbm(wx * 0.2, wz * 0.2) * 10) > 0.9) c = mul(c, 1.08); if (wz > 22) { const sea = smooth(22, 26, wz + Math.sin(wx * 0.8) * 1.5); c = mix(c, mix(rgb(0x2f86b8), rgb(0x1a5a98), clamp((wz - 26) / 40)), sea); if (sea > 0.3 && sea < 0.7) c = mix(c, rgb(0xffffff), 0.6); } return c; },
    post: (x, y, c) => (y > HZ - 30 && y < HZ && hash(x, y, 9) < 0.03 ? mix(c, rgb(0xffffff), 0.8) : c) },
  hollow: { skyTop: 0x0a0814, skyHz: 0x2a2040, cave: true, fog: 0x1a1428, fogK: 0.7,
    ridges: [{ base: 30, amp: 70, f: 0.02, col: 0x2a2238, kind: 'spires', seed: 9 }, { base: 6, amp: 40, f: 0.03, col: 0x3a2f4e, kind: 'spires', seed: 10 }],
    ceiling: { col: 0x16101e, len: 90, seed: 3 }, floor: stoneFloor(0x2e2638, 0x4a4058, 0x1a1424),
    glow: [{ x: 80, y: 150, r: 40, c: 0x9a70ff }, { x: 400, y: 170, r: 30, c: 0x9a70ff }, { x: 250, y: 90, r: 26, c: 0xff9050 }] },
  boss: { skyTop: 0x1a0606, skyHz: 0x6a1a0a, cave: true, fog: 0x3a0e08, fogK: 0.7,
    ridges: [{ base: 26, amp: 80, f: 0.02, col: 0x2a1418, kind: 'spires', seed: 11 }, { base: 4, amp: 30, f: 0.03, col: 0x3a1c20, kind: 'rocks', seed: 12 }],
    ceiling: { col: 0x120606, len: 70, seed: 5 },
    floor: (wx, wz) => { let c = stoneFloor(0x2a1a20, 0x4a2a2a, 0x100808)(wx, wz, 0, 0); const lv = Math.abs(Math.sin(wx * 0.45 + Math.sin(wz * 0.3) * 2.5)); if (lv < 0.08) c = mix(rgb(0xffd070), rgb(0xff5a1a), lv / 0.08); else if (lv < 0.2) c = mix(c, rgb(0xff4010), (0.2 - lv) * 4); return c; },
    glow: [{ x: 240, y: 200, r: 160, c: 0xff4a10 }] },
  grotto: { skyTop: 0x04121a, skyHz: 0x0e3a44, cave: true, fog: 0x0a2a30, fogK: 0.7,
    ridges: [{ base: 24, amp: 60, f: 0.02, col: 0x10303a, kind: 'spires', seed: 13 }, { base: 2, amp: 26, f: 0.03, col: 0x1a4450, kind: 'rocks', seed: 14 }],
    ceiling: { col: 0x06161c, len: 80, seed: 7 },
    floor: (wx, wz) => { let c = stoneFloor(0x183840, 0x2a5a62, 0x0a1a20)(wx, wz, 0, 0); const p = fbm(wx * 0.18, wz * 0.18, 3); if (p > 0.6) c = mix(c, mix(rgb(0x2ad0c8), rgb(0x0e5a66), clamp((p - 0.6) * 3)), 0.85); return c; },
    glow: [{ x: 70, y: 180, r: 34, c: 0x50f0d0 }, { x: 420, y: 160, r: 40, c: 0xff80c0 }, { x: 300, y: 120, r: 24, c: 0x50f0d0 }] },
  choir: { skyTop: 0x0e0614, skyHz: 0x4a1a3a, cave: true, fog: 0x2a1028, fogK: 0.7,
    ridges: [{ base: 30, amp: 110, f: 0.02, col: 0x2a1430, kind: 'spires', seed: 15 }, { base: 8, amp: 50, f: 0.03, col: 0x3a1a3a, kind: 'spires', seed: 16 }],
    ceiling: { col: 0x0e0610, len: 60, seed: 9 }, floor: stoneFloor(0x2a1a2e, 0x4a2a48, 0x180a18),
    glow: [{ x: 240, y: 120, r: 70, c: 0xff5a9a }, { x: 60, y: 170, r: 30, c: 0xffa0d0 }, { x: 430, y: 170, r: 30, c: 0xffa0d0 }] },
};
/** Paint (once) and return the texture key for a battle backdrop id like 'bg_fields'. */
export function ensureBackdrop(scene: Phaser.Scene, bg: string): string | null {
  const id = bg.replace(/^bg_/, ''); const spec = SPECS[id]; if (!spec) return null;
  const key = 'bb_' + id; if (scene.textures.exists(key)) return key;
  const t = scene.textures.createCanvas(key, BW, BH)!; t.getContext().putImageData(new ImageData(paint(spec) as any, BW, BH), 0, 0); t.refresh();
  return key;
}
