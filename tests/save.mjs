// Save-system, Back-button and 8-direction regression tests.
import { open } from './lib.mjs';
const h = await open(process.argv[2] || 'http://localhost:5173/');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const E = h.E;
await E(() => localStorage.clear()); await h.p.reload(); await h.wait(2500);
ok(await E(() => !window.__EMBER.Game.hasSave()), 'fresh install has no save');
// --- legacy v0.1 record is imported, untouched
await h.devStart('village', 15, 13, { metElder: true, wokeUp: true });
await h.wait(1500);
ok(await E(() => !!localStorage.getItem('emberfall.slot0')), 'autosave on entering a map');
ok(await E(() => window.__EMBER.lastSave?.reason?.startsWith('auto:map')), 'autosave reason = map transition');
// --- back button / hardware back
await h.key('KeyM', 1, 500);
ok(await E(() => window.__EMBER.Input.canBack()), 'menu open -> Back available');
ok(await E(() => window.__EMBER.overlay.btn.visible), 'Back button visible');
{ const [cx, cy] = await E(() => { const o = window.__EMBER.overlay, r = window.__EMBER.game.canvas.getBoundingClientRect(), k = r.width / window.__EMBER.game.scale.width; return [r.left + (o.btn.x + 62) * k, r.top + (o.btn.y + 30) * k]; }); await h.p.mouse.click(cx, cy); } await h.wait(500);
ok(await E(() => !window.__EMBER.world.ui.modal && window.__EMBER.Input.stack.length === 0), 'tapping Back closes the menu');
await E(() => window.__EMBER.Input.hardwareBack()); await h.wait(500);
ok(await E(() => window.__EMBER.world.ui.modal), 'hardware back in field opens the menu');
await E(() => window.__EMBER.Input.hardwareBack()); await h.wait(500);
ok(await E(() => !window.__EMBER.world.ui.modal), 'hardware back closes it again');
// submenu chain: Menu > Status > back > back
await h.key('KeyM', 1, 400); await h.key('ArrowDown', 3, 120); await h.key('Enter', 1, 600);
ok(await E(() => window.__EMBER.Input.canBack()), 'status screen has Back');
await E(() => window.__EMBER.Input.hardwareBack()); await h.wait(400);
await E(() => window.__EMBER.Input.hardwareBack()); await h.wait(400);
ok(await E(() => !window.__EMBER.world.ui.modal && window.__EMBER.Input.stack.length === 0), 'back out of nested menus');
// --- 8 directions
await E(() => { const w = window.__EMBER.world; w.scene.restart({ map: 'village', x: 6, y: 13, dir: 0, noBanner: true }); }); await h.wait(1500);
const p0 = await E(() => [window.__EMBER.world.hero.tx, window.__EMBER.world.hero.ty]);
await h.p.keyboard.down('ArrowDown'); await h.p.keyboard.down('ArrowRight');
await h.p.waitForFunction(([x, y]) => { const w = window.__EMBER.world; return w.hero.tx !== x || w.hero.ty !== y; }, p0, { timeout: 3000 }).catch(() => {});
await h.p.keyboard.up('ArrowDown'); await h.p.keyboard.up('ArrowRight'); await h.wait(400);
const p1 = await E(() => [window.__EMBER.world.hero.tx, window.__EMBER.world.hero.ty]);
ok(p1[0] > p0[0] && p1[1] > p0[1], `diagonal step ${p0} -> ${p1}`);
// --- manual save + backup + corruption recovery
await E(() => { window.__EMBER.Game.s.gold = 4242; window.__EMBER.Game.markDirty('test'); }); await h.wait(1500);
ok(await E(() => !!localStorage.getItem('emberfall.slot0.bak')), 'previous record kept as backup');
await E(() => localStorage.setItem('emberfall.slot0', '{"v":2,"sum":"x","data":"{broken'));
ok(await E(() => { const r = window.__EMBER.Game.read(0); return !!r && r.fromBackup; }), 'corrupt record -> falls back to backup');
// never overwrite with a corrupt state
const before = await E(() => localStorage.getItem('emberfall.slot0.bak'));
const refused = await E(() => { const G = window.__EMBER.Game; const keep = G.s.party; G.s.party = []; const r = G.save('bad'); G.s.party = keep; return r; });
ok(refused === false && before === await E(() => localStorage.getItem('emberfall.slot0.bak')), 'invalid state is refused, records untouched');
// --- reload -> continue
await E(() => { window.__EMBER.Game.markDirty('final'); }); await h.wait(1500);
const want = await E(() => [window.__EMBER.Game.s.map, window.__EMBER.Game.s.gold]);
await h.p.reload(); await h.wait(2500);
// the title menu opens 250ms of *game* time after "tap to begin" (>1s wall time on a slow headless box): wait for it,
// otherwise the Continue press arrives before the menu exists and is dropped
await h.key('Enter', 1, 0); // tap to begin
await h.p.waitForFunction(() => window.__EMBER.active().includes('Title') && window.__EMBER.Input.stack.length > 0, null, { timeout: 10000 });
await h.wait(300);
ok(await E(() => window.__EMBER.scene('Title').children.list.some(o => o.idx === 0 && o.items?.[0]?.label === 'Continue')), 'Continue is preselected on the title menu');
await h.key('Enter', 1, 0); // Continue (default)
await h.p.waitForFunction(() => window.__EMBER.active().includes('World') && !!window.__EMBER.world?.hero, null, { timeout: 15000 }).catch(() => {});
const got = await E(() => [window.__EMBER.Game.s.map, window.__EMBER.Game.s.gold]);
ok(JSON.stringify(got) === JSON.stringify(want), `continue restores ${want} (got ${got})`);
// --- v0.1 save-loss regression. Root cause: v0.1 only saved at Star-Shrines and had no Android back handler,
// so the OS back button (the natural way out of a menu) closed the app and everything since the last shrine
// (for a new player: everything) was gone. Now: progress is on disk within ~1s, and back never exits from play.
await E(() => { const G = window.__EMBER.Game; G.s.gold = 777; G.s.flags.regressionProgress = true; G.markDirty('test-progress'); }); await h.wait(1500);
for (const seq of [['KeyM'], ['KeyM', 'Enter'], ['KeyM', 'ArrowDown', 'Enter'], ['KeyM', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'Enter']]) {
  for (const k of seq) await h.key(k, 1, 250);
  for (let i = 0; i < 6; i++) { await E(() => window.__EMBER.Input.hardwareBack()); await h.wait(250); }
  await E(() => { if (window.__EMBER.world.ui.modal) window.__EMBER.Input.hardwareBack(); }); await h.wait(300);
}
ok(await E(() => window.__EMBER.active().includes('World') && !window.__EMBER.world.ui.modal), 'menu tour + 24x hardware back: still in the game, menus closed');
// simulate the OS killing the app right now: inspect what is on disk without firing any save hook
const disk = await E(() => { const r = JSON.parse(localStorage.getItem('emberfall.slot' + window.__EMBER.Game.slot)); const s = JSON.parse(r.data); return { gold: s.gold, flag: !!s.flags.regressionProgress }; });
ok(disk.gold === 777 && disk.flag, `progress is already on disk before any exit (gold ${disk.gold})`);
// title screen: hardware back must background the app (minimize), not close it or touch saves
await h.p.reload(); await h.wait(2500); await h.key('Enter', 1, 0);
await h.p.waitForFunction(() => window.__EMBER.Input.stack.length > 0, null, { timeout: 10000 }); await h.wait(300);
const before2 = await E(() => localStorage.getItem('emberfall.slot0'));
await E(() => window.__EMBER.Input.hardwareBack()); await h.wait(400);
ok(await E(() => window.__EMBER.active().includes('Title')) && before2 === await E(() => localStorage.getItem('emberfall.slot0')), 'hardware back on title: app stays, save untouched');
// --- legacy import
await E(() => { const s = JSON.parse(JSON.parse(localStorage.getItem('emberfall.slot0')).data); localStorage.clear(); s.version = 1; delete s.party[0].vocs; localStorage.setItem('emberfall.save.v1', JSON.stringify(s)); });
ok(await E(() => window.__EMBER.Game.hasSave() && !!localStorage.getItem('emberfall.save.v1')), 'v0.1 save imported (original kept)');
console.log('errors:', h.errs);
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
await h.b.close(); process.exit(fails ? 1 : 0);
