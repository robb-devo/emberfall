# EMBERFALL — Chapters I–II: *The Fallen Star* · *The Drowned Choir*

An English-language mobile JRPG in the spirit of **Dragon Quest IX**, with an
**Octopath Traveler 2–style HD-2D look**. Built with TypeScript + Vite + Phaser 3, wrapped for
Android with Capacitor.

> You were a Star-Warden, a guardian with a halo of starlight, until the Archon you served
> betrayed the Spire. Now you've fallen to the mortal world without your powers. A cave is
> burning, a village is afraid, and the old elder knows more than he admits.

## New in v0.4
- **Real 3D diorama:** a Three.js renderer mirrors the Phaser world. Houses, walls and trees have volume, cast sun shadows and occlude properly.
  The camera is a tilted perspective one, and an x-ray silhouette shows the party behind buildings. Settings → Fast mode still skips the post effects.
- **Analog movement:** a floating joystick with a dead-zone, eased acceleration and braking, wall sliding, corner nudging, breadcrumb followers and a look-ahead camera.
- **Item detail panel** in Items and in shops: an icon, lore, what the item does, and per-member stat comparisons with ▲/▼ arrows.
- **Underwear layer** when no body armour is worn, plus joke underwear (Heart Boxers, Slime Briefs). Creator option: Figure.
- **Settings → Adult** (18+, off by default) is the single switch for mature content. Right now it covers bare (featureless) party bodies and battle blood. Ideas for more are in `docs/ADULT_IDEAS.md`.
- **Story:** Chapter I rewritten with a clear hook. Chapter II polished to the same voice.
- **Fix:** Enter now works on the chapter-end screen.

## Play
* **Android:** install `app-debug.apk` from the [Releases](../../releases) page.
* **Browser:** `npm i && npm run dev`, then open on your phone (portrait).

Controls: virtual joystick + ✦ action button (touch), or arrows/WASD + Enter/Space, Esc = menu.

## Chapter I: The Fallen Star (~25–35 min)
Title → hero creation → prologue in the Sky Spire (betrayal and the fall) → Hollowmere village
(inn, shop, elder, NPCs, side quest) → Whisperwind Vale (symbol encounters, grinding)
→ Cinderdeep Hollow dungeon (save shrine, chests) → **boss: The Hollow Warden** → cliffhanger →
the tavern unlocks: create custom companions and form a party of 4 → night finale.

Tutorial cards cover movement, talking, battle commands, XP/levels, gold, equipment, healing
and saving.

## Chapter II: The Drowned Choir (~45–70 min), new in v0.2
Bram's letter sends you east along the **Emberwood Road** (find Pell's runaway mule Turnip) to
the harbour town of **Saltmere**. Its lighthouse has been dark since a star fell into the bay.
* Abbess Maren at the **Chapel of Alltrades** unlocks **vocation changes** (Paladin, Ranger and Bard
  are new; each vocation levels separately and learned skills are kept).
* A girl with no memory sings at the Gull & Anchor. After a free night at the inn, the Ashen
  Choir takes her into the **Weeping Grotto**.
* Two cave floors, a ghostly lookout, and then **boss: Cantor Mordane**, with a story turn in the middle of the battle.
  Ione, Warden of Tides, joins the party, and the lighthouse is relit.
* Side quests: Turnip the mule, Old Salt's pearls, the lost lookout. There are 9 new monsters and 3 new shops.

The full plan for the first 2–4 hours (Chapters I–IV) is in **[docs/DESIGN.md](docs/DESIGN.md)**.

## Saving (v0.2)
* 3 **Adventure Logs**. Each record is versioned and checksummed, with a **backup copy** per slot.
* A damaged or invalid state is never written. Every write is verified by reading it back, and a
  corrupt slot falls back to its backup automatically.
* **Autosave** after map changes, battles, chests, quests, shops, inns and vocation changes, plus a
  **suspend save** when the app goes to the background.
* v0.1 saves are imported automatically.

## Controls (v0.2)
* **8-direction movement** (joystick or keys). Diagonals never cut corners.
* One **◀ Back** button (top-left) on every menu and screen. The **Android back button** does the same, and
  on the field it opens the menu instead of closing the game.

## Systems
| System | Where |
|---|---|
| 7 vocations (Warrior, Mage, Priest, Thief, Paladin, Ranger, Bard), per-vocation levels, skills | `src/data/vocations.ts`, `skills.ts` |
| Items and equipment (5 slots) | `src/data/items.ts` |
| Layered **paper-doll sprites**: every piece of gear shows up on the overworld, in battle and in shop previews | `src/systems/paperdoll.ts` |
| Full character creator (body, skin, hair style/colour, eyes, face, outfit colours, vocation) | `src/scenes/CreateScene.ts` |
| Turn-based battles, OT2-style side view, buffs, poison, boss phases | `src/scenes/BattleScene.ts` |
| Maps (ASCII), NPCs, warps, chests, triggers, roaming monsters | `src/data/maps.ts`, `WorldScene.ts` |
| Script/cutscene engine, quests, tutorials | `src/data/story.ts`, `src/systems/script.ts` |
| Original chiptune score (11 tracks) + procedural SFX (WebAudio) | `src/data/music.ts`, `src/systems/audio.ts` |
| Save system (3 logs, checksum, backup, autosave, migration) | `src/systems/state.ts` |

## HD-2D rendering
All art is drawn by code at boot (no image files). On top of that:
* **Diorama post-process** (`src/fx/diorama.ts`): one full-screen WebGL pass that adds a
  pseudo-3D tilted perspective, **tilt-shift depth of field**, bloom, drifting volumetric light shafts,
  warm/cool colour grading, horizon fog and vignette. There is a preset for each area type.
* Dynamic point lights (lamps, torches, crystals), soft shadows, fireflies, embers, dust,
  animated water and grass.
* Battle: blurred cinematic backdrops, light shafts, foreground bokeh silhouettes, and
  **EPX-upscaled, rim-lit monster sprites** at large size.
* **Prop overlay tiles** (`src/systems/props.ts`): bushes, signs, lamps, crates, posts and rocks are cut out and drawn over whatever ground they stand on, with grass and leaf fringes blending cobble, sand and paths.
* Settings → Graphics: `HD-2D` / `Fast`, for weaker phones.

## Extending
Add a map in `maps.ts`, enemies and encounter tables in `enemies.ts`, dialogue in `story.ts`
(scripts are lists of commands), and songs in `music.ts`.

## Tests
Run `npm run dev`, then:
* `node tests/playthrough.mjs`: Playwright plays Chapter I (creation → boss → party → ending → Chapter II dawn).
* `node tests/playthrough2.mjs`: plays Chapter II from the road to the Cantor and the relit lighthouse.
* `node tests/save.mjs`: save robustness (corruption, backup fallback, legacy import, slot safety) and the v0.1 save-loss regression (menu tour + Android back, progress already on disk).
* `node tests/battle-smoke.mjs`: battles at normal speed (hit-stop, camera punch, kill FX, victory).
* `node tests/fuzz-menus.mjs`: random walks through every menu path, checking that saves are never lost.
* `node tests/maps-check.mjs` and `node tests/data-check.mjs`: static checks of maps and story data.

## Build the APK
```
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```
(Capacitor CLI needs Node ≥ 22.)
