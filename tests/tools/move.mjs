// Movement smoke: hold keys/joystick in the village, check smooth progress, sliding, warps. node tests/tools/move.mjs
import { open } from '../lib.mjs';
const h = await open(process.env.URL);
await h.devStart('village', 14, 9, { chapter1Done: true, ch2Started: true }, 'warrior', {});
const pos = () => h.E(() => { const w = window.__EMBER.world; return { x: +w.hero.spr.x.toFixed(2), y: +w.hero.spr.y.toFixed(2), tx: w.hero.tx, ty: w.hero.ty, m: w.hero.moving, v: Math.hypot(w.vel.x, w.vel.y).toFixed(1) }; });
console.log('start', await pos());
await h.p.keyboard.down('ArrowLeft'); for (let i = 0; i < 6; i++) { await h.wait(150); console.log('L', await pos()); } await h.p.keyboard.up('ArrowLeft');
await h.wait(300); console.log('stop', await pos());
await h.p.keyboard.down('ArrowUp'); await h.p.keyboard.down('ArrowLeft'); for (let i = 0; i < 10; i++) { await h.wait(200); console.log('UL', await pos()); } await h.p.keyboard.up('ArrowUp'); await h.p.keyboard.up('ArrowLeft');
await h.shot('/tmp/move.png');
console.log('walkTo', await h.walkTo(6, 6), await pos());
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
