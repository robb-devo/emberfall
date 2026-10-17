// node tests/tools/r5gore.mjs <prefix> -> Adult ON battle: crit kill dismemberment + pools (shots at several moments)
import { open } from '../lib.mjs';
const prefix = process.argv[2] || '/tmp/gore';
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(() => localStorage.setItem('ember_adult', '1'));
await h.devStart('village', 14, 9, { chapter1Done: true, tut_battle: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(['thornhare', 'cinderImp', 'glimmer'], { bg: 'bg_road' }); });
for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
await h.wait(1800);
await h.E(() => { const b = window.__EMBER.scene('Battle'); b.foes.forEach(f => f.hp = 3); });
await h.key('Enter'); await h.wait(300); await h.key('Enter');
for (const [i, ms] of [[1, 1500], [2, 700], [3, 1200]]) { await h.wait(ms); await h.shot(`${prefix}-${i}.png`); }
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
