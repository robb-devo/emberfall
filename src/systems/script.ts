/** Interprets SCRIPTS (src/data/story.ts) against the WorldScene + UIScene. */
import Phaser from 'phaser';
import { SCRIPTS, Cmd, QUESTS } from '../data/story';
import { Game } from './state';
import { Audio } from './audio';
import { evalCond } from './cond';
import { ITEMS } from '../data/items';
import type { WorldScene } from '../scenes/WorldScene';

const DIRC: Record<string, number> = { D: 0, L: 1, R: 2, U: 3 };
export class ScriptRunner {
  running = false; stopped = false;
  constructor(public w: WorldScene) {}
  fmt(s: string) { return s.replace(/\{hero\}/g, Game.hero.name); }
  async run(name: string) {
    const cmds = SCRIPTS[name]; if (!cmds) return;
    const outer = this.running; this.running = true; this.stopped = false;
    try { await this.exec(cmds); } catch (e) { console.error('script error', name, e); }
    if (!outer) { this.running = false; this.stopped = false; this.w.ui.hideDialog(); }
  }
  async exec(cmds: Cmd[]) {
    for (const c of cmds) { if (this.stopped) return; await this.one(c); }
  }
  async one(c: Cmd) {
    const w = this.w, ui = w.ui;
    if (c.say !== undefined) return ui.say(this.fmt(c.t), c.say);
    if (c.narr !== undefined) return ui.narr(this.fmt(c.narr));
    if (c.caption !== undefined) { ui.hideDialog(); return ui.caption(c.caption, c.sub); }
    if (c.choice) { const i = await ui.choice(c.choice.map((s: string) => this.fmt(s))); return this.exec(c.then[i] || []); }
    if (c.if !== undefined) return this.exec(evalCond(c.if) ? c.then : c.else || []);
    if (c.stop) { this.stopped = true; return; }
    if (c.set !== undefined) { Game.set(c.set, c.v ?? true); return; }
    if (c.give) { Game.addItem(c.give, c.n || 1); Audio.sfx('chest'); ui.refreshHud(); return; }
    if (c.take) { Game.addItem(c.take, -(Game.s.inv[c.take] || 0)); return; }
    if (c.gold) { Game.s.gold += c.gold; Audio.sfx('coin'); ui.refreshHud(); return; }
    if (c.quest) { const prev = Game.s.quests[c.quest]; Game.s.quests[c.quest] = c.state; if (prev !== c.state) await ui.questToast(QUESTS[c.quest].name, c.state); return; }
    if (c.tut) { if (Game.flag('tut_' + c.tut)) return; Game.set('tut_' + c.tut); return ui.tutorial(c.tut); }
    if (c.shop) { ui.hideDialog(); if (!Game.flag('tut_shop')) { Game.set('tut_shop'); await ui.tutorial('shop'); } return ui.shop(c.shop); }
    if (c.inn !== undefined) { return ui.inn(c.inn); }
    if (c.recruit) { ui.hideDialog(); return ui.recruit(); }
    if (c.heal) { Game.healAll(); ui.refreshHud(); return; }
    if (c.battle) { ui.hideDialog(); const r = await w.startBattle(c.battle, { bg: c.bg, music: c.music, boss: c.boss, noFlee: c.noFlee }); if (r === 'lose') this.stopped = true; return; }
    if (c.fade) { ui.hideDialog(); return ui.fade(c.fade, c.ms || 600, c.color ?? 0); }
    if (c.wait) return w.wait(c.wait);
    if (c.shake) { w.cameras.main.shake(c.shake, 0.012); return; }
    if (c.flash !== undefined) { const col = Phaser.Display.Color.IntegerToRGB(c.flash); w.cameras.main.flash(400, col.r, col.g, col.b); return w.wait(200); }
    if (c.music) { if (c.music === 'none') Audio.stopMusic(); else Audio.play(c.music); return; }
    if (c.sfx) { Audio.sfx(c.sfx); return; }
    if (c.npc) { const a = w.actor(c.npc); Game.set('show_' + c.npc, c.show); if (a) { a.hidden = !c.show; a.spr.setVisible(c.show); a.shadow.setVisible(c.show); if (c.show) { a.spr.setAlpha(0); w.tweens.add({ targets: a.spr, alpha: 1, duration: 500 }); } } return; }
    if (c.move) {
      const a = w.actor(c.move); if (!a) return; ui.hideDialog();
      for (const ch of c.path as string) { await w.walk(a, DIRC[ch], c.speed || 260); if (a === w.hero) { w.history.unshift({ x: a.tx - [0, -1, 1, 0][DIRC[ch]], y: a.ty - [1, 0, 0, -1][DIRC[ch]], dir: DIRC[ch] }); w.updateFollowers(false); } }
      a.step = 0; w.setFrame(a); return;
    }
    if (c.face) { const a = w.actor(c.face); if (a) { a.dir = c.dir; w.setFrame(a); } return; }
    if (c.step === 'back') { const h = w.hero; const back = 3 - h.dir; ui.hideDialog(); await w.walk(h, back, 200); h.dir = 3 - back; h.step = 0; w.setFrame(h); return; }
    if (c.warp) { ui.hideDialog(); Game.s.map = c.warp; w.scene.restart({ map: c.warp, x: c.x, y: c.y, dir: c.dir ?? 0, noFade: true, script: '__continue' }); await new Promise<void>(r => w.events.once('create', r)); return; }
    if (c.call) return this.exec(SCRIPTS[c.call] || []);
    if (c.fx) return fx(w, c.fx);
    if (c.end) { ui.hideDialog(); await ui.fade('out', 1500, 0); w.scene.stop('UI'); w.scene.start('End'); this.stopped = true; return; }
    console.warn('unknown cmd', c);
  }
}

/** Cinematic effects used by story scripts */
async function fx(w: WorldScene, name: string) {
  const h = w.hero.spr; const add = w.add;
  const burst = (x: number, y: number, tint: number[], n = 30, speed = 80) => add.particles(x, y, 'spark', { lifespan: 900, speed: { min: speed * 0.3, max: speed }, scale: { start: 0.6, end: 0 }, tint, blendMode: 'ADD', emitting: false }).setDepth(9500).explode(n);
  switch (name) {
    case 'halo': {
      const c = add.container(h.x, h.y).setDepth(h.depth + 1);
      const ring = add.image(0, -26, 'ring').setScale(0.22, 0.08).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD);
      const wl = add.image(-9, -12, 'light').setScale(0.22, 0.12).setTint(0xb0d8ff).setBlendMode(Phaser.BlendModes.ADD).setAngle(-30);
      const wr = add.image(9, -12, 'light').setScale(0.22, 0.12).setTint(0xb0d8ff).setBlendMode(Phaser.BlendModes.ADD).setAngle(30);
      const glow = add.image(0, -10, 'light').setScale(0.6).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.5);
      c.add([glow, wl, wr, ring]); w.aura = c; c.setDepth(5100);
      w.tweens.add({ targets: [wl, wr], scaleY: 0.18, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
      burst(h.x, h.y - 12, [0xffe8a0, 0xffffff, 0x9ad0ff], 40); w.cameras.main.flash(500, 255, 240, 200);
      return w.wait(700);
    }
    case 'quake': w.cameras.main.shake(900, 0.02); Audio.sfx('quake'); return w.wait(400);
    case 'shield': { const s = w.actor('solenne'); if (s) { const b = add.image(s.spr.x, s.spr.y - 10, 'ring').setScale(0.1).setTint(0x9ad0ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(9500); w.tweens.add({ targets: b, scale: 0.9, alpha: 0, duration: 900 }); } return w.wait(500); }
    case 'shatter': {
      const hs = w.fxObjs.heart as Phaser.GameObjects.Image; Audio.sfx('shatter');
      if (hs) { burst(hs.x, hs.y, [0xffe8a0, 0xff6080, 0xffffff], 80, 160); hs.destroy(); (w.fxObjs.heartGlow as any)?.destroy(); }
      if (w.aura) { const a = w.aura; w.aura = undefined; w.tweens.add({ targets: a, alpha: 0, duration: 800, onComplete: () => a.destroy() }); }
      w.cameras.main.shake(1500, 0.03); return w.wait(800);
    }
    case 'fall': {
      Audio.sfx('dark');
      for (let i = 0; i < 40; i++) w.time.delayedCall(i * 30, () => { const x = Phaser.Math.Between(0, 15) * 16, y = Phaser.Math.Between(0, 17) * 16; w.layer.putTileAt(41, x / 16, y / 16); burst(x + 8, y + 8, [0xd8d4f0, 0xffffff], 4, 30); });
      w.tweens.add({ targets: h, y: h.y + 200, angle: 540, scale: 0.2, duration: 1800, ease: 'Quad.in' });
      add.particles(0, 0, 'dot', { follow: h, lifespan: 600, speed: 6, scale: { start: 1, end: 0 }, tint: [0xffe8a0, 0xff9a40], blendMode: 'ADD', frequency: 16 }).setDepth(9500);
      return w.wait(1600);
    }
    case 'shardGet': {
      const g = w.actor('warden'); const sx = g ? g.spr.x : h.x, sy = g ? g.spr.y - 20 : h.y - 40;
      const st = add.image(sx, sy, 'star').setScale(0.6).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(9600);
      const gl = add.image(sx, sy, 'light').setScale(0.5).setTint(0xffc060).setBlendMode(Phaser.BlendModes.ADD).setDepth(9599);
      Audio.sfx('star');
      await new Promise<void>(r => w.tweens.add({ targets: [st, gl], x: h.x, y: h.y - 30, duration: 1600, ease: 'Sine.inOut', onComplete: () => r() }));
      w.fxObjs.shard = st; w.fxObjs.shardGlow = gl; burst(h.x, h.y - 20, [0xffe8a0, 0xffffff], 40); w.cameras.main.flash(500, 255, 230, 180);
      return w.wait(300);
    }
    case 'rift': {
      const r = add.image(8 * 16 + 8, 3 * 16 + 8, 'light').setScale(0.05, 0.6).setTint(0xa040ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(9400);
      const r2 = add.image(8 * 16 + 8, 3 * 16 + 8, 'light').setScale(0.02, 0.5).setTint(0xffffff).setBlendMode(Phaser.BlendModes.ADD).setDepth(9401);
      w.tweens.add({ targets: r, scaleX: 0.3, duration: 700, ease: 'Back.out' }); w.tweens.add({ targets: r2, scaleX: 0.08, duration: 700 });
      const p = add.particles(r.x, r.y, 'px', { lifespan: 900, speed: { min: 10, max: 40 }, tint: [0xa040ff, 0xff60c0], blendMode: 'ADD', frequency: 30 }).setDepth(9402);
      w.fxObjs.rift = r; w.fxObjs.rift2 = r2; w.fxObjs.riftP = p; return w.wait(800);
    }
    case 'riftClose': { for (const k of ['rift', 'rift2', 'riftP']) { const o = w.fxObjs[k] as any; if (o) w.tweens.add({ targets: o, alpha: 0, scaleX: 0, duration: 600, onComplete: () => o.destroy() }); } return w.wait(600); }
    case 'steal': {
      const v = w.actor('vesperL'); const st = w.fxObjs.shard as Phaser.GameObjects.Image, gl = w.fxObjs.shardGlow as Phaser.GameObjects.Image;
      if (st && v) await new Promise<void>(r => w.tweens.add({ targets: [st, gl], x: v.spr.x, y: v.spr.y - 26, duration: 700, ease: 'Cubic.in', onComplete: () => r() }));
      w.cameras.main.shake(400, 0.02); w.time.delayedCall(1200, () => { st?.destroy(); gl?.destroy(); }); return;
    }
    case 'bramGlow': { const b = w.actor('elder'); if (b) { const ring = add.image(b.spr.x, b.spr.y - 26, 'ring').setScale(0.22, 0.08).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(9500).setAlpha(0); w.tweens.add({ targets: ring, alpha: { from: 0, to: 1 }, yoyo: true, duration: 600, repeat: 1, onComplete: () => ring.destroy() }); } return w.wait(1600); }
    case 'starRain': {
      const cam = w.cameras.main;
      for (let i = 0; i < 26; i++) w.time.delayedCall(i * 260, () => {
        const x0 = cam.worldView.x + Math.random() * cam.worldView.width + 40, y0 = cam.worldView.y - 10;
        const s = add.image(x0, y0, 'star').setScale(0.25 + Math.random() * 0.3).setTint(Math.random() < 0.8 ? 0xffe8a0 : 0xff8080).setBlendMode(Phaser.BlendModes.ADD).setDepth(9600);
        const tr = add.particles(0, 0, 'px', { follow: s, lifespan: 500, scale: { start: 1, end: 0 }, tint: [0xffe8a0, 0xff9a40], blendMode: 'ADD', frequency: 20 }).setDepth(9599);
        w.tweens.add({ targets: s, x: x0 - 120, y: y0 + cam.worldView.height * 0.8, alpha: 0.2, duration: 1800, onComplete: () => { s.destroy(); w.time.delayedCall(500, () => tr.destroy()); } });
      });
      return w.wait(2500);
    }
  }
}
export { ITEMS };
