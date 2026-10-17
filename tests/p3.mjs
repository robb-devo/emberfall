import { open } from './lib.mjs';
const h = await open();
await h.devStart('fields', 17, 2, { metElder: true });
console.log(await h.advance(50)); await h.shot('/tmp/p3a.png');
console.log(await h.walkTo(12, 14)); console.log(await h.hero());
await h.shot('/tmp/p3b.png');
// find a monster & walk to it
const pos = await h.E(() => { const w = window.__EMBER.world; const s = w.symbols.filter(s => s.alive).sort((a, b) => (Math.abs(a.tx - w.hero.tx) + Math.abs(a.ty - w.hero.ty)) - (Math.abs(b.tx - w.hero.tx) + Math.abs(b.ty - w.hero.ty)))[0]; return [s.tx, s.ty]; });
console.log(pos, await h.walkTo(pos[0], pos[1]));
await h.wait(1800); await h.shot('/tmp/p3c.png');
await h.key('Enter'); await h.wait(800); await h.shot('/tmp/p3d.png');
console.log(await h.fight()); await h.shot('/tmp/p3e.png');
console.log(await h.hero(), h.errs);
await h.b.close();
