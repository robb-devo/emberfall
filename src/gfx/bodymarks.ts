/**
 * Round 5: body-overlay layer for the adult doll (doll3). Scars, fresh wounds, bandages, tattoos, dirt and blood.
 * Data lives on the Look: `bodyMarks: [{ type, region, variant }]`. Marks are drawn only onto bare skin pixels, so
 * underwear, clothes and armour automatically cover them and they show wherever skin is uncovered (face, forearms,
 * unarmoured torso). Marks are not mature content on their own and show in every mode.
 * To add a new mark: add a pattern to PATTERNS (pixel offsets from the region anchor) and a colour rule in colourOf.
 */
export type MarkType = 'scar' | 'wound' | 'bandage' | 'tattoo' | 'dirt' | 'blood';
export type MarkRegion = 'face' | 'chest' | 'abdomen' | 'back' | 'shoulderL' | 'shoulderR' | 'armL' | 'armR' | 'foreL' | 'foreR' | 'legL' | 'legR';
export interface BodyMark { type: MarkType; region: MarkRegion; variant?: number }
type Px = [number, number, number?]; // dx, dy, tone (0 main, 1 accent, 2 dark)

export const MARK_PRESETS: { name: string; marks: BodyMark[] }[] = [
  { name: 'None', marks: [] },
  { name: 'Duellist', marks: [{ type: 'scar', region: 'face', variant: 0 }, { type: 'scar', region: 'chest', variant: 2 }] },
  { name: 'Sailor Ink', marks: [{ type: 'tattoo', region: 'foreR', variant: 0 }, { type: 'tattoo', region: 'chest', variant: 1 }, { type: 'tattoo', region: 'back', variant: 3 }] },
  { name: 'Pit Fighter', marks: [{ type: 'scar', region: 'abdomen', variant: 1 }, { type: 'tattoo', region: 'armL', variant: 2 }, { type: 'scar', region: 'foreR', variant: 0 }] },
  { name: 'Survivor', marks: [{ type: 'bandage', region: 'foreL', variant: 0 }, { type: 'wound', region: 'shoulderR', variant: 0 }, { type: 'dirt', region: 'legL' }, { type: 'blood', region: 'abdomen' }] },
];
export function marksKey(m?: BodyMark[]) { return m?.length ? 'm' + m.map(k => k.type[0] + k.type[1] + k.region + (k.variant || 0)).join('') : ''; }

const PATTERNS: Record<MarkType, Px[][]> = {
  scar: [
    [[-1, -1], [0, 0], [1, 1], [2, 2]],                                   // diagonal slash
    [[-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]], // stitched cut
    [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 0], [0, 1], [1, 0], [1, 1], [1, 2]].filter((_, i) => i % 2 === 0) as Px[], // claw rake
  ],
  wound: [[[-1, -1, 2], [0, 0, 2], [1, 1, 2], [0, 1, 1], [0, 2, 1], [1, 3, 1]], [[-1, 0, 2], [0, 0, 2], [1, 0, 2], [0, 1, 1], [-1, 2, 1]]],
  bandage: [[[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0, 1], [1, 0], [-1, 1], [0, 1], [1, 1]], [[-3, -1], [-2, -1], [-1, 0], [0, 0, 1], [1, 0], [2, 1], [3, 1], [-2, 0], [1, 1]]],
  tattoo: [
    [[-1, -1], [0, -1], [1, -1], [-1, 1], [0, 1], [1, 1], [0, 0, 1]],                       // band with knot (anchor)
    [[0, -1], [-1, 0], [0, 0, 1], [1, 0], [0, 1], [-1, -2, 1], [1, -2, 1], [0, 2]],           // star sigil
    [[-1, -2], [1, -2], [0, -1], [-1, 0], [1, 0], [0, 1], [-1, 2], [1, 2]],                 // sleeve lattice
    [[-4, -2], [-3, -3], [-2, -3], [-1, -2], [1, -2], [2, -3], [3, -3], [4, -2], [-3, -1], [3, -1], [-2, 0], [2, 0], [0, 1, 1], [0, 2, 1], [0, 3]], // back wings + spine
  ],
  dirt: [[[-1, -1], [1, -2], [0, 0], [2, 1], [-2, 1], [0, 2], [1, 3]]],
  blood: [[[0, -1, 2], [0, 0], [1, 0], [-1, 1], [0, 1, 2], [2, -1], [-2, 2], [0, 2], [0, 3, 1]]],
};
const mix = (a: number, b: number, t: number) => { const f = (s: number) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return (f(16) << 16) | (f(8) << 8) | f(0); };
function colourOf(t: MarkType, tone: number, skin: number) {
  switch (t) {
    case 'scar': return tone ? mix(skin, 0x6a3a3a, 0.45) : mix(skin, 0xfff0ea, 0.42);
    case 'wound': return tone === 2 ? 0x6a0810 : 0xb0141c;
    case 'bandage': return tone ? 0xa01820 : 0xe8e2d4;
    case 'tattoo': return tone ? mix(skin, 0x8a1a2a, 0.55) : mix(skin, 0x1a2a48, 0.62);
    case 'dirt': return mix(skin, 0x4a3a28, 0.45);
    case 'blood': return tone === 2 ? 0x5a0408 : tone ? 0x8a0a12 : 0xa0101a;
  }
}
/** skin pixel test: same hue ratios as the skin colour (shaded skin parts count, clothes/underwear don't) */
function isSkin(c: number, skin: number) {
  if (c < 0) return false;
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, sr = (skin >> 16) & 255, sg = (skin >> 8) & 255, sb = skin & 255;
  const k = r / Math.max(1, sr); if (k < 0.55 || k > 1.08) return false;
  return Math.abs(g / Math.max(1, sg) - k) < 0.05 && Math.abs(b / Math.max(1, sb) - k) < 0.06;
}
export interface MarkCanvas { W: number; H: number; col: Int32Array; set(x: number, y: number, c: number, l?: number, flat?: boolean): void }
/** anchors: region -> pixel anchor for this view (undefined = region not visible from this side) */
export function drawMarks(cv: MarkCanvas, marks: BodyMark[] | undefined, anchors: Partial<Record<MarkRegion, [number, number]>>, skin: number, only?: (r: MarkRegion) => boolean) {
  if (!marks?.length) return;
  for (const m of marks) {
    if (only && !only(m.region)) continue; const a = anchors[m.region]; if (!a) continue;
    const pats = PATTERNS[m.type]; const pat = pats[(m.variant || 0) % pats.length];
    for (const [dx, dy, tone] of pat) {
      const x = Math.round(a[0] + dx), y = Math.round(a[1] + dy); if (x < 0 || y < 0 || x >= cv.W || y >= cv.H) continue;
      if (!isSkin(cv.col[y * cv.W + x], skin)) continue; // covered by clothes / underwear / armour
      cv.set(x, y, colourOf(m.type, tone || 0, skin), 0, true);
    }
  }
}
