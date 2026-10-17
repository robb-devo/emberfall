# EMBERFALL — Design Document (v0.2)

*A pocket JRPG in the spirit of Dragon Quest IX with an Octopath-style HD-2D look. You play a fallen Star-Warden, now mortal, gathering the lights that fell from the sky.*

This document covers the **first 2–4 hours**: Chapters I–IV, the systems they introduce, and the pacing rules behind them. **Chapters I and II are implemented and playable in v0.2.0.** Chapters III and IV are designed here so later rounds can build them.

---

## 1. Pillars

1. **Warm tone, sharp edges.** The dialogue is Dragon-Quest kind and funny, and every chapter ends on a quiet gut-punch. Villagers say something new after each story beat.
2. **One town, one problem, one dungeon, one boss.** Each chapter is a self-contained episode, like DQ9's town stories. The Warden-Shard arc runs through all of them.
3. **The world is a diorama.** HD-2D: pixel sprites, tilt-shift depth of field, bloom, dynamic point lights, a day/night grade, weather particles. Everything is generated procedurally on canvas, so the APK stays tiny.
4. **Respect the phone.** Portrait, one thumb. Every screen has the same Back button (top-left pill plus Android hardware back). The game autosaves, and you never lose more than a few steps.
5. **Party = you.** The hero is yours: paper-doll customisation, and gear shows on the sprite. Story companions join for chapters. The *tavern* of custom companions is a late reward (end of Chapter I) and stays a side feature, so the story comes first.

## 2. Pacing overview

| Chapter | Title | Location(s) | Length | Party lvl | New system | Status |
|---|---|---|---|---|---|---|
| I | The Fallen Star | Hollowmere, Fields, Hollow, Lair | 25–35 min | 1 → 7 | Battle, equipment, shops, quests, save shrines, Tavern (reward) | ✅ v0.1 |
| II | The Drowned Choir | Emberwood Road, Saltmere, Weeping Grotto, Sanctum | 45–70 min | 7 → 12 | **Vocations** (Chapel of Alltrades), story ally (Ione), night cycle, side quests | ✅ v0.2 |
| III | The Clockwork Orchard | Brassvale, Orchard Mill, Gearwood | 45–60 min | 12 → 16 | **Alchemy Pot** (crafting), status ailments, mounts (Turnip the mule as fast travel) | 📝 designed |
| IV | The Ledger of Ash | Vesper's Abbey, Ashfall Pass | 40–60 min | 16 → 20 | **Skill points/trees**, metal-slime-style rare foes, first Vesper fight | 📝 designed |

Chapters I–IV come to about **2.5–4 h** for a normal player, including side quests and roughly 25% optional exploration.

## 3. Chapter I — The Fallen Star (implemented)

**Hook:** a guardian of Hollowmere falls from the heavens during the Ember Festival, betrayed by **Vesper**, a fellow Warden who stole her halo.
**Flow:**
- Wake at Mira's house and meet Elder Bram.
- Shop tutorial, then Mira's locket side quest.
- Whisperfield (symbol encounters, first save shrine).
- Hollow Cave (chests, a light puzzle).
- **The Hollow Warden**, a boss corrupted by a Warden-Shard.
- Cliffhanger: Vesper is "collecting".
- Homecoming: the Elder's ledger opens Dahlia's Tavern, and the village festival finale ends the chapter.
**Taught:** movement (8-dir), talk, Attack, Spells, Items, Defend, Flee, equipment preview, autosave and shrines.

## 4. Chapter II — The Drowned Choir (implemented in v0.2)

**Theme:** grief that turns into control. The **Ashen Choir** promises to "sing the drowned home"; it is actually draining the light of a fallen Warden to keep a dead lighthouse dark so ships wreck and the faithful stay afraid.

### Beat sheet
1. **Dawn (Hollowmere).** Bram watched one falling light hit the sea near Saltmere, and the lighthouse went dark the same night. He hands over a *letter for the Abbess Maren*. The east bridge opens. *(main2)*
2. **Emberwood Road.** Autumn forest with watchtower ruins, a mushroom grove and a brook. New foes: Ashwolf, Mossling, Bramblewisp, Gloomowl.
   - **Pell the Peddler** lost his mule *Turnip* (side quest *mule*). Turnip is in the mushroom grove; bringing him back opens Pell's road shop with a discount.
   - A Choir pilgrim on the road foreshadows the cult.
3. **Saltmere (day).** A harbour town with a dark lighthouse.
   - The Choir preaches in the square, and **Mayor Hallam** is oddly supportive.
   - Shops: Saltsteel weapons, armour, items.
   - Side quests: Old Salt's *pearls* trade (Brinecrab drops) and Brenna's lost *lookout* (finishes in the grotto).
4. **Chapel of Alltrades.** Abbess **Maren**, Bram's old comrade, reads the letter.
   - **Vocations unlock** (Paladin, Ranger, Bard plus the four starters).
   - She tells of the girl who walked out of the surf: **Ione**. *(main2b)*
5. **The Gull & Anchor.** Ione sings, the tide turns early, and she remembers nothing. She pays for the hero's room.
6. **Night of the abduction.** The town goes dark and quiet.
   - You wake to see the Choir and Mordane taking Ione into the cave under the cliff, with **Hallam watching**.
   - The Harbour Watch has left the cave mouth. *(main2c)*
   - At night the music changes, NPCs say new things, and Hallam confesses if you confront him.
7. **The Weeping Grotto.** A two-floor sea cave with glowing coral lights, tide pools and the lookout's ghost (who gives Davy's Watch Badge → Brenna's reward). New foes: Lantern Jelly, Drowned Sailor, Siren, Brinecrab. There is a save crystal before the sanctum.
8. **Boss: Cantor Mordane** (+2 Choir Acolytes) at the Sanctum altar.
   - Moves: *Requiem* (one-turn charge, then a party-wide hit), *Ash Hymn* (dark), *Dirge* (weaken), *Encore* (self-heal under 60%), *Lacrimosa* (sleep).
   - **Mid-battle moment:** at 40% HP Ione's song breaks through. She heals the party and shatters his guard (the DQ "story turn" inside a fight).
9. **Aftermath.**
   - Mordane fades and says one line that points at a bigger hand ("*Solenne* will sing over all of you").
   - Ione restores her shard, remembers she is the **Warden of Tides**, and **joins the party** (Bard, with *Tidesong*).
10. **Relight.** On the lighthouse gallery, Hallam's apology and Ione's song relight the beam, and night lifts. Reward: Steel Sword + 400 G. **End of Chapter II.** Free roam continues in Saltmere. *(main3 opens)*

### Encounter & balance targets
- Road: Lv7–9; Coast/Grotto: Lv9–11; boss tuned for Lv10–12, a party of 3 plus Ione's mid-fight heal.
- About 10–14 battles from Hollowmere to the boss for a player who doesn't grind. Symbol encounters on the map let players dodge foes.
- Gold curve: Saltsteel gear costs about 1.5× a full Chapter I run, so players buy 1–2 key pieces and loot the rest.

### Vocations (DQ9 rules)
- Each vocation levels separately. Switching returns you to that vocation's level (Lv1 if new).
- **Learned spells and abilities are kept** across vocations, so switching is rewarded, not punished.
- Gear the new vocation can't use goes back to the bag, and the preview shows stats before you confirm.

| Vocation | Role | Signature |
|---|---|---|
| Warrior | front line | Power Slash |
| Mage | elemental damage | Frizz / Starfall |
| Priest | healing | Heal / Bless |
| Thief | speed, steal | Steal / Venom |
| **Paladin** | tank | Holy Strike, Bulwark, **Cover**, Judgement |
| **Ranger** | crits, multi-hit, field heal | Aimed Shot, Twin Fang, Herbcraft, Wild Rush |
| **Bard** | buffs, sleep, group heal | Valor, Lullaby, Tide Hymn, Discord |

## 5. Chapter III — The Clockwork Orchard (designed)

**Theme:** progress without a heart. **Brassvale**, a hill town, replaced its orchard workers with clockwork pickers powered by a Warden-Shard. Now the pickers "harvest" anything that moves.
1. Ione senses a shard inland. Turnip the mule now offers **fast travel** between visited towns (the mule bell key item).
2. **Brassvale:** the inventor **Odo Tink** and his estranged daughter **Lark**, a Ranger who will join for the chapter. Lark's mother died in the first mill accident.
3. **Alchemy Pot** unlocked at Tink's workshop. Recipes come from books and NPC hints, plus "mystery" combos (DQ9 Krak Pot).
4. **Gearwood** (field): rolling hills and windmills; new status ailments (Rust = DEF down, Static = paralysis).
5. **Orchard Mill** dungeon with conveyor puzzles (switch tiles that change the direction of moving floors).
6. **Boss: The Harvester**, a two-phase machine. Phase 2 starts when Lark shoots the core.
7. Twist: Tink built the Harvester *for Solenne's Choir*. Lark chooses to stay and rebuild, while Tink goes to prison and gives the party his journal.

## 6. Chapter IV — The Ledger of Ash (designed)

**Theme:** what the Wardens owe the people below.
1. Following Tink's journal into the mountains: **Ashfall Pass** (snow and ash; a weather system with snow particles).
2. **Vesper's Abbey:** Vesper is *not* the master. She is collecting shards to keep them from **Solenne**, who wants to "re-ignite" the heavens by burning the mortal world.
3. **Skill points:** every level grants points to spend in weapon/vocation trees (DQ9 style).
4. Rare foes: the **Ember Imp** (metal-slime style: flees, huge XP).
5. **Boss: Vesper** (a fight you aren't meant to win outright). At 30% she stops, gives back the hero's halo fragment, and leaves with the rest. The party learns where Solenne's Cathedral is → Act 2.

## 7. Systems added in v0.2

### Saves (fixes the v0.1 save loss)
- 3 **Adventure Logs** (slots).
- Each record is a versioned envelope `{v, ts, sum, data}` with an FNV checksum, plus a structural validator (party, vocations, maps, numbers).
- **Never overwrite with a corrupt state.**
  - An invalid state is refused before writing.
  - The previous good record is copied to `slotN.bak` before every write.
  - Every write is read back and verified, and the old one is restored if the check fails.
- A damaged current record **falls back to the backup automatically** and is re-saved.
- v0.1 saves are imported once and the original is left untouched.
- **Autosave** runs after map changes, battles, chests, quest changes, shops, inns, vocation changes and the end of a chapter (rate-limited). A **suspend save** runs when the app goes to the background or the page is hidden (Capacitor `pause` + `visibilitychange`).
- Overwriting a different hero's log asks for confirmation. "New Game" never touches the existing logs unless you choose that slot and confirm.

### Unified Back
- A single **Back pill** (top-left, same style everywhere) is driven by the input focus stack and appears whenever the top-most menu can be cancelled.
- The **Android hardware back** button routes to the same action.
- On the world map with no menu open, back opens the field menu. On the title screen it minimises the app instead of killing it (the state is suspend-saved first). During dialogue and cutscenes, back is ignored, so it can never skip a story beat or break a script.

### Movement
- **8 directions** with a virtual joystick or keys. Diagonal steps won't cut corners past walls, and the sprite uses the nearest facing.

## 8. Art direction notes (HD-2D)
- **Characters:** paper-doll layers (body, outfit, hair, head gear, weapon, shield), generated per look and gear, with an EPX-upscaled `_hd` variant for battle.
- **Monsters:** 48 px (bosses 64 px) hand-written pixel recipes with rim light, 3-tone shading and a selective outline.
- **Environments:**
  - Voronoi cobble, rippled sand and layered animated sea tiles.
  - Per-map diorama grade (tint, vignette, tilt-shift), point lights (torches, windows, glowing coral), and ambient particles (leaves, gulls, bubbles, fireflies, embers).
  - Night grade for story nights.
- **Battle backdrops:** 360×240 painted panoramas per region (road, coast, grotto, choir), parallax-ready.

## 9. Content checklist for Chapter III (next round)
- [ ] Maps: Brassvale (town), Gearwood (field), Orchard Mill (2 floors), boss arena
- [ ] Foes: 8 new + Harvester (2 phases)
- [ ] Lark story member (Ranger), Odo Tink, 12 villagers
- [ ] Alchemy Pot UI + 20 recipes
- [ ] Mule fast-travel menu
- [ ] Music: brassvale, mill, boss3
