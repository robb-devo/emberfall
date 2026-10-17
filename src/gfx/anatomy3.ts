/**
 * Round 5 (steering 18:35): hand-placed 3-tone musculature + low-res anatomy for the ADULT doll3 set.
 * Stamps are 12-px-wide pixel maps (x = centre-6 … centre+5) painted as flat pixels over the lit body so they
 * survive dithering. Tones are derived per skin colour, with stronger highlights on dark skin.
 * Anatomy stamps are only called from doll3 when Adult is ON and a party member is unclothed (never doll2, never children).
 */
import type { Canvas } from './doll2';
import { ramp } from './doll2';
import { shade } from '../systems/paperdoll';

const mix = (a: number, b: number, t: number) => { const f = (k: number) => Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); return (f(16) << 16) | (f(8) << 8) | f(0); };
const lum = (c: number) => (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;

const NATURAL = [0x2a2233, 0x6b3f22, 0xc9783a, 0xf0d27a];
export function tones(skin: number, hair0: number) {
  const hair = NATURAL.includes(hair0) ? hair0 : 0x5a3a28; // dyed / fantasy hair colours -> natural brown body hair
  const dk = 1 - lum(skin); // 0 light … ~0.7 dark
  const g = mix(skin, 0xa04a44, 0.22); // genital / areola skin: a little warmer
  return {
    H: mix(skin, 0xfff2e0, 0.2 + dk * 0.38), h: mix(skin, 0xffe8cc, 0.08 + dk * 0.2), s: ramp(skin, -1), S: ramp(skin, -2),
    n: shade(mix(skin, 0x8a3438, 0.4), 0.7), a: shade(mix(skin, 0x9a5048, 0.3), 0.86),
    p: mix(shade(hair, 0.5), 0x2a1c18, 0.4), P: mix(shade(hair, 0.72), 0x3a2820, 0.25),
    k: mix(g, 0xfff0e0, 0.14 + dk * 0.3), g: shade(g, 0.88), o: shade(g, 0.8), G: shade(g, 0.48),
  } as Record<string, number>;
}
/** paint a stamp; only over existing pixels whose colour is in `on` (bare skin) unless the char is upper-case-forced via `force` */
export function stamp(cv: Canvas, cx: number, y0: number, rows: string[], T: Record<string, number>, on: Set<number>, force = '') {
  rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) {
    const ch = r[i]; if (ch === '.' || !(ch in T)) continue; const x = cx - 6 + i, y = y0 + j; if (x < 0 || y < 0 || x >= cv.W || y >= cv.H) continue;
    const k = y * cv.W + x; if (!force.includes(ch) && !on.has(cv.col[k])) continue; cv.set(x, y, T[ch], 0, true);
  } });
}
const mirror = (rows: string[]) => rows.map(r => r.split('').reverse().join('').padStart(12, '.').slice(0, 12)).map(r => r.slice(1) + '.'); // 12-wide around centre

// ---------------------------------------------------------------- front torso (y 17…32), x centred on HX
export const M_FRONT = [
  '.hHHhh.hhh..', // 17 traps / shoulder tops
  'hHssh..hss.s', // 18 collarbones
  'Hh.hh..h.h.s', // 19 deltoid + upper chest
  'hHHHhh.hhh.s', // 20 pec highlight
  '.hHHhh.hhhss', // 21
  '.hhhn.s.nh.s', // 22 nipples
  '..sssS.Ssss.', // 23 lower pec line
  '...h.sS.h..s', // 24
  '...hHsShh..s', // 25 abs 1
  '....ssSs...s', // 26
  '...hHsShh..s', // 27 abs 2
  '....ssSs...s', // 28
  '...hhsShh.ss', // 29 abs 3
  '...s..S..ss.', // 30 navel
  '..s.hh.hs.s.', // 31
  '..S.h..hS...', // 32 iliac V
];
export const F_FRONT = [
  '..hHh..hh...', // 17
  '.hss.h.ss...', // 18 collarbones
  '..hh...hh.s.', // 19
  '..hHh..hHh..', // 20 upper breast
  '.hHHhhshHhs.', // 21
  '.hhaahsaahs.', // 22 areolae
  '.shanSsans..', // 23 nipples
  '..sSSS.SSSs.', // 24 under-bust shadow
  '...s....s...', // 25
  '..s..hs...s.', // 26
  '..s..hs...s.', // 27
  '.s...hs....s', // 28 waist
  '.s...Ss....s', // 29 navel
  '..h..h....s.', // 30
  '.hh.......ss', // 31 hip curve
  '.hH.s..s.ss.', // 32
];
export const F_FRONT_UNDIES = F_FRONT.map((r, j) => (j >= 3 && j <= 7 ? '............' : r)); // bra covers the bust rows
export const M_FRONT_UNDIES = M_FRONT;
// ---------------------------------------------------------------- back torso (y 17…31)
export const BACK = [
  '.hHHh..hhh..', // 17
  'hHhh....hh.s', // 18
  '.h.h.s.h...s', // 19
  '.hHs.s.sh..s', // 20 shoulder blades
  '.hhs.s..s..s', // 21
  '..ss.s.ss..s', // 22
  '.....s.....s', // 23
  '..h..s..h..s', // 24
  '..h..s..h..s', // 25 lats
  '...h.s.h...s', // 26
  '...h.s.h..s.', // 27
  '....hsh...s.', // 28
  '....hsh..s..', // 29
  '...s.s.s.s..', // 30 dimples
];
// ---------------------------------------------------------------- unclothed (Adult ON only) – lower body, x centred on the hips
export const M_GROIN = [
  '....pP.p....', // 33 pubic hair (sparse, textured)
  '...pPpPPp...', // 34
  '...pokgop...', // 35 base of the penis inside the hair
  '..GkokgGkoG.', // 36 shaft between the two testicles (crease on its shaded side)
  '..GookgGooG.', // 37
  '...GokgGoG..', // 38
  '....GkgG....', // 39 glans
  '.....GG.....', // 40 underside shadow
];
export const F_GROIN = [
  '...pP.pPp...', // 33 pubic hair (sparse, tapering triangle)
  '....pPPp....', // 34
  '.....pP.....', // 35
  '.....p......', // 36
  '.....Gs.....', // 37 vulva cleft
  '.....G......', // 38
];
export const GLUTES = [
  '..hHhSShh...', // 33
  '.hHHhShHhs..', // 34
  '.hHhhShhhs..', // 35
  '.hhhsSshss..', // 36
  '..sSS.SSs...', // 37 gluteal fold
];
export const FORCE_GROIN = 'pPgGkoSs'; // these may hang into the thigh gap
export { mirror };
