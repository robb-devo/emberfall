import { open } from '../lib.mjs';
const h = await open('http://localhost:5173/');
await h.wait(3000); await h.key('Enter', 1, 4000);
console.log(await h.E(() => { const t = window.__EMBER.scene('Title'); return t.children.list.filter(o => o.constructor.name === 'ListMenu' || o.type === 'Container').map(o => [o.constructor.name, o.x, o.y, o.visible, o.alpha, o.depth, o.list?.length]); }));
console.log(await h.E(() => { const t = window.__EMBER.scene('Title'); const m = t.children.list.find(o => o.constructor.name === 'ListMenu'); const b = m.getBounds(); const c = t.cameras.main; return { b: [b.x, b.y, b.width, b.height], wv: [c.worldView.x, c.worldView.y, c.worldView.width, c.worldView.height], sy: c.scrollY, alpha: c.alpha, fx: c.fadeEffect.isRunning, fa: c.fadeEffect.alpha, kids: m.list.map(k => [k.type, k.visible, k.alpha]) }; }), h.errs); await h.shot('/tmp/tq.png'); await h.b.close();
