import { VOCATIONS, xpFor, StatBlock } from '../data/vocations';
import { ITEMS, Slot } from '../data/items';
import { SKILLS } from '../data/skills';

/** Indices into palettes in paperdoll.ts */
export interface Look { body: number; skin: number; hairStyle: number; hair: number; eyes: number; face: number; outfit: number; outfit2: number }
export interface Member {
  id: string; name: string; voc: string; level: number; xp: number; hp: number; mp: number;
  equip: Partial<Record<Slot, string>>; look: Look; extraSkills: string[]; poisoned?: boolean;
  /** per-vocation progress (DQ-style: each vocation levels separately) */
  vocs?: Record<string, { level: number; xp: number }>;
}
export interface GameState {
  version: number; party: Member[]; gold: number; inv: Record<string, number>;
  roster: Member[]; flags: Record<string, any>; quests: Record<string, 'active' | 'done'>;
  map: string; x: number; y: number; dir: number; playTime: number; steps: number;
  savePoint: { map: string; x: number; y: number }; savedAt?: number; saveReason?: string;
}

export function newMember(id: string, name: string, voc: string, look: Look, level = 1): Member {
  const m: Member = { id, name, voc, level, xp: xpFor(level), hp: 1, mp: 1, equip: {}, look, extraSkills: [], vocs: {} };
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
/** Abilities: everything the current vocation has taught, plus anything learned in past vocations (kept for life). */
export function skillsOf(m: Member): string[] {
  const out: string[] = [];
  const lv: Record<string, number> = {}; for (const [k, o] of Object.entries(m.vocs || {})) lv[k] = o.level; lv[m.voc] = m.level;
  const order = [m.voc, ...Object.keys(lv).filter(k => k !== m.voc)];
  for (const vk of order) { const v = VOCATIONS[vk]; if (!v) continue; for (const [l, ids] of Object.entries(v.learn)) if (lv[vk] >= +l) out.push(...ids); }
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
/** DQ-style vocation change: each vocation keeps its own level; gear the new vocation can't use goes to the bag. */
export function changeVocation(m: Member, voc: string, bag: (id: string) => void) {
  if (!VOCATIONS[voc] || voc === m.voc) return;
  const before = stats(m); const hpR = before.hp ? m.hp / before.hp : 1, mpR = before.mp ? m.mp / before.mp : 1;
  m.vocs = m.vocs || {}; m.vocs[m.voc] = { level: m.level, xp: m.xp };
  const next = m.vocs[voc] || { level: 1, xp: 0 }; m.voc = voc; m.level = next.level; m.xp = next.xp;
  for (const [slot, id] of Object.entries(m.equip)) if (id && !VOCATIONS[voc].canEquip.includes(ITEMS[id]?.tag || '')) { bag(id); delete (m.equip as any)[slot]; }
  const after = stats(m); m.hp = Math.max(1, Math.round(after.hp * hpR)); m.mp = Math.round(after.mp * mpR);
}
export function canEquip(m: Member, item: string) {
  const it = ITEMS[item]; return !!it && it.kind === 'equip' && VOCATIONS[m.voc].canEquip.includes(it.tag!);
}

/* ------------------------------------------------------------------ persistence
 * Three "Adventure Logs" (slots). Each slot keeps the current record and the previous good record (.bak).
 * Records are wrapped in a versioned envelope with a checksum; a record is validated before it is written
 * and after it is read back. A corrupt or invalid state is never written over a good one.
 */
export const SAVE_VERSION = 2;
export const SLOTS_N = 3;
const LEGACY_KEY = 'emberfall.save.v1';
const slotKey = (n: number) => `emberfall.slot${n}`;
export interface SlotInfo { slot: number; name: string; level: number; voc: string; map: string; playTime: number; ts: number; chapter: number; fromBackup?: boolean }
function hash(str: string) { let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); }
let validMaps: (id: string) => boolean = () => true;
export function setMapValidator(f: (id: string) => boolean) { validMaps = f; }
/** Structural validation: rejects anything that could not be loaded back safely. */
export function validState(s: any): s is GameState {
  try {
    if (!s || typeof s !== 'object') return false;
    if (!Array.isArray(s.party) || s.party.length < 1 || s.party.length > 4 || s.party[0].id !== 'hero') return false;
    for (const m of [...s.party, ...(s.roster || [])]) {
      if (!m || typeof m.name !== 'string' || !VOCATIONS[m.voc] || !Number.isFinite(m.level) || !Number.isFinite(m.hp) || !Number.isFinite(m.mp) || !m.look || typeof m.equip !== 'object') return false;
    }
    if (!Number.isFinite(s.gold) || typeof s.inv !== 'object' || typeof s.flags !== 'object' || typeof s.quests !== 'object') return false;
    if (typeof s.map !== 'string' || !validMaps(s.map) || !Number.isFinite(s.x) || !Number.isFinite(s.y)) return false;
    if (!s.savePoint || !validMaps(s.savePoint.map)) return false;
    return true;
  } catch { return false; }
}
/** Bring older records up to date. */
export function migrate(s: any): GameState {
  if (!s.version || s.version < 2) {
    s.roster = s.roster || []; s.quests = s.quests || {}; s.flags = s.flags || {};
    for (const m of [...s.party, ...s.roster]) { m.extraSkills = m.extraSkills || []; m.vocs = m.vocs || { [m.voc]: { level: m.level, xp: m.xp } }; }
    s.version = 2;
  }
  for (const m of [...s.party, ...s.roster]) m.vocs = m.vocs || { [m.voc]: { level: m.level, xp: m.xp } };
  return s;
}
function parseRecord(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw);
    let data: any;
    if (env && env.v && env.data !== undefined) { if (typeof env.data !== 'string' || hash(env.data) !== env.sum) return null; data = JSON.parse(env.data); }
    else data = env; // legacy bare record
    data = migrate(data);
    return validState(data) ? data : null;
  } catch { return null; }
}

class Store {
  s!: GameState;
  slot = 0;
  lastSaveError = '';
  /** pending autosave reason ('' = nothing to save) */
  dirty = ''; lastAuto = 0;
  markDirty(reason: string) { if (!this.dirty) this.dirty = reason; }
  newGame(heroName: string, voc: string, look: Look, slot = this.slot) {
    const hero = newMember('hero', heroName, voc, look);
    const starter: Record<string, string> = { warrior: 'shortsword', mage: 'stick', priest: 'stick', thief: 'dagger' };
    hero.equip = { weapon: starter[voc], armor: 'tunic' };
    this.slot = slot;
    this.s = { version: SAVE_VERSION, party: [hero], gold: 30, inv: { herb: 3 }, roster: [], flags: {}, quests: {}, map: 'village', x: 14, y: 12, dir: 0, playTime: 0, steps: 0, savePoint: { map: 'village', x: 14, y: 12 } };
  }
  get hero() { return this.s.party[0]; }
  flag(k: string) { return this.s.flags[k]; }
  set(k: string, v: any = true) { this.s.flags[k] = v; }
  addItem(id: string, n = 1) { this.s.inv[id] = (this.s.inv[id] || 0) + n; if (this.s.inv[id] <= 0) delete this.s.inv[id]; }
  has(id: string) { return (this.s.inv[id] || 0) > 0 || this.s.party.some(m => Object.values(m.equip).includes(id)); }
  healAll() { for (const m of this.s.party) { const st = stats(m); m.hp = st.hp; m.mp = st.mp; m.poisoned = false; } }
  /** Write the current state to the active slot. Returns false (and keeps the old record) if anything is off. */
  save(reason = 'manual'): boolean {
    try {
      if (!this.s) return false;
      const st = JSON.parse(JSON.stringify(this.s)); st.version = SAVE_VERSION; st.savedAt = Date.now(); st.saveReason = reason;
      if (!validState(st)) { this.lastSaveError = 'invalid state'; console.warn('[save] refused: invalid state', reason); return false; }
      const data = JSON.stringify(st); const rec = JSON.stringify({ v: SAVE_VERSION, ts: st.savedAt, sum: hash(data), data });
      const key = slotKey(this.slot); const cur = localStorage.getItem(key);
      if (cur && parseRecord(cur)) localStorage.setItem(key + '.bak', cur); // keep the previous good record
      localStorage.setItem(key, rec);
      if (localStorage.getItem(key) !== rec || !parseRecord(rec)) { // verify read-back; restore on mismatch
        if (cur) localStorage.setItem(key, cur); this.lastSaveError = 'verify failed'; return false;
      }
      localStorage.setItem('emberfall.lastSlot', String(this.slot));
      this.lastSaveError = ''; (window as any).__EMBER && ((window as any).__EMBER.lastSave = { reason, ts: st.savedAt, slot: this.slot });
      return true;
    } catch (e: any) { this.lastSaveError = String(e?.message || e); console.warn('[save] failed', e); return false; }
  }
  /** Read a slot: current record, or its backup if the current one is damaged. */
  read(slot: number): { s: GameState; fromBackup: boolean } | null {
    try {
      this.importLegacy();
      const cur = parseRecord(localStorage.getItem(slotKey(slot))); if (cur) return { s: cur, fromBackup: false };
      const bak = parseRecord(localStorage.getItem(slotKey(slot) + '.bak')); if (bak) return { s: bak, fromBackup: true };
    } catch { /* storage unavailable */ }
    return null;
  }
  /** v0.1 kept one bare record under a different key: copy it into slot 0 (the original is left untouched). */
  importLegacy() {
    try {
      if (localStorage.getItem('emberfall.legacyImported')) return;
      const raw = localStorage.getItem(LEGACY_KEY);
      if (raw && !localStorage.getItem(slotKey(0))) {
        const s = parseRecord(raw);
        if (s) { const data = JSON.stringify(s); localStorage.setItem(slotKey(0), JSON.stringify({ v: SAVE_VERSION, ts: Date.now(), sum: hash(data), data })); }
      }
      localStorage.setItem('emberfall.legacyImported', '1');
    } catch { /* ignore */ }
  }
  slotInfo(slot: number): SlotInfo | null {
    const r = this.read(slot); if (!r) return null; const s: any = r.s;
    return { slot, name: s.party[0].name, level: s.party[0].level, voc: s.party[0].voc, map: s.map, playTime: s.playTime, ts: s.savedAt || 0, chapter: s.flags.chapter2Done ? 3 : s.flags.chapter1Done ? 2 : 1, fromBackup: r.fromBackup };
  }
  latestSlot(): number { let best = -1, ts = -1; for (let i = 0; i < SLOTS_N; i++) { const inf = this.slotInfo(i); if (inf && inf.ts >= ts) { ts = inf.ts; best = i; } } return best; }
  hasSave() { return this.latestSlot() >= 0; }
  load(slot = this.latestSlot()) { const r = slot >= 0 ? this.read(slot) : null; if (!r) return false; this.s = r.s; this.slot = slot; if (r.fromBackup) this.save('restore-backup'); return true; }
  deleteSlot(slot: number) { try { localStorage.removeItem(slotKey(slot)); localStorage.removeItem(slotKey(slot) + '.bak'); } catch { /* ignore */ } }
}
export const Game = new Store();
