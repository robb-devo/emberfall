import Phaser from 'phaser';
import { txt, COL, W, H } from '../ui/widgets';
import { DioramaFX } from '../fx/diorama';
import { Input } from '../ui/input';
import { Audio } from '../systems/audio';

/**
 * Always-on-top overlay: the one unified Back button (same place, same look on every screen),
 * plus the autosave indicator. Shown whenever the focused menu/screen can go back.
 */
export class OverlayScene extends Phaser.Scene {
  btn!: Phaser.GameObjects.Container; saveIcon!: Phaser.GameObjects.Container; shown = false;
  constructor() { super({ key: 'Overlay', active: false }); }
  create() {
    const c = this.add.container(14, 14).setDepth(10);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35); g.fillRoundedRect(3, 6, 124, 60, 30);
    g.fillGradientStyle(0x2a2a5e, 0x2a2a5e, 0x0b0c22, 0x0b0c22, 0.96); g.fillRoundedRect(0, 0, 124, 60, 30);
    g.lineStyle(3, COL.gold, 1); g.strokeRoundedRect(1.5, 1.5, 121, 57, 28);
    c.add([g, txt(this, 62, 30, '◀ Back', 26, COL.goldS).setOrigin(0.5)]);
    c.setSize(150, 90); c.setInteractive(new Phaser.Geom.Rectangle(-8, -8, 150, 90), Phaser.Geom.Rectangle.Contains);
    c.on('pointerdown', () => { if (!Input.canBack()) return; this.tweens.add({ targets: c, scale: 0.9, yoyo: true, duration: 70 }); Input.back(); });
    c.setVisible(false); this.btn = c;
    // autosave indicator (bottom-left)
    const s = this.add.container(40, 1240).setAlpha(0);
    const star = this.add.image(0, 0, 'star').setScale(2.2).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD);
    s.add([star, txt(this, 26, 0, 'Saving…', 20, COL.goldS).setOrigin(0, 0.5)]); this.saveIcon = s;
    this.tweens.add({ targets: star, angle: 360, duration: 1400, repeat: -1 });
    (window as any).__EMBER.overlay = this;
  }
  // ------------------------------------------------------------ screen transitions
  lastNow = 0; wipeG?: Phaser.GameObjects.Graphics; wipeT = 0; wipeDir = 0; wipeMs = 300; wipeRes?: () => void; wipeSafety?: Phaser.Time.TimerEvent;
  /** diamond-tile wipe to black (cover) / from black (reveal) — the classic JRPG area change */
  cover(ms = 300): Promise<void> { return this.wipe(1, ms); }
  reveal(ms = 380): Promise<void> { if (!this.wipeG || this.wipeT <= 0) return Promise.resolve(); return this.wipe(-1, ms); }
  private wipe(dir: number, ms: number) {
    this.wipeSafety?.remove();
    if (!this.wipeG) this.wipeG = this.add.graphics().setDepth(50);
    this.wipeDir = dir; this.wipeMs = ms; this.wipeRes?.(); if (dir > 0) this.wipeT = Math.max(this.wipeT, 0.0001);
    if (dir > 0) this.wipeSafety = this.time.delayedCall(ms + 2500, () => { if (this.wipeT > 0 && this.wipeDir >= 0) this.reveal(); });
    return new Promise<void>(r => (this.wipeRes = r));
  }
  private drawWipe(dt: number) {
    if (!this.wipeG || (!this.wipeDir && this.wipeT <= 0)) return;
    if (this.wipeDir) { this.wipeT = Phaser.Math.Clamp(this.wipeT + this.wipeDir * dt / this.wipeMs, 0, 1); if ((this.wipeDir > 0 && this.wipeT >= 1) || (this.wipeDir < 0 && this.wipeT <= 0)) { this.wipeDir = 0; const r = this.wipeRes; this.wipeRes = undefined; r?.(); } }
    const g = this.wipeG; g.clear(); if (this.wipeT <= 0) return;
    if (this.wipeT >= 1) { g.fillStyle(0x05040c, 1); g.fillRect(0, 0, W, H); return; }
    const S = 72; g.fillStyle(0x05040c, 1);
    for (let y = -S / 2; y < H + S; y += S / 2) for (let x = ((y / (S / 2)) & 1) ? 0 : S / 2; x < W + S; x += S) {
      // sweep: diamonds grow from the bottom-left corner diagonally (reverse when revealing)
      const order = (x / W * 0.45 + (1 - y / H) * 0.55) * 0.6;
      const k = Phaser.Math.Clamp((this.wipeT - order) / 0.4, 0, 1); if (k <= 0) continue; const r = k * S * 0.72;
      g.fillPoints([{ x, y: y - r }, { x: x + r, y }, { x, y: y + r }, { x: x - r, y }] as any, true);
    }
  }
  /** Freeze-frame the current screen and shatter it into spinning shards (battle start). Resolves once the
   *  frozen frame covers the screen, so the caller can swap scenes underneath. */
  shatter(): Promise<void> {
    return new Promise(res => {
      const go = (img?: HTMLImageElement) => {
        if (!img || !this.sys.isActive()) { res(); return; }
        if (this.textures.exists('__snap')) this.textures.remove('__snap');
        this.textures.addImage('__snap', img);
        const root = this.add.container(0, 0).setDepth(40);
        const black = this.add.rectangle(0, 0, W, H, 0x05040c, 1).setOrigin(0); root.add(black);
        const fast = DioramaFX.quality === 0, cols = fast ? 4 : 6, rows = fast ? 6 : 10, cw = W / cols, ch = H / rows;
        const sw = img.width / W, sh = img.height / H;
        const shards: Phaser.GameObjects.Image[] = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const im = this.add.image(c * cw + cw / 2, r * ch + ch / 2, '__snap').setCrop(c * cw * sw, r * ch * sh, cw * sw, ch * sh);
          im.setDisplayOrigin((c * cw + cw / 2) * sw, (r * ch + ch / 2) * sh).setScale(1 / sw, 1 / sh); root.add(im); shards.push(im);
        }
        const flash = this.add.rectangle(0, 0, W, H, 0xffffff, 0.85).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD); root.add(flash);
        this.tweens.add({ targets: flash, alpha: 0, duration: 260 });
        res();
        shards.forEach((im, i) => {
          const dx = im.x - W / 2, dy = im.y - H / 2, d = Math.hypot(dx, dy) || 1, delay = 120 + d * 0.35 + Math.random() * 60;
          this.tweens.add({ targets: im, x: im.x + dx / d * (500 + Math.random() * 400), y: im.y + dy / d * (500 + Math.random() * 400) + 300, angle: (Math.random() - 0.5) * 540, scaleX: im.scaleX * 0.4, scaleY: im.scaleY * 0.4, alpha: 0.2, delay, duration: 620, ease: 'Cubic.in' });
          if (i === 0) void 0;
        });
        this.tweens.add({ targets: black, alpha: 0, delay: 520, duration: 420, onComplete: () => { root.destroy(); if (this.textures.exists('__snap')) this.textures.remove('__snap'); } });
      };
      try { this.game.renderer.snapshot(i => go(i as HTMLImageElement)); } catch { res(); }
      this.time.delayedCall(600, () => res());
    });
  }
  flashSaved(ok = true) {
    if (!this.sys.isActive() || !this.saveIcon?.active) return;
    const t = this.saveIcon.list[1] as Phaser.GameObjects.Text; t.setText(ok ? 'Saved' : 'Save failed!').setColor(ok ? COL.goldS : COL.red);
    this.tweens.killTweensOf(this.saveIcon); this.saveIcon.setAlpha(1);
    this.tweens.add({ targets: this.saveIcon, alpha: 0, delay: 1100, duration: 500 });
    if (!ok) Audio.sfx('cancel');
  }
  update(_t: number, dt: number) {
    const now = performance.now(); this.drawWipe(Math.min(now - (this.lastNow || now), 120)); this.lastNow = now; void dt;
    const show = Input.canBack();
    if (show !== this.shown) { this.shown = show; this.btn.setVisible(show); if (show) { this.btn.setAlpha(0).setX(-10); this.tweens.add({ targets: this.btn, alpha: 1, x: 14, duration: 140 }); } }
    const sm = this.game.scene; if (sm.getIndex(this) !== sm.scenes.length - 1) this.scene.bringToTop();
  }
}
