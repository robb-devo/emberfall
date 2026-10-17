import { createServer } from 'vite';
const vite = await createServer({ root: '/workspace/emberfall', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { MAPS } = await vite.ssrLoadModule('/src/data/maps.ts'); await vite.close();
for (const id of process.argv.slice(2)) { const m = MAPS[id]; console.log('==', id, m.grid[0].length + 'x' + m.grid.length);
  for (const n of m.npcs) console.log(' npc', n.id, n.x, n.y, n.script, n.cond || '');
  for (const t of m.triggers) console.log(' trg', t.x, t.y, t.w||1, t.h||1, t.script, t.cond || '', t.once||'');
  for (const w of m.warps) console.log(' warp', w.x, w.y, '->', w.to, w.tx, w.ty, w.cond || '');
  for (const s of (m.saves||[])) console.log(' save', JSON.stringify(s)); }
