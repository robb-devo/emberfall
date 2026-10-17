import Phaser from 'phaser';
import { txt, W, H, ListMenu, SERIF, COL, card, panel } from '../ui/widgets';
import { Input } from '../ui/input';
import { Audio } from '../systems/audio';
import { Game, SLOTS_N } from '../systems/state';
import { ensureDoll } from '../systems/paperdoll';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    this.cameras.main.fadeIn(800, 0, 0, 0);
    // sky gradient
    const sky = this.textures.exists('titleSky') ? null : this.textures.createCanvas('titleSky', 90, 160)!;
    if (sky) { const c = sky.getContext(); const g = c.createLinearGradient(0, 0, 0, 160); g.addColorStop(0, '#05061a'); g.addColorStop(0.45, '#1c1446'); g.addColorStop(0.75, '#5a2a5a'); g.addColorStop(1, '#e07a4a'); c.fillStyle = g; c.fillRect(0, 0, 90, 160); sky.refresh(); }
    this.add.image(0, 0, 'titleSky').setOrigin(0).setDisplaySize(W, H);
    // stars
    for (let i = 0; i < 140; i++) {
      const s = this.add.image(Math.random() * W, Math.random() * H * 0.7, 'px').setScale(Math.random() < 0.15 ? 2 : 1).setAlpha(Math.random());
      this.tweens.add({ targets: s, alpha: { from: 0.1, to: 1 }, duration: 600 + Math.random() * 2400, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
    }
    // aurora ribbons
    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.18);
      const col = [0x40ffc0, 0x8060ff, 0xff60c0][i];
      const draw = (t: number) => { g.clear(); g.fillStyle(col, 1); g.beginPath(); g.moveTo(0, 300 + i * 60); for (let x = 0; x <= W; x += 24) g.lineTo(x, 260 + i * 70 + Math.sin(x * 0.01 + t * 0.0006 * (i + 1)) * 50); for (let x = W; x >= 0; x -= 24) g.lineTo(x, 330 + i * 70 + Math.sin(x * 0.013 + t * 0.0008) * 40); g.closePath(); g.fillPath(); };
      this.events.on('update', (_: any, __: any) => draw(this.time.now));
    }
    // falling star loop
    const fallStar = () => {
      const x0 = 120 + Math.random() * 480; const st = this.add.image(x0, -20, 'star').setScale(2).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD);
      const trail = this.add.particles(0, 0, 'dot', { follow: st, lifespan: 700, speed: 10, scale: { start: 1.6, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xffe8a0, 0xff9a40, 0xffffff], blendMode: 'ADD', frequency: 12 });
      this.tweens.add({ targets: st, x: x0 - 260, y: 780, angle: 360, duration: 2200, ease: 'Quad.in', onComplete: () => { st.destroy(); this.time.delayedCall(800, () => trail.destroy()); } });
    };
    fallStar(); this.time.addEvent({ delay: 4200, loop: true, callback: fallStar });
    // spire silhouette far away (floating)
    const sp = this.add.graphics(); sp.fillStyle(0x2a1a4a, 1); sp.fillTriangle(560, 120, 540, 330, 580, 330); sp.fillRect(530, 300, 60, 14); sp.fillTriangle(530, 314, 590, 314, 560, 380);
    sp.fillStyle(0xffe8a0, 1); sp.fillCircle(560, 150, 5); this.tweens.add({ targets: sp, y: 12, yoyo: true, repeat: -1, duration: 3000, ease: 'Sine.inOut' });
    const halo = this.add.image(560, 150, 'light').setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8); this.tweens.add({ targets: halo, scale: 1.1, alpha: 0.6, yoyo: true, repeat: -1, duration: 1400 });
    // mountains
    const m = this.add.graphics();
    const ridge = (y: number, amp: number, col: number, seed: number) => { m.fillStyle(col, 1); m.beginPath(); m.moveTo(0, H); for (let x = 0; x <= W; x += 20) m.lineTo(x, y + Math.sin(x * 0.012 + seed) * amp + Math.sin(x * 0.041 + seed * 2) * amp * 0.4); m.lineTo(W, H); m.closePath(); m.fillPath(); };
    ridge(820, 60, 0x2a1838, 1); ridge(900, 50, 0x1c1028, 4); ridge(1010, 30, 0x0e0818, 2);
    // hero on cliff with cape
    m.fillStyle(0x08040e, 1); m.fillTriangle(380, 1280, 470, 1060, 720, 1280); m.fillRect(450, 1060, 120, 220);
    const key = ensureDoll(this, { look: { body: 0, skin: 1, hairStyle: 1, hair: 3, eyes: 1, face: 3, outfit: 0, outfit2: 6 }, equip: { weapon: 'ironsword', acc: 'cape', armor: 'leather' } });
    const hero = this.add.sprite(505, 1062, key, 9).setOrigin(0.5, 1).setScale(6).setTint(0x2a2040);
    this.add.image(505, 1000, 'light').setTint(0xff9a60).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.35);
    // embers rising
    this.add.particles(0, 0, 'dot', { x: { min: 0, max: W }, y: H + 10, lifespan: 6000, speedY: { min: -60, max: -140 }, speedX: { min: -20, max: 20 }, scale: { start: 1.2, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xff9a40, 0xffd070, 0xff5a30], blendMode: 'ADD', frequency: 90 });
    // logo
    const logo = this.add.text(W / 2, 410, 'EMBERFALL', { fontFamily: SERIF, fontSize: '96px', fontStyle: 'bold', color: '#ffe8b0', stroke: '#2a0e1a', strokeThickness: 12 }).setOrigin(0.5);
    const grad = logo.context.createLinearGradient(0, 20, 0, logo.height - 20); grad.addColorStop(0, '#fff6d8'); grad.addColorStop(0.5, '#ffc860'); grad.addColorStop(1, '#e0502a'); logo.setFill(grad);
    logo.setShadow(0, 0, '#ff8040', 28, true, true); logo.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
    logo.setScale(1.4).setAlpha(0); this.tweens.add({ targets: logo, scale: 1, alpha: 1, duration: 1400, ease: 'Expo.out' });
    const glow = this.add.image(W / 2, 410, 'light').setTint(0xff8040).setScale(6, 1.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.3).setDepth(-1);
    this.tweens.add({ targets: glow, alpha: 0.55, yoyo: true, repeat: -1, duration: 1800 });
    const sub = txt(this, W / 2, 505, 'A   T A L E   O F   F A L L E N   S T A R S', 22, '#e8d8ff').setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: sub, alpha: 1, delay: 900, duration: 900 });
    this.add.text(W / 2, H - 30, `v${__APP_VERSION__} · an original JRPG · made with Grok Bot`, { fontFamily: 'sans-serif', fontSize: '18px', color: '#8a80a8' }).setOrigin(0.5);

    const tap = txt(this, W / 2, 700, 'TAP TO BEGIN', 36, COL.accent).setOrigin(0.5);
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
    Input.backFallback = () => { /* title root: send the app to the background instead of killing it */ import('@capacitor/app').then(m => m.App.minimizeApp()).catch(() => {}); };
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
      const c = this.add.container(0, 0).setDepth(60); c.add(this.add.rectangle(0, 0, W, H, 0, 0.6).setOrigin(0).setInteractive());
      c.add(panel(this, 40, 420, W - 80, 220)); c.add(txt(this, W / 2, 450, q, 28, COL.text, { align: 'center', wordWrap: { width: W - 140 } }).setOrigin(0.5, 0));
      const m = new ListMenu(this, 160, 660, 400, [{ label: 'No, go back' }, { label: 'Yes, overwrite' }], { itemH: 76 }).setDepth(61);
      const done = (v: boolean) => { m.close(); c.destroy(); res(v); };
      m.onSelect = i => done(i === 1); m.onCancel = () => done(false);
    });
  }
}
