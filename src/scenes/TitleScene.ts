import Phaser from 'phaser';
import { FONT as FONT_SANS, txt, W, H, DY, SAFE_B, ListMenu, SERIF, DECO, COL, card, panel } from '../ui/widgets';
import { ensureTitleArt, CLIFF_Y } from '../gfx/titleart';
import { diorama } from '../fx/diorama';
import { Input, minimizeApp } from '../ui/input';
import { Audio } from '../systems/audio';
import { Game, SLOTS_N } from '../systems/state';
import { ensureDollHd } from '../systems/paperdoll';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    Input.backFallback = minimizeApp;
    this.cameras.main.fadeIn(800, 0, 0, 0);
    // ---- painted HD-2D vista: 4 parallax layers + light
    ensureTitleArt(this);
    // taller-than-16:9 phones: the 1280-high composition is centred and the painted layers are extended
    // (sky colour above, each layer's bottom row stretched below) so the vista fills the whole screen
    this.cameras.main.setScroll(0, -DY / 2);
    if (DY > 0) this.add.rectangle(0, -DY, W, DY + 4, 0x060824).setOrigin(0).setDepth(-10.5);
    const strip = (k: string) => { const sk = k + '_b'; if (!this.textures.exists(sk)) { const src = this.textures.get(k).getSourceImage() as HTMLCanvasElement; const t = this.textures.createCanvas(sk, src.width, 1)!; t.getContext().drawImage(src, 0, src.height - 1, src.width, 1, 0, 0, src.width, 1); t.refresh(); } return sk; };
    const L = (k: string, d: number, amp: number, dur: number) => { const im = this.add.image(W / 2, 0, k).setOrigin(0.5, 0).setScale(2.06).setDepth(d); const tg: Phaser.GameObjects.Image[] = [im];
      if (DY > 0) { const b = this.add.image(W / 2, im.displayHeight - 2, strip(k)).setOrigin(0.5, 0).setScale(2.06, DY / 2 + 8).setDepth(d); tg.push(b); }
      if (amp) this.tweens.add({ targets: tg, x: W / 2 + amp, yoyo: true, repeat: -1, duration: dur, ease: 'Sine.inOut' }); return im; };
    L('tt_sky', -10, 0, 0);
    // stars twinkle on top of the painted ones
    for (let i = 0; i < 60; i++) { const st = this.add.image(Math.random() * W, Math.random() * 560, 'px').setScale(Math.random() < 0.2 ? 2 : 1).setDepth(-9).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: st, alpha: { from: 0.05, to: 0.9 }, duration: 700 + Math.random() * 2500, yoyo: true, repeat: -1, delay: Math.random() * 2000 }); }
    const moon = this.add.image(190, 264, 'light').setTint(0xc8c0ff).setBlendMode(Phaser.BlendModes.ADD).setScale(2.4).setAlpha(0.35).setDepth(-9);
    this.tweens.add({ targets: moon, alpha: 0.5, yoyo: true, repeat: -1, duration: 3000 });
    // aurora ribbons
    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.12).setDepth(-9);
      const col = [0x40ffc0, 0x8060ff, 0xff60c0][i];
      const draw = (t: number) => { g.clear(); g.fillStyle(col, 1); g.beginPath(); g.moveTo(0, 150 + i * 50); for (let x = 0; x <= W; x += 24) g.lineTo(x, 120 + i * 60 + Math.sin(x * 0.01 + t * 0.0006 * (i + 1)) * 50); for (let x = W; x >= 0; x -= 24) g.lineTo(x, 180 + i * 60 + Math.sin(x * 0.013 + t * 0.0008) * 40); g.closePath(); g.fillPath(); };
      this.events.on('update', () => draw(this.time.now));
    }
    const far = L('tt_far', -8, -6, 11000);
    const beacon = this.add.image(540, 196, 'light').setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setScale(0.9).setDepth(-7);
    this.tweens.add({ targets: beacon, scale: 1.3, alpha: 0.6, yoyo: true, repeat: -1, duration: 1400 });
    this.tweens.add({ targets: beacon, x: 540 - 6, yoyo: true, repeat: -1, duration: 11000, ease: 'Sine.inOut' }); void far;
    // sunset glow on the horizon
    this.add.image(W / 2, 860, 'light').setTint(0xff9050).setBlendMode(Phaser.BlendModes.ADD).setScale(9, 2.6).setAlpha(0.45).setDepth(-7);
    L('tt_mid', -6, -12, 11000);
    // village lights bloom + drifting valley mist
    for (let i = 0; i < 9; i++) { const v = this.add.image(60 + Math.random() * 400, 990 + Math.random() * 120, 'light').setTint(0xffb060).setBlendMode(Phaser.BlendModes.ADD).setScale(0.35 + Math.random() * 0.3).setAlpha(0.5).setDepth(-5); this.tweens.add({ targets: v, alpha: 0.2, yoyo: true, repeat: -1, duration: 600 + Math.random() * 1400 }); }
    for (let i = 0; i < 4; i++) { const m = this.add.image(Math.random() * W, 1020 + i * 40, 'light').setTint(0xd8a8c8).setBlendMode(Phaser.BlendModes.ADD).setScale(6, 0.8).setAlpha(0.12).setDepth(-5); this.tweens.add({ targets: m, x: m.x + 160, yoyo: true, repeat: -1, duration: 9000 + i * 2000, ease: 'Sine.inOut' }); }
    const fore = L('tt_fore', -3, -20, 11000);
    // hero + companion on the cliff, back to us, gazing at the Spire
    const mk = (sp: any, x: number, sc: number) => { const k = ensureDollHd(this, sp); const h = this.add.sprite(x, 0, k, 9).setOrigin(0.5, 1).setScale(sc).setTint(0xa898c8).setDepth(-2); return h; };
    const hero = mk({ look: { body: 0, skin: 1, hairStyle: 1, hair: 1, eyes: 1, face: 3, outfit: 0, outfit2: 6 }, equip: { weapon: 'ironsword', acc: 'cape', armor: 'leather' } }, 590, 3.2);
    const comp = mk({ look: { body: 0, skin: 0, hairStyle: 2, hair: 3, eyes: 5, face: 1, outfit: 4, outfit2: 3 }, equip: { weapon: 'wand', armor: 'robe' } }, 660, 2.9);
    const cliffY = (sx: number) => CLIFF_Y(Math.round((sx - (W / 2 - TWH)) / 2.06)) * 2.06 + 6;
    const TWH = 360 * 2.06 / 2;
    this.events.on('update', () => { const off = fore.x - W / 2; hero.x = 590 + off; comp.x = 660 + off; hero.y = cliffY(590) ; comp.y = cliffY(660) - 4; });
    this.tweens.add({ targets: [hero, comp], scaleY: '*=1.012', yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.inOut' });
    const rim = this.add.image(600, 860, 'light').setTint(0xffb070).setBlendMode(Phaser.BlendModes.ADD).setScale(2.4).setAlpha(0.28).setDepth(-1);
    void rim;
    // falling star loop
    const fallStar = () => {
      const x0 = 160 + Math.random() * 480; const st = this.add.image(x0, -20, 'star').setScale(2).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(-8);
      const trail = this.add.particles(0, 0, 'dot', { follow: st, lifespan: 700, speed: 10, scale: { start: 1.6, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffe8a0, 0xff9a40, 0xffffff], blendMode: 'ADD', frequency: 12 }).setDepth(-8);
      this.tweens.add({ targets: st, x: x0 - 300, y: 640, angle: 360, duration: 2200, ease: 'Quad.in', onComplete: () => { st.destroy(); this.time.delayedCall(800, () => trail.destroy()); } });
    };
    fallStar(); this.time.addEvent({ delay: 4200, loop: true, callback: fallStar });
    // embers + fireflies
    this.add.particles(0, 0, 'dot', { x: { min: 0, max: W }, y: 1290 + DY / 2, lifespan: 6000, speedY: { min: -60, max: -140 }, speedX: { min: -20, max: 20 }, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xff9a40, 0xffd070, 0xff5a30], blendMode: 'ADD', frequency: 110 });
    this.add.particles(0, 0, 'dot', { x: { min: 380, max: W }, y: { min: 880, max: 1180 }, lifespan: 3000, speed: { min: 4, max: 18 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0, end: 1, ease: 'Sine.inOut' } as any, tint: [0xd8ff90, 0xfff0a0], blendMode: 'ADD', frequency: 260 });
    // logo: Cinzel Decorative, molten-gold gradient, filigree rules, glints
    const logo = this.add.text(W / 2, 400, 'EMBERFALL', { fontFamily: DECO, fontSize: '84px', fontStyle: '900', color: '#ffe8b0', stroke: '#2a0e1a', strokeThickness: 10, padding: { x: 20, y: 20 } }).setOrigin(0.5);
    const grad = logo.context.createLinearGradient(0, 30, 0, logo.height - 30); grad.addColorStop(0, '#fffbe8'); grad.addColorStop(0.45, '#ffd27a'); grad.addColorStop(0.55, '#e8a040'); grad.addColorStop(1, '#a8401c'); logo.setFill(grad);
    logo.setShadow(0, 4, '#1a0610', 8, true, false); logo.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    logo.setScale(1.25).setAlpha(0); this.tweens.add({ targets: logo, scale: 1, alpha: 1, duration: 1600, ease: 'Expo.out' });
    const glow = this.add.image(W / 2, 400, 'light').setTint(0xff8040).setScale(6, 1.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(-1);
    this.tweens.add({ targets: glow, alpha: 0.5, yoyo: true, repeat: -1, duration: 1800 });
    const orn = this.add.graphics().setAlpha(0);
    for (const [yy, d] of [[338, -1], [462, 1]] as const) {
      orn.lineStyle(2, 0xe8cc84, 1); orn.lineBetween(110, yy, 330, yy); orn.lineBetween(390, yy, 610, yy);
      orn.lineStyle(1, 0xe8cc84, 0.6); orn.lineBetween(150, yy + d * 6, 320, yy + d * 6); orn.lineBetween(400, yy + d * 6, 570, yy + d * 6);
      orn.fillStyle(0xffe7a0, 1); orn.fillTriangle(360, yy - 9, 372, yy, 360, yy + 9); orn.fillTriangle(360, yy - 9, 348, yy, 360, yy + 9);
      orn.fillStyle(0x7a1420, 1); orn.fillCircle(360, yy, 3.5);
      for (const x of [110, 610]) { orn.fillStyle(0xffe7a0, 1); orn.fillCircle(x, yy, 3); }
    }
    this.tweens.add({ targets: orn, alpha: 1, delay: 700, duration: 900 });
    const glint = () => { const g = this.add.image(W / 2 - 250 + Math.random() * 500, 370 + Math.random() * 50, 'star').setTint(0xfff4d0).setBlendMode(Phaser.BlendModes.ADD).setScale(0).setDepth(5); this.tweens.add({ targets: g, scale: 1.6, angle: 90, yoyo: true, duration: 380, onComplete: () => g.destroy() }); };
    this.time.addEvent({ delay: 900, loop: true, callback: glint });
    const sub = txt(this, W / 2, 492, 'A TALE OF FALLEN STARS', 24, '#efe0ff', { fontFamily: SERIF, letterSpacing: 6 } as any).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, delay: 900, duration: 900 });
    diorama(this.cameras.main, 'sky', { persp: 0, blur: 0, bloom: 1.1, rays: 0.16, fogAmt: 0, vig: 0.5, sat: 1.15 });
    this.add.text(W / 2, 1280 + DY / 2 - 30 - SAFE_B, `v${__APP_VERSION__} · an original JRPG · made with Grok Bot`, { fontFamily: FONT_SANS, fontSize: '19px', color: '#b8acd8' }).setOrigin(0.5).setDepth(5);

    const tap = txt(this, W / 2, 700, 'Tap to Begin', 38, '#ffe6b0', { fontFamily: SERIF }).setOrigin(0.5);
    this.tweens.add({ targets: tap, alpha: 0.25, yoyo: true, repeat: -1, duration: 700 });
    const start = () => {
      if (!tap.active) return; tap.destroy(); Audio.unlock(); Audio.play('title'); Audio.sfx('confirm'); this.time.delayedCall(250, () => this.showMenu());
      this.input.off('pointerdown', start); window.removeEventListener('keydown', kd);
    };
    const kd = (e: KeyboardEvent) => { if (e.code === 'Enter' || e.code === 'Space') start(); };
    this.input.on('pointerdown', start); window.addEventListener('keydown', kd);
    this.events.once('shutdown', () => window.removeEventListener('keydown', kd));
  }
  showMenu() {
    Input.backFallback = minimizeApp; // title root: background the app instead of killing it
    const latest = Game.latestSlot();
    const items = [{ label: 'Continue', disabled: latest < 0, sub: latest >= 0 ? `Log ${latest + 1}` : '' }, { label: 'Adventure Logs', disabled: latest < 0 }, { label: 'New Game' }, { label: 'How to Play' }];
    const menu = new ListMenu(this, 140, 600, 440, items, { itemH: 78, fontSize: 36, back: false });
    menu.idx = latest >= 0 ? 0 : 2; menu.refresh();
    menu.onSelect = async i => {
      if (i === 0) { menu.close(); this.begin(latest); }
      if (i === 1) { menu.setActive(false); const k = await this.pickSlot('Load which Adventure Log?', true); menu.setActive(true); if (k >= 0) { menu.close(); this.begin(k); } }
      if (i === 2) {
        menu.setActive(false);
        const k = await this.pickSlot('Record the new adventure in…', false);
        if (k < 0) { menu.setActive(true); return; }
        const inf = Game.slotInfo(k);
        if (inf) {
          const ok = await this.confirm(`Adventure Log ${k + 1} holds ${inf.name} (Lv ${inf.level}).\nOverwrite it once the new adventure is first saved?`);
          if (!ok) { menu.setActive(true); return; }
        }
        menu.close(); Game.slot = k; this.cameras.main.fadeOut(500); this.time.delayedCall(520, () => this.scene.start('Create', { mode: 'hero', slot: k }));
      }
      if (i === 3) { menu.setActive(false); await card(this, 'How to Play', 'Drag anywhere to move — in 8 directions.\nTap ✦ to talk, examine and confirm.\nTap ☰ for the menu. ◀ Back (top-left) or your phone\'s back button closes any menu.\n\nYour adventure autosaves when you change areas, after battles and at story moments. Star-Shrines and Menu → Save also save.\n\nKeyboard: Arrows/WASD, Enter/Space, Esc, M.'); menu.setActive(true); }
    };
  }
  begin(slot: number) {
    if (!Game.load(slot)) { card(this, 'Could not load', 'This Adventure Log could not be read.'); this.scene.restart(); return; }
    this.cameras.main.fadeOut(500);
    this.time.delayedCall(520, () => { Audio.stopMusic(); this.scene.start('World', { map: Game.s.map, x: Game.s.x, y: Game.s.y, dir: Game.s.dir }); });
  }
  /** Adventure Log picker. When loading, empty logs are disabled. Returns -1 on Back. */
  pickSlot(title: string, loading: boolean): Promise<number> {
    return new Promise(res => {
      const names = ['Opening', 'Ch. II', 'Ch. III'];
      const items = Array.from({ length: SLOTS_N }, (_, i) => {
        const inf = Game.slotInfo(i);
        if (!inf) return { label: `Log ${i + 1}  —  empty`, disabled: loading };
        const t = inf.playTime; const tm = `${Math.floor(t / 3600)}:${String(Math.floor(t / 60) % 60).padStart(2, '0')}`;
        return { label: `Log ${i + 1}  ${inf.name}`, sub: `Lv${inf.level} · ${names[inf.chapter - 1] || ''} · ${tm}${inf.fromBackup ? ' ⚠' : ''}` };
      });
      const m = new ListMenu(this, 30, 560, W - 60, [...items, { label: 'Back' }], { title, itemH: 84, fontSize: 30 }).setDepth(50);
      { const infos = Array.from({ length: SLOTS_N }, (_, i) => Game.slotInfo(i)); const empty = infos.findIndex(x => !x); const latest = Game.latestSlot();
        m.idx = loading ? Math.max(0, latest) : empty >= 0 ? empty : Math.max(0, latest); m.refresh(); }
      m.onSelect = i => { m.close(); res(i === SLOTS_N ? -1 : i); }; m.onCancel = () => { m.close(); res(-1); };
    });
  }
  confirm(q: string): Promise<boolean> {
    return new Promise(res => {
      const c = this.add.container(0, 0).setDepth(60); c.add(this.add.rectangle(0, -DY, W, H + DY * 2, 0, 0.6).setOrigin(0).setInteractive());
      c.add(panel(this, 40, 420, W - 80, 220)); c.add(txt(this, W / 2, 450, q, 28, COL.text, { align: 'center', wordWrap: { width: W - 140 } }).setOrigin(0.5, 0));
      const m = new ListMenu(this, 160, 660, 400, [{ label: 'No, go back' }, { label: 'Yes, overwrite' }], { itemH: 76 }).setDepth(61);
      const done = (v: boolean) => { m.close(); c.destroy(); res(v); };
      m.onSelect = i => done(i === 1); m.onCancel = () => done(false);
    });
  }
}
