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
// R6b: "less pixel heap" – sparse, soft form shading only (few clean lines, no checker noise)
export const M_FRONT = [
  '............', // 17
  '..hhh..hhh..', // 18 collarbones
  '............', // 19
  '.hh......hh.', // 20 upper pec light
  '............', // 21
  '..n......n..', // 22 nipples
  '..ssss.sss..', // 23 lower pec line (soft)
  '............', // 24
  '......s.....', // 25 linea alba
  '............', // 26
  '......s.....', // 27
  '............', // 28
  '......s.....', // 29
  '......S.....', // 30 navel
  '............', // 31
  '...s.....s..', // 32 iliac V (subtle)
];
export const F_FRONT = [
  '............', // 17
  '..hh....hh..', // 18 collarbones
  '............', // 19
  '............', // 20
  '.hh.....hh..', // 21 bust light
  '............', // 22
  '..a......a..', // 23 nipples
  '..sss..sss..', // 24 under-bust shadow
  '............', // 25
  '............', // 26
  '............', // 27
  '............', // 28
  '......S.....', // 29 navel
  '............', // 30
  '..s......s..', // 31 hip
  '............', // 32
];
export const F_FRONT_UNDIES = F_FRONT.map((r, j) => (j >= 3 && j <= 7 ? '............' : r)); // bra covers the bust rows
export const M_FRONT_UNDIES = M_FRONT;
// ---------------------------------------------------------------- back torso (y 17…31)
export const BACK = [
  '............', // 17
  '..hh....hh..', // 18
  '............', // 19
  '..s......s..', // 20 shoulder blades
  '...s....s...', // 21
  '............', // 22
  '......s.....', // 23 spine
  '............', // 24
  '......s.....', // 25
  '............', // 26
  '......s.....', // 27
  '............', // 28
  '....s...s...', // 29 dimples
];
// ---------------------------------------------------------------- unclothed (Adult ON only) – lower body, x centred on the hips
// R6b: normal, small proportions for a 32x64 sprite (~1 px wide, 2–3 px long), neutral standing pose
export const M_GROIN = [
  '.....pp.....', // 33 pubic hair (sparse)
  '....pPPp....', // 34
  '.....og.....', // 35 penis
  '....GogG....', // 36 scrotum hint
  '.....g......', // 37
];
export const F_GROIN = [
  '.....pp.....', // 33
  '....pPPp....', // 34
  '.....pp.....', // 35
  '......s.....', // 36
];
export const GLUTES = [
  '............', // 33
  '..h.....h...', // 34
  '......S.....', // 35 cleft
  '..ss.S.ss...', // 36 gluteal fold
];
export const FORCE_GROIN = 'pPgGkoSs'; // these may hang into the thigh gap
export { mirror };
