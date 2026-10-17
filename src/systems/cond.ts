import { Game } from './state';
import { Mature } from './mature';
import { STORY_MEMBERS } from '../data/story2';
/** a custom (non-story) companion in the active party who could be sold out (Round 5 dark actions) */
export function sellableMate() { return Game.s.party.slice(1).find(m => !STORY_MEMBERS[m.id]); }
/** Condition mini-language: "flag", "!flag", "adult", "karma>=n", "infamy<n", "#counter>=n", "mate", "has:item", "quest:id=state", "party>=n", "gold>=n"; combine with & (and) and | (or) */
export function evalCond(c?: string): boolean {
  if (!c) return true;
  if (c.includes('|')) return c.split('|').some(evalCond);
  if (c.includes('&')) return c.split('&').every(evalCond);
  if (c.startsWith('!')) return !evalCond(c.slice(1));
  if (c.startsWith('has:')) return Game.has(c.slice(4));
  if (c.startsWith('quest:')) { const [id, st] = c.slice(6).split('='); return (Game.s.quests[id] || 'none') === st; }
  const inv = /^inv:(\w+)>=(\d+)$/.exec(c); if (inv) return (Game.s.inv[inv[1]] || 0) >= +inv[2];
  if (c === 'adult') return Mature.on;
  if (c === 'mate') return !!sellableMate();
  const rep = /^(karma|infamy)(>=|<)(-?\d+)$/.exec(c); if (rep) { const v = +(Game.s.flags[rep[1]] || 0); return rep[2] === '>=' ? v >= +rep[3] : v < +rep[3]; }
  const cnt = /^#(\w+)>=(\d+)$/.exec(c); if (cnt) return +(Game.s.flags[cnt[1]] || 0) >= +cnt[2];
  let m = /^party>=(\d+)$/.exec(c); if (m) return Game.s.party.length >= +m[1];
  m = /^gold>=(\d+)$/.exec(c); if (m) return Game.s.gold >= +m[1];
  return !!Game.flag(c);
}
