// Render a gallery of HD dolls to /tmp/portraits.png
import { open } from '../lib.mjs';
const h = await open(process.env.URL);
const url = await h.E(() => {
  const { game } = window.__EMBER; const sc = game.scene.getScenes(true)[0];
  const mod = sc.textures; const specs = [
    { look: { body: 0, skin: 1, hairStyle: 1, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 }, equip: { weapon: 'shortsword', armor: 'tunic', shield: 'pot' } },
    { look: { body: 1, skin: 3, hairStyle: 0, hair: 0, eyes: 3, face: 3, outfit: 1, outfit2: 5 }, equip: { weapon: 'bronzeAxe', armor: 'scale', head: 'helm', shield: 'kite', acc: 'cape' } },
    { look: { body: 0, skin: 0, hairStyle: 2, hair: 3, eyes: 5, face: 1, outfit: 4, outfit2: 3 }, equip: { weapon: 'wand', armor: 'robe', head: 'pointyhat' } },
    { look: { body: 0, skin: 2, hairStyle: 3, hair: 5, eyes: 2, face: 0, outfit: 2, outfit2: 7 }, equip: { weapon: 'shortbow', armor: 'leather', head: 'hood', acc: 'charm' } },
    { look: { body: 0, skin: 1, hairStyle: 4, hair: 9, eyes: 6, face: 2, outfit: 8, outfit2: 6 }, equip: { weapon: 'lute', armor: 'sailorCoat', head: 'featherCap' } },
    { look: { body: 1, skin: 4, hairStyle: 5, hair: 4, eyes: 4, face: 3, outfit: 5, outfit2: 0 }, equip: { weapon: 'spear', armor: 'chain', head: 'circlet', acc: 'gullCape' } },
  ];
  const keys = specs.map(sp => window.__EMBER.ensurePortrait(sc, sp));
  const c = document.createElement('canvas'); c.width = 240 * specs.length; c.height = 270; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#2a2d50'; x.fillRect(0, 0, c.width, c.height);
  keys.forEach((k, i) => x.drawImage(mod.get(k).getSourceImage(), i * 240, 0));
  return c.toDataURL();
});
const fs = await import('fs'); fs.writeFileSync('/tmp/portraits.png', Buffer.from(url.split(',')[1], 'base64'));
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
