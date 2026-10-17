// Randomised menu fuzzer: hammers every menu path with keys and taps, checks for errors, soft-locks and state loss.
import { open } from './lib.mjs';
const h = await open(process.argv[2] || 'http://localhost:5173/');
const N = +(process.env.N || 1500);
await h.devStart('village', 15, 13, { metElder: true, wokeUp: true, homecoming: true, ledgerOpen: true, metDahlia: true }, 'priest', { gold: 900, inv: { herb: 5, ether: 2, leather: 1, helm: 1, charm: 1, locket: 1, feather: 1 } });
await h.E(() => { const G = window.__EMBER.Game; G.s.party.push(JSON.parse(JSON.stringify({ ...G.hero, id: 'c1', name: 'Rook', voc: 'warrior' }))); window.__EMBER.world.refreshParty(); });
let seed = +(process.env.SEED || 7); const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Enter', 'Escape', 'KeyM', 'Backspace'];
const snap = () => h.E(() => { const G = window.__EMBER.Game.s; return JSON.stringify({ p: G.party.map(m => [m.id, m.level, m.xp]), g: G.gold > 0, f: Object.keys(G.flags).length }); });
const base = await snap();
let stuck = 0, last = '';
for (let i = 0; i < N; i++) {
  const k = keys[Math.floor(r() * keys.length)];
  if (r() < 0.15) { const x = Math.floor(r() * 390), y = Math.floor(r() * 844); await h.p.mouse.click(x, y); } else await h.p.keyboard.press(k);
  await h.wait(40 + r() * 80);
  if (i % 50 === 0) {
    const st = await h.E(() => { const w = window.__EMBER.world; return { act: window.__EMBER.active().join(','), stack: window.__EMBER.Input.stack.length, modal: w?.ui?.modal, busy: w?.busy, map: w?.def?.id }; });
    const key = JSON.stringify(st);
    stuck = key === last && st.stack === 0 && (st.modal || st.busy) ? stuck + 1 : 0; last = key;
    if (stuck > 4) { console.log('SOFTLOCK', st); break; }
    if (h.errs.length) { console.log('ERRORS at', i, h.errs); break; }
    if (process.env.V) console.log(i, st);
    // keep the hero home: re-enter village if he wandered off
    if (st.map && st.map !== 'village' && !st.busy && !st.modal && st.stack === 0) await h.E(() => { const w = window.__EMBER.world; w.scene.restart({ map: 'village', x: 15, y: 13, dir: 0, noBanner: true }); });
  }
}
const after = await snap();
console.log('errors:', h.errs.length, h.errs.slice(0, 5)); console.log('state intact:', base === after ? 'yes' : `CHANGED ${base} -> ${after}`);
console.log('save present:', await h.E(() => Object.keys(localStorage).filter(k => k.startsWith('emberfall'))));
await h.b.close();
