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
await h.p.mouse.click(40, 100); await h.wait(500);
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
await h.p.keyboard.down('ArrowDown'); await h.p.keyboard.down('ArrowRight'); await h.wait(230); await h.p.keyboard.up('ArrowDown'); await h.p.keyboard.up('ArrowRight'); await h.wait(300);
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
await h.key('Enter', 1, 900); // tap to begin
await h.key('Enter', 1, 1800); // Continue (default)
const got = await E(() => [window.__EMBER.Game.s.map, window.__EMBER.Game.s.gold]);
ok(JSON.stringify(got) === JSON.stringify(want), `continue restores ${want} (got ${got})`);
// --- legacy import
await E(() => { const s = JSON.parse(JSON.parse(localStorage.getItem('emberfall.slot0')).data); localStorage.clear(); s.version = 1; delete s.party[0].vocs; localStorage.setItem('emberfall.save.v1', JSON.stringify(s)); });
ok(await E(() => window.__EMBER.Game.hasSave() && !!localStorage.getItem('emberfall.save.v1')), 'v0.1 save imported (original kept)');
console.log('errors:', h.errs);
console.log(fails ? `${fails} FAILED` : 'ALL PASS');
await h.b.close(); process.exit(fails ? 1 : 0);
