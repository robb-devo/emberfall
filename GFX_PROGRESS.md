# Round 3 – Graphics overhaul (OT2-style HD-2D)

Goal: noticeably more impressive + smoother, modelled on Octopath Traveler 2. Work in small committed steps.
Screenshots: `node tests/tools/r3shots.mjs <prefix> [names]` -> progress/<prefix>-*.png (needs dev server :5173).
Regression tests: run against a *built* copy so Vite HMR reloads don't break them:
`bash tests/tools/testserver.sh` (builds to /tmp/ember-test, serves :4173), then e.g. `node tests/playthrough.mjs http://localhost:4173/`.

## Critique of v0.2 (before shots: progress/r3-00-before-*)
- Ground = repeated 16px tiles with hard square borders; flat RPG-Maker look, no diorama depth.
- Houses = flat roof tiles + 1-tile wall strip; trees = tiny lollipops; no cast shadows.
- Water = 2-frame tile flip. Camera floored to whole world px at 4x zoom -> 4px jitter; 1-frame stall per tile.
- Battles: dark, empty backdrops, small chunky sprites, plain UI.

## Done
- [x] Smooth movement: per-frame integrator with overshoot carry (no stall between tiles), stride-synced walk frames + bob, sub-pixel camera (roundPixels off, softer lerp).
- [x] HD ground painter `src/gfx/ground.ts` (2 texels/world px, domain-warped organic borders, tufts, flowers, flagstones, cobbles, dungeon/cave stone, wall tops/faces, cliffs, wet sand, water layer with depth colour + foam).

## Next
- [ ] HD structures: houses with tall walls/roofs/chimneys, big trees (oak/pine/autumn), cast shadows baked into ground.
- [ ] Water shader (ripples, sparkle, reflection) on the water layer.
- [ ] Lighting: multiply colour lightmap, window glow at night, torch flicker.
- [ ] Post FX: better DOF / bloom / god rays / grading.
- [ ] Characters: idle breathing, softer shadows.
- [ ] Battle overhaul: backdrops, big sprites, VFX, camera, ornate UI.
- [ ] Interiors.
- [ ] APK + release v0.3.0.

## Scope update (user, 11:16)
Elevate EVERYTHING: characters (more detailed sprites, dialogue portraits, smoother animation, visible gear layers), monsters & bosses, UI/menus/fonts, title screen, cutscenes & transitions — not only environments.
