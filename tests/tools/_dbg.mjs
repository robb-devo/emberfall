import { open } from '../lib.mjs';
const h = await open('http://localhost:5180/');
await h.devStart('road', 24, 6, { chapter1Done: true, ch2Started: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = true; });
const topMenu = () => h.E(() => { const st = window.__EMBER.Input.stack; const t = st[st.length - 1]; return t && t.items ? { title: t.title || '', n: t.items.length, labels: t.items.map(i => i.label) } : null; });
await h.face(3); await h.key('Enter', 1, 300);
let last = '', rep = 0; for (let i = 0; i < 40; i++) { const r = await h.advance(1); const m = await topMenu(); console.log(i, r, JSON.stringify(m)?.slice(0, 120)); if (r !== 'timeout') break; const key = m ? m.title + '|' + m.labels.join() : ''; rep = key && key === last ? rep + 1 : 0; last = key;
  if (m && (/vocation|would you like|Buy|Sell/i.test(m.title) || m.labels.includes('Leave') || rep > 3)) { await h.key('Escape', 1, 250); rep = 0; } }
await h.b.close();
