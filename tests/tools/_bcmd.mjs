// battle screenshot with the command menu up, full party
import { open } from '../lib.mjs';
const h = await open(process.env.URL);
await h.devStart('road', 22, 15, { chapter1Done: true, ch2Started: true, roadIntro: true }, 'warrior', {});
await h.E(() => { const G = window.__EMBER.Game; const b = G.hero; b.level = 8; b.equip = { weapon: 'ironsword', armor: 'leather', shield: 'pot', head: 'helm' };
  const mk = (id, name, voc, lv, equip, look) => { const m = JSON.parse(JSON.stringify(b)); Object.assign(m, { id, name, voc, level: lv, xp: 0, equip, vocs: {} }); if (look) Object.assign(m.look, look); return m; };
  G.s.party.push(mk('c1', 'Rook', 'priest', 7, { weapon: 'stick', armor: 'leather' }, { hair: 3, hairStyle: 2, outfit: 2 }), mk('c2', 'Wynn', 'mage', 7, { weapon: 'stick', armor: 'robe', head: 'pointyhat' }, { hair: 5, hairStyle: 3, body: 1, outfit: 4 }));
  G.healAll(); window.__EMBER.world.refreshParty(); window.__EMBER.fast = false; window.__EMBER.world.startBattle(['ashwolf', 'mossling', 'ashwolf'], { bg: 'bg_road' }); });
for (let i = 0; i < 40; i++) { const c = await h.E(() => !!window.__EMBER.scene('Battle')?.cmd); if (c) break; await h.key('Enter', 1, 300); }
await h.wait(600); await h.shot('/tmp/b_cmd.png');
console.log(h.errs.slice(0, 5)); await h.b.close();
