# EMBERFALL — Chapter 1: *The Fallen Star*

An English-language mobile JRPG in the spirit of **Dragon Quest IX**, with an
**Octopath Traveler 2–style HD-2D look**. Built with TypeScript + Vite + Phaser 3, wrapped for
Android with Capacitor.

> You were a Star-Warden, a guardian with a halo of starlight, until the Archon you served
> betrayed the Spire. Now you've fallen to the mortal world without your powers. A cave is
> burning, a village is afraid, and the old elder knows more than he admits.

## Play
* **Android:** install `app-debug.apk` from the [Releases](../../releases) page.
* **Browser:** `npm i && npm run dev`, then open on your phone (portrait).

Controls: virtual joystick + ✦ action button (touch), or arrows/WASD + Enter/Space, Esc = menu.

## The opening chapter (~25 min)
Title → hero creation → prologue in the Sky Spire (betrayal and the fall) → Hollowmere village
(inn, shop, elder, NPCs, side quest) → Whisperwind Vale (symbol encounters, grinding)
→ Cinderdeep Hollow dungeon (save shrine, chests) → **boss: The Hollow Warden** → cliffhanger →
the tavern unlocks: create custom companions and form a party of 4 → night finale.

Tutorial cards cover movement, talking, battle commands, XP/levels, gold, equipment, healing
and saving.

## Systems
| System | Where |
|---|---|
| Vocations (Warrior, Mage, Priest, Thief), stat growth, skills | `src/data/vocations.ts`, `skills.ts` |
| Items and equipment (5 slots) | `src/data/items.ts` |
| Layered **paper-doll sprites**: every piece of gear shows up on the overworld, in battle and in shop previews | `src/systems/paperdoll.ts` |
| Full character creator (body, skin, hair style/colour, eyes, face, outfit colours, vocation) | `src/scenes/CreateScene.ts` |
| Turn-based battles, OT2-style side view, buffs, poison, boss phases | `src/scenes/BattleScene.ts` |
| Maps (ASCII), NPCs, warps, chests, triggers, roaming monsters | `src/data/maps.ts`, `WorldScene.ts` |
| Script/cutscene engine, quests, tutorials | `src/data/story.ts`, `src/systems/script.ts` |
| Original chiptune score (11 tracks) + procedural SFX (WebAudio) | `src/data/music.ts`, `src/systems/audio.ts` |
| Save/load (localStorage), save shrines, inn | `src/systems/state.ts` |

## HD-2D rendering
All art is drawn by code at boot (no image files). On top of that:
* **Diorama post-process** (`src/fx/diorama.ts`): one full-screen WebGL pass that adds a
  pseudo-3D tilted perspective, **tilt-shift depth of field**, bloom, drifting volumetric light shafts,
  warm/cool colour grading, horizon fog and vignette. There is a preset for each area type.
* Dynamic point lights (lamps, torches, crystals), soft shadows, fireflies, embers, dust,
  animated water and grass.
* Battle: blurred cinematic backdrops, light shafts, foreground bokeh silhouettes, and
  **EPX-upscaled, rim-lit monster sprites** at large size.
* Settings → Graphics: `HD-2D` / `Fast`, for weaker phones.

## Extending
Add a map in `maps.ts`, enemies and encounter tables in `enemies.ts`, dialogue in `story.ts`
(scripts are lists of commands), and songs in `music.ts`.

## Tests
`npm run dev`, then `node tests/playthrough.mjs`. Playwright plays through the whole chapter
(creation → boss → party → ending) and saves screenshots to `screenshots/`.

## Build the APK
```
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```
(Capacitor CLI needs Node ≥ 22.)
