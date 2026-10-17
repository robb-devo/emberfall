# Round 5 – Adult body model, dark world pass, dark player actions (all behind Settings → Adult)

Runs get interrupted after ~45 min: small committed steps, keep this file current.
Dev server: `npx vite --port 5173 --strictPort --host` (log /tmp/vite.log). Screenshots: progress/r5-*.png
Hard limits: no sexual content/scenes, no sexual violence, nothing sexual with minors, no real-world hate. Anatomy ONLY on the adult-proportioned party sprite set (never chibi, never NPC children).

## Tasks
1. [x] Adult body model (6-7 heads, OT2-like) for the party when Adult ON: world, menus, battle. Bare = simple low-res anatomy, standing/walking only. Gear/underwear layers on top.
2. [x] Dark world pass: grim lore/NPC lines, 3-4 quests from ADULT_IDEAS fully, environmental storytelling (gibbets, burned village, cult site, corpses), stronger battle gore (dismemberment, blood pools).
3. [x] Dark player actions + hidden Karma/Infamy -> NPC reactions + endings.
4. [ ] Tests (data-check, maps-check, battle-smoke, save, boss.mjs BOOST), 0.5.0 / vc5, APK, push, gh release v0.5.0.

## Log
- STEERING (parent 18:12): hero, companions and ALL adult NPCs look 20-30 in ALL modes (adult proportions + faces, portraits too). Child NPCs stay children, never in mature content.
- [x] src/gfx/doll3.ts: adult 32x64 set (~6.5 heads), default for every non-child doll (ensureDollHd routes; Look.child -> doll2, which can no longer render unclothed).
      Children flagged: NPC_LOOKS.kid (Pip, Little Wren, Novice Tam), C2.girl (Coralie). World scale: adults 0.5, kids 0.44. UI/battle/title/create/end scale * ADULT_FIT.
      Nude (Adult ON + party member + no body armour): front = simple low-res anatomy; side/back = minimal shading. Underwear/joke undies layer on top.
      Tools: tests/tools/r5sheet.mjs <out> <adult> <clothed|bare|undies|npc> [scale] (raw sheet dump).
- [x] Portraits: adult faces (narrower face, jaw, almond eyes, nose, no blush) for everyone but children (tests/tools/portraits.mjs incl. a child).
- STEERING (18:24 + 18:26): polish doll3 (shape, arm separation, contrapposto, wider robe/side), full-body detail (collarbones, sternum, pecs/abs, hips, knees, elbows, hands),
  recognisable low-res anatomy when Adult ON + unclothed (adult doll3 only), body-overlay marks system.
  NOTE: the "teen-looking" far-right portrait in r5-05 is Pip, a CHILD NPC (look.child) – intentionally kept as a child.
- [x] doll3 polish: light()/contact() helpers (shading without occlusion seams, contact shadow under arms), contrapposto idle, wider robes/side silhouette.
- [x] Anatomy (front, Adult ON, unclothed, adult party only): breasts with areola+nipple, pubic hair, simple genitals (m/f). Back: spine, blades, cleft. Neutral pose only.
- [x] src/gfx/bodymarks.ts: Look.bodyMarks [{type: scar|wound|bandage|tattoo|dirt|blood, region, variant}], drawn only on bare-skin pixels (clothes/underwear/armour cover them);
      MARK_PRESETS (Duellist, Sailor Ink, Pit Fighter, Survivor) as creator row "Marks"; NPC examples: Pell (face scar), Brannoc + Old Salt (ink), Garrick (scar).
      Tool tests/tools/r5cells.mjs <out> detail|marks. Shots: progress/r5-06-body-detail-front.png, r5-07-body-marks.png
- [x] Battle gore (Adult): material-aware blood (goo/embers/tar/sap/brine), spreading blood pools on crits/kills/party KOs, dismemberment of normal foes on the killing blow (sprite slabs fly, bleed, land), red vignette on crit kills.
- STEERING (18:35): anatomy must be recognisable; stronger 3-tone musculature + highlights (esp. dark skin).
- [x] src/gfx/anatomy3.ts: hand-placed 12-px pixel stamps painted as flat pixels (survive dithering), per-skin tones (highlight strength scales with skin darkness):
      collarbones, traps, deltoids, pecs/bust, abs + linea alba, iliac V, waist/hip curve, back (blades, spine, lats, dimples), glutes; per-leg quad/knee/calf/shin; arm deltoid/biceps/forearm.
      Adult ON + unclothed + adult party member only: male = pubic hair + shaft between two testicles (~6x6 px incl. outline); female = sparse pubic triangle + cleft, breasts with areolae and nipples.
      Body hair uses natural colours (dyed/fantasy hair -> brown). Re-shot r5-06 / r5-07.
- [x] Dark world (src/data/dark.ts, merged by story.ts / maps.ts; nothing exists with Adult OFF):
      * `dk_<script>` overrides (ScriptRunner + `call`), originals kept as `base_<script>`; new conds `adult`, `karma>=n`, `infamy>=n`/`<n`, `#counter>=n`, `mate`;
        new cmds `karma`, `infamy`, `count`, `sellMate`, `hurt`, `mark` (adds a bodyMark to the hero), `{mate}` text token.
      * props (src/gfx/darkprops.ts, procedural): crossroads gibbet + hanged deserter + skull pike + ash altar (road); burned hamlet Ashby with ruins, stake, remains (Vale);
        bones/corpse/drag-marks (Cinderdeep); harbour gibbet (Saltmere, gains Hallam / Wenlow when hanged); drowned pews (grotto). Every prop has an examine text.
      * grim overrides: road/Saltmere/hollow/grotto/sanctum intros, pilgrims, fisher, rancher, bard, sailor, snorer, cave warning.
      * Quests: Penance Road (procession + coffin of unsent letters: free them / burn them / take the ash mark), The Ash Tithe (seven drowned names: expose -> mob hangs Hallam,
        bury -> 600 G hush money, Brenna's sentence -> seven lamps), Starmilk (Caddoc the fallen Warden: dose / take his shard / become his dealer), The Mercy Knight
        (Ser Hollis vs. Widow Orla: duel -> Mercy of Ashby, hand over -> hanged at Ashby, spare). Rewards: Untied Cord, Ash Rosary, Grey Shard, Mercy of Ashby, gold, pearls.
      * Dark actions: rob Pell, extort Old Marrow, pickpocket the snoring fisherman, side with the cult (ash mark), hang/brand/spare acolyte Wenlow, sell a custom companion to
        Factor Sallow (never story members), drink at the Gull (3rd drink = blackout: tattoo or robbed), starmilk (3 doses = hooked: grey hands, NPCs react, Maren's painful cure).
      * Hidden karma/infamy: Rowan, Harbour Watch, Brannoc, Delphine, Pell, Preacher, Tobin, Old Salt, Hallam, Brenna react; Sexton Cobb carves your epitaph; chapter-end epilogue line.
      Executions always cut to black. Nothing sexual anywhere. No children in any of it.
      Tests: tests/tools/_maps-adult.mjs (adult props also block -> all paths still open), tests/tools/r5quests.mjs (functional run of every quest/action).
      Shots: r5-08-gore-1..3, r5-10-crossroads-gibbet, r5-11-penance-road, r5-12-coffin-letters, r5-13-ashby-burned, r5-14-mercy-knight, r5-15-prisoner-choice, r5-16-starmilk, r5-17-harbour-gibbet.
