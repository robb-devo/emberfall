// node tests/tools/r5sheet.mjs <out.png> <adult 0|1> <set> [scale] -> raw doll sheets (frames 0,1,3,9,4) nearest-upscaled, on a neutral bg
import { open } from '../lib.mjs';
import fs from 'fs';
const [out, adult, set, scale] = process.argv.slice(2);
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(a => localStorage.setItem('ember_adult', a), adult || '0');
await h.p.reload(); await h.wait(2000);
const url = await h.E(([set, S]) => {
  const { ensureDollHd, game } = window.__EMBER; const sc = game.scene.getScenes(true)[0];
  const base = { body: 0, skin: 1, hairStyle: 0, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 };
  const sets = {
    clothed: [
      [{ ...base, fig: 0 }, { weapon: 'shortsword', armor: 'tunic', shield: 'pot' }, 'warrior'],
      [{ ...base, fig: 1, hairStyle: 3, hair: 4, skin: 2, eyes: 2 }, { weapon: 'stick', armor: 'robe', head: 'pointyhat' }, 'mage'],
      [{ ...base, fig: 0, body: 1, skin: 3, hairStyle: 1, hair: 0, face: 3 }, { weapon: 'bronzeAxe', armor: 'scale', head: 'helm', shield: 'kite' }, 'warrior'],
      [{ ...base, fig: 1, hairStyle: 2, hair: 5, skin: 0, face: 1 }, { weapon: 'dagger', armor: 'leather', acc: 'cape' }, 'thief'],
    ],
    bare: [
      [{ ...base, fig: 0 }, {}, 'warrior'], [{ ...base, fig: 1, hairStyle: 3, hair: 4, skin: 2 }, {}, 'mage'],
      [{ ...base, fig: 0, body: 1, skin: 4, hairStyle: 5, hair: 0 }, {}, 'warrior'], [{ ...base, fig: 1, hairStyle: 4, hair: 3, skin: 0, face: 1 }, {}, 'priest'],
    ],
    undies: [
      [{ ...base, fig: 0 }, {}, 'warrior'], [{ ...base, fig: 1, hairStyle: 3, hair: 4, skin: 2 }, {}, 'mage'],
      [{ ...base, fig: 0, body: 1 }, { armor: 'heartBoxers' }, 'warrior'], [{ ...base, fig: 1, hairStyle: 2, hair: 6 }, { armor: 'slimeBriefs', weapon: 'stick' }, 'mage'],
    ],
    npc: [
      [{ ...base, fig: 0, hair: 4, body: 1, face: 2 }, {}, undefined], [{ ...base, fig: 1, hairStyle: 4, hair: 8, skin: 3 }, { armor: 'robe' }, undefined],
      [{ ...base, child: true }, { head: 'bandana' }, undefined], [{ ...base, fig: 1, hairStyle: 3, hair: 3, child: true }, {}, undefined],
    ],
  };
  const rows = sets[set]; const frames = [0, 1, 3, 4, 9, 10];
  const fw = 32, fh = 64; const c = document.createElement('canvas'); c.width = frames.length * fw * S + 20; c.height = rows.length * fh * S + 20;
  const g = c.getContext('2d'); g.fillStyle = '#6a7a6a'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
  rows.forEach(([look, equip, voc], r) => { const k = ensureDollHd(sc, { look, equip, voc }); const tex = sc.textures.get(k);
    frames.forEach((f, j) => { const fr = tex.get(f); g.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 10 + j * fw * S + (fw - fr.cutWidth) * S / 2, 10 + r * fh * S + (fh - fr.cutHeight) * S, fr.cutWidth * S, fr.cutHeight * S); }); });
  return c.toDataURL('image/png');
}, [set, Number(scale || 4)]);
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
