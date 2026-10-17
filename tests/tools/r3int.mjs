// Interior shots: node tests/tools/r3int.mjs <prefix>
import { open } from '../lib.mjs';
const prefix = process.argv[2] || 'r3-int'; const h = await open(process.env.URL);
for (const [map, x, y] of [...(process.env.MAPS ? process.env.MAPS.split(',').map(s => [s.split(':')[0], +s.split(':')[1], +s.split(':')[2]]) : [['hearth', 7, 7], ['shop', 6, 6], ['elder', 4, 6], ['gull', 7, 8], ['chapel', 6, 9], ['manor', 5, 6]])]) {
  await h.devStart(map, x, y, { chapter1Done: true, metElder: true }, 'warrior', {});
  await h.E(() => { window.__EMBER.fast = false; }); await h.wait(2000);
  await h.shot(`progress/${prefix}-${map}.png`);
}
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
