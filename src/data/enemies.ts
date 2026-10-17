export interface EnemyDef {
  id: string; name: string; sprite: string; hp: number; mp: number; atk: number; def: number; agi: number; mag: number;
  xp: number; gold: number; drop?: { item: string; chance: number };
  weak?: string[]; resist?: string[];
  actions: { w: number; type: 'attack' | 'skill'; skill?: string; name?: string; power?: number; msg?: string;
    /** special behaviours: all = hit whole party, heal = heal self (power = fraction of max HP), weaken/soften = party ATK/DEF down,
     *  venom = hit + poison, drain = hit + heal by damage, sleep = lull one member, charge = wind up a devastating 'all' next turn, below = only when HP below this fraction */
    kind?: 'all' | 'heal' | 'weaken' | 'soften' | 'venom' | 'drain' | 'sleep' | 'charge'; below?: number }[];
  boss?: boolean; scale?: number;
}
export const ENEMIES: Record<string, EnemyDef> = {
  glimmer: { id: 'glimmer', name: 'Glimmerblob', sprite: 'm_glimmer', hp: 8, mp: 0, atk: 7, def: 3, agi: 4, mag: 2, xp: 4, gold: 3, drop: { item: 'herb', chance: 0.2 }, weak: ['fire'],
    actions: [{ w: 8, type: 'attack' }, { w: 2, type: 'skill', name: 'Wobble', msg: 'wobbles adorably. Nothing happens.' }] },
  thornhare: { id: 'thornhare', name: 'Thornhare', sprite: 'm_hare', hp: 14, mp: 0, atk: 12, def: 4, agi: 11, mag: 1, xp: 7, gold: 5, drop: { item: 'herb', chance: 0.25 }, weak: ['fire'],
    actions: [{ w: 7, type: 'attack' }, { w: 3, type: 'skill', name: 'Bramble Kick', power: 1.4, msg: 'unleashes a Bramble Kick!' }] },
  duskbat: { id: 'duskbat', name: 'Duskbat', sprite: 'm_bat', hp: 15, mp: 4, atk: 17, def: 3, agi: 14, mag: 4, xp: 8, gold: 4, drop: { item: 'ether', chance: 0.08 }, weak: ['light'],
    actions: [{ w: 7, type: 'attack' }, { w: 3, type: 'skill', name: 'Leech Bite', power: 1.1, msg: 'sinks its fangs in!' }] },
  mossback: { id: 'mossback', name: 'Mossback', sprite: 'm_turtle', hp: 30, mp: 0, atk: 16, def: 12, agi: 2, mag: 2, xp: 12, gold: 10, drop: { item: 'antidote', chance: 0.3 }, weak: ['fire'], resist: ['ice'],
    actions: [{ w: 6, type: 'attack' }, { w: 4, type: 'skill', name: 'Shell Slam', power: 1.5, msg: 'slams down with its shell!' }] },
  cinderImp: { id: 'cinderImp', name: 'Cinder Imp', sprite: 'm_imp', hp: 22, mp: 10, atk: 21, def: 6, agi: 10, mag: 9, xp: 13, gold: 9, drop: { item: 'firebomb', chance: 0.2 }, weak: ['ice'], resist: ['fire'],
    actions: [{ w: 5, type: 'attack' }, { w: 5, type: 'skill', skill: 'spark', msg: 'casts Spark!' }] },
  hollowKnight: { id: 'hollowKnight', name: 'Hollow Squire', sprite: 'm_squire', hp: 34, mp: 0, atk: 27, def: 11, agi: 6, mag: 2, xp: 18, gold: 15, drop: { item: 'leather', chance: 0.1 }, weak: ['light'],
    actions: [{ w: 7, type: 'attack' }, { w: 3, type: 'skill', name: 'Rusted Thrust', power: 1.5, msg: 'lunges with a rusted spear!' }] },
  warden: { id: 'warden', name: 'The Hollow Warden', sprite: 'm_warden', boss: true, scale: 1, hp: 200, mp: 40, atk: 30, def: 10, agi: 7, mag: 14, xp: 140, gold: 150, weak: ['ice', 'light'], resist: ['fire'],
    actions: [{ w: 5, type: 'attack' }, { w: 2, type: 'skill', name: 'Cinder Quake', power: 0.85, msg: 'slams the ground! The cavern quakes!' }, { w: 2, type: 'skill', skill: 'sparkstorm', msg: 'breathes a storm of cinders!' }, { w: 1, type: 'skill', name: 'Smoulder', msg: 'draws heat into its core...' }] },
  // ---- Chapter II: Emberwood Road
  ashwolf: { id: 'ashwolf', name: 'Ashwolf', sprite: 'm_ashwolf', scale: 0.78, hp: 38, mp: 0, atk: 27, def: 10, agi: 15, mag: 3, xp: 22, gold: 14, drop: { item: 'herb', chance: 0.3 }, weak: ['ice'], resist: ['fire'],
    actions: [{ w: 6, type: 'attack' }, { w: 3, type: 'skill', name: 'Cinder Fang', power: 1.4, kind: 'venom', msg: 'bites with smouldering fangs!' }, { w: 1, type: 'skill', name: 'Howl', kind: 'soften', power: 0.8, msg: 'howls! Your party\'s guard falters!' }] },
  mossling: { id: 'mossling', name: 'Mossling', sprite: 'm_mossling', scale: 0.78, hp: 46, mp: 8, atk: 24, def: 14, agi: 4, mag: 8, xp: 20, gold: 16, drop: { item: 'antidote', chance: 0.3 }, weak: ['fire'],
    actions: [{ w: 5, type: 'attack' }, { w: 3, type: 'skill', name: 'Spore Cloud', kind: 'sleep', msg: 'puffs out drowsy spores!' }, { w: 2, type: 'skill', name: 'Photosynthesis', kind: 'heal', power: 0.25, msg: 'basks in the light and regrows!', below: 0.6 }] },
  bramblewisp: { id: 'bramblewisp', name: 'Bramblewisp', sprite: 'm_bramblewisp', scale: 0.72, hp: 30, mp: 20, atk: 20, def: 8, agi: 13, mag: 14, xp: 21, gold: 12, drop: { item: 'ether', chance: 0.12 }, weak: ['light', 'fire'], resist: ['dark'],
    actions: [{ w: 4, type: 'attack' }, { w: 4, type: 'skill', skill: 'frostNeedle', msg: 'flickers and casts Frost!' }, { w: 2, type: 'skill', name: 'Thornlash', kind: 'all', power: 0.7, msg: 'lashes out with a halo of thorns!' }] },
  gloomowl: { id: 'gloomowl', name: 'Gloomowl', sprite: 'm_gloomowl', scale: 0.78, hp: 40, mp: 10, atk: 26, def: 9, agi: 17, mag: 10, xp: 24, gold: 18, drop: { item: 'hiHerb', chance: 0.15 }, weak: ['light'],
    actions: [{ w: 6, type: 'attack' }, { w: 2, type: 'skill', name: 'Hypnotic Gaze', kind: 'sleep', msg: 'fixes you with a hypnotic stare…' }, { w: 2, type: 'skill', name: 'Dive', power: 1.5, msg: 'dives from above!' }] },
  // ---- Chapter II: the sea grotto
  brinecrab: { id: 'brinecrab', name: 'Brinecrab', sprite: 'm_brinecrab', scale: 0.8, hp: 56, mp: 0, atk: 31, def: 22, agi: 6, mag: 2, xp: 28, gold: 22, drop: { item: 'pearl', chance: 0.4 }, weak: ['fire'], resist: ['ice'],
    actions: [{ w: 6, type: 'attack' }, { w: 3, type: 'skill', name: 'Pincer Crush', power: 1.6, msg: 'crushes with its giant pincer!' }, { w: 1, type: 'skill', name: 'Harden', kind: 'heal', power: 0.15, msg: 'hunkers into its shell.' }] },
  lanternjelly: { id: 'lanternjelly', name: 'Lantern Jelly', sprite: 'm_lanternjelly', scale: 0.74, hp: 36, mp: 30, atk: 22, def: 10, agi: 9, mag: 18, xp: 26, gold: 18, drop: { item: 'ether', chance: 0.15 }, weak: ['fire'], resist: ['ice', 'light'],
    actions: [{ w: 4, type: 'attack' }, { w: 3, type: 'skill', name: 'Sting', kind: 'venom', power: 1.1, msg: 'trails a stinging tentacle!' }, { w: 3, type: 'skill', skill: 'frostNeedle', msg: 'pulses with cold light!' }] },
  acolyte: { id: 'acolyte', name: 'Choir Acolyte', sprite: 'm_acolyte', scale: 0.8, hp: 50, mp: 24, atk: 30, def: 14, agi: 10, mag: 16, xp: 30, gold: 26, drop: { item: 'ether', chance: 0.2 }, weak: ['light'], resist: ['dark'],
    actions: [{ w: 4, type: 'attack' }, { w: 3, type: 'skill', skill: 'curse', msg: 'chants a hymn of ash!' }, { w: 2, type: 'skill', name: 'Dirge', kind: 'weaken', power: 0.8, msg: 'sings a mournful Dirge… Your party\'s strength ebbs!' }, { w: 1, type: 'skill', name: 'Benediction', kind: 'heal', power: 0.3, msg: 'prays for ashen mercy.', below: 0.5 }] },
  drowned: { id: 'drowned', name: 'Drowned Sailor', sprite: 'm_drowned', scale: 0.82, hp: 64, mp: 0, atk: 34, def: 15, agi: 7, mag: 4, xp: 33, gold: 30, drop: { item: 'hiHerb', chance: 0.25 }, weak: ['light', 'fire'], resist: ['ice'],
    actions: [{ w: 6, type: 'attack' }, { w: 3, type: 'skill', name: 'Boathook Drag', kind: 'drain', power: 1.3, msg: 'hooks and drags with a cold grip!' }, { w: 1, type: 'skill', name: 'Sea Shanty', kind: 'weaken', power: 0.85, msg: 'moans a drowned shanty…' }] },
  siren: { id: 'siren', name: 'Siren Eel', sprite: 'm_siren', scale: 0.82, hp: 58, mp: 20, atk: 32, def: 12, agi: 16, mag: 16, xp: 34, gold: 28, drop: { item: 'pearl', chance: 0.3 }, weak: ['ice'], resist: ['fire'],
    actions: [{ w: 5, type: 'attack' }, { w: 2, type: 'skill', name: 'Siren Song', kind: 'sleep', msg: 'sings an irresistible song…' }, { w: 3, type: 'skill', name: 'Riptide', kind: 'all', power: 0.75, msg: 'whips up a riptide!' }] },
  cantor: { id: 'cantor', name: 'Cantor Mordane', sprite: 'm_cantor', boss: true, scale: 1, hp: 520, mp: 90, atk: 40, def: 18, agi: 11, mag: 24, xp: 420, gold: 400, weak: ['light'], resist: ['dark'],
    actions: [{ w: 4, type: 'attack' }, { w: 2, type: 'skill', name: 'Requiem', kind: 'charge', power: 1.35, msg: 'raises his baton. The Choir begins a Requiem…' }, { w: 2, type: 'skill', skill: 'curse', msg: 'conducts a chord of ash!' }, { w: 2, type: 'skill', name: 'Dirge of Ash', kind: 'weaken', power: 0.75, msg: 'sings a Dirge of Ash! Your strength fades…' }, { w: 1, type: 'skill', name: 'Encore', kind: 'heal', power: 0.12, msg: 'demands an Encore! His wounds close.', below: 0.6 }, { w: 1, type: 'skill', name: 'Lacrimosa', kind: 'sleep', msg: 'hums the Lacrimosa…' }] },
};
// encounter tables: list of possible groups with weights
export const ENCOUNTERS: Record<string, { w: number; group: string[] }[]> = {
  fields: [ { w: 5, group: ['glimmer'] }, { w: 4, group: ['glimmer', 'glimmer'] }, { w: 4, group: ['thornhare'] }, { w: 3, group: ['thornhare', 'glimmer'] }, { w: 2, group: ['mossback'] }, { w: 2, group: ['duskbat', 'glimmer'] } ],
  road: [ { w: 4, group: ['ashwolf'] }, { w: 3, group: ['mossling', 'bramblewisp'] }, { w: 3, group: ['ashwolf', 'ashwolf'] }, { w: 3, group: ['gloomowl'] }, { w: 2, group: ['bramblewisp', 'bramblewisp', 'mossling'] }, { w: 2, group: ['gloomowl', 'ashwolf'] } ],
  coast: [ { w: 4, group: ['brinecrab'] }, { w: 3, group: ['lanternjelly', 'lanternjelly'] }, { w: 2, group: ['brinecrab', 'lanternjelly'] }, { w: 2, group: ['ashwolf', 'gloomowl'] } ],
  grotto: [ { w: 3, group: ['brinecrab', 'lanternjelly'] }, { w: 3, group: ['drowned'] }, { w: 3, group: ['siren'] }, { w: 2, group: ['lanternjelly', 'lanternjelly', 'lanternjelly'] }, { w: 2, group: ['drowned', 'lanternjelly'] } ],
  sanctum: [ { w: 4, group: ['acolyte'] }, { w: 3, group: ['acolyte', 'drowned'] }, { w: 3, group: ['siren', 'acolyte'] }, { w: 2, group: ['acolyte', 'acolyte'] } ],
  hollow: [ { w: 4, group: ['duskbat', 'duskbat'] }, { w: 4, group: ['cinderImp'] }, { w: 3, group: ['hollowKnight'] }, { w: 3, group: ['cinderImp', 'duskbat'] }, { w: 2, group: ['mossback', 'cinderImp'] } ],
};
