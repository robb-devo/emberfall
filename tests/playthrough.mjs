// Full headless playthrough of the EMBERFALL opening in a mobile viewport.
// Usage: npm run dev (port 5173) then `node tests/playthrough.mjs [url]`
import { open } from './lib.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://localhost:5173/';
const SS = URL_(process.env.SS || './screenshots/');
function URL_(p) { fs.mkdirSync(p, { recursive: true }); return p; }
const h = await open(URL);
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const shot = async n => { await h.shot(SS + n + '.png'); log('screenshot', n); };
const assert = (c, m) => { if (!c) { console.error('ASSERT FAILED:', m, h.errs); process.exit(1); } };
const state = () => h.E(() => { const G = window.__EMBER.Game.s; return { lvl: G.party[0].level, hp: G.party[0].hp, gold: G.gold, map: G.map, flags: G.flags, party: G.party.length, inv: G.inv, quests: G.quests }; });
const topIsMenu = () => h.E(() => { const st = window.__EMBER.Input.stack; return !!(st.length && st[st.length - 1].items); });
const untilMenu = async (n = 30) => { for (let i = 0; i < n; i++) { if (await topIsMenu()) return true; await h.key('Enter', 1, 300); } return false; };
const symbolsLeft = () => h.E(() => window.__EMBER.world.symbols.filter(s => s.alive).length);
async function go(x, y, adj = false) {
  let r;
  for (let i = 0; i < 12; i++) {
    r = await h.walkTo(x, y, adj);
    if (r === 'battle' || (await h.scenes()).includes('Battle')) { await h.fightSmart(); await h.advance(40); continue; }
    break;
  }
  return r;
}
async function talk(x, y) { for (let k = 0; k < 6; k++) { const r = await go(x, y, true); const p = await h.hero(); if (p && Math.abs(p.x - x) + Math.abs(p.y - y) <= 1) break; } return h.talkTo(x, y); }
async function grind(level, map) {
  for (let n = 0; n < 60; n++) {
    const s = await state(); if (s.lvl >= level) return;
    if (s.map !== map) { log('grind interrupted: now in', s.map); return; }
    if (await symbolsLeft() === 0) { await h.E(() => { const w = window.__EMBER.world; w.scene.restart({ map: w.def.id, x: w.hero.tx, y: w.hero.ty, dir: 0, noBanner: true }); }); await h.wait(1200); }
    const pos = await h.E(() => { const w = window.__EMBER.world; const c = w.symbols.filter(s => s.alive).map(s => ({ s, p: w.findPath(s.tx, s.ty) })).filter(o => o.p).sort((a, b) => a.p.length - b.p.length)[0]; return c ? [c.s.tx, c.s.ty] : null; });
    if (!pos) { await h.wait(500); continue; }
    const r = await h.walkTo(pos[0], pos[1]);
    if (r === 'battle' || (await h.scenes()).includes('Battle')) { await h.fightSmart(); await h.advance(40); const st = await state(); log(`  battle won? lvl ${st.lvl} hp ${st.hp} gold ${st.gold} map ${st.map}`); }
  }
}
// ---- Title
await h.wait(1500); await shot('01-title-splash');
await h.key('Enter'); await h.wait(900); for (let i = 0; i < 40 && !(await topIsMenu()); i++) await h.wait(150); await h.wait(300); await shot('01-title');
await h.key('Enter'); await h.wait(700); for (let i = 0; i < 40 && (await h.E(() => window.__EMBER.Input.stack.length)) < 2; i++) await h.wait(150); // New Game → Adventure Log picker (first empty log preselected)
await h.key('Enter'); await h.wait(1300); for (let i = 0; i < 80 && !(await h.E(() => window.__EMBER.active().includes('Create') && window.__EMBER.Input.stack.length > 0)); i++) await h.wait(150); await h.wait(300);
// ---- Creation: customise a bit
await h.key('ArrowDown'); await h.key('ArrowRight', 1); // vocation -> mage? (Warrior->Mage)
await h.key('ArrowLeft', 1); // back to warrior
await h.key('ArrowDown', 6); await h.key('ArrowRight', 2); // hairstyle
await h.key('ArrowDown'); await h.key('ArrowRight', 3); // hair colour
await h.wait(400); await shot('02-creation');
await h.key('ArrowDown', 4); await h.key('Enter'); await h.wait(2200); // Begin Adventure (row 12)
// ---- Prologue
for (let i = 0; i < 9; i++) { await h.key('Enter', 1, 450); }
await h.wait(800); await shot('03-prologue-halo');
for (let i = 0; i < 400; i++) { const s = await h.hero(); if (s && s.map === 'hearth' && !s.busy && !s.ib) break; await h.key('Enter', 1, 160); if (i === 16) await shot('04-prologue-betrayal'); }
let s = await state(); assert(s.map === 'hearth', 'woke up in hearth'); log('prologue done', s.map);
await shot('05-hearth-wake');
// ---- Village → Elder
log('to village', await go(6, 10)); await h.wait(500); await shot('06-village');
log('to elder', await go(5, 20));
log('talk elder', await talk(4, 3));
s = await state(); assert(s.flags.metElder, 'met elder'); assert(s.gold >= 80, 'got gold');
// ---- Shop: buy leather & equip
log(await go(4, 8)); log(await go(21, 5));
log(await go(6, 4)); await h.face(3); await h.key('Enter', 1, 300);
await untilMenu(); // tutorial + dialog -> buy/sell
await h.key('Enter', 1, 600); // Buy
await h.key('ArrowDown', 1, 200); await h.wait(600); await shot('07-shop-preview');
await h.key('Enter', 1, 600); // buy leather
if (await topIsMenu()) { await h.key('Enter', 1, 500); } // equip on hero
await h.key('Escape', 1, 400); await untilMenu(5); await h.key('ArrowUp', 1, 200); await h.key('Enter', 1, 400); await h.advance(20);
s = await state(); log('after shop gold', s.gold, 'equip', await h.E(() => window.__EMBER.Game.hero.equip));
// ---- Mira quest
log(await go(6, 9)); log(await go(16, 14, true));
log('talk mira', await talk(16, 14));
s = await state(); assert(s.quests.locket === 'active', 'locket quest');
// ---- Fields
log(await go(14, 29)); s = await state(); assert(s.map === 'fields', 'in fields');
await h.advance(20); await shot('08-fields');
await grind(2, 'fields');
await shot('09-field-after-battle');
log('locket', await talk(4, 13)); s = await state(); assert(s.inv.locket, 'got locket');
await grind(4, 'fields');
log('tobin', await talk(22, 24));
log('save', await talk(23, 25)); await untilMenu(10); await h.key('Enter', 1, 600); await h.advance(20);
// ---- Hollow
log(await go(18, 40)); s = await state(); assert(s.map === 'hollow', 'in hollow'); await h.advance(20); await shot('10-dungeon');
await grind(5, 'hollow');
log('chest', await talk(4, 18));
await grind(6, 'hollow');
s = await state();
log('save crystal', await go(17, 4)); await h.face(3); await h.key('Enter', 1, 400); await untilMenu(10); await h.key('Enter', 1, 600); await h.advance(20);
await shot('11-dungeon-shrine');
// ---- Boss
let won = false;
for (let attempt = 0; attempt < 4 && !won; attempt++) {
  log('to lair', await go(14, 2)); await h.advance(20);
  s = await state(); if (s.map !== 'lair') { log('not in lair?', s.map); }
  log(await go(8, 12)); await h.advance(20); await shot('12-boss-lair');
  await go(8, 6); await h.face(3); await h.key('Enter', 1, 300);
  for (let i = 0; i < 40; i++) { if ((await h.scenes()).includes('Battle')) break; if (await topIsMenu()) await h.key('Enter', 1, 300); else await h.key('Enter', 1, 300); }
  await h.wait(1500); await shot('13-boss-battle');
  await h.E(() => { window.__EMBER.fast = true; });
  log('boss fight', await h.fightSmart());
  await h.E(() => { window.__EMBER.fast = false; });
  // the flag is set only after the world's post-battle wait (game time; slow headless box): poll instead of racing it
  for (let k = 0; k < 40; k++) { s = await state(); if (s.flags.lairDone) break; await h.wait(500); } won = !!s.flags.lairDone;
  log('boss won?', won, 'lvl', s.lvl);
  if (!won) { await h.advance(30); await grind(s.lvl + 1, (await state()).map); }
}
assert(won, 'beat the boss');
// ---- Cliffhanger
for (let i = 0; i < 18; i++) await h.key('Enter', 1, 450);
await shot('14-cliffhanger-vesper');
for (let i = 0; i < 300; i++) { const st = await h.hero(); if (st && st.map === 'elder' && !st.busy && !st.ib) break; await h.key('Enter', 1, 200); }
await h.advance(60);
s = await state(); assert(s.flags.ledgerOpen, 'ledger open'); log('homecoming done');
// ---- Dahlia → companions
log(await go(4, 8)); log(await go(6, 5)); log(await go(11, 5)); await h.face(3); await h.key('Enter', 1, 300);
await untilMenu(20); await h.key('Enter', 1, 1200);
await h.key('ArrowDown', 1); await h.key('ArrowRight', 2); await h.key('ArrowDown', 5); await h.key('ArrowRight', 1); await h.wait(400); await shot('15-companion-creator');
await h.key('ArrowUp', 6); await h.key('ArrowUp', 1); await h.key('Enter', 1, 900); // Register
await h.key('Enter', 1, 600); await untilMenu(5);
await h.key('Enter', 1, 1200); await h.key('ArrowUp', 1); await h.key('Enter', 1, 900); await h.key('Enter', 1, 600); await untilMenu(5); // second companion
await h.key('ArrowDown', 2, 200); await h.key('Enter', 1, 400); await h.advance(20);
s = await state(); assert(s.party >= 2, 'party formed'); log('party size', s.party);
await shot('16-party');
// ---- Finale
log(await go(6, 10)); await h.wait(500);
log(await go(14, 21)); await shot('17-village-night');
log(await go(14, 22)); // analog movement: walk onto the finale trigger
for (let i = 0; i < 200; i++) { const r = await h.E(() => !!window.__EMBER.ended); if (r) break; await h.key('Enter', 1, 300); if (i === 12) await shot('18-finale'); }
await h.wait(7000); await shot('19-end');
assert(await h.E(() => !!window.__EMBER.ended), 'reached the end');
// ---- Continue straight into Chapter II
// the end card only accepts input after ~4s of game time (slower than wall time on a loaded headless box): keep tapping
for (let i = 0; i < 60; i++) { const st = await h.hero(); if (st && st.map === 'elder') break; if (await h.E(() => !!window.__EMBER.ended)) await h.key('Enter', 1, 100); await h.wait(500); }
s = await state(); assert(s.map === 'elder' && s.flags.ch2Started, 'chapter II dawn after the end card'); await shot('20-ch2-dawn');
log('PLAYTHROUGH COMPLETE', await state(), 'errors:', h.errs);
await h.b.close();
