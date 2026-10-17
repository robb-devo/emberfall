import Phaser from 'phaser';
import { txt, W, H, SERIF, COL } from '../ui/widgets';
import { Audio } from '../systems/audio';
import { Game } from '../systems/state';
import { ensureDoll, specOf } from '../systems/paperdoll';

export class EndScene extends Phaser.Scene {
  constructor() { super('End'); }
  create() {
    Audio.play('title');
    Game.save();
    this.cameras.main.fadeIn(1500);
    const sky = this.add.graphics(); sky.fillGradientStyle(0x05061a, 0x05061a, 0x2a1440, 0x2a1440, 1); sky.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { const s = this.add.image(Math.random() * W, Math.random() * H, 'px').setAlpha(Math.random()); this.tweens.add({ targets: s, alpha: 0.1, yoyo: true, repeat: -1, duration: 600 + Math.random() * 2000 }); }
    this.time.addEvent({ delay: 500, loop: true, callback: () => { const x = Math.random() * W; const st = this.add.image(x, -10, 'star').setScale(1 + Math.random()).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: st, x: x - 300, y: H * 0.7, alpha: 0, duration: 2500, onComplete: () => st.destroy() }); } });
    const party = Game.s.party;
    party.forEach((m, i) => { const x = W / 2 + (i - (party.length - 1) / 2) * 140; this.add.sprite(x, 1100, ensureDoll(this, specOf(m)), 0).setOrigin(0.5, 1).setScale(7); });
    const lines: [string, number, string][] = [
      ['END OF CHAPTER I', 52, '#ffd890'], ['The Fallen Star', 34, '#e8d8ff'], ['', 20, ''],
      [`${Game.hero.name}  ·  Level ${Game.hero.level}`, 30, COL.text], [`Play time ${Math.floor(Game.s.playTime / 60)} min  ·  ${Game.s.gold} gold`, 26, COL.dim], ['', 20, ''],
      ['Vesper hunts the fallen Wardens.', 28, COL.text], ['Somewhere, a star is still burning.', 28, COL.text], ['', 30, ''],
      ['To be continued in', 26, COL.dim], ['Chapter II — The Drowned Choir', 34, COL.accent], ['', 30, ''], ['(Your progress has been saved.)', 22, COL.dim], ['Tap to return to title', 24, COL.goldS],
    ];
    let y = 200; lines.forEach(([t, s, c], i) => { if (t) { const o = txt(this, W / 2, y, t, s, c, i < 2 ? { fontFamily: SERIF } : {}).setOrigin(0.5).setAlpha(0); this.tweens.add({ targets: o, alpha: 1, delay: 800 + i * 450, duration: 900 }); } y += s + 26; });
    (window as any).__EMBER.ended = true;
    this.time.delayedCall(4000, () => this.input.once('pointerdown', () => { this.cameras.main.fadeOut(800); this.time.delayedCall(820, () => this.scene.start('Title')); }));
  }
}
