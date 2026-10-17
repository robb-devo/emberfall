/** Chapter II tileset additions (coast, autumn woods, sea caves, chapel). Drawn into the shared tile strip. */
import { shade } from './paperdoll';
type Ctx = CanvasRenderingContext2D;
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
let seed = 991; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const px = (c: Ctx, x: number, y: number, col: number, w = 1, h = 1) => { c.fillStyle = hex(col); c.fillRect(x, y, w, h); };
const noise = (c: Ctx, x0: number, base: number, n: number, amt = 0.1) => { for (let i = 0; i < n; i++) px(c, x0 + Math.floor(rnd() * 16), Math.floor(rnd() * 16), shade(base, 1 + (rnd() < 0.5 ? -amt : amt))); };

export const T2 = {
  sand: 64, sand2: 65, dock: 66, sea: 67, sea2: 68, aTrunk: 69, aCanopy: 70, aGrass: 71, aGrass2: 72, leafPath: 73, mushroom: 74, log: 75,
  cobble: 76, swall: 77, swindow: 78, sdoor: 79, slate: 80, slateE: 81, coral: 82, cwallTop: 83, cwall: 84, pool: 85, pool2: 86,
  chFloor: 87, pew: 88, altar: 89, glass: 90, post: 91, boat: 92, dockCrates: 93, lhBase: 94, aTall: 95,
  foamN: 96, foamS: 97, foamW: 98, foamE: 99, lfN: 100, lfS: 101, lfW: 102, lfE: 103, net: 104, aBush: 105, coralGlow: 106, cStairsD: 107, cStairsU: 108, lantern: 109,
  aFlowers: 110, rocks: 111, tidal: 112,
};

export function makeTiles2(c: Ctx, at: (i: number) => number) {
  // --- sand
  for (const [k, v] of [[T2.sand, 0], [T2.sand2, 1]] as const) {
    px(c, at(k), 0, 0xe8d29a, 16, 16); noise(c, at(k), 0xe8d29a, 46, 0.07);
    for (let i = 0; i < 3 + v * 3; i++) { const x = at(k) + Math.floor(rnd() * 14), y = Math.floor(rnd() * 15); px(c, x, y, 0xc8ae78, 2, 1); px(c, x, y + 1, 0xf6e6b8, 2, 1); }
    if (v) { px(c, at(k) + 4, 9, 0xf0f0f0, 2, 1); px(c, at(k) + 5, 8, 0xff9a8a, 1, 1); px(c, at(k) + 11, 4, 0xd88a6a, 2, 2); }
  }
  // --- dock planks over water
  px(c, at(T2.dock), 0, 0x2c5f9a, 16, 16);
  for (let y = 0; y < 16; y += 4) { px(c, at(T2.dock), y, 0xb88a5a, 16, 3); px(c, at(T2.dock), y, 0xd4a878, 16, 1); px(c, at(T2.dock), y + 3, 0x5a3a22, 16, 1); px(c, at(T2.dock) + ((y * 3) % 13), y + 1, 0x8a6038, 3, 1); px(c, at(T2.dock) + ((y * 7 + 5) % 15), y + 2, 0x4a2c15); }
  // --- deep sea (2 frames)
  for (const [k, off] of [[T2.sea, 0], [T2.sea2, 5]] as const) {
    px(c, at(k), 0, 0x1f4f8f, 16, 16);
    for (let y = 0; y < 16; y += 3) for (let x = 0; x < 16; x++) { const s = Math.sin((x + off) * 0.7 + y * 1.3); if (s > 0.75) px(c, at(k) + x, y, 0x3d7cc4); if (s < -0.8) px(c, at(k) + x, y + 1, 0x17407a); }
    px(c, at(k) + ((off * 2 + 4) % 14), 4, 0xd0ecff, 2, 1); px(c, at(k) + ((off * 3 + 9) % 14), 11, 0x9acfff, 3, 1);
  }
  // --- autumn grass / trunk / canopy / path / tall grass / bush / flowers
  const aGrass = (x0: number, v: number) => {
    px(c, x0, 0, 0x9a8a3a, 16, 16);
    for (let i = 0; i < 30; i++) px(c, x0 + Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? 0xae9a46 : 0x86762e);
    for (let i = 0; i < 4 + v * 4; i++) { const x = x0 + Math.floor(rnd() * 15), y = Math.floor(rnd() * 15); px(c, x, y, [0xd8682a, 0xe8a03a, 0xb8402a, 0xf0c050][i % 4]); px(c, x + 1, y + 1, 0x6a5a20); }
  };
  aGrass(at(T2.aGrass), 0); aGrass(at(T2.aGrass2), 1);
  aGrass(at(T2.aTrunk), 0); c.fillStyle = 'rgba(40,24,10,0.45)'; c.beginPath(); c.ellipse(at(T2.aTrunk) + 8, 13, 7, 3, 0, 0, 7); c.fill();
  px(c, at(T2.aTrunk) + 6, 3, 0x5a3418, 4, 11); px(c, at(T2.aTrunk) + 6, 3, 0x7a4a24, 1, 11); px(c, at(T2.aTrunk) + 9, 3, 0x3a2010, 1, 11); px(c, at(T2.aTrunk) + 4, 12, 0x5a3418, 8, 2);
  { const x0 = at(T2.aCanopy);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8, dy = y + 0.5 - 9; const d = Math.sqrt(dx * dx * 0.85 + dy * dy * 1.1) + (rnd() - 0.5) * 1.8;
      if (d < 8.3) { const lit = -dx - dy * 1.2; const base = (x * 7 + y * 3) % 9 < 3 ? 0xd8602a : 0xe0902e; px(c, x0 + x, y, lit > 5 ? shade(base, 1.3) : lit > -2 ? base : lit > -8 ? shade(base, 0.72) : shade(base, 0.5)); }
    }
    for (let i = 0; i < 7; i++) px(c, x0 + 3 + Math.floor(rnd() * 10), 2 + Math.floor(rnd() * 8), 0xffd070);
  }
  px(c, at(T2.leafPath), 0, 0xb8905a, 16, 16); noise(c, at(T2.leafPath), 0xb8905a, 40, 0.09);
  for (let i = 0; i < 7; i++) { const x = at(T2.leafPath) + Math.floor(rnd() * 14), y = Math.floor(rnd() * 14); px(c, x, y, [0xd8682a, 0xe8a03a, 0xa83a22][i % 3], 2, 1); }
  aGrass(at(T2.aTall), 0);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) { const x = at(T2.aTall) + i * 2 + (row % 2), base = 6 + row * 5, h = 4 + Math.floor(rnd() * 3); px(c, x, base - h, row === 2 ? 0xe8c060 : 0xc8a040, 1, h); px(c, x, base - h, 0xfff0a0); px(c, x + 1, base - 1, 0x6a5020); }
  aGrass(at(T2.aBush), 0); c.fillStyle = 'rgba(40,24,10,0.4)'; c.fillRect(at(T2.aBush) + 2, 12, 12, 3);
  for (let y = 2; y < 14; y++) for (let x = 1; x < 15; x++) { const dx = x - 7.5, dy = y - 8; if (dx * dx / 49 + dy * dy / 36 < 1) px(c, at(T2.aBush) + x, y, dx + dy < -4 ? 0xf0a040 : dx + dy > 4 ? 0x8a3a1a : 0xc8602a); }
  px(c, at(T2.aBush) + 5, 6, 0xb02040); px(c, at(T2.aBush) + 10, 9, 0xb02040);
  aGrass(at(T2.aFlowers), 0);
  for (let i = 0; i < 6; i++) { const x = at(T2.aFlowers) + 1 + Math.floor(rnd() * 13), y = 1 + Math.floor(rnd() * 13), f = [0xffffff, 0xc28cff, 0xffd34e][i % 3]; px(c, x, y, f, 2, 2); px(c, x + 1, y + 2, 0x5a6a20); }
  // mushrooms + log + rocks (solid deco)
  aGrass(at(T2.mushroom), 0);
  for (const [x, y, s] of [[4, 8, 4], [10, 6, 5], [8, 12, 3]]) { px(c, at(T2.mushroom) + x, y, 0xf0e0c8, 2, s); c.fillStyle = '#d0402a'; c.beginPath(); c.ellipse(at(T2.mushroom) + x + 1, y, s * 0.9, s * 0.55, 0, Math.PI, 0); c.fill(); px(c, at(T2.mushroom) + x, y - 2, 0xffffff); px(c, at(T2.mushroom) + x + 2, y - 1, 0xffffff); }
  aGrass(at(T2.log), 0); px(c, at(T2.log), 6, 0x6b4220, 16, 7); px(c, at(T2.log), 6, 0x8a5a2b, 16, 2); px(c, at(T2.log), 12, 0x3a2010, 16, 1); px(c, at(T2.log) + 1, 7, 0xd8b078, 3, 4); px(c, at(T2.log) + 2, 8, 0x8a5a2b, 1, 2); px(c, at(T2.log) + 9, 5, 0x4a8a3a, 4, 1);
  px(c, at(T2.rocks), 0, 0xe8d29a, 16, 16); noise(c, at(T2.rocks), 0xe8d29a, 30);
  for (const [x, y, r] of [[5, 9, 5], [11, 6, 4], [10, 12, 3]]) { c.fillStyle = hex(0x7a7468); c.beginPath(); c.ellipse(at(T2.rocks) + x, y, r, r * 0.8, 0, 0, 7); c.fill(); c.fillStyle = hex(0xa8a294); c.beginPath(); c.ellipse(at(T2.rocks) + x - 1, y - 1, r * 0.6, r * 0.4, 0, 0, 7); c.fill(); }
  // --- town: cobblestone, stone houses, slate roofs
  px(c, at(T2.cobble), 0, 0x9a9488, 16, 16);
  for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? -2 : 0; x < 16; x += 5) { px(c, at(T2.cobble) + Math.max(0, x), y, 0xb4ae9e, Math.min(4, 16 - Math.max(0, x)), 3); px(c, at(T2.cobble) + Math.max(0, x), y, 0xcac4b4, Math.min(4, 16 - Math.max(0, x)), 1); }
  const swall = (x0: number) => { px(c, x0, 0, 0xb8b0a0, 16, 16); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) { px(c, x0 + x, y, 0x8a8478, 1, 4); px(c, x0, y + 3, 0x8a8478, 16, 1); px(c, x0 + x + 1, y, 0xd0c8b8, 6, 1); } px(c, x0, 14, 0x6a645a, 16, 2); };
  swall(at(T2.swall)); swall(at(T2.swindow)); px(c, at(T2.swindow) + 4, 2, 0x3a3048, 8, 9); px(c, at(T2.swindow) + 5, 3, 0x9ad0ff, 6, 7); px(c, at(T2.swindow) + 5, 3, 0xd8f0ff, 2, 2); px(c, at(T2.swindow) + 7, 3, 0x3a3048, 1, 7); px(c, at(T2.swindow) + 3, 11, 0x6a645a, 10, 1);
  swall(at(T2.sdoor)); px(c, at(T2.sdoor) + 3, 1, 0x3a2412, 10, 15); px(c, at(T2.sdoor) + 4, 2, 0x5a8aa8, 8, 14); px(c, at(T2.sdoor) + 4, 2, 0x7aaac8, 1, 14); px(c, at(T2.sdoor) + 8, 2, 0x3a5a78, 1, 14); px(c, at(T2.sdoor) + 10, 9, 0xf0c75e, 1, 2);
  const slate = (x0: number, edge: boolean) => { px(c, x0, 0, 0x4a5a7a, 16, 16); for (let y = 0; y < 16; y += 3) { px(c, x0, y + 2, 0x2e3a52, 16, 1); for (let x = (y / 3) % 2 ? 0 : 3; x < 16; x += 6) px(c, x0 + x, y, 0x3a4862, 1, 2); px(c, x0, y, 0x6a7a9a, 16, 1); } if (edge) { px(c, x0, 12, 0x2a3448, 16, 2); px(c, x0, 14, 0x141a28, 16, 2); } };
  slate(at(T2.slate), false); slate(at(T2.slateE), true);
  // --- sea caves
  const coral = (x0: number, glow: boolean) => { px(c, x0, 0, 0x2e4a5a, 16, 16); noise(c, x0, 0x2e4a5a, 40, 0.12); px(c, x0, 7, 0x24404e, 16, 1); px(c, x0 + 9, 0, 0x24404e, 1, 7); if (glow) { for (const [x, y, col] of [[3, 3, 0x6af0d0], [11, 10, 0xff8ac8], [5, 12, 0x9ad0ff]]) { px(c, x0 + x, y, col, 2, 2); px(c, x0 + x, y, 0xffffff); } } };
  coral(at(T2.coral), false); coral(at(T2.coralGlow), true);
  px(c, at(T2.cwallTop), 0, 0x0c1a22, 16, 16); for (let i = 0; i < 5; i++) { const x = Math.floor(rnd() * 12), y = Math.floor(rnd() * 12); px(c, at(T2.cwallTop) + x, y, 0x204452, 4, 3); px(c, at(T2.cwallTop) + x, y, 0x2e5a6a, 4, 1); }
  px(c, at(T2.cwall), 0, 0x2a5060, 16, 16); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 1 : 5; x < 16; x += 8) { px(c, at(T2.cwall) + x, y, 0x3a6a7a, 6, 3); px(c, at(T2.cwall) + x, y, 0x5a8a9a, 6, 1); }
  for (let i = 0; i < 4; i++) px(c, at(T2.cwall) + Math.floor(rnd() * 15), 6 + Math.floor(rnd() * 8), 0x4ab08a, 1, 2); px(c, at(T2.cwall), 14, 0x0e2028, 16, 2);
  for (const [k, off] of [[T2.pool, 0], [T2.pool2, 3]] as const) { px(c, at(k), 0, 0x1c6a7a, 16, 16); for (let y = 1; y < 16; y += 4) for (let x = 0; x < 16; x++) if (Math.sin((x + off) * 0.9 + y) > 0.7) px(c, at(k) + x, y, 0x4ab8c0); px(c, at(k) + ((off * 4 + 2) % 14), 8, 0xc8fff4, 2, 1); }
  coral(at(T2.tidal), false); for (let i = 0; i < 4; i++) { const x = at(T2.tidal) + 2 + Math.floor(rnd() * 11), y = 2 + Math.floor(rnd() * 11); px(c, x, y, 0x1c6a7a, 3, 2); px(c, x, y, 0x4ab8c0, 2, 1); }
  for (const [k, down] of [[T2.cStairsD, true], [T2.cStairsU, false]] as const) { coral(at(k), false); for (let i = 0; i < 4; i++) px(c, at(k) + 2 + (down ? i : 0), 2 + i * 3, shade(0x5a8a9a, down ? 1 - i * 0.2 : 1.1 - i * 0.1), down ? 12 - i * 2 : 12, 2); if (down) px(c, at(k) + 6, 12, 0x040c10, 4, 3); }
  // --- chapel
  px(c, at(T2.chFloor), 0, 0xd8d0c0, 16, 16); for (let y = 0; y < 16; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < 16; x += 16) px(c, at(T2.chFloor) + x, y, 0xb8b0a0, 8, 8); px(c, at(T2.chFloor), 0, 0xece4d4, 16, 1);
  px(c, at(T2.pew), 0, 0xd8d0c0, 16, 16); px(c, at(T2.pew), 4, 0x6b4220, 16, 8); px(c, at(T2.pew), 4, 0x8a5a2b, 16, 2); px(c, at(T2.pew), 11, 0x3a2010, 16, 1); px(c, at(T2.pew) + 1, 12, 0x3a2010, 2, 3); px(c, at(T2.pew) + 13, 12, 0x3a2010, 2, 3);
  px(c, at(T2.altar), 0, 0xd8d0c0, 16, 16); px(c, at(T2.altar) + 1, 4, 0xf0ece0, 14, 10); px(c, at(T2.altar) + 1, 4, 0xd8a040, 14, 2); px(c, at(T2.altar) + 7, 6, 0xd8a040, 2, 6); px(c, at(T2.altar) + 5, 8, 0xd8a040, 6, 2); px(c, at(T2.altar) + 1, 13, 0x8a8478, 14, 1);
  px(c, at(T2.glass), 0, 0xe8dcc0, 16, 16); c.fillStyle = '#3a3048'; c.beginPath(); c.moveTo(at(T2.glass) + 3, 15); c.lineTo(at(T2.glass) + 3, 6); c.arc(at(T2.glass) + 8, 6, 5, Math.PI, 0); c.lineTo(at(T2.glass) + 13, 15); c.fill();
  for (const [x, y, col] of [[5, 5, 0xd9534f], [9, 4, 0x6fd3ff], [6, 9, 0xf0c75e], [10, 9, 0x7ac74f], [7, 12, 0xc28cff], [9, 7, 0xffffff]]) px(c, at(T2.glass) + x, y, col, 2, 2);
  // --- docks props
  px(c, at(T2.post), 0, 0x2c5f9a, 16, 16); px(c, at(T2.post) + 5, 2, 0x5a3a22, 6, 13); px(c, at(T2.post) + 5, 2, 0x8a6038, 2, 13); px(c, at(T2.post) + 4, 5, 0xd8c090, 8, 2); px(c, at(T2.post) + 4, 14, 0x9acfff, 8, 1);
  px(c, at(T2.boat), 0, 0x2c5f9a, 16, 16); c.fillStyle = '#7a4a24'; c.beginPath(); c.moveTo(at(T2.boat), 4); c.lineTo(at(T2.boat) + 16, 4); c.lineTo(at(T2.boat) + 13, 13); c.lineTo(at(T2.boat) + 3, 13); c.fill(); px(c, at(T2.boat), 4, 0xb87a44, 16, 2); px(c, at(T2.boat) + 3, 7, 0xd8c090, 10, 1); px(c, at(T2.boat) + 4, 13, 0x9acfff, 8, 1);
  px(c, at(T2.dockCrates), 0, 0xb88a5a, 16, 16); for (let y = 0; y < 16; y += 4) px(c, at(T2.dockCrates), y + 3, 0x5a3a22, 16, 1);
  px(c, at(T2.dockCrates) + 1, 1, 0xc89a5a, 9, 9); px(c, at(T2.dockCrates) + 1, 1, 0x8a6236, 9, 1); for (let i = 0; i < 8; i++) px(c, at(T2.dockCrates) + 1 + i, 1 + i, 0x8a6236); px(c, at(T2.dockCrates) + 10, 6, 0x6a8aa8, 5, 9); px(c, at(T2.dockCrates) + 10, 6, 0x9ab8d0, 5, 1);
  px(c, at(T2.net), 0, 0xb88a5a, 16, 16); for (let y = 0; y < 16; y += 4) px(c, at(T2.net), y + 3, 0x5a3a22, 16, 1); for (let i = 0; i < 16; i += 3) { px(c, at(T2.net) + i, 2, 0x5a5a4a, 1, 12); px(c, at(T2.net) + 1, 2 + i % 12, 0x5a5a4a, 14, 1); }
  // --- lighthouse base, lantern post
  swall(at(T2.lhBase)); px(c, at(T2.lhBase), 0, 0xd8d0c0, 16, 6); px(c, at(T2.lhBase), 6, 0xc0453a, 16, 4); px(c, at(T2.lhBase), 6, 0xe0605a, 16, 1); px(c, at(T2.lhBase) + 6, 10, 0x3a2412, 4, 6);
  px(c, at(T2.lantern), 0, 0x9a9488, 16, 16); px(c, at(T2.lantern) + 7, 4, 0x2a2a3a, 2, 11); px(c, at(T2.lantern) + 5, 0, 0x2a2a3a, 6, 1); px(c, at(T2.lantern) + 5, 1, 0x9ae8ff, 6, 4); px(c, at(T2.lantern) + 6, 2, 0xe8fcff, 4, 2); px(c, at(T2.lantern) + 5, 14, 0x2a2a3a, 6, 2);
  // --- edge decals: sea foam & autumn leaf fringes
  const deco = (k: number, side: string, cols: number[], depth: (i: number) => number) => {
    const x0 = at(k);
    for (let i = 0; i < 16; i++) { const d = depth(i); for (let j = 0; j < d; j++) { const col = cols[Math.min(cols.length - 1, j)];
      if (side === 'N') px(c, x0 + i, j, col); if (side === 'S') px(c, x0 + i, 15 - j, col); if (side === 'W') px(c, x0 + j, i, col); if (side === 'E') px(c, x0 + 15 - j, i, col); } }
  };
  const foamD = (i: number) => 2 + (Math.sin(i * 1.1) > 0.2 ? 1 : 0) + (i % 5 === 0 ? 1 : 0);
  refineSurfaces(c, at);
  deco(T2.foamN, 'N', [0xd8c48e, 0xffffff, 0xbfe6ff, 0x7ab8e8], foamD); deco(T2.foamS, 'S', [0xd8c48e, 0xffffff, 0xbfe6ff, 0x7ab8e8], foamD);
  deco(T2.foamW, 'W', [0xd8c48e, 0xffffff, 0xbfe6ff, 0x7ab8e8], foamD); deco(T2.foamE, 'E', [0xd8c48e, 0xffffff, 0xbfe6ff, 0x7ab8e8], foamD);
  const lfD = () => 1 + Math.floor(rnd() * 3);
  deco(T2.lfN, 'N', [0x9a8a3a, 0x86762e], lfD); deco(T2.lfS, 'S', [0x9a8a3a, 0x86762e], lfD); deco(T2.lfW, 'W', [0x9a8a3a, 0x86762e], lfD); deco(T2.lfE, 'E', [0x9a8a3a, 0x86762e], lfD);
}

/** Second-pass surface painter: tileable Voronoi cobbles, rippled wet sand and layered sea. */
function refineSurfaces(c: Ctx, at: (i: number) => number) {
  // ---- cobblestones: organic stones from a wrapped Voronoi field, lit from the top-left, mossy mortar
  const cob = (x0: number, sd: number, base: number) => {
    seed = sd; const pts = Array.from({ length: 9 }, () => [rnd() * 16, rnd() * 16, rnd()]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let d1 = 99, d2 = 99, k1 = 0;
      for (let i = 0; i < pts.length; i++) for (const ox of [-16, 0, 16]) for (const oy of [-16, 0, 16]) {
        const dx = x + 0.5 - pts[i][0] - ox, dy = y + 0.5 - pts[i][1] - oy; const d = Math.sqrt(dx * dx + dy * dy * 1.25);
        if (d < d1) { d2 = d1; d1 = d; k1 = i; } else if (d < d2) d2 = d;
      }
      const edge = d2 - d1; const v = pts[k1][2];
      const stone = shade(base, 0.86 + v * 0.26);
      let col = stone;
      if (edge < 0.9) col = (x * 5 + y * 3) % 11 === 0 ? 0x5a6a3a : shade(base, 0.55);
      else if (edge < 1.7) { // bevel: light on the upper-left of each stone, shadow lower-right
        const [px0, py0] = pts[k1]; const lx = x + 0.5 - px0, ly = y + 0.5 - py0;
        col = (lx + ly) < 0 ? shade(stone, 1.16) : shade(stone, 0.8);
      } else if (((x * 7 + y * 13 + sd) % 23) === 0) col = shade(stone, 1.25);
      px(c, x0 + x, y, col);
    }
  };
  cob(at(T2.cobble), 4111, 0x948a7a);
  // ---- sand: soft dune noise, wind ripples, specks and the odd shell
  const sand = (x0: number, v: number) => {
    seed = 5150 + v * 77;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = Math.sin((x + y * 0.4) * 0.9 + v) * 0.5 + Math.sin((x * 0.3 - y) * 1.3) * 0.5;
      let col = n > 0.55 ? 0xe6d2a0 : n < -0.55 ? 0xc8b07c : 0xd8c48e;
      const r = rnd(); if (r < 0.06) col = shade(col, 0.88); else if (r < 0.1) col = shade(col, 1.08);
      px(c, x0 + x, y, col);
    }
    for (let k = 0; k < 3; k++) { const yy = 2 + k * 5 + v; for (let x = 0; x < 16; x++) { const y = yy + Math.round(Math.sin((x + k * 3) * 0.5)); if (y >= 0 && y < 16 && (x + k) % 7 !== 0) px(c, x0 + x, y, 0xbca474); if (y - 1 >= 0 && (x + k) % 7 !== 0) px(c, x0 + x, y - 1, 0xeedcae); } }
    if (v) { px(c, x0 + 4, 10, 0xfff4f0, 2, 1); px(c, x0 + 4, 11, 0xe8a090, 2, 1); px(c, x0 + 11, 4, 0xd88a6a, 1, 1); px(c, x0 + 12, 4, 0xf0b090); px(c, x0 + 9, 13, 0x9a8a7a); }
  };
  sand(at(T2.sand), 0); sand(at(T2.sand2), 1);
  // ---- sea: deep gradient with two wave layers and sparkles (2 animation frames)
  for (const [k, off] of [[T2.sea, 0], [T2.sea2, 1]] as const) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const w1 = Math.sin((x + off * 4) * 0.8 + y * 1.1), w2 = Math.sin((x - off * 3) * 0.45 - y * 0.7 + 2);
      let col = 0x1d4a86;
      if (w1 + w2 > 1.35) col = 0x3f86c8; else if (w1 + w2 > 0.8) col = 0x2c68aa; else if (w1 + w2 < -1.3) col = 0x153a70;
      px(c, at(k) + x, y, col);
    }
    px(c, at(k) + ((off * 7 + 3) % 13), 3 + off * 6, 0xe8f6ff, 2, 1); px(c, at(k) + ((off * 5 + 10) % 13), 12 - off * 5, 0xb8e0ff, 1, 1);
  }
}
