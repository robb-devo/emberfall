import { open } from './lib.mjs';
const h = await open();
await h.devStart('hollow', 14, 30, { metElder: true, trig_hollowIntro: true });
console.log(await h.walkTo(14, 16)); console.log(await h.fight());
await h.devStart('lair', 8, 17, { metElder: true });
console.log(await h.E(() => { const w = window.__EMBER.world; return { act: window.__EMBER.active(), busy: w.busy, ib: window.__EMBER.Input.stack.length, modal: w.ui.modal, moving: w.hero.moving, st: w.sys.settings.status }; }));
await h.b.close();
