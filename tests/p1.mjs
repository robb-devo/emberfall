import { open } from './lib.mjs';
const h = await open();
await h.key('Enter'); await h.wait(500); await h.key('Enter'); await h.wait(1200);
await h.key('ArrowUp'); await h.key('Enter'); await h.wait(1500);
await h.shot('/tmp/p1a.png');
for (let i = 0; i < 6; i++) { await h.key('Enter'); await h.wait(300); }
await h.shot('/tmp/p1b.png');
console.log(await h.advance(300));
await h.shot('/tmp/p1c.png');
console.log(await h.hero(), h.errs);
await h.b.close();
