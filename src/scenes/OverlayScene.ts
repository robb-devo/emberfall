import Phaser from 'phaser';
import { txt, COL } from '../ui/widgets';
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
  flashSaved(ok = true) {
    if (!this.sys.isActive() || !this.saveIcon?.active) return;
    const t = this.saveIcon.list[1] as Phaser.GameObjects.Text; t.setText(ok ? 'Saved' : 'Save failed!').setColor(ok ? COL.goldS : COL.red);
    this.tweens.killTweensOf(this.saveIcon); this.saveIcon.setAlpha(1);
    this.tweens.add({ targets: this.saveIcon, alpha: 0, delay: 1100, duration: 500 });
    if (!ok) Audio.sfx('cancel');
  }
  update() {
    const show = Input.canBack();
    if (show !== this.shown) { this.shown = show; this.btn.setVisible(show); if (show) { this.btn.setAlpha(0).setX(-10); this.tweens.add({ targets: this.btn, alpha: 1, x: 14, duration: 140 }); } }
    const sm = this.game.scene; if (sm.getIndex(this) !== sm.scenes.length - 1) this.scene.bringToTop();
  }
}
