# Round 6 progress

- [x] B) Dismemberment rewrite (BattleScene.dismember/killFoe): 2 parts per kill (3 on crit: head/upper/lower). Lower part topples in place, upper parts arc with a sparse blood trail, dark seam on the cut, thud+shake+bounce, pool on landing, one short stump spurt. Removed the 30-spark burst; killing-blow droplets cut from 40 big to 10 small.
- [x] A) Detail pass: rewrote anatomy3 stamps (cleaner trapezius/collarbones, pec/abs/obliques/iliac V, ribcage/waist/hip bones on women, scapula/lats/spine/dimples on back, slightly clearer anatomy with pubic hair, fuller glutes); thumbs; bare-foot toes/ankle. Adult-only, doll3 only; children untouched.
- [x] Screenshots: progress/r6-01-body-detail.png (clothed | underwear (Adult OFF) | nude (Adult ON)), progress/r6-03-gore.png (3 crit kills, 3 frames). Portraits unchanged -> no r6-02.
- Open: faces/hair/clothing folds not reworked; side view anatomy still minimal; multi-kill still looks busy because each foe gives 3 parts.

## R6b (feedback: "pixel heap", genitals too big, wounds + gruesome corpses)
- [x] Bodies: sparse, clean form shading (anatomy3 stamps rewritten: few soft lines instead of checker clutter), arm/leg marks reduced, bare-skin dither 0.7->0.2 and no occlusion seams between same-skin parts (Canvas.dith / sameSkip). Adult doll3 only.
- [x] Anatomy redrawn small & normal-proportioned for 32x64 (male ~1-2px wide, 3px long; female minimal). Adult ON + unclothed + doll3 only.
- [x] Wounds: BattleScene.addWound – cuts / crit gashes accumulate on living foes (max 6), follow the sprite (syncWounds in update), short drip. Adult only, non-boss.
- [x] Corpse: BattleScene.corpse – default death: humanoids topple sideways, beasts roll on their back; opened belly cavity, spilled entrails sliding out, gashes, 2 spreading pools; material-tinted (tar/sap/embers). Dismember now only 30% of crit kills.
- [x] Shots: progress/r6-04-bodies.png, progress/r6-05-wounds-corpse.png. Tools: tests/tools/r6sheet.mjs, r6wounds.mjs. battle-smoke ALL PASS.
- Open: wound decals don't clip to the monster silhouette (can sit on transparent edge on thin sprites); guts on dark-blood foes (tar/brine) read weakly; party members get no wounds yet.
