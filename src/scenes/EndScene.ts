import Phaser from 'phaser';
import { txt, W, H, SERIF, COL } from '../ui/widgets';
import { Audio } from '../systems/audio';
import { Game } from '../systems/state';
import { ensureDoll, specOf } from '../systems/paperdoll';

const fast = () => !!(window as any).__EMBER?.fast;
export class EndScene extends Phaser.Scene {
  constructor() { super('End'); }
  chapter = 1;
  init(d: any) { this.chapter = d?.chapter || 1; }
  create() {
    Audio.play('title');
    Game.save('chapter');
    this.cameras.main.fadeIn(1500);
    const sky = this.add.graphics(); sky.fillGradientStyle(0x05061a, 0x05061a, 0x2a1440, 0x2a1440, 1); sky.fillRect(0, 0, W, H);
    for (let i = 0; i < 120; i++) { const s = this.add.image(Math.random() * W, Math.random() * H, 'px').setAlpha(Math.random()); this.tweens.add({ targets: s, alpha: 0.1, yoyo: true, repeat: -1, duration: 600 + Math.random() * 2000 }); }
    this.time.addEvent({ delay: 500, loop: true, callback: () => { const x = Math.random() * W; const st = this.add.image(x, -10, 'star').setScale(1 + Math.random()).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD); this.tweens.add({ targets: st, x: x - 300, y: H * 0.7, alpha: 0, duration: 2500, onComplete: () => st.destroy() }); } });
    const party = Game.s.party;
    party.forEach((m, i) => { const x = W / 2 + (i - (party.length - 1) / 2) * 140; this.add.sprite(x, 1100, ensureDoll(this, specOf(m)), 0).setOrigin(0.5, 1).setScale(7); });
    const lines: [string, number, string][] = [
      [this.chapter === 1 ? 'END OF CHAPTER I' : 'END OF CHAPTER II', 52, '#ffd890'], [this.chapter === 1 ? 'The Fallen Star' : 'The Drowned Choir', 34, '#e8d8ff'], ['', 20, ''],
      [`${Game.hero.name}  ·  Level ${Game.hero.level}`, 30, COL.text], [`Play time ${Math.floor(Game.s.playTime / 60)} min  ·  ${Game.s.gold} gold`, 26, COL.dim], ['', 20, ''],
      ...(this.chapter === 1
        ? [['Vesper hunts the fallen Wardens.', 28, COL.text], ['Somewhere, a star is still burning.', 28, COL.text], ['', 30, ''], ['Next:', 26, COL.dim], ['Chapter II — The Drowned Choir', 34, COL.accent]] as [string, number, string][]
        : [['The lighthouse burns again.', 28, COL.text], ['But someone with a halo still', 28, COL.text], ['is pulling Vesper\'s strings.', 28, COL.text], ['', 30, ''], ['To be continued in', 26, COL.dim], ['Chapter III — The Ashen Cathedral', 34, COL.accent]] as [string, number, string][]),
      ['', 30, ''], ['(Your progress has been saved.)', 22, COL.dim], [this.chapter === 1 ? 'Tap to begin Chapter II' : 'Tap to keep exploring Saltmere', 24, COL.goldS],
    ];
    let y = 200; lines.forEach(([t, s, c], i) => { if (t) { const o = txt(this, W / 2, y, t, s, c, i < 2 ? { fontFamily: SERIF } : {}).setOrigin(0.5).setAlpha(0); this.tweens.add({ targets: o, alpha: 1, delay: 800 + i * 450, duration: 900 }); } y += s + 26; });
    (window as any).__EMBER.ended = true;
    const go = () => {
      this.cameras.main.fadeOut(800);
      this.time.delayedCall(820, () => {
        (window as any).__EMBER.ended = false;
        if (this.chapter === 1) { Game.set('night', false); this.scene.start('World', { map: 'elder', x: 4, y: 6, dir: 3, script: 'ch2Dawn' }); }
        else this.scene.start('World', { map: Game.s.map, x: Game.s.x, y: Game.s.y, dir: 0 });
      });
    };
    this.time.delayedCall(fast() ? 50 : 4000, () => { this.input.once('pointerdown', go); const k = this.input.keyboard; k?.once('keydown-ENTER', go); });
  }
}
