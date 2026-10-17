// Normal-speed battle smoke test (no fast mode): kill FX, hit-stop, camera punch and victory flow must not throw or soft-lock.
import { open } from './lib.mjs';
const h = await open(process.argv[2] || 'http://localhost:5173/');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
await h.devStart('fields', 14, 3, { metElder: true, wokeUp: true, tut_battle: true, tut_victory: true }, 'warrior', {});
for (const [group, bg] of [[['thornhare'], 'bg_fields'], [['thornhare', 'glimmer', 'glimmer'], 'bg_fields']]) {
  const g0 = await h.E(() => window.__EMBER.Game.s.gold);
  await h.E(([g, bg]) => { window.__EMBER.Game.hero.level = 6; window.__EMBER.Game.healAll(); window.__EMBER.world.startBattle(g, { bg }); }, [group, bg]);
  for (let i = 0; i < 50 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
  const t0 = Date.now(); let done = false;
  for (let i = 0; i < 300 && Date.now() - t0 < 120000; i++) { if (!(await h.E(() => window.__EMBER.active().includes('Battle')))) { done = true; break; } await h.key('Enter', 1, 150); }
  ok(done, `battle ${group.join('+')} finished at normal speed`);
  ok(await h.E(() => window.__EMBER.Game.s.gold) > g0, 'spoils awarded');
}
ok(!h.errs.length, 'no errors ' + JSON.stringify(h.errs.slice(0, 3)));
console.log(fails ? `${fails} FAILED` : 'ALL PASS'); await h.b.close(); process.exit(fails ? 1 : 0);
