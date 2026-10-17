import { open } from '/workspace/emberfall/tests/lib.mjs';
import fs from 'fs';
const h = await open();
const keys = process.argv.slice(2);
for (const k of keys) {
  const url = await h.E(k => { const g = window.__EMBER.game || window.__EMBER.world?.game || Object.values(window).find(v=>v&&v.textures); const t = (window.__EMBER.game).textures.get(k); const src = t.getSourceImage(); const c = document.createElement('canvas'); const s = k==='tiles'?3:4; c.width = src.width*s; c.height = src.height*s; const x = c.getContext('2d'); x.imageSmoothingEnabled=false; x.drawImage(src,0,0,c.width,c.height); return c.toDataURL(); }, k);
  fs.writeFileSync('/tmp/tex_'+k+'.png', Buffer.from(url.split(',')[1], 'base64'));
}
console.log(h.errs); await h.b.close();
