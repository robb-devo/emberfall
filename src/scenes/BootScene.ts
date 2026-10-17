import Phaser from 'phaser';
import { makeMonsters2, makeBackdrops2, makeProps2 } from '../systems/art3';
import { makeTiles, makeMonsters, makeFx } from '../systems/art';
import { makeDarkProps } from '../gfx/darkprops';
import { txt, W, H } from '../ui/widgets';
export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    const t = txt(this, W / 2, H / 2, 'Forging stars…', 32).setOrigin(0.5);
    // bundled fonts must be ready before any text texture is rasterised
    const fl = (document as any).fonts; const ready: Promise<any> = fl ? Promise.race([Promise.all(['700 32px Cinzel', '900 32px Cinzel', '900 32px "Cinzel Decorative"', '500 32px "Alegreya Sans"', '700 32px "Alegreya Sans"'].map(f => fl.load(f))), new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
    ready.catch(() => 0).then(() => this.time.delayedCall(30, () => {
      makeTiles(this); makeMonsters(this); makeFx(this); makeMonsters2(this); makeBackdrops2(this); makeProps2(this); makeDarkProps(this);
      t.destroy(); this.scene.launch('Overlay'); this.scene.start('Title');
    }));
  }
}
