// Round 5 dark-world screenshots (Adult ON).
// node tests/tools/r5dark.mjs out.png map x y '{"flags":1}' [script] [enters] [dir]
// Starts at map x,y with flags; optionally runs <script> and presses Enter <enters> times before the shot.
import { open } from '../lib.mjs';
const [out, map, x, y, fl, script, enters, dir] = process.argv.slice(2);
const h = await open(process.env.URL);
await h.E(() => localStorage.setItem('ember_adult', '1'));
await h.devStart(map, +x, +y, Object.assign({ chapter1Done: true, ch2Started: true, tut_talk: true, tut_menu: true, tut_move: true }, JSON.parse(fl || '{}')), 'warrior', { gold: +(process.env.GOLD || 30) });
await h.wait(1800);
if (dir) await h.face(+dir);
if (script) { await h.E(s => { window.__EMBER.world.runScript(s); }, script); await h.wait(900); await h.key('Enter', +(enters || 0), 650); await h.wait(500); }
await h.shot(out); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
