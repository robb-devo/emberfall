/** Dialogue & cutscene scripts. Interpreted by ScriptRunner (src/systems/script.ts). {hero} = hero name. */
export type Cmd = Record<string, any>;
export const QUESTS: Record<string, { name: string; desc: string; done?: string }> = {
  main1: { name: 'A Star in the Hollow', desc: 'Half of the falling star landed in Cinderdeep Hollow, south past Whisperwind Vale. Bring it back.', done: 'You won back your Star Shard… and Vesper stole it.' },
  locket: { name: "Mira's Lost Locket", desc: 'Mira dropped her mother\'s locket near the pond in Whisperwind Vale, west of the path.', done: 'You returned the locket to Mira.' },
  party: { name: 'Strength in Numbers', desc: 'Dahlia at the Wayfarer\'s Hearth can register companions. Form a party before heading out.', done: 'You formed a party.' },
};
export const TUTORIALS: Record<string, { title: string; body: string; icon?: string }> = {
  move: { title: 'Getting Around', body: 'Touch and drag anywhere to move. Push the stick further to run.\nKeyboard: Arrow keys / WASD.\n\nYour adventure saves itself as you go.' },
  talk: { title: 'Talking & Examining', body: 'Face a person or object and tap the ✦ button to talk or examine.\nKeyboard: Enter / Space.\n\nYou can talk to shopkeepers across their counters.' },
  menu: { title: 'The Menu', body: 'Tap ☰ (top right) to open the menu: Items, Equipment, Spells, Party, Quests and Status.\n◀ Back (top left) or your phone\'s back button closes any menu.\nKeyboard: M or Tab, Esc to go back.' },
  chest: { title: 'Treasure!', body: 'Treasure chests hide items, gear and gold. Open every one you find — they never come back.', icon: 'chest' },
  save: { title: 'Star-Shrines', body: 'Glowing Star-Shrines let you record your adventure. Examine one to save. Saving often is wise!\n\nIf your whole party falls, you return to the last shrine with half your gold.', icon: 'crystal' },
  party: { title: 'Companions', body: 'Talk to Dahlia at the Party Ledger to create companions — choose their name, look and vocation.\n\nUp to 4 heroes can travel together. Extras wait at the Hearth.' },
  shop: { title: 'Shops & Equipment', body: 'Buy gear in shops. The preview shows exactly how it will look on your hero!\n\nEquip it from the shop or via Menu → Equipment. Every piece of gear is visible.' },
  encounter: { title: 'Monsters', body: 'Monsters roam the wilds. Touch one to start a battle — or steer clear!\n\nSneak up from behind… or get ambushed if they reach you first.' },
  battle: { title: 'Battle Basics', body: 'Choose a command for each hero:\n\nATTACK — strike with your weapon\nSPELLS / SKILLS — special abilities that cost MP\nITEMS — use an item\nDEFEND — halve damage this turn\nFLEE — try to escape' },
  victory: { title: 'Experience & Gold', body: 'Defeating monsters earns EXP and Gold. Enough EXP raises your Level — boosting stats and teaching new Spells and Skills.\n\nGold buys gear at shops.', icon: 'ic_star' },
  heal: { title: 'Healing', body: 'HP is your life. Restore it with Medicinal Herbs, healing spells, or a night at the inn.\n\nMenu → Items to use items outside of battle.', icon: 'ic_leaf' },
  equip: { title: 'Gear Up', body: 'You found equipment! Open Menu → Equipment to wear it. Stat changes are shown before you commit.' },
};

export const SCRIPTS: Record<string, Cmd[]> = {
  // ================================================================ PROLOGUE
  // Round 4 rewrite: one clear hook. The Heartstar keeps the Wardens' power; Vesper shatters it; every Warden falls;
  // you must find the shards (and the other Wardens) before she does.
  prologue: [
    { music: 'spire' }, { fade: 'in', ms: 1800 },
    { caption: 'High above the clouds…', sub: 'stands the Aurora Spire, home of the Star-Wardens, who keep watch over the world below.' },
    { say: 'Archon Solenne', t: 'Come forward, {hero}. Tonight, you become a Star-Warden.' },
    { move: 'hero', path: 'UUU' },
    { say: 'Archon Solenne', t: 'The Heartstar above us holds the light of every Warden. While it shines, the world below is safe.' },
    { say: 'Archon Solenne', t: 'Take your halo. From this night on, the stars will answer when you call.' },
    { fx: 'halo' }, { sfx: 'star' },
    { narr: 'A ring of light settles above your head. Wings of starlight unfold at your back. It feels like coming home.' },
    { say: 'Vesper', t: 'What a lovely ceremony. Shame about the timing.', who: 'vesper' },
    { npc: 'vesper', show: true }, { move: 'vesper', path: 'UUU' },
    { say: 'Archon Solenne', t: 'Vesper. The Spire took your halo for breaking our laws. You have no place here.' },
    { say: 'Vesper', t: 'Our laws. "Watch, but never touch." Plague, war, famine… and we just watched. For a thousand years.' },
    { say: 'Vesper', t: 'I\'m done watching. I\'m taking the Heartstar, all of it. If the Spire won\'t save the world, I will.' },
    { fx: 'quake' }, { shake: 1200 }, { flash: 0xff4060 },
    { say: 'Archon Solenne', t: '{hero}! She\'s going for the Heartstar! Stop her!' },
    { fx: 'shatter' }, { shake: 2000 }, { flash: 0xffffff },
    { say: 'Archon Solenne', t: 'Too late. Get behind me!' },
    { fx: 'shield' }, { sfx: 'buff' },
    { say: 'Archon Solenne', t: 'Listen to me. The Heartstar is breaking. Every Warden will fall with it, and you will lose your halo and your wings.' },
    { say: 'Archon Solenne', t: 'But you will still be a Warden. Find the shards of the Heartstar. Find the others who fell. Reach them before she does.' },
    { narr: 'With a terrible crack, the Heartstar bursts into a thousand falling lights. The floor of the Spire gives way beneath you.' },
    { say: 'Vesper', t: 'Off you go, little star. Let\'s see how bright you shine without your sky.' },
    { fx: 'fall' },
    { fade: 'out', ms: 1600, color: 0xffffff },
    { caption: 'EMBERFALL', sub: 'Chapter I: The Fallen Star' },
    { warp: 'hearth', x: 2, y: 7, dir: 0 }, { set: 'wokeUp' },
    { music: 'hearth' }, { fade: 'in', ms: 1500 }, { call: 'wake' },
  ],
  wake: [
    { narr: '…' },
    { say: 'Girl', t: 'Oh! You\'re awake! Thank the stars!' },
    { move: 'mira', path: 'LLLL' },
    { say: 'Mira', t: 'You gave us a real fright. Farmer Odo found you face-down in his turnip patch three nights ago.' },
    { say: 'Mira', t: 'I\'m Mira. This is the Wayfarer\'s Hearth, my mum\'s inn, in the village of Hollowmere.' },
    { say: 'Mira', t: 'And you\'re {hero}, right? You kept saying it in your sleep. That, and "the stars are falling".' },
    { choice: ['I fell from the sky.', 'Where is my halo?'], then: [
      [{ say: 'Mira', t: 'Ha! From the sky? …Well, there WAS a shooting star that night. A huge one. It came down right over the village.' }],
      [{ say: 'Mira', t: 'Your… halo? Like the angels in Granny Wen\'s stories? Grandpa Bram did say the fever might muddle you a bit.' }],
    ] },
    { narr: 'You reach for the starlight that has always lived inside you. Nothing answers. Your halo is gone. For the first time in your life, you are mortal.' },
    { say: 'Mira', t: 'Oh! Elder Bram wants to see you the moment you\'re up. His house has the red roof, in the south-west of the village.' },
    { move: 'mira', path: 'RRRR' },
    { tut: 'move' }, { tut: 'talk' },
  ],
  miraHearth: [
    { say: 'Mira', t: 'Elder Bram\'s house is the red roof in the south-west. Go on, he doesn\'t bite! …Much.' },
  ],
  inn: [
    { say: 'Berta', t: 'Welcome to the Wayfarer\'s Hearth! A soft bed and a hot bowl of stew, just 6 gold a head. Staying the night?' },
    { inn: 6 },
  ],
  dahlia: [
    { if: '!homecoming', then: [
      { say: 'Dahlia', t: 'The Party Ledger? Closed, sweetheart. Every adventurer in town ran north the night the star fell.' },
      { say: 'Dahlia', t: 'Go and do something worth singing about. Then we\'ll talk.' }, { stop: true } ] },
    { if: 'metDahlia', then: [], else: [
      { say: 'Dahlia', t: 'So Bram sent you. Then the stories are true. You walked into the Hollow alone and walked back out.' },
      { say: 'Dahlia', t: 'I\'m Dahlia, keeper of the Party Ledger. Twenty years ago I marched with the finest heroes in the land. These days, I find new ones.' },
      { say: 'Dahlia', t: 'Write a name in my book, and I\'ll find you someone to stand beside you. Swords, spells, a strong back. Whatever you need.' },
      { say: 'Dahlia', t: 'Nobody should walk into the wilds alone. Let\'s find you some friends, hmm?' },
      { set: 'metDahlia' },
    ] },
    { recruit: true },
    { if: 'party>=2', then: [{ if: '!finaleReady', then: [{ say: 'Dahlia', t: 'Now THAT is a party. Off you go. Bram and Mira are waiting for you by the village gate.' }, { set: 'finaleReady' }, { quest: 'party', state: 'done' }] }] },
  ],
  elder: [
    { if: 'metElder', then: [
      { say: 'Elder Bram', t: 'The Hollow is south, past Whisperwind Vale. Rest at the Hearth before you go, {hero}, and buy yourself something sharper than good intentions.' },
    ], else: [
      { say: 'Elder Bram', t: 'Ah! Our guest from the turnip patch. Come in, come in. Sit down before you fall down again.' },
      { say: 'Elder Bram', t: 'Three nights ago, a star fell over Hollowmere. It broke in two before it landed.' },
      { say: 'Elder Bram', t: 'One piece landed in Odo\'s turnips. That piece, as it turns out, was you.' },
      { say: 'Elder Bram', t: 'The other piece fell into Cinderdeep Hollow, the old mine to the south. Since then the monsters have gone wild, and the Hollow glows red at night.' },
      { choice: ['That light is mine.', 'Tell me about the Hollow.'], then: [
        [{ say: 'Elder Bram', t: '…Yours. You mean that. I can see it in your eyes. Then perhaps the stars sent you to us for a reason.' }],
        [{ say: 'Elder Bram', t: 'Miners dug for embersteel there, long ago, until they woke something at the bottom. Something that guards whatever it finds.' }],
      ] },
      { say: 'Elder Bram', t: 'I\'m too old to swing a staff, and Rowan must guard the village. Will you go into the Hollow and bring back what fell there?' },
      { say: 'Elder Bram', t: 'Take these. It isn\'t much, but nobody should go into a mine with empty pockets.' },
      { give: 'herb', n: 2 }, { gold: 50 },
      { narr: 'Received 2 Medicinal Herbs and 50 Gold!' },
      { say: 'Elder Bram', t: 'Spend it at Bramble & Brass across the plaza. Garrick sells weapons, Ilsa sells armour. And rest at the Hearth before you go.' },
      { set: 'metElder' }, { quest: 'main1', state: 'active' }, { tut: 'menu' },
    ] },
  ],
  miraVillage: [
    { if: 'quest:locket=done', then: [{ say: 'Mira', t: 'I keep opening the locket just to see her face. Thank you, {hero}. Come home safe, all right?' }], else: [
      { if: 'has:locket', then: [
        { say: 'Mira', t: 'Is that… my locket? You found it! Oh, {hero}!' }, { take: 'locket' }, { sfx: 'join' },
        { say: 'Mira', t: 'Mum\'s picture is still inside. I thought it was gone forever. Here, take this. It\'s always brought me luck. Now it\'s your turn.' },
        { give: 'charm' }, { narr: 'Received a Lucky Charm!' }, { quest: 'locket', state: 'done' }, { tut: 'equip' },
      ], else: [
        { if: 'quest:locket=active', then: [{ say: 'Mira', t: 'The pond is west of the path, just past the village gate. Please be careful!' }], else: [
          { say: 'Mira', t: 'You\'re going out to the Vale? Could I… ask you a favour?' },
          { say: 'Mira', t: 'The day the star fell, I dropped my mum\'s locket by the pond. The monsters went wild and I ran. I\'ve been too scared to go back.' },
          { choice: ['I\'ll find it.', 'Not now.'], then: [[{ say: 'Mira', t: 'Really? Thank you! The pond is west of the path, just past the gate.' }, { quest: 'locket', state: 'active' }], [{ say: 'Mira', t: 'That\'s all right… but if you ever pass the pond, keep an eye out?' }, { quest: 'locket', state: 'active' }]] },
        ] },
      ] },
    ] },
  ],
  guard: [
    { if: 'metElder', then: [{ say: 'Guard Rowan', t: 'Elder\'s orders, you\'re free to go. Mind the tall grass. Thornhares kick like mules.' }], else: [{ say: 'Guard Rowan', t: 'Hold it. The Vale hasn\'t been safe since the star fell. Talk to Elder Bram first.' }] },
  ],
  guardBlock: [{ say: 'Guard Rowan', t: 'Whoa there! Nobody leaves until the Elder says so. His house is the red roof to the west.' }, { step: 'back' }],
  kid: [{ say: 'Pip', t: 'Mira says you fell out of the sky! Can you fly? Do a flip! Do a FLIP!' }],
  granny: [{ say: 'Granny Wen', t: 'When I was a girl, you could hear the stars sing on a clear night. Nobody hears them now. Nobody stops to listen.' }],
  bard: [
    { say: 'Lute the Bard', t: '♪ When the Heartstar breaks and the Wardens fall, the ember sleeps beneath it all… ♪' },
    { say: 'Lute the Bard', t: 'An old song. Nobody knows who wrote it. Funny, it\'s been stuck in my head for three days now.' },
  ],
  fisher: [{ say: 'Old Haddock', t: 'Fish ain\'t biting since the star fell. River\'s warm. Too warm. Something down south is heating the whole thing like a kettle.' }],
  farmer: [{ say: 'Farmer Odo', t: 'There you are! You landed right on my prize turnips. Flat as pancakes. …No, no, I\'m glad you\'re alive. Mostly.' }],
  shopWeapons: [{ say: 'Garrick', t: 'Steel, wood or copper, Garrick\'s got it! Have a look around.' }, { shop: 'weapons' }],
  shopArmor: [{ say: 'Ilsa', t: 'Armour, shields and hats! Try anything on. The mirror\'s free, and so are my honest opinions.' }, { shop: 'armor' }],
  shopItems: [{ say: 'Posy', t: 'Herbs, dew and the odd explosive! What\'ll it be?' }, { shop: 'items' }],
  // ================================================================ FIELD
  fieldIntro: [
    { caption: 'Whisperwind Vale' },
    { tut: 'encounter' },
  ],
  tobin: [
    { say: 'Old Tobin', t: 'Heh. Don\'t mind me, just an old wanderer warming his bones. That glowing stone is a Star-Shrine. Still works, I reckon.' },
    { if: '!tobinGift', then: [{ say: 'Old Tobin', t: 'You look like someone headed somewhere dangerous. Take these. I\'ve got plenty.' }, { give: 'herb', n: 3 }, { narr: 'Received 3 Medicinal Herbs!' }, { set: 'tobinGift' }, { tut: 'heal' }] },
    { say: 'Old Tobin', t: 'Let me patch you up. No charge for a fellow traveller.' }, { heal: true }, { sfx: 'heal' }, { narr: 'Your party\'s wounds are tended. HP and MP fully restored!' },
  ],
  rancher: [{ say: 'Rancher Fen', t: 'Thornhares spooked my cows and they broke the fence. If you meet one, give it a good thwack from me.' }],
  caveWarn: [{ narr: 'Hot air breathes out of the cave mouth. The rock is warm, and deep inside something pulses, slow and steady, like a heartbeat.' }],
  // ================================================================ DUNGEON
  hollowIntro: [
    { caption: 'Cinderdeep Hollow' },
    { narr: 'Old mine tracks vanish into the dark. Somewhere far below, a faint warmth is calling to you. It feels like your own light.' },
  ],
  bossApproach: [
    { narr: 'The air ripples with heat. At the far end of the cavern, something huge is stirring. In its chest burns a light you know.' },
    { narr: 'Your Star Shard.' },
  ],
  boss: [
    { music: 'none' }, { shake: 800 }, { sfx: 'quake' },
    { say: 'Hollow Warden', t: 'LIGHT… FELL FROM ABOVE… MINE NOW. I GUARD IT. I GUARD IT FOREVER.' },
    { say: 'Hollow Warden', t: 'YOU. YOU SMELL OF THE SPIRE. YOU WILL NOT TAKE IT.' },
    { choice: ['That light belongs to me!', '(Ready your weapon)'], then: [[], []] },
    { battle: ['warden'], boss: true, bg: 'bg_boss', music: 'boss', noFlee: true },
    { set: 'lairDone' }, { call: 'cliffhanger' },
  ],
  cliffhanger: [
    { music: 'cliff' },
    { narr: 'The Warden crumbles into ash and glowing stone. The Star Shard rises from its chest and floats toward you, humming softly.' },
    { fx: 'shardGet' }, { give: 'starShard' },
    { narr: 'Warmth floods back into you. For one moment, you remember what it felt like to fly.' },
    { fx: 'rift' }, { shake: 900 }, { sfx: 'dark' },
    { say: 'Vesper', t: 'Bravo. Truly. I half expected you to stay in that turnip patch forever.', who: 'vesper' },
    { npc: 'vesperL', show: true }, { move: 'vesperL', path: 'DD' },
    { say: 'Vesper', t: 'Don\'t look at me like that. I\'m only collecting what\'s mine.' },
    { fx: 'steal' }, { take: 'starShard' }, { sfx: 'shatter' }, { flash: 0xa040ff },
    { narr: 'The Shard rips out of your hands and flies straight into Vesper\'s.' },
    { say: 'Vesper', t: 'Did you think you were the only one who fell? Every Warden on the Spire came down with you. Scattered. Mortal. Alone.' },
    { say: 'Vesper', t: 'Each of them carries a piece of the Heartstar. I\'m going to find every last one.' },
    { say: 'Vesper', t: 'And when I have them all, I\'ll fix this broken world myself. Try to keep up, little star.' },
    { move: 'vesperL', path: 'UU' }, { npc: 'vesperL', show: false }, { fx: 'riftClose' },
    { wait: 900 },
    { narr: 'Silence. Then, very faintly, far above you, the stars begin to sing. They sound afraid.' },
    { quest: 'main1', state: 'done' },
    { fade: 'out', ms: 1500 },
    { caption: 'That night…', sub: 'Hollowmere' },
    { warp: 'elder', x: 4, y: 6, dir: 3 }, { set: 'homecoming' }, { set: 'night' }, { heal: true },
    { fade: 'in', ms: 1200 }, { call: 'bramTruth' },
  ],
  bramTruth: [
    { say: 'Elder Bram', t: 'You came back. Good. Mira has been pacing a hole in my floor.' },
    { narr: 'You tell him everything: the Warden, the Shard, and Vesper.' },
    { say: 'Elder Bram', t: '…Vesper. So she finally did it.' },
    { choice: ['You know Vesper?', '(Say nothing)'], then: [[], []] },
    { say: 'Elder Bram', t: 'Sit down, {hero}. There\'s something I should have told you the day you woke up.' },
    { fx: 'bramGlow' }, { sfx: 'star' },
    { narr: 'For a heartbeat, a faint, cracked ring of light flickers above the old man\'s head. Then it gutters out like a candle.' },
    { say: 'Elder Bram', t: 'Three hundred years ago, I was a Star-Warden too. A plague came to this village, and I gave up my halo to stop it.' },
    { say: 'Elder Bram', t: 'I never went back up. I grew old here instead. Happily, mostly.' },
    { say: 'Elder Bram', t: 'Vesper was my apprentice. The brightest I ever taught. I told her mortals were worth any sacrifice… and she took it the wrong way.' },
    { say: 'Elder Bram', t: 'She wants every shard of the Heartstar for herself. With that much light, she wouldn\'t fix the world. She would rule it.' },
    { say: 'Elder Bram', t: 'You can\'t stop her alone. Go and see Dahlia at the Hearth. Tell her Bram says the Ledger opens tonight.' },
    { quest: 'party', state: 'active' }, { set: 'ledgerOpen' }, { tut: 'party' },
  ],
  finale: [
    { say: 'Mira', t: '{hero}! Wait!' },
    { say: 'Mira', t: 'I knew you\'d go. People who fall out of the sky don\'t stay in turnip villages.' },
    { say: 'Mira', t: 'Just promise you\'ll come back, all right? Hollowmere is your home now. You\'ve got people here.' },
    { choice: ['I promise.', 'I\'ll bring the stars back with me.'], then: [[{ say: 'Mira', t: 'Then I\'ll keep the stew warm.' }], [{ say: 'Mira', t: 'Ha! Show-off. …I\'ll hold you to that.' }]] },
    { say: 'Elder Bram', t: 'Look. Up there.' },
    { fx: 'starRain' }, { music: 'cliff' },
    { narr: 'All across the night sky, lights are falling. Some burn bright. Some are already fading.' },
    { narr: 'Every one of them is a Warden, alone somewhere in the world. And somewhere out there, Vesper is hunting them.' },
    { say: 'Elder Bram', t: 'Then you leave at dawn. Find them first, {hero}. May the stars light your road.' },
    { set: 'chapter1Done' }, { end: 'chapter' },
  ],
};

// ---- Chapter II merge (see story2.ts)
import { SCRIPTS2, QUESTS2, QUESTS3, TUTORIALS2 } from './story2';
Object.assign(QUESTS, QUESTS2, QUESTS3); Object.assign(TUTORIALS, TUTORIALS2);
const elderCh1 = SCRIPTS.elder;
Object.assign(SCRIPTS, SCRIPTS2);
SCRIPTS.elder = [{ if: 'chapter1Done&!ch2Started', then: [{ call: 'ch2Dawn' }], else: [{ if: 'ch2Started', then: [{ call: 'elderCh2' }], else: elderCh1 }] }];

// ---- Round 5 dark world (Adult only; see dark.ts)
import { mergeDarkData } from './dark';
mergeDarkData(SCRIPTS, QUESTS);
