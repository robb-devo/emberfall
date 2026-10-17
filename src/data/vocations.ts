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
  paladin: { id: 'paladin', name: 'Paladin', color: 0xe8e4dc,
    desc: 'Holy knight. Heavy armour, healing light, protects allies. (Unlocked at the Chapel of Alltrades.)',
    base: { hp: 32, mp: 8, atk: 11, def: 12, agi: 5, mag: 7 }, growth: { hp: 6.5, mp: 2, atk: 2.5, def: 2.6, agi: 1, mag: 1.6 },
    learn: { 1: ['holyStrike'], 3: ['heal'], 5: ['bulwark'], 7: ['cover'], 9: ['judgement'] }, canEquip: ['sword', 'mace', 'spear', 'heavy', 'light', 'acc', 'shield', 'heavyShield', 'helm', 'hat'] },
  ranger: { id: 'ranger', name: 'Ranger', color: 0x5aa04a,
    desc: 'Wilderness hunter. Bows, critical strikes and field medicine. (Unlocked at the Chapel of Alltrades.)',
    base: { hp: 28, mp: 8, atk: 12, def: 8, agi: 12, mag: 5 }, growth: { hp: 5.5, mp: 1.8, atk: 2.8, def: 1.7, agi: 2.4, mag: 1.1 },
    learn: { 1: ['aimedShot'], 3: ['twinFang'], 5: ['herbcraft'], 8: ['wildRush'] }, canEquip: ['bow', 'axe', 'dagger', 'spear', 'light', 'acc', 'hat'] },
  bard: { id: 'bard', name: 'Bard', color: 0xc28cff,
    desc: 'Minstrel of old songs. Lifts allies, lulls and unsettles foes. (Unlocked at the Chapel of Alltrades.)',
    base: { hp: 24, mp: 14, atk: 8, def: 6, agi: 10, mag: 10 }, growth: { hp: 4.6, mp: 3.2, atk: 1.6, def: 1.3, agi: 2, mag: 2.4 },
    learn: { 1: ['valor'], 2: ['lullaby'], 4: ['tideHymn'], 6: ['discord'] }, canEquip: ['lute', 'dagger', 'staff', 'robe', 'light', 'acc', 'hat'] },
};
/** Vocations available at character creation; the rest unlock at the Chapel of Alltrades (Chapter II). */
export const STARTING_VOCS = ['warrior', 'mage', 'priest', 'thief'];
// Experience required to REACH level L
export const xpFor = (l: number) => (l <= 1 ? 0 : Math.floor(8 * Math.pow(l - 1, 2.1) + 6 * (l - 1)));
export const MAX_LEVEL = 99;
// Round 4: anyone can wear underwear-tier armour.
for (const v of Object.values(VOCATIONS)) if (!v.canEquip.includes('undies')) v.canEquip.push('undies');
