// node tests/tools/r6wounds.mjs <prefix> -> Adult ON: wounds accumulating on living foes, then corpses with open wounds/entrails
import { open } from '../lib.mjs';
const prefix = process.argv[2] || '/tmp/wounds';
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(() => localStorage.setItem('ember_adult', '1'));
await h.devStart('road', 22, 12, { chapter1Done: true, tut_battle: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(['ashwolf', 'zealot', 'drowned'], { bg: 'bg_road' }); });
for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
await h.wait(1800);
await h.E(() => { const b = window.__EMBER.scene('Battle'); b.foes.forEach(f => { f.hp = 9999; }); b.foes.forEach((f, i) => [0, 1, 2, 3].forEach(k => setTimeout(() => b.damageFoe(f, 3, k === 3), k * 300 + i * 90))); });
await h.wait(2200); await h.shot(`${prefix}-1.png`);
await h.E(() => { const b = window.__EMBER.scene('Battle'); b.foes.forEach((f, i) => setTimeout(() => { f.lastCrit = false; b.killFoe(f); }, i * 200)); });
await h.wait(2600); await h.shot(`${prefix}-2.png`);
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
