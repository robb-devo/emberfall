import { chromium } from 'playwright';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
await p.addInitScript(() => localStorage.setItem('ember_3d', '0'));
await p.goto('http://localhost:5173/'); await p.waitForTimeout(2000);
await p.evaluate(() => { const { Game, game } = window.__EMBER; Game.newGame('Aster', 'warrior', { body: 0, skin: 1, hairStyle: 1, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 }); Game.s.flags.chapter1Done = true; game.scene.getScenes(true).forEach(s => s.scene.stop()); setTimeout(() => game.scene.start('World', { map: 'village', x: 14, y: 12, dir: 0 }), 150); });
await p.waitForTimeout(3500); await p.screenshot({ path: '/tmp/flat.png' }); await b.close();
