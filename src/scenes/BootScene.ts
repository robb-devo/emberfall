import Phaser from 'phaser';
import { makeTiles, makeMonsters, makeFx } from '../systems/art';
import { txt, W, H } from '../ui/widgets';
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    const t = txt(this, W / 2, H / 2, 'Forging stars…', 32).setOrigin(0.5);
    this.time.delayedCall(30, () => {
      makeTiles(this); makeMonsters(this); makeFx(this);
      t.destroy(); this.scene.start('Title');
    });
  }
}
