/**
 * HD ground painter (round 3). Paints the whole map floor into one texture at 2 texels per world pixel:
 * organic, domain-warped borders between grass / dirt / sand, grass tufts, flowers, flagstones, cobbles,
 * dungeon stone, cliff faces, plus baked ambient occlusion. Water goes to its own layer (animated by WaterFX).
 * Unhandled tile types keep their classic 16px tiles on top, so every map keeps working.
 */
import { hash, noise, fbm, clamp, smooth, rgb, mix, mul, cells, RGB } from './noise';

export const HD = 2;            // texels per world pixel
export const TT = 16 * HD;      // texels per tile
export const enum Ter { NONE, GRASS, AGRASS, PATH, LEAF, SAND, COBBLE, PLAZA, DFLOOR, CAVE, WTOP, WFACE, CTOP, CFACE, CLIFF, WATER, WOOD, RUG, IWALL, COUNTER }
const NATURAL = new Set<number>([Ter.GRASS, Ter.AGRASS, Ter.PATH, Ter.LEAF, Ter.SAND, Ter.WATER, Ter.CAVE]);
export const TER: Record<string, number> = {
  '.': Ter.GRASS, ',': Ter.GRASS, '*': Ter.GRASS, '"': Ter.GRASS, 'C': Ter.GRASS,
  '5': Ter.AGRASS, '6': Ter.AGRASS, '@': Ter.AGRASS, '&': Ter.AGRASS,
  ':': Ter.PATH, '7': Ter.LEAF, '1': Ter.SAND, '2': Ter.SAND, 'Z': Ter.COBBLE, 'o': Ter.PLAZA,
  'd': Ter.DFLOOR, 'e': Ter.DFLOOR, 'l': Ter.DFLOOR, 'a': Ter.DFLOOR, ';': Ter.CAVE,
  'm': Ter.WTOP, 'M': Ter.WFACE, 'I': Ter.CTOP, 'J': Ter.CFACE, 'c': Ter.CLIFF,
  '~': Ter.WATER, '4': Ter.WATER, '0': Ter.WATER,
  '_': Ter.WOOD, 'g': Ter.RUG, '|': Ter.IWALL, 'k': Ter.COUNTER,
};
/** characters whose classic tile is fully replaced by the HD painter (ground + decal) */
export const PAINTED_DECALS = new Set(['*', '"', 'C', '@', '&', 'l', 'a']);
/** chars drawn as HD structures elsewhere: their ground comes from the neighbours */
export const STRUCT = new Set(['T', 'P', 'A', 'r', 'R', 'u', 'U', '#', 'w', 'D', 'V', 'Y', 'N', 'Q', 'G', '-']);

const C = {
  g0: rgb(0x2f6a2e), g1: rgb(0x47903c), g2: rgb(0x68b04a), g3: rgb(0x9cc95c), gHi: rgb(0xc4e67a), gDk: rgb(0x23502a),
  a0: rgb(0x6a5a22), a1: rgb(0x94822f), a2: rgb(0xb79a3e), a3: rgb(0xd6a844), aR: rgb(0xc8582a), aO: rgb(0xe8902e),
  p0: rgb(0x9a7446), p1: rgb(0xbf9762), p2: rgb(0xd8b47e), peb: rgb(0x8f877c),
  s0: rgb(0xcdb27a), s1: rgb(0xe6cf98), s2: rgb(0xf4e4b6), wet: rgb(0xa8915e),
  cb0: rgb(0x6e6a66), cb1: rgb(0x9a958c), cb2: rgb(0xb9b3a6), grout: rgb(0x4a4642),
  pl0: rgb(0xa49c8c), pl1: rgb(0xc4bcaa), plG: rgb(0x77705f),
  d0: rgb(0x3a3048), d1: rgb(0x52466a), dG: rgb(0x221a2e),
  cv0: rgb(0x1e3a42), cv1: rgb(0x2f5a62), cvG: rgb(0x10242a),
  wt0: rgb(0x1a1424), wt1: rgb(0x3a2f4e), wt2: rgb(0x5a4c72),
  ct0: rgb(0x0e1c24), ct1: rgb(0x1f3a48), ct2: rgb(0x3a6a7a),
  cl0: rgb(0x5a4030), cl1: rgb(0x8a6a4a), cl2: rgb(0xb08a5e),
  mud: rgb(0x4a5a3a), lava: rgb(0xff7a2a), lavaHi: rgb(0xffd070),
};
const FLOW = [0xff6b8a, 0xffd34e, 0xffffff, 0x9ad0ff, 0xc28cff, 0xff9a4a].map(rgb);
const AFLOW = [0xffd34e, 0xff8a3a, 0xffffff, 0xe85a4a].map(rgb);

export interface GroundResult { fresh?: boolean; key: string; waterKey?: string; blank: boolean[][]; ter: number[][]; w: number; h: number }

/** most common neighbouring ground for structure/prop cells */
function deriveGround(grid: string[], x: number, y: number, ch: string): number {
  const cnt = new Map<number, number>();
  for (let r = 1; r <= 3; r++) {
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const t = TER[grid[y + dy]?.[x + dx] ?? ''];
      if (!t || t === Ter.WATER || t === Ter.WTOP || t === Ter.WFACE || t === Ter.CTOP || t === Ter.CFACE || t === Ter.CLIFF) continue;
      cnt.set(t, (cnt.get(t) || 0) + (dy > 0 ? 3 : 2) / r);
    }
    if (cnt.size) break;
  }
  let best = ch === 'A' ? Ter.AGRASS : Ter.GRASS, bw = 0; cnt.forEach((w, t) => { if (w > bw) { bw = w; best = t; } });
  return best;
}

export function paintGround(scene: Phaser.Scene, id: string, grid: string[], propChars: Set<string>, outdoor = false): GroundResult {
  // outdoor maps use the cave-rock chars as weathered coastal cliffs
  C.ct0 = rgb(outdoor ? 0x3a3834 : 0x0e1c24); C.ct1 = rgb(outdoor ? 0x6e675a : 0x1f3a48); C.ct2 = rgb(outdoor ? 0xa89e88 : 0x3a6a7a);
  const h = grid.length, w = grid[0].length, W = w * TT, H = h * TT;
  const ter: number[][] = []; const blank: boolean[][] = [];
  for (let y = 0; y < h; y++) { ter.push([]); blank.push([]); for (let x = 0; x < w; x++) {
    const ch = grid[y][x]; let t = TER[ch] || 0;
    if (!outdoor && 'NQG-'.includes(ch)) t = Ter.IWALL;
    if (!outdoor && ch === '!') t = Ter.PLAZA;
    if (!outdoor && (ch === '?' || ch === '+')) t = Ter.COUNTER;
    if (!outdoor && ch === 'D' && (grid[y - 1]?.[x] === '_' || grid[y - 1]?.[x] === 'g')) t = Ter.WOOD;
    // props standing in the back-wall row (shelves, hearths, cupboards) sit on wall, not floor
    const wl = (c?: string) => c === '|' || (!!c && propChars.has(c) && grid[y - 1]?.[x] === '|');
    if (!t && propChars.has(ch) && grid[y - 1]?.[x] === '|' && wl(grid[y][x - 1]) && wl(grid[y][x + 1])) t = Ter.IWALL;
    if (!t && (STRUCT.has(ch) || propChars.has(ch))) t = deriveGround(grid, x, y, ch);
    ter[y].push(t);
    blank[y].push(!!t && (!!TER[ch] || STRUCT.has(ch) || propChars.has(ch) || (!outdoor && 'NQG-!D?+'.includes(ch))));
  } }
  const key = 'hdg_' + id, waterKey = 'hdw_' + id;
  const res: GroundResult = { key, blank, ter, w, h };
  let anyWater = false; for (const r of ter) if (r.includes(Ter.WATER)) anyWater = true;
  if (anyWater) res.waterKey = waterKey;
  if (scene.textures.exists(key)) return res;

  const T = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h) ? Ter.NONE : ter[y][x];
  // rug components -> bounding boxes in texels (for ornate borders)
  const rugBox = new Map<number, [number, number, number, number]>();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (ter[y][x] !== Ter.RUG || rugBox.has(y * w + x)) continue;
    const q = [[x, y]], cells2: number[] = []; let x0 = x, x1 = x, y0 = y, y1 = y; rugBox.set(y * w + x, [0, 0, 0, 0]);
    while (q.length) { const [cx, cy] = q.pop()!; cells2.push(cy * w + cx); x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= w || ny >= h || ter[ny][nx] !== Ter.RUG || rugBox.has(ny * w + nx)) continue; rugBox.set(ny * w + nx, [0, 0, 0, 0]); q.push([nx, ny]); } }
    const bx: [number, number, number, number] = [x0 * TT + 3, y0 * TT + 3, (x1 + 1) * TT - 3, (y1 + 1) * TT - 3]; for (const c of cells2) rugBox.set(c, bx); }
  const wallish = (x: number, y: number) => { const q = T(x, y); return q === Ter.IWALL || q === Ter.NONE; };
  const floorish = (q: number) => q === Ter.WOOD || q === Ter.RUG || q === Ter.COUNTER || q === Ter.PLAZA;
  const CH = (x: number, y: number) => grid[Math.max(0, Math.min(h - 1, y))][Math.max(0, Math.min(w - 1, x))];
  const out = new Uint8ClampedArray(W * H * 4);
  const wat = anyWater ? new Uint8ClampedArray(W * H * 4) : null;
  // terrain lookup with organic warp
  const look = (X: number, Y: number, wx: number, wy: number) => {
    const gx = Math.floor(X / TT), gy = Math.floor(Y / TT); const t0 = T(gx, gy);
    if (!NATURAL.has(t0)) return t0;
    const t1 = T(Math.floor((X + wx) / TT), Math.floor((Y + wy) / TT));
    return NATURAL.has(t1) ? t1 : t0;
  };
  const isFace = (t: number) => t === Ter.WFACE || t === Ter.CFACE;
  const isTop = (t: number) => t === Ter.WTOP || t === Ter.CTOP;
  for (let Y = 0; Y < H; Y++) {
    const gy = Math.floor(Y / TT), ly = Y - gy * TT;
    for (let X = 0; X < W; X++) {
      const gx = Math.floor(X / TT), lx = X - gx * TT;
      const wx = (noise(X * 0.045, Y * 0.045) - 0.5) * 16 + (noise(X * 0.17 + 40, Y * 0.17) - 0.5) * 5;
      const wy = (noise(X * 0.045 + 90, Y * 0.045 + 30) - 0.5) * 16 + (noise(X * 0.17, Y * 0.17 + 70) - 0.5) * 5;
      const t = look(X, Y, wx, wy);
      const ch = CH(gx, gy);
      let c: RGB;
      // edge info (same warp, offset by 3 texels)
      const tn = look(X, Y - 3, wx, wy), ts = look(X, Y + 3, wx, wy), tw = look(X - 3, Y, wx, wy), te = look(X + 3, Y, wx, wy);
      const edge = tn !== t || ts !== t || tw !== t || te !== t;
      switch (t) {
        case Ter.GRASS: case Ter.AGRASS: {
          const aut = t === Ter.AGRASS;
          const n = fbm(X * 0.012, Y * 0.012, 3), m = noise(X * 0.09, Y * 0.09);
          const k = clamp(n * 1.6 - 0.3 + (m - 0.5) * 0.35);
          c = aut ? (k < 0.33 ? mix(C.a0, C.a1, k * 3) : k < 0.7 ? mix(C.a1, C.a2, (k - 0.33) / 0.37) : mix(C.a2, C.a3, (k - 0.7) / 0.3))
            : (k < 0.33 ? mix(C.g0, C.g1, k * 3) : k < 0.7 ? mix(C.g1, C.g2, (k - 0.33) / 0.37) : mix(C.g2, C.g3, (k - 0.7) / 0.3));
          if (aut) { const o = noise(X * 0.03 + 7, Y * 0.03); if (o > 0.62) c = mix(c, hash(X >> 2, Y >> 2, 9) < 0.5 ? C.aR : C.aO, (o - 0.62) * 1.6); }
          const chw = CH(Math.floor((X + wx * 0.7) / TT), Math.floor((Y + wy * 0.7) / TT));
          const tall = chw === '"' || chw === '&';
          // tufts: small 3-blade sprigs on a jittered grid
          const cs = tall ? 3 : 6, cx = Math.floor(X / cs), cy = Math.floor(Y / cs), hh = hash(cx, cy, 1);
          if (hh < (tall ? 0.95 : 0.3)) {
            const ox = cx * cs + Math.floor(hash(cx, cy, 2) * (cs - 2)) + 1, oy = cy * cs + cs - 1, dx = X - ox, dy = oy - Y, bh = tall ? 5 + Math.floor(hash(cx, cy, 6) * 3) : 3;
            if ((dx === 0 && dy >= 0 && dy < bh) || (Math.abs(dx) === 1 && dy >= 0 && dy < bh - 2 && ((dy + (dx > 0 ? 1 : 0)) % 2 === 0 || dy < 1))) {
              const top = dy >= bh - (dx === 0 ? 2 : 1);
              c = top ? mix(c, aut ? C.a3 : C.gHi, tall ? 0.6 : 0.42) : dy === 0 ? mul(c, 0.78) : mix(c, aut ? C.a3 : C.g3, 0.35);
            } else if (dy === -1 && Math.abs(dx) <= 1) c = mul(c, 0.85);
          }
          if (tall) c = mix(mul(c, 0.62), C.g0, 0.3);
          if (hash(X, Y, 7) < 0.02) c = mul(c, 0.8);
          // flowers
          if (chw === '*' || chw === '@') {
            const fx = Math.floor(X / 5), fy = Math.floor(Y / 5);
            if (hash(fx, fy, 11) < 0.32) { const ox = fx * 5 + 1 + Math.floor(hash(fx, fy, 12) * 2), oy = fy * 5 + 1 + Math.floor(hash(fx, fy, 13) * 2); const dx = X - ox, dy = Y - oy;
              const pal = chw === '@' ? AFLOW : FLOW; const fc = pal[Math.floor(hash(fx, fy, 14) * pal.length)];
              if ((Math.abs(dx) + Math.abs(dy) === 1)) c = fc; else if (dx === 0 && dy === 0) c = rgb(0xffe890); else if (dx === 0 && dy === 2) c = C.gDk; }
          }
          if (tn === Ter.WATER || ts === Ter.WATER || tw === Ter.WATER || te === Ter.WATER) c = mix(mul(c, 0.7), C.mud, 0.35);
          // grass lip where it meets dirt/sand/stone: lighter rim, then darker underside
          if (edge && (tn !== t && tn !== Ter.GRASS && tn !== Ter.AGRASS)) c = mix(c, aut ? C.a3 : C.g3, 0.5);
          break;
        }
        case Ter.PATH: case Ter.LEAF: {
          const n = fbm(X * 0.03, Y * 0.03, 3), m = noise(X * 0.25, Y * 0.25);
          c = mix(mix(C.p0, C.p1, clamp(n * 1.8 - 0.3)), C.p2, clamp((m - 0.55) * 2) * 0.6);
          const pc = Math.floor(X / 7), pr = Math.floor(Y / 7);
          if (hash(pc, pr, 21) < 0.28) { const ox = pc * 7 + 1 + hash(pc, pr, 22) * 4, oy = pr * 7 + 1 + hash(pc, pr, 23) * 4, r = 1 + hash(pc, pr, 24) * 1.4; const dx = X - ox, dy = Y - oy, d = Math.hypot(dx, dy * 1.3);
            if (d < r) c = mix(C.peb, rgb(0xd8d0c0), clamp(-(dx + dy) / (r * 2) + 0.35)); else if (d < r + 1 && dx + dy > 0) c = mul(c, 0.78); }
          if (t === Ter.LEAF) { const lc = Math.floor(X / 4), lr = Math.floor(Y / 4); if (hash(lc, lr, 31) < 0.5) { const dx = X - (lc * 4 + 1), dy = Y - (lr * 4 + 1); if (dx >= 0 && dx < 3 && dy >= 0 && dy < 2) c = [C.aR, C.aO, C.a3, rgb(0x9a3a1a)][Math.floor(hash(lc, lr, 32) * 4)]; } }
          if (edge) c = mul(c, 0.84);
          break;
        }
        case Ter.SAND: {
          const n = fbm(X * 0.02, Y * 0.02, 3);
          c = mix(C.s0, C.s1, clamp(n * 1.6 - 0.2));
          const rip = Math.sin(X * 0.16 + Y * 0.07 + fbm(X * 0.01, Y * 0.01, 2) * 9);
          if (rip > 0.82) c = mix(c, C.s2, 0.5); else if (rip < -0.86) c = mul(c, 0.92);
          if (hash(X, Y, 41) < 0.03) c = mix(c, hash(X, Y, 42) < 0.5 ? C.s2 : C.s0, 0.8);
          const sc = Math.floor(X / 11), sr = Math.floor(Y / 11);
          if (hash(sc, sr, 43) < 0.08) { const dx = X - (sc * 11 + 4), dy = Y - (sr * 11 + 5); if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && Math.abs(dx) + Math.abs(dy) < 2) c = dy < 0 ? rgb(0xfff0e0) : rgb(0xe8b0a0); }
          // wet sand near the sea
          let wd = 99; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (T(gx + i, gy + j) === Ter.WATER) { const ddx = i < 0 ? lx : i > 0 ? TT - lx : 0, ddy = j < 0 ? ly : j > 0 ? TT - ly : 0; wd = Math.min(wd, i && j ? Math.hypot(ddx, ddy) : i ? ddx : j ? ddy : 0); }
          if (wd < 26) c = mix(c, C.wet, smooth(26, 4, wd + (noise(X * 0.1, Y * 0.1) - 0.5) * 10) * 0.6);
          if (edge && (tn === Ter.GRASS || tw === Ter.GRASS || te === Ter.GRASS)) c = mul(c, 0.88);
          break;
        }
        case Ter.COBBLE: case Ter.PLAZA: case Ter.DFLOOR: case Ter.CAVE: {
          const pl = t === Ter.PLAZA, dg = t === Ter.DFLOOR, cv = t === Ter.CAVE;
          const s = pl ? 12 : dg ? 15 : cv ? 13 : 7.5;
          const [d1, d2, hc, fx, fy] = cells(X, Y, s, pl || dg ? 0.55 : 0.9);
          const g = d2 - d1;
          const b0 = pl ? C.pl0 : dg ? C.d0 : cv ? C.cv0 : C.cb0, b1 = pl ? C.pl1 : dg ? C.d1 : cv ? C.cv1 : C.cb2, gr = pl ? C.plG : dg ? C.dG : cv ? C.cvG : C.grout;
          c = mix(b0, b1, 0.35 + hc * 0.5 + (noise(X * 0.2, Y * 0.2) - 0.5) * 0.25);
          if (!pl && !dg && !cv) c = mix(c, C.cb1, 0.3);
          // bevel: lit from top-left
          const bev = ((X - fx) * -0.6 + (Y - fy) * -0.8) / s;
          c = mul(c, 1 + bev * 0.22);
          if (g < 1.6) c = mix(gr, c, g / 1.6 * 0.5);
          else if (g < 2.6 && (X - fx) + (Y - fy) > 0) c = mul(c, 0.85);
          if (dg && hash(Math.floor(X / 3), Math.floor(Y / 3), 51) < 0.015) c = mul(c, 0.7);
          if (cv) { const pud = noise(X * 0.035 + 3, Y * 0.035); if (pud > 0.66) c = mix(c, rgb(0x5fa8b0), (pud - 0.66) * 2.2); }
          if (!pl && !dg && !cv && hash(hc * 999 | 0, 1, 52) < 0.12) c = mix(c, rgb(0x6a8a5a), 0.25); // mossy stone
          // AO under walls
          if ((dg || cv) && isFace(T(gx, gy - 1))) c = mul(c, 0.55 + 0.45 * smooth(0, 14, ly));
          if ((dg || cv) && (isFace(T(gx - 1, gy)) || isTop(T(gx - 1, gy)))) c = mul(c, 0.7 + 0.3 * smooth(0, 8, lx));
          if ((dg || cv) && (isFace(T(gx + 1, gy)) || isTop(T(gx + 1, gy)))) c = mul(c, 0.7 + 0.3 * smooth(0, 8, TT - lx));
          if (ch === 'l') { const yy = TT / 2 + Math.sin(X * 0.28) * 5 + Math.sin(X * 0.7) * 2; const dd = Math.abs(Y - gy * TT - yy); if (dd < 1.4) c = C.lavaHi; else if (dd < 3) c = C.lava; else if (dd < 6) c = mix(c, C.lava, (6 - dd) / 6 * 0.45); }
          if (ch === 'a') { const dx = lx - 16, dy = ly - 18, d = Math.hypot(dx / 12, dy / 10); if (d < 1) { const l = clamp(0.55 - dx / 30 - dy / 22 + (noise(X * 0.3, Y * 0.3) - 0.5) * 0.3); c = mix(rgb(0x3a3048), rgb(0x9a90b0), l); } else if (d < 1.35 && dy > 0) c = mul(c, 0.6); }
          break;
        }
        case Ter.WTOP: case Ter.CTOP: {
          const cvt = t === Ter.CTOP; const n = fbm(X * 0.05, Y * 0.05, 3);
          const [d1, d2] = cells(X, Y, 10, 0.9); const bump = clamp(1 - d1 / 8);
          c = mix(cvt ? C.ct0 : C.wt0, cvt ? C.ct1 : C.wt1, clamp(n * 0.9 + bump * 0.4));
          if (d2 - d1 < 1.2) c = mul(c, 0.7);
          // lit rim toward open floor
          const below = T(gx, gy + 1), open = (q: number) => q !== Ter.WTOP && q !== Ter.CTOP && q !== Ter.NONE;
          if (open(below) && !isFace(below) && ly > TT - 5) c = mix(c, cvt ? C.ct2 : C.wt2, 0.7);
          if (isFace(below) && ly > TT - 3) c = mix(c, cvt ? C.ct2 : C.wt2, 0.8);
          if (open(T(gx - 1, gy)) && lx < 3) c = mix(c, cvt ? C.ct2 : C.wt2, 0.5);
          if (open(T(gx + 1, gy)) && lx > TT - 3) c = mul(c, 0.6);
          if (open(T(gx, gy - 1)) && ly < 3) c = mix(c, cvt ? C.ct2 : C.wt2, 0.4);
          break;
        }
        case Ter.WFACE: case Ter.CFACE: case Ter.CLIFF: {
          const cl = t === Ter.CLIFF, cvf = t === Ter.CFACE;
          const rowH = cl ? 7 : 10, row = Math.floor(Y / rowH), vy = Y - row * rowH, off = hash(row, 3, 61) * 20;
          const bw = cl ? 30 : 16, col = Math.floor((X + off) / bw), vx = X + off - col * bw;
          const hb = hash(col, row, 62);
          const b0 = cl ? C.cl0 : cvf ? C.ct1 : C.wt1, b1 = cl ? C.cl1 : cvf ? C.ct2 : C.wt2;
          c = mix(b0, b1, 0.3 + hb * 0.5 + (noise(X * 0.15, Y * 0.15) - 0.5) * 0.3);
          if (vy === 0) c = mix(c, cl ? C.cl2 : b1, 0.6); else if (vy === rowH - 1 || (!cl && vx === 0)) c = mul(c, 0.55);
          if (cl && Math.sin(X * 0.2 + row) > 0.95) c = mul(c, 0.7);
          if (cvf && noise(X * 0.4, Y * 0.06) > 0.72) c = mix(c, rgb(0x8ae0f0), 0.25); // wet streaks
          const tb = T(gx, gy + 1); // darker toward the floor
          if (!cl) c = mul(c, 0.95 - 0.35 * (ly / TT) * (isFace(tb) ? 0 : 1));
          if (!cl && ly < 2) c = mix(c, cvf ? C.ct2 : C.wt2, 0.9);
          break;
        }
        case Ter.WOOD: case Ter.RUG: {
          // warm plank floor: staggered boards, stretched grain, dark seams, nail heads, soft sheen
          const row = Math.floor(Y / 8), vy = Y - row * 8, off = hash(row, 5, 91) * 90, plen = 46 + Math.floor(hash(row, 6, 92) * 40);
          const col = Math.floor((X + off) / plen), vx = X + off - col * plen;
          const tone = hash(col, row, 93);
          c = mix(rgb(0x6a3f22), rgb(0x9a6236), 0.25 + tone * 0.55);
          const grain = noise(X * 0.035 + col * 7.3, Y * 0.9 + row * 3.1); c = mul(c, 0.9 + grain * 0.2);
          if (noise(X * 0.012 + col, Y * 0.3) > 0.78) c = mul(c, 0.82);            // knots / dark streaks
          if (vy === 0) c = mul(c, 0.5); else if (vy === 1) c = mix(c, rgb(0xd8a070), 0.18); else if (vy === 7) c = mul(c, 0.8);
          if (vx === 0) c = mul(c, 0.55); else if ((vx === 3 || vx === plen - 3) && (vy === 3 || vy === 5)) c = rgb(0x3a2a20);
          c = mix(c, rgb(0xffd8a0), clamp(noise(X * 0.01, Y * 0.01) - 0.55) * 0.25);
          if (t === Ter.RUG) {
            const bx = rugBox.get(gy * w + gx)!; const d = Math.min(X - bx[0], Y - bx[1], bx[2] - 1 - X, bx[3] - 1 - Y);
            if (d >= 0) {
              const cxr = (bx[0] + bx[2]) / 2, cyr = (bx[1] + bx[3]) / 2, rx = X - cxr, ry = Y - cyr;
              if (d < 2) c = mix(rgb(0xe8d0a0), rgb(0xb89060), hash(X, Y >> 1, 94));                     // fringe
              else if (d < 4) c = rgb(0x3a1418);
              else if (d < 10) { c = mix(rgb(0xc8963a), rgb(0xe8c060), noise(X * 0.3, Y * 0.3) * 0.4); const pp = ((X + Y) >> 2) & 3; if ((d === 6 || d === 7) && pp === 0) c = rgb(0x2a3060); }
              else if (d < 12) c = rgb(0x5a1418);
              else { c = mix(rgb(0x8a2228), rgb(0xa8323a), noise(X * 0.2, Y * 0.2) * 0.5);
                const lat = (Math.abs(rx) + Math.abs(ry)) % 12; if (lat < 1.2) c = rgb(0x2a3060); else if (lat < 2.2) c = rgb(0xc8963a);
                const md = Math.abs(rx) * 0.9 + Math.abs(ry); if (md < 9) c = md < 4 ? rgb(0xf0c860) : md < 6 ? rgb(0x2a3060) : rgb(0xd8a848); }
              if (hash(X, Y, 95) < 0.12) c = mul(c, 0.9);
              if (d >= 2) c = mul(c, 0.96 + 0.08 * clamp(1 - (Y - bx[1]) / 120));
            }
          }
          // contact shadow under the back wall, side walls and counters
          if (wallish(gx, gy - 1)) c = mul(c, 0.45 + 0.55 * smooth(0, 18, ly));
          if (wallish(gx - 1, gy)) c = mul(c, 0.6 + 0.4 * smooth(0, 10, lx));
          if (wallish(gx + 1, gy)) c = mul(c, 0.6 + 0.4 * smooth(0, 10, TT - lx));
          if (T(gx, gy - 1) === Ter.COUNTER) c = mul(c, 0.6 + 0.4 * smooth(0, 10, ly));
          if (!outdoor && ch === 'D') { // woven doormat + daylight spilling in
            const mx = Math.abs(lx - TT / 2), my = Math.abs(ly - TT / 2);
            if (mx < 13 && my < 9) { c = mix(rgb(0x8a6a3a), rgb(0xb89a5a), ((lx >> 1) + (ly >> 1)) & 1 ? 0.7 : 0.2); if (mx > 11 || my > 7) c = rgb(0x5a3a1a); }
            c = mix(c, rgb(0xfff0c8), 0.18 * smooth(0, TT, ly));
          }
          break;
        }
        case Ter.IWALL: {
          const below = T(gx, gy + 1), below2 = T(gx, gy + 2);
          const faceLo = floorish(below), faceHi = !faceLo && below === Ter.IWALL && floorish(below2);
          if (faceLo || faceHi) {
            const fy = (faceHi ? 0 : TT) + ly, FH2 = TT * 2;               // 0 = top of the two-tile wall face
            const lowCh = faceLo ? ch : CH(gx, gy + 1), stoneW = 'NQG-'.includes(ch) || 'NQG-'.includes(lowCh);
            if (stoneW) {
              const row = Math.floor(Y / 9), off = (row % 2) * 9, colb = Math.floor((X + off) / 18), vx = (X + off) % 18, vy = Y % 9;
              c = mix(rgb(0x6a6458), rgb(0x9a9284), 0.3 + hash(colb, row, 97) * 0.5 + (noise(X * 0.2, Y * 0.2) - 0.5) * 0.2);
              if (vy === 0 || vx === 0) c = rgb(0x3e3a34); else if (vy === 1) c = mix(c, rgb(0xd8d0c0), 0.3);
              c = mul(c, 0.7 + 0.3 * fy / FH2);
              if (fy > FH2 - 6) c = fy === FH2 - 6 ? rgb(0xb8b0a0) : rgb(0x3e3a34);
              if (lowCh === '-') { const wx = lx - TT / 2 + 0.5, top = 12, bot = FH2 - 10, inW = Math.abs(wx) < 9 && fy < bot && (fy > top + 9 || Math.hypot(wx, fy - top - 9) < 9);
                const frame = !inW && Math.abs(wx) < 12 && fy < bot + 3 && (fy > top + 9 || Math.hypot(wx, fy - top - 9) < 12);
                if (frame) c = rgb(0xc8c0b0);
                if (inW) { const seg = (Math.floor((wx + 9) / 4.5) + Math.floor(fy / 7)) % 5; c = [rgb(0xe04a5a), rgb(0x4a8ae0), rgb(0xf0c040), rgb(0x50c080), rgb(0xb070e0)][seg]; c = mix(c, rgb(0xfff4d0), 0.25 * clamp(1 - fy / FH2));
                  if ((wx + 9) % 4.5 < 1 || fy % 7 === 0) c = rgb(0x2a2030); } }
            } else
            if (fy < 6) { c = mix(rgb(0x3a2416), rgb(0x5a3a22), noise(X * 0.4, Y * 0.2)); if (fy === 4) c = rgb(0x8a6040); if (fy === 5) c = rgb(0x24160e); }
            else if (fy < 36) {
              c = mix(rgb(0xb59c76), rgb(0xcbb48a), noise(X * 0.06, Y * 0.06) * 0.7); c = mul(c, 0.78 + 0.22 * (fy - 6) / 30);
              if (hash(X >> 1, Y >> 1, 96) < 0.04) c = mul(c, 0.92);
              const pc = X % 64; if (pc < 5) { c = mix(rgb(0x4a2c18), rgb(0x6a4228), noise(X * 0.5, Y * 0.08)); if (pc === 0) c = rgb(0x24160e); if (pc === 1) c = mix(c, rgb(0xa07850), 0.4); }
            } else if (fy < 39) { c = fy === 36 ? rgb(0x9a7048) : fy === 38 ? rgb(0x24160e) : rgb(0x6a4428); }
            else if (fy < FH2 - 5) {
              const pw = 24, pc2 = X % pw, py = fy - 39, ph = FH2 - 5 - 39;
              c = mix(rgb(0x4a2c18), rgb(0x5e3a20), noise(X * 0.05 + 3, Y * 0.8) * 0.8);
              if (pc2 < 2 || py < 2 || py > ph - 3 || pc2 > pw - 3) c = mul(c, pc2 < 1 || py < 1 ? 1.35 : 0.7); // raised panel bevel
            } else { c = fy === FH2 - 5 ? rgb(0x8a6040) : rgb(0x2a1a10); }
            if (wallish(gx - 1, gy) && !floorish(T(gx - 1, gy))) c = mul(c, 0.62 + 0.38 * smooth(0, 12, lx)); // corner occlusion
            if (wallish(gx + 1, gy) && !floorish(T(gx + 1, gy))) c = mul(c, 0.62 + 0.38 * smooth(0, 12, TT - lx));
          } else {
            // cut-away wall top: dark beam with a warm lit rim where it meets the room
            c = mix(rgb(0x1c120e), rgb(0x2c1c14), noise(X * 0.08, Y * 0.5) * 0.8);
            const fl = (dx: number, dy: number) => { const q = T(gx + dx, gy + dy); return floorish(q) || (q === Ter.IWALL && floorish(T(gx + dx, gy + dy + 1))); };
            if (fl(0, 1) && ly > TT - 4) c = ly === TT - 1 ? rgb(0x24160e) : rgb(0x8a6040);
            if (fl(1, 0) && lx > TT - 4) c = lx === TT - 1 ? rgb(0x24160e) : rgb(0x7a5436);
            if (fl(-1, 0) && lx < 3) c = lx === 0 ? rgb(0x24160e) : rgb(0x7a5436);
            if (fl(0, -1) && ly < 3) c = ly === 0 ? rgb(0x9a7048) : rgb(0x6a4428);
          }
          break;
        }
        case Ter.COUNTER: {
          const front = !(T(gx, gy + 1) === Ter.COUNTER);
          const topEnd = front ? 20 : TT;
          if (ly < topEnd) {
            c = mix(rgb(0x8a5a32), rgb(0xb07a44), noise(X * 0.03, Y * 0.6 + gx * 9) * 0.7);
            if ((Y >> 3) % 2 === 0 && (Y & 7) === 0) c = mul(c, 0.7);
            c = mix(c, rgb(0xffe0b0), clamp(noise(X * 0.02, Y * 0.02) - 0.5) * 0.4);
            if (T(gx - 1, gy) !== Ter.COUNTER && lx < 3) c = mix(c, rgb(0xe8b880), 0.4);
            if (T(gx + 1, gy) !== Ter.COUNTER && lx > TT - 3) c = mul(c, 0.6);
            if (T(gx, gy - 1) !== Ter.COUNTER && ly < 2) c = mix(c, rgb(0xe8b880), 0.5);
            if (front && ly >= topEnd - 2) c = ly === topEnd - 1 ? rgb(0x2a1a10) : rgb(0xd8a068);
            if (ch === '+') { c = mix(rgb(0xe8e0d0), rgb(0xfff8ec), noise(X * 0.1, Y * 0.3) * 0.6); if (ly < 3 || ly > topEnd - 4) c = rgb(0xd8a840); if (Math.abs(lx - TT / 2) < 2 && ly > 5 && ly < 16 || Math.abs(ly - 9) < 2 && Math.abs(lx - TT / 2) < 6) c = rgb(0xf0c040); }
          } else {
            c = mix(rgb(0x4a2a16), rgb(0x60381e), noise(X * 0.06, Y * 0.5) * 0.8); if (X % 10 === 0) c = mul(c, 0.6); if (ly === TT - 1) c = rgb(0x1a100a);
            if (ch === '+') { c = mix(rgb(0xb02a3a), rgb(0xd0404a), noise(X * 0.2, Y * 0.5) * 0.5); if (ly > TT - 4) c = rgb(0xd8a840); }
            c = mul(c, 0.85 + 0.15 * (TT - ly) / 12);
          }
          break;
        }
        case Ter.WATER: { c = C.mud; break; }
        default: { c = [0, 0, 0]; }
      }
      // raised plaza (diorama depth): stone curb face below the plaza edge, cast shadow under it, lit lips on top
      { const tr = T(gx, gy), up = T(gx, gy - 1);
        if (tr !== Ter.PLAZA && up === Ter.PLAZA && t !== Ter.WATER) {
          if (ly < 7) { const bw = 12, off = (Math.floor(X / 6) % 2) * 0, col = Math.floor((X + off) / bw), vx = (X + off) % bw;
            c = mix(C.pl0, mul(C.pl1, 0.8), 0.25 + hash(col, gy, 81) * 0.4); c = mul(c, 0.78 - ly * 0.035);
            if (ly === 0) c = mix(c, rgb(0xf0e8d8), 0.45); else if (vx === 0 || ly === 6) c = mul(c, 0.6); }
          else if (ly < 15) c = mul(c, 0.55 + 0.45 * smooth(7, 15, ly));
        }
        if (tr === Ter.PLAZA) {
          const dn = T(gx, gy + 1), lf = T(gx - 1, gy), rt = T(gx + 1, gy), un = T(gx, gy - 1);
          if (dn !== Ter.PLAZA && ly > TT - 3) c = mix(c, rgb(0xfff4e0), 0.35);
          if (lf !== Ter.PLAZA && lx < 2) c = mix(c, rgb(0xfff4e0), 0.3);
          if (rt !== Ter.PLAZA && lx > TT - 3) c = mul(c, 0.7);
          if (un !== Ter.PLAZA && ly < 2) c = mul(c, 0.8);
        }
        if (tr !== Ter.PLAZA && T(gx - 1, gy) === Ter.PLAZA && lx < 6 && ly >= 0) c = mul(c, 0.6 + 0.4 * smooth(0, 6, lx));
      }
      // cliff-top lip
      if (ch === 'C' && ly > TT - 6) c = ly > TT - 3 ? mix(C.cl2, C.cl1, (ly - (TT - 3)) / 3) : mul(c, 0.8);
      const i = (Y * W + X) * 4;
      out[i] = c[0]; out[i + 1] = c[1]; out[i + 2] = c[2]; out[i + 3] = t ? 255 : 0;
      if (wat && t === Ter.WATER) {
        // water colour by depth (distance to shore) + foam band at the shoreline
        let sd = 99; for (let j = -2; j <= 2; j++) for (let ii = -2; ii <= 2; ii++) { const q = T(gx + ii, gy + j); if (q && q !== Ter.WATER) { const cx2 = Math.max((gx + ii) * TT, Math.min(X, (gx + ii + 1) * TT)), cy2 = Math.max((gy + j) * TT, Math.min(Y, (gy + j + 1) * TT)); sd = Math.min(sd, Math.hypot(X - cx2, Y - cy2)); } }
        // warped shore distance
        const near = (tn !== Ter.WATER || ts !== Ter.WATER || tw !== Ter.WATER || te !== Ter.WATER);
        const sea = ch === '4', pool = ch === '0';
        const deep = sea ? rgb(0x13396e) : pool ? rgb(0x0e5a66) : rgb(0x1d4f8a), shal = sea ? rgb(0x2f86b8) : pool ? rgb(0x3ad0c8) : rgb(0x3f8ac8);
        let wc = mix(shal, deep, smooth(4, 60, sd + (noise(X * 0.05, Y * 0.05) - 0.5) * 20));
        wc = mix(wc, mul(wc, 1.18), noise(X * 0.08, Y * 0.02) * 0.6);
        let a = 235;
        const nf = (look(X, Y - 2, wx, wy) !== Ter.WATER || look(X, Y + 2, wx, wy) !== Ter.WATER || look(X - 2, Y, wx, wy) !== Ter.WATER || look(X + 2, Y, wx, wy) !== Ter.WATER);
        if (nf) { wc = mix(wc, rgb(0xd8eef8), 0.45); a = 255; } else if (near) { wc = mix(wc, rgb(0x9fd0f0), 0.2); }
        else if (sd < 12) { const band = Math.sin(sd * 0.9 - noise(X * 0.1, Y * 0.1) * 6); if (band > 0.6) wc = mix(wc, rgb(0xd8f0ff), (band - 0.6) * 1.2); }
        wat[i] = wc[0]; wat[i + 1] = wc[1]; wat[i + 2] = wc[2]; wat[i + 3] = a;
      }
    }
  }
  const put = (k: string, data: Uint8ClampedArray) => {
    const tex = scene.textures.createCanvas(k, W, H)!; const ctx = tex.getContext();
    ctx.putImageData(new ImageData(data as any, W, H), 0, 0); tex.refresh(); return tex;
  };
  put(key, out);
  if (wat) put(waterKey, wat);
  res.fresh = true; return res;
}
