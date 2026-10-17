/**
 * Painted dialogue busts (round 3). Generated at runtime from the same Look + equipment data as the
 * paper-doll, so every hero, companion and named NPC gets a matching anime-style portrait: gradient-shaded
 * skin, big glossy eyes per face type, layered hair locks per style with shine, gear (helm/hat/hood/plate,
 * capes, amulets) and a warm rim light. Cached as textures 'pt_<dollKey>'.
 */
import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { SKIN, HAIR, EYES, OUTFIT, HAIR_STYLES, shade, dollKey, type DollSpec } from '../systems/paperdoll';

export const PW = 240, PH = 270;
const css = (c: number, a = 1) => `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
const cool = (c: number, f: number) => { const d = shade(c, f); const r = (d >> 16) & 255, g = (d >> 8) & 255, b = d & 255; return (Math.round(r * 0.9) << 16) | (Math.round(g * 0.9) << 8) | Math.min(255, Math.round(b * 1.1 + 14)); };
const line = (c: number) => cool(c, 0.32);

type Ctx = CanvasRenderingContext2D;
function fillStroke(g: Ctx, path: () => void, top: number, bot: number, y0: number, y1: number, outline: number, lw = 3) {
  g.beginPath(); path(); const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, css(top)); gr.addColorStop(1, css(bot)); g.fillStyle = gr; g.fill();
  g.lineWidth = lw; g.strokeStyle = css(outline); g.lineJoin = 'round'; g.stroke();
}
/** soft side shading clipped to the current path */
function sideShade(g: Ctx, path: () => void, x0: number, x1: number, c: number, a = 0.45) {
  g.save(); g.beginPath(); path(); g.clip(); const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, css(c, 0)); gr.addColorStop(1, css(c, a)); g.fillStyle = gr; g.fillRect(0, 0, PW, PH); g.restore();
}

export function ensurePortrait(scene: Phaser.Scene, sp: DollSpec): string {
  const key = 'pt_' + dollKey(sp);
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, PW, PH)!; const g = tex.getContext();
  paint(g, sp); tex.refresh(); tex.setFilter(Phaser.Textures.FilterMode.LINEAR); return key;
}

function paint(g: Ctx, sp: DollSpec) {
  const L = sp.look, E = sp.equip as any;
  const skin = SKIN[L.skin % SKIN.length], hair = HAIR[L.hair % HAIR.length], eye = EYES[L.eyes % EYES.length];
  const o1 = OUTFIT[L.outfit % OUTFIT.length], o2 = OUTFIT[L.outfit2 % OUTFIT.length];
  const style = HAIR_STYLES[L.hairStyle % HAIR_STYLES.length];
  const vis = (id?: string) => id ? (ITEMS[id] as any)?.vis : undefined;
  const armor = vis(E.armor), hd = vis(E.head), acc = vis(E.acc);
  let body = o1, trim = o2; if (armor && armor.c1 >= 0) { body = armor.c1; trim = armor.c2 ?? shade(armor.c1, 0.7); }
  const cx = 120, hy = 112; // head centre
  g.translate(0, 8);
  const hairPath = { back: null as null | (() => void) };
  // ---------------- cape (behind everything)
  if (acc?.type === 'cape') fillStroke(g, () => { g.moveTo(8, PH); g.quadraticCurveTo(20, 205, 70, 196); g.lineTo(170, 196); g.quadraticCurveTo(220, 205, 232, PH); g.closePath(); }, shade(acc.c1, 1.05), cool(acc.c1, 0.6), 196, PH, line(acc.c1));
  // ---------------- back hair
  const hairBack = () => {
    if (style === 'Flowing') { g.moveTo(cx - 62, hy - 10); g.bezierCurveTo(cx - 80, hy + 60, cx - 78, hy + 120, cx - 60, hy + 150); g.quadraticCurveTo(cx - 30, hy + 140, cx, hy + 152); g.quadraticCurveTo(cx + 30, hy + 140, cx + 60, hy + 150); g.bezierCurveTo(cx + 78, hy + 120, cx + 80, hy + 60, cx + 62, hy - 10); g.closePath(); }
    else if (style === 'Bob') { g.moveTo(cx - 64, hy - 10); g.bezierCurveTo(cx - 76, hy + 30, cx - 70, hy + 62, cx - 52, hy + 70); g.lineTo(cx + 52, hy + 70); g.bezierCurveTo(cx + 70, hy + 62, cx + 76, hy + 30, cx + 64, hy - 10); g.closePath(); }
    else if (style === 'Ponytail') { g.moveTo(cx + 40, hy - 50); g.bezierCurveTo(cx + 110, hy - 40, cx + 100, hy + 60, cx + 70, hy + 120); g.quadraticCurveTo(cx + 74, hy + 50, cx + 48, hy - 10); g.closePath(); }
    else return false; return true;
  };
  if (!hd || hd.type === 'circlet' || hd.type === 'bandana') { g.beginPath(); if (hairBack()) { hairPath.back = hairBack; fillStroke(g, hairBack, shade(hair, 0.85), cool(hair, 0.55), hy - 40, hy + 150, line(hair)); } }
  // ---------------- shoulders / torso
  const torso = () => { g.moveTo(14, PH); g.bezierCurveTo(16, 222, 40, 206, 88, 198); g.lineTo(152, 198); g.bezierCurveTo(200, 206, 224, 222, 226, PH); g.closePath(); };
  fillStroke(g, torso, shade(body, 1.08), cool(body, 0.62), 196, PH, line(body));
  sideShade(g, torso, 120, 226, cool(body, 0.5), 0.5);
  if (armor?.type === 'plate') {
    for (const s of [-1, 1]) fillStroke(g, () => { g.ellipse(cx + s * 78, 222, 40, 26, s * -0.25, 0, Math.PI * 2); }, shade(body, 1.35), cool(body, 0.6), 196, 248, line(body));
    g.strokeStyle = css(shade(body, 1.6), 0.8); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 34, 236); g.quadraticCurveTo(cx, 246, cx + 34, 236); g.stroke();
  } else if (armor?.type === 'robe') {
    g.fillStyle = css(trim); g.beginPath(); g.moveTo(cx - 32, 198); g.lineTo(cx - 10, PH); g.lineTo(cx + 10, PH); g.lineTo(cx + 32, 198); g.closePath(); g.fill(); g.strokeStyle = css(line(trim)); g.lineWidth = 2; g.stroke();
  } else if (armor?.type === 'jerkin') {
    g.strokeStyle = css(0x7a4e2a); g.lineWidth = 9; g.beginPath(); g.moveTo(cx - 44, 200); g.lineTo(cx + 30, PH); g.stroke();
  }
  // collar
  const vneck = !armor || armor.type === 'tunic' || armor.type === 'jerkin';
  fillStroke(g, () => { g.moveTo(cx - 34, 196); g.lineTo(cx, vneck ? 236 : 214); g.lineTo(cx + 34, 196); g.lineTo(cx + 22, 194); g.lineTo(cx, 220); g.lineTo(cx - 22, 194); g.closePath(); }, shade(trim, 1.15), cool(trim, 0.7), 194, 236, line(trim), 2);
  if (acc?.type === 'cape') { fillStroke(g, () => { g.ellipse(cx - 46, 204, 12, 10, 0, 0, Math.PI * 2); }, 0xffe7a0, 0xb88a30, 194, 214, 0x5a3a10, 2); }
  // ---------------- neck
  const neck = () => { g.moveTo(cx - 20, hy + 52); g.lineTo(cx - 22, 204); g.quadraticCurveTo(cx, 216, cx + 22, 204); g.lineTo(cx + 20, hy + 52); g.closePath(); };
  fillStroke(g, neck, cool(skin, 0.72), shade(skin, 0.9), hy + 50, 210, line(skin), 2.5);
  if (acc?.type === 'amulet') { g.strokeStyle = css(0xd8d8e0); g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - 20, 200); g.quadraticCurveTo(cx, 226, cx + 20, 200); g.stroke(); fillStroke(g, () => g.ellipse(cx, 228, 7, 8, 0, 0, Math.PI * 2), shade(acc.c1, 1.4), cool(acc.c1, 0.6), 220, 236, line(acc.c1), 2); }
  // ---------------- head
  const ears = () => { for (const s of [-1, 1]) { g.moveTo(cx + s * 52, hy + 4); g.ellipse(cx + s * 54, hy + 12, 9, 15, s * 0.2, 0, Math.PI * 2); } };
  fillStroke(g, ears, shade(skin, 1.02), cool(skin, 0.75), hy - 4, hy + 28, line(skin), 2.5);
  const face = () => { g.moveTo(cx - 54, hy - 6); g.bezierCurveTo(cx - 56, hy + 40, cx - 30, hy + 66, cx, hy + 72); g.bezierCurveTo(cx + 30, hy + 66, cx + 56, hy + 40, cx + 54, hy - 6); g.bezierCurveTo(cx + 54, hy - 70, cx - 54, hy - 70, cx - 54, hy - 6); g.closePath(); };
  fillStroke(g, face, shade(skin, 1.08), shade(skin, 0.94), hy - 60, hy + 72, line(skin), 3);
  sideShade(g, face, cx + 10, cx + 58, cool(skin, 0.7), 0.55);
  // blush
  for (const s of [-1, 1]) { const rg = g.createRadialGradient(cx + s * 32, hy + 36, 1, cx + s * 32, hy + 36, 16); rg.addColorStop(0, 'rgba(255,120,130,0.32)'); rg.addColorStop(1, 'rgba(255,120,130,0)'); g.fillStyle = rg; g.fillRect(cx + s * 32 - 16, hy + 20, 32, 32); }
  // ---------------- eyes
  const ft = L.face % 4; // Bright, Gentle, Sleepy, Fierce
  const eyW = ft === 1 ? 15 : ft === 3 ? 15 : 16, eyH = ft === 0 ? 17 : ft === 3 ? 12 : 15, ey = hy + 14;
  for (const s of [-1, 1]) {
    const ex = cx + s * 24;
    const eyeP = () => { g.ellipse(ex, ey, eyW, eyH, 0, 0, Math.PI * 2); };
    g.save(); g.beginPath(); eyeP(); g.clip();
    g.fillStyle = '#fbf8f4'; g.fillRect(ex - 20, ey - 20, 40, 40);
    const ir = eyH * 0.86, iy = ey + 2;
    const ig = g.createLinearGradient(0, iy - ir, 0, iy + ir); ig.addColorStop(0, css(cool(eye, 0.35))); ig.addColorStop(0.55, css(eye)); ig.addColorStop(1, css(shade(eye, 1.55)));
    g.fillStyle = ig; g.beginPath(); g.ellipse(ex - s * 1, iy, ir * 0.78, ir, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = css(cool(eye, 0.2)); g.beginPath(); g.ellipse(ex - s * 1, iy + 1, ir * 0.34, ir * 0.48, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(ex - 20, ey - eyH, 40, eyH * 0.45); // lid shadow
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex - 5, iy - 6, 4, 4.5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(ex + 4, iy + 6, 2, 0, Math.PI * 2); g.fill();
    // sleepy: heavy lid
    if (ft === 2) { g.fillStyle = css(shade(skin, 0.96)); g.fillRect(ex - 20, ey - 20, 40, 20 - eyH * 0.15); }
    g.restore();
    // upper lash line
    const top = ft === 2 ? ey - eyH * 0.15 : ey - eyH * 0.92;
    g.strokeStyle = css(cool(hair, 0.22)); g.lineCap = 'round'; g.lineWidth = 4.5;
    g.beginPath();
    if (ft === 3) { g.moveTo(ex - s * eyW, ey - 2); g.quadraticCurveTo(ex, top - 3 + s * 0, ex + s * (eyW + 3), top - 6); }
    else if (ft === 2) { g.moveTo(ex - eyW, top + 1); g.quadraticCurveTo(ex, top - 2, ex + eyW, top + 1); }
    else { g.moveTo(ex - s * (eyW + 1), ey - 3); g.quadraticCurveTo(ex - s * 2, top - 4, ex + s * (eyW + 3), ey - eyH * 0.7); }
    g.stroke();
    g.lineWidth = 2; g.beginPath(); g.moveTo(ex - eyW * 0.6, ey + eyH * 0.95); g.quadraticCurveTo(ex, ey + eyH * 1.08, ex + eyW * 0.6, ey + eyH * 0.95); g.strokeStyle = css(cool(skin, 0.5), 0.8); g.stroke();
    // brows
    g.strokeStyle = css(cool(hair, 0.5)); g.lineWidth = 4;
    g.beginPath();
    const by = ey - eyH - 12;
    if (ft === 3) { g.moveTo(ex + s * 16, by - 6); g.lineTo(ex - s * 12, by + 4); }
    else if (ft === 1) { g.moveTo(ex - s * 12, by + 2); g.quadraticCurveTo(ex, by - 4, ex + s * 15, by + 3); }
    else { g.moveTo(ex - s * 13, by + 1); g.quadraticCurveTo(ex, by - 5, ex + s * 15, by); }
    g.stroke();
  }
  // nose + mouth
  g.strokeStyle = css(cool(skin, 0.55)); g.lineWidth = 2.2; g.beginPath(); g.moveTo(cx + 3, hy + 34); g.lineTo(cx, hy + 42); g.lineTo(cx + 4, hy + 43); g.stroke();
  const my = hy + 54; g.lineWidth = 2.6; g.strokeStyle = css(0x6a2a2a);
  if (ft === 0) { g.beginPath(); g.moveTo(cx - 10, my - 2); g.quadraticCurveTo(cx, my + 12, cx + 10, my - 2); g.closePath(); g.fillStyle = '#8a2d34'; g.fill(); g.stroke(); g.fillStyle = '#e4707a'; g.beginPath(); g.ellipse(cx, my + 5, 5, 2.5, 0, 0, Math.PI * 2); g.fill(); }
  else if (ft === 1) { g.beginPath(); g.moveTo(cx - 9, my); g.quadraticCurveTo(cx, my + 6, cx + 9, my); g.stroke(); }
  else if (ft === 2) { g.beginPath(); g.moveTo(cx - 6, my + 1); g.lineTo(cx + 6, my + 1); g.stroke(); }
  else { g.beginPath(); g.moveTo(cx - 8, my + 2); g.quadraticCurveTo(cx + 2, my + 2, cx + 10, my - 3); g.stroke(); }
  // ---------------- front hair / headgear
  const covered = hd && (hd.type === 'helm' || hd.type === 'hood');
  if (!covered) frontHair(g, style, cx, hy, hair, !!hd && (hd.type === 'wizard' || hd.type === 'cap'));
  if (hd) headgear(g, hd, cx, hy, hair);
  // ---------------- warm rim light on the right edge + soft bottom fade
  g.save(); g.globalCompositeOperation = 'source-atop';
  const rl = g.createLinearGradient(PW - 70, 0, PW, 0); rl.addColorStop(0, 'rgba(255,214,150,0)'); rl.addColorStop(1, 'rgba(255,214,150,0.35)'); g.fillStyle = rl; g.fillRect(0, -10, PW, PH);
  g.globalCompositeOperation = 'destination-out'; const bf = g.createLinearGradient(0, PH - 60, 0, PH - 8); bf.addColorStop(0, 'rgba(0,0,0,0)'); bf.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = bf; g.fillRect(0, PH - 70, PW, 70);
  g.restore();
}

function lock(g: Ctx, x0: number, y0: number, x1: number, y1: number, tx: number, ty: number, bend: number) {
  g.moveTo(x0, y0); g.quadraticCurveTo((x0 + tx) / 2 + bend, (y0 + ty) / 2, tx, ty); g.quadraticCurveTo((x1 + tx) / 2 + bend * 0.6, (y1 + ty) / 2, x1, y1);
}
function frontHair(g: Ctx, style: string, cx: number, hy: number, hair: number, hatted: boolean) {
  const top = hy - 66;
  const cap = () => { g.moveTo(cx - 60, hy + 6); g.bezierCurveTo(cx - 66, top - 8, cx + 66, top - 8, cx + 60, hy + 6); g.lineTo(cx + 50, hy - 18); g.lineTo(cx - 50, hy - 18); g.closePath(); };
  const locks: [number, number, number, number, number, number, number][] = [];
  const spikes: [number, number, number, number, number, number, number][] = [];
  const hl = hy - 30; // hairline
  // bangs across the forehead: [x0,y0,x1,y1,tipx,tipy,bend]
  const bang = (n: number, len: number, jag: number) => { for (let i = 0; i < n; i++) { const a = cx - 56 + (112 / n) * i, b = a + 112 / n + 8; const t = (i + 0.5) / n; locks.push([a - 4, hl - 16, b, hl - 16, a + (b - a) * (0.35 + 0.3 * t), hl + len + (i % 2 ? jag : 0) - Math.abs(t - 0.5) * 18, (t - 0.5) * -14]); } };
  if (style === 'Spiky') { bang(5, 34, -10); for (let i = 0; i < 7; i++) { const t = i / 6, ang = Math.PI * (1.05 + t * 0.9), r = 62; const bx = cx + Math.cos(ang) * 44, by = hy - 20 + Math.sin(ang) * 44, px = -Math.sin(ang) * 20, py = Math.cos(ang) * 20; spikes.push([bx - px, by - py, bx + px, by + py, cx + Math.cos(ang + 0.12) * (r + 30), hy - 20 + Math.sin(ang + 0.12) * (r + 26), 0]); } }
  else if (style === 'Tousled') { bang(6, 30, -9); }
  else if (style === 'Flowing') { bang(4, 26, -6); for (const s of [-1, 1]) locks.push([cx + s * 62, hy - 30, cx + s * 44, hy - 20, cx + s * 58, hy + 96, s * 8]); }
  else if (style === 'Ponytail') { bang(5, 22, -6); for (const s of [-1, 1]) locks.push([cx + s * 58, hy - 20, cx + s * 46, hy - 10, cx + s * 54, hy + 40, s * 4]); }
  else if (style === 'Bob') { bang(7, 28, -4); for (const s of [-1, 1]) locks.push([cx + s * 64, hy - 30, cx + s * 44, hy - 20, cx + s * 54, hy + 62, s * 10]); }
  else { /* Crest */ bang(4, 14, -6); spikes.push([cx - 22, hy - 50, cx + 18, hy - 50, cx + 6, top - 52, 10]); spikes.push([cx - 4, hy - 56, cx + 30, hy - 46, cx + 44, top - 30, 8]); }
  const all = () => { cap(); for (const L of [...spikes, ...locks]) lock(g, ...L); };
  const hc = hair;
  for (const L of spikes) fillStroke(g, () => lock(g, ...L), shade(hc, 1.1), cool(hc, 0.7), L[5], L[1], line(hc));
  if (!hatted) fillStroke(g, cap, shade(hc, 1.12), cool(hc, 0.7), top, hy, line(hc));
  for (const L of locks) fillStroke(g, () => lock(g, ...L), shade(hc, 1.05), cool(hc, 0.62), L[1], L[5], line(hc), 2.5);
  // shine band + side shading
  g.save(); g.beginPath(); all(); g.clip();
  if (!hatted) { g.strokeStyle = css(shade(hc, 1.7), 0.55); g.lineWidth = 7; g.beginPath(); g.arc(cx, hy + 4, 64, Math.PI * 1.15, Math.PI * 1.45); g.stroke(); g.lineWidth = 4; g.beginPath(); g.arc(cx, hy + 4, 64, Math.PI * 1.52, Math.PI * 1.62); g.stroke(); }
  const sg = g.createLinearGradient(cx, 0, cx + 66, 0); sg.addColorStop(0, css(cool(hc, 0.5), 0)); sg.addColorStop(1, css(cool(hc, 0.5), 0.45)); g.fillStyle = sg; g.fillRect(0, 0, PW, PH);
  g.restore();
}
function headgear(g: Ctx, v: any, cx: number, hy: number, hair: number) {
  const a = v.c1, b = v.c2 ?? shade(a, 1.3);
  switch (v.type) {
    case 'helm': {
      const dome = () => { g.moveTo(cx - 66, hy + 30); g.lineTo(cx - 64, hy - 10); g.bezierCurveTo(cx - 66, hy - 92, cx + 66, hy - 92, cx + 64, hy - 10); g.lineTo(cx + 66, hy + 30); g.lineTo(cx + 50, hy + 34); g.lineTo(cx + 48, hy - 8); g.lineTo(cx - 48, hy - 8); g.lineTo(cx - 50, hy + 34); g.closePath(); };
      fillStroke(g, dome, shade(a, 1.5), cool(a, 0.55), hy - 80, hy + 30, line(a));
      sideShade(g, dome, cx, cx + 66, cool(a, 0.4), 0.55);
      fillStroke(g, () => { g.rect(cx - 52, hy - 16, 104, 12); }, shade(a, 1.2), cool(a, 0.6), hy - 16, hy - 4, line(a), 2);
      fillStroke(g, () => { g.rect(cx - 5, hy - 12, 10, 40); }, shade(a, 1.3), cool(a, 0.6), hy - 12, hy + 28, line(a), 2);
      fillStroke(g, () => { g.moveTo(cx - 6, hy - 76); g.quadraticCurveTo(cx + 30, hy - 120, cx + 70, hy - 96); g.quadraticCurveTo(cx + 30, hy - 96, cx + 8, hy - 70); g.closePath(); }, shade(b, 1.2), cool(b, 0.6), hy - 120, hy - 70, line(b), 2);
      g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 5; g.beginPath(); g.arc(cx, hy - 10, 54, Math.PI * 1.2, Math.PI * 1.42); g.stroke();
      break;
    }
    case 'wizard': {
      fillStroke(g, () => { g.moveTo(cx - 52, hy - 40); g.quadraticCurveTo(cx - 10, hy - 110, cx + 20, hy - 140); g.quadraticCurveTo(cx + 60, hy - 140, cx + 80, hy - 118); g.quadraticCurveTo(cx + 40, hy - 120, cx + 30, hy - 100); g.lineTo(cx + 52, hy - 40); g.closePath(); }, shade(a, 1.2), cool(a, 0.55), hy - 140, hy - 40, line(a));
      fillStroke(g, () => { g.rect(cx - 50, hy - 54, 100, 14); }, shade(b, 1.2), cool(b, 0.6), hy - 54, hy - 40, line(b), 2);
      fillStroke(g, () => { g.ellipse(cx, hy - 38, 96, 18, 0, 0, Math.PI * 2); }, shade(a, 1.15), cool(a, 0.5), hy - 56, hy - 20, line(a));
      g.fillStyle = '#ffe9a0'; g.beginPath(); g.arc(cx + 14, hy - 80, 5, 0, Math.PI * 2); g.fill();
      break;
    }
    case 'cap': {
      fillStroke(g, () => { g.moveTo(cx - 60, hy - 24); g.bezierCurveTo(cx - 62, hy - 96, cx + 62, hy - 96, cx + 60, hy - 24); g.closePath(); }, shade(a, 1.2), cool(a, 0.6), hy - 90, hy - 24, line(a));
      fillStroke(g, () => { g.ellipse(cx - 6, hy - 24, 70, 12, -0.05, 0, Math.PI * 2); }, shade(a, 0.95), cool(a, 0.5), hy - 36, hy - 12, line(a), 2);
      fillStroke(g, () => { g.moveTo(cx + 30, hy - 70); g.quadraticCurveTo(cx + 70, hy - 130, cx + 96, hy - 120); g.quadraticCurveTo(cx + 70, hy - 100, cx + 44, hy - 62); g.closePath(); }, shade(b, 1.3), cool(b, 0.6), hy - 130, hy - 60, line(b), 2);
      break;
    }
    case 'bandana': {
      fillStroke(g, () => { g.moveTo(cx - 62, hy - 26); g.quadraticCurveTo(cx, hy - 48, cx + 62, hy - 26); g.lineTo(cx + 62, hy - 10); g.quadraticCurveTo(cx, hy - 32, cx - 62, hy - 10); g.closePath(); }, shade(a, 1.2), cool(a, 0.6), hy - 48, hy - 10, line(a), 2.5);
      fillStroke(g, () => { g.moveTo(cx + 58, hy - 20); g.quadraticCurveTo(cx + 88, hy - 4, cx + 84, hy + 28); g.lineTo(cx + 72, hy + 6); g.lineTo(cx + 60, hy + 22); g.closePath(); }, shade(a, 1.1), cool(a, 0.55), hy - 20, hy + 28, line(a), 2);
      break;
    }
    case 'circlet': {
      g.strokeStyle = css(shade(a, 1.2)); g.lineWidth = 5; g.beginPath(); g.moveTo(cx - 58, hy - 22); g.quadraticCurveTo(cx, hy - 46, cx + 58, hy - 22); g.stroke();
      g.strokeStyle = css(line(a)); g.lineWidth = 1.5; g.stroke();
      fillStroke(g, () => { g.moveTo(cx, hy - 46); g.lineTo(cx + 8, hy - 36); g.lineTo(cx, hy - 26); g.lineTo(cx - 8, hy - 36); g.closePath(); }, shade(b, 1.5), cool(b, 0.6), hy - 46, hy - 26, line(b), 2);
      break;
    }
    case 'hood': {
      const hood = () => { g.moveTo(cx - 76, hy + 96); g.bezierCurveTo(cx - 90, hy - 40, cx - 60, hy - 96, cx, hy - 96); g.bezierCurveTo(cx + 60, hy - 96, cx + 90, hy - 40, cx + 76, hy + 96); g.lineTo(cx + 56, hy + 80); g.bezierCurveTo(cx + 66, hy - 10, cx + 50, hy - 54, cx, hy - 56); g.bezierCurveTo(cx - 50, hy - 54, cx - 66, hy - 10, cx - 56, hy + 80); g.closePath(); };
      fillStroke(g, hood, shade(a, 1.15), cool(a, 0.55), hy - 96, hy + 96, line(a));
      sideShade(g, hood, cx, cx + 90, cool(a, 0.4), 0.5);
      // hair peeking + shadow under the hood
      frontHair(g, 'Tousled', cx, hy + 8, hair, true);
      g.save(); g.beginPath(); g.ellipse(cx, hy - 20, 58, 40, 0, Math.PI, 0); g.closePath(); g.clip(); g.fillStyle = 'rgba(20,10,30,0.35)'; g.fillRect(0, 0, PW, PH); g.restore();
      break;
    }
  }
}

/** Name -> look registry, so dialogue can find a portrait for any speaker. */
const REG = new Map<string, DollSpec>();
export function registerSpeaker(name: string, sp: DollSpec) { if (name && sp?.look) REG.set(name.toLowerCase(), sp); }
export function speakerSpec(name: string): DollSpec | undefined { return REG.get(name.toLowerCase()) || REG.get(name.toLowerCase().split(/[ ,(]/)[0]); }
