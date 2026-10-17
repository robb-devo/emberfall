import { open } from '../lib.mjs';
const h = await open('http://localhost:5180/');
await h.devStart('road', 2, 14, { chapter1Done: true, ch2Started: true, roadIntro: true, trig_roadIntro: true }, 'warrior', {});
console.log(await h.E(() => { const w = window.__EMBER.world; return { pell: w.findPath(24, 5, true)?.length, mule: w.findPath(6, 7, true)?.length, exit: w.findPath(47, 18)?.length, pil: w.findPath(33,14,true)?.length }; }));
await h.b.close();
