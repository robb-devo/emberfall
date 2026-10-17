# EMBERFALL: Adult Mode Brainstorm (ideas only, NOT implemented)

Everything here would sit behind the single **Settings → Adult** switch, which is off by default and asks for an 18+ confirmation.
The aim is the weight of Berserk or Dark Souls: grief, guilt, rot and consequence, written with restraint.
Darkness should cost the player something emotionally. It should never be shock for its own sake.

**Hard lines for every idea below:** no sexual violence, nothing sexual involving minors, no real-world hate groups or slurs, and no torture shown on screen
(we show the *aftermath* and the people who carry it). When Adult is off, each quest falls back to a toned-down variant
or simply isn't offered.

---

## 1. Dark quest concepts

### 1. The Ash Tithe (Saltmere, after Ch. II)
- **Premise:** Mayor Hallam's "tithe" to the Choir was not only silver. Before Ione, he handed over seven drifters nobody would miss.
  Their names are carved under the pews of the drowned chapel, and the sea has kept their bones.
- **Play:** Recover the names and decide what to do with Hallam. Expose him (the town tears itself apart, and the boats stop going out again),
  bury it (he keeps doing good, and you carry the lie), or let Brenna judge him.
- **No good answer:** The town needs him, and the dead deserve the truth. All three endings change Saltmere's NPC lines for good.
- **Hook:** This reframes Hallam's apology and seeds the theme that ordinary cowardice is what feeds the Choir.

### 2. The Field Surgeon of Cinder Pass
- **Premise:** A war camp from the old border war is still running because nobody told it the war ended twenty years ago.
  Its surgeon, Mother Ashgrave, keeps "fixing" soldiers with embersteel splints that slowly turn flesh to slag.
- **Play:** Walk the ward and talk to the patients. Some beg for the splints. Others beg you to take them off, which will kill them.
- **Body horror:** The splints are beautiful. Glowing seams, hands that crackle like embers.
- **Hook:** Embersteel is fallen star-metal. Ashgrave is unknowingly running on a Heartstar shard buried under the camp.

### 3. Penance Road
- **Premise:** A procession of flagellants walks the Emberwood Road, carrying a sealed coffin toward Kragmoor.
  They believe the stars fell because of *their* sins.
- **Play:** A sympathetic pilgrim asks you to find out what is in the coffin. Inside is no body, only every letter the pilgrims ever wrote home and never sent.
- **Theme:** Guilt as an addiction. The cult gives people somewhere to put grief they can't carry.
- **Hook:** The Ashen Choir recruits from the broken. This shows its *pull* rather than only its villains.

### 4. The Hanged Choirboy's Father (adult grief, no child on screen)
- **Premise:** A widower in Kragmoor's lower city lost his grown son to the Choir's Requiem rite. The son chose to go.
  The father has been building a mechanical bird that sings in his son's voice, using a wax cylinder recording.
- **Play:** Help him finish it. When it sings, it sings the Requiem, because that was the last thing the son ever recorded.
- **Choice:** Smash the bird, or let him keep it, knowing he'll listen to the Choir's hymn every night for the rest of his life.

### 5. Starmilk
- **Premise:** A narcotic distilled from Heartstar dust is spreading through Saltmere's docks.
  Users glow faintly and feel *what a Warden feels*. Without it, their skin greys and cracks.
- **Play:** Find the source, a fallen Warden named Caddoc who is selling his own light to survive, and decide whether to take his shard.
  Taking it cures the town's supply and leaves a hundred people in brutal withdrawal. Leaving it means Caddoc keeps bleeding himself dry.
- **Theme:** Addiction from both sides. The dealer is also a victim.

### 6. The Ossuary Census
- **Premise:** Beneath Kragmoor, the Choir has been "cataloguing" the dead. Every corpse is labelled with the date it stopped
  believing in the stars.
- **Play:** A puzzle dungeon of drawers, ledgers and bone-walls. The final drawer carries a fresh label with the player's name and *tomorrow's* date.
- **Hook:** This foreshadows the traitor with a halo, who can see futures.

### 7. The Mercy Knight
- **Premise:** Ser Hollis, a decorated knight, ordered a burning village sealed to stop a plague. It worked, and three hundred people died inside.
  He is now an honoured hero and a drunk.
- **Play:** Survivors want him tried. The kingdom wants him kept as a symbol. Hollis wants you to kill him in a duel and call it an accident.
- **No good answer:** Each option changes how a later army treats the party.
- **Hook:** This mirrors Bram, who gave up his halo to stop a plague. Same choice, different price.

### 8. What the Warden Left Behind
- **Premise:** A fallen Warden landed in the middle of a battlefield and, in a panic, *burned* both armies.
  She now lives as a hermit beside the glassed field, tending a garden of melted helmets.
- **Play:** Survivors and ghosts on both sides each want something from her. She wants to be forgiven by someone who has the right to forgive her.
- **Theme:** Power without wisdom. It is the best argument *for* Vesper's view that Wardens can't be trusted, and it should make the player waver.

### 9. The Puppet Saint
- **Premise:** A town worships a living saint who heals the sick. She is a corpse, kept moving by a Choir acolyte with star-thread,
  because the town will collapse if she "dies".
- **Body horror:** Up close, the stitches show, and so does the thread running into her mouth.
- **Choice:** Cut the threads publicly, cut them privately and stage a peaceful death, or let the lie keep healing people.
  The healing is real, powered by a stolen shard.

### 10. Vesper's Ledger
- **Premise:** A side chain where you find pages of Vesper's journal from her apprentice years.
  She logged every disaster the Spire watched and did nothing about, with names, ages and causes, in neat handwriting.
- **Play:** Visit three of the places she wrote about. Each one really happened, and the Spire really did nothing.
- **Hook:** This makes Vesper tragic, not cartoonish, and could unlock an optional dialogue path at the end of the game.

### 11. The Winter Tribunal
- **Premise:** Mountain villagers trapped by snow resorted to eating their dead (implied, never shown).
  A magistrate arrives to hang them all.
- **Play:** Hear testimony and weigh it. The quest is about shame, survival and who gets to judge.

### 12. The Choir's Lullaby (late game)
- **Premise:** The party is captured, and the Requiem starts to work on a companion. Their stats and dialogue slowly grey out over a whole dungeon.
- **Play:** The companion can be lost *permanently* unless you make a costly sacrifice, such as giving up a hard-won Heartstar shard.

---

## 2. Gore and battle VFX (Adult on)

Already implemented: **dark-red droplet bursts with gravity** on hits and kills (`BattleScene.gore()`).

Ideas:
- **Wound states:** monster sprites get 1-2 "wounded" overlay frames (cracked shell, torn wing, ichor drip) at <50% and <20% HP.
- **Material-aware blood:** red for beasts, black tar for Choir, glowing ember for embersteel golems, sap for plants,
  and cold blue light for fallen-Warden enemies.
- **Finisher kills:** a crit on the killing blow triggers a 0.4s slow-mo, a splat decal on the battle floor and a screen-edge blood vignette.
- **Lingering decals:** battle-floor stains persist until the battle ends. In the world, a stain fades at the spot where you fought a symbol monster.
- **Body-horror bosses:** Mother Ashgrave's slag-limbs crack off as her HP drops. The Puppet Saint loses threads as you hit her and slumps limb by limb.
- **Requiem damage:** sound damage shows as the character's sprite *desaturating* and blurring, with blood from the ears drawn as 2 pixels.
- **Party KO:** instead of a clean fade, a fallen ally slumps with a small pool spreading under them. It reverses on revive.
- **Executions (dark choices only):** fade to black on the blow, then show the aftermath. Never the act itself.

## 3. Crude humour (Adult on)
- Joke underwear lore lines get ruder (`itemlore.ts` variant table).
- Turnip the mule's "Hee-HAW" becomes a mood-ranked set of insults only Ione can translate.
- Tavern drunks get an Adult line set, and Snoring Fisherman's dreams become filthier but stay non-sexual.

---

## 4. Dark companion backstories

### Brother Kael, Paladin (ex-Inquisitor)
Kael burned "star-witches" for the old church before he understood they were simply sick.
His shield is engraved with the names of everyone he burned. He adds a name each time he saves someone, and he has never caught up.
**Hook:** The Choir offers him absolution. In the late game he must choose between it and staying with the party.

### Nim, Ranger (deserter)
Nim was the sole survivor of a scouting unit sent into a pass the generals *knew* was a trap.
She keeps the unit's dog tags and talks to them at camp. Under Adult mode her night-camp scenes are blunt about the nightmares and the drinking.
**Hook:** The general who sent them now commands Kragmoor's garrison.

### Old Sorrel, Priest (failed healer)
Sorrel prayed over a plague ward for a month while patients died around him. Then Bram, a stranger at the time, healed them all in a single night by giving up his halo.
Sorrel has spent fifty years hating the man who did the miracle he couldn't.
**Hook:** A slow-burn rivalry with Bram, resolved (or not) in Hollowmere.

### Marrow-Jack, Thief (body-horror)
Marrow-Jack swallowed a sliver of Heartstar dust in a dockside bet. It is slowly turning his bones to glass.
He is funny, reckless and dying. He takes the hits nobody else will.
**Hook:** His shard is one of the pieces Vesper needs. Saving him and completing the Heartstar can't both happen.

---

## 5. How it hooks into Emberfall's story
- **Core theme:** *Is watching without acting a crime?* Vesper says yes. Bram says sacrifice is worth it. The Adult quests stress-test both answers.
- **The haloed traitor:** Quests 6, 10 and 12 drop clues about who on the Spire never fell.
- **Choir as a mirror of grief:** Quests 3, 4 and 9 show *why* people join. That makes the Ashen Choir a tragedy, not just a horde.
- **Shards have a cost:** Quests 2, 5 and 9 and Marrow-Jack make every Heartstar shard a moral choice instead of a pickup.
- **Implementation notes (future):** a `mature: true` flag on script steps and quests. ScriptRunner skips or replaces steps when `!Mature.on`.
  Each dark quest needs a non-Adult fallback line so the world map still makes sense.
