export type Target = 'enemy' | 'allEnemies' | 'ally' | 'allAllies' | 'self';
export interface Skill {
  id: string; name: string; kind: 'spell' | 'skill'; mp: number; target: Target; desc: string;
  power: number; // multiplier or base
  effect: 'phys' | 'magic' | 'heal' | 'buffDef' | 'buffAtk' | 'steal' | 'drainMp' | 'poison';
  element?: 'fire' | 'ice' | 'light' | 'dark' | 'none';
  fx: string; // visual effect id
  usableInField?: boolean;
}
export const SKILLS: Record<string, Skill> = {
  powerSlash: { id: 'powerSlash', name: 'Power Slash', kind: 'skill', mp: 2, target: 'enemy', effect: 'phys', power: 1.6, fx: 'slash', desc: 'A heavy blow for 160% damage.' },
  warCry: { id: 'warCry', name: 'War Cry', kind: 'skill', mp: 3, target: 'allAllies', effect: 'buffAtk', power: 1.3, fx: 'buff', desc: 'Raise party Attack for a few turns.' },
  cleave: { id: 'cleave', name: 'Cleave', kind: 'skill', mp: 4, target: 'allEnemies', effect: 'phys', power: 0.9, fx: 'slash', desc: 'Strike every enemy.' },
  ironWill: { id: 'ironWill', name: 'Iron Will', kind: 'skill', mp: 3, target: 'self', effect: 'buffDef', power: 1.8, fx: 'buff', desc: 'Greatly raise own Defense.' },
  spark: { id: 'spark', name: 'Spark', kind: 'spell', mp: 2, target: 'enemy', effect: 'magic', power: 9, element: 'fire', fx: 'fire', desc: 'A burst of flame on one foe.' },
  frostNeedle: { id: 'frostNeedle', name: 'Frost Needle', kind: 'spell', mp: 3, target: 'enemy', effect: 'magic', power: 13, element: 'ice', fx: 'ice', desc: 'Piercing shard of ice.' },
  sparkstorm: { id: 'sparkstorm', name: 'Sparkstorm', kind: 'spell', mp: 5, target: 'allEnemies', effect: 'magic', power: 10, element: 'fire', fx: 'fire', desc: 'Flames engulf all foes.' },
  drainMind: { id: 'drainMind', name: 'Drain Mind', kind: 'spell', mp: 0, target: 'enemy', effect: 'drainMp', power: 6, element: 'dark', fx: 'dark', desc: 'Siphon MP from a foe.' },
  heal: { id: 'heal', name: 'Heal', kind: 'spell', mp: 2, target: 'ally', effect: 'heal', power: 28, element: 'light', fx: 'heal', desc: 'Restore ~30 HP to one ally.', usableInField: true },
  ward: { id: 'ward', name: 'Ward', kind: 'spell', mp: 3, target: 'allAllies', effect: 'buffDef', power: 1.4, fx: 'buff', desc: 'A shimmering barrier for the party.' },
  radiance: { id: 'radiance', name: 'Radiance', kind: 'spell', mp: 4, target: 'allEnemies', effect: 'magic', power: 11, element: 'light', fx: 'light', desc: 'Holy light sears all foes.' },
  midheal: { id: 'midheal', name: 'Midheal', kind: 'spell', mp: 5, target: 'ally', effect: 'heal', power: 70, element: 'light', fx: 'heal', desc: 'Restore ~75 HP to one ally.', usableInField: true },
  quickStab: { id: 'quickStab', name: 'Quick Stab', kind: 'skill', mp: 1, target: 'enemy', effect: 'phys', power: 1.25, fx: 'slash', desc: 'A lightning-fast strike. Rarely misses.' },
  pilfer: { id: 'pilfer', name: 'Pilfer', kind: 'skill', mp: 2, target: 'enemy', effect: 'steal', power: 0.5, fx: 'slash', desc: 'Attack and try to steal an item.' },
  shadowStep: { id: 'shadowStep', name: 'Shadow Step', kind: 'skill', mp: 3, target: 'enemy', effect: 'phys', power: 2.0, fx: 'dark', desc: 'Vanish, then strike for 200%.' },
  venomFang: { id: 'venomFang', name: 'Venom Fang', kind: 'skill', mp: 3, target: 'enemy', effect: 'poison', power: 1.0, fx: 'dark', desc: 'A poisoned blade.' },
  // Star-guardian relic power (story)
  starfall: { id: 'starfall', name: 'Starfall', kind: 'spell', mp: 0, target: 'allEnemies', effect: 'magic', power: 40, element: 'light', fx: 'star', desc: 'A sliver of the power you once had.' },
};
