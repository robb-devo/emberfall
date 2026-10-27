// node tests/tools/r6sheet.mjs <outprefix> <adult 0|1> <set>  -> raw doll3 sheets as PNGs (one per row), for crisp nearest-upscaled montages
import { open } from '../lib.mjs';
import fs from 'fs';
const [out, adult, set] = process.argv.slice(2);
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(a => localStorage.setItem('ember_adult', a), adult || '0');
await h.p.reload(); await h.wait(2000);
const urls = await h.E((set) => {
  const { ensureDollHd, game } = window.__EMBER; const sc = game.scene.getScenes(true)[0];
  const base = { body: 0, skin: 1, hairStyle: 0, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 };
  const L = [[{ ...base, fig: 0 }, 'warrior'], [{ ...base, fig: 1, hairStyle: 3, hair: 4, skin: 2 }, 'mage'], [{ ...base, fig: 0, body: 1, skin: 4, hairStyle: 5, hair: 0 }, 'warrior'], [{ ...base, fig: 1, hairStyle: 4, hair: 3, skin: 0 }, 'priest']];
  const EQ = [{ weapon: 'shortsword', armor: 'tunic', shield: 'pot' }, { weapon: 'stick', armor: 'robe', head: 'pointyhat' }, { weapon: 'bronzeAxe', armor: 'scale', head: 'helm' }, { weapon: 'dagger', armor: 'leather', acc: 'cape' }];
  return L.map(([look, voc], i) => { const k = ensureDollHd(sc, { look, equip: set === 'clothed' ? EQ[i] : {}, voc }, 'r6s_' + set + i + Math.random()); return sc.textures.get(k).getSourceImage().toDataURL(); });
}, set);
urls.forEach((u, i) => fs.writeFileSync(`${out}-${i}.png`, Buffer.from(u.split(',')[1], 'base64')));
console.log('errors', h.errs.slice(0, 5)); await h.b.close();
