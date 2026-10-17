import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CreateScene } from './scenes/CreateScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { BattleScene } from './scenes/BattleScene';
import { EndScene } from './scenes/EndScene';
import { OverlayScene } from './scenes/OverlayScene';
import { MAPS } from './data/maps';
import { setMapValidator } from './systems/state';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { DioramaFX } from './fx/diorama';
import { WaterFX } from './fx/water';
import { W, H } from './ui/widgets';
import { Game, stats, skillsOf } from './systems/state';
import { SKILLS } from './data/skills';
import { Audio } from './systems/audio';
import { Input } from './ui/input';
import { ensureDollHd } from './systems/paperdoll';

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: W, height: H, backgroundColor: '#0b0a14',
  pixelArt: true, roundPixels: true, antialias: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  fps: { target: 60 }, pipeline: { DioramaFX, WaterFX } as any, input: { activePointers: 3 },
  scene: [BootScene, TitleScene, CreateScene, WorldScene, UIScene, BattleScene, EndScene, OverlayScene],
});
// Debug/test hook (used by headless playthrough tests)
(window as any).__EMBER = { ensureDollHd, game, Game, Audio, Input, stats, skillsOf, SKILLS, scene: (k: string) => game.scene.getScene(k), active: () => game.scene.getScenes(true).map(s => s.scene.key) };
const unlock = () => Audio.unlock();
window.addEventListener('pointerdown', unlock); window.addEventListener('keydown', unlock);
setInterval(() => { if (Game.s) Game.s.playTime += 1; }, 1000);

setMapValidator(id => !!MAPS[id]);
/** Save when the app is suspended — but only from a safe, idle moment (never mid-cutscene or mid-battle). */
function suspendSave(reason: string) {
  const w: any = (window as any).__EMBER.world;
  if (w && w.scene?.isActive() && w.canAutosave?.()) { Game.save(reason); }
}
document.addEventListener('visibilitychange', () => { if (document.hidden) suspendSave('suspend'); });
window.addEventListener('pagehide', () => suspendSave('pagehide'));
if (Capacitor.isNativePlatform()) {
  App.addListener('backButton', () => Input.hardwareBack());
  App.addListener('pause', () => suspendSave('pause'));
}
