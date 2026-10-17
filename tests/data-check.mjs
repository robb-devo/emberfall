// Static validation of story data: every referenced script / item / quest / song / enemy / shop exists.
import { createServer } from 'vite';
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const L = p => vite.ssrLoadModule(p);
const { MAPS } = await L('/src/data/maps.ts'); const { SCRIPTS, QUESTS, TUTORIALS } = await L('/src/data/story.ts');
const { ITEMS } = await L('/src/data/items.ts'); const { SONGS } = await L('/src/data/music.ts'); const { ENEMIES, ENCOUNTERS } = await L('/src/data/enemies.ts');
const { SKILLS } = await L('/src/data/skills.ts'); const { VOCATIONS } = await L('/src/data/vocations.ts');
const ui = (await import('fs')).readFileSync('src/scenes/UIScene.ts', 'utf8'); const shops = [...ui.matchAll(/^  (\w+): \[/gm)].map(m => m[1]);
await vite.close();
let bad = 0; const fail = m => { bad++; console.log('✗', m); };
const walk = (cmds, where) => { for (const c of cmds || []) {
  if (c.call && !SCRIPTS[c.call]) fail(`${where}: call ${c.call}`);
  if (c.give && !ITEMS[c.give]) fail(`${where}: give ${c.give}`); if (c.take && !ITEMS[c.take]) fail(`${where}: take ${c.take}`);
  if (c.quest && !QUESTS[c.quest]) fail(`${where}: quest ${c.quest}`); if (c.tut && !TUTORIALS[c.tut]) fail(`${where}: tut ${c.tut}`);
  if (c.music && c.music !== 'none' && !SONGS[c.music]) fail(`${where}: music ${c.music}`);
  if (c.battle) for (const e of c.battle) if (!ENEMIES[e]) fail(`${where}: enemy ${e}`);
  if (c.shop && !shops.includes(c.shop)) fail(`${where}: shop ${c.shop}`);
  if (c.warp && !MAPS[c.warp]) fail(`${where}: warp ${c.warp}`);
  if (c.then) { if (Array.isArray(c.then[0])) c.then.forEach((t, i) => walk(t, where + '/choice' + i)); else walk(c.then, where + '/then'); }
  if (c.else) walk(c.else, where + '/else');
} };
for (const [k, v] of Object.entries(SCRIPTS)) walk(v, k);
for (const [id, m] of Object.entries(MAPS)) {
  if (!SONGS[m.music]) fail(`${id}: music ${m.music}`); if (m.encounters && !ENCOUNTERS[m.encounters.table]) fail(`${id}: encounter table`);
  for (const n of m.npcs) { if (n.script !== 'none' && !SCRIPTS[n.script]) fail(`${id}: npc ${n.id} script ${n.script}`); for (const e of Object.values(n.equip || {})) if (!ITEMS[e]) fail(`${id}: npc ${n.id} equip ${e}`); }
  for (const t of m.triggers) if (!SCRIPTS[t.script]) fail(`${id}: trigger ${t.script}`);
  for (const w of m.warps) if (w.blockScript && !SCRIPTS[w.blockScript]) fail(`${id}: blockScript ${w.blockScript}`);
  for (const c of m.chests) if (c.item && !ITEMS[c.item]) fail(`${id}: chest item ${c.item}`);
}
for (const e of Object.values(ENEMIES)) for (const a of e.actions) if (a.skill && !SKILLS[a.skill]) fail(`enemy ${e.id}: skill ${a.skill}`);
for (const t of Object.values(ENCOUNTERS)) for (const g of t) for (const e of g.group) if (!ENEMIES[e]) fail(`encounter enemy ${e}`);
for (const v of Object.values(VOCATIONS)) for (const l of Object.values(v.learn)) for (const s of l) if (!SKILLS[s]) fail(`voc ${v.id}: skill ${s}`);
for (const sh of shops) { const m = ui.match(new RegExp(`^  ${sh}: \\[([^\\]]*)\\]`, 'm')); for (const id of (m?.[1] || '').match(/'(\w+)'/g) || []) if (!ITEMS[id.slice(1, -1)]) fail(`shop ${sh}: ${id}`); }
for (const it of Object.values(ITEMS)) if (it.kind === 'equip' && !Object.values(VOCATIONS).some(v => v.canEquip.includes(it.tag))) fail(`item ${it.id}: no vocation can equip tag ${it.tag}`);
console.log(bad ? `${bad} problems` : 'data OK'); process.exit(bad ? 1 : 0);
