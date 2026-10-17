// Boss checkpoint test: start right before a boss (devStart), fight it with the same bot as the playthroughs,
// then (optionally) play the post-boss content through to the chapter end.
// Usage: BOSS=warden|cantor [N=trials] [LV=..] [BOOST=1] [POST=1] node tests/boss.mjs [url]
//   BOOST=1  test-only: boost the party (Lv30, full HP/MP, 10 herbs) right before the fight -> verifies post-boss content.
//   N>1      Monte-Carlo win rate at the given level (balance check). POST=1 plays the post-boss content after the first win.
import { open } from './lib.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://localhost:4173/';
const BOSS = process.env.BOSS || 'warden', N = +(process.env.N || 1), BOOST = !!process.env.BOOST, POST = process.env.POST ? process.env.POST !== '0' : N === 1;
const SS = `./screenshots/boss-${BOSS}/`; fs.mkdirSync(SS, { recursive: true });
const h = await open(URL);
const t0 = Date.now(); const log = (...a) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s]`, ...a);
const shot = async n => { await h.shot(SS + n + '.png'); log('screenshot', n); };
const fail = async m => { console.error('ASSERT FAILED:', m, h.errs, 'scripts:', await h.E(() => window.__EMBER.scriptLog), 'hero:', JSON.stringify(await h.hero())); await h.shot(SS + 'FAIL.png'); await h.b.close(); process.exit(1); };
const assert = async (c, m) => { if (!c) await fail(m); };
const state = () => h.E(() => { const G = window.__EMBER.Game.s; return { lv: G.party.map(m => m.level).join('/'), party: G.party.map(m => m.id), hp: G.party.map(m => m.hp).join('/'), gold: G.gold, map: G.map, flags: G.flags, inv: G.inv }; });
const topIsMenu = () => h.E(() => { const st = window.__EMBER.Input.stack; return !!(st.length && st[st.length - 1].items); });
const untilMenu = async (n = 30) => { for (let i = 0; i < n; i++) { if (await topIsMenu()) return true; await h.key('Enter', 1, 300); } return false; };

const CFG = {
  // Ch1: solo hero, gear bought in Hollowmere, at the Warden (expected ~Lv6 after the playthrough's grind)
  warden: { map: 'lair', x: 8, y: 6, script: 'boss', flag: 'lairDone', lv: 6, flags: { metElder: true, bossApproach: true }, inv: { herb: 4 },
    party: [{ voc: 'warrior', equip: { weapon: 'shortsword', armor: 'leather', shield: 'pot' } }] },
  // Ch2: the playthrough2 party (hero warrior, Rook re-classed Paladin Lv1->2, Wynn mage), Ione taken, at Mordane
  cantor: { map: 'grotto2', x: 14, y: 8, script: 'cantorBoss', flag: 'grottoDone', lv: 9, flags: { chapter1Done: true, lairDone: true, ledgerOpen: true, finaleSeen: true, metElder: true, ch2Started: true, vocationsOpen: true, metMaren: true, metIone: true, ioneTaken: true, sanctumIntro: true, trig_sanctumIntro: true, trig_cantorApproach: true, cantorApproach: true }, inv: { herb: 6, hiHerb: 2, antidote: 2 },
    party: [{ voc: 'warrior', equip: { weapon: 'ironsword', armor: 'leather', shield: 'pot', head: 'helm' } }, { id: 'c1', name: 'Rook', voc: process.env.ROOK || 'paladin', lv: +(process.env.ROOKLV || 2), equip: { weapon: 'stick', armor: 'leather' } }, { id: 'c2', name: 'Wynn', voc: 'mage', lv: null, equip: { weapon: 'stick', armor: 'robe' } }] },
}[BOSS];
const LV = +(process.env.LV || CFG.lv);

async function setup() {
  await h.devStart(CFG.map, CFG.x, CFG.y, CFG.flags, CFG.party[0].voc, { gold: 300 });
  await h.E(([cfg, LV]) => {
    const { Game: G } = window.__EMBER; const base = G.hero; base.equip = cfg.party[0].equip;
    base.level = LV; base.xp = 0;
    for (const p of cfg.party.slice(1)) { const m = JSON.parse(JSON.stringify(base)); Object.assign(m, { id: p.id, name: p.name, voc: p.voc, level: p.lv ?? LV, xp: 0, equip: p.equip, vocs: {} }); G.s.party.push(m); }
    Object.assign(G.s.inv, cfg.inv); G.s.savePoint = { map: cfg.map, x: cfg.x, y: cfg.y + 4 };
    G.healAll(); window.__EMBER.world.refreshParty?.(); window.__EMBER.world.ui.refreshHud?.();
  }, [CFG, LV]);
}
async function boost() {
  await h.E(() => { const { Game: G } = window.__EMBER; G.s.party.forEach(m => { m.level = Math.max(m.level, 30); }); G.s.inv.herb = 10; G.healAll(); window.__EMBER.world.ui.refreshHud?.(); });
}
async function fightBoss(i) {
  await h.E(s => { window.__EMBER.world.runScript(s); }, CFG.script);
  for (let k = 0; k < 120; k++) { if ((await h.scenes()).includes('Battle')) break; await h.key('Enter', 1, 200); }
  await assert((await h.scenes()).includes('Battle'), 'boss battle started');
  await h.wait(1200); if (i === 0) await shot('01-boss');
  await h.E(() => { window.__EMBER.fast = true; });
  const t = Date.now(); const r = await h.fightSmart(8000);
  await h.E(() => { window.__EMBER.fast = false; });
  // the boss script sets its flag only after the world's post-battle wait (game time, slow on a loaded headless box): poll, don't race
  let s; for (let k = 0; k < 40; k++) { s = await state(); if (s.flags[CFG.flag]) break; await h.wait(500); }
  return { won: !!s.flags[CFG.flag], r, secs: ((Date.now() - t) / 1000).toFixed(0), hp: s.hp };
}

let wins = 0, wonOnce = false;
for (let i = 0; i < N; i++) {
  await setup(); if (BOOST) await boost();
  const st0 = await state();
  const res = await fightBoss(i); if (res.won) wins++;
  log(`trial ${i + 1}/${N} lv ${st0.lv} boost ${BOOST} ->`, res.won ? 'WON' : 'lost', `(${res.secs}s, hp ${res.hp})`);
  if (res.won && POST) { wonOnce = true; break; }
  if (!res.won) { await h.advance(40); }
}
log(`RESULT ${BOSS} lv ${LV}${BOOST ? ' BOOST' : ''}: ${wins}/${N} wins`);
if (!POST) { await h.b.close(); process.exit(0); }
await assert(wonOnce, 'won the boss (need a win to check post-boss content)');

if (BOSS === 'warden') {
  // ---- Cliffhanger
  for (let i = 0; i < 18; i++) await h.key('Enter', 1, 450);
  await shot('02-cliffhanger-vesper');
  for (let i = 0; i < 300; i++) { const st = await h.hero(); if (st && st.map === 'elder' && !st.busy && !st.ib) break; await h.key('Enter', 1, 200); }
  await h.advance(60);
  let s = await state(); await assert(s.flags.ledgerOpen && s.flags.homecoming && !s.inv.starShard, 'cliffhanger + homecoming (ledger open, shard stolen)'); log('homecoming done', s.map);
  // ---- Dahlia's tavern -> companions
  log(await h.walkTo(4, 8)); log(await h.walkTo(6, 5)); log(await h.walkTo(11, 5)); await h.face(3); await h.key('Enter', 1, 300);
  // pick menu entries by label (robust on a slow headless box: never press arrows before the menu is really up)
  const pick = async (label, n = 80) => { for (let i = 0; i < n; i++) {
    const k = await h.E(l => { const t = window.__EMBER.Input.stack.at(-1); return t && t.items ? t.items.findIndex(it => it.label === l) : -2; }, label);
    if (k >= 0) { await h.E(k => { const t = window.__EMBER.Input.stack.at(-1); t.idx = k; t.refresh?.(); }, k); await h.wait(300); await h.key('Enter', 1, 800); return true; }
    if (k === -2) await h.key('Enter', 1, 300); else await h.wait(300); } return false; };
  const inCreate = () => h.E(() => window.__EMBER.active().includes('Create'));
  const register = async () => { for (let i = 0; i < 40 && !(await inCreate()); i++) await h.wait(300); await h.wait(800);
    await h.key('ArrowDown', 1); await h.key('ArrowRight', 2); await h.wait(400); if (!(await h.E(() => window.__EMBER.Game.s.party.length > 1))) await shot('03-companion-creator');
    await h.key('ArrowUp', 7); await h.key('Enter', 1, 900); for (let i = 0; i < 40 && (await inCreate()); i++) await h.wait(300); };
  await assert(await pick('Create a companion'), 'Ledger menu (1)'); await register();
  await assert(await pick('Create a companion'), 'Ledger menu (2)'); await register();
  await assert(await pick('Leave'), 'Ledger menu (leave)'); await h.advance(20);
  s = await state(); await assert(s.party.length >= 2, 'party formed at the tavern'); log('party', s.party.join(','));
  await shot('04-party');
  // ---- Night finale
  log(await h.walkTo(6, 10)); await h.wait(500);
  log(await h.walkTo(14, 21)); await shot('05-village-night');
  await h.key('ArrowDown', 1, 400);
  for (let i = 0; i < 200; i++) { if (await h.E(() => !!window.__EMBER.ended)) break; await h.key('Enter', 1, 300); if (i === 12) await shot('06-finale'); }
  await h.wait(6000); await shot('07-end-ch1');
  await assert(await h.E(() => !!window.__EMBER.ended), 'reached the Chapter I end card');
  for (let i = 0; i < 60; i++) { const st = await h.hero(); if (st && st.map === 'elder') break; if (await h.E(() => !!window.__EMBER.ended)) await h.key('Enter', 1, 100); await h.wait(500); }
  s = await state(); await assert(s.map === 'elder' && s.flags.ch2Started && s.flags.chapter1Done, 'Chapter II dawn after the end card'); await shot('08-ch2-dawn');
  log('CH1 POST-BOSS OK', JSON.stringify({ map: s.map, party: s.party, ch2: s.flags.ch2Started }));
} else {
  for (let i = 0; i < 600; i++) { if (await h.E(() => !!window.__EMBER.ended)) break; await h.key('Enter', 1, 220); if (i === 40) await shot('02-aftermath'); if (i === 160) await shot('03-relight'); }
  let s = await state(); await assert(s.party.includes('ione') && s.flags.relit && s.flags.chapter2Done && s.inv.tideShard, 'Ione joined, Tideshard, lighthouse relit, chapter2Done');
  await h.wait(4000); await shot('04-end-ch2');
  for (let i = 0; i < 120; i++) { if (!(await h.E(() => !!window.__EMBER.ended))) break; await h.key('Enter', 1, 600); }
  await h.advance(40); s = await state(); await assert(s.map === 'saltmere' && !(await h.E(() => !!window.__EMBER.ended)), 'free roam in Saltmere after chapter II: ' + s.map);
  await shot('05-saltmere-relit');
  log('CH2 POST-BOSS OK', JSON.stringify({ map: s.map, party: s.party }));
}
log('errors:', h.errs); await h.b.close();
