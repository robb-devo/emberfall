export type Slot = 'weapon' | 'shield' | 'head' | 'armor' | 'acc';
export const SLOTS: Slot[] = ['weapon', 'shield', 'head', 'armor', 'acc'];
export const SLOT_NAMES: Record<Slot, string> = { weapon: 'Weapon', shield: 'Shield', head: 'Head', armor: 'Body', acc: 'Accessory' };
/** Visual descriptor used by the paper-doll renderer (src/systems/paperdoll.ts) */
export interface Vis { type: string; c1: number; c2?: number; c3?: number }
export interface Item {
  id: string; name: string; desc: string; price: number; icon: string;
  kind: 'consumable' | 'equip' | 'key';
  slot?: Slot; tag?: string; mods?: Partial<Record<'atk' | 'def' | 'agi' | 'mag' | 'hp' | 'mp', number>>;
  vis?: Vis;
  use?: { heal?: number; mp?: number; revive?: boolean; cure?: boolean; target: 'ally' | 'allAllies' | 'enemy'; damage?: number };
}
const I: Record<string, Item> = {
  herb: { id: 'herb', name: 'Medicinal Herb', kind: 'consumable', price: 8, icon: 'leaf', desc: 'Restores about 30 HP.', use: { heal: 32, target: 'ally' } },
  ether: { id: 'ether', name: 'Moon Dew', kind: 'consumable', price: 40, icon: 'drop', desc: 'Restores 15 MP.', use: { mp: 15, target: 'ally' } },
  antidote: { id: 'antidote', name: 'Antidotal Root', kind: 'consumable', price: 10, icon: 'leaf2', desc: 'Cures poison.', use: { cure: true, target: 'ally' } },
  feather: { id: 'feather', name: 'Ember Feather', kind: 'consumable', price: 120, icon: 'feather', desc: 'Revives a fallen ally with half HP.', use: { revive: true, heal: 0.5, target: 'ally' } },
  firebomb: { id: 'firebomb', name: 'Cinder Bomb', kind: 'consumable', price: 30, icon: 'bomb', desc: 'Deals ~25 fire damage to a foe.', use: { damage: 25, target: 'enemy' } },
  // weapons
  stick: { id: 'stick', name: 'Oaken Staff', kind: 'equip', slot: 'weapon', tag: 'staff', price: 20, icon: 'staff', mods: { atk: 3, mag: 2 }, vis: { type: 'staff', c1: 0x8a5a2b, c2: 0x6b4220 }, desc: 'A sturdy walking staff.' },
  wand: { id: 'wand', name: 'Willow Wand', kind: 'equip', slot: 'weapon', tag: 'staff', price: 110, icon: 'staff', mods: { atk: 4, mag: 7 }, vis: { type: 'staff', c1: 0xc9d6a3, c2: 0x6fd3ff }, desc: 'Topped with a humming sky-glass bead.' },
  shortsword: { id: 'shortsword', name: 'Copper Sword', kind: 'equip', slot: 'weapon', tag: 'sword', price: 70, icon: 'sword', mods: { atk: 8 }, vis: { type: 'sword', c1: 0xd88a4a, c2: 0x6b4220 }, desc: 'A simple copper blade.' },
  ironsword: { id: 'ironsword', name: 'Ironwood Blade', kind: 'equip', slot: 'weapon', tag: 'sword', price: 260, icon: 'sword', mods: { atk: 15 }, vis: { type: 'sword', c1: 0xdfe6ee, c2: 0x3a3f6b }, desc: 'Well-balanced steel.' },
  bronzeAxe: { id: 'bronzeAxe', name: 'Woodsman Axe', kind: 'equip', slot: 'weapon', tag: 'axe', price: 160, icon: 'axe', mods: { atk: 14, agi: -2 }, vis: { type: 'axe', c1: 0xc79a4a, c2: 0x6b4220 }, desc: 'Heavy and brutal.' },
  dagger: { id: 'dagger', name: 'Fang Dagger', kind: 'equip', slot: 'weapon', tag: 'dagger', price: 60, icon: 'dagger', mods: { atk: 6, agi: 3 }, vis: { type: 'dagger', c1: 0xeeeeee, c2: 0x7a3b8f }, desc: 'Light and wicked-sharp.' },
  mace: { id: 'mace', name: 'Pilgrim Mace', kind: 'equip', slot: 'weapon', tag: 'mace', price: 120, icon: 'mace', mods: { atk: 10, mag: 2 }, vis: { type: 'mace', c1: 0xf0c75e, c2: 0x6b4220 }, desc: 'Blessed iron head.' },
  // shields
  pot: { id: 'pot', name: 'Pot Lid', kind: 'equip', slot: 'shield', tag: 'shield', price: 15, icon: 'shield', mods: { def: 2 }, vis: { type: 'round', c1: 0x9aa0a8, c2: 0x5d636b }, desc: 'Somebody is missing a lid.' },
  buckler: { id: 'buckler', name: 'Oak Buckler', kind: 'equip', slot: 'shield', tag: 'shield', price: 90, icon: 'shield', mods: { def: 5 }, vis: { type: 'round', c1: 0x9c6b3a, c2: 0xd8b04a }, desc: 'Banded with brass.' },
  kite: { id: 'kite', name: 'Sunward Kite', kind: 'equip', slot: 'shield', tag: 'heavyShield', price: 240, icon: 'shield', mods: { def: 9, agi: -1 }, vis: { type: 'kite', c1: 0x2f5fa8, c2: 0xf0c75e }, desc: 'Bears a golden sunburst.' },
  // head
  bandana: { id: 'bandana', name: 'Red Bandana', kind: 'equip', slot: 'head', tag: 'hat', price: 25, icon: 'hat', mods: { def: 1, agi: 1 }, vis: { type: 'bandana', c1: 0xd9534f }, desc: 'Keeps the hair out of your eyes.' },
  pointyhat: { id: 'pointyhat', name: 'Pointy Hat', kind: 'equip', slot: 'head', tag: 'hat', price: 70, icon: 'hat', mods: { def: 2, mag: 3 }, vis: { type: 'wizard', c1: 0x4a3a8f, c2: 0xf0c75e }, desc: 'Every proper mage has one.' },
  helm: { id: 'helm', name: 'Iron Helm', kind: 'equip', slot: 'head', tag: 'helm', price: 140, icon: 'helm', mods: { def: 5, agi: -1 }, vis: { type: 'helm', c1: 0xb8c0cc, c2: 0xd9534f }, desc: 'Plumed with crimson.' },
  circlet: { id: 'circlet', name: 'Star Circlet', kind: 'equip', slot: 'head', tag: 'hat', price: 180, icon: 'hat', mods: { def: 2, mag: 5, mp: 4 }, vis: { type: 'circlet', c1: 0xf0c75e, c2: 0x6fd3ff }, desc: 'Silver band set with a sky-stone.' },
  // body
  tunic: { id: 'tunic', name: 'Plain Tunic', kind: 'equip', slot: 'armor', tag: 'light', price: 10, icon: 'armor', mods: { def: 2 }, vis: { type: 'tunic', c1: -1 }, desc: 'Better than nothing. (Uses your outfit colour.)' },
  leather: { id: 'leather', name: 'Leather Jerkin', kind: 'equip', slot: 'armor', tag: 'light', price: 80, icon: 'armor', mods: { def: 7 }, vis: { type: 'jerkin', c1: 0x8a5a2b, c2: 0x5a3818 }, desc: 'Supple and reliable.' },
  robe: { id: 'robe', name: 'Sage Robe', kind: 'equip', slot: 'armor', tag: 'robe', price: 90, icon: 'robe', mods: { def: 5, mag: 4 }, vis: { type: 'robe', c1: 0x3a4f9f, c2: 0xf0c75e }, desc: 'Woven with runes.' },
  scale: { id: 'scale', name: 'Scale Mail', kind: 'equip', slot: 'armor', tag: 'heavy', price: 220, icon: 'armor2', mods: { def: 13, agi: -2 }, vis: { type: 'plate', c1: 0xa8b4c4, c2: 0x5d6b7d }, desc: 'Overlapping iron scales.' },
  // accessories
  charm: { id: 'charm', name: 'Lucky Charm', kind: 'equip', slot: 'acc', tag: 'acc', price: 100, icon: 'ring', mods: { agi: 4, def: 1 }, vis: { type: 'amulet', c1: 0x7ac74f }, desc: 'A four-leaf clover in glass.' },
  cape: { id: 'cape', name: 'Traveller Cape', kind: 'equip', slot: 'acc', tag: 'acc', price: 150, icon: 'cape', mods: { def: 3, agi: 2 }, vis: { type: 'cape', c1: 0x8f2d3a, c2: 0x5a1a24 }, desc: 'Billows dramatically. +style.' },
  locket: { id: 'locket', name: "Mira's Locket", kind: 'key', price: 0, icon: 'ring', desc: 'A silver locket. A portrait inside.' },
  // ---- Chapter II gear
  spear: { id: 'spear', name: 'Tidecaller Spear', kind: 'equip', slot: 'weapon', tag: 'spear', price: 320, icon: 'spear', mods: { atk: 18, agi: 1 }, vis: { type: 'spear', c1: 0xc8e0f0, c2: 0x6b4220 }, desc: 'A fisher-knight\'s spear, salt-bright.' },
  shortbow: { id: 'shortbow', name: 'Hunter\'s Bow', kind: 'equip', slot: 'weapon', tag: 'bow', price: 180, icon: 'bow', mods: { atk: 12, agi: 2 }, vis: { type: 'bow', c1: 0x8a5a2b, c2: 0xe8e0c8 }, desc: 'Yew and gut-string. Strikes from afar.' },
  longbow: { id: 'longbow', name: 'Gale Longbow', kind: 'equip', slot: 'weapon', tag: 'bow', price: 380, icon: 'bow', mods: { atk: 19, agi: 3 }, vis: { type: 'bow', c1: 0x3a6a8a, c2: 0xf0e8d0 }, desc: 'Fletched with gull feathers.' },
  lute: { id: 'lute', name: 'Driftwood Lute', kind: 'equip', slot: 'weapon', tag: 'lute', price: 140, icon: 'lute', mods: { atk: 6, mag: 5, mp: 3 }, vis: { type: 'lute', c1: 0xc8904a, c2: 0x6b4220 }, desc: 'Sings sweetly; hits surprisingly hard.' },
  coralLute: { id: 'coralLute', name: 'Coral Lute', kind: 'equip', slot: 'weapon', tag: 'lute', price: 0, icon: 'lute', mods: { atk: 9, mag: 10, mp: 6 }, vis: { type: 'lute', c1: 0xff8ac8, c2: 0x6af0d0 }, desc: 'Ione\'s lute, strung with sea-silk.' },
  steelsword: { id: 'steelsword', name: 'Saltsteel Sword', kind: 'equip', slot: 'weapon', tag: 'sword', price: 420, icon: 'sword', mods: { atk: 22 }, vis: { type: 'sword', c1: 0xe8f4ff, c2: 0x2f5fa8 }, desc: 'Forged in Saltmere. Never rusts.' },
  warhammer: { id: 'warhammer', name: 'Anchor Maul', kind: 'equip', slot: 'weapon', tag: 'mace', price: 360, icon: 'mace', mods: { atk: 20, agi: -2 }, vis: { type: 'hammer', c1: 0x7a8494, c2: 0x5a3a22 }, desc: 'Somebody melted down an anchor.' },
  seaStaff: { id: 'seaStaff', name: 'Brine Staff', kind: 'equip', slot: 'weapon', tag: 'staff', price: 300, icon: 'staff', mods: { atk: 6, mag: 12 }, vis: { type: 'staff', c1: 0x9ad0e0, c2: 0x2fa8a8 }, desc: 'A conch-capped rod that hums with the tide.' },
  towerShield: { id: 'towerShield', name: 'Harbour Shield', kind: 'equip', slot: 'shield', tag: 'heavyShield', price: 340, icon: 'shield', mods: { def: 13, agi: -1 }, vis: { type: 'kite', c1: 0x2a6a7a, c2: 0xe8e4dc }, desc: 'Painted with the Saltmere gull.' },
  shellBuckler: { id: 'shellBuckler', name: 'Shell Buckler', kind: 'equip', slot: 'shield', tag: 'shield', price: 200, icon: 'shield', mods: { def: 8 }, vis: { type: 'round', c1: 0xf0c8b0, c2: 0xd87a6a }, desc: 'A giant clam, polished.' },
  hood: { id: 'hood', name: 'Ranger Hood', kind: 'equip', slot: 'head', tag: 'hat', price: 120, icon: 'hat', mods: { def: 3, agi: 2 }, vis: { type: 'hood', c1: 0x4a6a3a }, desc: 'Moss-green and weatherproof.' },
  featherCap: { id: 'featherCap', name: 'Plumed Cap', kind: 'equip', slot: 'head', tag: 'hat', price: 160, icon: 'hat', mods: { def: 3, mag: 2, agi: 2 }, vis: { type: 'cap', c1: 0x7d47c0, c2: 0xffd34e }, desc: 'A minstrel\'s pride.' },
  knightHelm: { id: 'knightHelm', name: 'Gull Helm', kind: 'equip', slot: 'head', tag: 'helm', price: 300, icon: 'helm', mods: { def: 8, agi: -1 }, vis: { type: 'helm', c1: 0xe8f0f8, c2: 0x2f5fa8 }, desc: 'Winged steel of the harbour watch.' },
  chain: { id: 'chain', name: 'Chain Mail', kind: 'equip', slot: 'armor', tag: 'heavy', price: 380, icon: 'armor2', mods: { def: 19, agi: -2 }, vis: { type: 'plate', c1: 0x8a94a4, c2: 0x3a4250 }, desc: 'Ringing links of saltsteel.' },
  sailorCoat: { id: 'sailorCoat', name: 'Mariner Coat', kind: 'equip', slot: 'armor', tag: 'light', price: 240, icon: 'armor', mods: { def: 11, agi: 1 }, vis: { type: 'jerkin', c1: 0x2f4f8f, c2: 0xe8e4dc }, desc: 'Tarred canvas and brass buttons.' },
  silkRobe: { id: 'silkRobe', name: 'Tide Silk Robe', kind: 'equip', slot: 'armor', tag: 'robe', price: 280, icon: 'robe', mods: { def: 9, mag: 6, mp: 4 }, vis: { type: 'robe', c1: 0x2fa8a8, c2: 0xf0e8d0 }, desc: 'Shimmers like shallow water.' },
  pearlRing: { id: 'pearlRing', name: 'Pearl Ring', kind: 'equip', slot: 'acc', tag: 'acc', price: 260, icon: 'ring', mods: { mp: 6, mag: 3 }, vis: { type: 'amulet', c1: 0xf0f0ff }, desc: 'A brine pearl in silver.' },
  gullCape: { id: 'gullCape', name: 'Gull-Wing Cape', kind: 'equip', slot: 'acc', tag: 'acc', price: 0, icon: 'cape', mods: { def: 5, agi: 4 }, vis: { type: 'cape', c1: 0xe8f0f8, c2: 0x8aa0b8 }, desc: 'White as sea-spray. A reward from Saltmere.' },
  // ---- Round 4: underwear-tier joke armour (shows as underwear on the paper doll)
  heartBoxers: { id: 'heartBoxers', name: 'Heart Boxers', kind: 'equip', slot: 'armor', tag: 'undies', price: 12, icon: 'armor', mods: { def: 1, agi: 2 }, vis: { type: 'undies', c1: 0xf4f0f0, c2: 0xe04060 }, desc: 'DEF +1, AGI +2. Morale not included.' },
  slimeBriefs: { id: 'slimeBriefs', name: 'Slime Briefs', kind: 'equip', slot: 'armor', tag: 'undies', price: 30, icon: 'armor', mods: { def: 2, mp: 3 }, vis: { type: 'undies', c1: 0x5ab0ff, c2: 0xffffff }, desc: 'DEF +2, MP +3. Squishy and proud.' },
  // ---- Chapter II consumables & keys
  hiHerb: { id: 'hiHerb', name: 'Strong Herb', kind: 'consumable', price: 30, icon: 'leaf', desc: 'Restores about 75 HP.', use: { heal: 75, target: 'ally' } },
  pearl: { id: 'pearl', name: 'Brine Pearl', kind: 'consumable', price: 60, icon: 'drop', desc: 'A lustrous pearl. Restores 25 MP — or sell it.', use: { mp: 25, target: 'ally' } },
  letter: { id: 'letter', name: "Bram's Letter", kind: 'key', price: 0, icon: 'star', desc: 'Sealed with the old Warden sigil. For Abbess Maren.' },
  tideShard: { id: 'tideShard', name: 'Tideshard', kind: 'key', price: 0, icon: 'star', desc: 'A sea-blue fragment of a fallen Warden\'s halo.' },
  badge: { id: 'badge', name: "Davy's Watch Badge", kind: 'key', price: 0, icon: 'ring', desc: 'A tarnished harbour-watch badge, still cold from the sea.' },
  mulebell: { id: 'mulebell', name: 'Mule Bell', kind: 'key', price: 0, icon: 'ring', desc: 'Turnip the mule comes running when it rings.' },
  starShard: { id: 'starShard', name: 'Star Shard', kind: 'key', price: 0, icon: 'star', desc: 'A warm sliver of your lost halo.' },
};
export const ITEMS = I;
