// screenshots of menus / creation with the HD dolls
import { open } from './lib.mjs';
const h = await open(process.argv[2] || 'http://localhost:5173/');
await h.key('Enter', 1, 900); await h.key('Enter', 1, 800); await h.key('Enter', 1, 1500); await h.shot('/tmp/u_create.png');
await h.devStart('saltmere', 19, 14, { chapter1Done: true, ch2Started: true }, 'warrior', {});
await h.E(() => { window.__EMBER.world.ui.openMenu(); }); await h.wait(800); await h.key('Enter', 1, 900); await h.key('Enter', 1, 900); await h.shot('/tmp/u_menu.png');
await h.key('Escape', 3, 400);
await h.E(() => { window.__EMBER.fast = false; window.__EMBER.world.startBattle(['ashwolf', 'mossling'], { bg: 'bg_coast' }); }); await h.wait(2600); await h.shot('/tmp/u_battle.png');
console.log(h.errs); await h.b.close();
