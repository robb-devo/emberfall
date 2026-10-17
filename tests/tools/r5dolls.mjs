// node tests/tools/r5dolls.mjs <out.png> <adult 0|1> <set: clothed|bare|mix>  -> lineup of adult dolls, all 4 directions, big
import { open } from '../lib.mjs';
const [out, adult, set] = process.argv.slice(2);
const h = await open(process.env.URL || 'http://localhost:5173/');
await h.E(a => localStorage.setItem('ember_adult', a), adult || '0');
await h.p.reload(); await h.wait(2000);
await h.E((set) => {
  const { ensureDollHd, game } = window.__EMBER; const sc = game.scene.getScenes(true)[0];
  sc.add.rectangle(0, 0, 4000, 4000, 0x1a1a2a, 1).setOrigin(0).setDepth(5000);
  const base = { body: 0, skin: 1, hairStyle: 0, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 };
  const rows = {
    clothed: [
      [{ ...base, fig: 0 }, { weapon: 'shortsword', armor: 'tunic', shield: 'pot' }, 'warrior'],
      [{ ...base, fig: 1, hairStyle: 3, hair: 4, skin: 2, eyes: 2 }, { weapon: 'stick', armor: 'robe', head: 'pointyhat' }, 'mage'],
      [{ ...base, fig: 0, body: 1, skin: 3, hairStyle: 1, hair: 0, face: 3 }, { weapon: 'bronzeAxe', armor: 'scale', head: 'helm', shield: 'kite' }, 'warrior'],
      [{ ...base, fig: 1, hairStyle: 2, hair: 5, skin: 0, face: 1 }, { weapon: 'dagger', armor: 'leather', acc: 'cape' }, 'thief'],
    ],
    bare: [
      [{ ...base, fig: 0 }, {}, 'warrior'], [{ ...base, fig: 1, hairStyle: 3, hair: 4, skin: 2 }, {}, 'mage'],
      [{ ...base, fig: 0, body: 1, skin: 4, hairStyle: 5, hair: 0 }, {}, 'warrior'], [{ ...base, fig: 1, hairStyle: 4, hair: 3, skin: 0 }, {}, 'priest'],
    ],
  }[set] || [];
  rows.forEach(([look, equip, voc], r) => { const k = ensureDollHd(sc, { look, equip, voc });
    [0, 1, 3, 9, 4, 5].forEach((f, j) => sc.add.sprite(40 + j * 60, 200 + r * 200, k, f).setOrigin(0.5, 1).setScale(3).setDepth(5001)); });
  // valid item ids check
}, set);
await h.wait(400); await h.shot(out); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
