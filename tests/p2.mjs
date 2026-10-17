import { open } from './lib.mjs';
const h = await open();
await h.key('Enter'); await h.wait(500); await h.key('Enter'); await h.wait(1200);
await h.key('ArrowUp'); await h.key('Enter'); await h.wait(1500);
for (let i = 0; i < 4; i++) { await h.key('Enter'); await h.wait(350); }
await h.wait(1500); await h.shot('/tmp/p2a.png');
console.log(await h.advance(300));
console.log(await h.walkTo(6, 10));
await h.shot('/tmp/p2b.png');
console.log(await h.walkTo(5, 20)); console.log(await h.hero());
console.log(await h.talkTo(4, 3)); await h.shot('/tmp/p2c.png');
console.log(await h.hero(), h.errs);
await h.b.close();
