// node tests/tools/adult.mjs <prefix> <adult 0|1>  -> paper dolls (masc+fem, no armour) in world + status-like close-up
import { open } from '../lib.mjs';
const [prefix, adult] = process.argv.slice(2);
const h = await open(process.env.URL);
await h.E(a => localStorage.setItem('ember_adult', a), adult || '0');
await h.devStart('village', 14, 12, { chapter1Done: true }, 'warrior', {});
await h.E(() => { const { Game } = window.__EMBER; Game.hero.equip = {}; Game.hero.look.fig = 0; const m = JSON.parse(JSON.stringify(Game.hero)); m.name = 'Wren'; m.voc = 'mage'; m.look = { ...m.look, fig: 1, hair: 4, hairStyle: 3, skin: 2 }; m.equip = {}; Game.s.party.push(m); window.__EMBER.world.refreshParty(); });
await h.wait(600);
// close-up: draw both dolls big on the UI scene
await h.E(() => { const ui = window.__EMBER.scene('UI'); const { Game, ensureDollHd } = window.__EMBER; const g = ui.add.rectangle(0, 0, 720, 3000, 0x10101c, 1).setOrigin(0).setDepth(2000);
  Game.s.party.forEach((m, i) => { const k = ensureDollHd(ui, { look: m.look, equip: m.equip, voc: m.voc }); [0, 3, 9].forEach((f, j) => ui.add.sprite(130 + j * 160 + (i ? 0 : 0), 520 + i * 560, k, f).setOrigin(0.5, 1).setScale(7 - 2.2).setDepth(2001)); });
});
await h.wait(500); await h.shot(`progress/${prefix}.png`); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
