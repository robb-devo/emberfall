/**
 * Chapter II — The Drowned Choir.  Scripts, quests and story companions.
 * Merged into SCRIPTS / QUESTS by story.ts. Interpreted by ScriptRunner (src/systems/script.ts).
 */
import type { Look } from '../systems/state';
import { NPC_LOOKS2 } from './maps';
type Cmd = Record<string, any>;

export const STORY_MEMBERS: Record<string, { name: string; voc: string; look: Look; level: number; equip: Record<string, string>; skills?: string[] }> = {
  ione: { name: 'Ione', voc: 'bard', look: NPC_LOOKS2.ione, level: 9, equip: { weapon: 'coralLute', armor: 'silkRobe', head: 'featherCap' }, skills: ['tidesong'] },
};

export const QUESTS2: Record<string, { name: string; desc: string; done?: string }> = {
  main2: { name: 'A Letter for the Abbess', desc: 'Elder Bram asked you to carry his letter east along the Emberwood Road to Abbess Maren in the harbour town of Saltmere.', done: 'You delivered Bram\'s letter. The Abbess opened the Chapel of Alltrades to you.' },
  main2b: { name: 'The Singer by the Sea', desc: 'Abbess Maren believes a girl called Ione — who sings to the sea at the Gull & Anchor inn — may be a fallen Warden. Find her.', done: 'You heard Ione sing… and lost her the same night.' },
  main2c: { name: 'The Drowned Choir', desc: 'The Ashen Choir carried Ione into the sea cave west of the beach — the Weeping Grotto. Rescue her before their Requiem ends.', done: 'You defeated Cantor Mordane and freed Ione, Warden of the Tides.' },
  mule: { name: 'Turnip the Mule', desc: 'Pell the Peddler\'s mule bolted into the Emberwood when an Ashwolf howled. Pell thinks he went toward the mushroom grove to the north-west.', done: 'Turnip is home, and Pell is a happy peddler.' },
  pearls: { name: 'Catch of the Day', desc: 'Old Salt Nab on the Saltmere docks will trade an heirloom for 3 Brine Pearls. Brinecrabs on the coast and in the grotto carry them.', done: 'You traded 3 Brine Pearls for Nab\'s Tidecaller Spear.' },
  lookout: { name: 'The Last Watch', desc: 'The ghost of Davy, a harbour lookout, haunts the Weeping Grotto. He asked you to take his watch badge to his wife Brenna on the beach.', done: 'Brenna has her husband\'s badge, and Davy can rest.' },
};

export const SCRIPTS2: Record<string, Cmd[]> = {
  // ================================================================ DAWN (Hollowmere)
  ch2Dawn: [
    { set: 'ch2Started' }, { music: 'hearth' }, { fade: 'in', ms: 1400 },
    { caption: 'EMBERFALL', sub: 'Chapter II — The Drowned Choir' },
    { say: 'Elder Bram', t: 'Morning, Warden. I didn\'t sleep either. Old stars don\'t, much.' },
    { say: 'Elder Bram', t: 'I watched the sky all night. Most of the falling lights went north… but one fell into the sea, far to the east, near Saltmere.' },
    { say: 'Elder Bram', t: 'And here is the strange part. Saltmere\'s lighthouse has burned every night for two hundred years. Last night, it was dark.' },
    { choice: ['A fallen Warden?', 'Vesper got there first?'], then: [[{ say: 'Elder Bram', t: 'Perhaps. A Warden\'s light draws things to it — good things and very bad ones.' }], [{ say: 'Elder Bram', t: 'Let us pray not. But we would be fools not to hurry.' }]] },
    { say: 'Elder Bram', t: 'There is a woman in Saltmere — Abbess Maren of the Chapel of Alltrades. She is… an old friend. She knows what I was.' },
    { say: 'Elder Bram', t: 'Give her this letter. She will help you — and her chapel can teach you new ways to fight. Paladins, rangers, bards…' },
    { give: 'letter' }, { narr: 'Received Bram\'s Letter!' }, { quest: 'main2', state: 'active' },
    { say: 'Elder Bram', t: 'Mira packed you something, too. She made me swear not to say she cried.' },
    { give: 'hiHerb', n: 3 }, { narr: 'Received 3 Strong Herbs!' },
    { say: 'Elder Bram', t: 'Take the Emberwood Road — cross the river by the east bridge. And {hero}… whatever you find out there, come home.' },
    { set: 'night', v: false },
  ],
  elderCh2: [
    { say: 'Elder Bram', t: 'The east bridge, then the Emberwood Road. Saltmere lies beyond the forest, where the land runs out.' },
    { say: 'Elder Bram', t: 'Maren will help you. Tell her… tell her the old fool still keeps the candle lit.' },
  ],
  eastBlock: [
    { if: 'chapter1Done', then: [{ narr: 'The Emberwood Road leads east. You should speak with Elder Bram before setting out.' }],
      else: [{ narr: 'Beyond the bridge, the Emberwood Road winds into a forest of red and gold. Not yet — Hollowmere still needs you.' }] },
    { step: 'back' },
  ],
  // ================================================================ EMBERWOOD ROAD
  roadIntro: [
    { caption: 'Emberwood Road', sub: 'Autumn never quite leaves this forest.' },
    { narr: 'Leaves of red and gold drift across the path. Somewhere in the trees, something howls — low, hungry, and much too close.' },
  ],
  pilgrimRoad: [
    { say: 'Ashen Pilgrim', t: 'Going to Saltmere, child? So are we. The Choir sings there now.' },
    { say: 'Ashen Pilgrim', t: 'The stars fell because they were never worth looking up at. Ash is honest. Ash stays.' },
    { choice: ['What is the Choir?', 'Ash is just dirt.'], then: [
      [{ say: 'Ashen Pilgrim', t: 'The Ashen Choir sings the stars to sleep, so they may never fall on us again. Come and listen. Everyone listens, in the end.' }],
      [{ say: 'Ashen Pilgrim', t: 'Heh. So was the first man, they say. Go on, then. The sea is waiting for you.' }]] },
  ],
  pell: [
    { if: '!metPell', then: [
      { say: 'Pell the Peddler', t: 'Oi! A customer! In THIS forest! Pell the Peddler, at your service — fine goods, fair-ish prices.' },
      { say: 'Pell the Peddler', t: 'Well. Most of my goods. The rest are on the back of my mule, Turnip, who bolted when an Ashwolf howled last night.' },
      { say: 'Pell the Peddler', t: 'Daft creature loves mushrooms. I\'d bet my boots he\'s in the grove to the north-west. Would you look? I\'d make it worth your while.' },
      { set: 'metPell' }, { quest: 'mule', state: 'active' },
    ] },
    { if: 'muleFound&!quest:mule=done', then: [
      { say: 'Pell the Peddler', t: 'TURNIP! You beautiful, ungrateful, mushroom-stinking beast! He walked in bold as you like!' },
      { say: 'Pell the Peddler', t: 'You found him, didn\'t you? A deal\'s a deal. Here — my lucky ring, and a little coin besides.' },
      { give: 'pearlRing' }, { gold: 200 }, { narr: 'Received a Pearl Ring and 200 gold!' }, { quest: 'mule', state: 'done' },
      { say: 'Pell the Peddler', t: 'And now the good stuff\'s back in stock. Take a look!' },
    ] },
    { say: 'Pell the Peddler', t: 'What\'ll it be, friend?' },
    { shop: 'peddler' },
  ],
  muleFound: [
    { narr: 'A shaggy mule is happily munching mushrooms. A bell on its saddle reads TURNIP.' },
    { say: 'Turnip', t: 'Hee-HAW!' },
    { narr: 'Turnip looks at you, then at the forest, then at you again… and trots off toward the old watchtower, bell jingling.' },
    { npc: 'mule', show: false }, { set: 'muleFound' },
  ],
  muleHome: [{ say: 'Turnip', t: 'Hee-haw. (He nibbles your sleeve affectionately.)' }],
  // ================================================================ SALTMERE
  saltIntro: [
    { caption: 'Saltmere', sub: 'A harbour at the edge of the world.' },
    { narr: 'Salt wind, gull-cries, the creak of moored boats. On the eastern cliff, the great lighthouse stands cold and dark.' },
    { narr: 'In the town square, grey-robed figures are singing a slow, sad hymn.' },
  ],
  preacher: [
    { if: 'grottoDone', then: [{ stop: true }] },
    { say: 'Choir Preacher', t: '…and the stars looked down for a thousand years, and did NOTHING. Who among you was saved by a star?' },
    { say: 'Choir Preacher', t: 'Sing with us, Saltmere. Sing the stars to sleep. When the last light is gone, nothing will ever fall on you again.' },
    { choice: ['(Listen)', 'The stars are not your enemy.'], then: [
      [{ narr: 'The hymn is beautiful, and terribly sad. For a moment, you feel very tired.' }],
      [{ say: 'Choir Preacher', t: 'Oh? You speak as one who knows. Your eyes have a strange shine, traveller…' }, { say: 'Choir Preacher', t: 'The Cantor will want to meet you.' }]] },
  ],
  pilgrim: [{ say: 'Ashen Pilgrim', t: 'Hmmm-mmm… ash to ash… stars to sleep… hmmm-mmm…' }],
  oldsalt: [
    { if: 'quest:pearls=done', then: [{ say: 'Old Salt Nab', t: 'That spear served me forty years. Make it serve you forty more, eh?' }, { stop: true }] },
    { if: 'quest:pearls=active', then: [
      { if: 'has:pearl', then: [
        { say: 'Old Salt Nab', t: 'Pearls! Let\'s count \'em…' },
        { if: 'inv:pearl>=3', then: [{ call: 'pearlsTrade' }], else: [{ say: 'Old Salt Nab', t: 'I need three of \'em, mind. Three pearls for one spear — a fair trade on any tide.' }] },
      ], else: [{ say: 'Old Salt Nab', t: 'Three Brine Pearls, friend. Brinecrabs carry \'em. Down on the coast, or in the grotto.' }] },
      { stop: true },
    ] },
    { say: 'Old Salt Nab', t: 'Lighthouse dark three weeks now. Three boats gone on the rocks. Nobody fishes at night any more.' },
    { say: 'Old Salt Nab', t: 'Say — you look handy. Bring me three Brine Pearls and I\'ll trade you my old Tidecaller Spear. Finest steel in Saltmere.' },
    { quest: 'pearls', state: 'active' },
  ],
  pearlsTrade: [
    { say: 'Old Salt Nab', t: 'Three! Beautiful! As promised — the Tidecaller Spear. She sings in a storm, she does.' },
    { take: 'pearl', n: 3 }, { give: 'spear' }, { narr: 'Received the Tidecaller Spear!' }, { quest: 'pearls', state: 'done' },
  ],
  coralie: [
    { if: 'grottoDone', then: [{ say: 'Coralie', t: 'Ione\'s back! And the lighthouse is shining! I KNEW the sea would bring her home!' }, { stop: true }] },
    { if: 'ioneTaken', then: [{ say: 'Coralie', t: '(sniff) They took Ione… the grey people… into the Weeping Grotto. Please bring her back. Please.' }, { stop: true }] },
    { say: 'Coralie', t: 'Have you heard Ione sing? She sings at the Gull every evening. When she sings, the whole sea goes quiet to listen!' },
  ],
  lightGuard: [
    { if: 'grottoDone', then: [{ say: 'Harbour Watch', t: 'The lighthouse? The Mayor says it\'s yours to climb, Warden. Never thought I\'d say that word out loud.' }, { stop: true }] },
    { say: 'Harbour Watch', t: 'Lighthouse is closed. Mayor\'s orders. Lamp went out the night the star fell into the bay, and nobody can light it again.' },
    { say: 'Harbour Watch', t: 'Folk say the light didn\'t go out. Folk say it went INTO the sea.' },
  ],
  brenna: [
    { if: 'quest:lookout=done', then: [{ say: 'Fishwife Brenna', t: 'I sleep easier now. Thank you, for both of us.' }, { stop: true }] },
    { if: 'has:badge', then: [
      { say: 'Fishwife Brenna', t: 'That badge… where did you… That\'s Davy\'s. My Davy\'s.' },
      { narr: 'You tell her about the lookout in the grotto, still keeping his watch.' },
      { say: 'Fishwife Brenna', t: 'Stubborn old fool. Even dead, he wouldn\'t leave his post without telling me.' },
      { say: 'Fishwife Brenna', t: 'Take his cape. He\'d want it to go somewhere brave — not hang in a cupboard smelling of salt and me crying.' },
      { take: 'badge' }, { give: 'gullCape' }, { narr: 'Received the Gull-Wing Cape!' }, { quest: 'lookout', state: 'done' }, { stop: true },
    ] },
    { say: 'Fishwife Brenna', t: 'My husband Davy kept the night watch by the sea cave. Three weeks ago he went in after a strange light… and didn\'t come out.' },
  ],
  caveGuard: [
    { say: 'Harbour Watch', t: 'Sea cave\'s barred. The Weeping Grotto, they call it — you can hear it crying at high tide. Mayor\'s orders: nobody goes in.' },
  ],
  caveSealed: [
    { narr: 'A rusted iron grate bars the mouth of the cave. From somewhere deep inside comes a faint, sad singing.' },
    { step: 'back' },
  ],
  nanPearl: [
    { say: 'Granny Pearl', t: 'When I was a girl, my gran told me the lighthouse wasn\'t lit by oil at all. A star kept it, she said. A Warden of the Tides.' },
    { say: 'Granny Pearl', t: 'The Warden sang, and the light answered. Silly old story. …Though I\'ve heard that Ione girl sing, and I wonder.' },
    { if: 'ioneTaken&!grottoDone', then: [{ say: 'Granny Pearl', t: 'Take my old remedy, dearie. The grotto is cruel to the unprepared.' }, { if: '!nanGift', then: [{ give: 'hiHerb', n: 2 }, { give: 'antidote', n: 2 }, { set: 'nanGift' }, { narr: 'Received 2 Strong Herbs and 2 Antidotes!' }] }] },
  ],
  tideWeapons: [{ say: 'Brannoc', t: 'Saltsteel never rusts, never dulls, never lies. Unlike sailors. Have a look.' }, { shop: 'tideWeapons' }],
  tideArmor: [{ say: 'Wenna', t: 'Coats for the spray, mail for the monsters, rings for the romantics. Try anything on!' }, { shop: 'tideArmor' }],
  tideItems: [{ say: 'Old Marrow', t: 'Herbs, dews, feathers. Everything a body needs to come home in one piece.' }, { shop: 'tideItems' }],
  ilo: [
    { if: 'grottoDone', then: [{ say: 'Net-Maker Ilo', t: 'Boats are going out again tonight! I\'ll need twice the nets. Best problem I\'ve had all year.' }, { stop: true }] },
    { say: 'Net-Maker Ilo', t: 'No light on the cliff means no night fishing. No fishing means no nets. No nets means… well. Means I talk to strangers a lot.' },
    { say: 'Net-Maker Ilo', t: 'Those grey Choir folk bought every spare net I had. Paid in old silver. What do singers want with fishing nets?' },
  ],
  wren: [{ say: 'Little Wren', t: 'Papa says the sea cave cries because it\'s lonely. I think it\'s because someone is SINGING in there.' }],
  // ---- the chapel
  maren: [
    { if: '!metMaren', then: [{ call: 'marenFirst' }, { stop: true }] },
    { say: 'Abbess Maren', t: 'Welcome back, child. How may the Alltrades guide you?' },
    { choice: ['Change vocation', 'Ask for advice', 'Nothing for now'], then: [
      [{ vocation: true, who: 'Abbess Maren' }],
      [{ call: 'marenAdvice' }],
      [{ say: 'Abbess Maren', t: 'Go with the light, {hero}.' }]] },
  ],
  marenFirst: [
    { say: 'Abbess Maren', t: 'Welcome to the Chapel of Alltrades, traveller. You look as though you have walked a long way.' },
    { if: 'has:letter', then: [
      { narr: 'You hand her Bram\'s letter. She reads it once. Then again. Her hands begin to tremble.' },
      { take: 'letter' },
      { say: 'Abbess Maren', t: '"The old fool still keeps the candle lit." Bram… you stubborn, wonderful old man. You\'re alive.' },
    ], else: [{ say: 'Abbess Maren', t: 'Hollowmere, you say? Then you know Bram. I can see his teaching in how you stand.' }] },
    { say: 'Abbess Maren', t: 'So. You are a Star-Warden. Fallen, and mortal, and carrying all of that on your shoulders. I am so sorry, child.' },
    { say: 'Abbess Maren', t: 'Bram and I fought side by side, once — long before you were a spark. I chose to stay here and teach. He chose to grow turnips.' },
    { say: 'Abbess Maren', t: 'This chapel holds the old arts of the Alltrades. Any soul may learn to walk a new path: Paladin, Ranger, Bard… or return to the old.' },
    { set: 'vocationsOpen' }, { sfx: 'star' },
    { narr: 'The Chapel of Alltrades is open to you! Speak with the Abbess to change any party member\'s vocation.' },
    { tut: 'vocation' },
    { say: 'Abbess Maren', t: 'Now listen, for this matters. Three weeks ago a light fell into the bay, and the lighthouse died the same night.' },
    { say: 'Abbess Maren', t: 'The next morning, a girl walked out of the surf with no memory and no name. The fishers call her Ione. She sings at the Gull & Anchor.' },
    { say: 'Abbess Maren', t: 'When she sings, the tide turns early. I believe she is one of you, {hero}. A Warden who has forgotten herself.' },
    { say: 'Abbess Maren', t: 'And the Ashen Choir arrived in Saltmere the very same week. I do not believe in coincidences. Find her. Keep her close.' },
    { set: 'metMaren' }, { quest: 'main2', state: 'done' }, { quest: 'main2b', state: 'active' },
  ],
  marenAdvice: [
    { if: 'grottoDone', then: [{ say: 'Abbess Maren', t: 'Kragmoor, beyond Cinder Pass. The Choir\'s cathedral. But first, rest — even stars need sleep.' }, { stop: true }] },
    { if: 'ioneTaken', then: [{ say: 'Abbess Maren', t: 'The Weeping Grotto lies west along the beach. The Choir will be waiting. Light magic burns them; Paladins and priests will serve you well.' }, { stop: true }] },
    { say: 'Abbess Maren', t: 'Every vocation keeps its own level, and the abilities you learn are never forgotten. A Warrior who becomes a Priest still knows how to swing a sword.' },
    { say: 'Abbess Maren', t: 'A Paladin shields the weak. A Ranger strikes true. A Bard\'s songs turn the tide of a battle. Try them all.' },
  ],
  novice: [
    { if: 'grottoDone', then: [{ say: 'Novice Tam', t: 'The lighthouse is singing! Well — shining. But it FEELS like singing.' }, { stop: true }] },
    { say: 'Novice Tam', t: 'The Abbess says changing vocation starts you at level one in the new path — but you keep every skill you\'ve learned!' },
    { say: 'Novice Tam', t: 'I want to be a Paladin. Or a Bard. Or a Paladin who sings. Is that allowed?' },
  ],
  // ---- the Gull & Anchor
  innSalt: [
    { if: 'metIone&!ioneTaken', then: [
      { say: 'Marla', t: 'Ione asked me to give you a room tonight — no charge. Said the sea told her you were kind. Odd girl. Lovely voice.' },
      { say: 'Marla', t: 'Get some rest, love. You look like you fell off a star.' },
      { call: 'abduction' }, { stop: true },
    ] },
    { say: 'Marla', t: 'Welcome to the Gull & Anchor! A bed is 10 gold a head — sea view, if you squint.' },
    { inn: 10, who: 'Marla' },
  ],
  delphine: [
    { say: 'Delphine', t: 'Delphine of the Ledger, Saltmere branch. Dahlia and I trained together. Need new blood, or a change of faces?' },
    { recruit: true, who: 'Delphine' },
  ],
  sailor: [
    { if: 'grottoDone', then: [{ say: 'Sailor Quill', t: 'Light\'s back! We sail at dawn! Drinks are on me — well, on Marla, she just doesn\'t know it yet.' }, { stop: true }] },
    { say: 'Sailor Quill', t: 'Ever heard a whole grotto cry? The Weeping Grotto does it every high tide. Gives me the shivers.' },
  ],
  snorer: [{ say: 'Snoring Fisherman', t: 'Zzz… more pearls… zzz… no, YOU\'RE a crab… zzz…' }],
  ioneInn: [
    { if: 'metIone', then: [
      { say: 'Ione', t: 'You came back. Marla will give you a room — I asked her. Rest. Something about tonight feels… loud.' }, { stop: true },
    ] },
    { music: 'none' }, { fx: 'song' },
    { narr: 'The tavern hushes. On the little stage, a barefoot girl with sea-green hair begins to sing — no words, just a melody older than the town.' },
    { narr: 'Through the window, the sea goes perfectly still.' },
    { say: 'Ione', t: '…Oh. I\'m sorry. I didn\'t see you there. Did I — did I sing too long again? Marla says I forget the time.' },
    { say: 'Ione', t: 'I\'m Ione. At least, that\'s what they call me. I don\'t remember my real name. I don\'t remember anything before the surf.' },
    { choice: ['I fell too. From the sky.', 'Your song moved the sea.'], then: [
      [{ say: 'Ione', t: 'From the sky…? Then that\'s why I dream of falling. Every night. Falling, and a light going out inside me.' }],
      [{ say: 'Ione', t: 'You saw it too? I thought I was imagining it. The sea listens when I sing. I don\'t know why.' }]] },
    { say: 'Ione', t: 'The grey singers in the square… they keep watching me. Their Cantor asked me to join their Choir. I said no. He smiled.' },
    { say: 'Ione', t: 'Will you stay in Saltmere tonight? I\'d feel safer. Talk to Marla — I\'ll ask her to give you a room.' },
    { set: 'metIone' }, { music: 'tavern' },
    { narr: 'Ione might be a fallen Warden. Rest at the inn tonight.' },
  ],
  abduction: [
    { fade: 'out', ms: 900 }, { music: 'none' }, { sfx: 'inn' }, { wait: 1600 },
    { caption: 'That night…' },
    { sfx: 'dark' }, { narr: 'A scream tears through the dark — and is cut short.' },
    { set: 'ioneTaken' }, { quest: 'main2b', state: 'done' },
    { warp: 'saltmere', x: 19, y: 14, dir: 0 },
    { npc: 'mordaneN', show: true }, { npc: 'acoN1', show: true }, { npc: 'acoN2', show: true }, { npc: 'ioneN', show: true }, { npc: 'hallamN', show: true },
    { music: 'cliff' }, { fade: 'in', ms: 1200 },
    { say: 'Ione', t: 'Let go of me! {hero}! HELP!' },
    { move: 'hero', path: 'DD' },
    { say: 'Cantor Mordane', t: 'Ahh. The second spark. I wondered when you would show yourself, little fallen thing.' },
    { say: 'Cantor Mordane', t: 'Do not trouble yourself. The Choir sings for one Warden at a time — and tonight, we sing for HER.' },
    { choice: ['Let her go!', '(Charge at him)'], then: [[], [{ move: 'hero', path: 'D' }]] },
    { fx: 'abductFlash' }, { shake: 600 }, { flash: 0xa040ff },
    { narr: 'A wall of ash-grey sound slams into you. Your legs fold. The world goes muffled and slow.' },
    { say: 'Cantor Mordane', t: 'Hush. Listen to the Requiem. When it ends, her light will be ours… and her lighthouse will never shine again.' },
    { say: 'Cantor Mordane', t: 'Our thanks to the good Mayor. The tithe is paid in full.' },
    { move: 'mordaneN', path: 'DDD' }, { move: 'ioneN', path: 'DD' },
    { npc: 'mordaneN', show: false }, { npc: 'acoN1', show: false }, { npc: 'acoN2', show: false }, { npc: 'ioneN', show: false },
    { narr: 'They vanish down the beach, toward the black mouth of the Weeping Grotto.' },
    { face: 'hero', dir: 2 }, { wait: 400 },
    { say: 'Mayor Hallam', t: '…' },
    { say: 'Mayor Hallam', t: 'Go back to bed, traveller. You didn\'t see anything. None of us did.' },
    { npc: 'hallamN', show: false },
    { narr: 'You can move again. The iron grate of the sea cave hangs open.' },
    { quest: 'main2c', state: 'active' }, { music: 'harbor' },
  ],
  hallam: [
    { if: 'grottoDone', then: [{ say: 'Mayor Hallam', t: 'I will spend the rest of my life making this right. Starting with the boats, and the families.' }, { stop: true }] },
    { if: 'ioneTaken', then: [
      { say: 'Mayor Hallam', t: 'Get OUT. I— no. No, wait.' },
      { say: 'Mayor Hallam', t: 'They said they would sink every boat in the harbour. They said the sea would take this town the way it took my wife.' },
      { say: 'Mayor Hallam', t: 'One girl nobody knew, for a whole town. I told myself it was arithmetic. …It was cowardice.' },
      { say: 'Mayor Hallam', t: 'The Grotto goes deep. The Choir\'s chapel is at the very bottom. Please… bring her back. I can\'t.' },
      { stop: true },
    ] },
    { say: 'Mayor Hallam', t: 'Welcome to Saltmere! The lighthouse? A, ah, mechanical fault. Our finest minds are on it.' },
    { say: 'Mayor Hallam', t: 'The Choir? Generous pilgrims! Very generous. Very… persuasive. Good day, traveller.' },
  ],
  // ================================================================ THE WEEPING GROTTO
  grottoIntro: [
    { caption: 'The Weeping Grotto' },
    { narr: 'Water drips from coral-crusted stone. Far below, the sea breathes in and out — and with every breath, the cave weeps a low, mournful note.' },
    { narr: 'And beneath it, faint as a dream, a girl is singing.' },
  ],
  ghost: [
    { if: 'quest:lookout=done', then: [{ narr: 'Only the drip of water remains where the lookout stood. His watch is over.' }, { stop: true }] },
    { if: 'quest:lookout=active', then: [{ say: 'Drowned Lookout', t: 'Brenna… on the beach, by the nets. Tell her I kept the watch.' }, { stop: true }] },
    { say: 'Drowned Lookout', t: 'Halt! Who goes— oh. You can see me? Nobody can see me.' },
    { say: 'Drowned Lookout', t: 'Davy Marsh, night lookout. I followed a falling light in here three weeks back. The grey singers caught me by the stairs.' },
    { say: 'Drowned Lookout', t: 'They\'ve got the singing girl down below, in their drowned chapel. The stairs are north, past the coral hall.' },
    { say: 'Drowned Lookout', t: 'Would you do a dead man a kindness? Take my badge to my wife, Brenna. She\'ll be on the beach, mending nets. She\'s always mending nets.' },
    { give: 'badge' }, { narr: 'Received Davy\'s Watch Badge!' }, { quest: 'lookout', state: 'active' },
  ],
  sanctumIntro: [
    { caption: 'Sanctum of the Drowned Choir' },
    { narr: 'A chapel, swallowed by the sea long ago. Pews rot under green water. And from the altar ahead rises the Requiem — a hundred voices, singing a light to death.' },
    { tut: 'shrine2' },
  ],
  cantorApproach: [
    { narr: 'Ione hangs in chains of grey light above the altar. Each note of the Requiem pulls a thread of blue light from her chest.' },
    { say: 'Ione', t: '{hero}…? No — go back! He wants you too!' },
  ],
  cantorBoss: [
    { music: 'none' },
    { say: 'Cantor Mordane', t: 'Ahh. The second spark has come to the concert. How wonderfully punctual.' },
    { say: 'Cantor Mordane', t: 'Do you know what a star is, child? A wound in the sky that will not close. We are the Choir that closes it.' },
    { say: 'Cantor Mordane', t: 'Her Tideshard is nearly sung out. Shall I conduct you next? I think… a minor key.' },
    { choice: ['Let her go, Mordane.', 'Your concert is over.'], then: [[{ say: 'Cantor Mordane', t: 'No.' }], [{ say: 'Cantor Mordane', t: 'Oh, I do like you. Acolytes — from the top!' }]] },
    { battle: ['acolyte', 'cantor', 'acolyte'], boss: true, bg: 'bg_choir', music: 'boss2', noFlee: true },
    { set: 'grottoDone' }, { call: 'cantorAfter' },
  ],
  cantorAfter: [
    { music: 'cliff' },
    { narr: 'Mordane staggers. His baton cracks in two, and the Requiem collapses into a hundred frightened silences.' },
    { say: 'Cantor Mordane', t: 'Hah… haha… You think this ends with me? I am one voice. The Choir is legion.' },
    { say: 'Cantor Mordane', t: 'And you think Vesper commands us? Poor little spark. Vesper is but a blade…' },
    { say: 'Cantor Mordane', t: '…and the hand that holds it wears a halo still.' },
    { fx: 'cantorFade' }, { npc: 'cantor', show: false },
    { narr: 'He crumbles into grey ash, and the sea takes it.' },
    { fx: 'shardRestore' }, { sfx: 'star' },
    { narr: 'The chains of grey light shatter. A sea-blue shard of light — the Tideshard — sinks gently back into Ione\'s chest.' },
    { say: 'Ione', t: 'I… I remember. The Spire. The fall. My name — my real name — is Ione. It always was. The sea kept it for me.' },
    { say: 'Ione', t: 'I am the Warden of the Tides. And you\'re {hero}. You were the newest of us. Solenne crowned you the night everything broke.' },
    { choice: ['A halo still… what did he mean?', 'Are you all right?'], then: [
      [{ say: 'Ione', t: 'Only Wardens wear halos. If someone still has theirs, then someone up there never fell… and is helping Vesper.' }],
      [{ say: 'Ione', t: 'I\'m alive. I\'m myself. And I\'m angry. That\'s a very good start.' }, { say: 'Ione', t: 'But that thing he said — "a halo still"… only Wardens wear halos. Someone who never fell is helping Vesper.' }]] },
    { say: 'Ione', t: 'I can\'t go back to singing in a tavern, not now. Take me with you. A Bard\'s song can turn a battle — and mine can turn the sea.' },
    { join: 'ione' }, { give: 'tideShard' }, { quest: 'main2c', state: 'done' },
    { say: 'Ione', t: 'First, though… there\'s a lighthouse that has been waiting three weeks for its song. Let\'s go home.' },
    { fade: 'out', ms: 1200 },
    { warp: 'saltmere', x: 34, y: 7, dir: 3 },
    { call: 'relight' },
  ],
  relight: [
    { set: 'relit' }, { npc: 'hallamL', show: true },
    { fade: 'in', ms: 1200 }, { music: 'none' },
    { narr: 'Night over Saltmere. The whole town has gathered on the cliff path, lanterns in hand, watching the dark tower.' },
    { say: 'Ione', t: 'Stand with me, {hero}. Lend me a little of your light. Just a little.' },
    { fx: 'song' }, { wait: 900 }, { fx: 'beam' }, { music: 'title' },
    { narr: 'Ione sings. The Tideshard answers. And two hundred years of light pour out of the lighthouse at once, sweeping across the bay.' },
    { narr: 'Out on the black water, a lost fishing boat turns its prow toward home.' },
    { fx: 'nightOff' }, { set: 'relit' },
    { say: 'Mayor Hallam', t: 'I… I owe you a debt this town cannot pay. And an apology I don\'t deserve to make.' },
    { say: 'Mayor Hallam', t: 'Take this. My father\'s sword, forged here in Saltmere — and every coin the Choir paid me. It was never mine.' },
    { give: 'steelsword' }, { gold: 400 }, { narr: 'Received the Saltsteel Sword and 400 gold!' },
    { say: 'Ione', t: 'The Choir came from somewhere. Their hymns all end with the same word — Kragmoor. The mountain city past Cinder Pass.' },
    { say: 'Ione', t: 'If someone with a halo is pulling Vesper\'s strings, the answer is there. …And {hero}? Thank you for listening to me sing.' },
    { set: 'chapter2Done' }, { quest: 'main3', state: 'active' },
    { end: 'chapter', chapter: 2 },
  ],
};

/** Extra tutorials introduced in Chapter II. */
export const TUTORIALS2: Record<string, { title: string; body: string; icon?: string }> = {
  vocation: { title: 'Vocations', body: 'Speak with Abbess Maren to change any party member\'s vocation.\n\nEach vocation levels up separately, and every ability learned stays with the hero — mix and match!\n\nNew: PALADIN · RANGER · BARD' },
  shrine2: { title: 'Autosave', body: 'Your adventure saves automatically when you change areas, after battles and at story moments.\n\nStar-Shrines still heal your party — and Menu → Save lets you save any time.', icon: 'crystal' },
};
export const QUESTS3: Record<string, { name: string; desc: string; done?: string }> = {
  main3: { name: 'The Ashen Cathedral', desc: 'The Ashen Choir\'s hymns all end with one word: Kragmoor, the mountain city beyond Cinder Pass. (Chapter III — coming in a future update.)' },
};
