# Round 5 – Adult body model, dark world pass, dark player actions (all behind Settings → Adult)

Runs get interrupted after ~45 min: small committed steps, keep this file current.
Dev server: `npx vite --port 5173 --strictPort --host` (log /tmp/vite.log). Screenshots: progress/r5-*.png
Hard limits: no sexual content/scenes, no sexual violence, nothing sexual with minors, no real-world hate. Anatomy ONLY on the adult-proportioned party sprite set (never chibi, never NPC children).

## Tasks
1. [ ] Adult body model (6-7 heads, OT2-like) for the party when Adult ON: world, menus, battle. Bare = simple low-res anatomy, standing/walking only. Gear/underwear layers on top.
2. [ ] Dark world pass: grim lore/NPC lines, 3-4 quests from ADULT_IDEAS fully, environmental storytelling (gibbets, burned village, cult site, corpses), stronger battle gore (dismemberment, blood pools).
3. [ ] Dark player actions + hidden Karma/Infamy -> NPC reactions + endings.
4. [ ] Tests (data-check, maps-check, battle-smoke, save, boss.mjs BOOST), 0.5.0 / vc5, APK, push, gh release v0.5.0.

## Log
- STEERING (parent 18:12): hero, companions and ALL adult NPCs look 20-30 in ALL modes (adult proportions + faces, portraits too). Child NPCs stay children, never in mature content.
- [x] src/gfx/doll3.ts: adult 32x64 set (~6.5 heads), default for every non-child doll (ensureDollHd routes; Look.child -> doll2, which can no longer render unclothed).
      Children flagged: NPC_LOOKS.kid (Pip, Little Wren, Novice Tam), C2.girl (Coralie). World scale: adults 0.5, kids 0.44. UI/battle/title/create/end scale * ADULT_FIT.
      Nude (Adult ON + party member + no body armour): front = simple low-res anatomy; side/back = minimal shading. Underwear/joke undies layer on top.
      Tools: tests/tools/r5sheet.mjs <out> <adult> <clothed|bare|undies|npc> [scale] (raw sheet dump).
- [x] Portraits: adult faces (narrower face, jaw, almond eyes, nose, no blush) for everyone but children (tests/tools/portraits.mjs incl. a child).
