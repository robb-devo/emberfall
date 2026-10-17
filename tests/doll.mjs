import { chromium } from 'playwright'; import fs from 'fs';
const b = await chromium.launch(); const p = await b.newPage();
await p.goto('http://localhost:5173/'); await p.waitForTimeout(2500);
const url = await p.evaluate(() => { const g = window.__EMBER.game; const keys = g.textures.getTextureKeys().filter(k => k.startsWith('doll_')); const src = g.textures.get(keys[0]).getSourceImage(); const c = document.createElement('canvas'); c.width = src.width * 8; c.height = src.height * 8; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#7a8'; x.fillRect(0,0,c.width,c.height); x.drawImage(src, 0, 0, c.width, c.height); return c.toDataURL(); });
fs.writeFileSync('/tmp/doll.png', Buffer.from(url.split(',')[1], 'base64')); await b.close();
