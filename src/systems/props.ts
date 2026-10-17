/**
 * Prop overlay tiles. Many object tiles (bushes, signs, lamps, crates, posts…) were painted on top of a fixed
 * ground (grass, plaza, sea…). Placed on any other ground they showed a mismatched square. Here we derive a
 * transparent copy of each such tile: pixels of its base ground that are connected to the tile border are cut
 * away, soft drop-shadow pixels become translucent black. WorldScene then draws the *real* neighbouring ground
 * underneath and the prop on an overlay layer.
 */
import Phaser from 'phaser';
import { shade } from './paperdoll';
import { T, T2 } from './art';

const sh = (c: number, ...f: number[]) => f.map(k => shade(c, k));
const GRASS = [0x4f9a46, 0x5fae4f, 0x448a3e, 0x6cc25a, 0x3f7f3a];
const PLAZA = [0xb8b0a0, ...sh(0xb8b0a0, 1.08, 0.92, 1.12), 0x8a8478];
const AGRASS = [0x9a8a3a, 0xae9a46, 0x86762e, 0xd8682a, 0xe8a03a, 0xb8402a, 0xf0c050, 0x6a5a20];
const SAND = [0xe8d29a, ...sh(0xe8d29a, 1.1, 0.9, 1.07, 0.93), 0xc8ae78, 0xf6e6b8];
const SEA = [0x2c5f9a];
const PLANKS = [0xb88a5a, 0x5a3a22, 0x2c5f9a, 0xd4a878, 0x8a6038];
const SHADOWS = [[20, 40, 20, 0.4], [40, 24, 10, 0.4], [40, 24, 10, 0.45]];

/** tile index -> [palette of its painted ground, fallback ground char] */
let _pt: Record<number, [number[], string, number[]?]> | null = null;
export const propTiles = (): Record<number, [number[], string, number[]?]> => _pt ??= ({
  [T.bush]: [GRASS, '.'], [T.sign]: [GRASS, '.'], [T.well]: [GRASS, '.'], [T.fence]: [GRASS, '.'], [T.lamp]: [PLAZA, 'o'], [T.statue]: [PLAZA, 'o', [3, 3, 13, 15]],
  [T2.mushroom]: [AGRASS, '5'], [T2.log]: [AGRASS, '5'], [T2.aBush]: [AGRASS, '5'], [T2.rocks]: [SAND, '1'],
  [T2.post]: [SEA, '4'], [T2.boat]: [SEA, '4'], [T2.dockCrates]: [PLANKS, '3'], [T2.net]: [PLANKS, '3'], [T2.lantern]: [[0x9a9488], 'Z'],
});

export function makePropTiles(scene: Phaser.Scene) {
  const src = scene.textures.get('tiles').getSourceImage() as HTMLCanvasElement;
  const tex = scene.textures.createCanvas('props', src.width, src.height)!; const c = tex.getContext();
  const sc = src.getContext('2d')!;
  for (const [k, [pal, , prot]] of Object.entries(propTiles())) {
    const x0 = +k * 16; const img = sc.getImageData(x0, 0, 16, 16); const d = img.data;
    const set = new Set(pal);
    const safe = (p: number) => !!prot && (p & 15) >= prot[0] && (p >> 4) >= prot[1] && (p & 15) < prot[2] && (p >> 4) < prot[3];
    const col0 = (i: number) => (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2];
    const col = (i: number) => safe(i) && col0(i) === 0x8a8478 ? -1 : col0(i); // statue plinth shares the grout colour
    const cut = new Uint8Array(256); const q: number[] = [];
    for (let i = 0; i < 16; i++) for (const p of [i, 240 + i, i * 16, i * 16 + 15]) if (!cut[p] && set.has(col(p))) { cut[p] = 1; q.push(p); }
    while (q.length) { const p = q.pop()!; const x = p & 15, y = p >> 4;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx > 15 || ny > 15) continue; const n = ny * 16 + nx; if (!cut[n] && set.has(col(n))) { cut[n] = 1; q.push(n); } } }
    // antialiased fringe: a pixel next to cut ground that is a near-blend of the ground is cut too
    const near = (c0: number) => pal.some(p => Math.abs((p >> 16 & 255) - (c0 >> 16 & 255)) + Math.abs((p >> 8 & 255) - (c0 >> 8 & 255)) + Math.abs((p & 255) - (c0 & 255)) < 30);
    for (let p = 0; p < 256; p++) if (!cut[p] && near(col(p))) { const x = p & 15, y = p >> 4; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx < 0 || ny < 0 || nx > 15 || ny > 15 || cut[ny * 16 + nx] === 1; })) cut[p] = 2; }
    for (let p = 0; p < 256; p++) {
      if (cut[p]) { d[p * 4 + 3] = 0; continue; }
      // painted drop shadow over ground -> translucent black
      const r = d[p * 4], g = d[p * 4 + 1], b = d[p * 4 + 2];
      if (pal.some(pc => SHADOWS.some(([sr, sg, sb, a]) => Math.abs((pc >> 16 & 255) * (1 - a) + sr * a - r) < 3 && Math.abs((pc >> 8 & 255) * (1 - a) + sg * a - g) < 3 && Math.abs((pc & 255) * (1 - a) + sb * a - b) < 3))) { d[p * 4] = 0; d[p * 4 + 1] = 0; d[p * 4 + 2] = 0; d[p * 4 + 3] = 90; }
    }
    c.putImageData(img, x0, 0);
  }
  tex.refresh();
}
