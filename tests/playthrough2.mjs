// Headless playthrough of Chapter II ("The Drowned Choir"), starting from a typical end-of-Chapter-I party.
// Usage: npm run dev, then `node tests/playthrough2.mjs [url]`
import { open } from './lib.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://localhost:5173/';
const SS = './screenshots/ch2/'; fs.mkdirSync(SS, { recursive: true });
const h = await open(URL); await h.E(() => { window.__EMBER.fast = true; });
const t0 = Date.now(); const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...a);
const shot = async n => { await h.shot(SS + n + '.png'); log('screenshot', n); };
const assert = (c, m) => { if (!c) { console.error('ASSERT FAILED:', m, h.errs); process.exit(1); } };
const state = () => h.E(() => { const G = window.__EMBER.Game.s; return { lv: G.party.map(m => m.level).join('/'), party: G.party.map(m => m.id), gold: G.gold, map: G.map, flags: G.flags, inv: G.inv, quests: G.quests }; });
const topMenu = () => h.E(() => { const st = window.__EMBER.Input.stack; const t = st[st.length - 1]; return t && t.items ? { title: t.title || '', n: t.items.length, labels: t.items.map(i => i.label) } : null; });
/** advance dialog; Escape out of any vocation menu (handled explicitly elsewhere) */
async function adv(n = 300) { let last = '', rep = 0; for (let i = 0; i < n; i++) { const r = await h.advance(1); if (r !== 'timeout') return r; const m = await topMenu(); const key = m ? m.title + '|' + m.labels.join() : ''; rep = key && key === last ? rep + 1 : 0; last = key;
  if (m && (/vocation|would you like|Buy|Sell/i.test(m.title) || m.labels.includes('Leave') || rep > 3)) { await h.key('Escape', 1, 250); rep = 0; } } return 'timeout'; }
async function go(x, y, adj = false) {
  let r;
  for (let i = 0; i < 20; i++) {
    r = await h.walkTo(x, y, adj);
    if (r === 'battle' || (await h.scenes()).includes('Battle')) { await h.fightSmart(); await adv(40); await afterBattle(); continue; }
    if (r === 'guard' || r === 'nopath') { await adv(40); continue; }
    break;
  }
  return r;
}
let battles = 0;
async function afterBattle() { battles++; const s = await state(); if (s.map === 'hearth' || s.flags.__lost) log('  !! party wiped'); if (battles % 4 === 0) log(`  battles ${battles} lv ${s.lv} gold ${s.gold}`); }
async function talk(x, y) { for (let k = 0; k < 4; k++) { await go(x, y, true); const p = await h.hero(); if (Math.abs(p.x - x) + Math.abs(p.y - y) === 1) break; } await h.E(([x, y]) => { const w = window.__EMBER.world; const dx = x - w.hero.tx, dy = y - w.hero.ty; w.hero.dir = dx < 0 ? 1 : dx > 0 ? 2 : dy < 0 ? 3 : 0; w.setFrame(w.hero); }, [x, y]); await h.key('Enter', 1, 300); return adv(); }
async function grind(lv, map) {
  for (let n = 0; n < 50; n++) {
    const s = await state(); if (+s.lv.split('/')[0] >= lv) return; if (s.map !== map) return;
    if (await h.E(() => window.__EMBER.world.symbols.filter(s => s.alive).length) === 0) { await h.E(() => { const w = window.__EMBER.world; w.scene.restart({ map: w.def.id, x: w.hero.tx, y: w.hero.ty, dir: 0, noBanner: true }); }); await h.wait(1200); }
    const pos = await h.E(() => { const w = window.__EMBER.world; const c = w.symbols.filter(s => s.alive).map(s => ({ s, p: w.findPath(s.tx, s.ty) })).filter(o => o.p).sort((a, b) => a.p.length - b.p.length)[0]; return c ? [c.s.tx, c.s.ty] : null; });
    if (!pos) { await h.wait(400); continue; }
    const r = await h.walkTo(pos[0], pos[1]);
    if (r === 'battle' || (await h.scenes()).includes('Battle')) { await h.fightSmart(); await adv(40); await afterBattle(); }
  }
}
// ---- Start: end of Chapter I (hero Lv7 warrior + priest Lv6 + mage Lv6), at the Elder's house
await h.devStart('elder', 4, 6, { chapter1Done: true, lairDone: true, ledgerOpen: true, finaleSeen: true, metElder: true }, 'warrior', { gold: 260 });
await h.E(() => {
  const G = window.__EMBER.Game; const base = G.hero;
  const mk = (id, name, voc, lv, equip) => { const m = JSON.parse(JSON.stringify(base)); Object.assign(m, { id, name, voc, level: lv, xp: 0, equip, vocs: {} }); return m; };
  base.level = 7; G.s.party.push(mk('c1', 'Rook', 'priest', 6, { weapon: 'stick', armor: 'tunic' }), mk('c2', 'Wynn', 'mage', 6, { weapon: 'stick', armor: 'robe' }));
  G.s.inv.herb = 6; G.healAll(); window.__EMBER.world.refreshParty(); window.__EMBER.world.ui.refreshHud();
  window.__EMBER.world.runScript('ch2Dawn');
});
log('ch2Dawn', await adv()); let s = await state();
assert(s.flags.ch2Started && s.inv.letter, 'chapter II started + letter'); await shot('01-dawn');
// ---- Village → Emberwood Road
log(await go(4, 8)); await h.wait(400); log('east exit', await go(31, 15)); await adv(60);
s = await state(); assert(s.map === 'road', 'on the road: ' + s.map); await shot('02-road');
log('pell', await talk(24, 5)); s = await state(); assert(s.quests.mule === 'active', 'mule quest');
log('mule', await talk(6, 7)); s = await state(); assert(s.flags.muleFound, 'found mule');
log('pell again', await talk(24, 5)); s = await state(); assert(s.quests.mule === 'done', 'mule done'); log('lv', s.lv, 'gold', s.gold);
log('pilgrim', await talk(33, 14));
log('to saltmere', await go(47, 18)); await adv(80); s = await state(); assert(s.map === 'saltmere', 'in saltmere'); await shot('03-saltmere');
// ---- Saltmere: preacher, shop, Abbess
log('preacher', await talk(19, 10));
log('chapel', await go(25, 5)); await adv(20);
log('maren', await talk(6, 4)); s = await state(); assert(s.flags.vocationsOpen && s.flags.metMaren && !s.inv.letter, 'vocations open');
// vocation change: Rook (priest) → Paladin, then back via menu, exercising the full flow
await go(6, 4, true); await h.face(3); await h.key('Enter', 1, 400);
for (let i = 0; i < 30 && !(await topMenu()); i++) await h.key('Enter', 1, 250);
await h.key('Enter', 1, 500); // "Change vocation"
let m = await topMenu(); log('picker', m && m.title); await h.key('ArrowDown', 1, 200); await h.key('Enter', 1, 500); // pick Rook
m = await topMenu(); const pi = m.labels.indexOf('Paladin'); assert(pi >= 0, 'paladin listed'); 
const cur = await h.E(() => window.__EMBER.Input.stack.at(-1).idx); await h.key(pi > cur ? 'ArrowDown' : 'ArrowUp', Math.abs(pi - cur), 150); await h.wait(300); await shot('04-vocation');
await h.key('Enter', 1, 400); await h.key('Enter', 1, 600); await h.advance(10); // confirm + message
s = await h.E(() => window.__EMBER.Game.s.party[1].voc); assert(s === 'paladin', 'Rook is a paladin: ' + s);
await h.key('Escape', 1, 400); await adv(20); s = await state(); log('after vocation, ui free', !(await topMenu()));
// ---- Ione at the Gull & Anchor
log(await go(6, 13)); await h.wait(400); log('gull', await go(6, 5)); await adv(20);
log('ione', await talk(7, 2)); s = await state(); assert(s.flags.metIone, 'met Ione'); await shot('05-ione');
log('inn', await talk(2, 3)); s = await state(); assert(s.flags.ioneTaken && s.map === 'saltmere', 'abduction happened'); await shot('06-night');
log('hallam (night)', await talk(33, 8));
// ---- Weeping Grotto
log('cave', await go(4, 22)); await adv(40); s = await state(); assert(s.map === 'grotto1', 'in grotto: ' + s.map); await shot('07-grotto');
log('ghost', await talk(9, 15)); s = await state(); log('lookout', s.quests.lookout);
log('deeper', await go(18, 3)); await adv(40); s = await state(); assert(s.map === 'grotto2', 'in sanctum: ' + s.map);
log('save crystal', await go(15, 28, true)); await h.face(0);
await shot('08-sanctum');
// ---- Boss: Cantor Mordane
let won = false;
for (let attempt = 0; attempt < 5 && !won; attempt++) {
  s = await state(); if (s.map !== 'grotto2') { log('respawned at', s.map, '— heading back'); if (s.map === 'saltmere') { await go(4, 22); await adv(30); } await go(18, 3); await adv(30); }
  log('approach', await go(14, 8)); await adv(80);
  await h.face(3); await h.key('Enter', 1, 300);
  for (let i = 0; i < 60; i++) { if ((await h.scenes()).includes('Battle')) break; await h.key('Enter', 1, 250); }
  await h.wait(2200); await shot('09-cantor');
  const r = await h.fightSmart(6000);
  s = await state(); won = !!s.flags.grottoDone; log('boss attempt', attempt, r, 'won', won, 'lv', s.lv);
  if (!won) { await adv(40); s = await state(); await grind(+s.lv.split('/')[0] + 2, s.map); }
}
assert(won, 'beat Cantor Mordane');
// ---- Aftermath → relight → End of Chapter II
for (let i = 0; i < 600; i++) { if (await h.E(() => !!window.__EMBER.ended)) break; await h.key('Enter', 1, 220); if (i === 40) await shot('10-aftermath'); }
s = await state(); assert(s.party.includes('ione') && s.flags.relit && s.flags.chapter2Done, 'Ione joined & lighthouse relit');
await h.wait(4000); await shot('11-end-ch2');
await h.key('Enter', 1, 3000); await adv(40); s = await state(); assert(s.map === 'saltmere' && !(await h.E(() => !!window.__EMBER.ended)), 'free roam after chapter II');
await shot('12-saltmere-relit');
const save = await h.E(() => window.__EMBER.Game.slotInfo(window.__EMBER.Game.slot)); log('save', JSON.stringify(save));
log('CHAPTER II COMPLETE', 'lv', s.lv, 'gold', s.gold, 'battles', battles, 'quests', JSON.stringify(s.quests), 'errors:', h.errs);
await h.b.close();
