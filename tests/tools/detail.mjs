// node tests/tools/detail.mjs out.png itemId  -> screenshot of the item detail panel (party of 3)
import { open } from '../lib.mjs';
const [out, id] = process.argv.slice(2);
const h = await open(process.env.URL);
await h.devStart('village', 14, 12, { chapter1Done: true }, 'warrior', {});
await h.E(() => { const { Game } = window.__EMBER; const mk = (n, v, look) => { const m = JSON.parse(JSON.stringify(Game.hero)); m.name = n; m.voc = v; m.look = { ...m.look, ...look }; m.equip = { armor: 'robe', weapon: 'stick' }; return m; }; Game.s.party.push(mk('Wren', 'mage', { hair: 4, hairStyle: 3, body: 1 }), mk('Brom', 'priest', { hair: 2, body: 0, skin: 3 })); window.__EMBER.world.refreshParty(); });
await h.wait(500);
h.E(id => { const ui = window.__EMBER.scene('UI'); ui.itemDetail(id, ['Equip', 'Back'], 'You have 1'); }, id);
await h.wait(1500); await h.shot(out); console.log('errors', h.errs.slice(0, 5)); await h.b.close();
