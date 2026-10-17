/**
 * Round 5 — the dark world pass (Settings → Adult ON only).
 *
 * The surface stays Dragon Quest: bright towns, kind shopkeepers, slimes that wobble. Underneath, the world is
 * Berserk/Souls-grim: gibbets at the crossroads, a village that was burned with its people inside, a cult that
 * recruits from the grieving, a drug distilled from a dying god.
 *
 *  - `dk_<script>` replaces <script> when Adult is on (ScriptRunner). The original stays reachable as `base_<script>`.
 *  - DARK_NPCS are merged into MAPS with `cond: 'adult&…'`, so with Adult OFF none of this exists.
 *  - Hidden reputation: `{ karma: n }` / `{ infamy: n }` (flags, never shown as numbers). Conditions `karma>=n`,
 *    `infamy>=n`. They change NPC reactions, the Gravedigger's epitaph and the chapter-end epilogue.
 *
 * Content limits: violence and cruelty are written, never lingered on; executions cut to black. Nothing sexual.
 * Children never appear in any of this content.
 */
import type { Cmd } from './story';
import type { NpcDef } from './maps';
import type { Look } from '../systems/state';
import { ITEMS, type Item } from './items';
import { ENEMIES, type EnemyDef } from './enemies';

// ------------------------------------------------------------------ looks (all adults)
const LK = (body: number, skin: number, hairStyle: number, hair: number, eyes: number, face: number, outfit: number, outfit2: number, x: Partial<Look> = {}): Look => ({ body, skin, hairStyle, hair, eyes, face, outfit, outfit2, ...x });
const LOOK = {
  ysolde: LK(0, 1, 4, 1, 2, 1, 5, 5, { fig: 1, bodyMarks: [{ type: 'wound', region: 'face', variant: 1 }] }),
  corvin: LK(1, 2, 0, 4, 4, 3, 5, 5, { bodyMarks: [{ type: 'scar', region: 'face', variant: 0 }] }),
  flag: LK(1, 1, 0, 1, 0, 3, 5, 5, { bodyMarks: [{ type: 'blood', region: 'foreL' }, { type: 'wound', region: 'foreR', variant: 0 }] }),
  tess: LK(0, 1, 3, 1, 1, 2, 8, 5, { fig: 1, bodyMarks: [{ type: 'dirt', region: 'face' }, { type: 'dirt', region: 'foreL' }, { type: 'dirt', region: 'foreR' }] }),
  caddoc: LK(1, 5, 5, 4, 6, 2, 6, 5, { bodyMarks: [{ type: 'dirt', region: 'face' }, { type: 'wound', region: 'foreL', variant: 0 }, { type: 'bandage', region: 'foreR', variant: 0 }] }),
  hollis: LK(1, 1, 0, 4, 0, 3, 1, 5, { bodyMarks: [{ type: 'scar', region: 'face', variant: 0 }] }),
  orla: LK(0, 2, 4, 0, 3, 2, 8, 5, { fig: 1, bodyMarks: [{ type: 'scar', region: 'foreL', variant: 1 }, { type: 'dirt', region: 'face' }] }),
  sallow: LK(0, 0, 2, 0, 4, 0, 5, 0, {}),
  wenlow: LK(0, 1, 1, 1, 1, 0, 5, 5, { bodyMarks: [{ type: 'wound', region: 'face', variant: 1 }, { type: 'blood', region: 'foreL' }] }),
  sexton: LK(1, 3, 0, 4, 3, 2, 8, 1, {}),
  watch: LK(1, 1, 0, 1, 0, 3, 1, 5),
};
const choir = { armor: 'robe', head: 'hood' };
const watch = { weapon: 'spear', head: 'knightHelm', armor: 'chain' };

// ------------------------------------------------------------------ items + foes
export const DARK_ITEMS: Record<string, Item> = {
  letters: { id: 'letters', name: 'Unsent Letters', kind: 'key', price: 0, icon: 'star', desc: 'Hundreds of letters, tied with ribbon and fishing twine. Every one addressed. None sent.' },
  ashNames: { id: 'ashNames', name: 'The Seven Names', kind: 'key', price: 0, icon: 'star', desc: 'A charcoal rubbing of seven names, scratched into a drowned pew with a nail. The last one is unfinished.' },
  penitentCord: { id: 'penitentCord', name: 'Untied Cord', kind: 'equip', slot: 'acc', tag: 'acc', price: 0, icon: 'ring', mods: { def: 4, mag: 4, hp: 10 }, vis: { type: 'amulet', c1: 0xc8b898 }, desc: 'A penitent\'s cord. One knot for every sin. Ysolde untied them all.' },
  ashRosary: { id: 'ashRosary', name: 'Ash Rosary', kind: 'equip', slot: 'acc', tag: 'acc', price: 0, icon: 'ring', mods: { mag: 10, mp: 12, def: -2 }, vis: { type: 'amulet', c1: 0x6a6670 }, desc: 'Beads of fired bone ash. It is warm the way a hearth is warm after the house has burned.' },
  greyShard: { id: 'greyShard', name: 'Grey Shard', kind: 'equip', slot: 'acc', tag: 'acc', price: 0, icon: 'star', mods: { mag: 12, mp: 20, hp: -10 }, vis: { type: 'amulet', c1: 0xa8b0c0 }, desc: 'All that is left of Caddoc\'s light. It still hums when someone nearby is in pain.' },
  mercyBlade: { id: 'mercyBlade', name: 'Mercy of Ashby', kind: 'equip', slot: 'weapon', tag: 'sword', price: 0, icon: 'sword', mods: { atk: 27, agi: 2 }, vis: { type: 'sword', c1: 0xd8d0c8, c2: 0x5a1a20 }, desc: 'Ser Hollis\'s blade. The hilt has three hundred notches. He cut one for every name.' },
};
export const DARK_ENEMIES: Record<string, EnemyDef> = {
  zealot: { id: 'zealot', name: 'Ashen Zealot', sprite: 'm_acolyte', scale: 0.8, hp: 70, mp: 10, atk: 34, def: 14, agi: 9, mag: 10, xp: 34, gold: 20, weak: ['light'], resist: ['dark'],
    actions: [{ w: 6, type: 'attack' }, { w: 3, type: 'skill', name: 'Scourge', power: 1.4, msg: 'lashes out with a knotted scourge!' }] } as EnemyDef,
  serHollis: { id: 'serHollis', name: 'Ser Hollis', sprite: 'm_squire', boss: true, scale: 1.25, hp: 320, mp: 0, atk: 44, def: 20, agi: 11, mag: 4, xp: 220, gold: 0, weak: [],
    actions: [{ w: 6, type: 'attack' }, { w: 3, type: 'skill', name: 'Ashby Cut', power: 1.6, msg: 'swings with the weight of three hundred names!' }, { w: 1, type: 'skill', name: 'Falter', msg: 'lowers his guard for a moment. He wants you to see it.' }] } as EnemyDef,
};

// ------------------------------------------------------------------ world props + NPCs
const prop = (id: string, name: string, x: number, y: number, tex: string, script: string, cond = ''): NpcDef =>
  ({ id, name, x, y, dir: 0, sprite: 'npc_dk_' + tex, noGlow: true, script, cond: 'adult' + (cond ? '&' + cond : '') });
const who = (id: string, name: string, x: number, y: number, dir: number, look: Look, script: string, cond = '', equip: Record<string, string> = {}): NpcDef =>
  ({ id, name, x, y, dir, look, equip, script, cond: 'adult' + (cond ? '&' + cond : '') });

export const DARK_NPCS: Record<string, NpcDef[]> = {
  road: [
    prop('dkGibbet', 'Crossroads Gibbet', 20, 11, 'gibbet', 'x_gibbetRoad'),
    prop('dkHanged', 'Hanged Man', 26, 11, 'hanged', 'x_hangedRoad'),
    prop('dkPike', 'Pike', 19, 13, 'pike', 'x_pike'),
    prop('dkAltar', 'Ash Altar', 3, 23, 'altar', 'x_altar'),
    // Penance Road: the procession
    prop('dkCoffin', 'Chained Coffin', 36, 15, 'coffin', 'x_coffin', '!penanceGone'),
    who('ysolde', 'Sister Ysolde', 35, 13, 0, LOOK.ysolde, 'x_ysolde', '', { armor: 'robe' }),
    who('corvin', 'Brother Corvin', 37, 14, 1, LOOK.corvin, 'x_corvin', '!penanceGone&!corvinDead', { armor: 'robe', head: 'hood', weapon: 'stick' }),
    who('flag1', 'Flagellant', 36, 13, 0, LOOK.flag, 'x_flagellant', '!penanceGone', choir),
    who('flag2', 'Flagellant', 37, 16, 1, LOOK.flag, 'x_flagellant', '!penanceGone', choir),
  ],
  fields: [
    // Ashby, the hamlet Ser Hollis sealed and burned
    prop('dkRuin1', 'Burned House', 20, 2, 'ruin', 'x_ruin'),
    prop('dkRuin2', 'Burned Chapel', 23, 3, 'ruin', 'x_ruinChapel'),
    prop('dkStake', 'Charred Stake', 22, 4, 'stake', 'x_stake'),
    prop('dkCorpse1', 'Remains', 19, 4, 'bones', 'x_ashbyBones'),
    prop('dkHollisH', 'Ser Hollis', 24, 5, 'hanged', 'x_hollisHanged', 'hollisHanged'),
    who('orla', 'Widow Orla', 21, 5, 0, LOOK.orla, 'x_orla'),
  ],
  hollow: [
    prop('dkBonesH', 'Remains', 6, 6, 'bones', 'x_hollowBones'),
    prop('dkCorpseH', 'Dead Miner', 24, 15, 'corpse', 'x_hollowCorpse'),
    prop('dkTrailH', 'Drag Marks', 16, 26, 'trail', 'x_hollowTrail'),
  ],
  grotto2: [prop('dkTithe', 'Drowned Pews', 6, 13, 'bones', 'x_titheBones')],
  saltmere: [
    prop('dkGibbetS', 'Harbour Gibbet', 38, 17, 'gibbet', 'x_gibbetHarbour'),
    prop('dkHallamH', 'Mayor Hallam', 36, 16, 'hanged', 'x_hallamHanged', 'titheExposed'),
    prop('dkWenlowH', 'Acolyte Wenlow', 38, 16, 'hanged', 'x_wenlowHanged', 'wenlowHanged'),
    who('wenlow', 'Acolyte Wenlow', 37, 18, 1, LOOK.wenlow, 'x_wenlow', 'grottoDone&!wenlowDone', { armor: 'robe' }),
    who('watchW', 'Harbour Watch', 36, 18, 2, LOOK.watch, 'x_watchW', 'grottoDone&!wenlowDone', watch),
    who('tess', 'Greyskin Tess', 31, 22, 3, LOOK.tess, 'x_tess', '', { armor: 'tunic' }),
    who('caddoc', 'Caddoc', 36, 24, 1, LOOK.caddoc, 'x_caddoc', '!caddocDead', { armor: 'robe' }),
    prop('dkCaddocC', 'Caddoc', 36, 24, 'corpse', 'x_caddocBody', 'caddocDead'),
    who('sallow', 'Factor Sallow', 8, 9, 0, LOOK.sallow, 'x_sallow', '', { armor: 'silkRobe', acc: 'pearlRing' }),
    who('sexton', 'Sexton Cobb', 27, 6, 0, LOOK.sexton, 'x_sexton', '', { weapon: 'stick' }),
  ],
  gull: [who('hollis', 'Ser Hollis', 10, 6, 1, LOOK.hollis, 'x_hollis', '!hollisGone', { armor: 'scale', acc: 'cape' })],
  chapel: [who('wenlowC', 'Brother Wenlow', 11, 9, 1, LOOK.wenlow, 'x_wenlowChapel', 'wenlowSpared', { armor: 'robe' })],
};

// ------------------------------------------------------------------ quests
export const DARK_QUESTS: Record<string, { name: string; desc: string; done?: string }> = {
  penance: { name: 'Penance Road', desc: 'Sister Ysolde has carried a chained coffin forty miles and thinks it is too light for a body. Find out what the procession carries.', done: 'You opened the coffin of the Penance Road. What you did with what was inside is between you and the road.' },
  tithe: { name: 'The Ash Tithe', desc: 'Granny Pearl\'s grandson left on the Choir\'s boat in spring, with six others nobody would miss. Search the drowned chapel beneath the Weeping Grotto.', done: 'The seven names have been spoken. Saltmere will not forget who spoke them, or how.' },
  starmilk: { name: 'Starmilk', desc: 'Something that glows is being sold on the Saltmere docks. Greyskin Tess says it comes from the tide-rocks to the south-east.', done: 'The source of the starmilk has been dealt with. The docks are quieter. Not better. Quieter.' },
  mercy: { name: 'The Mercy Knight', desc: 'Ser Hollis drinks at the Gull & Anchor. Widow Orla waits in the ashes of Ashby, north in Whisperwind Vale. Both want something from you.', done: 'Ashby has its answer. It is not the kind that lets anyone sleep.' },
};

// ------------------------------------------------------------------ scripts
const N = (narr: string): Cmd => ({ narr });
const S = (say: string, t: string): Cmd => ({ say, t });

export const DARK_SCRIPTS: Record<string, Cmd[]> = {
  // ================================================================ grimmer lore (overrides)
  dk_roadIntro: [
    { caption: 'Emberwood Road', sub: 'Autumn never quite leaves this forest. Neither do the dead.' },
    N('Leaves of red and gold drift across the path. A crow hops along the ditch with something pale in its beak.'),
    N('Somewhere in the trees, something howls. Low, hungry, and much too close. Further on, a rope creaks in a wind you cannot feel.'),
  ],
  dk_saltIntro: [
    { caption: 'Saltmere', sub: 'A harbour at the edge of the world.' },
    N('Salt wind, gull-cries, the creak of moored boats. On the eastern cliff, the great lighthouse stands cold and dark.'),
    N('Three boats have gone onto the rocks since the lamp died. The town has buried what the sea gave back, and stopped counting what it kept.'),
    N('In the square, grey-robed figures sing a slow, sad hymn. Nobody tells them to stop. Nobody dares.'),
  ],
  dk_pilgrim: [S('Ashen Pilgrim', 'Hmmm-mmm… ash to ash… I buried my wife with my own hands and the stars watched… hmmm-mmm…')],
  dk_pilgrimRoad: [
    S('Ashen Pilgrim', 'Going to Saltmere? So are we. The Choir sings there now.'),
    S('Ashen Pilgrim', 'You passed the gibbet at the crossroads. The baron hangs thieves there. The Choir would never. The Choir only asks you to stop hoping.'),
    { choice: ['What is the Choir?', 'Ash is just dirt.'], then: [
      [S('Ashen Pilgrim', 'The Ashen Choir sings the stars to sleep, so they never fall on us again. My village burned when one fell. I would like to sleep too.')],
      [S('Ashen Pilgrim', 'So were my children, in the end. Go on, then. The sea is waiting for you.')]] },
  ],
  dk_fisher: [S('Old Haddock', 'Fish ain\'t biting since the star fell. River\'s warm. Last week it brought down a drowned man from the Vale, burned black from the waist up. River\'s carrying more than fish now.')],
  dk_rancher: [S('Rancher Fen', 'Thornhares broke my fence. Ashwolves took my best cow and left her head on the stile like a joke. Wolves don\'t joke. Somebody\'s feeding them.')],
  dk_bard: [
    S('Lute the Bard', '♪ When the Heartstar breaks and the Wardens fall, the ember sleeps beneath it all… ♪'),
    S('Lute the Bard', 'There\'s a second verse nobody sings. About Ashby, up in the Vale. About the doors that were nailed shut. I won\'t sing it here. Not in front of the little ones.'),
  ],
  dk_caveWarn: [N('Hot air breathes out of the cave mouth. The rock is warm and greasy with soot. Deep inside, something pulses like a heartbeat, and something else, closer, smells of old meat.')],
  dk_hollowIntro: [
    { caption: 'Cinderdeep Hollow' },
    N('Old mine tracks vanish into the dark. The miners left in a hurry: lamps still hooked to the walls, a boot with the foot still in it.'),
    N('Somewhere far below, a faint warmth calls to you. It feels like your own light. It feels like it has been eating.'),
  ],
  dk_grottoIntro: [
    { caption: 'The Weeping Grotto' },
    N('Water drips from coral-crusted stone. With every breath of the sea the cave weeps a low note, and the note has words in it if you listen too long.'),
    N('A shoe floats in a rock pool. A rope, cut. Claw-marks on the wall at the height of a kneeling man.'),
    N('And beneath it all, faint as a dream, a woman is singing.'),
  ],
  dk_sanctumIntro: [
    { caption: 'Sanctum of the Drowned Choir' },
    N('A chapel the sea swallowed long ago. The pews rot under green water. Something is chained beneath them, and it is not furniture.'),
    N('From the altar rises the Requiem: a hundred voices, singing a light to death.'),
    { tut: 'shrine2' },
  ],
  dk_snorer: [
    S('Snoring Fisherman', 'Zzz… more pearls… zzz…'),
    { if: '!robbedSnorer', then: [{ narr: 'His purse hangs half out of his coat, fat with a week\'s wages.' }, { choice: ['(Leave him be)', '(Lift the purse)'], then: [
      [{ narr: 'You tuck the purse back in. He mumbles a name that might be his wife\'s.' }, { karma: 1 }],
      [{ narr: 'Thirty-five gold. Tomorrow his children eat bread and salt again. You try not to think about that.' }, { gold: 35 }, { infamy: 1 }, { set: 'robbedSnorer' }]] }] },
  ],
  dk_sailor: [
    S('Sailor Quill', 'The Choir bought passage for seven, back in spring. Paid in silver. Only the Choir\'s men came back on the boat.'),
    S('Sailor Quill', 'I asked the Mayor about it. He gave me a bottle and a look. I drank the bottle. I\'m still thinking about the look.'),
  ],

  // ================================================================ reputation reactions (overrides)
  dk_guard: [
    { if: 'infamy>=8', then: [S('Guard Rowan', 'Word travels up the road, {hero}. Gibbets, purses, worse. Elder Bram won\'t hear a word against you. I will. Keep walking.'), { stop: true }] },
    { if: 'karma>=6', then: [S('Guard Rowan', 'They\'re telling stories about you in Saltmere. Good ones. Hollowmere\'s proud. Don\'t let it go to your head.'), { stop: true }] },
    { call: 'base_guard' },
  ],
  dk_lightGuard: [
    { if: 'titheExposed', then: [S('Harbour Watch', 'Mayor\'s still up on the harbour gibbet. Nobody\'ll sign the order to cut him down. Nobody\'ll sign anything any more.'), { stop: true }] },
    { if: 'infamy>=8', then: [S('Harbour Watch', 'I\'ve orders to let you pass, Warden. Nobody gave me orders to like it.'), { stop: true }] },
    { call: 'base_lightGuard' },
  ],
  dk_tideWeapons: [
    { if: '#extort>=2', then: [S('Brannoc', 'You lean on Marrow again and I\'ll fit you for a coffin, Warden or no. Now. You buying?')] },
    { call: 'base_tideWeapons' },
  ],
  dk_tideItems: [
    S('Old Marrow', 'Herbs, dews, feathers. And a little something for the nerves, under the counter, for regulars.'),
    { choice: ['Shop', 'Nice shop. Shame if the Choir came back.'], then: [
      [{ shop: 'tideItems' }],
      [S('Old Marrow', '…How much.'), N('He counts out eighty gold with hands that will not stop shaking.'), { gold: 80 }, { infamy: 2 }, { count: 'extort' },
        S('Old Marrow', 'That\'s my daughter\'s dowry. Hope it buys you something nice.')]] },
  ],
  dk_delphine: [
    { if: 'infamy>=10', then: [S('Delphine', 'I sell to sailors, smugglers and once, God help me, to the Cantor. I don\'t sell to you. Out.'), { stop: true }] },
    { if: 'milkHooked', then: [S('Delphine', 'Your eyes have that grey shine. Starmilk. I\'ve buried three girls from this bar who had that shine. Go see the Abbess.')] },
    { call: 'base_delphine' },
  ],
  dk_innSalt: [
    { if: 'metIone&!ioneTaken', then: [{ call: 'base_innSalt' }, { stop: true }] }, // story night: never interrupt it
    { if: '#drinks>=1&!sober', then: [S('Marla', 'Back for more? Your liver\'s your own business, love.')] },
    { choice: ['A room for the night', 'A drink (10 G)', 'Nothing'], then: [
      [{ call: 'base_innSalt' }],
      [{ call: 'x_drink' }],
      []] },
  ],
  dk_maren: [
    { if: 'milkHooked', then: [
      S('Abbess Maren', 'Sit. No — sit. Show me your hands. Grey under the nails. Starmilk.'),
      S('Abbess Maren', 'I can draw it out of you. It will feel like being skinned from the inside for an hour. You will hate me for every minute of it.'),
      { choice: ['Do it.', 'Not yet.'], then: [
        [{ fade: 'out', ms: 700 }, N('It is worse than she said. Somewhere in the middle of it you hear yourself begging for one more taste, and you hear her say no.'), { fade: 'in', ms: 900 },
          { hurt: 0.7 }, { set: 'milkHooked', v: false }, { set: 'milk', v: 0 }, { mark: { type: 'scar', region: 'foreL', variant: 0 } }, { karma: 1 },
          S('Abbess Maren', 'There. You\'re yours again. The scar on your arm is where you tried to claw it back out. Keep it. Look at it next time.')],
        [S('Abbess Maren', 'Then come back before it decides for you.')]] },
      { stop: true }] },
    { call: 'base_maren' },
  ],
  dk_preacher: [
    { if: 'grottoDone', then: [{ stop: true }] },
    { if: 'cultAsh', then: [S('Choir Preacher', 'Brother — sister — {hero}. The ash sits well on your brow. Stand with us. Sing.'), N('You know the words now. That is the worst part. You know all the words.'), { stop: true }] },
    { call: 'base_preacher' },
  ],
  dk_tobin: [
    { if: 'milkHooked', then: [S('Old Tobin', 'You\'ve the starmilk shakes, friend. I know them. I had them for eleven years. Herbs won\'t help. Only a long night and somebody who won\'t give you what you ask for.')] },
    { call: 'base_tobin' },
  ],
  dk_pell: [
    { if: 'robbedPell', then: [S('Pell the Peddler', 'Oh. You. Take what you like. Just… not Turnip. Please. He\'s all I\'ve got that loves me.'), { shop: 'peddler' }, { stop: true }] },
    { if: 'metPell&quest:mule=done', then: [
      { choice: ['Browse', 'Your purse, peddler.'], then: [
        [{ call: 'base_pell' }],
        [S('Pell the Peddler', 'Ha! Good one. You… you\'re not joking.'), N('He looks at your weapon, then at the empty road, then at Turnip.'),
          S('Pell the Peddler', 'One-fifty. It\'s all of it. I was going to buy a cart. Turnip\'s getting old.'), { gold: 150 }, { infamy: 3 }, { set: 'robbedPell' }]] },
      { stop: true }] },
    { call: 'base_pell' },
  ],
  dk_brenna: [
    { if: 'titheBrenna', then: [S('Fishwife Brenna', 'Every night he rows out with the seven lamps. Every night I count them from the beach. Seven. He hasn\'t missed one yet. When he does, I\'ll stop counting.'), { stop: true }] },
    { if: 'quest:tithe=active&has:ashNames&titheJudge', then: [{ call: 'x_titheBrenna' }, { stop: true }] },
    { call: 'base_brenna' },
  ],
  dk_oldsalt: [
    { if: 'titheExposed', then: [S('Old Salt Nab', 'Truth\'s out. Mayor\'s dead. Boats ain\'t going out, \'cause the Mayor held the loans and his widow\'s calling them in. Justice, they call it. Tastes like a dry net.'), { stop: true }] },
    { if: 'titheBuried', then: [S('Old Salt Nab', 'Mayor bought new nets for every boat. Generous man. Too generous. Like he\'s paying for something.')] },
    { call: 'base_oldsalt' },
  ],
  dk_nanPearl: [
    { if: 'relit&!quest:tithe=active&!quest:tithe=done', then: [
      S('Granny Pearl', 'You\'re the one who lit the lamp. Then you can see in the dark. I need someone who can see in the dark.'),
      S('Granny Pearl', 'My grandson Teague went on the Choir\'s boat in spring. "Paid work in Kragmoor," the Mayor said. Seven went. A widow\'s boy. Old Mab who drank. Drifters.'),
      S('Granny Pearl', 'Nobody we\'d miss — that\'s what Hallam said, to a grey man on the pier. I heard it. I\'m old, not deaf.'),
      S('Granny Pearl', 'The boat never sailed east. It sailed round the cliff, to the sea cave. Go down where the Choir sang. Find my boy, or what\'s left.'),
      { quest: 'tithe', state: 'active' }, { stop: true }] },
    { if: 'quest:tithe=done', then: [
      { if: 'titheBuried', then: [S('Granny Pearl', 'You found nothing down there. Nothing. That\'s what you said, so that\'s what I tell myself.')], else: [S('Granny Pearl', 'Teague has a name on a stone now. That\'s more than the sea gave him. Thank you.')] }, { stop: true }] },
    { if: 'quest:tithe=active', then: [S('Granny Pearl', 'The drowned chapel. Under the pews, I\'d wager. The Choir likes its sinners sitting down.'), { stop: true }] },
    { call: 'base_nanPearl' },
  ],
  dk_hallam: [
    { if: 'quest:tithe=active&has:ashNames&!titheJudge', then: [{ call: 'x_titheConfront' }, { stop: true }] },
    { if: 'titheBuried', then: [S('Mayor Hallam', 'New nets for every boat. A school, next spring. I\'ll do so much good, {hero}, you\'ll forget why I\'m doing it. I won\'t.'), { stop: true }] },
    { if: 'titheBrenna', then: [S('Mayor Hallam', '(He has not slept. His hands are raw from the oars.) Seven lamps tonight. Teague, Mab, Corran, Sefa, Old Lew, Ivo, and the one with no name. I say them all.'), { stop: true }] },
    { call: 'base_hallam' },
  ],

  // ================================================================ environmental storytelling
  x_gibbetRoad: [
    N('An iron cage hangs from the crossbeam. What is inside was a man once. The crows have been at the soft parts and the rain has done the rest.'),
    N('A board is nailed to the post: POACHER. By order of the Baron of the Vale. Someone has added underneath, in charcoal: he had four children.'),
  ],
  x_hangedRoad: [
    N('This one is fresher. His boots are good; nobody has taken them yet, which tells you how frightened the road has become.'),
    N('The placard on his chest reads DESERTER. His hands are soft. A clerk, maybe, who ran from a war that was not his.'),
  ],
  x_pike: [N('A skull on a pike, wearing a rag of Choir grey. Someone wanted the pilgrims to see it. The pilgrims walk past singing, and do not look up.')],
  x_altar: [
    N('A slab of field-stone ringed with ash. Black candles, burned to stubs. The stain across the top is old and brown and was not wine.'),
    N('Scratched into the stone: LET THE LAST STAR GO OUT. Below it, in a smaller, more careful hand, a list of names, every one crossed through.'),
    { if: 'cultAsh', then: [N('Your brow itches where the ash was drawn. You realise you are humming the Requiem.')] },
  ],
  x_ruin: [
    N('A house in Ashby. The beams stand like ribs. The door is still in its frame, because the nails held. Four long nails, driven from the outside.'),
    N('Scratches score the inside of the door, low down, where someone sat with their back to it at the end.'),
  ],
  x_ruinChapel: [
    N('The chapel of Ashby. They came here to pray when the grey cough reached the village, so this is where most of them were when the soldiers sealed the doors.'),
    N('The bell lies cracked in the ash. Nobody rang it. Ser Hollis ordered it silent so the next village would not come running to help.'),
  ],
  x_stake: [N('A post charred to coal, with rope still knotted at the base. The survivors burned the plague-doctor here, after. He had told Ser Hollis the cough would spread. He was right.')],
  x_ashbyBones: [N('Small bones and large ones, all mixed together in the ash, where a family lay down in one heap to keep each other warm or keep each other from seeing. Someone has laid wildflowers on them. The flowers are fresh.')],
  x_hollisHanged: [N('Ser Hollis hangs from the chapel beam, in his armour, with his medals still pinned on. The survivors wanted the kingdom to see what its hero looked like. Crows do not care about medals.')],
  x_hollowBones: [N('A miner\'s skeleton, still holding his pick. The ribs have been cracked open from the inside, as if something hatched there and left.')],
  x_hollowCorpse: [N('A miner, face down, not long dead. His lamp is still warm. Around him the rock is clawed in long, patient strokes. Whatever did this took its time, and took his hands.')],
  x_hollowTrail: [N('Drag-marks, dark and tacky, leading down into the deep tunnels. Whatever was dragged was still trying to hold on; there are fingernails in the grooves.')],
  x_gibbetHarbour: [
    N('The harbour gibbet. The town council voted it down twenty years ago and nobody ever took it away. The chains are new.'),
    { if: 'wenlowHanged', then: [N('Wenlow\'s cage turns slowly in the sea wind. The gulls have found him. The Watch has stopped looking up.')] },
  ],
  x_hallamHanged: [N('Mayor Hallam turns on the rope above the harbour he saved and sold. Someone has hung the seven names around his neck on a board. His widow comes every evening and stands there, not weeping. Just standing.')],
  x_wenlowHanged: [N('Acolyte Wenlow, twenty-two. He never saw Kragmoor. The rope did what the Requiem never managed: it made him quiet.')],
  x_caddocBody: [N('Caddoc lies where he sat for three years, grey as driftwood, cracked like old paint. There is no light left in him at all. The tide will take him tonight. Nobody on the docks will stop it.')],

  // ================================================================ QUEST: Penance Road
  x_flagellant: [
    { if: 'penanceDone', then: [S('Flagellant', '(He does not stop. He has not stopped since Hollowmere. The scourge rises and falls, and every stroke is a name.)'), { stop: true }] },
    S('Flagellant', 'One for my brother. One for the fever. One for the night I did not go to him. One for my brother. One for…'),
    N('His back is a ruin under the robe. He smiles at you as if you were the kindest thing he has seen in weeks.'),
  ],
  x_ysolde: [
    { if: 'penanceFreed', then: [S('Sister Ysolde', 'I\'m going home. It\'s three hundred miles the wrong way, and there\'s no one there. I\'m going anyway. Thank you for opening the box.'), { stop: true }] },
    { if: 'penanceBurned', then: [S('Sister Ysolde', 'Seventy days to Kragmoor. I will carry an empty box the whole way and call it holy. It\'s lighter now, at least.'), { stop: true }] },
    { if: 'cultAsh&penanceDone', then: [S('Sister Ysolde', 'Three hundred and one of us now. Walk with us when you\'re ready, sibling. The road is long and the ash is patient.'), { stop: true }] },
    { if: 'has:letters', then: [{ call: 'x_penanceEnd' }, { stop: true }] },
    { if: 'quest:penance=active', then: [S('Sister Ysolde', 'Please. Before we reach the pass. I need to know what I have been carrying.'), { stop: true }] },
    S('Sister Ysolde', 'Walk on the verge, traveller, the blood makes the road slick.'),
    S('Sister Ysolde', 'We walk to Kragmoor. Seventy days. The stars fell because of us, you see. Because of what we did and didn\'t do. Every step pays a little of it back.'),
    S('Sister Ysolde', 'Brother Corvin says the coffin holds the first sinner, the one who started it all. I have carried it forty miles. It is too light, traveller. It is far too light for a man.'),
    S('Sister Ysolde', 'I can\'t ask. Asking is doubt, and doubt is a sin. But you aren\'t one of us. Would you find out what we carry?'),
    { choice: ['I\'ll look.', 'Some things are better left closed.'], then: [
      [S('Sister Ysolde', 'Brother Corvin holds the key. He won\'t give it gladly.'), { set: 'penanceAsked' }, { quest: 'penance', state: 'active' }],
      [S('Sister Ysolde', 'That is what Brother Corvin says. Word for word.')]] },
  ],
  x_corvin: [
    { if: 'penanceDone', then: [S('Brother Corvin', 'Walk on, Warden. We have a long way to go and nothing left to carry but ourselves.'), { stop: true }] },
    { if: '!penanceAsked', then: [S('Brother Corvin', 'Bless you, traveller. Every one of us chose this road. Every wound is a prayer. Do not pity us; it is the only thing we cannot bear.'), { stop: true }] },
    { if: 'opened', then: [S('Brother Corvin', 'You have seen. Go and tell her, then. Tell them all. See how many turn back.'), { stop: true }] },
    S('Brother Corvin', 'Ysolde sent you. She has the look of someone who is about to stop believing. It is the most dangerous look in the world.'),
    { choice: ['Open the coffin.', '(Offer 100 gold)', 'The Cantor sent me.', 'Never mind.'], then: [
      [S('Brother Corvin', 'No eye but the Ash\'s. Step back from the bier.'), { choice: ['Step back.', 'Make me.'], then: [
        [],
        [S('Brother Corvin', 'Brothers. Sing.'), { battle: ['zealot', 'zealot'], music: 'boss2', noFlee: true },
          N('Brother Corvin does not get up. The flagellants step around his body without breaking the hymn, and kneel, and wait for you to do what you came for.'),
          { set: 'corvinDead' }, { infamy: 2 }, { call: 'x_coffinOpen' }]] }],
      [{ if: 'gold>=100', then: [S('Brother Corvin', 'Gold. Gold is only ash that hasn\'t burned yet.'), { gold: -100 }, N('He takes it anyway. He unlocks the chains with a key he wears on a thong around his neck, and turns his back so he does not have to watch.'), { call: 'x_coffinOpen' }],
        else: [S('Brother Corvin', 'You don\'t have it. Neither, it seems, do I. How freeing.')] }],
      [{ if: 'grottoDone', then: [S('Brother Corvin', 'The Cantor is ash in the sea. Everyone on this road heard. Lie better, or not at all.')],
        else: [S('Brother Corvin', '…Then he already knows what is inside. Look, if he wishes it.'), { infamy: 1 }, { call: 'x_coffinOpen' }] }],
      []] },
  ],
  x_coffin: [
    { if: 'opened', then: [N('The lid sits askew. Inside, nothing but the smell of old paper and candle-smoke.'), { stop: true }] },
    N('A coffin of black oak on a bier, wrapped three times in chain. Hymns are carved over every inch of the wood, by many different hands, some of them shaking.'),
    { if: 'penanceAsked', then: [N('The chains are locked. Brother Corvin watches you over his shoulder.')] },
  ],
  x_coffinOpen: [
    { sfx: 'chest' }, { set: 'opened' },
    N('The chains fall. The lid is lighter than it looks.'),
    N('Inside there is no body. There are letters. Hundreds of them, tied in bundles with hair-ribbon and fishing twine. Every one addressed. None ever sent.'),
    N('"Dear Mother — I am sorry I did not come for the burial." "To Hanne. I should have stopped the cart." "Tomas, I let the fever have you because I was afraid to touch you."'),
    N('Three hundred people, carrying every word they could not say, toward a mountain, to be forgiven by someone who has never read any of it.'),
    { give: 'letters' }, { narr: 'Took the Unsent Letters.' },
  ],
  x_penanceEnd: [
    S('Sister Ysolde', 'Letters? But… that\'s my hand. That one. "Tomas."'),
    N('She holds it without opening it. She already knows what it says. She wrote it the night of the burning fever, by his bed, and could not make herself go in.'),
    { choice: ['Give the letters back to them.', 'Burn them. Spare everyone.', 'Take the ash mark. Walk with them.'], then: [
      [N('You set the bundles on the road. One by one, the flagellants stop. Some read. Some only hold their own letter and sit down in the mud.'),
        S('Sister Ysolde', 'There\'s nothing in the box but us. There was never anything in it but us.'),
        S('Sister Ysolde', 'Here — my cord. One knot for every sin. I won\'t need it on the way home.'),
        { take: 'letters' }, { give: 'penitentCord' }, { narr: 'Received the Untied Cord!' }, { karma: 3 }, { set: 'penanceFreed' }],
      [N('The letters catch at once. Three hundred apologies go up in a column of grey smoke, and the wind carries the ash toward Kragmoor, the way the pilgrims wanted.'),
        S('Brother Corvin', 'Wise. Grief is easier to carry when you can\'t read it. Take this, for sparing them the doubt.'),
        { take: 'letters' }, { gold: 150 }, { narr: 'Received 150 gold.' }, { infamy: 1 }, { set: 'penanceBurned' }],
      [N('You kneel in the road. Brother Corvin dips his thumb in the ash of a cold censer and draws it across your brow. It is warm. It is the warmest thing you have felt since the Spire.'),
        S('Brother Corvin', 'Then we are three hundred and one. The Choir will know your face now, Warden. The doors of the Cathedral will open for you.'),
        { take: 'letters' }, { give: 'ashRosary' }, { narr: 'Received the Ash Rosary!' }, { mark: { type: 'dirt', region: 'face' } },
        { infamy: 2 }, { set: 'cultAsh' }]] },
    { set: 'penanceDone' }, { quest: 'penance', state: 'done' },
  ],

  // ================================================================ QUEST: The Ash Tithe
  x_titheBones: [
    { if: '!quest:tithe=active', then: [N('Under the rotten pews, chains run down into the green water and stay taut. Something at the other end is heavy, and patient. You leave it alone.'), { stop: true }] },
    { if: 'has:ashNames', then: [N('Seven sets of bones, chained to ballast stones under the pews. They were alive when the water came up. The chains are short.'), { stop: true }] },
    N('You haul on the chains. Seven sets of bones come up out of the water, still shackled to ballast stones. They were made to kneel, facing the altar, for the Requiem.'),
    N('On the back of the front pew, someone scratched names with a nail, in the dark, by touch. Teague. Old Mab. Corran. Sefa. Lew. Ivo.'),
    N('The seventh name stops after one letter. The nail is still lying in the bones of the hand that held it.'),
    { give: 'ashNames' }, { narr: 'Made a rubbing: The Seven Names.' },
  ],
  x_titheConfront: [
    S('Mayor Hallam', 'What is that? …Where did you…'),
    N('You lay the rubbing on his desk. He reads the names. He knows them all; he read them out himself once, from a list, on the pier.'),
    S('Mayor Hallam', 'Seven. Before her. They swore the Choir would take only the ones who wanted to go. I wanted to believe it, so I did.'),
    S('Mayor Hallam', 'They said the sea would take the whole town. I chose seven over two hundred. I would choose it again. That is the worst of it. I would choose it again.'),
    S('Mayor Hallam', 'What happens now is yours to decide, Warden. I won\'t run. I haven\'t the courage for that either.'),
    { choice: ['Tell the town. All of it.', 'Bury it. Saltmere needs you.', 'Brenna lost Davy to this. Let her judge.'], then: [
      [{ fade: 'out', ms: 800 },
        N('You read the names in the square at noon. By evening the whole town is at the manor gate. Brenna is at the front. She does not shout. That is how you know.'),
        N('The Harbour Watch try to hold the gate for an hour, and then they stop trying. You could step between them and the rope. You don\'t.'),
        { sfx: 'die' }, N('In the morning, the gulls are already at work on the harbour gibbet.'),
        { fade: 'in', ms: 1000 }, { set: 'titheExposed' }, { karma: 1 }, { infamy: 2 }],
      [S('Mayor Hallam', 'You… thank you. I\'ll do so much good. I swear it. Take this. I know what it is. Take it anyway.'),
        { gold: 600 }, { narr: 'Received 600 gold. The names stay in your pack. They weigh more than the gold.' }, { set: 'titheBuried' }, { infamy: 3 }],
      [S('Mayor Hallam', 'Brenna. Yes. That\'s… right. That\'s fair. Tell her I\'ll be on the pier.'), { set: 'titheJudge' }, N('Brenna is on the beach, mending nets. She is always mending nets.'), { stop: true }]] },
    { take: 'ashNames' }, { quest: 'tithe', state: 'done' },
  ],
  x_titheBrenna: [
    N('Brenna reads the names. Then she reads them again, moving her lips. Davy went into that cave after a light. These seven went in because someone sold them.'),
    S('Fishwife Brenna', 'Hanging him would be quick. Quick is a kindness. He doesn\'t get a kindness.'),
    S('Fishwife Brenna', 'There are seven rocks off the point where the boats went down. He\'ll row out every night and light a lamp on each one, and say a name at each one, until he drowns or I\'m dead.'),
    S('Fishwife Brenna', 'And the town keeps its Mayor, because the town needs one. That\'s the sentence. Tell him.'),
    { take: 'ashNames' }, { give: 'pearl', n: 3 }, { give: 'hiHerb', n: 2 }, { narr: 'Brenna presses three pearls into your hand. "Davy\'s. For the lamps. Or for you. I don\'t care which."' },
    { set: 'titheBrenna' }, { karma: 3 }, { quest: 'tithe', state: 'done' },
  ],

  // ================================================================ QUEST: Starmilk (and the drug-use action)
  x_tess: [
    { if: 'caddocDead', then: [S('Greyskin Tess', 'He\'s dead. The only thing that made it stop, and you killed it. Forty of us on the docks, shaking. Some of us won\'t make the winter.'), S('Greyskin Tess', '…Some of us will. I\'ve kept water down two days. Don\'t look at me like that. I\'m not thanking you.'), { stop: true }] },
    { if: 'milkDealer', then: [S('Greyskin Tess', 'It\'s you selling it now. Course it is. Gimme. I\'ve got four gold. I\'ve got… I can get more.'), { stop: true }] },
    S('Greyskin Tess', 'You got any milk? The glowing kind. Just a sip. My hands — look at my hands.'),
    N('Her skin is grey and cracked like an old glaze. Through the cracks something faintly blue still glows, going out.'),
    S('Greyskin Tess', 'When you drink it you feel what they feel. The stars. The Wardens. Falling forever and never landing. It\'s the only time I\'m not alone.'),
    S('Greyskin Tess', 'Caddoc sells it, on the tide-rocks past the nets. Don\'t hurt him. Please. He\'s all we\'ve got.'),
    { if: '!quest:starmilk=active&!quest:starmilk=done', then: [{ quest: 'starmilk', state: 'active' }] },
  ],
  x_caddoc: [
    { if: 'milkDealer', then: [S('Caddoc', 'Thinner every week, partner. Look — you can see the rocks through my hand. Sell this batch quickly. I don\'t know how many more I have.'), { call: 'x_dose' }, { stop: true }] },
    { if: '!metCaddoc', then: [
      N('A man sits on the tide-rocks with a row of corked jars at his feet. Each jar glows a faint, failing blue. So does he, through the cracks in his skin.'),
      S('Caddoc', 'Another Warden. I can smell your light from here, sweet and loud. I was like you once. Warden of the Lanterns. I fell into a fish-market and broke both legs.'),
      S('Caddoc', 'Nobody came. So I sold my light, a spoonful at a time. They drink me, and for a moment they feel what I felt. And I eat.'),
      { set: 'metCaddoc' }] },
    { choice: ['Buy a dose (50 G)', 'Give me the shard.', 'Let\'s make this a business.', 'Leave'], then: [
      [{ call: 'x_dose' }],
      [S('Caddoc', 'The shard. Of course. It\'s what\'s left of me, you know. Take it and the town gets clean, in a month, the ones who live.'),
        S('Caddoc', 'Take it and I\'m a man again. A dead one, but a man.'),
        { choice: ['Take it.', 'No. Not like this.'], then: [
          [N('He opens his shirt himself. The shard sits in his chest like a coal in a grate. When you close your hand on it, he sighs — relief, not pain.'),
            N('The blue goes out of him from the edges in. In the end he is just a grey man on a grey rock, smiling at the tide.'),
            { give: 'greyShard' }, { narr: 'Received the Grey Shard.' }, { set: 'caddocDead' }, { karma: 1 }, { infamy: 1 }, { quest: 'starmilk', state: 'done' }],
          [S('Caddoc', 'Kind. Kindness is just slower.')]] }],
      [S('Caddoc', 'A partner! You have legs that work and a face people trust. Sell it in the taverns up the coast. Half for you.'),
        N('You carry the crate. You smile at the right people. By the end of the week there are grey hands reaching for you on every pier from Saltmere to the Road.'),
        { gold: 400 }, { narr: 'Received 400 gold.' }, { infamy: 4 }, { set: 'milkDealer' }, { quest: 'starmilk', state: 'done' }],
      []] },
  ],
  x_dose: [
    { if: 'gold>=50', then: [
      { choice: ['Drink it.', 'Not today.'], then: [
        [{ gold: -50 }, { sfx: 'star' }, { flash: 0x9ad0ff },
          N('It tastes like cold metal and the air before a storm. For one heartbeat you can feel every Warden in the world: alone, falling, still falling, falling forever—'),
          N('—and then you are on your knees on the wet rock, laughing or crying, and every wound you have is gone.'),
          { heal: true }, { count: 'milk' },
          { if: '#milk>=3&!milkHooked', then: [N('When it fades, your hands are grey under the nails. They stay grey. Something in you is already counting the hours to the next one.'),
            { set: 'milkHooked' }, { mark: { type: 'dirt', region: 'foreR' } }, { infamy: 1 }] }],
        []] }],
      else: [S('Caddoc', 'Fifty. I don\'t give credit. Credit is how you end up on a rock selling yourself by the spoon.')] },
  ],

  // ================================================================ QUEST: The Mercy Knight (and the execute/spare action)
  x_hollis: [
    { if: 'hollisSpared', then: [S('Ser Hollis', 'You should have killed me. Every night I come here and drink to the man who wouldn\'t. Cheers, Warden. Cruellest thing anyone ever did to me.'), { stop: true }] },
    { if: '!metHollis', then: [
      N('A big man in polished scale, medals across his chest like fish-scales, drinking alone. Nobody sits within two tables of him.'),
      S('Ser Hollis', 'You\'re staring at the medals. Everyone does. This one is for Ashby. You\'ve walked past Ashby, I expect, up in the Vale. What\'s left of it.'),
      S('Ser Hollis', 'The grey cough. Twelve dead in three days, and the next village was Hollowmere. I had forty men and one order. Nobody leaves.'),
      S('Ser Hollis', 'They ran for the chapel. I had the doors nailed. When they tried the windows I had the thatch lit. It worked. The cough never left Ashby. Neither did three hundred people.'),
      S('Ser Hollis', 'The King gave me this. The survivors want me hanged. The kingdom wants me sober and smiling on parade days. I want you to fight me, on the cliff, and call it an accident.'),
      { set: 'metHollis' }, { if: '!quest:mercy=active', then: [{ quest: 'mercy', state: 'active' }] }, { stop: true }] },
    { if: '!metOrla', then: [S('Ser Hollis', 'Go and see the widow first. Orla. She\'s earned the right to tell you what I am. Then come back and decide.'), { stop: true }] },
    S('Ser Hollis', 'Well, Warden? You\'ve heard us both.'),
    { choice: ['Draw your sword.', 'You\'ll answer to Ashby.', 'Live with it.', 'Not yet.'], then: [
      [S('Ser Hollis', 'Thank you. Truly. Not in here — Marla just mopped.'), { fade: 'out', ms: 600 }, N('The cliff path above the harbour. The wind is enormous. He salutes you, like a knight in a story.'), { fade: 'in', ms: 600 },
        { battle: ['serHollis'], boss: true, music: 'boss2', noFlee: true },
        N('On the last pass he lowers his blade. He wanted you to see that. He wanted somebody to know he chose it.'),
        S('Ser Hollis', 'Tell them I fell. Drunk. They\'ll believe it; it\'s what they expect of me. Take the sword. It\'s cut enough names.'),
        { give: 'mercyBlade' }, { narr: 'Received the Mercy of Ashby.' }, { set: 'hollisDuel' }, { set: 'hollisGone' }, { karma: 1 }, { infamy: 1 }, { quest: 'mercy', state: 'done' }],
      [S('Ser Hollis', '…Yes. Yes, that\'s the honest one, isn\'t it. I\'ll walk. I won\'t make you drag me.'),
        { fade: 'out', ms: 900 },
        N('He walks the whole way to the Vale without speaking. At the edge of the ashes, the survivors are waiting. Somebody has already thrown a rope over the chapel beam.'),
        N('Orla reads out the charges. All three hundred names. It takes until dark. He listens to every one.'),
        { sfx: 'die' }, N('Then it is done, and nobody cheers.'),
        { fade: 'in', ms: 1000 },
        { set: 'hollisHanged' }, { set: 'hollisGone' }, { karma: 1 }, { infamy: 1 }, { quest: 'mercy', state: 'done' }],
      [S('Ser Hollis', 'No. No, you can\'t — that\'s the one thing — '), N('He sits back down. He pours. His hand is steady. It is always steady. That was the problem.'),
        { set: 'hollisSpared' }, { karma: 1 }, { quest: 'mercy', state: 'done' }],
      []] },
  ],
  x_orla: [
    { if: 'hollisHanged', then: [S('Widow Orla', 'It didn\'t bring anyone back. I knew it wouldn\'t. But they\'ll write it down now, in some book in the capital: Ashby happened. Here. Take what we collected. It was for the rope. We didn\'t need to buy one.'),
      { if: '!orlaPaid', then: [{ gold: 300 }, { narr: 'Received 300 gold.' }, { set: 'orlaPaid' }] }, { stop: true }] },
    { if: 'hollisDuel', then: [S('Widow Orla', 'Fell off the cliff, drunk. That\'s what they\'re saying. A hero\'s death, almost. He got exactly what he wanted. Did you?'), { stop: true }] },
    { if: 'hollisSpared', then: [S('Widow Orla', 'You let him live. Good. Let him live a long time. Let him live till he\'s the last man who remembers.'), { stop: true }] },
    S('Widow Orla', 'Ashby. That\'s my house. That\'s the chapel. Those are the Weavers, all six of them, the little ones in the middle.'),
    S('Widow Orla', 'I was in Hollowmere selling eggs. I came back up the road and the sky was black. The soldiers wouldn\'t let me past. I heard it. All of it. For an hour.'),
    S('Widow Orla', 'My husband\'s handprints are still burned into the chapel door. I touch them, sometimes. They\'re smaller than I remember.'),
    { if: 'metHollis', then: [S('Widow Orla', 'Hollis. You\'ve met him. Bring him here. I don\'t want him dead in a ditch. I want him to stand in this ash and hear every name. And then I want him to hang from that beam.')],
      else: [S('Widow Orla', 'The knight who did it drinks in Saltmere. They gave him a medal. Go and look at him. Then come back and tell me what a hero looks like.')] },
    { set: 'metOrla' }, { if: '!quest:mercy=active&!quest:mercy=done', then: [{ quest: 'mercy', state: 'active' }] },
  ],
  x_watchW: [S('Harbour Watch', 'Last of the Cantor\'s singers. We fished him out of the grotto half-drowned. Mayor says it\'s the Warden\'s call. Warden\'s call, he says, and goes home to his supper.')],
  x_wenlow: [
    S('Acolyte Wenlow', 'You\'re the one. You killed the Cantor. Good. He used to make us sing till our throats bled. If you stopped, the others had to hold you under.'),
    S('Acolyte Wenlow', 'I joined because they fed us. My mother died in the plague-year and the Choir had soup. I\'m twenty-two. I\'ve never seen Kragmoor. I never sang to anyone who didn\'t deserve it.'),
    N('He is lying, a little. You heard the Requiem. Everyone who sang it knew what it was for.'),
    { choice: ['Hang him.', 'Brand him and drive him out.', 'Let him go.'], then: [
      [S('Acolyte Wenlow', 'Oh. Oh — wait — I can tell you about Kragmoor — I can —'), { fade: 'out', ms: 700 }, N('The Watch are quick about it. They have done this before, in the years before the lighthouse made them soft.'), { sfx: 'die' }, { fade: 'in', ms: 900 },
        { set: 'wenlowHanged' }, { infamy: 3 }],
      [N('The Watch heat a nail in a lantern and burn the Choir\'s mark off his wrist, and a new one on: an X, for exile. He does not scream. They trained that out of him.'),
        S('Acolyte Wenlow', '…Thank you. I think. Which way is away?'), { set: 'wenlowExiled' }, { karma: 1 }, { infamy: 1 }],
      [S('Harbour Watch', 'Your call, Warden. Don\'t come crying when he\'s back with a knife.'), S('Acolyte Wenlow', 'I — I won\'t forget. I\'ll go to the Abbess. I\'ll scrub floors. I\'ll be useful. I swear it.'),
        { set: 'wenlowSpared' }, { karma: 2 }]] },
    { set: 'wenlowDone' },
  ],
  x_wenlowChapel: [S('Brother Wenlow', 'The Abbess lets me scrub the floors and sing the old hymns, the ones about the stars coming home. My throat still bleeds sometimes. It\'s a different kind of bleeding.')],

  // ================================================================ dark actions: drinking, selling a companion
  x_drink: [
    { if: '!gold>=10', then: [S('Marla', 'No coin, no cup.'), { stop: true }] },
    { gold: -10 }, { count: 'drinks' }, { set: 'sober', v: false },
    { if: '#drinks>=3', then: [
      N('Marla pours. You drink. Marla pours. Somebody starts a song about a drowned bride and you know every word, which is strange, because—'),
      { fade: 'out', ms: 1200 }, { wait: 400 },
      { if: 'blackout1', then: [
        N('You wake in the gutter behind the Gull with a split lip and a lighter purse. Somebody has written COWARD on your boots in tar. You don\'t remember earning it. You don\'t remember not earning it.'),
        { gold: -40 }, { hurt: 0.4 }, { infamy: 1 }],
      else: [
        N('You wake on a coil of rope on the pier, with the sun in your eyes and a sore forearm. Someone has tattooed a gull on it. It is not a good gull. It is not even a gull, really.'),
        { mark: { type: 'tattoo', region: 'armL', variant: 2 } }, { set: 'blackout1' }] },
      { set: 'drinks', v: 0 }, { set: 'sober' },
      { fade: 'in', ms: 1200 }, { stop: true }] },
    N('Rotgut rum, thick as tar. It burns all the way down and sits in your belly like a small, warm animal.'),
    S('Marla', 'There. Now you look like everyone else in here.'),
  ],
  x_sallow: [
    { if: 'soldMate', then: [S('Factor Sallow', 'Your friend? Breaking stone in the Cathedral quarries, last I heard. Strong back. You chose well. Come again if you tire of anyone else.'), { stop: true }] },
    S('Factor Sallow', 'Factor Sallow, purveyor of labour to the Ashen Cathedral. The quarries in Kragmoor always need strong backs. I pay in silver. I ask no questions. I never answer any.'),
    { if: 'mate', then: [
      N('His eyes slide past you to {mate}, and stay there, the way a horse-dealer looks at teeth.'),
      { choice: ['Sell {mate}. (400 G)', 'Get away from us.'], then: [
        [S('Factor Sallow', 'Splendid. My men will be discreet.'),
          N('{mate} looks at you once, not understanding, then understanding. Then two men in grey are leading them to a covered cart, and the cart is gone up the Kragmoor road before you have finished counting the silver.'),
          { sellMate: true }, { gold: 400 }, { narr: 'Received 400 gold.' }, { infamy: 6 }],
        [S('Factor Sallow', 'As you like. Everyone sells something, Warden. I\'ll wait.')]] }],
      else: [S('Factor Sallow', 'You travel light. A pity. Come back when you have company you could do without.')] },
  ],

  // ================================================================ the reckoning (endings / epitaph)
  x_sexton: [
    S('Sexton Cobb', 'I dig the graves in the chapel yard. Good trade, these days. I like to know what to carve, before the time comes. Saves arguments.'),
    { choice: ['What would you carve for me?', 'Leave'], then: [[{ call: 'x_epitaph' }], []] },
  ],
  x_epitaph: [
    { if: 'cultAsh&infamy>=8', then: [S('Sexton Cobb', '"Here lies {hero}, who wore the ash and meant it. The Choir sang at the burial. Nobody else came."'), { stop: true }] },
    { if: 'infamy>=12&karma<4', then: [S('Sexton Cobb', '"{hero}. Warden. Thief, hangman, seller of friends." I\'ll leave room. You\'re not done.'), { stop: true }] },
    { if: 'infamy>=8&karma>=6', then: [S('Sexton Cobb', '"{hero}. Saved a town, sold a few souls doing it. The sea took both kinds." That\'s most of us, really.'), { stop: true }] },
    { if: 'karma>=8&infamy<4', then: [S('Sexton Cobb', '"Here lies {hero}, who opened the box, and heard the names, and did not look away." Too long. I\'ll carve it anyway.'), { stop: true }] },
    { if: 'cultAsh', then: [S('Sexton Cobb', '"{hero}. Ash-marked. Undecided." A short stone. Cheap. Like a promise you haven\'t broken yet.'), { stop: true }] },
    S('Sexton Cobb', '"{hero}. Warden. Did their best." Everyone gets that one at first. Earn something longer.'),
  ],
};

/** Wire everything into the shared tables (called once from story.ts / maps.ts). */
export function mergeDarkData(scripts: Record<string, Cmd[]>, quests: Record<string, any>) {
  for (const k of Object.keys(DARK_SCRIPTS)) if (k.startsWith('dk_')) { const base = k.slice(3); if (scripts[base]) scripts['base_' + base] = scripts[base]; }
  Object.assign(scripts, DARK_SCRIPTS); Object.assign(quests, DARK_QUESTS);
  Object.assign(ITEMS, DARK_ITEMS); Object.assign(ENEMIES, DARK_ENEMIES);
}
export function mergeDarkNpcs(maps: Record<string, { npcs: NpcDef[] }>) {
  for (const [id, list] of Object.entries(DARK_NPCS)) if (maps[id]) for (const n of list) if (!maps[id].npcs.some(o => o.id === n.id)) maps[id].npcs.push(n);
}
