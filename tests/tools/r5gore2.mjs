// node tests/tools/r5gore2.mjs <prefix> -> Adult ON: three crit kills in a row (dismemberment, pools, vignette) on human-ish foes
import { open } from '../lib.mjs';
const prefix = process.argv[2] || '/tmp/gore';
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(() => localStorage.setItem('ember_adult', '1'));
await h.devStart('road', 22, 12, { chapter1Done: true, tut_battle: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(['ashwolf', 'zealot', 'drowned'], { bg: 'bg_road' }); });
for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
await h.wait(1800);
await h.E(() => { const b = window.__EMBER.scene('Battle'); b.foes.forEach((f, i) => setTimeout(() => { b.damageFoe(f, 5, true); f.lastCrit = true; b.killFoe(f); }, i * 260)); });
for (const [i, ms] of [[1, 450], [2, 500], [3, 900]]) { await h.wait(ms); await h.shot(`${prefix}-${i}.png`); }
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
