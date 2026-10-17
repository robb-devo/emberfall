/** Fast deterministic hash / value-noise helpers for the procedural HD painters. */
const P = new Float32Array(256 * 256);
{ let s = 1337; for (let i = 0; i < P.length; i++) { s = (s * 16807) % 2147483647; P[i] = s / 2147483647; } }
/** integer hash -> [0,1) */
export const hash = (x: number, y: number, k = 0) => P[(((x * 73 + k * 191) & 255) << 8) | ((y * 151 + k * 37 + (x >> 8) * 17) & 255)];
const sm = (t: number) => t * t * (3 - 2 * t);
/** smooth value noise in [0,1) */
export function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
  const a = P[((xi & 255) << 8) | (yi & 255)], b = P[(((xi + 1) & 255) << 8) | (yi & 255)];
  const c = P[((xi & 255) << 8) | ((yi + 1) & 255)], d = P[(((xi + 1) & 255) << 8) | ((yi + 1) & 255)];
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
export function fbm(x: number, y: number, oct = 3) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < oct; i++) { v += noise(x * f + i * 17.3, y * f + i * 9.1) * a; n += a; a *= 0.5; f *= 2.03; } return v / n; }
export const clamp = (v: number, a = 0, b = 1) => v < a ? a : v > b ? b : v;
export const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export type RGB = [number, number, number];
export const rgb = (c: number): RGB => [(c >> 16) & 255, (c >> 8) & 255, c & 255];
export const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const mul = (a: RGB, f: number): RGB => [a[0] * f, a[1] * f, a[2] * f];
/** Worley/cellular: returns [d1, d2, cellHash] for cell size `s` */
export function cells(x: number, y: number, s: number, jit = 0.8): [number, number, number, number, number] {
  const cx = Math.floor(x / s), cy = Math.floor(y / s); let d1 = 1e9, d2 = 1e9, h = 0, fx = 0, fy = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = cx + i, gy = cy + j; const px = (gx + 0.5 + (hash(gx, gy, 3) - 0.5) * jit) * s, py = (gy + 0.5 + (hash(gx, gy, 4) - 0.5) * jit) * s;
    const d = Math.hypot(x - px, y - py);
    if (d < d1) { d2 = d1; d1 = d; h = hash(gx, gy, 5); fx = px; fy = py; } else if (d < d2) d2 = d;
  }
  return [d1, d2, h, fx, fy];
}
