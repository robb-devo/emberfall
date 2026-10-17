/** Procedural pixel-art generator: tiles, monsters, FX, icons. No external assets. */
import Phaser from 'phaser';
import { shade } from './paperdoll';

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, x: number, y: number, col: number, w = 1, h = 1) => { c.fillStyle = hex(col); c.fillRect(x, y, w, h); };

export const T = {
  grass: 0, grass2: 1, tall: 2, flowers: 3, path: 4, water: 6, water2: 7, trunk: 9, canopy: 10, wall: 11, window: 12, door: 13,
  roofR: 14, roofRE: 15, roofB: 16, roofBE: 17, fence: 18, bridge: 19, plaza: 20, dfloor: 21, dfloor2: 22, dwallTop: 23, dwall: 24,
  rock: 25, lava: 26, wood: 27, iwall: 28, counter: 29, rug: 30, bush: 31, stairsD: 32, stairsU: 33, well: 34, cliff: 35, cliffTop: 36,
  edgeN: 53, edgeS: 54, edgeW: 55, edgeE: 56, shoreN: 57, shoreS: 58, shoreW: 59, shoreE: 60,
  bed: 37, shelf: 38, barrel: 39, crate: 40, void: 41, sky: 42, starTile: 43, hedge: 44, glow: 45, lamp: 46, sign: 47, table: 48, hearth: 49, statue: 50, pine: 51, pineTop: 52,
};
const N_TILES = 64;

function grassBase(c: Ctx, x: number, v: number) {
  px(c, x, 0, 0x4f9a46, 16, 16);
  for (let i = 0; i < 26; i++) { const a = Math.floor(rnd() * 16), b = Math.floor(rnd() * 16); px(c, x + a, b, rnd() < 0.5 ? 0x5fae4f : 0x448a3e); }
  for (let i = 0; i < 4 + v * 3; i++) { const a = Math.floor(rnd() * 15), b = 1 + Math.floor(rnd() * 14); px(c, x + a, b, 0x6cc25a); px(c, x + a, b + 1, 0x3f7f3a); }
}
function stoneFloor(c: Ctx, x: number, base: number, line: number) {
  px(c, x, 0, base, 16, 16);
  for (let i = 0; i < 30; i++) px(c, x + Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? shade(base, 1.08) : shade(base, 0.92));
  px(c, x, 7, line, 16, 1); px(c, x + 15, 0, line, 1, 7); px(c, x + 7, 8, line, 1, 8);
  px(c, x, 0, shade(base, 1.12), 15, 1); px(c, x, 8, shade(base, 1.12), 7, 1); px(c, x + 8, 8, shade(base, 1.12), 8, 1);
}

export function makeTiles(scene: Phaser.Scene) {
  seed = 7;
  const tex = scene.textures.createCanvas('tiles', N_TILES * 16, 16)!; const c = tex.getContext();
  const at = (i: number) => i * 16;
  grassBase(c, at(T.grass), 0); grassBase(c, at(T.grass2), 1);
  // tall grass
  px(c, at(T.tall), 0, 0x3a7a35, 16, 16);
  for (let row = 0; row < 3; row++) for (let i = 0; i < 8; i++) {
    const x = at(T.tall) + i * 2 + (row % 2), base = 6 + row * 5, h = 4 + Math.floor(rnd() * 3);
    px(c, x, base - h, row === 2 ? 0x8fe07a : 0x6cc25a, 1, h); px(c, x, base - h, 0xb0f090, 1, 1); px(c, x + 1, base - 1, 0x2a5a28, 1, 1);
  }
  // flowers
  grassBase(c, at(T.flowers), 0);
  const fl = [0xff6b8a, 0xffd34e, 0xffffff, 0x9ad0ff, 0xc28cff];
  for (let i = 0; i < 6; i++) { const x = at(T.flowers) + 1 + Math.floor(rnd() * 13), y = 1 + Math.floor(rnd() * 13), f = fl[i % fl.length]; px(c, x, y, f); px(c, x + 1, y, f); px(c, x, y + 1, f); px(c, x + 1, y + 1, shade(f, 0.7)); px(c, x + 1, y + 2, 0x2f6b2c); }
  // path
  px(c, at(T.path), 0, 0xc9a26b, 16, 16);
  for (let i = 0; i < 40; i++) px(c, at(T.path) + Math.floor(rnd() * 16), Math.floor(rnd() * 16), rnd() < 0.5 ? 0xb58d58 : 0xd8b67f);
  for (let i = 0; i < 5; i++) { const x = at(T.path) + Math.floor(rnd() * 14), y = Math.floor(rnd() * 14); px(c, x, y, 0x9a7a52, 2, 1); px(c, x, y - 1 < 0 ? 0 : y - 1, 0xe6c896, 2, 1); }
  // water 2 frames
  for (const [k, off] of [[T.water, 0], [T.water2, 4]] as const) {
    px(c, at(k), 0, 0x2f6fc0, 16, 16);
    for (let y = 0; y < 16; y += 4) for (let x = 0; x < 16; x++) { const s = Math.sin((x + off + y * 0.7) * 0.8); if (s > 0.6) px(c, at(k) + x, y + 1, 0x5c9be6); if (s < -0.85) px(c, at(k) + x, y + 2, 0x24589e); }
    px(c, at(k) + ((off + 3) % 16), 6, 0xbfe2ff, 2, 1); px(c, at(k) + ((off + 11) % 16), 13, 0xbfe2ff, 2, 1);
  }
  // tree trunk base (with grass) & canopy (overlay)
  grassBase(c, at(T.trunk), 0);
  c.fillStyle = 'rgba(20,40,20,0.45)'; c.beginPath(); c.ellipse(at(T.trunk) + 8, 13, 7, 3, 0, 0, Math.PI * 2); c.fill();
  px(c, at(T.trunk) + 6, 4, 0x6b4220, 4, 10); px(c, at(T.trunk) + 6, 4, 0x8a5a2b, 1, 10); px(c, at(T.trunk) + 9, 4, 0x4a2c15, 1, 10); px(c, at(T.trunk) + 5, 12, 0x6b4220, 6, 2);
  const canopy = (x0: number, yoff: number, base: number) => {
    const cx = x0 + 8, cy = 8 + yoff;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - 8, dy = y + 0.5 - (cy);
      const d = Math.sqrt(dx * dx * 0.9 + dy * dy * 1.1) + (rnd() - 0.5) * 1.6;
      if (d < 8.2) { const lit = -dx - dy * 1.2; px(c, x0 + x, y, lit > 5 ? shade(base, 1.35) : lit > -2 ? base : lit > -8 ? shade(base, 0.75) : shade(base, 0.55)); }
    }
    for (let i = 0; i < 6; i++) { const x = cx - 5 + Math.floor(rnd() * 10), y = cy - 5 + Math.floor(rnd() * 8); px(c, x, y, shade(base, 1.5)); }
  };
  canopy(at(T.canopy), 2, 0x3f8f3c);
  // pine variant
  grassBase(c, at(T.pine), 1); px(c, at(T.pine) + 7, 6, 0x5a3818, 2, 8);
  c.fillStyle = 'rgba(20,40,20,0.45)'; c.beginPath(); c.ellipse(at(T.pine) + 8, 14, 6, 2, 0, 0, Math.PI * 2); c.fill();
  for (let y = 0; y < 16; y++) { const w = Math.floor(2 + y * 0.45); for (let x = -w; x <= w; x++) px(c, at(T.pineTop) + 8 + x, y, x < -w / 3 ? 0x4fa25a : x > w / 3 ? 0x1f5a3a : 0x2f7a46); }
  for (let y = 0; y < 8; y++) { const w = Math.floor(1 + y * 0.6); for (let x = -w; x <= w; x++) px(c, at(T.pine) + 8 + x, y, x < 0 ? 0x2f7a46 : 0x1f5a3a); }
  // walls
  const wood = (x0: number) => { px(c, x0, 0, 0xc89a64, 16, 16); for (let y = 3; y < 16; y += 4) px(c, x0, y, 0x9a6e44, 16, 1); px(c, x0, 0, 0xe0b880, 16, 1); px(c, x0, 0, 0x7a5232, 1, 16); px(c, x0 + 15, 0, 0x7a5232, 1, 16); };
  wood(at(T.wall)); px(c, at(T.wall), 14, 0x6b4a2e, 16, 2);
  wood(at(T.window)); px(c, at(T.window) + 3, 3, 0x4a2c15, 10, 9); px(c, at(T.window) + 4, 4, 0xffd77a, 8, 7); px(c, at(T.window) + 4, 4, 0xfff0b8, 3, 2); px(c, at(T.window) + 7, 4, 0x4a2c15, 1, 7); px(c, at(T.window) + 4, 7, 0x4a2c15, 8, 1); px(c, at(T.window) + 2, 12, 0x6b4220, 12, 2); px(c, at(T.window) + 3, 11, 0xff6b8a, 2, 1); px(c, at(T.window) + 10, 11, 0xffd34e, 2, 1);
  wood(at(T.door)); px(c, at(T.door) + 3, 2, 0x4a2c15, 10, 14); px(c, at(T.door) + 4, 3, 0x7a4a24, 8, 13); px(c, at(T.door) + 4, 3, 0x8f5a2e, 1, 13); px(c, at(T.door) + 10, 9, 0xf0c75e, 1, 2); px(c, at(T.door) + 8, 3, 0x5a3418, 1, 13);
  // roofs
  const roof = (x0: number, base: number, edge: boolean) => {
    px(c, x0, 0, base, 16, 16);
    for (let y = 0; y < 16; y += 4) { px(c, x0, y + 3, shade(base, 0.7), 16, 1); for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) px(c, x0 + x, y, shade(base, 0.8), 1, 3); px(c, x0, y, shade(base, 1.2), 16, 1); }
    if (edge) { px(c, x0, 12, shade(base, 0.55), 16, 2); px(c, x0, 14, 0x2a1a20, 16, 2); }
  };
  roof(at(T.roofR), 0xc0453a, false); roof(at(T.roofRE), 0xc0453a, true); roof(at(T.roofB), 0x3d64b0, false); roof(at(T.roofBE), 0x3d64b0, true);
  // fence
  grassBase(c, at(T.fence), 0); px(c, at(T.fence), 5, 0xe0c090, 16, 2); px(c, at(T.fence), 10, 0xe0c090, 16, 2); px(c, at(T.fence), 7, 0x9a7048, 16, 1); px(c, at(T.fence), 12, 0x9a7048, 16, 1);
  for (const x of [2, 12]) { px(c, at(T.fence) + x, 2, 0xf0d6a8, 2, 13); px(c, at(T.fence) + x + 1, 2, 0xb08858, 1, 13); }
  // bridge
  px(c, at(T.bridge), 0, 0x2f6fc0, 16, 16); px(c, at(T.bridge), 1, 0xb88a52, 16, 14); for (let x = 0; x < 16; x += 4) px(c, at(T.bridge) + x, 1, 0x8a6236, 1, 14); px(c, at(T.bridge), 1, 0x6b4220, 16, 1); px(c, at(T.bridge), 14, 0x6b4220, 16, 1);
  // plaza
  stoneFloor(c, at(T.plaza), 0xb8b0a0, 0x8a8478);
  // dungeon floors
  stoneFloor(c, at(T.dfloor), 0x4a4058, 0x2e2638); stoneFloor(c, at(T.dfloor2), 0x463c52, 0x2e2638);
  for (let i = 0; i < 3; i++) px(c, at(T.dfloor2) + 2 + Math.floor(rnd() * 12), 2 + Math.floor(rnd() * 12), 0x6a5a7a);
  // dungeon walls
  px(c, at(T.dwallTop), 0, 0x2a2238, 16, 16); for (let i = 0; i < 5; i++) { const x = Math.floor(rnd() * 12), y = Math.floor(rnd() * 12); px(c, at(T.dwallTop) + x, y, 0x382e4a, 4, 3); px(c, at(T.dwallTop) + x, y, 0x463a5a, 4, 1); px(c, at(T.dwallTop) + x, y + 3, 0x1a1424, 4, 1); }
  px(c, at(T.dwall), 0, 0x3a3048, 16, 16);
  for (let y = 0; y < 16; y += 5) for (let x = (y / 5) % 2 ? 0 : 4; x < 16; x += 8) { px(c, at(T.dwall) + x, y, 0x52466a, 7, 4); px(c, at(T.dwall) + x, y, 0x64587e, 7, 1); }
  px(c, at(T.dwall), 14, 0x1e1828, 16, 2);
  // rock
  stoneFloor(c, at(T.rock), 0x4a4058, 0x2e2638);
  c.fillStyle = hex(0x6a6078); c.beginPath(); c.ellipse(at(T.rock) + 8, 9, 7, 6, 0, 0, 7); c.fill(); px(c, at(T.rock) + 3, 5, 0x8a80a0, 5, 2); px(c, at(T.rock) + 9, 11, 0x40384e, 5, 2);
  // lava crack floor
  stoneFloor(c, at(T.lava), 0x3e3446, 0x2a2232);
  for (let x = 0; x < 16; x++) { const y = 8 + Math.round(Math.sin(x * 0.9) * 3); px(c, at(T.lava) + x, y, 0xff7a2a); px(c, at(T.lava) + x, y + 1, 0xffc860); }
  // interior
  px(c, at(T.wood), 0, 0xa8784a, 16, 16); for (let y = 0; y < 16; y += 4) { px(c, at(T.wood), y, 0x8a5e36, 16, 1); px(c, at(T.wood) + ((y * 5) % 16), y + 1, 0x8a5e36, 1, 3); } 
  px(c, at(T.iwall), 0, 0xe8dcc0, 16, 16); px(c, at(T.iwall), 10, 0x9a6e44, 16, 6); px(c, at(T.iwall), 10, 0xc89a64, 16, 1); for (let x = 2; x < 16; x += 5) px(c, at(T.iwall) + x, 0, 0xd8ccb0, 1, 10);
  px(c, at(T.counter), 0, 0xa8784a, 16, 16); px(c, at(T.counter), 2, 0x7a4a24, 16, 12); px(c, at(T.counter), 2, 0xc89060, 16, 3); px(c, at(T.counter), 13, 0x4a2c15, 16, 1);
  px(c, at(T.rug), 0, 0xa8784a, 16, 16); px(c, at(T.rug) + 1, 1, 0x9a2f3a, 14, 14); px(c, at(T.rug) + 3, 3, 0xd8a040, 10, 10); px(c, at(T.rug) + 4, 4, 0x9a2f3a, 8, 8); px(c, at(T.rug) + 7, 5, 0xd8a040, 2, 6);
  // bush & hedge
  grassBase(c, at(T.bush), 0); c.fillStyle = 'rgba(20,40,20,0.4)'; c.fillRect(at(T.bush) + 2, 12, 12, 3);
  for (let y = 2; y < 14; y++) for (let x = 1; x < 15; x++) { const dx = x - 7.5, dy = y - 8; if (dx * dx / 49 + dy * dy / 36 < 1) px(c, at(T.bush) + x, y, dx + dy < -4 ? 0x7ac86a : dx + dy > 4 ? 0x2f6b30 : 0x4a9a48); }
  px(c, at(T.bush) + 5, 6, 0xff6b8a); px(c, at(T.bush) + 10, 9, 0xff6b8a);
  px(c, at(T.hedge), 0, 0x3a7a3a, 16, 16); for (let i = 0; i < 40; i++) px(c, at(T.hedge) + Math.floor(rnd() * 16), Math.floor(rnd() * 14), rnd() < 0.5 ? 0x5aa050 : 0x2a5a2c); px(c, at(T.hedge), 14, 0x1f3f20, 16, 2);
  // stairs
  stoneFloor(c, at(T.stairsD), 0x4a4058, 0x2e2638); for (let i = 0; i < 4; i++) px(c, at(T.stairsD) + 2 + i, 2 + i * 3, shade(0x4a4058, 1 - i * 0.18), 12 - i * 2, 3); px(c, at(T.stairsD) + 6, 12, 0x0a0810, 4, 3);
  stoneFloor(c, at(T.stairsU), 0x4a4058, 0x2e2638); for (let i = 0; i < 4; i++) px(c, at(T.stairsU) + 1, 2 + i * 3, shade(0x8a80a0, 1 - i * 0.12), 14, 2);
  // well
  grassBase(c, at(T.well), 0); c.fillStyle = hex(0x8a8478); c.beginPath(); c.ellipse(at(T.well) + 8, 9, 7, 6, 0, 0, 7); c.fill(); c.fillStyle = hex(0x1a2a4a); c.beginPath(); c.ellipse(at(T.well) + 8, 8, 4, 3, 0, 0, 7); c.fill(); px(c, at(T.well) + 2, 1, 0x6b4220, 1, 8); px(c, at(T.well) + 13, 1, 0x6b4220, 1, 8); px(c, at(T.well) + 1, 0, 0xc0453a, 14, 2);
  // cliff
  px(c, at(T.cliff), 0, 0x8a6a4a, 16, 16); for (let y = 0; y < 16; y += 3) px(c, at(T.cliff) + ((y * 7) % 10), y, 0x6a4a32, 6, 1); px(c, at(T.cliff), 0, 0xa8845a, 16, 1); px(c, at(T.cliff), 15, 0x4a3222, 16, 1);
  grassBase(c, at(T.cliffTop), 0); px(c, at(T.cliffTop), 12, 0x8a6a4a, 16, 4); px(c, at(T.cliffTop), 11, 0x3f7f3a, 16, 1);
  // furniture
  px(c, at(T.bed), 0, 0xa8784a, 16, 16); px(c, at(T.bed) + 2, 1, 0x6b4220, 12, 15); px(c, at(T.bed) + 3, 2, 0xffffff, 10, 4); px(c, at(T.bed) + 3, 6, 0x3d64b0, 10, 9); px(c, at(T.bed) + 3, 6, 0x5a84d0, 10, 1);
  px(c, at(T.shelf), 0, 0x6b4220, 16, 16); for (let y = 1; y < 15; y += 5) { px(c, at(T.shelf) + 1, y, 0x3a2412, 14, 4); for (let x = 1; x < 15; x += 2) px(c, at(T.shelf) + x, y + (x % 3 ? 0 : 1), [0xc0453a, 0x3d64b0, 0x4a9a48, 0xd8a040][x % 4], 1, 4 - (x % 3 ? 0 : 1)); }
  px(c, at(T.barrel), 0, 0xa8784a, 16, 16); px(c, at(T.barrel) + 3, 1, 0x8a5a2b, 10, 14); px(c, at(T.barrel) + 3, 3, 0x4a4a52, 10, 1); px(c, at(T.barrel) + 3, 11, 0x4a4a52, 10, 1); px(c, at(T.barrel) + 4, 1, 0xb07a44, 2, 14);
  px(c, at(T.crate), 0, 0xa8784a, 16, 16); px(c, at(T.crate) + 2, 2, 0xc89a5a, 12, 12); px(c, at(T.crate) + 2, 2, 0x8a6236, 12, 1); px(c, at(T.crate) + 2, 13, 0x8a6236, 12, 1); for (let i = 0; i < 12; i++) px(c, at(T.crate) + 2 + i, 2 + i, 0x8a6236);
  px(c, at(T.void), 0, 0x05040a, 16, 16);
  // sky / spire
  px(c, at(T.sky), 0, 0x14102a, 16, 16); for (let i = 0; i < 4; i++) px(c, at(T.sky) + Math.floor(rnd() * 16), Math.floor(rnd() * 16), 0x8a8ad0);
  stoneFloor(c, at(T.starTile), 0x6a6498, 0x48427a); px(c, at(T.starTile) + 7, 5, 0xc8a85e, 2, 6); px(c, at(T.starTile) + 5, 7, 0xc8a85e, 6, 2); px(c, at(T.starTile) + 7, 7, 0xffe8a0, 2, 2);
  stoneFloor(c, at(T.glow), 0x4a4058, 0x2e2638); px(c, at(T.glow) + 5, 5, 0x6fd3ff, 6, 6); px(c, at(T.glow) + 6, 6, 0xd0f4ff, 4, 4);
  // lamp post (on plaza)
  stoneFloor(c, at(T.lamp), 0xb8b0a0, 0x8a8478); px(c, at(T.lamp) + 7, 4, 0x2a2a3a, 2, 11); px(c, at(T.lamp) + 5, 0, 0x2a2a3a, 6, 1); px(c, at(T.lamp) + 5, 1, 0xffd77a, 6, 4); px(c, at(T.lamp) + 6, 2, 0xfff6d0, 4, 2); px(c, at(T.lamp) + 5, 14, 0x2a2a3a, 6, 2);
  grassBase(c, at(T.sign), 0); px(c, at(T.sign) + 7, 8, 0x6b4220, 2, 7); px(c, at(T.sign) + 2, 2, 0xc89a64, 12, 7); px(c, at(T.sign) + 2, 2, 0x7a5232, 12, 1); px(c, at(T.sign) + 4, 4, 0x4a2c15, 8, 1); px(c, at(T.sign) + 4, 6, 0x4a2c15, 6, 1);
  px(c, at(T.table), 0, 0xa8784a, 16, 16); px(c, at(T.table) + 1, 3, 0xc89060, 14, 8); px(c, at(T.table) + 1, 11, 0x7a4a24, 14, 2); px(c, at(T.table) + 2, 13, 0x5a3418, 2, 3); px(c, at(T.table) + 12, 13, 0x5a3418, 2, 3); px(c, at(T.table) + 6, 4, 0xffffff, 3, 2); px(c, at(T.table) + 10, 5, 0xd8a040, 2, 3);
  px(c, at(T.hearth), 0, 0xe8dcc0, 16, 16); px(c, at(T.hearth), 2, 0x8a8478, 16, 14); px(c, at(T.hearth) + 3, 6, 0x1a1010, 10, 10); px(c, at(T.hearth) + 5, 10, 0xff7a2a, 6, 6); px(c, at(T.hearth) + 6, 9, 0xffc860, 4, 5); px(c, at(T.hearth) + 7, 8, 0xfff0a0, 2, 3); px(c, at(T.hearth), 2, 0xa8a090, 16, 2);
  // star statue (save point base)
  stoneFloor(c, at(T.statue), 0xb8b0a0, 0x8a8478); px(c, at(T.statue) + 3, 10, 0x8a8478, 10, 5); px(c, at(T.statue) + 4, 10, 0xd0c8b8, 8, 1); px(c, at(T.statue) + 6, 3, 0xd0c8b8, 4, 7); px(c, at(T.statue) + 9, 3, 0x9a9488, 1, 7);
  // path fringes (grass growing over path edge), drawn on transparent tiles
  const fringe = (k: number, side: 'N' | 'S' | 'W' | 'E') => {
    const x0 = at(k);
    for (let i = 0; i < 16; i++) {
      const d = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < d; j++) {
        const col = j === d - 1 ? 0x3f7f3a : 0x4f9a46;
        if (side === 'N') px(c, x0 + i, j, col); if (side === 'S') px(c, x0 + i, 15 - j, col);
        if (side === 'W') px(c, x0 + j, i, col); if (side === 'E') px(c, x0 + 15 - j, i, col);
      }
    }
  };
  fringe(T.edgeN, 'N'); fringe(T.edgeS, 'S'); fringe(T.edgeW, 'W'); fringe(T.edgeE, 'E');
  const shore = (k: number, side: 'N' | 'S' | 'W' | 'E') => {
    const x0 = at(k);
    for (let i = 0; i < 16; i++) { const d = 2 + (Math.sin(i * 1.3) > 0 ? 1 : 0);
      for (let j = 0; j < d; j++) { const col = j === 0 ? 0x3f7f3a : j === d - 1 ? 0xd8f0ff : 0x8ac0e8;
        if (side === 'N') px(c, x0 + i, j, col); if (side === 'S') px(c, x0 + i, 15 - j, col);
        if (side === 'W') px(c, x0 + j, i, col); if (side === 'E') px(c, x0 + 15 - j, i, col); } }
  };
  shore(T.shoreN, 'N'); shore(T.shoreS, 'S'); shore(T.shoreW, 'W'); shore(T.shoreE, 'E');
  tex.refresh();
  // make individual frames for tilemap (Phaser tilemap reads from image)
}

/** Generic blob painter with directional light & auto outline, used for monsters. */
class Pix {
  d: number[]; constructor(public w: number, public h: number) { this.d = new Array(w * h).fill(-1); }
  set(x: number, y: number, c: number) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = c; }
  get(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.d[y * this.w + x] : -1; }
  /** shaded ellipse */
  ell(cx: number, cy: number, rx: number, ry: number, base: number, light = true) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, r = nx * nx + ny * ny;
      if (r > 1) continue;
      if (!light) { this.set(x, y, base); continue; }
      const l = -nx * 0.6 - ny * 0.8 + (1 - r) * 0.5;
      this.set(x, y, l > 0.75 ? shade(base, 1.45) : l > 0.25 ? shade(base, 1.12) : l > -0.35 ? base : l > -0.8 ? shade(base, 0.72) : shade(base, 0.52));
    }
  }
  rect(x: number, y: number, w: number, h: number, c: number) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  poly(pts: [number, number][], base: number) {
    let minY = 1e9, maxY = -1e9; pts.forEach(p => { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    for (let y = Math.floor(minY); y <= maxY; y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= y + 0.5) !== (b[1] <= y + 0.5)) xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, base);
    }
  }
  outline(c = 0x1b1428) {
    const s = this.d.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (s[y * this.w + x] === -1 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const v = (x + a >= 0 && x + a < this.w && y + b >= 0 && y + b < this.h) ? s[(y + b) * this.w + x + a] : -1; return v !== -1; })) this.d[y * this.w + x] = c;
  }
  mirror() { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w / 2; x++) { const v = this.d[y * this.w + x]; if (v !== -1) this.d[y * this.w + this.w - 1 - x] = v; } }
  toTex(scene: Phaser.Scene, key: string) {
    const t = scene.textures.createCanvas(key, this.w, this.h)!; const ctx = t.getContext(); const img = ctx.createImageData(this.w, this.h);
    this.d.forEach((c, i) => { if (c < 0) return; img.data[i * 4] = c >> 16 & 255; img.data[i * 4 + 1] = c >> 8 & 255; img.data[i * 4 + 2] = c & 255; img.data[i * 4 + 3] = 255; });
    ctx.putImageData(img, 0, 0); t.refresh();
    this.toHd(scene, key + '_hd');
  }
  /** EPX/Scale2x upscale + rim light + ambient occlusion: the large battle version of a monster. */
  toHd(scene: Phaser.Scene, key: string) {
    const w = this.w, h = this.h, W2 = w * 2, H2 = h * 2, o = new Array(W2 * H2).fill(-1);
    const g = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h) ? -1 : this.d[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const P = g(x, y), A = g(x, y - 1), B = g(x + 1, y), C = g(x - 1, y), D = g(x, y + 1);
      let e1 = P, e2 = P, e3 = P, e4 = P;
      if (C === A && C !== D && A !== B) e1 = A; if (A === B && A !== C && B !== D) e2 = B;
      if (D === C && D !== B && C !== A) e3 = C; if (B === D && B !== A && D !== C) e4 = D;
      o[(y * 2) * W2 + x * 2] = e1; o[(y * 2) * W2 + x * 2 + 1] = e2; o[(y * 2 + 1) * W2 + x * 2] = e3; o[(y * 2 + 1) * W2 + x * 2 + 1] = e4;
    }
    const lum = (c: number) => ((c >> 16 & 255) * 3 + (c >> 8 & 255) * 6 + (c & 255)) / 10;
    const t = scene.textures.createCanvas(key, W2, H2)!; const ctx = t.getContext(); const img = ctx.createImageData(W2, H2);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) {
      let c = o[y * W2 + x]; if (c < 0) continue;
      if (lum(c) > 40) {
        const up = y > 1 ? o[(y - 2) * W2 + x] : -1, lf = x > 1 ? o[y * W2 + x - 2] : -1;
        const dn = y < H2 - 3 ? o[(y + 3) * W2 + x] : -1;
        let f = 1 - 0.18 * (y / H2);                       // top-lit gradient
        if (up < 0 || lum(up) < 40) f += 0.22;            // rim light from above
        else if (lf < 0 || lum(lf) < 40) f += 0.12;
        if (dn < 0 || lum(dn) < 40) f -= 0.14;            // occlusion near the base
        if (((x + y) & 1) && f < 0.86) f -= 0.05;         // dithered shadow
        c = shade(c, f);
      }
      const i = (y * W2 + x) * 4; img.data[i] = c >> 16 & 255; img.data[i + 1] = c >> 8 & 255; img.data[i + 2] = c & 255; img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); t.refresh();
  }
}

export function makeMonsters(scene: Phaser.Scene) {
  // Glimmerblob: translucent star-jelly
  let p = new Pix(32, 32);
  p.ell(16, 20, 13, 10, 0x55c6e8); p.ell(16, 13, 7, 7, 0x55c6e8); p.set(16, 5, 0x55c6e8); p.set(16, 4, 0x55c6e8); p.set(17, 3, 0x9ae6ff);
  p.ell(11, 13, 3, 3, 0xffffff, false); p.ell(21, 13, 3, 3, 0xffffff, false); p.rect(11, 13, 2, 3, 0x1b1428); p.rect(21, 13, 2, 3, 0x1b1428); p.set(11, 13, 0xffffff); p.set(21, 13, 0xffffff);
  for (let x = 12; x < 21; x++) p.set(x, 20 + Math.round(Math.sin((x - 12) / 8 * Math.PI) * 2), 0x1b1428);
  p.set(9, 18, 0xff9ac0); p.set(10, 18, 0xff9ac0); p.set(22, 18, 0xff9ac0); p.set(23, 18, 0xff9ac0); p.rect(7, 22, 3, 2, 0xd8f6ff);
  p.outline(); p.toTex(scene, 'm_glimmer');
  // Thornhare
  p = new Pix(32, 32);
  p.poly([[9, 2], [12, 2], [13, 14], [9, 14]], 0xc89a6a); p.poly([[19, 1], [22, 1], [22, 14], [18, 14]], 0xc89a6a); p.rect(10, 4, 2, 8, 0xf0a0b0); p.rect(20, 3, 1, 9, 0xf0a0b0);
  p.ell(16, 21, 11, 9, 0xc89a6a); p.ell(16, 16, 8, 6, 0xd8ac7a);
  for (let i = 0; i < 6; i++) { p.poly([[6 + i * 4, 15], [8 + i * 4, 9 + (i % 2) * 2], [10 + i * 4, 15]], 0x4a8a3a); }
  p.rect(12, 16, 2, 2, 0x1b1428); p.rect(19, 16, 2, 2, 0x1b1428); p.set(12, 16, 0xffffff); p.set(19, 16, 0xffffff); p.rect(15, 19, 2, 1, 0x7a3a3a); p.rect(15, 20, 2, 2, 0xffffff);
  p.ell(9, 28, 4, 2, 0xb08050); p.ell(23, 28, 4, 2, 0xb08050); p.outline(); p.toTex(scene, 'm_hare');
  // Duskbat
  p = new Pix(32, 32);
  p.poly([[1, 8], [10, 12], [13, 20], [8, 18], [5, 21], [3, 16]], 0x5a3a8a); p.poly([[31, 8], [22, 12], [19, 20], [24, 18], [27, 21], [29, 16]], 0x5a3a8a);
  p.poly([[3, 10], [9, 13], [6, 15]], 0x7a5aaa); p.poly([[29, 10], [23, 13], [26, 15]], 0x7a5aaa);
  p.ell(16, 17, 7, 7, 0x6a4a9a); p.poly([[10, 12], [11, 5], [14, 11]], 0x6a4a9a); p.poly([[22, 12], [21, 5], [18, 11]], 0x6a4a9a);
  p.rect(12, 15, 3, 2, 0xffd34e); p.rect(18, 15, 3, 2, 0xffd34e); p.set(13, 15, 0x1b1428); p.set(19, 15, 0x1b1428); p.set(14, 20, 0xffffff); p.set(18, 20, 0xffffff); p.rect(14, 19, 5, 1, 0x2a1a3a);
  p.outline(); p.toTex(scene, 'm_bat');
  // Mossback turtle
  p = new Pix(32, 32);
  p.ell(7, 24, 4, 3, 0x8ab060); p.ell(25, 26, 3, 3, 0x8ab060); p.ell(9, 27, 3, 3, 0x8ab060);
  p.ell(15, 18, 12, 9, 0x6a8a3a); for (let i = 0; i < 5; i++) p.ell(8 + i * 4, 15 + (i % 2) * 4, 2, 2, 0x8aa84a);
  p.ell(10, 10, 3, 3, 0x5aa040); p.ell(18, 9, 4, 3, 0x4a9a3a); p.set(18, 6, 0xff6b8a); p.set(11, 7, 0xffd34e);
  p.ell(27, 18, 4, 4, 0x9ac070); p.rect(27, 17, 2, 2, 0x1b1428); p.set(28, 17, 0xffffff); p.rect(15, 26, 14, 1, 0x4a5a2a);
  p.outline(); p.toTex(scene, 'm_turtle');
  // Cinder Imp
  p = new Pix(32, 32);
  p.poly([[16, 26], [6, 30], [10, 24]], 0xc0453a); p.ell(16, 20, 7, 8, 0xd0503a); p.ell(16, 11, 8, 7, 0xe06040);
  p.poly([[9, 8], [6, 1], [12, 6]], 0x3a2a2a); p.poly([[23, 8], [26, 1], [20, 6]], 0x3a2a2a);
  p.rect(11, 10, 3, 2, 0xffe060); p.rect(18, 10, 3, 2, 0xffe060); p.set(12, 10, 0x1b1428); p.set(19, 10, 0x1b1428);
  for (let x = 12; x < 21; x++) p.set(x, 15 - (x % 2), 0x3a1a1a); p.set(13, 15, 0xffffff); p.set(19, 15, 0xffffff);
  p.ell(16, 3, 2, 2, 0xffb040); p.set(16, 1, 0xffe080); p.ell(5, 19, 2, 3, 0xe06040); p.ell(27, 19, 2, 3, 0xe06040);
  p.ell(27, 13, 2, 2, 0xffc040); p.set(27, 11, 0xffffff); p.outline(); p.toTex(scene, 'm_imp');
  // Hollow Squire: empty armor
  p = new Pix(32, 32);
  p.rect(26, 2, 1, 28, 0x8a6a4a); p.poly([[24, 4], [26, 0], [28, 4], [26, 6]], 0xa0a0a8);
  p.ell(15, 21, 8, 8, 0x7a8090); p.rect(9, 26, 4, 5, 0x6a7080); p.rect(17, 26, 4, 5, 0x6a7080);
  p.ell(15, 10, 6, 6, 0x8a90a0); p.rect(10, 9, 10, 2, 0x0a0810); p.set(12, 9, 0x6fd3ff); p.set(17, 9, 0x6fd3ff);
  p.ell(7, 18, 3, 3, 0x8a90a0); p.ell(23, 18, 3, 3, 0x8a90a0); p.rect(12, 18, 6, 1, 0x4a5060); p.rect(14, 15, 2, 10, 0x9aa0b0);
  for (let i = 0; i < 6; i++) p.set(9 + i * 2, 24 + (i % 2), 0x8a5a2b);
  p.outline(); p.toTex(scene, 'm_squire');
  // Boss: Hollow Warden 64x64 - stone colossus with ember heart
  p = new Pix(64, 64);
  p.ell(10, 34, 8, 12, 0x6a6078); p.ell(54, 34, 8, 12, 0x6a6078); p.ell(9, 48, 7, 6, 0x5a5068); p.ell(55, 48, 7, 6, 0x5a5068);
  p.ell(20, 56, 8, 7, 0x5a5068); p.ell(44, 56, 8, 7, 0x5a5068);
  p.ell(32, 36, 19, 18, 0x7a7090); p.ell(32, 14, 11, 10, 0x8a80a0);
  p.poly([[22, 8], [16, 0], [26, 6]], 0x3a3048); p.poly([[42, 8], [48, 0], [38, 6]], 0x3a3048);
  for (let i = 0; i < 9; i++) { p.set(18 + i * 3, 28 + (i % 3) * 7, 0x5a5068); p.set(19 + i * 3, 29 + (i % 3) * 7, 0x5a5068); }
  p.ell(32, 36, 7, 7, 0xff7a2a); p.ell(32, 36, 4, 4, 0xffc860, false); p.ell(31, 35, 2, 2, 0xfff6d0, false);
  for (let a = 0; a < 6; a++) for (let r = 7; r < 15; r++) { const x = 32 + Math.cos(a) * r, y = 36 + Math.sin(a) * r; p.set(x + Math.sin(r) * 1.2, y, r < 11 ? 0xff7a2a : 0xc04020); }
  p.rect(25, 13, 5, 3, 0x0a0810); p.rect(34, 13, 5, 3, 0x0a0810); p.rect(26, 14, 3, 1, 0xff7a2a); p.rect(35, 14, 3, 1, 0xff7a2a);
  p.rect(26, 19, 12, 2, 0x2a2232); for (let x = 27; x < 38; x += 2) p.set(x, 19, 0xff7a2a);
  p.ell(12, 26, 4, 3, 0x9a90b0); p.ell(52, 26, 4, 3, 0x9a90b0); p.ell(30, 10, 3, 2, 0xa8a0c0);
  p.outline(); p.toTex(scene, 'm_warden');
}

export function makeFx(scene: Phaser.Scene) {
  const g = (key: string, w: number, h: number, fn: (c: Ctx) => void) => { const t = scene.textures.createCanvas(key, w, h)!; fn(t.getContext()); t.refresh(); };
  g('light', 128, 128, c => { const gr = c.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); });
  g('dot', 4, 4, c => { c.fillStyle = '#fff'; c.fillRect(0, 0, 4, 4); });
  g('px', 2, 2, c => { c.fillStyle = '#fff'; c.fillRect(0, 0, 2, 2); });
  g('spark', 8, 8, c => { c.fillStyle = '#fff'; c.fillRect(3, 0, 2, 8); c.fillRect(0, 3, 8, 2); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(2, 2, 4, 4); });
  g('star', 16, 16, c => { c.fillStyle = '#fff'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 8, a = i * Math.PI / 5 - Math.PI / 2; c.lineTo(8 + Math.cos(a) * r, 8 + Math.sin(a) * r); } c.fill(); });
  g('shadow', 16, 6, c => { c.fillStyle = 'rgba(10,6,20,0.38)'; c.beginPath(); c.ellipse(8, 3, 7, 2.5, 0, 0, 7); c.fill(); });
  g('slash', 48, 48, c => { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.arc(4, 44, 40, -Math.PI / 2, 0); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 8; c.stroke(); });
  g('ring', 64, 64, c => { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(32, 32, 29, 0, 7); c.stroke(); });
  g('vignette', 256, 256, c => { const gr = c.createRadialGradient(128, 128, 60, 128, 128, 182); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,8,0.85)'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256); });
  // chest (2 frames), save crystal, warp glow, exclamation
  const chest = (c: Ctx, x: number, open: boolean) => {
    px(c, x + 1, 5, 0x1b1428, 14, 11); px(c, x + 2, 6, 0x9a5a2a, 12, 9); px(c, x + 2, 6, 0xc07a3a, 12, 1); px(c, x + 2, 10, 0xd8a040, 12, 1); px(c, x + 7, 9, 0xf0d060, 2, 3);
    if (!open) { px(c, x + 1, 2, 0x1b1428, 14, 4); px(c, x + 2, 3, 0xb06a32, 12, 3); px(c, x + 2, 3, 0xd08a4a, 12, 1); }
    else { px(c, x + 1, 1, 0x1b1428, 14, 4); px(c, x + 2, 2, 0x5a3418, 12, 3); px(c, x + 3, 6, 0x2a1a10, 10, 3); }
  };
  g('chest', 32, 16, c => { chest(c, 0, false); chest(c, 16, true); });
  scene.textures.get('chest').add(0, 0, 0, 0, 16, 16); scene.textures.get('chest').add(1, 0, 16, 0, 16, 16);
  g('crystal', 16, 24, c => { c.fillStyle = '#1b1428'; c.beginPath(); c.moveTo(8, 0); c.lineTo(15, 9); c.lineTo(8, 23); c.lineTo(1, 9); c.fill(); c.fillStyle = '#6fd3ff'; c.beginPath(); c.moveTo(8, 2); c.lineTo(13, 9); c.lineTo(8, 21); c.lineTo(3, 9); c.fill(); c.fillStyle = '#d8f6ff'; c.beginPath(); c.moveTo(8, 2); c.lineTo(5, 9); c.lineTo(8, 12); c.fill(); c.fillStyle = '#3a8ad8'; c.beginPath(); c.moveTo(8, 12); c.lineTo(13, 9); c.lineTo(8, 21); c.fill(); });
  g('bang', 8, 12, c => { px(c, 2, 0, 0x1b1428, 4, 12); px(c, 3, 1, 0xffd34e, 2, 6); px(c, 3, 9, 0xffd34e, 2, 2); });
  g('joyBase', 160, 160, c => { c.fillStyle = 'rgba(255,255,255,0.10)'; c.beginPath(); c.arc(80, 80, 76, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 4; c.stroke(); });
  g('joyKnob', 72, 72, c => { const gr = c.createRadialGradient(28, 26, 4, 36, 36, 36); gr.addColorStop(0, 'rgba(255,240,200,0.95)'); gr.addColorStop(1, 'rgba(240,170,80,0.75)'); c.fillStyle = gr; c.beginPath(); c.arc(36, 36, 34, 0, 7); c.fill(); });
  // battle backdrops (generated gradients + silhouettes), 180x110 upscaled
  const bd = (key: string, top: string, bot: string, ground: number, deco: (c: Ctx) => void) => g(key, 180, 120, c => {
    const gr = c.createLinearGradient(0, 0, 0, 120); gr.addColorStop(0, top); gr.addColorStop(1, bot); c.fillStyle = gr; c.fillRect(0, 0, 180, 120); deco(c);
    for (let y = 80; y < 120; y++) { const t = (y - 80) / 40; c.fillStyle = hex(shade(ground, 0.75 + t * 0.4)); c.fillRect(0, y, 180, 1); }
    seed = 99; for (let i = 0; i < 90; i++) { const y = 82 + Math.floor(rnd() * 38); c.fillStyle = hex(shade(ground, 0.6 + rnd() * 0.7)); c.fillRect(Math.floor(rnd() * 180), y, 2 + Math.floor((y - 80) / 8), 1); }
  });
  bd('bg_fields', '#7ec8f0', '#f0e0b0', 0x4f9a46, c => {
    c.fillStyle = '#ffffff'; for (const [x, y, w] of [[20, 18, 30], [110, 10, 40], [150, 30, 22]]) { c.fillRect(x, y, w, 5); c.fillRect(x + 5, y - 3, w - 12, 3); }
    c.fillStyle = '#8ab0c8'; c.beginPath(); c.moveTo(0, 70); c.lineTo(40, 40); c.lineTo(70, 62); c.lineTo(110, 30); c.lineTo(150, 58); c.lineTo(180, 44); c.lineTo(180, 82); c.lineTo(0, 82); c.fill();
    c.fillStyle = '#5a9a5a'; c.beginPath(); c.moveTo(0, 76); for (let x = 0; x <= 180; x += 10) c.lineTo(x, 70 + Math.sin(x * 0.07) * 5); c.lineTo(180, 82); c.lineTo(0, 82); c.fill();
    c.fillStyle = '#2f6b30'; for (let x = 4; x < 180; x += 13) { c.beginPath(); c.arc(x, 74, 6, 0, 7); c.fill(); }
  });
  bd('bg_hollow', '#120e1e', '#3a2a40', 0x463c52, c => {
    c.fillStyle = '#241c32'; for (let x = 0; x < 180; x += 18) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 9, 22 + (x % 5) * 4); c.lineTo(x + 18, 0); c.fill(); }
    c.fillStyle = '#2e2440'; c.fillRect(0, 50, 180, 32); for (let x = 0; x < 180; x += 24) { c.fillStyle = '#3a3050'; c.fillRect(x, 50, 20, 30); }
    c.fillStyle = 'rgba(255,122,42,0.6)'; for (let x = 10; x < 180; x += 40) c.fillRect(x, 60 + (x % 3) * 4, 2, 2);
  });
  bd('bg_boss', '#1a0808', '#5a1a10', 0x3e3446, c => {
    const gr = c.createRadialGradient(90, 60, 5, 90, 60, 90); gr.addColorStop(0, 'rgba(255,120,40,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 180, 120);
    c.fillStyle = '#2a1a20'; for (let x = 0; x < 180; x += 30) { c.fillRect(x + 4, 20, 10, 62); c.fillStyle = '#3a2430'; c.fillRect(x + 4, 20, 3, 62); c.fillStyle = '#2a1a20'; }
  });
  // item icons 12x12
  const icons: Record<string, (c: Ctx) => void> = {
    leaf: c => { c.fillStyle = '#4ab04a'; c.beginPath(); c.ellipse(6, 6, 5, 3, -0.7, 0, 7); c.fill(); px(c, 2, 9, 0x2f6b30, 6, 1); },
    leaf2: c => { c.fillStyle = '#c89a5a'; c.fillRect(5, 2, 2, 9); c.fillStyle = '#7ac74f'; c.fillRect(3, 1, 6, 3); },
    drop: c => { c.fillStyle = '#6fd3ff'; c.beginPath(); c.moveTo(6, 1); c.lineTo(10, 7); c.arc(6, 7, 4, 0, Math.PI); c.fill(); px(c, 4, 6, 0xffffff); },
    feather: c => { c.fillStyle = '#ff9a40'; c.beginPath(); c.ellipse(6, 6, 2, 5, 0.6, 0, 7); c.fill(); px(c, 3, 9, 0xffe080, 2, 2); },
    bomb: c => { c.fillStyle = '#3a3048'; c.beginPath(); c.arc(6, 7, 4, 0, 7); c.fill(); px(c, 7, 1, 0xff7a2a, 2, 2); },
    sword: c => { px(c, 9, 1, 0xdfe6ee, 2, 2); for (let i = 0; i < 7; i++) px(c, 8 - i, 2 + i, 0xdfe6ee, 2, 1); px(c, 1, 8, 0xd8a040, 4, 1); px(c, 1, 9, 0x6b4220, 2, 2); },
    dagger: c => { for (let i = 0; i < 4; i++) px(c, 8 - i, 3 + i, 0xeeeeee, 2, 1); px(c, 3, 7, 0x7a3b8f, 3, 1); px(c, 2, 8, 0x6b4220, 2, 2); },
    axe: c => { for (let i = 0; i < 9; i++) px(c, 2 + i, 10 - i, 0x8a5a2b); px(c, 7, 1, 0xc79a4a, 4, 5); },
    staff: c => { for (let i = 0; i < 8; i++) px(c, 2 + i, 10 - i, 0x8a5a2b); px(c, 8, 0, 0x6fd3ff, 3, 3); },
    mace: c => { for (let i = 0; i < 6; i++) px(c, 2 + i, 10 - i, 0x6b4220); px(c, 7, 1, 0xf0c75e, 4, 4); },
    shield: c => { c.fillStyle = '#9c6b3a'; c.beginPath(); c.arc(6, 6, 5, 0, 7); c.fill(); px(c, 5, 5, 0xd8b04a, 2, 2); },
    hat: c => { c.fillStyle = '#4a3a8f'; c.beginPath(); c.moveTo(6, 0); c.lineTo(10, 9); c.lineTo(2, 9); c.fill(); px(c, 0, 9, 0x4a3a8f, 12, 2); },
    helm: c => { c.fillStyle = '#b8c0cc'; c.beginPath(); c.arc(6, 7, 5, Math.PI, 0); c.fill(); c.fillRect(1, 7, 10, 3); px(c, 5, 0, 0xd9534f, 2, 3); },
    armor: c => { px(c, 2, 2, 0x8a5a2b, 8, 9); px(c, 0, 2, 0x8a5a2b, 12, 3); px(c, 5, 2, 0x5a3818, 2, 2); },
    armor2: c => { px(c, 2, 2, 0xa8b4c4, 8, 9); px(c, 0, 2, 0xa8b4c4, 12, 3); px(c, 2, 5, 0x5d6b7d, 8, 1); px(c, 2, 8, 0x5d6b7d, 8, 1); },
    robe: c => { c.fillStyle = '#3a4f9f'; c.beginPath(); c.moveTo(4, 1); c.lineTo(8, 1); c.lineTo(11, 11); c.lineTo(1, 11); c.fill(); px(c, 5, 1, 0xf0c75e, 2, 10); },
    ring: c => { c.strokeStyle = '#f0c75e'; c.lineWidth = 2; c.beginPath(); c.arc(6, 7, 3, 0, 7); c.stroke(); px(c, 5, 2, 0x7ac74f, 3, 2); },
    cape: c => { c.fillStyle = '#8f2d3a'; c.beginPath(); c.moveTo(3, 1); c.lineTo(9, 1); c.lineTo(11, 11); c.lineTo(1, 11); c.fill(); },
    star: c => { c.fillStyle = '#ffe080'; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 5.5, a = i * Math.PI / 5 - Math.PI / 2; c.lineTo(6 + Math.cos(a) * r, 6 + Math.sin(a) * r); } c.fill(); },
  };
  for (const [k, fn] of Object.entries(icons)) g('ic_' + k, 12, 12, fn);
}
