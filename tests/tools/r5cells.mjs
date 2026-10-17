// node tests/tools/r5cells.mjs <out.png> <set> [scale] -> grid of doll frames; each cell = [look, equip, voc, adult, frame, label]
import { open } from '../lib.mjs';
import fs from 'fs';
const [out, set, scale] = process.argv.slice(2);
const h = await open(process.env.URL || 'http://localhost:5173/');
const url = await h.E(([set, S]) => {
  const { ensureDollHd, game } = window.__EMBER; const sc = game.scene.getScenes(true)[0];
  const M = { body: 0, skin: 1, hairStyle: 0, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6, fig: 0 };
  const Fm = { body: 0, skin: 2, hairStyle: 3, hair: 4, eyes: 2, face: 1, outfit: 4, outfit2: 3, fig: 1 };
  const D = { body: 1, skin: 4, hairStyle: 5, hair: 0, eyes: 3, face: 3, outfit: 1, outfit2: 5, fig: 0 };
  const P = { body: 0, skin: 0, hairStyle: 2, hair: 5, eyes: 5, face: 0, outfit: 2, outfit2: 7, fig: 1 };
  const gear = { weapon: 'shortsword', armor: 'leather', shield: 'pot' };
  const ink = [{ type: 'tattoo', region: 'foreR', variant: 0 }, { type: 'tattoo', region: 'chest', variant: 1 }, { type: 'tattoo', region: 'back', variant: 3 }, { type: 'scar', region: 'face', variant: 0 }];
  const fighter = [{ type: 'scar', region: 'abdomen', variant: 1 }, { type: 'tattoo', region: 'armL', variant: 2 }, { type: 'scar', region: 'foreR', variant: 0 }, { type: 'scar', region: 'chest', variant: 2 }];
  const hurt = [{ type: 'bandage', region: 'foreL', variant: 0 }, { type: 'wound', region: 'shoulderR', variant: 0 }, { type: 'dirt', region: 'legL' }, { type: 'blood', region: 'abdomen' }, { type: 'wound', region: 'face', variant: 1 }];
  const rows = {
    detail: [M, Fm, D, P].map(L => [[L, gear, 'warrior', 0, 0], [L, {}, 'warrior', 0, 0], [L, {}, 'warrior', 1, 0], [L, gear, 'warrior', 0, 9], [L, {}, 'warrior', 0, 9], [L, {}, 'warrior', 1, 9]]),
    marks: [[{ ...M, bodyMarks: ink }], [{ ...Fm, bodyMarks: fighter }], [{ ...D, bodyMarks: hurt }], [{ ...P, bodyMarks: ink }]].map(([L]) =>
      [[L, {}, 'warrior', 0, 0], [L, {}, 'warrior', 0, 3], [L, {}, 'warrior', 0, 9], [L, {}, 'warrior', 1, 0], [L, { weapon: 'shortsword', armor: 'tunic' }, 'warrior', 0, 0], [L, { armor: 'scale', head: 'helm' }, 'warrior', 0, 0]]),
  }[set];
  const fw = 32, fh = 64; const cols = rows[0].length; const c = document.createElement('canvas'); c.width = cols * fw * S + 20; c.height = rows.length * fh * S + 20;
  const g = c.getContext('2d'); g.fillStyle = '#5e6e66'; g.fillRect(0, 0, c.width, c.height); g.imageSmoothingEnabled = false;
  rows.forEach((row, r) => row.forEach(([look, equip, voc, adult, f], j) => {
    localStorage.setItem('ember_adult', adult ? '1' : '0');
    const k = ensureDollHd(sc, { look, equip, voc }); const fr = sc.textures.get(k).get(f);
    g.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 10 + j * fw * S, 10 + r * fh * S, fr.cutWidth * S, fr.cutHeight * S);
  }));
  localStorage.setItem('ember_adult', '0');
  return c.toDataURL('image/png');
}, [set, Number(scale || 4)]);
fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
