import { open } from '../lib.mjs';
const prefix = process.argv[2] || 'r3-tr';
const h = await open(process.env.URL);
await h.devStart('village', 14, 9, { chapter1Done: true, ch2Started: true, tut_battle: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = false; }); await h.wait(1500);
await h.E(() => { window.__EMBER.overlay.tweens.timeScale = 0.15; }); h.E(() => { window.__EMBER.world.startBattle(['glimmer', 'thornhare'], { bg: 'bg_fields' }); });
for (let i = 0; i < 60; i++) { const f = await h.E(() => !!window.__EMBER.game.textures.exists('__snap')); if (f) { await h.wait(1500); await h.shot(`progress/${prefix}-shatter.png`); break; } await h.wait(100); }
await h.wait(3000);
await h.devStart('village', 14, 9, { chapter1Done: true, ch2Started: true, tut_battle: true }, 'warrior', {});
await h.wait(1500);
h.E(() => { const w = window.__EMBER.world; w.doWarp(w.def.id, 14, 9, 0); });
await h.wait(150); await h.shot(`progress/${prefix}-wipe.png`);
await h.wait(1200); console.log(await h.E(() => window.__EMBER.overlay.wipeT));
console.log('errors', h.errs.slice(0, 8)); await h.b.close();
