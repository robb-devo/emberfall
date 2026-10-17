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
- [x] HD structures `src/gfx/structures.ts`: tall timber/stone houses, shingled roofs with ridge + chimney smoke, lit windows at night, bell tower; tree atlas (oak/autumn/pine), tall-grass overlays that rustle; blurred cast shadows + contact AO baked into the ground.
- [x] Water shader `src/fx/water.ts`: ripple distortion, caustics, sky reflection, glints.
- [x] Lighting: multiplied colour light map, flickering coloured point lights, warm window light at night.
- [x] Post FX v3 `src/fx/diorama.ts`: bokeh tilt-shift DOF following the hero, two-ring bloom, animated god rays, split-tone grade + S-curve.
- [x] Characters `src/gfx/doll2.ts`: 32x48 HD dolls from shaded primitives, 5-tone hue-shifted ramps, dithering, occlusion + sel-out outlines; every gear piece drawn natively; longer stride.
- [x] Battles: painted perspective backdrops for 7 biomes (`src/gfx/backdrop.ts`); monsters Scale4x + distance-field re-shaded with rim light (`Pix.toHd4`); bigger party; OT2-style dash attacks with camera lean + dust; ornate party cards with mini-portraits; bevelled gauges.
- [x] UI: bundled fonts (Cinzel / Cinzel Decorative / Alegreya Sans), ornate gold filigree windows everywhere (`drawPanel`).
- [x] Dialogue busts (`src/gfx/portrait.ts`): painted anime-style portraits generated from each speaker's look + gear (party + every named NPC).
- [x] Title: painted 4-layer parallax vista (`src/gfx/titleart.ts`), HD hero + companion on the cliff, gold Cinzel Decorative logo with filigree + glints, bloom/ray grade.
- [x] Transitions: diamond-tile wipe for area changes; freeze-frame shatter into battle (Overlay scene).

- [x] HD props v1: every prop tile Scale4x + re-shaded (`ensurePropHd` in WorldScene), y-sorted with characters, contact shadows; trees sway.
- [x] Full-screen: logical height adapts to device aspect (`H` in widgets.ts, 1280..1700), `SAFE_T/SAFE_B` insets for HUD; battle stage scales by `K=(820+DY)/800`, bottom UI shifted by `DY`.
- [x] Battle hit flash = brief additive silhouette (110ms, 42%) instead of solid tintFill (was a white blob under bloom).
- [x] Diorama depth: projective ground-plane tilt in DioramaFX (k=0.6 outdoor), camera zoom 4 -> 4.6 (`ZOOM`), raised plaza with stone curb faces + cast shadow, taller house walls (+WALLX) and roofs, front cross-gables with round windows, foreground blurred foliage silhouettes at screen edges with parallax.

- [x] Interiors (ground.ts Ter.WOOD/RUG/IWALL/COUNTER): staggered plank floors with grain + contact shadows, ornate bordered rugs with medallions, 2-tile back walls (crown beam, plaster + timber posts, wainscot panels, baseboard), dark cut-away wall tops with lit rims, wooden counters, woven doormats; chapel: stone walls with stained-glass arches, slab floor, wooden pews, clothed altar; window light shafts + hearth glow; no fake 'house' structure indoors.
  Shots: progress/r3-17-int-*, r3-21-int-chapel. Tool: `MAPS=map:x:y,... node tests/tools/r3int.mjs <prefix>`.

## Next
- [ ] Full regression run on the built test server, fix regressions. (data/maps/battle-smoke/save PASS; save diag test made frame-atomic; _gull.mjs removed; playthrough 1+2 running)
- [ ] Final critical polish pass (characters, monsters, title).
- [ ] APK + release v0.3.0.

## Scope update (user, 11:16)
Elevate EVERYTHING: characters (more detailed sprites, dialogue portraits, smoother animation, visible gear layers), monsters & bosses, UI/menus/fonts, title screen, cutscenes & transitions — not only environments.
