import { open } from './lib.mjs';
const h = await open();
await h.devStart('hearth', 7, 6, { metElder: true, homecoming: true, ledgerOpen: true, night: true, lairDone: true }, 'warrior');
console.log(await h.walkTo(11, 5)); await h.E(() => { const w = window.__EMBER.world; w.hero.dir = 3; w.setFrame(w.hero); });
await h.key('Enter'); await h.wait(300);
for (let i = 0; i < 12; i++) { const m = await h.E(() => { const st = window.__EMBER.Input.stack; return !!(st.length && st[st.length - 1].items); }); if (m) break; await h.key('Enter', 1, 400); }
await h.key('Enter', 1, 400);
await h.wait(1200); await h.shot('/tmp/p5a.png');
console.log(await h.scenes());
await h.key('ArrowUp'); await h.key('Enter'); await h.wait(800);
await h.shot('/tmp/p5b.png');
await h.key('Enter', 1, 600); // joined msg
await h.key('Enter', 1, 400); // create another
await h.wait(1000); await h.key('ArrowDown', 1); await h.key('ArrowRight', 2); await h.key('ArrowUp', 2); await h.key('Enter'); await h.wait(800); await h.key('Enter', 1, 600);
await h.key('ArrowDown', 2, 150); await h.key('Enter', 1, 400);
console.log(await h.advance(30));
await h.shot('/tmp/p5c.png');
console.log(await h.E(() => window.__EMBER.Game.s.party.map(m => m.name + ':' + m.voc)));
console.log(await h.walkTo(6, 10));
console.log(await h.walkTo(14, 21)); await h.shot('/tmp/p5d.png');
console.log(await h.walkTo(14, 22)); await h.wait(1000);
for (let i = 0; i < 60; i++) { const r = await h.advance(1); if (r === 'ended') break; if (i === 20) await h.shot('/tmp/p5e.png'); if (i % 5 === 0) console.log(i, await h.E(() => [window.__EMBER.active(), window.__EMBER.Game.s.party.length, window.__EMBER.world?.def.id, window.__EMBER.world?.hero.tx, window.__EMBER.world?.hero.ty])); await h.wait(150); }
await h.wait(6000); await h.shot('/tmp/p5f.png');
console.log(await h.scenes(), h.errs);
await h.b.close();
