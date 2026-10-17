import { open } from '../lib.mjs';
const h = await open('http://localhost:5173/');
await h.wait(4500); await h.shot('progress/r3-23-title.png');
await h.key('Enter', 1, 5000); await h.shot('progress/r3-23-title-menu.png');
await h.E(() => { const g = window.__EMBER.game; g.scene.getScenes(true).forEach(s => s.scene.stop()); g.scene.start('Create', { mode: 'hero', slot: 0 }); }); await h.wait(2500);
await h.shot('progress/r3-23-create.png'); console.log(h.errs.slice(0, 3)); await h.b.close();
