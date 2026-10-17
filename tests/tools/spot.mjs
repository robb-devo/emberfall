// node tests/tools/spot.mjs out.png map x y [flagsJSON]
import { open } from '../lib.mjs';
const [out, map, x, y, fl] = process.argv.slice(2);
const h = await open(process.env.URL);
await h.devStart(map, +x, +y, Object.assign({ chapter1Done: true, ch2Started: true }, JSON.parse(fl || '{}')), 'warrior', {});
await h.wait(+(process.env.WAIT || 2200)); await h.shot(out); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
