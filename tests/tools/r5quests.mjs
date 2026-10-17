// Round 5 functional check of the dark quests / actions (Adult ON). Choices are scripted via a pick queue.
import { open } from '../lib.mjs';
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(() => localStorage.setItem('ember_adult', '1'));
await h.devStart('saltmere', 20, 13, { chapter1Done: true, ch2Started: true, tut_talk: true, tut_battle: true }, 'warrior', { gold: 1000 });
await h.wait(1500);
await h.E(() => { const ui = window.__EMBER.world.ui; ui.choice = async () => (window.__picks.length ? window.__picks.shift() : 0); });
let bad = 0;
const run = async (script, picks, flags = {}) => {
  await h.E(([s, p, f]) => { window.__picks = p; Object.assign(window.__EMBER.Game.s.flags, f); window.__EMBER.world.runScript(s); }, [script, picks, flags]);
  await h.wait(300); for (let i = 0; i < 12; i++) { const r = await h.advance(120); if (r === 'battle') { await h.wait(2500); await h.E(() => { const b = window.__EMBER.scene('Battle'); b.foes.forEach(f => f.hp = 1); }); await h.fight(600); continue; } if (r === 'idle') break; }
};
const check = async (label, fn) => { const ok = await h.E(fn); console.log(ok ? '✓' : '✗', label); if (!ok) bad++; };
const G = 'window.__EMBER.Game';
// Penance Road: letters back
await run('x_coffinOpen', [], { penanceAsked: true });
await check('letters taken from coffin', () => window.__EMBER.Game.has('letters'));
await run('x_ysolde', [0]);
await check('penance freed: cord, karma 3, quest done', () => { const g = window.__EMBER.Game; return g.has('penitentCord') && g.s.flags.karma === 3 && g.s.quests.penance === 'done' && !g.has('letters'); });
// Rob Pell
await h.E(() => { window.__EMBER.Game.s.quests.mule = 'done'; window.__EMBER.Game.s.flags.metPell = true; });
await run('pell', [1]);
await check('robbed Pell (+infamy)', () => window.__EMBER.Game.s.flags.robbedPell && window.__EMBER.Game.s.flags.infamy >= 3);
// Starmilk: three doses -> hooked; Maren cure
for (let i = 0; i < 3; i++) await run('x_dose', [0]);
await check('hooked after 3 doses + grey mark', () => window.__EMBER.Game.s.flags.milkHooked && window.__EMBER.Game.hero.look.bodyMarks.some(m => m.type === 'dirt'));
await run('maren', [0], { metMaren: true });
await check('Maren cure clears hook', () => !window.__EMBER.Game.s.flags.milkHooked);
await run('x_caddoc', [1, 0]);
await check('took Caddoc\'s shard', () => window.__EMBER.Game.has('greyShard') && window.__EMBER.Game.s.flags.caddocDead);
// Sell a companion
await h.E(() => { const { Game } = window.__EMBER; const m = JSON.parse(JSON.stringify(Game.hero)); m.id = 'c_test'; m.name = 'Bertrand'; Game.s.party.push(m); });
await run('x_sallow', [0]);
await check('sold companion', () => window.__EMBER.Game.s.party.length === 1 && window.__EMBER.Game.s.flags.soldMate === 'Bertrand');
// Prisoner
await run('x_wenlow', [2], { grottoDone: true });
await check('spared Wenlow', () => window.__EMBER.Game.s.flags.wenlowSpared && window.__EMBER.Game.s.flags.wenlowDone);
// Ash Tithe -> Brenna
await run('nanPearl', [], { relit: true });
await run('x_titheBones', []);
await run('hallam', [2]); await run('brenna', []);
await check('tithe judged by Brenna', () => window.__EMBER.Game.s.flags.titheBrenna && window.__EMBER.Game.s.quests.tithe === 'done');
// Mercy Knight duel
await h.devStart('gull', 10, 8, { chapter1Done: true, ch2Started: true, tut_talk: true, tut_battle: true }, 'warrior', { gold: 1000 }); await h.wait(1500);
await h.E(() => { const ui = window.__EMBER.world.ui; ui.choice = async () => (window.__picks.length ? window.__picks.shift() : 0); });
await run('x_hollis', []); await run('x_orla', []); await run('x_hollis', [0]);
await check('Hollis duel -> blade', () => window.__EMBER.Game.has('mercyBlade') && window.__EMBER.Game.s.flags.hollisGone);
// Drinking blackout x3
for (let i = 0; i < 3; i++) await run('x_drink', []);
await check('blackout tattoo', () => window.__EMBER.Game.s.flags.blackout1 && window.__EMBER.Game.hero.look.bodyMarks.some(m => m.type === 'tattoo'));
await run('x_epitaph', []);
console.log('karma/infamy', await h.E(() => [window.__EMBER.Game.s.flags.karma, window.__EMBER.Game.s.flags.infamy]));
console.log('errors', h.errs.slice(0, 5)); console.log(bad ? `${bad} failed` : 'dark quests OK'); await h.b.close(); process.exit(bad ? 1 : 0);
