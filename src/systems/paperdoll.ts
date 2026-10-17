/**
 * Layered paper-doll renderer. Every character (hero, companions, NPCs) is composed at runtime from
 * body + skin + face + hair + equipment layers into a 16x24 pixel sprite sheet:
 *   4 directions (down, left, right, up) x 3 frames (stand, stepA, stepB).
 * Equipment visuals come from Item.vis, so new gear only needs a data entry (or a new vis.type here).
 */
import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import type { Look, Member } from './state';

export const SKIN = [0xf8d9bc, 0xefc19a, 0xd69c6c, 0xa86d43, 0x74472a, 0xc9e0f0];
export const SKIN_NAMES = ['Porcelain', 'Fair', 'Honey', 'Bronze', 'Umber', 'Starlit'];
export const HAIR = [0x2a2233, 0x6b3f22, 0xc9783a, 0xf0d27a, 0xe8e8f0, 0xd9434f, 0x4f7fe0, 0x5bb04a, 0xa25ad8, 0xff8fb8];
export const HAIR_NAMES = ['Raven', 'Chestnut', 'Copper', 'Gold', 'Silver', 'Crimson', 'Azure', 'Moss', 'Violet', 'Blossom'];
export const EYES = [0x2a2233, 0x3a6fd8, 0x2f9a58, 0x8a5a2b, 0xd94f4f, 0x9b59d0, 0xf0b030];
export const EYE_NAMES = ['Onyx', 'Sapphire', 'Jade', 'Hazel', 'Ruby', 'Amethyst', 'Amber'];
export const OUTFIT = [0xc8414a, 0x3566c8, 0x3a9a5a, 0xe0b040, 0x7d47c0, 0x34344a, 0xe8e4dc, 0xe07b39, 0x2fa8a8];
export const OUTFIT_NAMES = ['Crimson', 'Cobalt', 'Forest', 'Saffron', 'Royal', 'Shadow', 'Ivory', 'Ember', 'Teal'];
export const HAIR_STYLES = ['Tousled', 'Spiky', 'Flowing', 'Ponytail', 'Bob', 'Crest'];
export const FACES = ['Bright', 'Gentle', 'Sleepy', 'Fierce'];
export const BODIES = ['Lean', 'Sturdy'];

export const FW = 16, FH = 24;
const OY = 4; // headroom rows
const OUT = 0x1b1428;

export function shade(c: number, f: number) {
  let r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  if (f < 1) { r *= f; g *= f; b *= f; } else { const t = f - 1; r += (255 - r) * t; g += (255 - g) * t; b += (255 - b) * t; }
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
// hue-shifted shadow for nicer pixel art (shadows go cooler/purpler)
function shadow(c: number) { const d = shade(c, 0.68); const r = (d >> 16) & 255, g = (d >> 8) & 255, b = d & 255; return (Math.round(r * 0.92) << 16) | (Math.round(g * 0.9) << 8) | Math.min(255, Math.round(b * 1.08 + 10)); }

type Dir = 'F' | 'S' | 'B';
const M = (s: string) => s.split('|');
// ---- hair masks: 10 cols (head local x 0..9 => abs x 3..12), rows start at local row 0 (abs OY+0) ----
const HAIRM: Record<string, Record<Dir, string[]>> = {
  Tousled: {
    F: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhdhhhhdhh|h........h|h........h'),
    S: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhdhhhhh|....hhhhhh|.....hhhhh|.....dhhhh|......hhh.'),
    B: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hdhhhhhhdh|.hhhhhhhh.|..dddddd..'),
  },
  Spiky: {
    F: M('.h..h..h..|.hh.hhhhh.|hhhhhhhhhh|hhhhhhhhhh|hdhhdhhdhh|hh.h....hh|h........h'),
    S: M('...h..h.h.|..hhhhhhhh|.hhhhhhhhh|hhhhhhhhhh|hhhdhhhhhh|...hhhhhhh|....hhhhhh|.....hhhhh|......hhh.'),
    B: M('.h..h..h..|.hh.hhhhh.|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|.hdhhhhdh.|..d.dd.d..'),
  },
  Flowing: {
    F: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhdhhdhhh|hh......hh|hh......hh|hh......hh|hh......hh|hd......dh|h........h|d........d'),
    S: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhdhhhhh|....hhhhhh|....hhhhhh|....hhhhhh|....hhhhhh|.....hhhhh|.....hhhh.|......hhd.'),
    B: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhdhhhhh|hhhhhhhhhh|hhhhhhhhhh|.hhhhhhhh.|.hdhhhhdh.|..dhhhhd..'),
  },
  Ponytail: {
    F: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hdhhhhhhdh|h........h|h........h'),
    S: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhdhhhhh|....hhhhhh|.....hhhhh|.....dhhhhh|......hh.hh|.........hh|.........dh|..........d'),
    B: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhddhhhh|hhhhhhhhhh|.hhhhhhhh.|....hh....|....hh....|....dh....|.....d....'),
  },
  Bob: {
    F: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhhhhhhh|hh......hh|hh......hh|hd......dh|.d......d.'),
    S: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhhhhhhh|...hhhhhhh|....hhhhhh|....hhhhhh|.....dhhd.'),
    B: M('..........|..hhhhhh..|.hhhhhhhh.|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|hhhhhhhhhh|.dhhhhhhd.'),
  },
  Crest: {
    F: M('....hh....|...hhhh...|...hdhh...|....hh....'),
    S: M('....hhh...|...hhhhh..|....hhhh..|.....hh...'),
    B: M('....hh....|...hhhh...|...hhhh...|....hh....|....dd....'),
  },
};
// ---- headgear masks: 12 cols (local x -1..10), row index starts at local row R0 given ----
const HEADM: Record<string, { r0: number; F: string[]; S: string[]; B: string[]; hideHair?: number }> = {
  bandana: { r0: 3, F: M('.aaaaaaaaaa.|.AaaaaaaaaA.'), S: M('.aaaaaaaaaa.|.aaaaaaaaaaa|..........aa|.........a.A'), B: M('.aaaaaaaaaa.|.aaaaaaaaaa.|.....aa.....|....a..A....') },
  wizard: { r0: -4, F: M('......a.....|.....aa.....|....aaaA....|....aaaaA...|...aaaaaA...|...bbbbbb...|aaaaaaaaaaaA|.AAAAAAAAAA.'), S: M('........a...|.......aa...|......aaA...|....aaaaA...|...aaaaaA...|...bbbbbb...|aaaaaaaaaaaA|.AAAAAAAAAA.'), B: M('......a.....|.....aa.....|....aaaA....|....aaaaA...|...aaaaaA...|...bbbbbb...|aaaaaaaaaaaA|.AAAAAAAAAA.'), hideHair: 3 },
  helm: { r0: -1, F: M('.....bb.....|....abba....|..aaaaaaaa..|.aaaaaaaaaa.|.aaaaaaaaaa.|.aAAAAAAAAa.|.a........a.|.a........a.'), S: M('........bb..|.......bbb..|...aaaabbb..|..aaaaaaaa..|.aaaaaaaaaa.|.aaaaaaaaaa.|.AAAAaaaaaa.|.....aaaaaa.|......aaaaa.'), B: M('.....bb.....|....abbaa...|..aaabbaaa..|.aaaaaaaaaa.|.aaaaaaaaaa.|.aaaaaaaaaa.|.aaaaaaaaaa.|.aaaaaaaaaa.|.aaaaaaaaaa.|..AAAAAAAA..'), hideHair: 6 },
  circlet: { r0: 3, F: M('.aaaabbaaaa.'), S: M('.aaaaaaaaaa.'), B: M('.aaaaaaaaaa.') },
};

export interface DollSpec { look: Look; equip: Record<string, string | undefined>; voc?: string }
export function specOf(m: Member): DollSpec { return { look: m.look, equip: m.equip as any, voc: m.voc }; }
export function dollKey(sp: DollSpec) {
  const l = sp.look; const e = sp.equip;
  return `doll_${l.body}${l.skin}${l.hairStyle}${l.hair}${l.eyes}${l.face}${l.outfit}${l.outfit2}_${e.weapon || ''}_${e.shield || ''}_${e.head || ''}_${e.armor || ''}_${e.acc || ''}`;
}

class Grid {
  px: number[]; constructor(public w: number, public h: number) { this.px = new Array(w * h).fill(-1); }
  set(x: number, y: number, c: number) { if (x >= 0 && y >= 0 && x < this.w && y < this.h && c >= 0) this.px[y * this.w + x] = c; }
  get(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.px[y * this.w + x] : -1; }
  rect(x: number, y: number, w: number, h: number, c: number) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  mask(rows: string[], x0: number, y0: number, map: Record<string, number>) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.' && map[ch] !== undefined) this.set(x0 + i, y0 + j, map[ch]); } });
  }
  flipH() { const g = new Grid(this.w, this.h); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) g.px[y * this.w + x] = this.px[y * this.w + (this.w - 1 - x)]; return g; }
  outline() {
    const src = this.px.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (src[y * this.w + x] !== -1) continue;
      const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[yy * this.w + xx] !== -1 && src[yy * this.w + xx] !== OUT; });
      if (n) this.px[y * this.w + x] = OUT;
    }
  }
}

function drawFrame(sp: DollSpec, dir: Dir, step: number): Grid {
  const g = new Grid(FW, FH); const L = sp.look; const E = sp.equip;
  const skin = SKIN[L.skin % SKIN.length], skinD = shadow(skin);
  const hair = HAIR[L.hair % HAIR.length], hairD = shadow(hair), hairL = shade(hair, 1.25);
  const eye = EYES[L.eyes % EYES.length];
  const out1 = OUTFIT[L.outfit % OUTFIT.length], out2 = OUTFIT[L.outfit2 % OUTFIT.length];
  const sturdy = L.body === 1;
  const bx = sturdy ? 4 : 5, bw = sturdy ? 8 : 6; // body
  const armor = E.armor ? ITEMS[E.armor]?.vis : undefined;
  const wpn = E.weapon ? ITEMS[E.weapon]?.vis : undefined;
  const shd = E.shield ? ITEMS[E.shield]?.vis : undefined;
  const head = E.head ? ITEMS[E.head]?.vis : undefined;
  const acc = E.acc ? ITEMS[E.acc]?.vis : undefined;
  let bodyC = out1, trim = out2;
  if (armor && armor.c1 >= 0) { bodyC = armor.c1; trim = armor.c2 ?? shadow(armor.c1); }
  const bodyD = shadow(bodyC);
  const pants = shade(out2, 0.55), boots = 0x5a3a2a;
  const ay = OY + 10; // body top abs row (14)
  const handL = sturdy ? 3 : 4, handR = sturdy ? 12 : 11;

  // --- back layers ---
  if (acc?.type === 'cape') {
    const c = acc.c1, d = acc.c2 ?? shadow(c);
    if (dir === 'F') { g.rect(bx - 1, ay, 1, 8, d); g.rect(bx + bw, ay, 1, 8, d); }
    if (dir === 'S') { for (let j = 0; j < 8; j++) g.rect(9 + Math.floor(j / 3), ay + j, 3, 1, j % 3 === 2 ? d : c); }
  }
  if (shd && dir === 'S') drawShield(g, shd, 9, ay + 1);
  if (wpn && dir === 'B') drawWeapon(g, wpn, handR + 1, ay + 4, true);

  // --- legs ---
  const lift = (n: number) => (step === 0 ? 0 : (step === 1) === (n === 0) ? 1 : 0);
  if (dir === 'S') {
    if (step === 0) { g.rect(6, ay + 6, 4, 3, pants); g.rect(6, ay + 9, 4, 1, boots); }
    else { g.rect(4, ay + 6, 3, 2, pants); g.rect(3, ay + 8, 3, 1, pants); g.rect(3, ay + 9, 3, 1, boots); g.rect(8, ay + 6, 3, 3, shade(pants, 0.8)); g.rect(9, ay + 9, 3, 1, boots); }
  } else {
    const lw = bw / 2;
    for (let n = 0; n < 2; n++) {
      const x = bx + n * lw, up = lift(n);
      g.rect(x, ay + 6, lw, 3 - up, n ? shade(pants, 0.85) : pants);
      g.rect(x, ay + 9 - up, lw, 1, boots);
    }
  }
  // --- torso ---
  const isRobe = armor?.type === 'robe';
  g.rect(bx, ay, bw, 6, bodyC);
  g.rect(bx + bw - 1, ay, 1, 6, bodyD); // side shadow
  if (dir !== 'B') g.rect(bx, ay + 4, bw, 1, trim); // belt
  if (isRobe) { g.rect(bx - 1, ay + 4, bw + 2, 5, bodyC); g.rect(bx - 1, ay + 8, bw + 2, 1, trim); g.rect(bx + bw, ay + 4, 1, 5, bodyD); if (dir === 'F') g.rect(bx + bw / 2 - 1, ay, 2, 4, trim); }
  if (armor?.type === 'jerkin' && dir !== 'B') { g.set(bx + 1, ay, trim); g.set(bx + 2, ay + 1, trim); g.set(bx + 3, ay + 2, trim); g.set(bx + 4, ay + 3, trim); }
  if (armor?.type === 'plate') {
    for (let j = 0; j < 5; j += 2) g.rect(bx, ay + j, bw, 1, shade(bodyC, 1.25));
    g.rect(bx - 2, ay, 3, 2, shade(bodyC, 1.15)); g.rect(bx + bw - 1, ay, 3, 2, bodyD);
  }
  if (armor?.type === 'tunic' || !armor) { if (dir === 'F') g.rect(bx + bw / 2 - 1, ay, 2, 1, skinD); }
  // --- arms ---
  const swing = step === 0 ? 0 : step === 1 ? 1 : -1;
  if (dir === 'S') {
    g.rect(7, ay + 1 + Math.max(0, swing), 2, 3, bodyD); g.rect(7, ay + 4 + Math.max(0, swing), 2, 1, skin);
  } else {
    const sl = armor?.type === 'plate' ? bodyC : bodyC;
    g.rect(handL, ay + 1 + Math.max(0, swing), 1, 3, sl); g.set(handL, ay + 4 + Math.max(0, swing), skin);
    g.rect(handR, ay + 1 + Math.max(0, -swing), 1, 3, shadow(sl)); g.set(handR, ay + 4 + Math.max(0, -swing), skinD);
  }
  if (acc?.type === 'amulet' && dir === 'F') { g.rect(bx + bw / 2 - 1, ay + 1, 2, 1, 0xd8d8e0); g.rect(bx + bw / 2 - 1, ay + 2, 2, 2, acc.c1); }
  if (acc?.type === 'cape' && dir === 'B') { const c = acc.c1, d = acc.c2 ?? shadow(c); g.rect(bx - 1, ay, bw + 2, 8, c); for (let j = 1; j < 8; j += 2) g.set(bx + 1 + (j % 4), ay + j, d); g.rect(bx - 1, ay + 7, bw + 2, 1, d); }
  if (acc?.type === 'cape' && dir !== 'B') { g.rect(bx, ay, bw, 1, acc.c1); }

  // --- head ---
  const headRows = M('..........|...ssss...|.ssssssss.|ssssssssss|ssssssssss|ssssssssss|ssssssssss|ssssssssss|.ssssssss.|..ssssss..');
  g.mask(headRows, 3, OY, { s: skin });
  for (let j = 3; j < 9; j++) g.set(dir === 'S' ? 3 : 12, OY + j, skinD);
  if (dir === 'F') drawFace(g, L.face, eye, skin, 3, OY, false);
  if (dir === 'S') drawFace(g, L.face, eye, skin, 3, OY, true);
  // hair
  const hm = HAIRM[HAIR_STYLES[L.hairStyle % HAIR_STYLES.length]][dir];
  const hg = head ? HEADM[head.type] : undefined;
  const hideHair = hg?.hideHair ?? 0;
  g.mask(hm.map((r, j) => (j < hideHair ? '..........' : r)), 3, OY, { h: hair, d: hairD });
  if (dir !== 'B' && !hideHair) { g.set(5, OY + 2, hairL); g.set(6, OY + 2, hairL); }
  // headgear
  if (hg && head) {
    const a = head.c1, b = head.c2 ?? shade(a, 1.3);
    g.mask(hg[dir], 2, OY + hg.r0, { a, b, A: shadow(a) });
  }
  // --- front layers ---
  if (shd && dir === 'F') drawShield(g, shd, handR - 1, ay + 1);
  if (shd && dir === 'B') drawShield(g, shd, handL - 2, ay + 1);
  if (wpn && dir === 'F') drawWeapon(g, wpn, handL - 1, ay + 4 + Math.max(0, swing), false);
  if (wpn && dir === 'S') {
    const hy = ay + 4 + Math.max(0, swing);
    if (wpn.type === 'sword' || wpn.type === 'dagger') { const len = wpn.type === 'sword' ? 6 : 3; const c = wpn.c1; g.rect(6 - len, hy, len, 1, shade(c, 1.3)); g.set(6 - len - 1, hy, c); g.rect(6, hy - 1, 1, 3, wpn.c2 ?? 0x6b4220); g.set(7, hy, wpn.c2 ?? 0x6b4220); g.set(7, hy, skin); }
    else drawWeapon(g, wpn, 2, hy, false);
  }
  g.outline();
  return g;
}

function drawFace(g: Grid, face: number, eye: number, skin: number, x0: number, y0: number, side: boolean) {
  const ex = side ? [x0 + 1] : [x0 + 2, x0 + 7]; const ey = y0 + 5;
  const dark = 0x241a2e, white = 0xffffff, blush = 0xf08a8a;
  for (const x of ex) {
    switch (face % 4) {
      case 0: g.set(x, ey, dark); g.set(x, ey + 1, eye); if (!side) g.set(x + (x === ex[0] ? 1 : -1), ey, white); break;
      case 1: g.set(x, ey, eye); g.set(x, ey + 1, eye); g.set(x, ey - 1, shade(skin, 0.75)); break;
      case 2: g.set(x, ey + 1, dark); g.set(x + (side ? 0 : 1), ey + 1, shade(skin, 0.7)); break;
      case 3: g.set(x, ey, eye); g.set(x, ey + 1, dark); g.set(x - 1, ey - 1, dark); g.set(x + 1, ey - 1, dark); break;
    }
  }
  if (!side) { g.set(x0 + 1, y0 + 7, blush); g.set(x0 + 8, y0 + 7, blush); g.set(x0 + 4, y0 + 8, shade(skin, 0.7)); g.set(x0 + 5, y0 + 8, shade(skin, 0.7)); }
  else { g.set(x0 + 2, y0 + 7, blush); g.set(x0, y0 + 8, shade(skin, 0.7)); }
}
function drawShield(g: Grid, v: { type: string; c1: number; c2?: number }, x: number, y: number) {
  const c = v.c1, b = v.c2 ?? shade(c, 1.3), d = shadow(c);
  if (v.type === 'kite') { g.mask(M('bbbb|bccb|bcbb|bcbb|.bb.|.bb.'.replace(/c/g, 'a')), x, y, { a: c, b }); g.set(x + 1, y + 2, b); g.set(x + 2, y + 2, b); }
  else { g.mask(M('.bb.|baab|baAb|bAAb|.bb.'), x, y, { a: c, A: d, b }); g.set(x + 1, y + 1, shade(c, 1.4)); }
}
function drawWeapon(g: Grid, v: { type: string; c1: number; c2?: number }, x: number, hy: number, back: boolean) {
  const c = v.c1, h = v.c2 ?? 0x6b4220, hl = shade(c, 1.35), d = shadow(c);
  switch (v.type) {
    case 'sword': g.rect(x, hy - 8, 1, 7, c); g.set(x, hy - 9, hl); g.rect(x, hy - 7, 1, 5, hl); g.rect(x - 1, hy - 1, 3, 1, h); g.set(x, hy, h); break;
    case 'dagger': g.rect(x, hy - 4, 1, 3, hl); g.set(x, hy - 5, c); g.rect(x - 1, hy - 1, 3, 1, h); g.set(x, hy, h); break;
    case 'axe': g.rect(x, hy - 6, 1, 9, h); g.rect(x - 3, hy - 7, 3, 4, c); g.rect(x - 3, hy - 7, 1, 4, hl); g.set(x - 1, hy - 4, d); break;
    case 'mace': g.rect(x, hy - 3, 1, 6, h); g.rect(x - 1, hy - 6, 3, 3, c); g.set(x, hy - 7, hl); g.set(x - 2, hy - 5, hl); g.set(x + 2, hy - 5, d); break;
    case 'staff': default: g.rect(x, hy - 8, 1, 12, c); g.rect(x, hy - 8, 1, 12, back ? d : c); g.rect(x - 1, hy - 11, 3, 3, h); g.set(x, hy - 12, shade(h, 1.4)); g.set(x - 1, hy - 11, shade(h, 1.5)); break;
  }
}

/** Build (or reuse) the sprite sheet texture. Returns texture key. Frames: dir*3+step, dir 0=down 1=left 2=right 3=up */
export function ensureDoll(scene: Phaser.Scene, sp: DollSpec): string {
  const key = dollKey(sp);
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, FW * 3, FH * 4)!;
  const ctx = tex.getContext();
  const dirs: Dir[] = ['F', 'S', 'S', 'B'];
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) {
    let g = drawFrame(sp, dirs[d], s);
    if (d === 2) g = g.flipH();
    const img = ctx.createImageData(FW, FH);
    for (let i = 0; i < g.px.length; i++) { const c = g.px[i]; if (c < 0) continue; img.data[i * 4] = (c >> 16) & 255; img.data[i * 4 + 1] = (c >> 8) & 255; img.data[i * 4 + 2] = c & 255; img.data[i * 4 + 3] = 255; }
    ctx.putImageData(img, s * FW, d * FH);
    tex.add(d * 3 + s, 0, s * FW, d * FH, FW, FH);
  }
  tex.refresh();
  return key;
}
export function randomLook(rng = Math.random): Look {
  const r = (n: number) => Math.floor(rng() * n);
  return { body: r(2), skin: r(5), hairStyle: r(6), hair: r(HAIR.length), eyes: r(EYES.length), face: r(4), outfit: r(OUTFIT.length), outfit2: r(OUTFIT.length) };
}
