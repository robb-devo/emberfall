// Round 5: maps-check variant where Adult-only props/NPCs also block movement (so the dark props never cut a path).
import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { MAPS, LEGEND } = await vite.ssrLoadModule('/src/data/maps.ts'); await vite.close();
let bad = 0; const fail = (m) => { bad++; console.log('✗', m); };
for (const [id, m] of Object.entries(MAPS)) {
  const g = m.grid, H = g.length, W = g[0].length;
  if (!g.every(r => r.length === W)) fail(`${id}: ragged grid`);
  for (const r of g) for (const ch of r) if (!LEGEND[ch]) { fail(`${id}: unknown tile '${ch}'`); break; }
  const solid = (x, y) => x < 0 || y < 0 || x >= W || y >= H || !!LEGEND[g[y][x]]?.solid;
  const blocked = new Set([...m.chests.map(c => c.x + ',' + c.y), ...m.saves.map(s => s.x + ',' + s.y), ...m.npcs.filter(n => !n.hidden && !n.wander && (!n.cond || n.cond.startsWith('adult'))).map(n => n.x + ',' + n.y)]);
  for (const n of m.npcs) if (solid(n.x, n.y) && !n.counter && n.script !== 'none') fail(`${id}: npc ${n.id} on solid ${g[n.y]?.[n.x]} @${n.x},${n.y}`);
  for (const c of m.chests) if (solid(c.x, c.y)) console.log('  (note)', `${id}: chest ${c.id} on solid @${c.x},${c.y}`);
  for (const s of m.saves) if (solid(s.x, s.y) && g[s.y][s.x] !== 'x') fail(`${id}: save on solid @${s.x},${s.y}`);
  for (const w of m.warps) { const t = MAPS[w.to]; if (!t) { fail(`${id}: warp to unknown ${w.to}`); continue; } const tg = t.grid; if (LEGEND[tg[w.ty]?.[w.tx]]?.solid !== false && LEGEND[tg[w.ty]?.[w.tx]]?.solid) fail(`${id}: warp target ${w.to}@${w.tx},${w.ty} is solid (${tg[w.ty]?.[w.tx]})`); }
  // reachability from the first warp's position
  const start = m.warps[0]; if (!start) continue;
  const seen = new Set([start.x + ',' + start.y]); const q = [[start.x, start.y]];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (seen.has(k) || solid(nx, ny) || blocked.has(k)) continue; seen.add(k); q.push([nx, ny]); } }
  const near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
  for (const w of m.warps) if (!near(w.x, w.y)) fail(`${id}: warp @${w.x},${w.y} -> ${w.to} unreachable`);
  for (const c of m.chests) if (!near(c.x, c.y)) fail(`${id}: chest ${c.id} unreachable`);
  for (const n of m.npcs) if (!n.hidden && n.script !== 'none' && !near(n.x, n.y) && !(n.counter && [[0, 2], [0, 1]].some(([dx, dy]) => seen.has((n.x + dx) + ',' + (n.y + dy))))) fail(`${id}: npc ${n.id} unreachable`);
  for (const s of m.saves) if (!near(s.x, s.y)) fail(`${id}: save unreachable`);
  for (const t of m.triggers) { let ok = false; for (let yy = t.y; yy < t.y + (t.h || 1); yy++) for (let xx = t.x; xx < t.x + (t.w || 1); xx++) if (seen.has(xx + ',' + yy)) ok = true; if (!ok) fail(`${id}: trigger ${t.script} unreachable`); }
}
console.log(bad ? `${bad} problems` : 'maps OK'); process.exit(bad ? 1 : 0);
