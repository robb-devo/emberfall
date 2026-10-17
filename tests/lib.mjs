import { chromium } from 'playwright';
export async function open(url = 'http://localhost:5173/') {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  if (process.env.LITE) await p.addInitScript(() => localStorage.setItem('ember_gfx', '0'));
  if (process.env.ADULT) await p.addInitScript(() => localStorage.setItem('ember_adult', '1')); // run any suite with Settings → Adult ON
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(url); await p.waitForTimeout(2000);
  const E = (fn, arg) => p.evaluate(fn, arg);
  const h = {
    b, p, errs, E,
    wait: ms => p.waitForTimeout(ms),
    key: async (k, n = 1, gap = 120) => { for (let i = 0; i < n; i++) { await p.keyboard.press(k); await p.waitForTimeout(gap); } },
    shot: async path => { await p.screenshot({ path }); },
    scenes: () => E(() => window.__EMBER.active()),
    hero: () => E(() => { const w = window.__EMBER.world; return w ? { map: w.def.id, x: w.hero.tx, y: w.hero.ty, busy: w.busy, ib: window.__EMBER.Input.busy, modal: w.ui.modal } : null; }),
    /** press Enter until world is idle (dialogs done), up to n presses */
    advance: async (n = 200, pick = 0) => {
      for (let i = 0; i < n; i++) {
        const s = await E(() => { const w = window.__EMBER.world; const act = window.__EMBER.active(); return { busy: w?.busy, ib: window.__EMBER.Input.busy, battle: act.includes('Battle'), ended: !!window.__EMBER.ended, act }; });
        if (s.ended) return 'ended';
        if (s.battle) return 'battle';
        if (!s.busy && !s.ib) return 'idle';
        await p.keyboard.press('Enter'); await p.waitForTimeout(140);
      }
      return 'timeout';
    },
    /** walk to tile (or adjacent) via BFS & simulated joystick */
    walkTo: async (x, y, adjacent = false) => {
      const map0 = await E(() => window.__EMBER.world?.def.id);
      for (let guard = 0; guard < 400; guard++) {
        const st = await E(([x, y, adj]) => { const w = window.__EMBER.world; if (!w || w.busy || window.__EMBER.active().includes('Battle')) return { wait: true }; const path = w.findPath(x, y, adj); return { path, map: w.def.id, at: [w.hero.tx, w.hero.ty] }; }, [x, y, adjacent]);
        if (st.wait) { if (await E(() => window.__EMBER.active().includes('Battle'))) return 'battle'; await p.waitForTimeout(200); const m = await E(() => window.__EMBER.world?.def.id); if (m !== map0) { await p.waitForTimeout(600); return 'warped'; } await p.keyboard.press('Enter'); continue; }
        if (st.map !== map0) { await p.waitForTimeout(600); return 'warped'; } // warp completed between polls (slow headless frames)
        if (!st.path) return 'nopath';
        if (!st.path.length) return 'arrived';
        if (process.env.DBG) console.log('step', guard, st.at, st.path.length);
        const d = st.path[0]; const key = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'][d];
        await p.keyboard.down(key); await p.waitForTimeout(40);
        await p.waitForFunction(([ax, ay]) => { const w = window.__EMBER.world; return !w || w.busy || w.hero.tx !== ax || w.hero.ty !== ay || window.__EMBER.active().includes('Battle'); }, st.at, { timeout: 3000 }).catch(() => {});
        await p.keyboard.up(key);
        await p.waitForFunction(() => { const w = window.__EMBER.world; return !w || !w.hero.moving; }, null, { timeout: 2000 }).catch(() => {});
        const m2 = await E(() => window.__EMBER.world?.def.id);
        if (m2 !== st.map) { await p.waitForTimeout(700); return 'warped'; }
      }
      return 'guard';
    },
    talkTo: async (x, y, pick) => {
      const r = await h.walkTo(x, y, true); if (r === 'nopath') return 'nopath';
      await h.E(([x, y]) => { const w = window.__EMBER.world; const dx = x - w.hero.tx, dy = y - w.hero.ty; w.hero.dir = dx < 0 ? 1 : dx > 0 ? 2 : dy < 0 ? 3 : 0; w.setFrame(w.hero); }, [x, y]);
      await p.keyboard.press('Enter'); await p.waitForTimeout(300); return h.advance(400);
    },
    devStart: async (map, x, y, flags = {}, voc = 'warrior', extra = {}) => {
      await E(([map, x, y, flags, voc, extra]) => {
        const { Game, game } = window.__EMBER; Game.newGame('Aster', voc, { body: 0, skin: 1, hairStyle: 1, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 });
        Game.hero.equip = { weapon: voc === 'mage' ? 'stick' : 'shortsword', armor: 'tunic', shield: 'pot' }; Object.assign(Game.s.flags, flags); Object.assign(Game.s, extra);
        game.scene.getScenes(true).forEach(s => s.scene.stop()); setTimeout(() => game.scene.start('World', { map, x, y, dir: 0 }), 150);
      }, [map, x, y, flags, voc, extra]); await p.waitForTimeout(1500);
    },
    face: async dir => { const key = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp'][dir]; await E(d => { const w = window.__EMBER.world; w.hero.dir = d; w.setFrame(w.hero); }, dir); },
    /** fight current battle by spamming Enter (Attack, first target) */
    fightSmart: async (max = 3000) => {
      for (let i = 0; i < max; i++) {
        const s = await E(() => { const b = window.__EMBER.scene('Battle'); if (!window.__EMBER.active().includes('Battle')) return null; const c = b.cmd; const G = window.__EMBER.Game; return c ? { hp: c.hpFrac, spells: c.spells, herbs: G.s.inv.herb || 0, mem: c.member } : { wait: true }; });
        if (!s) { await p.waitForTimeout(600); return 'done'; }
        if (s.wait) { await p.keyboard.press('Enter'); await p.waitForTimeout(60); continue; }
        if (s.spells.includes('starfall')) { await h.key('ArrowRight', 1, 80); await h.key('Enter', 1, 200); await h.key('ArrowUp', 1, 80); await h.key('Enter', 1, 200); await h.key('Enter', 1, 200); continue; }
        if (s.hp < 0.45 && s.herbs > 0) { await h.key('ArrowDown', 1, 80); await h.key('ArrowRight', 1, 80); await h.key('Enter', 1, 250); await h.key('Enter', 1, 250); await h.key('Enter', 1, 250); continue; }
        await h.key('Enter', 1, 150); await h.key('Enter', 1, 150);
      }
      return 'timeout';
    },
    fight: async (max = 400) => {
      for (let i = 0; i < max; i++) {
        const s = await E(() => window.__EMBER.active().includes('Battle'));
        if (!s) { await p.waitForTimeout(600); return 'done'; }
        await p.keyboard.press('Enter'); await p.waitForTimeout(90);
      }
      return 'timeout';
    },
  };
  return h;
}
