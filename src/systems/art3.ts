/**
 * Chapter II art: 48px monsters (richer shading, specular highlights, hue-shifted shadows),
 * the 64px Cantor boss, the mule, and high-resolution (360x240) painted battle backdrops.
 */
import Phaser from 'phaser';
import { shade } from './paperdoll';
import { Pix } from './art';

type Ctx = CanvasRenderingContext2D;
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const O = 0x1b1428;

/** small helpers on top of Pix */
function eye(p: Pix, x: number, y: number, c: number, r = 1) { p.rect(x - r, y - r, r * 2 + 1, r * 2 + 1, O); p.rect(x - r + 1, y - r + 1, Math.max(1, r * 2 - 1), Math.max(1, r * 2 - 1), c); p.set(x - r + 1, y - r + 1, 0xffffff); }
function spec(p: Pix, x: number, y: number) { p.set(x, y, 0xffffff); p.set(x + 1, y, 0xf0f0ff); p.set(x, y + 1, 0xf0f0ff); }
function line(p: Pix, x0: number, y0: number, x1: number, y1: number, c: number) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) p.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); }

export function makeMonsters2(scene: Phaser.Scene) {
  // ---- Ashwolf: charcoal wolf with ember-lit mane
  let p = new Pix(48, 48);
  p.poly([[34, 26], [46, 18], [44, 24], [38, 30]], 0x4a4250); // tail
  p.ell(40, 21, 4, 3, 0x5a5262);
  p.ell(25, 28, 14, 9, 0x4a4456); // body
  p.ell(22, 25, 10, 6, 0x5c5468);
  for (const [x, w] of [[14, 0], [19, 1], [30, 0], [35, 1]] as [number, number][]) { p.rect(x, 33, 4, 9 - w, w ? 0x3a3446 : 0x4a4456); p.rect(x - 1, 41 - w, 6, 2, 0x2a2434); }
  p.ell(12, 20, 9, 8, 0x5c5468); // head
  p.poly([[2, 22], [8, 18], [10, 26], [3, 26]], 0x4a4456); // snout
  p.poly([[8, 13], [10, 3], [15, 12]], 0x4a4456); p.poly([[14, 12], [18, 4], [20, 13]], 0x5c5468); p.set(11, 8, 0xd06040); p.set(17, 9, 0xd06040);
  for (let i = 0; i < 9; i++) { p.poly([[14 + i * 2, 16 + (i % 2)], [17 + i * 2, 10 + (i % 3)], [19 + i * 2, 18]], i % 2 ? 0xff7a2a : 0xd04a2a); } // ember mane
  for (let i = 0; i < 6; i++) p.set(16 + i * 3, 12 + (i % 2) * 2, 0xffd060);
  eye(p, 9, 18, 0xffb030); p.rect(2, 21, 2, 2, 0x1b1428);
  line(p, 3, 25, 9, 26, 0x2a2232); p.set(5, 26, 0xffffff); p.set(7, 26, 0xffffff);
  p.outline(); p.toTex(scene, 'm_ashwolf');

  // ---- Mossling: a walking stump with a mushroom cap and lantern eyes
  p = new Pix(48, 48);
  p.ell(24, 34, 12, 10, 0x8a5a32); p.rect(13, 30, 23, 10, 0x8a5a32);
  for (let x = 14; x < 35; x += 4) line(p, x, 28, x + 1, 42, 0x6a4024);
  p.ell(24, 30, 11, 3, 0xb08050);
  p.ell(24, 20, 17, 11, 0xd04a3a); p.ell(24, 25, 17, 4, 0xd04a3a);
  for (const [x, y, r] of [[15, 15, 2], [26, 12, 3], [33, 19, 2], [20, 21, 2], [30, 24, 1]] as number[][]) p.ell(x, y, r, r, 0xf8f0e0, false);
  p.rect(8, 27, 33, 2, 0x8a2a2a);
  eye(p, 19, 34, 0xffe070); eye(p, 29, 34, 0xffe070); line(p, 21, 39, 27, 39, 0x3a2414);
  p.ell(9, 37, 3, 3, 0x6a9a3a); p.ell(39, 38, 3, 2, 0x6a9a3a); p.ell(14, 44, 4, 2, 0x6a4024); p.ell(33, 44, 4, 2, 0x6a4024);
  spec(p, 22, 11); p.outline(); p.toTex(scene, 'm_mossling');

  // ---- Bramblewisp: floating thorny spirit with violet flame
  p = new Pix(48, 48);
  for (let a = 0; a < 12; a++) { const r = 16 + (a % 2) * 4, x = 24 + Math.cos(a / 12 * 6.283) * r, y = 24 + Math.sin(a / 12 * 6.283) * r * 0.85; line(p, 24, 24, x, y, 0x4a6a2a); p.set(x, y, 0x8ab040); }
  p.ell(24, 24, 11, 11, 0x9a5ae0); p.ell(24, 22, 7, 7, 0xc890ff); p.ell(23, 20, 3, 3, 0xf0d8ff, false);
  p.poly([[19, 14], [24, 2], [29, 14]], 0xb070f0); p.poly([[22, 10], [24, 5], [26, 10]], 0xe0c0ff);
  eye(p, 20, 25, 0x1b1428, 1); eye(p, 28, 25, 0x1b1428, 1); p.rect(22, 29, 4, 1, 0x3a1a5a);
  p.outline(); p.toTex(scene, 'm_bramblewisp');

  // ---- Gloomowl: big-eyed owl with dusk feathers
  p = new Pix(48, 48);
  p.poly([[4, 20], [14, 16], [16, 34], [8, 32]], 0x4a3a5a); p.poly([[44, 20], [34, 16], [32, 34], [40, 32]], 0x4a3a5a);
  for (let i = 0; i < 4; i++) { line(p, 5 + i * 2, 22 + i * 3, 14, 20 + i * 3, 0x3a2a4a); line(p, 43 - i * 2, 22 + i * 3, 34, 20 + i * 3, 0x3a2a4a); }
  p.ell(24, 28, 12, 14, 0x6a5a7a); p.ell(24, 32, 8, 9, 0xb0a0b8);
  for (let y = 26; y < 40; y += 3) for (let x = 19; x < 30; x += 3) p.set(x + (y % 2), y, 0x8a7a94);
  p.ell(24, 16, 12, 9, 0x7a6a8a); p.poly([[13, 12], [12, 3], [19, 9]], 0x5a4a6a); p.poly([[35, 12], [36, 3], [29, 9]], 0x5a4a6a);
  p.ell(18, 16, 5, 5, 0xf0e0a0, false); p.ell(30, 16, 5, 5, 0xf0e0a0, false); p.ell(18, 16, 3, 3, 0xff9a20, false); p.ell(30, 16, 3, 3, 0xff9a20, false);
  p.rect(17, 15, 2, 3, O); p.rect(29, 15, 2, 3, O); p.set(17, 14, 0xffffff); p.set(29, 14, 0xffffff);
  p.poly([[22, 20], [26, 20], [24, 25]], 0xe0a040);
  p.rect(18, 41, 3, 4, 0xe0a040); p.rect(27, 41, 3, 4, 0xe0a040);
  p.outline(); p.toTex(scene, 'm_gloomowl');

  // ---- Brinecrab: armoured crab with a pearl in one claw
  p = new Pix(48, 48);
  for (let i = 0; i < 3; i++) { line(p, 14 - i * 2, 30 + i * 3, 4 - i, 38 + i * 3, 0xb03a2a); line(p, 34 + i * 2, 30 + i * 3, 44 + i, 38 + i * 3, 0xb03a2a); }
  p.ell(24, 30, 15, 9, 0xd8503a); p.ell(24, 27, 12, 5, 0xf07050);
  for (let x = 13; x < 36; x += 5) p.set(x, 33, 0x8a2a1a);
  p.ell(7, 18, 7, 6, 0xd8503a); p.poly([[2, 12], [6, 9], [8, 16]], 0xb03a2a); p.ell(41, 18, 7, 6, 0xd8503a); p.poly([[46, 12], [42, 9], [40, 16]], 0xb03a2a);
  p.ell(41, 14, 3, 3, 0xf0f0ff); spec(p, 40, 13);
  line(p, 11, 22, 16, 27, 0xb03a2a); line(p, 37, 22, 32, 27, 0xb03a2a);
  p.rect(19, 17, 1, 6, 0xb03a2a); p.rect(28, 17, 1, 6, 0xb03a2a); eye(p, 19, 16, 0x1b1428, 1); eye(p, 28, 16, 0x1b1428, 1);
  line(p, 21, 31, 27, 31, 0x5a1a10); spec(p, 20, 25);
  p.outline(); p.toTex(scene, 'm_brinecrab');

  // ---- Lantern Jelly: translucent jellyfish with a glowing core
  p = new Pix(48, 48);
  for (let i = 0; i < 7; i++) { const x0 = 12 + i * 4; for (let y = 24; y < 46; y++) p.set(x0 + Math.round(Math.sin(y / 3 + i) * 1.5), y, y > 40 ? 0x6ac8d8 : 0x8ae0e8); }
  p.ell(24, 18, 15, 12, 0x58b8d8); p.ell(24, 24, 15, 4, 0x58b8d8); p.ell(24, 15, 10, 7, 0x8ad8f0);
  p.ell(24, 18, 5, 5, 0xffe890, false); p.ell(24, 18, 3, 3, 0xfffff0, false);
  for (let x = 10; x < 39; x += 3) p.set(x, 27, 0x3a88a8);
  eye(p, 17, 20, 0x1b1428, 1); eye(p, 31, 20, 0x1b1428, 1); spec(p, 16, 9);
  p.outline(); p.toTex(scene, 'm_lanternjelly');

  // ---- Choir Acolyte: hooded figure in ash-grey robes holding a hymnal censer
  p = new Pix(48, 48);
  p.poly([[14, 18], [34, 18], [40, 46], [8, 46]], 0x6a6474); p.poly([[24, 18], [34, 18], [40, 46], [28, 46]], 0x56505e);
  for (let y = 24; y < 46; y += 5) line(p, 12, y, 36, y + 1, 0x4a4452);
  p.ell(24, 14, 8, 9, 0x7a7484); p.ell(24, 16, 5, 6, 0x14101c, false); eye(p, 22, 16, 0xff5a5a, 0); eye(p, 26, 16, 0xff5a5a, 0);
  p.rect(18, 23, 12, 2, 0xc8b070); p.rect(23, 25, 2, 8, 0xc8b070); p.rect(21, 27, 6, 2, 0xc8b070);
  line(p, 38, 22, 40, 34, 0xa09080); p.ell(40, 36, 3, 3, 0xb09050); p.set(40, 38, 0xff9a40); p.set(39, 32, 0xc0c0c0);
  p.ell(10, 30, 3, 3, 0x6a6474); p.ell(37, 24, 3, 3, 0x6a6474);
  p.outline(); p.toTex(scene, 'm_acolyte');

  // ---- Drowned Sailor: barnacled revenant with a boathook
  p = new Pix(48, 48);
  line(p, 38, 2, 38, 46, 0x6a4a2a); line(p, 39, 2, 39, 46, 0x5a3a1a); p.rect(36, 2, 4, 2, 0x8a94a0); p.set(35, 4, 0x8a94a0);
  p.ell(22, 31, 10, 11, 0x3a5a6a); p.rect(14, 38, 6, 9, 0x2a3a4a); p.rect(24, 38, 6, 9, 0x2a3a4a);
  for (let y = 24; y < 40; y += 3) line(p, 13, y, 31, y, 0x4a6a7a);
  p.ell(22, 15, 8, 8, 0x8ab0a0); p.ell(22, 19, 6, 4, 0x7aa090);
  p.rect(14, 9, 16, 3, 0x2a3a4a); p.rect(16, 6, 12, 4, 0x34485a);
  eye(p, 19, 15, 0x6affd0, 1); eye(p, 26, 15, 0x6affd0, 1); line(p, 18, 21, 26, 21, 0x2a3a3a);
  for (const [x, y] of [[16, 28], [27, 33], [20, 36], [12, 24], [29, 26]]) { p.set(x, y, 0xe0e0d0); p.set(x + 1, y, 0xb0b0a0); }
  for (let i = 0; i < 5; i++) line(p, 15 + i * 3, 42, 14 + i * 3, 46, 0x4a8a5a);
  p.ell(10, 28, 3, 4, 0x8ab0a0); p.ell(35, 24, 3, 3, 0x8ab0a0);
  p.outline(); p.toTex(scene, 'm_drowned');

  // ---- Siren Eel: coiled serpent with fin-crest and glowing lure
  p = new Pix(48, 48);
  for (let t = 0; t < 60; t++) { const a = t / 60 * 9, r = 4 + t / 4.2; const x = 26 + Math.cos(a) * r, y = 30 + Math.sin(a) * r * 0.55; p.ell(x, y, 3.4, 3.4, t % 6 < 3 ? 0x3a8a9a : 0x2f7a8a); }
  for (let k = 0; k <= 10; k++) p.ell(10 + k * 0.4, 33 - k * 1.6, 3.2, 3.2, k % 3 ? 0x3a8a9a : 0x2f7a8a);
  p.ell(14, 14, 8, 7, 0x4aa0b0); p.poly([[10, 8], [18, 1], [22, 10]], 0xe06a9a); p.poly([[16, 7], [24, 3], [24, 12]], 0xf090b8);
  line(p, 8, 8, 4, 2, 0x2a6a7a); p.ell(4, 2, 2, 2, 0xfff080, false);
  eye(p, 11, 13, 0xffe050, 1); line(p, 7, 18, 16, 19, 0x1b2a3a); p.set(9, 19, 0xffffff); p.set(13, 19, 0xffffff);
  spec(p, 15, 10); p.outline(); p.toTex(scene, 'm_siren');

  // ---- Boss: Cantor Mordane (64x64) - towering conductor in a cathedral of bone-white robes
  p = new Pix(64, 64);
  p.poly([[20, 22], [44, 22], [56, 63], [8, 63]], 0x3a3048); p.poly([[32, 22], [44, 22], [56, 63], [38, 63]], 0x2c2438);
  for (let i = 0; i < 6; i++) line(p, 14 + i * 7, 63, 26 + i * 2, 26, 0x4a4058);
  p.poly([[22, 22], [42, 22], [38, 44], [26, 44]], 0xe8e0d0); p.poly([[32, 22], [42, 22], [38, 44], [32, 44]], 0xc8c0b0);
  p.poly([[26, 27], [38, 27], [32, 38]], 0x5a5068); p.poly([[28, 28], [36, 28], [32, 35]], 0x8a2a4a); p.ell(32, 30, 2, 1.5, 0xffd0e0, false); p.set(32, 30, 0x1b1428);
  p.ell(32, 14, 9, 10, 0xd8d0c0); p.ell(32, 16, 6, 7, 0x0e0a14, false);
  p.rect(28, 15, 3, 2, 0xff4a6a); p.rect(34, 15, 3, 2, 0xff4a6a); p.set(29, 15, 0xffd0e0); p.set(35, 15, 0xffd0e0);
  for (let a = 0; a < 9; a++) { const x = 32 + Math.cos(-Math.PI + a / 8 * Math.PI) * 15, y = 9 + Math.sin(-Math.PI + a / 8 * Math.PI) * 9; line(p, 32, 9, x, y, 0xb09040); p.set(x, y, 0xffe080); }
  p.ell(32, 2, 3, 2, 0xffe080, false);
  // conducting arms + baton
  p.poly([[20, 24], [6, 18], [4, 22], [18, 30]], 0x3a3048); p.ell(5, 19, 3, 3, 0xd8d0c0); line(p, 5, 19, 0, 4, 0xe8e0c0); p.set(0, 3, 0xffffff);
  p.poly([[44, 24], [58, 32], [56, 36], [42, 30]], 0x3a3048); p.ell(57, 34, 3, 3, 0xd8d0c0);
  p.rect(52, 38, 10, 12, 0x6a4a2a); p.rect(53, 39, 8, 10, 0xe8e0c8); line(p, 57, 39, 57, 48, 0x8a7a60);
  // hovering hymn-notes
  for (const [x, y] of [[10, 40], [50, 12], [14, 54], [58, 56]]) { p.ell(x, y, 2, 1.5, 0xffd0f0, false); line(p, x + 2, y, x + 2, y - 5, 0xffd0f0); }
  p.outline(); p.toTex(scene, 'm_cantor');

  // ---- Turnip the mule (world NPC, single frame 20x20, faces left)
  p = new Pix(20, 20);
  p.ell(11, 11, 6, 4, 0x9a7a5a); p.rect(6, 13, 2, 6, 0x7a5a3a); p.rect(9, 14, 2, 5, 0x8a6a4a); p.rect(13, 14, 2, 5, 0x7a5a3a); p.rect(15, 13, 2, 6, 0x8a6a4a);
  p.ell(4, 7, 3, 3, 0xa88a6a); p.ell(2, 9, 2, 2, 0xc8b098); p.rect(3, 1, 1, 4, 0x8a6a4a); p.rect(5, 1, 1, 4, 0x8a6a4a);
  p.set(3, 6, O); p.rect(7, 6, 6, 2, 0x5a3a2a); p.rect(16, 9, 2, 1, 0x5a3a2a); p.rect(17, 10, 1, 4, 0x5a3a2a);
  p.rect(9, 7, 5, 3, 0xc84a3a); p.rect(10, 8, 3, 1, 0xffd34e);
  p.outline(); p.toTex(scene, 'npc_mule');
}

/** World props: Saltmere's lighthouse (24x60) */
export function makeProps2(scene: Phaser.Scene) {
  const p = new Pix(24, 60);
  p.poly([[5, 59], [19, 59], [16, 18], [8, 18]], 0xe8e2d4);               // tapering tower
  p.poly([[12, 59], [19, 59], [16, 18], [12, 18]], 0xc8c0b0);             // shaded side
  for (const y of [26, 40, 52]) p.poly([[8 - (y - 18) * 0.07, y], [16 + (y - 18) * 0.07, y], [16 + (y + 4 - 18) * 0.075, y + 4], [8 - (y + 4 - 18) * 0.075, y + 4]], 0xc0453a);
  p.rect(11, 46, 3, 5, 0x3a2412); p.rect(12, 47, 1, 4, 0x5a8aa8);          // door
  p.rect(11, 30, 2, 3, 0x2a2a3a); p.rect(11, 36, 2, 2, 0x2a2a3a);          // windows
  p.rect(5, 16, 14, 2, 0x3a3048); p.rect(6, 15, 12, 1, 0x5a5068);          // gallery
  for (let x = 6; x < 18; x += 2) p.set(x, 14, 0x3a3048);
  p.rect(8, 8, 8, 6, 0x9ad0ff); p.rect(8, 8, 1, 6, 0x3a3048); p.rect(15, 8, 1, 6, 0x3a3048); p.rect(11, 8, 1, 6, 0x3a3048); // lamp room
  p.rect(10, 10, 3, 3, 0xfff0b0);
  p.poly([[7, 8], [17, 8], [12, 2]], 0xc0453a); p.set(12, 1, 0xd8d0c0); p.set(12, 0, 0xd8d0c0);  // dome
  p.outline(); p.toTex(scene, 'lighthouse');
}

/** High-resolution battle backdrops: 360x240 painted with gradients, parallax silhouettes and dithered ground. */
export function makeBackdrops2(scene: Phaser.Scene) {
  const g = (key: string, fn: (c: Ctx) => void) => { if (scene.textures.exists(key)) scene.textures.remove(key); const t = scene.textures.createCanvas(key, 360, 240)!; const c = t.getContext(); c.imageSmoothingEnabled = false; fn(c); t.refresh(); };
  const sky = (c: Ctx, stops: [number, string][]) => { const gr = c.createLinearGradient(0, 0, 0, 170); stops.forEach(([o, s]) => gr.addColorStop(o, s)); c.fillStyle = gr; c.fillRect(0, 0, 360, 240); };
  const ground = (c: Ctx, y0: number, base: number, speck: number[], sd: number) => {
    for (let y = y0; y < 240; y++) { const t = (y - y0) / (240 - y0); c.fillStyle = hex(shade(base, 0.7 + t * 0.45)); c.fillRect(0, y, 360, 1); }
    seed = sd; for (let i = 0; i < 420; i++) { const y = y0 + 2 + Math.floor(rnd() * (238 - y0)); const t = (y - y0) / (240 - y0); c.fillStyle = hex(shade(speck[i % speck.length], 0.7 + t * 0.5)); c.fillRect(Math.floor(rnd() * 360), y, 1 + Math.floor(t * 5), 1 + Math.floor(t * 1.5)); }
  };
  const ridge = (c: Ctx, col: string, base: number, amp: number, f: number, ph: number) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, 240); for (let x = 0; x <= 360; x += 3) c.lineTo(x, base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.7 + ph * 2) * amp * 0.35); c.lineTo(360, 240); c.fill(); };
  const godrays = (c: Ctx, x: number, col: string) => { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { c.fillStyle = col; c.beginPath(); c.moveTo(x + i * 22, 0); c.lineTo(x + i * 22 + 12, 0); c.lineTo(x + i * 34 + 70, 170); c.lineTo(x + i * 34 + 40, 170); c.fill(); } c.restore(); };
  const tree = (c: Ctx, x: number, y: number, s: number, trunk: string, leaves: string[]) => {
    c.fillStyle = trunk; c.fillRect(x - s * 0.12, y - s * 0.9, s * 0.24, s * 0.9);
    leaves.forEach((l, i) => { c.fillStyle = l; c.beginPath(); c.arc(x - s * 0.1 * i, y - s * (1.2 - i * 0.12), s * (0.55 - i * 0.1), 0, 7); c.fill(); c.beginPath(); c.arc(x + s * 0.3 - s * 0.05 * i, y - s * (0.95 - i * 0.08), s * (0.42 - i * 0.08), 0, 7); c.fill(); });
  };

  // Emberwood Road - autumn forest at golden hour
  g('bg_road', c => {
    sky(c, [[0, '#f0b070'], [0.45, '#f8d8a0'], [1, '#e8c890']]);
    c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath(); c.arc(270, 70, 26, 0, 7); c.fill();
    ridge(c, '#c89a8a', 120, 10, 0.02, 1); ridge(c, '#b07a5a', 132, 8, 0.03, 3);
    seed = 4; for (let i = 0; i < 16; i++) tree(c, 10 + i * 24 + rnd() * 10, 158, 46 + rnd() * 16, '#5a3a2a', ['#a84a2a', '#d0702a', '#e8a040']);
    godrays(c, 190, 'rgba(255,230,170,0.10)');
    ground(c, 160, 0x9a7a3a, [0xc8902a, 0xd8602a, 0x8a5a2a, 0xe8b040], 21);
    c.fillStyle = 'rgba(120,80,40,0.35)'; c.beginPath(); c.moveTo(130, 160); c.lineTo(230, 160); c.lineTo(300, 240); c.lineTo(60, 240); c.fill();
    seed = 8; for (let i = 0; i < 40; i++) { c.fillStyle = ['#e06a2a', '#f0a030', '#c8402a'][i % 3]; c.fillRect(rnd() * 360, rnd() * 150, 3, 2); }
  });
  // Saltmere coast - bright sea, cliffs, gulls
  g('bg_coast', c => {
    sky(c, [[0, '#5ab0f0'], [0.6, '#b8e4f8'], [1, '#f0f0e0']]);
    c.fillStyle = '#ffffff'; for (const [x, y, w] of [[30, 30, 60], [180, 18, 80], [290, 46, 50]]) { c.beginPath(); c.ellipse(x, y, w / 2, 7, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(x + 8, y - 6, w / 3, 7, 0, 0, 7); c.fill(); }
    for (let y = 118; y < 165; y++) { const t = (y - 118) / 47; c.fillStyle = hex(shade(0x2f88c0, 0.85 + t * 0.4)); c.fillRect(0, y, 360, 1); }
    seed = 3; c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 60; i++) c.fillRect(rnd() * 360, 120 + rnd() * 44, 4 + rnd() * 8, 1);
    c.fillStyle = '#7a6a5a'; c.beginPath(); c.moveTo(0, 165); c.lineTo(0, 70); c.lineTo(30, 64); c.lineTo(60, 90); c.lineTo(80, 130); c.lineTo(110, 165); c.fill();
    c.fillStyle = '#e8e4dc'; c.fillRect(22, 30, 14, 36); c.fillStyle = '#c84a3a'; c.fillRect(22, 38, 14, 5); c.fillRect(22, 52, 14, 5); c.fillStyle = '#3a3048'; c.fillRect(20, 24, 18, 7);
    c.fillStyle = '#1b1428'; for (const [x, y] of [[150, 60], [170, 54], [240, 80]]) { c.fillRect(x, y, 3, 1); c.fillRect(x + 3, y - 1, 2, 1); c.fillRect(x - 2, y - 1, 2, 1); }
    ground(c, 165, 0xd8c08a, [0xf0dca8, 0xb89a68, 0xe8d0a0, 0xffffff], 31);
    seed = 11; for (let i = 0; i < 14; i++) { const x = rnd() * 360, y = 175 + rnd() * 60; c.fillStyle = '#f0a090'; c.fillRect(x, y, 3, 2); }
  });
  // Sea grotto - teal cavern with glowing coral and shafts of light from above
  g('bg_grotto', c => {
    sky(c, [[0, '#06141e'], [0.5, '#0e3a4a'], [1, '#1a5a5a']]);
    c.fillStyle = '#0a2430'; for (let x = 0; x < 360; x += 30) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 15, 30 + (x % 7) * 6); c.lineTo(x + 30, 0); c.fill(); }
    godrays(c, 120, 'rgba(120,240,255,0.08)');
    ridge(c, '#103a44', 130, 14, 0.03, 2); ridge(c, '#0c2e38', 146, 10, 0.05, 5);
    seed = 5; for (let i = 0; i < 22; i++) { const x = rnd() * 360, y = 140 + rnd() * 30, col = ['#ff7ab0', '#6af0d0', '#ffb070'][i % 3]; c.fillStyle = col; for (let k = 0; k < 4; k++) c.fillRect(x + (k - 2) * 3, y - k * 3, 2, k * 3 + 4); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(120,255,230,0.12)'; c.beginPath(); c.arc(x, y, 10, 0, 7); c.fill(); c.restore(); }
    ground(c, 168, 0x2a5a5a, [0x3a7a74, 0x1a4048, 0x6ac0b0, 0x2a6a6a], 41);
    for (let y = 196; y < 240; y += 8) { c.fillStyle = 'rgba(106,240,208,0.10)'; c.fillRect(0, y, 360, 2); }
    seed = 13; c.fillStyle = 'rgba(200,255,255,0.6)'; for (let i = 0; i < 30; i++) { const x = rnd() * 360, y = rnd() * 160; c.fillRect(x, y, 2, 2); }
  });
  // Drowned Choir sanctum - ruined chapel under the sea, rose window glowing red
  g('bg_choir', c => {
    sky(c, [[0, '#0a0614'], [0.55, '#2a0e2a'], [1, '#4a1a30']]);
    c.save(); c.translate(180, 70); c.fillStyle = '#1a0a1a'; c.beginPath(); c.arc(0, 0, 46, 0, 7); c.fill();
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.fillStyle = i % 2 ? '#c83a5a' : '#7a2aa0'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-9, -40); c.lineTo(9, -40); c.fill(); }
    c.fillStyle = '#ffd0a0'; c.beginPath(); c.arc(0, 0, 10, 0, 7); c.fill(); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(180, 70, 10, 180, 70, 150); gr.addColorStop(0, 'rgba(255,90,120,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 360, 240); c.restore();
    c.fillStyle = '#1e1428'; for (const x of [40, 100, 260, 320]) { c.fillRect(x - 9, 20, 18, 150); c.fillRect(x - 13, 20, 26, 8); c.fillRect(x - 13, 160, 26, 10); }
    c.fillStyle = '#2a1e36'; for (const x of [40, 100, 260, 320]) c.fillRect(x - 9, 20, 5, 150);
    ground(c, 170, 0x3a2a40, [0x4a3a52, 0x2a1e30, 0x6a3a5a, 0x5a4a62], 51);
    for (let x = 0; x < 360; x += 24) { c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x, 170, 1, 70); }
    c.fillStyle = 'rgba(80,200,220,0.18)'; for (let y = 200; y < 240; y += 6) c.fillRect(0, y, 360, 2);
  });

  // ---- Chapter I backdrops re-painted at 360 px (replace the v0.1 180 px versions)
  // Whisperwind Vale - spring meadow, layered blue hills, cumulus clouds
  g('bg_fields', c => {
    sky(c, [[0, '#4a9ae8'], [0.55, '#9ad4f4'], [1, '#e8f4e0']]);
    seed = 61; for (let i = 0; i < 6; i++) { const x = rnd() * 360, y = 16 + rnd() * 50, w = 40 + rnd() * 50;
      for (let k = 0; k < 5; k++) { c.fillStyle = k < 3 ? '#ffffff' : '#dce8f4'; c.beginPath(); c.ellipse(x + (k - 2) * w * 0.22, y - (k % 3 === 1 ? 7 : 0) + (k > 2 ? 4 : 0), w * 0.28, 9, 0, 0, 7); c.fill(); } }
    ridge(c, '#9ab8d8', 112, 12, 0.017, 0.5); ridge(c, '#7aa0b8', 124, 10, 0.026, 2.2);
    c.fillStyle = '#5a6a8a'; c.fillRect(296, 92, 6, 26); c.beginPath(); c.moveTo(293, 92); c.lineTo(299, 80); c.lineTo(305, 92); c.fill(); // far village spire
    ridge(c, '#6aa060', 140, 8, 0.035, 4); 
    seed = 62; for (let i = 0; i < 20; i++) tree(c, rnd() * 360, 150 + rnd() * 4, 22 + rnd() * 12, '#4a3a2a', ['#3a7a3a', '#4f9a46', '#7cc060']);
    godrays(c, 60, 'rgba(255,250,220,0.09)');
    ground(c, 158, 0x4f9a46, [0x6ab85a, 0x3a7a3a, 0x8ad06a, 0x5aa850], 63);
    seed = 64; for (let i = 0; i < 90; i++) { const x = rnd() * 360, y = 166 + rnd() * 72, col = ['#ffffff', '#ffe060', '#ff9ac0', '#b0a0ff'][i % 4]; c.fillStyle = col; c.fillRect(x, y, 2, 2); c.fillStyle = '#2a6a2a'; c.fillRect(x, y + 2, 1, 2); }
    c.fillStyle = 'rgba(200,170,110,0.45)'; c.beginPath(); c.moveTo(150, 158); c.lineTo(205, 158); c.lineTo(260, 240); c.lineTo(100, 240); c.fill();
  });
  // Cinderdeep Hollow - smouldering cave: stalactites, ember cracks, violet crystals
  g('bg_hollow', c => {
    sky(c, [[0, '#0a0812'], [0.6, '#1e1428'], [1, '#3a2030']]);
    seed = 71; c.fillStyle = '#140e1c'; for (let x = -10; x < 370; x += 14 + rnd() * 16) { const d = 20 + rnd() * 50; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 7, d); c.lineTo(x + 16, 0); c.fill(); }
    ridge(c, '#221830', 118, 16, 0.03, 1); ridge(c, '#2c1e34', 138, 12, 0.045, 3);
    seed = 72; for (let i = 0; i < 9; i++) { const x = 20 + rnd() * 320, y = 120 + rnd() * 40, h = 10 + rnd() * 16;
      c.fillStyle = '#7a4ac8'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4, y - h); c.lineTo(x + 8, y); c.fill(); c.fillStyle = '#c8a0ff'; c.fillRect(x + 3, y - h + 4, 1, h - 6);
      c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(x + 4, y - h / 2, 1, x + 4, y - h / 2, 26); gr.addColorStop(0, 'rgba(160,110,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - 24, y - h - 24, 56, h + 48); c.restore(); }
    ground(c, 162, 0x3e3446, [0x4a3e54, 0x2a2232, 0x5a4a62, 0x6a3a3a], 73);
    seed = 74; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { let x = rnd() * 360, y = 170 + rnd() * 60; c.strokeStyle = 'rgba(255,120,40,0.7)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += 4 + rnd() * 8; y += (rnd() - 0.5) * 6; c.lineTo(x, y); } c.stroke(); }
    const gl = c.createLinearGradient(0, 240, 0, 170); gl.addColorStop(0, 'rgba(255,90,30,0.25)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gl; c.fillRect(0, 170, 360, 70); c.restore();
    seed = 75; for (let i = 0; i < 36; i++) { c.fillStyle = ['#ff9a40', '#ffd070', '#ff6020'][i % 3]; c.fillRect(rnd() * 360, rnd() * 170, 1, 1 + (i % 2)); }
  });
  // The Warden's lair - molten heart of the hollow, broken Warden pillars, lava lake
  g('bg_boss', c => {
    sky(c, [[0, '#120406'], [0.5, '#3a0e0a'], [1, '#7a2a10']]);
    c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createRadialGradient(180, 150, 10, 180, 150, 220); gr.addColorStop(0, 'rgba(255,120,40,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(0, 0, 360, 240); c.restore();
    seed = 81; c.fillStyle = '#1a0806'; for (let x = -10; x < 370; x += 18 + rnd() * 14) { const d = 26 + rnd() * 50; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 9, d); c.lineTo(x + 20, 0); c.fill(); }
    for (const [x, h, br] of [[34, 120, 0], [92, 96, 1], [268, 104, 1], [326, 128, 0]] as [number, number, number][]) {
      c.fillStyle = '#2a1414'; c.fillRect(x - 10, 160 - h, 20, h); c.fillStyle = '#3e2020'; c.fillRect(x - 10, 160 - h, 6, h); c.fillStyle = '#4a2a22'; c.fillRect(x - 14, 160 - h, 28, 6);
      if (br) { c.fillStyle = '#3a0e0a'; c.beginPath(); c.moveTo(x - 10, 160 - h); c.lineTo(x + 2, 160 - h + 14); c.lineTo(x + 10, 160 - h); c.fill(); }
      c.fillStyle = '#ffb060'; c.fillRect(x - 2, 160 - h + 20, 4, 4); }
    ground(c, 160, 0x3e2a2a, [0x5a3a30, 0x2a1a1a, 0x7a4a30, 0x4a2a2a], 83);
    for (let y = 206; y < 240; y++) { const t = (y - 206) / 34; c.fillStyle = `rgba(${255},${Math.round(120 - t * 60)},${30},${0.35 + t * 0.4})`; c.fillRect(0, y, 360, 1); }
    seed = 84; c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(255,220,120,0.6)'; c.fillRect(rnd() * 360, 208 + rnd() * 30, 6 + rnd() * 10, 1); } c.restore();
    seed = 85; for (let i = 0; i < 50; i++) { c.fillStyle = ['#ff9a40', '#ffd070', '#ff4020'][i % 3]; c.fillRect(rnd() * 360, rnd() * 200, 1, 2); }
  });
}
