import { open } from '../lib.mjs';
const h = await open(process.env.URL);
const spots = JSON.parse(process.argv[2]);
for (const [map, x, y, flags, name] of spots) {
  await h.devStart(map, x, y, Object.assign({ chapter1Done: true, ch2Started: true }, flags || {}), 'warrior', {});
  await h.E(() => { window.__EMBER.fast = false; });
  await h.wait(1800);
  await h.shot(`/tmp/look_${name}.png`);
}
console.log('errors', h.errs.slice(0, 8)); await h.b.close();
