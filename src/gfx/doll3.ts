/**
 * Round 5: ADULT paper-doll set (32x64 per frame, ~6.5 heads tall, OT2-like proportions).
 * The default body for the hero, companions and every adult NPC in all modes. Children keep the small doll2 set.
 * Same frame layout (dir*3+step; dirs F,S(left),S(right, mirrored),B), same Look + equipment `vis` data, so
 * gear shows in the world, menus and battle.
 *
 * Settings → Adult ON + a party member with no body armour = simple low-res unclothed body with basic
 * anatomy (standing / walking frames only, non-sexual). This file is ONLY ever used for adult characters.
 */
import Phaser from 'phaser';
import { ITEMS } from '../data/items';
import { Mature } from '../systems/mature';
import { SKIN, HAIR, EYES, OUTFIT, HAIR_STYLES, shade, type DollSpec } from '../systems/paperdoll';
import { Canvas, weapon, shield } from './doll2';

export const FW3 = 32, FH3 = 64;
type Dir = 'F' | 'S' | 'B';
type Fn = (x: number, y: number) => boolean;
const HX = 16, HY = 9.8; // head centre

function inHead(x: number, y: number, rx: number, ry: number, cy = HY, cx = HX) { return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 < 1; }

function hairMask(style: string, d: Dir, fem: boolean): { front: Fn; back?: Fn } {
  if (d === 'B') {
    const base: Fn = (x, y) => inHead(x, y, 4.3, 5.0, 9.6) && y < 14;
    const m: Record<string, Fn> = {
      Flowing: (x, y) => base(x, y) || (y >= 10 && y < 27 && Math.abs(x + 0.5 - HX) < 4.4 - (y - 10) * 0.05),
      Ponytail: (x, y) => base(x, y) || (y >= 10 && y < 24 && Math.abs(x + 0.5 - HX - Math.sin(y * 0.5) * 0.4) < 1.5 - (y - 10) * 0.03),
      Bob: (x, y) => base(x, y) || (y < 16 && inHead(x, y, 4.7, 5.6, 10.2)),
      Spiky: (x, y) => base(x, y) || (y >= 3 && y < 6 && [13, 16, 19].some(s => Math.abs(x + 0.5 - s) < (y - 3) * 0.6)),
      Crest: (x, y) => Math.abs(x + 0.5 - HX) < 1.4 && y >= 3 && y < 13 && inHead(x, y, 4.3, 6, 9),
      Tousled: (x, y) => base(x, y) || (y === 14 && x % 2 === 0 && Math.abs(x + 0.5 - HX) < 3),
    };
    return { front: m[style] || base };
  }
  if (d === 'S') { // facing left; face at small x
    const cap: Fn = (x, y) => inHead(x, y, 4.2, 4.9, 9.6) && (y < 8 || x > 16.5 + (y - 8) * 0.1) && y < 14;
    const m: Record<string, Fn> = {
      Flowing: (x, y) => cap(x, y) || (x >= 15 && x < 21 && y >= 9 && y < 26 - (x - 15) * 0.4),
      Ponytail: (x, y) => cap(x, y) || (y >= 7 && y < 22 && Math.abs(x + 0.5 - (20.5 + (y - 7) * 0.2)) < 1.4 - (y - 7) * 0.03),
      Bob: (x, y) => cap(x, y) || (x >= 14 && y < 15 && inHead(x, y, 4.6, 5.4, 10)),
      Spiky: (x, y) => cap(x, y) || (y >= 3 && y < 6 && [14, 17, 20].some(s => Math.abs(x + 0.5 - s - (6 - y) * 0.6) < (y - 3) * 0.5)) || (x >= 19 && x < 21 && y > 6 && y < 11),
      Crest: (x, y) => (y >= 3 && y < 8 && x > 13 && x < 19 && inHead(x, y, 4.2, 6, 9)),
      Tousled: (x, y) => cap(x, y) || (x >= 18 && x < 21 && y >= 8 && y < 15 && (y < 13 || x % 2 === 0)),
    };
    return { front: m[style] || cap };
  }
  const top: Fn = (x, y) => inHead(x, y, 4.3, 4.9, 9.6) && y < 8;
  const bangs: Record<string, (x: number) => number> = {
    Tousled: x => 8 + ((x * 7) % 3 === 0 ? 1 : 0), Spiky: x => 8 + (x % 3 === 0 ? 1 : 0), Flowing: x => 8 + (Math.abs(x + 0.5 - 15) < 1.5 ? 0 : 1),
    Ponytail: x => 8, Bob: x => 9, Crest: x => 0,
  };
  const sides: Record<string, number> = { Tousled: 12, Spiky: 11, Flowing: 26, Ponytail: 11, Bob: 15, Crest: 0 };
  if (style === 'Crest') return { front: (x, y) => Math.abs(x + 0.5 - HX) < 1.4 && y >= 3 && y < 7 && inHead(x, y, 4.3, 6, 9) };
  const by = bangs[style] || bangs.Tousled, sd = sides[style] ?? 12;
  const front: Fn = (x, y) => {
    if (top(x, y)) return true;
    if (inHead(x, y, 4.3, 5, 9.8) && y < by(x)) return true;
    if ((x < 12.6 || x > 18.4) && y < Math.min(sd, 15) && inHead(x, y, 4.6, 5.6, 10.2)) return true;
    if (style === 'Spiky' && y >= 3 && y < 6 && [13, 16, 19].some(s => Math.abs(x + 0.5 - s) < (y - 2.5) * 0.6)) return true;
    return false;
  };
  const back: Fn | undefined = style === 'Flowing' ? (x, y) => y >= 9 && y < 27 && Math.abs(x + 0.5 - HX) < 5 - (y - 9) * 0.03 && !(y > 13 && Math.abs(x + 0.5 - HX) < 2.5)
    : style === 'Ponytail' ? (x, y) => y >= 4 && y < 7 && Math.abs(x + 0.5 - HX) < 2 : undefined;
  return { front, back };
}
function paintHair(cv: Canvas, fn: Fn, hair: number, d: Dir) {
  cv.part();
  for (let y = 0; y < 30; y++) for (let x = 0; x < FW3; x++) {
    if (!fn(x, y)) continue;
    const nx = (x + 0.5 - HX) / 5, ny = (y + 0.5 - 8.5) / 6, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    let l = -nx * 0.7 - ny * 0.5 + nz * 0.5 - 0.1;
    if (((x * 2 + y * 3) % 5) === 0) l -= 0.4;
    if (y === 6 && d !== 'B' && Math.abs(x - 15) < 2) l += 0.8;
    cv.set(x, y, hair, l);
  }
}
function headgear(cv: Canvas, v: any, d: Dir) {
  if (!v) return; const a = v.c1, b = v.c2 ?? shade(a, 1.3);
  switch (v.type) {
    case 'bandana': cv.box(11, 6, 10, 2, a, 0.2); if (d !== 'F') cv.poly([[d === 'S' ? 19 : 15, 7], [d === 'S' ? 23 : 16.5, 9], [d === 'S' ? 21 : 16, 12]], shade(a, 0.85)); break;
    case 'wizard': cv.poly([[9, 6.5], [23, 6.5], [21.5, 8], [10.5, 8]], a, 0.1); cv.poly([[12, 6.5], [20, 6.5], [18, 1], [15, -1]], a); cv.box(12, 5, 8, 2, b, 0.4); break;
    case 'helm': cv.ell(HX, 8.6, 4.8, 4.6, a, (x, y) => y < 9 || (d === 'B' && y < 13) || (d === 'S' && x > 14 && y < 13) || (d === 'F' && (x < 13 || x > 18) && y < 13)); cv.box(d === 'S' ? 12 : 11, 8, d === 'S' ? 9 : 10, 1, shade(a, 0.8), 0.2); cv.ell(HX, 3.6, 1.1, 1.5, b); break;
    case 'circlet': cv.box(12, 7, 8, 1, a, 0.6); if (d === 'F') cv.set(16, 7, b, 0.6, true); break;
    case 'hood': cv.ell(HX, 10, 4.9, 5.6, a, (x, y) => d === 'B' ? y < 16 : d === 'S' ? (x > 14 || y < 7) && y < 16 : (y < 7 || x < 13 || x > 18) && y < 16, -0.1); if (d === 'B') cv.poly([[14, 15], [18, 15], [16, 19]], shade(a, 0.9)); break;
    case 'cap': cv.ell(HX, 7, 4.6, 2.8, a, (x, y) => y < 8); cv.box(d === 'S' ? 9 : 11, 7, d === 'S' ? 7 : 10, 1, shade(a, 0.75)); cv.poly([[19, 5], [23, 1], [21.5, 5.5]], b, 0.5); break;
  }
}
function face(cv: Canvas, d: Dir, f: number, eye: number, skin: number, hair: number, fem: boolean) {
  const dark = 0x22182a, white = 0xf4f2f8, brow = shade(hair, 0.55), mouth = shade(skin, 0.68), nose = shade(skin, 0.8);
  const t = f % 4;
  if (d === 'F') {
    for (const ex of [14, 17]) {
      const inner = ex < 16 ? 1 : 0; // pixel next to the nose
      if (t === 2) { cv.set(ex, 10, dark, 0, true); cv.set(ex + 1, 10, dark, 0, true); }
      else {
        cv.set(ex + (1 - inner), 10, dark, 0, true); cv.set(ex + inner, 10, t === 0 ? white : eye, 0, true);
        if (t === 0 || t === 1) cv.set(ex + (1 - inner), 9.6 + 0.4, eye, 0, true);
        if (fem) cv.set(ex + (1 - inner) + (inner ? -1 : 1), 9, dark, 0, true); // lash flick
      }
      const by = t === 3 ? 8.6 : 8; cv.set(ex, by + (t === 3 && !inner ? 0.6 : 0), brow, 0, true); cv.set(ex + 1, by + (t === 3 && inner ? 0.6 : 0), brow, 0, true);
    }
    cv.set(16, 11.6, nose, 0, true);
    cv.set(15.5, 13, mouth, 0, true); cv.set(16.5, 13, fem ? shade(skin, 0.6) : mouth, 0, true);
    if (!fem) cv.set(16, 14, shade(skin, 0.86), 0, true); // chin
  } else if (d === 'S') {
    cv.set(13, 10, dark, 0, true); if (t !== 2) cv.set(13, 10, t === 0 ? dark : eye, 0, true);
    cv.set(13, 8 + (t === 3 ? 0.6 : 0), brow, 0, true); cv.set(14, 8, brow, 0, true);
    cv.set(12.6, 13, mouth, 0, true);
  }
}
function head(cv: Canvas, d: Dir, skin: number, fem: boolean) {
  if (d === 'S') {
    cv.ell(16, 9.6, 3.9, 4.5, skin, undefined, 0.2); cv.ell(14.4, 12, 2.6, 2.6, skin, undefined, 0.45); // jaw forward
    cv.set(11.8, 11, skin, 0.3); // nose
    cv.ell(17.4, 10.6, 0.8, 1.2, skin, undefined, -0.4); // ear
  } else {
    cv.ell(HX, HY - 0.2, 3.8, 4.5, skin, undefined, 0.2); cv.ell(HX, 12, fem ? 2.8 : 3.2, 2.8, skin, undefined, 0.45);
    if (d === 'F') { cv.ell(12.3, 10.4, 0.7, 1.2, skin, undefined, 0.1); cv.ell(19.7, 10.4, 0.7, 1.2, skin, undefined, -0.4); }
  }
}

function frame(sp: DollSpec, d: Dir, step: number, cv: Canvas) {
  const L = sp.look, E = sp.equip;
  const skin = SKIN[L.skin % SKIN.length], hair = HAIR[L.hair % HAIR.length], eye = EYES[L.eyes % EYES.length];
  const out1 = OUTFIT[L.outfit % OUTFIT.length], out2 = OUTFIT[L.outfit2 % OUTFIT.length];
  const style = HAIR_STYLES[L.hairStyle % HAIR_STYLES.length]; const sturdy = L.body === 1; const fem = (L.fig || 0) === 1;
  const vis = (id?: string) => id ? (ITEMS[id] as any)?.vis : undefined;
  const armor = vis(E.armor), wpn = vis(E.weapon), shd = vis(E.shield), hd = vis(E.head), acc = vis(E.acc);
  let body = out1, trim = out2; if (armor && armor.c1 >= 0) { body = armor.c1; trim = armor.c2 ?? shade(armor.c1, 0.7); }
  let pants = shade(out2, 0.5), boot = 0x5a3a26; const leather = 0x7a4e2a;
  // underwear / Adult layer – party members only (sp.voc). NPCs always keep their clothes.
  const bare = !armor && !!sp.voc; const undiesItem = armor?.type === 'undies';
  const nude = bare && Mature.on, undies = undiesItem || (bare && !nude);
  const uw = undiesItem ? armor.c1 : 0xf2efe8, uw2 = undiesItem ? (armor.c2 ?? shade(armor.c1, 0.7)) : 0xd8d2c8;
  const skinBody = undies || nude;
  if (skinBody) { body = skin; trim = skin; pants = skin; boot = skin; }
  const robe = armor?.type === 'robe', plate = armor?.type === 'plate', jerkin = armor?.type === 'jerkin';
  const sleeve = skinBody ? skin : body, fore = skinBody ? skin : (robe || plate || jerkin) ? (plate ? shade(body, 1.05) : body) : skin;
  const shin = skinBody ? skin : boot;
  const SW = fem ? 5 : sturdy ? 7.4 : 6.4;            // shoulder half-width
  const CW = fem ? 4.8 : sturdy ? 6.6 : 5.6;           // chest
  const WW = fem ? 3.6 : sturdy ? 5.4 : 4.4;           // waist
  const HW = fem ? 5.4 : sturdy ? 5.6 : 4.8;           // hips
  const LX = fem ? 2.8 : sturdy ? 3.1 : 2.8, TR = fem ? 2.3 : sturdy ? 2.5 : 2.2; // leg x offset / thigh radius
  const sw = step === 0 ? 0 : step === 1 ? 1 : -1;
  const hm = hairMask(style, d, fem);
  const capeC = acc?.type === 'cape' ? acc.c1 : -1;
  const skinD = shade(skin, 0.8);

  if (d === 'S') {
    // ---------------------------------------------------------------- side (facing left)
    const st = step === 0 ? 0 : 1, fwd = step === 1 ? 1 : -1;
    if (capeC >= 0) cv.poly([[16, 17], [20, 17], [22 + Math.abs(sw), 56], [16, 57]], capeC, -0.3);
    if (hm.back) paintHair(cv, hm.back, hair, d);
    if (shd) shield(cv, shd, 19.5, 31);
    // back leg + back arm
    const bk = st ? 3.5 * fwd : 0.5;
    cv.cyl(16.6, 35, 16.6 + bk * 0.5, 48, TR - 0.3, shade(pants, 0.82)); cv.cyl(16.6 + bk * 0.5, 48, 16.6 + bk, 59, 1.7, shade(shin, 0.82));
    cv.box(Math.round(16.6 + bk) - 2, 59, 4, 3, shade(skinBody ? skin : boot, 0.85), 0, 1);
    cv.cyl(17.5, 19, 17.5 - sw * 2.4, 28, 1.6, shade(sleeve, 0.8)); cv.cyl(17.5 - sw * 2.4, 28, 17.5 - sw * 3.4, 36, 1.3, shade(fore, 0.8)); cv.ell(17.5 - sw * 3.4, 37.2, 1.2, 1.3, shade(skin, 0.85));
    // torso (side silhouette: chest forward, back straight)
    const chestF = fem ? 12.6 : sturdy ? 12.4 : 13.0;
    if (robe) cv.poly([[13.6, 17], [19, 17], [20.6, 59], [11.6, 59]], body);
    else cv.poly([[14, 16.5], [19, 16.5], [19.6, 24], [18.6, 30], [19.8, 35], [19.2, 37.5], [13.4, 37.5], [13.8, 32], [14.4, 29], [chestF, 23], [13.2, 19]], body);
    if (fem && (nude || undies)) cv.ell(13.4, 23, 1.6, 1.9, skin, undefined, 0.2); // bust profile
    if (!robe && !skinBody) { cv.box(13.6, 31, 6, 1, jerkin ? leather : trim, 0.2); }
    if (plate) { cv.ell(16.5, 18.6, 3, 2.2, shade(body, 1.1)); for (let y = 21; y < 30; y += 2) cv.box(13.6, y, 6, 1, shade(body, 1.2), 0.3); }
    if (jerkin) cv.box(14.4, 17, 1, 13, trim, 0.2);
    // front leg
    const fl = st ? -3.5 * fwd : -0.3;
    cv.cyl(15.6, 35, 15.6 + fl * 0.5, 48, TR, pants); cv.cyl(15.6 + fl * 0.5, 48, 15.6 + fl, 59, 1.8, shin);
    cv.box(Math.round(15.6 + fl) - 3, 59, 5, 3, skinBody ? skin : boot, 0.1, 1); if (!skinBody) cv.box(Math.round(15.6 + fl) - 3, 59, 5, 1, shade(boot, 1.3), 0.5);
    if (robe) cv.poly([[12.4, 32], [19.6, 32], [21, 60], [11, 60]], body, -0.1);
    if (undies) { cv.box(13.6, 33, 6, 4, uw, 0.1, 1); cv.box(13.6, 33, 6, 1, uw2, 0.3); if (fem) cv.box(13, 21, 5, 3, uw, 0.15, 1); }
    if (nude) { cv.set(13.6, 28, skinD, 0, true); cv.set(19.4, 35.4, skinD, 0, true); cv.set(19, 36.4, skinD, 0, true); // navel + buttock crease
      if (fem) cv.set(12.2, 23.4, shade(skin, 0.7), 0, true); }
    // neck + head
    cv.box(14.5, 13.5, 3.5, 4, skin, -0.1);
    head(cv, d, skin, fem); face(cv, d, L.face, eye, skin, hair, fem);
    paintHair(cv, hm.front, hair, d); headgear(cv, hd, d);
    // near arm + weapon
    const ex = 15.6 - sw * 2.6, hx = 15.2 - sw * 3.6, hy = 37.4;
    if (wpn) weapon(cv, wpn, Math.round(hx) - 1, Math.round(hy), d);
    cv.cyl(15.6, 19, ex, 28, 1.7, sleeve); cv.cyl(ex, 28, hx, 36, 1.4, fore); cv.ell(hx, hy, 1.3, 1.4, skin);
    if (acc?.type === 'amulet') cv.set(13.6, 19, acc.c1, 0.6, true);
    return;
  }
  // ---------------------------------------------------------------- front / back
  const F = d === 'F';
  const shY = 16.8;
  const lsx = HX - SW + 0.9, rsx = HX + SW - 0.9;                 // shoulder joints (viewer's left/right)
  const lex = HX - SW - 0.7, rex = HX + SW + 0.7;                 // elbows
  const lhx = Math.min(HX - SW - 0.4, HX - HW - 1.4), rhx = Math.max(HX + SW + 0.4, HX + HW + 1.4); // hands (hips flare out on women)
  const ls = F ? -sw : sw, rs = F ? sw : -sw;                       // arm swing (y offset)
  const lhy = 37 + ls, rhy = 37 + rs;
  if (capeC >= 0 && F) cv.poly([[HX - SW, 18], [HX + SW, 18], [HX + SW + 2, 56], [HX - SW - 2, 56]], shade(capeC, 0.8), -0.4);
  if (hm.back && F) paintHair(cv, hm.back, hair, d);
  if (!F && wpn) weapon(cv, wpn, Math.round(rhx), Math.round(rhy), d);
  if (!F && shd) shield(cv, shd, lhx - 1, 31);
  // legs: thigh + shin, lifted foot on step frames
  const lift = (n: number) => (step === 0 ? 0 : (step === 1) === (n === 0) ? 1.6 : 0);
  for (let n = 0; n < 2; n++) {
    const up = lift(n), x = n ? HX + LX : HX - LX, kx = x + (n ? -0.2 : 0.2), fx = x + (n ? 0.2 : -0.2);
    const pc = n ? shade(pants, 0.88) : pants, sc = n ? shade(shin, 0.88) : shin;
    cv.cyl(x, 35, kx, 48 - up * 0.5, TR, pc); cv.cyl(kx, 48 - up * 0.5, fx, 59.5 - up, 1.8, sc);
    cv.box(Math.round(fx) - 2, 59 - Math.round(up), 4, 3, skinBody ? (n ? shade(skin, 0.9) : skin) : boot, n ? -0.2 : 0.1, 1);
    if (!skinBody) cv.box(Math.round(fx) - 2, 59 - Math.round(up), 4, 1, shade(boot, 1.3), 0.4);
    if (!skinBody && !robe) cv.box(Math.round(kx) - 2, 52 - Math.round(up * 0.6), 4, 1, shade(boot, 1.2), 0.3); // boot cuff
  }
  // torso
  const torso: [number, number][] = [[HX - SW, shY], [HX + SW, shY], [HX + CW, 24], [HX + WW, 30], [HX + HW, 35], [HX + HW - 0.6, 37.5], [HX - HW + 0.6, 37.5], [HX - HW, 35], [HX - WW, 30], [HX - CW, 24]];
  cv.poly(torso, body);
  if (robe) cv.poly([[HX - WW - 0.4, 29], [HX + WW + 0.4, 29], [HX + HW + 2.4, 60], [HX - HW - 2.4, 60]], body, -0.05);
  if (F && !robe && !plate && !skinBody) cv.poly([[HX - 1.6, shY], [HX + 1.6, shY], [HX, shY + 3.4]], (armor?.type === 'tunic' || !armor) ? skin : trim, -0.2); // collar V
  if (skinBody) {
    // anatomy-light body shading so a bare torso reads as an adult figure
    cv.set(HX - 2, 18, skinD, 0, true); cv.set(HX + 2, 18, skinD, 0, true); // collarbones
    if (undies) {
      cv.box(Math.round(HX - HW + 0.5), 33, Math.round(HW * 2 - 1), 4, uw, 0.1, 1); cv.box(Math.round(HX - HW + 0.5), 33, Math.round(HW * 2 - 1), 1, uw2, 0.3);
      if (F && !fem) cv.box(15, 34, 2, 2, shade(uw, 0.88), 0);
      if (fem) { if (F) { cv.ell(HX - 2.1, 22.6, 1.9, 1.6, uw, undefined, 0.2); cv.ell(HX + 2.1, 22.6, 1.9, 1.6, uw, undefined, 0.1); } else cv.box(HX - CW + 0.5, 22, CW * 2 - 1, 1.6, uw, 0.15); }
      if (undiesItem) for (const [a, b] of [[HX - 3, 35], [HX + 2, 34], [HX, 36]]) cv.set(a, b, uw2, 0.4, true);
    } else if (F) {
      // Adult ON, unclothed (front): simple low-res anatomy. Non-sexual, standing/walking frames only.
      const nip = shade(skin, 0.66), pub = shade(hair, 0.62);
      if (fem) {
        cv.ell(HX - 2.1, 22.6, 1.9, 1.7, skin, undefined, 0.25); cv.ell(HX + 2.1, 22.6, 1.9, 1.7, skin, undefined, 0.05);
        cv.set(HX - 2.1, 23, nip, 0, true); cv.set(HX + 2.1, 23, nip, 0, true);
        for (const xx of [-3, -2, -1, 1, 2, 3]) cv.set(HX + xx - (xx < 0 ? 0.1 : -0.1), 24.4, shade(skin, 0.82), 0, true); // under-bust shadow
        cv.set(HX - WW, 29, skinD, 0, true); cv.set(HX + WW - 1, 29, skinD, 0, true); // waist
        cv.set(HX, 29, skinD, 0, true);                                                        // navel
        for (const [a, b] of [[15, 35], [16, 35], [17, 35], [15.5, 36], [16.5, 36]]) cv.set(a, b, pub, 0, true);
      } else {
        cv.set(HX - 3, 23.6, skinD, 0, true); cv.set(HX - 2, 24, skinD, 0, true); cv.set(HX + 1, 24, skinD, 0, true); cv.set(HX + 2, 23.6, skinD, 0, true); // pecs
        cv.set(HX - 2.4, 22.4, nip, 0, true); cv.set(HX + 2, 22.4, nip, 0, true);
        cv.set(HX, 29, skinD, 0, true);
        for (const [a, b] of [[15, 34], [16, 34], [17, 34]]) cv.set(a, b, pub, 0, true);
        cv.set(15.5, 35, shade(skin, 0.78), 0, true); cv.set(16.5, 35, shade(skin, 0.86), 0, true); cv.set(15.5, 36, shade(skin, 0.74), 0, true); cv.set(16.5, 36, shade(skin, 0.8), 0, true);
      }
    } else if (nude) {
      cv.set(HX - 2, 22, skinD, 0, true); cv.set(HX + 2, 22, skinD, 0, true); // shoulder blades
      for (let y = 33; y < 38; y++) cv.set(HX, y, shade(skin, 0.74), 0, true); // buttock cleft
      cv.set(HX - 2, 37.6, skinD, 0, true); cv.set(HX + 2, 37.6, skinD, 0, true);
    }
  } else if (!robe) { cv.box(Math.round(HX - WW - 0.5), 31, Math.round(WW * 2 + 1), 2, jerkin ? leather : trim, 0.2); if (F) cv.box(15, 31, 2, 2, 0xf0c75e, 0.6); }
  else { cv.box(Math.round(HX - HW - 2.4), 58, Math.round(HW * 2 + 5), 2, trim, 0.2); if (F) cv.box(15, shY, 2, 41, trim, 0.4); }
  if (jerkin && F) cv.poly([[HX - SW + 1.5, shY], [HX - SW + 3, shY], [HX + WW, 31], [HX + WW - 1.5, 31]], trim, 0.1);
  if (plate) { for (let y = 21; y < 30; y += 3) cv.box(Math.round(HX - CW + 1), y, Math.round(CW * 2 - 2), 1, shade(body, 1.25), 0.4); cv.ell(HX - SW + 0.6, 18.6, 2.8, 2.2, shade(body, 1.1)); cv.ell(HX + SW - 0.6, 18.6, 2.8, 2.2, shade(body, 1.1)); }
  if (capeC >= 0 && !F) cv.poly([[HX - SW - 0.5, 17], [HX + SW + 0.5, 17], [HX + SW + 2.5, 57], [HX - SW - 2.5, 57]], capeC, -0.1);
  if (capeC >= 0 && F) { cv.box(Math.round(HX - SW), 17, Math.round(SW * 2), 2, capeC, 0.3); cv.ell(HX, 18, 1, 1, 0xf0c75e, undefined, 0.5); }
  // arms
  cv.cyl(lsx, 19, lex, 28 + ls * 0.4, fem ? 1.4 : 1.7, F ? sleeve : shade(sleeve, 0.9)); cv.cyl(lex, 28 + ls * 0.4, lhx, lhy - 1, fem ? 1.2 : 1.4, F ? fore : shade(fore, 0.9)); cv.ell(lhx, lhy, 1.3, 1.4, skin);
  cv.cyl(rsx, 19, rex, 28 + rs * 0.4, fem ? 1.4 : 1.7, shade(sleeve, 0.86)); cv.cyl(rex, 28 + rs * 0.4, rhx, rhy - 1, fem ? 1.2 : 1.4, shade(fore, 0.86)); cv.ell(rhx, rhy, 1.3, 1.4, shade(skin, 0.92));
  if (acc?.type === 'amulet' && F) { cv.set(15, 19, 0xd8d8e0, 0.4, true); cv.set(17, 19, 0xd8d8e0, 0.4, true); cv.ell(16, 21, 1, 1.1, acc.c1, undefined, 0.5); }
  // neck + head
  cv.box(fem ? 14.6 : 14, 13.5, fem ? 3 : 4, 4, skin, -0.1);
  head(cv, d, skin, fem);
  if (F) face(cv, d, L.face, eye, skin, hair, fem);
  paintHair(cv, hm.front, hair, d); headgear(cv, hd, d);
  if (F) { if (wpn) weapon(cv, wpn, Math.round(lhx - 0.5), Math.round(lhy), d); if (shd) shield(cv, shd, rhx + 1, 31); }
}

/** Build (or reuse) the adult HD sprite sheet. Frames dir*3+step, 32x64 each, feet on the bottom row. */
export function ensureDoll3(scene: Phaser.Scene, sp: DollSpec, key: string): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, FW3 * 3, FH3 * 4)!; const ctx = tex.getContext(); const img = ctx.createImageData(FW3 * 3, FH3 * 4);
  const dirs: Dir[] = ['F', 'S', 'S', 'B'];
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) {
    const cv = new Canvas(FW3, FH3); frame(sp, dirs[d], s, cv);
    if (d === 2) {
      const tmp = new Uint8ClampedArray(FW3 * FH3 * 4); cv.render(tmp, FW3, 0, 0);
      for (let y = 0; y < FH3; y++) for (let x = 0; x < FW3; x++) { const a = (y * FW3 + x) * 4, b = (((d * FH3) + y) * FW3 * 3 + s * FW3 + (FW3 - 1 - x)) * 4; for (let k = 0; k < 4; k++) img.data[b + k] = tmp[a + k]; }
    } else cv.render(img.data, FW3 * 3, s * FW3, d * FH3);
  }
  ctx.putImageData(img, 0, 0);
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) tex.add(d * 3 + s, 0, s * FW3, d * FH3, FW3, FH3);
  tex.refresh(); return key;
}
