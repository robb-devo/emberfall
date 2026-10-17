import { Game } from './state';
/** Condition mini-language: "flag", "!flag", "has:item", "quest:id=state", "party>=n", "gold>=n"; combine with & (and) and | (or) */
export function evalCond(c?: string): boolean {
  if (!c) return true;
  if (c.includes('|')) return c.split('|').some(evalCond);
  if (c.includes('&')) return c.split('&').every(evalCond);
  if (c.startsWith('!')) return !evalCond(c.slice(1));
  if (c.startsWith('has:')) return Game.has(c.slice(4));
  if (c.startsWith('quest:')) { const [id, st] = c.slice(6).split('='); return (Game.s.quests[id] || 'none') === st; }
  const inv = /^inv:(\w+)>=(\d+)$/.exec(c); if (inv) return (Game.s.inv[inv[1]] || 0) >= +inv[2];
  let m = /^party>=(\d+)$/.exec(c); if (m) return Game.s.party.length >= +m[1];
  m = /^gold>=(\d+)$/.exec(c); if (m) return Game.s.gold >= +m[1];
  return !!Game.flag(c);
}
