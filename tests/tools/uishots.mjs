// node tests/tools/uishots.mjs <prefix>  -> title, dialog, menu, battle
import { open } from '../lib.mjs';
const prefix = process.argv[2] || 'r3-ui'; const only = process.argv[3]?.split(',');
const h = await open(process.env.URL);
const want = n => !only || only.includes(n);
if (want('title')) { await h.wait(2500); await h.shot(`progress/${prefix}-title.png`); }
await h.devStart('village', 14, 9, { chapter1Done: true, ch2Started: true, tut_battle: true }, 'warrior', {});
await h.E(() => { window.__EMBER.fast = false; }); await h.wait(1500);
if (want('dialog')) {
  await h.E(() => { const u = window.__EMBER.world.ui; u.say('The Star-Shrine has gone quiet, Warden. If the embers fall dark, so does Emberfall. Will you walk the old road?', 'Elder Bram'); });
  await h.wait(3500); await h.shot(`progress/${prefix}-dialog.png`);
  await h.key('Enter', 2, 300);
}
if (want('menu')) { await h.E(() => window.__EMBER.world.ui.openMenu()); await h.wait(900); await h.shot(`progress/${prefix}-menu.png`); await h.key('Escape', 1, 400); }
if (want('battle')) {
  await h.E(() => { window.__EMBER.world.startBattle(['glimmer', 'thornhare'], { bg: 'bg_fields' }); });
  for (let i = 0; i < 30 && !(await h.E(() => window.__EMBER.active().includes('Battle'))); i++) await h.wait(200);
  await h.wait(2800); await h.shot(`progress/${prefix}-battle.png`);
}
console.log('errors', h.errs.slice(0, 8)); await h.b.close();
