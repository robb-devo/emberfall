// Usage: node tests/tools/r3shots.mjs <prefix> [only-names,comma]  -> progress/<prefix>-<name>.png
import { open } from '../lib.mjs';
const prefix = process.argv[2] || 'r3-now'; const only = process.argv[3]?.split(',');
const h = await open(process.env.URL);
const spots = [
  ['village', 14, 9, {}, 'village'],
  ['village', 22, 16, { night: true }, 'village-night'],
  ['saltmere', 19, 21, {}, 'saltmere'],
  ['road', 8, 15, {}, 'road'],
  ['fields', 18, 20, {}, 'fields'],
  ['hollow', 6, 6, {}, 'hollow'],
  ['grotto1', 0, 0, {}, 'grotto'],
];
for (const [map, x, y, flags, name] of spots) {
  if (only && !only.includes(name)) continue;
  let X = x, Y = y;
  if (!x) { const st = await h.E(m => { /* find first floor tile near centre */ return null; }, map); }
  await h.devStart(map, X, Y, Object.assign({ chapter1Done: true, ch2Started: true }, flags || {}), 'warrior', {});
  if (!x) { await h.E(() => { const w = window.__EMBER.world; const g = w.grid; for (let r = Math.floor(g.length / 2); r < g.length; r++) for (let c = 2; c < g[0].length; c++) if (!w.solidAt(c, r)) { w.scene.restart({ map: w.def.id, x: c, y: r, dir: 0 }); return; } }); await h.wait(1200); }
  await h.E(() => { window.__EMBER.fast = false; });
  await h.wait(2200);
  await h.shot(`progress/${prefix}-${name}.png`);
}
const battles = [[['glimmer', 'thornhare'], 'bg_fields', 'battle-fields'], [['duskbat', 'mossback'], 'bg_hollow', 'battle-hollow'], [['cinderImp','hollowKnight'], 'bg_road', 'battle-road']];
for (const [group, bg, name] of battles) {
  if (only && !only.includes(name)) continue;
  await h.devStart('village', 14, 9, { chapter1Done: true, tut_battle: true }, 'warrior', {});
  await h.E(([g, bg]) => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(g, { bg }); }, [group, bg]);
  for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
  await h.wait(2600); await h.shot(`progress/${prefix}-${name}.png`);
}
console.log('errors', h.errs.slice(0, 8)); await h.b.close();
