import { open } from './lib.mjs';
const h = await open('http://localhost:5180/');
await h.devStart('road', 24, 6, { chapter1Done: true, ch2Started: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = true; });
await h.face(3); await h.key('Enter', 1, 400);
const st = () => h.E(() => { const w = window.__EMBER.world; const st = window.__EMBER.Input.stack; return { busy: w.busy, n: st.length, title: st.at(-1)?.title, labels: st.at(-1)?.items?.map(i=>i.label).join(','), canBack: window.__EMBER.Input.canBack() }; });
for (let i = 0; i < 30; i++) { const s = await st(); if (s.title) { console.log(i, JSON.stringify(s)); break; } await h.key('Enter', 1, 250); }
await h.key('Escape', 1, 500); console.log('after esc', JSON.stringify(await st()));
await h.key('Escape', 1, 500); console.log('after esc2', JSON.stringify(await st()));
for (let i = 0; i < 10; i++) { await h.key('Enter', 1, 250); console.log(i, JSON.stringify(await st())); }
await h.b.close();
