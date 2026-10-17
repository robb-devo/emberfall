// node tests/tools/bshots.mjs prefix  -> progress/<prefix>-battle-<bg>.png for every backdrop
import { open } from '../lib.mjs';
const prefix = process.argv[2] || 'r3-b'; const only = process.argv[3]?.split(',');
const h = await open(process.env.URL);
const sets = [[['glimmer', 'thornhare'], 'bg_fields'], [['duskbat', 'mossback'], 'bg_hollow'], [['cinderImp', 'hollowKnight'], 'bg_road'], [['warden'], 'bg_boss', true], [['glimmer'], 'bg_coast'], [['glimmer', 'glimmer'], 'bg_grotto'], [['cantor'], 'bg_choir', true]];
await h.devStart('village', 14, 9, { chapter1Done: true, tut_battle: true }, 'warrior', {});
for (const [group, bg, boss] of sets) {
  if (only && !only.includes(bg)) continue;
  const ok = await h.E(([g]) => g.every(id => window.__EMBER.scene('Battle') && true), [group]);
  await h.E(([g, bg, boss]) => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(g, { bg, boss }); }, [group, bg, boss]);
  for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
  await h.wait(2400); await h.shot(`progress/${prefix}-battle-${bg.slice(3)}.png`);
  await h.E(() => { const b = window.__EMBER.scene('Battle'); const cb = b.d?.onEnd; b.scene.stop(); cb?.('flee'); }); await h.wait(900);
}
console.log('errors', h.errs.slice(0, 8)); await h.b.close();
