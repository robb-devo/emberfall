/**
 * Round 5 (Adult): environmental-storytelling props for the dark world pass. World-scale single-frame sprites
 * ('npc_dk_*', drawn 1:1 like Turnip the mule) placed as examinable NPC props, only when Settings → Adult is on.
 */
import Phaser from 'phaser';
import { Pix } from '../systems/art';
import { shade } from '../systems/paperdoll';

const WOOD = 0x5a3e28, WOODD = 0x3a2618, IRON = 0x4a4a54, ROPE = 0x9a8058, FLESH = 0x9aa088, FLESHD = 0x6a7060, RAG = 0x4a3a34, BLOOD = 0x6a0a10, ASH = 0x4a4448, CHAR = 0x241c1c;
function line(p: Pix, x0: number, y0: number, x1: number, y1: number, c: number) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) p.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); }
function crow(p: Pix, x: number, y: number) { p.ell(x, y, 2, 1.4, 0x18141c); p.set(x - 2, y - 1, 0x18141c); p.set(x - 3, y - 1, 0xc8a040); p.set(x + 2, y, 0x18141c); }

export function makeDarkProps(scene: Phaser.Scene) {
  // gibbet: post, beam, chain, iron cage with a slumped body
  let p = new Pix(26, 46);
  p.rect(3, 4, 3, 42, WOOD); p.rect(5, 4, 1, 42, WOODD); p.rect(3, 4, 20, 3, WOOD); p.rect(3, 6, 20, 1, WOODD); line(p, 5, 14, 12, 6, WOOD);
  line(p, 18, 7, 18, 13, IRON);
  for (let y = 14; y <= 34; y++) for (const x of [12, 15, 18, 21, 24]) if (x !== 24 || y > 15) p.set(x - 1, y, IRON);
  p.rect(11, 14, 13, 1, IRON); p.rect(11, 34, 13, 1, IRON); p.rect(11, 24, 13, 1, shade(IRON, 0.8));
  p.ell(17, 19, 2.6, 2.8, FLESH); p.set(16, 19, 0x1a1418); p.set(18, 19, 0x1a1418); p.set(17, 21, 0x3a1418); // head, sunk eyes
  p.poly([[14, 22], [20, 22], [21, 31], [13, 31]], RAG); line(p, 13, 23, 11, 30, FLESHD); line(p, 21, 23, 23, 29, FLESHD);
  line(p, 15, 31, 14, 34, FLESHD); line(p, 19, 31, 21, 33, FLESHD); p.set(16, 26, BLOOD); p.set(17, 27, BLOOD);
  crow(p, 8, 3); crow(p, 20, 12);
  p.outline(); p.toTex(scene, 'npc_dk_gibbet');

  // hanged man on a gallows beam
  p = new Pix(22, 46);
  p.rect(2, 2, 3, 44, WOOD); p.rect(4, 2, 1, 44, WOODD); p.rect(2, 2, 18, 3, WOOD); line(p, 4, 12, 10, 4, WOOD);
  line(p, 15, 5, 15, 13, ROPE); p.ell(15, 16, 2.6, 3, FLESHD); p.set(14, 16, 0x1a1418); p.set(16, 15, 0x1a1418); p.rect(14, 13, 3, 1, ROPE);
  p.poly([[12, 19], [18, 19], [19, 31], [11, 31]], 0x3a4a5a); line(p, 12, 20, 12, 29, FLESHD); line(p, 18, 20, 18, 29, FLESHD);
  p.rect(13, 31, 2, 9, 0x2a2a34); p.rect(16, 31, 2, 8, 0x2a2a34); p.set(13, 40, 0x1a1418); p.set(17, 39, 0x1a1418);
  p.rect(11, 22, 8, 1, 0xc8b898); // the placard
  crow(p, 17, 1);
  p.outline(); p.toTex(scene, 'npc_dk_hanged');

  // corpse face-down in a pool
  p = new Pix(28, 14);
  p.ell(14, 10, 13, 3.6, BLOOD, false); p.ell(16, 10, 8, 2.4, shade(BLOOD, 0.7), false);
  p.ell(5, 7, 2.6, 2.4, 0x5a3a28); p.poly([[7, 5], [19, 5], [20, 10], [7, 10]], 0x5a5048); line(p, 8, 5, 4, 2, FLESH); line(p, 18, 9, 23, 11, FLESH);
  p.rect(19, 6, 6, 2, 0x3a3440); p.rect(19, 8, 7, 2, 0x34303a); p.set(10, 7, 0x2a2026); p.set(14, 8, BLOOD);
  p.outline(); p.toTex(scene, 'npc_dk_corpse');

  // gnawed adventurer: armour shell, bones, broken sword
  p = new Pix(26, 14);
  p.ell(13, 11, 11, 2.6, shade(BLOOD, 0.6), false);
  p.ell(5, 8, 3, 2.6, 0xd8d0b8); p.set(4, 8, 0x1a1418); p.set(6, 8, 0x1a1418); p.rect(4, 10, 3, 1, 0xd8d0b8);
  p.poly([[8, 6], [16, 6], [16, 11], [8, 11]], 0x7a8494); for (let x = 9; x < 16; x += 2) p.set(x, 8, 0x4a525e);
  line(p, 16, 8, 23, 6, 0xd8d0b8); line(p, 16, 10, 22, 12, 0xd8d0b8); p.set(23, 6, 0xf0e8d0); line(p, 9, 3, 14, 5, 0xc8d0d8); p.rect(14, 5, 2, 1, 0x6b4220);
  p.outline(); p.toTex(scene, 'npc_dk_bones');

  // burned stake with charred remains
  p = new Pix(18, 36);
  p.ell(9, 32, 8, 3, ASH); p.ell(9, 32, 5, 2, 0x2a2224); for (const [x, y] of [[4, 31], [12, 33], [8, 30], [14, 31]]) p.set(x, y, 0xff7a20);
  p.rect(8, 2, 3, 31, CHAR); p.rect(10, 2, 1, 31, 0x14100e);
  p.ell(9.5, 10, 2.4, 2.6, 0x1e1614); p.poly([[7, 13], [12, 13], [12, 24], [7, 24]], 0x1a1210); line(p, 7, 14, 5, 9, 0x1a1210); line(p, 12, 14, 14, 9, 0x1a1210);
  p.rect(6, 15, 7, 1, ROPE); p.rect(6, 21, 7, 1, ROPE); p.set(9, 10, 0xff9040);
  p.outline(); p.toTex(scene, 'npc_dk_stake');

  // burned house: charred frame, collapsed roof beams
  p = new Pix(40, 34);
  p.rect(1, 30, 38, 4, 0x2a2420); for (let x = 2; x < 38; x += 3) p.set(x, 29 + (x % 2), ASH);
  for (const x of [2, 13, 26, 36]) { p.rect(x, 8 + (x % 3) * 2, 3, 22 - (x % 3) * 2, CHAR); p.set(x + 1, 9 + (x % 3) * 2, 0x14100e); }
  line(p, 2, 9, 20, 1, CHAR); line(p, 3, 9, 21, 1, 0x14100e); line(p, 20, 1, 30, 10, CHAR); line(p, 14, 18, 38, 12, CHAR);
  p.rect(5, 20, 6, 10, 0x3a3230); p.rect(29, 18, 6, 12, 0x3a3230); p.rect(30, 22, 3, 3, 0x14100e);
  for (const [x, y] of [[8, 29], [20, 30], [31, 29], [17, 28]]) { p.set(x, y, 0xff6a20); p.set(x + 1, y, 0xffb040); }
  p.outline(); p.toTex(scene, 'npc_dk_ruin');

  // cult altar: ash sigil, black candles, stained slab
  p = new Pix(30, 22);
  p.ell(15, 18, 14, 3.6, ASH, false); p.ell(15, 18, 11, 2.6, 0x3a3438, false); for (let a = 0; a < 7; a++) { const t = a / 7 * Math.PI * 2; p.set(15 + Math.cos(t) * 12, 18 + Math.sin(t) * 3, 0xd8d0c0); }
  p.rect(8, 9, 14, 8, 0x8a8478); p.rect(8, 9, 14, 2, 0xa8a094); p.rect(10, 11, 8, 2, BLOOD); p.set(13, 13, BLOOD); p.set(13, 14, BLOOD); p.set(12, 16, BLOOD);
  for (const x of [5, 25]) { p.rect(x, 10, 2, 7, 0x1a1418); p.set(x, 9, 0xffd070); p.set(x, 8, 0xff9040); }
  p.ell(15, 7, 2, 2, 0xd8d0b8); p.set(14, 7, 0x1a1418); p.set(16, 7, 0x1a1418); // a skull on the slab
  p.outline(); p.toTex(scene, 'npc_dk_altar');

  // skull on a pike with a rag banner
  p = new Pix(14, 32);
  line(p, 7, 6, 7, 31, WOOD); p.ell(7, 5, 3, 3, 0xd8d0b8); p.set(6, 5, 0x1a1418); p.set(8, 5, 0x1a1418); p.rect(6, 7, 3, 1, 0xb8b098);
  p.poly([[8, 10], [13, 11], [12, 16], [8, 15]], 0x5a1a20); p.set(10, 13, 0x8a8478); crow(p, 4, 1);
  p.outline(); p.toTex(scene, 'npc_dk_pike');

  // sealed penitent's coffin on a bier, wrapped in chains
  p = new Pix(28, 16);
  p.rect(2, 12, 2, 4, WOOD); p.rect(24, 12, 2, 4, WOOD); p.rect(1, 11, 26, 2, WOODD);
  p.poly([[3, 4], [25, 3], [26, 10], [2, 11]], 0x4a3020); p.rect(3, 4, 22, 1, 0x6a4830);
  for (const x of [8, 18]) { line(p, x, 3, x, 11, IRON); } line(p, 2, 7, 26, 6, IRON); p.set(13, 7, 0xd0c060);
  p.outline(); p.toTex(scene, 'npc_dk_coffin');

  // drag-marks of blood (ground decal-ish)
  p = new Pix(24, 8);
  for (let x = 1; x < 23; x++) { const y = 3 + Math.round(Math.sin(x * 0.6)); p.set(x, y, BLOOD); if (x % 3) p.set(x, y + 1, shade(BLOOD, 0.75)); }
  p.ell(20, 4, 3, 2, BLOOD, false);
  p.toTex(scene, 'npc_dk_trail');
}
