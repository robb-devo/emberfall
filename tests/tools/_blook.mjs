import { open } from '../lib.mjs';
const h = await open(process.env.URL);
const sets = JSON.parse(process.argv[2]);
await h.devStart('saltmere', 19, 14, { chapter1Done: true, ch2Started: true, metIone: true }, 'warrior', {});
await h.E(() => { const G = window.__EMBER.Game; G.hero.lv = 10; });
for (const [group, bg, name, boss] of sets) {
  await h.E(([g, bg, boss]) => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(g, { bg, boss }); }, [group, bg, boss]);
  await h.waitForBattle?.(); for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200); await h.wait(2200); await h.shot(`/tmp/b_${name}.png`);
  console.log(h.errs.slice(-3)); await h.E(() => { const b = window.__EMBER.scene('Battle'); const cb = b.d?.onEnd; b.scene.stop(); cb?.('flee'); });
  await h.wait(800);
}
console.log('errors', h.errs.slice(0, 8)); await h.b.close();
