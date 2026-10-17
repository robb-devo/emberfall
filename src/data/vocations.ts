export interface StatBlock { hp: number; mp: number; atk: number; def: number; agi: number; mag: number }
export interface Vocation {
  id: string; name: string; desc: string; color: number;
  base: StatBlock; growth: StatBlock;
  learn: Record<number, string[]>; // level -> skill ids
  canEquip: string[]; // equipment tags
}
export const VOCATIONS: Record<string, Vocation> = {
  warrior: { id: 'warrior', name: 'Warrior', color: 0xd9534f,
    desc: 'Steel and grit. High HP and attack; masters of martial Skills.',
    base: { hp: 34, mp: 4, atk: 13, def: 10, agi: 6, mag: 2 }, growth: { hp: 7, mp: 1, atk: 3, def: 2.2, agi: 1.2, mag: 0.4 },
    learn: { 1: ['powerSlash'], 3: ['warCry'], 5: ['cleave'], 7: ['ironWill'] }, canEquip: ['sword', 'axe', 'heavy', 'light', 'acc', 'shield', 'heavyShield', 'hat', 'helm'] },
  mage: { id: 'mage', name: 'Mage', color: 0x5b8def,
    desc: 'Scholar of the arcane. Frail, but wields devastating Spells.',
    base: { hp: 22, mp: 18, atk: 6, def: 5, agi: 8, mag: 14 }, growth: { hp: 4, mp: 4, atk: 1, def: 1, agi: 1.5, mag: 3.2 },
    learn: { 1: ['spark'], 2: ['frostNeedle'], 4: ['sparkstorm'], 6: ['drainMind'] }, canEquip: ['staff', 'dagger', 'robe', 'light', 'acc', 'hat'] },
  priest: { id: 'priest', name: 'Priest', color: 0xf0c75e,
    desc: 'Keeper of the light. Heals wounds and shields allies.',
    base: { hp: 26, mp: 14, atk: 8, def: 7, agi: 7, mag: 11 }, growth: { hp: 5, mp: 3.4, atk: 1.6, def: 1.6, agi: 1.3, mag: 2.6 },
    learn: { 1: ['heal'], 2: ['ward'], 4: ['radiance'], 5: ['midheal'] }, canEquip: ['staff', 'mace', 'robe', 'light', 'acc', 'shield', 'hat'] },
  thief: { id: 'thief', name: 'Thief', color: 0x7ac74f,
    desc: 'Quick hands, quicker feet. Strikes first and steals treasure.',
    base: { hp: 27, mp: 8, atk: 10, def: 7, agi: 14, mag: 5 }, growth: { hp: 5.5, mp: 1.8, atk: 2.4, def: 1.6, agi: 3, mag: 1 },
    learn: { 1: ['quickStab'], 2: ['pilfer'], 4: ['shadowStep'], 6: ['venomFang'] }, canEquip: ['dagger', 'sword', 'light', 'acc', 'shield', 'hat'] },
};
// Experience required to REACH level L
export const xpFor = (l: number) => (l <= 1 ? 0 : Math.floor(8 * Math.pow(l - 1, 2.1) + 6 * (l - 1)));
export const MAX_LEVEL = 99;
