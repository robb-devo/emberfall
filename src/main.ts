import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CreateScene } from './scenes/CreateScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { BattleScene } from './scenes/BattleScene';
import { EndScene } from './scenes/EndScene';
import { DioramaFX } from './fx/diorama';
import { W, H } from './ui/widgets';
import { Game } from './systems/state';
import { Audio } from './systems/audio';
import { Input } from './ui/input';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#0b0a14',
  pixelArt: true, roundPixels: true, antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  fps: { target: 60 }, pipeline: { DioramaFX } as any, input: { activePointers: 3 },
  scene: [BootScene, TitleScene, CreateScene, WorldScene, UIScene, BattleScene, EndScene],
});
// Debug/test hook (used by headless playthrough tests)
(window as any).__EMBER = { game, Game, Audio, Input, scene: (k: string) => game.scene.getScene(k), active: () => game.scene.getScenes(true).map(s => s.scene.key) };
const unlock = () => Audio.unlock();
window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
setInterval(() => { if (Game.s) Game.s.playTime += 1; }, 1000);
