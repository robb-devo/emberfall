import { VOCATIONS, xpFor, StatBlock } from '../data/vocations';
import { ITEMS, Slot } from '../data/items';
import { SKILLS } from '../data/skills';

/** Indices into palettes in paperdoll.ts */
export interface Look { body: number; skin: number; hairStyle: number; hair: number; eyes: number; face: number; outfit: number; outfit2: number }
export interface Member {
  id: string; name: string; voc: string; level: number; xp: number; hp: number; mp: number;
  equip: Partial<Record<Slot, string>>; look: Look; extraSkills: string[]; poisoned?: boolean;
}
export interface GameState {
  version: number; party: Member[]; gold: number; inv: Record<string, number>;
  roster: Member[]; flags: Record<string, any>; quests: Record<string, 'active' | 'done'>;
  map: string; x: number; y: number; dir: number; playTime: number; steps: number;
  savePoint: { map: string; x: number; y: number };
}
const KEY = 'emberfall.save.v1';

export function newMember(id: string, name: string, voc: string, look: Look, level = 1): Member {
  const m: Member = { id, name, voc, level, xp: xpFor(level), hp: 1, mp: 1, equip: {}, look, extraSkills: [] };
  const s = stats(m); m.hp = s.hp; m.mp = s.mp; return m;
}
export function baseStats(m: Member): StatBlock {
  const v = VOCATIONS[m.voc]; const o: any = {};
  for (const k of Object.keys(v.base)) o[k] = Math.floor((v.base as any)[k] + (v.growth as any)[k] * (m.level - 1));
  return o;
}
export function stats(m: Member): StatBlock {
  const s: any = baseStats(m);
  for (const id of Object.values(m.equip)) { const it = id && ITEMS[id]; if (it && it.mods) for (const [k, v] of Object.entries(it.mods)) s[k] += v; }
  return s;
}
export function skillsOf(m: Member): string[] {
  const v = VOCATIONS[m.voc]; const out: string[] = [];
  for (const [lv, ids] of Object.entries(v.learn)) if (m.level >= +lv) out.push(...ids);
  return [...out, ...m.extraSkills].filter((id, i, a) => a.indexOf(id) === i && SKILLS[id]);
}
/** Grant XP; returns list of level-up events */
export function gainXp(m: Member, xp: number) {
  const ev: { level: number; learned: string[]; gains: Partial<StatBlock> }[] = [];
  m.xp += xp;
  while (xpFor(m.level + 1) <= m.xp && m.level < 99) {
    const before = stats(m); const sk = skillsOf(m);
    m.level++;
    const after = stats(m); const gains: any = {};
    for (const k of Object.keys(after)) gains[k] = (after as any)[k] - (before as any)[k];
    m.hp += gains.hp; m.mp += gains.mp;
    ev.push({ level: m.level, learned: skillsOf(m).filter(s => !sk.includes(s)), gains });
  }
  return ev;
}
export function canEquip(m: Member, item: string) {
  const it = ITEMS[item]; return !!it && it.kind === 'equip' && VOCATIONS[m.voc].canEquip.includes(it.tag!);
}

class Store {
  s!: GameState;
  newGame(heroName: string, voc: string, look: Look) {
    const hero = newMember('hero', heroName, voc, look);
    const starter: Record<string, string> = { warrior: 'shortsword', mage: 'stick', priest: 'stick', thief: 'dagger' };
    hero.equip = { weapon: starter[voc], armor: 'tunic' };
    this.s = { version: 1, party: [hero], gold: 30, inv: { herb: 3 }, roster: [], flags: {}, quests: {}, map: 'village', x: 0, y: 0, dir: 0, playTime: 0, steps: 0, savePoint: { map: 'village', x: 14, y: 12 } };
  }
  get hero() { return this.s.party[0]; }
  flag(k: string) { return this.s.flags[k]; }
  set(k: string, v: any = true) { this.s.flags[k] = v; }
  addItem(id: string, n = 1) { this.s.inv[id] = (this.s.inv[id] || 0) + n; if (this.s.inv[id] <= 0) delete this.s.inv[id]; }
  has(id: string) { return (this.s.inv[id] || 0) > 0 || this.s.party.some(m => Object.values(m.equip).includes(id)); }
  healAll() { for (const m of this.s.party) { const st = stats(m); m.hp = st.hp; m.mp = st.mp; m.poisoned = false; } }
  save() { localStorage.setItem(KEY, JSON.stringify(this.s)); }
  hasSave() { try { return !!localStorage.getItem(KEY); } catch { return false; } }
  load() { const raw = localStorage.getItem(KEY); if (!raw) return false; this.s = JSON.parse(raw); return true; }
}
export const Game = new Store();
