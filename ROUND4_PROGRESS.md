# Round 4 – real 3D depth, buttery movement, dialogue rewrite, item details, underwear/Adult

Runs get interrupted after ~45 min: small committed steps, keep this file current.
Dev server: `npx vite --port 5173 --strictPort --host` (log /tmp/vite.log). Shots: `node tests/tools/spot.mjs out.png map x y` / r3shots.mjs.
Screenshots for the user: progress/r4-*.png

## Feedback (v0.3.0)
1. Real 3D depth (houses look like a flat texture on the ground) – OT2 diorama: volume, side faces, roofs, occlusion, cast shadows, perspective tilt. Keep 60fps + Fast mode.
2. Buttery movement (analog, accel/decel, joystick dead-zone, wall sliding, camera look-ahead, walk anim synced to speed).
3. Rewrite all story text in one clear, warm, witty DQ voice; opening must have a clear hook.
4. Item detail panel (inventory + shops): flavour text, icon, effect, stat compare per member (green/red arrows).
5. Underwear layer when no armour/legwear (world, menus, battle) + joke underwear items.
   STEERING (parent, 15:48): one Settings toggle named **Adult** = single switch for ALL mature content (nudity, gore, crude humour, dark story variants). Default OFF.
   Adult ON + nothing equipped = featureless Barbie-doll pixel body (no genital/nipple detail), NO censor bar. Never explicit sexual content.

## Plan / decisions
- 3D: Three.js "mirror renderer" (src/fx/world3d.ts). Phaser WorldScene stays the logic + display list; its camera stops drawing,
  a Three canvas behind the (transparent) Phaser canvas renders: painted ground as a plane, perspective camera pitched ~50°,
  every standing Phaser image/sprite mirrored as an upright billboard (feet on the ground), houses as extruded boxes
  (front facade, side walls, sloped roof), solid wall/cliff tiles extruded, shadow-mapped sun (HD-2D) / blob shadows (Fast),
  post pass (DOF/bloom/grade) ported from diorama.ts. UI scene stays Phaser on top.
- Movement: analog free movement over the tile grid (circle vs tile collision + sliding + corner nudge); tx/ty = tile under feet.

## Done
- [x] Movement (commit "Movement: analog..."): WorldScene.handleMoveInput/enterTile/followTrail/updateCamera; joystick dead-zone in UIScene. Test: tests/tools/move.mjs.
- [x] 3D renderer v1 src/fx/world3d.ts (Three r18x): mirrors display list each frame (postrender hook); WorldScene camera alpha 0 (NOT invisible – invisible cams stop fades);
      houses = World3D.addHouse (tagged 'skip' in Phaser); tag3(obj, 'ground'|'stand'|'fx'|'skip', foot, lift) for hints; water tagged __water; ground shadow bake off in 3D (structures noShadow).
      Disable with localStorage ember_3d=0.

## Next
- [ ] 3D polish: extrude wall/cliff tiles (ground.ts wall faces), beyond-map forest fill, hero x-ray behind houses, tune ELEV/SV, interiors, fx placement check per map, perf check
- [ ] Item details
- [ ] Underwear + Adult toggle
- [ ] Dialogue rewrite
- [ ] Tests, 0.4.0, APK, release
   STEERING 2 (parent, 15:53, replaces featureless body): Adult ON + nothing equipped = simple low-res pixel nude male/female bodies with basic anatomy at sprite scale (Cyberpunk creator style), non-sexual, no poses/animations, adults only (never child NPCs), no explicit content. Low priority (after main items).
   STEERING 3 (parent, 15:56) – END of round: (a) screenshot Adult nude layer male+female -> progress/r4-adult-*.png;
   (b) write docs/ADULT_IDEAS.md (brainstorm only, nothing implemented): 8-12 dark mature quest concepts (Berserk/Dark Souls tone: war crimes, torture aftermath, cults, grief, addiction, no-good-answer dilemmas, body horror), gore/battle-VFX concepts, a few dark companion backstories, hooks into Emberfall's story. Literary, not gratuitous. No sexual violence, nothing sexual with minors, no real-world hate.
