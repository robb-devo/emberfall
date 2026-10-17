export interface EnemyDef {
  id: string; name: string; sprite: string; hp: number; mp: number; atk: number; def: number; agi: number; mag: number;
  xp: number; gold: number; drop?: { item: string; chance: number };
  weak?: string[]; resist?: string[];
  actions: { w: number; type: 'attack' | 'skill'; skill?: string; name?: string; power?: number; msg?: string }[];
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
};
// encounter tables: list of possible groups with weights
export const ENCOUNTERS: Record<string, { w: number; group: string[] }[]> = {
  fields: [ { w: 5, group: ['glimmer'] }, { w: 4, group: ['glimmer', 'glimmer'] }, { w: 4, group: ['thornhare'] }, { w: 3, group: ['thornhare', 'glimmer'] }, { w: 2, group: ['mossback'] }, { w: 2, group: ['duskbat', 'glimmer'] } ],
  hollow: [ { w: 4, group: ['duskbat', 'duskbat'] }, { w: 4, group: ['cinderImp'] }, { w: 3, group: ['hollowKnight'] }, { w: 3, group: ['cinderImp', 'duskbat'] }, { w: 2, group: ['mossback', 'cinderImp'] } ],
};
