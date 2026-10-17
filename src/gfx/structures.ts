/**
 * HD structures (round 3): houses with tall timber/stone walls, shingled roofs with overhang, chimneys,
 * lit windows and doors; big multi-tone trees (oak / pine / autumn). Each is a depth-sorted sprite so
 * characters walk in front of / behind them, and each casts a soft shadow baked into the ground texture.
 */
import Phaser from 'phaser';
import { hash, noise, clamp, rgb, mix, mul, RGB } from './noise';
import { HD, TT } from './ground';
export const TALL_W = 40;

const HOUSE = new Set(['r', 'R', 'u', 'U', '#', 'w', 'D', 'V', 'Y', 'N', 'Q', 'G', '-']);
const OH = 8, WALLX = 16, RISE = 22 + WALLX + 12; // texels: roof overhang per side, extra wall height (bigger-than-life OT2 scale), roof rise above footprint
type Buf = { w: number; h: number; d: Uint8ClampedArray };
const buf = (w: number, h: number): Buf => ({ w, h, d: new Uint8ClampedArray(w * h * 4) });
const put = (b: Buf, x: number, y: number, c: RGB, a = 255) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= b.w || y >= b.h) return; const i = (y * b.w + x) * 4; b.d[i] = c[0]; b.d[i + 1] = c[1]; b.d[i + 2] = c[2]; b.d[i + 3] = a; };
const get = (b: Buf, x: number, y: number): RGB | null => { if (x < 0 || y < 0 || x >= b.w || y >= b.h) return null; const i = (y * b.w + x) * 4; return b.d[i + 3] ? [b.d[i], b.d[i + 1], b.d[i + 2]] : null; };
const toTex = (scene: Phaser.Scene, key: string, b: Buf) => { const t = scene.textures.createCanvas(key, b.w, b.h)!; t.getContext().putImageData(new ImageData(b.d as any, b.w, b.h), 0, 0); t.refresh(); };

export interface HouseInfo { x0: number; y0: number; x1: number; y1: number; key: string; windows: [number, number][]; chimney?: [number, number]; doors: [number, number][] }
export interface StructResult { houses: HouseInfo[]; trees: { x: number; y: number; kind: string; v: number }[] }

function findHouses(grid: string[]): { x0: number; y0: number; x1: number; y1: number }[] {
  const h = grid.length, w = grid[0].length, seen = new Set<number>(), out: any[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!HOUSE.has(grid[y][x]) || seen.has(y * w + x)) continue;
    let x0 = x, x1 = x, y0 = y, y1 = y; const q = [[x, y]]; seen.add(y * w + x);
    while (q.length) { const [cx, cy] = q.pop()!; x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(ny * w + nx) || !HOUSE.has(grid[ny][nx])) continue; seen.add(ny * w + nx); q.push([nx, ny]); } }
    if (y1 - y0 >= 2) out.push({ x0, y0, x1, y1 });
  }
  return out;
}

function paintHouse(grid: string[], hx: { x0: number; y0: number; x1: number; y1: number }, night: boolean): { b: Buf; windows: [number, number][]; chimney?: [number, number]; doors: [number, number][] } {
  const tw = hx.x1 - hx.x0 + 1, th = hx.y1 - hx.y0 + 1;
  const W = tw * TT + OH * 2, H = th * TT + RISE; const b = buf(W, H);
  const wall = grid[hx.y1].slice(hx.x0, hx.x1 + 1); const roofCh = grid[hx.y0][hx.x0];
  const stone = /[NQG]/.test(wall); const big = tw >= 9;
  const roofBase = rgb(roofCh === 'r' || roofCh === 'R' ? 0xb8463a : roofCh === 'u' || roofCh === 'U' ? 0x3c5fa8 : 0x56627a);
  const faceTop = H - TT * 2 - WALLX, faceBot = H; // wall face spans eave row + wall row + extra storey height
  const roofBot = faceTop + 10, roofTop = 2;
  const windows: [number, number][] = [], doors: [number, number][] = [];
  // ---- wall face
  const plaster = rgb(0xeadfc4), beam = rgb(0x5e3b22), stoneC = rgb(0xaaa293), stoneD = rgb(0x7e776a);
  for (let y = faceTop; y < faceBot; y++) for (let x = OH; x < W - OH; x++) {
    const lx = x - OH, ly = y - faceTop - WALLX; let c: RGB;
    if (stone) {
      const row = Math.floor(ly / 8), off = (row % 2) * 7, col = Math.floor((lx + off) / 14), vx = (lx + off) % 14, vy = ly % 8;
      c = mix(stoneD, stoneC, 0.45 + hash(col, row, 71) * 0.5 + (noise(x * 0.2, y * 0.2) - 0.5) * 0.2);
      if (vy === 0 || vx === 0) c = mul(stoneD, 0.75); else if (vy === 1) c = mix(c, rgb(0xd8d2c4), 0.4);
    } else {
      c = mix(plaster, rgb(0xd2c4a2), noise(x * 0.07, y * 0.07) * 0.6);
      const post = lx < 3 || lx >= tw * TT - 3 || (lx % (TT * 2) < 3 && lx > 4);
      if (post || (ly < 4 && ly > -WALLX + 4) || ly < -WALLX + 3 || (ly >= 30 && ly < 33)) c = mix(beam, rgb(0x7a5232), noise(x * 0.5, y * 0.1) * 0.6);
      // diagonal braces in the upper panels
      const pan = Math.floor(lx / (TT * 2)), px2 = lx - pan * TT * 2;
      if (ly > 4 && ly < 30 && pan % 2 === 1 && Math.abs(px2 - (ly - 4) * 2.2) < 2) c = beam;
    }
    if (ly > TT * 2 - 7) c = mix(rgb(0x6e675c), rgb(0x8f877a), hash(lx >> 3, 0, 72)); // stone plinth
    if (ly > TT * 2 - 7 && (lx % 8 === 0 || ly === TT * 2 - 7)) c = rgb(0x4a453e);
    c = mul(c, 1 - 0.5 * clamp(1 - (y - roofBot) / 12)); // eave shadow
    put(b, x, y, c);
  }
  // ---- windows & doors on the wall row
  for (let i = 0; i < tw; i++) {
    const ch = wall[i], cx = OH + i * TT + TT / 2;
    if (ch === 'w' || ch === 'Q' || ch === '-') {
      const ww = ch === '-' ? 14 : 16, wh = ch === '-' ? 22 : 15, wx = cx - ww / 2, wy = faceTop + WALLX * 0.6 + (ch === '-' ? 8 : 12);
      for (let y = -2; y < wh + 2; y++) for (let x = -2; x < ww + 2; x++) {
        const inside = x >= 0 && y >= 0 && x < ww && y < wh; const arch = ch === '-' && y < 7 && Math.hypot(x - ww / 2 + 0.5, y - 7) > 7.5;
        if (arch && !(Math.hypot(x - ww / 2 + 0.5, y - 7) < 9.5)) continue;
        let c: RGB;
        if (!inside || arch) c = stone ? rgb(0x5a554c) : rgb(0x4a2c16);
        else if (ch === '-') { const seg = (Math.floor(x / 4) + Math.floor(y / 5)) % 4; c = [rgb(0xe04a5a), rgb(0x4a8ae0), rgb(0xf0c040), rgb(0x50c080)][seg]; if (x % 4 === 0 || y % 5 === 0) c = rgb(0x2a2030); }
        else if (x === Math.floor(ww / 2) || y === Math.floor(wh / 2)) c = rgb(0x4a2c16);
        else { c = night ? mix(rgb(0xffc860), rgb(0xfff0c0), clamp(1 - y / wh)) : mix(rgb(0x2a4060), rgb(0x8ab8d8), clamp((x - y) / 12 + 0.3)); if (!night && (x + y) % 9 === 0) c = rgb(0xd8f0ff); }
        put(b, wx + x, wy + y, c);
      }
      windows.push([cx, wy + wh / 2]);
      if (!stone && ch === 'w') for (let x = -2; x < ww + 2; x++) { put(b, wx + x, wy + wh + 2, rgb(0x6b4220)); put(b, wx + x, wy + wh + 3, rgb(0x4a2c16)); const f = hash(x, i, 73); if (x % 2 === 0 || f < 0.4) put(b, wx + x, wy + wh + 1, f < 0.35 ? rgb(0xff6b8a) : f < 0.6 ? rgb(0xffd34e) : rgb(0x4a9a48)); if (f < 0.3) put(b, wx + x, wy + wh, rgb(0x5aa84a)); }
    }
    if (ch === 'D' || ch === 'G') {
      const dw = 20, dh = 38, dx0 = cx - dw / 2, dy0 = faceBot - dh;
      for (let y = -3; y < dh; y++) for (let x = -3; x < dw + 3; x++) {
        const ar = y < 8 ? Math.hypot(x - dw / 2 + 0.5, y - 8) : 0;
        if (ar > dw / 2 + 3) continue;
        const inside = x >= 0 && x < dw && (y >= 8 || ar <= dw / 2);
        let c: RGB = inside ? mix(rgb(0x6a3e1e), rgb(0x8a5428), noise(x * 0.8, y * 0.08)) : (stone ? rgb(0x6e675c) : rgb(0x4a2c16));
        if (inside && x % 5 === 0) c = rgb(0x4a2a14);
        if (inside && (y === 14 || y === 30) && x > 1 && x < dw - 2) c = rgb(0x3a3a44);
        if (inside && x === dw - 5 && y === 22) c = rgb(0xffd060);
        put(b, dx0 + x, dy0 + y, c);
      }
      doors.push([cx, faceBot]);
    }
  }
  // ---- roof (front slope seen in 3/4, trapezoid with overhang), ridge cap and shingles
  const inset = 10;
  for (let y = roofTop; y < roofBot; y++) {
    const t = (y - roofTop) / (roofBot - roofTop);
    const xl = Math.round(inset * (1 - t)), xr = W - 1 - Math.round(inset * (1 - t));
    for (let x = xl; x <= xr; x++) {
      const ry = y - roofTop, rowH = roofCh === 'V' || roofCh === 'Y' ? 5 : 6, row = Math.floor(ry / rowH), vy = ry % rowH, sw = roofCh === 'V' ? 7 : 9;
      const col = Math.floor((x + (row % 2) * (sw / 2)) / sw), vx = (x + (row % 2) * (sw / 2)) % sw;
      let c = mul(roofBase, 0.85 + hash(col, row, 74) * 0.25);
      c = mul(c, 1.18 - t * 0.38);                                     // lit from above
      const ex = Math.min(x - xl, xr - x); if (ex < 10) c = mul(c, 0.8 + ex * 0.02); // rounded sides
      if (vy === rowH - 1) c = mul(c, 0.55); else if (vy === 0) c = mix(c, rgb(0xfff0e0), 0.18);
      if (vx === 0 && vy < rowH - 1) c = mul(c, 0.72);
      if (noise(x * 0.12, y * 0.12) > 0.7 && roofCh !== 'u') c = mix(c, rgb(0x6a8a4a), 0.25); // moss
      if (ry < 5) c = ry < 2 ? mix(roofBase, rgb(0xffffff), 0.35) : mul(roofBase, 0.7);     // ridge cap
      if (ex < 2) c = mul(roofBase, 0.45);                              // barge board
      if (y >= roofBot - 3) c = y === roofBot - 1 ? rgb(0x2a1a18) : mul(roofBase, 0.5); // eave fascia
      put(b, x, y, c);
    }
  }
  // ---- front cross-gable (OT2 cottages): timber-framed triangle breaking the roof line, with its own barge boards + round window
  const hasChim = !stone && tw >= 5 && roofCh !== 'V';
  if (!stone && tw >= 4 && roofCh !== 'V' && roofCh !== 'Y') {
    const gw = Math.min(TT * 3, Math.floor(tw * TT * 0.5)), gcx = Math.round(OH + (hasChim ? tw * TT * 0.3 : tw * TT * 0.5)), gTop = roofTop + 2, gBot = roofBot - 1, gh = gBot - gTop, wy0 = gTop + gh * 0.55;
    for (let y = gTop; y < gBot; y++) { const t = (y - gTop) / gh, half = Math.round(gw / 2 * t) + 3;
      for (let x = -half; x <= half; x++) { const X = gcx + x; let c: RGB;
        const edge = half - Math.abs(x);
        if (edge < 4) c = edge < 1 ? rgb(0x2a1a18) : edge < 2 ? mul(roofBase, 0.55) : mul(roofBase, edge === 2 ? 1.15 : 0.95);
        else {
          c = mul(mix(plaster, rgb(0xd2c4a2), noise(X * 0.07, y * 0.07) * 0.6), 0.9 + t * 0.12);
          if (Math.abs(x) < 2 || ((y - gTop) % 14 < 2 && t > 0.3) || edge < 6) c = mix(beam, rgb(0x7a5232), noise(X * 0.5, y * 0.1) * 0.6);
          const wr = Math.hypot(x, y - wy0);
          if (wr < 6.5) { c = wr > 4.8 ? rgb(0x4a2c16) : night ? mix(rgb(0xffc860), rgb(0xfff0c0), 0.4) : mix(rgb(0x2a4060), rgb(0x8ab8d8), clamp((x - (y - wy0)) / 8 + 0.4)); if (wr <= 4.8 && (Math.abs(x) < 1 || Math.abs(y - wy0) < 1)) c = rgb(0x4a2c16); }
        }
        if (y >= gBot - 3) c = mul(c, 0.7);
        put(b, X, y, c); } }
    if (night) windows.push([gcx, wy0]);
  }
  // ---- chimney
  let chimney: [number, number] | undefined;
  if (!stone && tw >= 5 && roofCh !== 'V') {
    const cx = OH + Math.floor(tw * 0.72) * TT, cw = 10, top = 0, bot = roofTop + 20;
    for (let y = top; y < bot; y++) for (let x = 0; x < cw; x++) { let c = mix(rgb(0x8a8478), rgb(0xb8b0a0), hash((x + cx) >> 2, y >> 2, 75)); if (y % 4 === 0) c = rgb(0x5a554c); if (x === 0) c = mix(c, rgb(0xffffff), 0.2); if (x === cw - 1) c = mul(c, 0.6); if (y < 3) c = rgb(0x4a453e); put(b, cx + x, y, c); }
    chimney = [cx + cw / 2, 0];
  }
  if (big && roofCh === 'V') { // bell tower / spire on the chapel
    const cx = Math.floor(W / 2) - 7;
    for (let y = 0; y < 18; y++) for (let x = 0; x < 14; x++) { if (Math.abs(x - 6.5) > 7 - (18 - y) * 0.0) continue; put(b, cx + x, y, y < 6 ? mul(roofBase, 0.8) : mix(rgb(0xb8b0a0), rgb(0xd8d0c0), hash(x, y, 76))); }
    for (let y = 7; y < 14; y++) for (let x = 4; x < 10; x++) put(b, cx + x, y, rgb(0x2a2030));
  }
  // outline (1 texel dark) around everything for pixel-art crispness
  const o = buf(W, H); o.d.set(b.d);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!get(b, x, y) && ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([a, c]) => get(b, x + a, y + c))) put(o, x, y, rgb(0x1e1420), 230);
  return { b: o, windows, chimney, doors };
}

// ---------------------------------------------------------------- trees
const TREE_W = 72, TREE_H = 92;
const PAL: Record<string, number[]> = {
  oak: [0x163a22, 0x235a2e, 0x34803a, 0x52a446, 0x86c95a, 0xc0e88a],
  aut: [0x5a1a10, 0x8a2e18, 0xc04a1e, 0xe0782a, 0xf0a840, 0xffe08a],
  pine: [0x0e2a22, 0x174034, 0x225c40, 0x30784c, 0x4f9a5e, 0x8ad08a],
};
function paintTree(kind: string, v: number): Buf {
  const b = buf(TREE_W, TREE_H); const pal = PAL[kind].map(rgb); let s = 100 + v * 31 + kind.length * 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const cx = TREE_W / 2, base = TREE_H - 4;
  // trunk with root flare and bark
  const trunkTop = kind === 'pine' ? base - 30 : base - 36;
  for (let y = trunkTop; y < base + 2; y++) { const flare = Math.max(0, (y - (base - 6)) * 1.3); const hw = 4 + flare;
    for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const k = (x - (cx - hw)) / (2 * hw); let c = mix(rgb(0x7a5030), rgb(0x3a2214), k); if (k < 0.25) c = rgb(0x9a6a40); if ((x * 3 + Math.floor(y / 3)) % 7 === 0) c = mul(c, 0.7); put(b, x, y, c); } }
  if (kind === 'pine') {
    // stacked tiers
    const tiers = 4; for (let t = 0; t < tiers; t++) {
      const ty = 6 + t * 15, th = 26, hw0 = 9 + t * 6.5;
      for (let y = 0; y < th; y++) { const hw = hw0 * (y / th) + 3; const jag = (y % 4 === 3) ? 2 : 0;
        for (let x = Math.floor(cx - hw - jag); x <= cx + hw + jag; x++) { const nx = (x - cx) / (hw + 2); const l = -nx * 0.7 - (y / th) * 0.4 + 0.5 + (hash(x, y + ty, 81) - 0.5) * 0.35; const k = clamp(l * 0.9 + 0.2);
          const ci = Math.min(5, Math.floor(k * 5.5)); put(b, x, ty + y, y >= th - 2 ? pal[0] : pal[Math.max(1, ci)]); } }
    }
  } else {
    // clustered leaf blobs with sphere lighting
    const blobs: [number, number, number][] = [];
    const n = 9 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = r() * 14; blobs.push([cx + Math.cos(a) * d * 1.25, 32 + Math.sin(a) * d * 0.9, 11 + r() * 7]); }
    blobs.push([cx, 30, 18]);
    for (let y = 0; y < base - 22; y++) for (let x = 0; x < TREE_W; x++) {
      let best = -1, nz = 0, nxv = 0, nyv = 0;
      for (const [bx, by, br] of blobs) { const dx = (x - bx) / br, dy = (y - by) / br, d2 = dx * dx + dy * dy; if (d2 < 1) { const z = Math.sqrt(1 - d2) * br + (by > 34 ? -2 : 0) - (y - 30) * 0.08; if (z > best) { best = z; nz = Math.sqrt(1 - d2); nxv = dx; nyv = dy; } } }
      if (best < 0) continue;
      const leaf = (hash(x >> 1, y >> 1, 82) - 0.5) * 0.45 + (noise(x * 0.35, y * 0.35) - 0.5) * 0.3;
      let l = -nxv * 0.55 - nyv * 0.75 + nz * 0.45 + leaf - (y / (base - 22)) * 0.35;
      const ci = clamp(Math.floor((l + 0.75) * 3.2), 0, 5);
      let c = pal[ci];
      if (ci <= 1 && hash(x, y, 83) < 0.5) c = pal[ci + 1];
      put(b, x, y, c);
    }
    // a few fruit / blossom specks on oaks
    if (kind === 'oak' && v % 2 === 0) for (let i = 0; i < 6; i++) { const x = cx - 16 + r() * 32, y = 18 + r() * 24; if (get(b, x, y)) { put(b, x, y, rgb(0xff8a8a)); put(b, x + 1, y, rgb(0xffd0d0)); } }
  }
  // outline
  const o = buf(TREE_W, TREE_H); o.d.set(b.d);
  for (let y = 0; y < TREE_H; y++) for (let x = 0; x < TREE_W; x++) if (!get(b, x, y) && ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).some(([a, c]) => get(b, x + a, y + c))) put(o, x, y, mul(pal[0], 0.6), 255);
  return o;
}
const TREE_V = 4;
export function ensureTreeAtlas(scene: Phaser.Scene) {
  if (scene.textures.exists('hdtrees')) return;
  const kinds = ['oak', 'aut', 'pine']; const t = scene.textures.createCanvas('hdtrees', TREE_W * TREE_V, TREE_H * kinds.length)!; const ctx = t.getContext();
  kinds.forEach((k, ki) => { for (let v = 0; v < TREE_V; v++) { const b = paintTree(k, v); ctx.putImageData(new ImageData(b.d as any, b.w, b.h), v * TREE_W, ki * TREE_H); t.add(k + v, 0, v * TREE_W, ki * TREE_H, TREE_W, TREE_H); } });
  t.refresh();
}

/** Build all HD structures for a map. `ground` is the HD ground canvas (shadows are baked into it when fresh). */
export function buildStructures(scene: Phaser.Scene, id: string, grid: string[], night: boolean, groundKey: string, fresh: boolean, indoor = false): StructResult {
  ensureTreeAtlas(scene);
  const houses: HouseInfo[] = []; const trees: StructResult['trees'] = [];
  for (const hx of indoor ? [] : findHouses(grid)) {
    const key = `hdh_${id}_${hx.x0}_${hx.y0}_${night ? 'n' : 'd'}`;
    let info: Omit<HouseInfo, 'key' | 'x0' | 'y0' | 'x1' | 'y1'>;
    const cacheKey = key + '_meta'; const cached = (scene.registry.get(cacheKey) as any);
    if (!scene.textures.exists(key) || !cached) { const p = paintHouse(grid, hx, night); toTex(scene, key, p.b); info = { windows: p.windows, chimney: p.chimney, doors: p.doors }; scene.registry.set(cacheKey, info); }
    else info = cached;
    houses.push({ ...hx, key, ...info });
  }
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) {
    const ch = grid[y][x]; if (ch !== 'T' && ch !== 'P' && ch !== 'A') continue;
    trees.push({ x, y, kind: ch === 'T' ? 'oak' : ch === 'P' ? 'pine' : 'aut', v: Math.floor(hash(x, y, 90) * TREE_V) });
  }
  if (fresh) {
    // ---- bake soft shadows (light from upper-left) into the ground
    const tex = scene.textures.get(groundKey) as Phaser.Textures.CanvasTexture; const g = tex.getContext();
    const sh = document.createElement('canvas'); sh.width = tex.width; sh.height = tex.height; const s = sh.getContext('2d')!;
    s.fillStyle = 'rgba(8,14,40,1)';
    for (const t of trees) { s.beginPath(); s.ellipse(t.x * TT + TT / 2 + 10, t.y * TT + TT - 4, 26, 11, 0, 0, Math.PI * 2); s.fill(); }
    for (const hx of houses) { const x0 = hx.x0 * TT - OH, x1 = (hx.x1 + 1) * TT + OH, y0 = hx.y0 * TT - RISE, y1 = (hx.y1 + 1) * TT;
      s.beginPath(); s.moveTo(x1 - 4, y0 + 6); s.lineTo(x1 + 22, y0 + 26); s.lineTo(x1 + 22, y1 + 10); s.lineTo(x0 + 18, y1 + 10); s.lineTo(x0 + 6, y1); s.lineTo(x1 - 4, y1); s.closePath(); s.fill(); }
    g.save(); g.globalAlpha = 0.42; g.filter = 'blur(5px)'; g.drawImage(sh, 0, 0); g.restore();
    // contact AO: sharper, darker strip right at the base
    const a = document.createElement('canvas'); a.width = tex.width; a.height = tex.height; const ac = a.getContext('2d')!; ac.fillStyle = 'rgba(10,10,20,1)';
    for (const hx of houses) ac.fillRect(hx.x0 * TT - 2, (hx.y1 + 1) * TT - 2, (hx.x1 - hx.x0 + 1) * TT + 6, 6);
    for (const t of trees) { ac.beginPath(); ac.ellipse(t.x * TT + TT / 2 + 2, t.y * TT + TT - 4, 10, 4, 0, 0, Math.PI * 2); ac.fill(); }
    g.save(); g.globalAlpha = 0.45; g.filter = 'blur(2px)'; g.drawImage(a, 0, 0); g.restore();
    tex.refresh();
  }
  return { houses, trees };
}
export { OH, RISE, TREE_W, TREE_H };

/** Tall-grass overlay tufts (drawn in front of feet so heroes wade through the grass). */
export function ensureTallGrass(scene: Phaser.Scene) {
  if (scene.textures.exists('hdtall')) return;
  const W = 40, H = 32, V = 4; const t = scene.textures.createCanvas('hdtall', W * V * 2, H)!; const ctx = t.getContext();
  for (let k = 0; k < 2; k++) for (let v = 0; v < V; v++) {
    const b = buf(W, H); const pal = (k ? [0x5a3a10, 0x8a6a22, 0xb8902e, 0xe0b048, 0xf8d878] : [0x1a4a22, 0x2a6a2c, 0x3f8a36, 0x62ad48, 0xa8d870]).map(rgb);
    let s = 7 + v * 13 + k * 101; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 44; i++) {
      const x0 = 2 + r() * (W - 4), hgt = 8 + r() * 20 * (1 - Math.abs(x0 - W / 2) / W), lean = (r() - 0.5) * 6, depth = r();
      for (let y = 0; y < hgt; y++) { const f = y / hgt; const x = x0 + lean * f * f; const ci = Math.min(4, Math.floor(f * 3.2 + depth * 1.6)); put(b, x, H - 1 - y, pal[ci]); if (f < 0.4) put(b, x + 1, H - 1 - y, pal[Math.max(0, ci - 1)]); }
    }
    ctx.putImageData(new ImageData(b.d as any, W, H), (k * V + v) * W, 0); t.add((k ? 'a' : 'g') + v, 0, (k * V + v) * W, 0, W, H);
  }
  t.refresh();
}
