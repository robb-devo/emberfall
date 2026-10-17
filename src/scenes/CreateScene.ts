import Phaser from 'phaser';
import { txt, panel, W, H, COL, SERIF } from '../ui/widgets';
import { Input, Focus, Action } from '../ui/input';
import { Audio } from '../systems/audio';
import { Game, newMember, Look, stats, Member } from '../systems/state';
import { ensureDoll, SKIN_NAMES, HAIR_NAMES, EYE_NAMES, OUTFIT_NAMES, HAIR_STYLES, FACES, BODIES, randomLook } from '../systems/paperdoll';
import { VOCATIONS, STARTING_VOCS } from '../data/vocations';

const STARTER: Record<string, Record<string, string>> = {
  warrior: { weapon: 'shortsword', armor: 'tunic', shield: 'pot' }, mage: { weapon: 'stick', armor: 'tunic' },
  priest: { weapon: 'stick', armor: 'tunic' }, thief: { weapon: 'dagger', armor: 'tunic', head: 'bandana' },
  paladin: { weapon: 'shortsword', armor: 'leather', shield: 'buckler' }, ranger: { weapon: 'shortbow', armor: 'tunic', head: 'hood' }, bard: { weapon: 'lute', armor: 'tunic', head: 'featherCap' },
};
export { STARTER };
const NAMES = ['Aster', 'Rook', 'Juniper', 'Cass', 'Bryn', 'Orrin', 'Wren', 'Sable', 'Tamsin', 'Kael', 'Ivo', 'Lark', 'Nell', 'Dorian', 'Fia', 'Quill', 'Marlo', 'Seren'];

interface Row { key: string; label: string; opts?: string[]; get: () => number; set: (v: number) => void }

export class CreateScene extends Phaser.Scene implements Focus {
  mode: 'hero' | 'companion' = 'hero'; onDone?: (m: Member | null) => void;
  look!: Look; voc = 'warrior'; name = 'Aster'; sel = 0; rows: Row[] = []; rowObjs: Phaser.GameObjects.Container[] = [];
  doll!: Phaser.GameObjects.Sprite; dirIdx = 0; info!: Phaser.GameObjects.Text; nameEntry?: NameEntry; statsT!: Phaser.GameObjects.Text;
  constructor() { super('Create'); }
  slot = 0;
  get canBack() { return !this.nameEntry; }
  init(d: { mode: 'hero' | 'companion'; onDone?: (m: Member | null) => void; slot?: number }) { this.mode = d.mode; this.onDone = d.onDone; this.sel = 0; this.slot = d.slot ?? Game.slot; this.nameEntry = undefined; }
  create() {
    this.cameras.main.fadeIn(400);
    if (this.mode === 'hero') Audio.play('hearth');
    this.look = this.mode === 'hero' ? { body: 0, skin: 1, hairStyle: 1, hair: 1, eyes: 1, face: 0, outfit: 0, outfit2: 6 } : randomLook();
    if (this.mode === 'companion') { this.name = NAMES[Math.floor(Math.random() * NAMES.length)]; this.voc = ['priest', 'mage', 'thief', 'warrior'][Game.s.party.length % 4]; }
    const bg = this.add.graphics(); bg.fillGradientStyle(0x1a1440, 0x1a1440, 0x070512, 0x070512, 1); bg.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { const s = this.add.image(Math.random() * W, Math.random() * 520, 'px').setAlpha(Math.random()); this.tweens.add({ targets: s, alpha: 0.1, yoyo: true, repeat: -1, duration: 800 + Math.random() * 2000 }); }
    txt(this, W / 2, 46, this.mode === 'hero' ? 'Who are you, Star-Warden?' : 'Register a Companion', 40, COL.accent, { fontFamily: SERIF }).setOrigin(0.5);
    // pedestal + doll
    const ped = this.add.graphics(); ped.fillStyle(0x3a2a6a, 1); ped.fillEllipse(W / 2, 470, 260, 60); ped.fillStyle(0x6a5aa0, 1); ped.fillEllipse(W / 2, 462, 230, 44);
    this.add.image(W / 2, 330, 'light').setTint(0xffd890).setScale(3.2).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD);
    this.add.particles(0, 0, 'dot', { x: { min: W / 2 - 120, max: W / 2 + 120 }, y: 470, lifespan: 2000, speedY: { min: -40, max: -90 }, scale: { start: 1, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [0xffe8a0, 0x9ad0ff], blendMode: 'ADD', frequency: 120 });
    this.doll = this.add.sprite(W / 2, 470, '__DEFAULT').setOrigin(0.5, 1).setScale(13);
    const rot = (d: number) => { this.dirIdx = (this.dirIdx + d + 4) % 4; this.refreshDoll(); Audio.sfx('cursor'); };
    const la = txt(this, W / 2 - 230, 330, '⟲', 54, COL.goldS).setOrigin(0.5).setInteractive(); la.on('pointerdown', () => rot(1));
    const ra = txt(this, W / 2 + 230, 330, '⟳', 54, COL.goldS).setOrigin(0.5).setInteractive(); ra.on('pointerdown', () => rot(-1));
    this.time.addEvent({ delay: 220, loop: true, callback: () => { const f = [0, 1, 0, 2][Math.floor(this.time.now / 220) % 4]; const dirs = [0, 1, 3, 2]; this.doll.setFrame(dirs[this.dirIdx] * 3 + f); } });
    this.rows = [
      { key: 'name', label: 'Name', get: () => 0, set: () => {} },
      { key: 'voc', label: 'Vocation', opts: this.vocList().map(k => VOCATIONS[k].name), get: () => Math.max(0, this.vocList().indexOf(this.voc)), set: v => (this.voc = this.vocList()[v]) },
      { key: 'body', label: 'Build', opts: BODIES, get: () => this.look.body, set: v => (this.look.body = v) },
      { key: 'skin', label: 'Skin', opts: SKIN_NAMES, get: () => this.look.skin, set: v => (this.look.skin = v) },
      { key: 'face', label: 'Eyes', opts: FACES, get: () => this.look.face, set: v => (this.look.face = v) },
      { key: 'eyes', label: 'Eye Colour', opts: EYE_NAMES, get: () => this.look.eyes, set: v => (this.look.eyes = v) },
      { key: 'hairStyle', label: 'Hairstyle', opts: HAIR_STYLES, get: () => this.look.hairStyle, set: v => (this.look.hairStyle = v) },
      { key: 'hair', label: 'Hair Colour', opts: HAIR_NAMES, get: () => this.look.hair, set: v => (this.look.hair = v) },
      { key: 'outfit', label: 'Outfit', opts: OUTFIT_NAMES, get: () => this.look.outfit, set: v => (this.look.outfit = v) },
      { key: 'outfit2', label: 'Trim', opts: OUTFIT_NAMES, get: () => this.look.outfit2, set: v => (this.look.outfit2 = v) },
      { key: 'random', label: '✦ Randomise', get: () => 0, set: () => {} },
      { key: 'done', label: this.mode === 'hero' ? '✔ Begin Adventure' : '✔ Register', get: () => 0, set: () => {} },
    ];
    this.add.existing(panel(this, 20, 510, W - 40, 230));
    this.info = txt(this, 50, 530, '', 25, COL.text, { wordWrap: { width: W - 100 }, lineSpacing: 6 });
    this.statsT = txt(this, 50, 650, '', 24, COL.goldS, { lineSpacing: 6 });
    this.add.existing(panel(this, 20, 760, W - 40, 500));
    this.buildRows(); this.refreshDoll(); Input.push(this);
    this.events.once('shutdown', () => Input.pop(this));
  }
  buildRows() {
    this.rowObjs.forEach(r => r.destroy()); this.rowObjs = [];
    const rh = 40, y0 = 782;
    this.rows.forEach((r, i) => {
      const c = this.add.container(0, y0 + i * rh);
      const hl = this.add.rectangle(36, 0, W - 72, rh - 2, 0xffcf6e, i === this.sel ? 0.18 : 0).setOrigin(0); c.add(hl);
      const isBtn = r.key === 'random' || r.key === 'done';
      c.add(txt(this, isBtn ? W / 2 : 60, rh / 2, r.label, 26, isBtn ? COL.accent : i === this.sel ? COL.accent : COL.text).setOrigin(isBtn ? 0.5 : 0, 0.5));
      if (!isBtn) {
        const val = r.key === 'name' ? this.name : r.opts![r.get()];
        c.add(txt(this, W - 300, rh / 2, '◀', 26, COL.goldS).setOrigin(0.5));
        c.add(txt(this, W - 190, rh / 2, val, 26).setOrigin(0.5));
        c.add(txt(this, W - 80, rh / 2, r.key === 'name' ? '✎' : '▶', 26, COL.goldS).setOrigin(0.5));
      }
      const z = this.add.zone(36, 0, W - 72, rh).setOrigin(0).setInteractive(); c.add(z);
      z.on('pointerdown', (p: Phaser.Input.Pointer) => {
        if (this.nameEntry) return;
        this.sel = i; if (isBtn || r.key === 'name') { this.onAction('ok'); return; }
        this.change(p.x < W - 190 ? -1 : 1);
      });
      this.rowObjs.push(c);
    });
    const v = VOCATIONS[this.voc];
    this.info.setText(`${this.name} the ${v.name}\n${v.desc}`);
    const m = newMember('x', this.name, this.voc, this.look); m.equip = STARTER[this.voc] as any; const s = stats(m);
    this.statsT.setText(`HP ${s.hp}   MP ${s.mp}   ATK ${s.atk}   DEF ${s.def}   AGI ${s.agi}   MAG ${s.mag}`);
  }
  /** Starting vocations, plus those unlocked at the Chapel of Alltrades. */
  vocList() { return Object.keys(VOCATIONS).filter(k => STARTING_VOCS.includes(k) || (this.mode === 'companion' && Game.s?.flags?.vocationsOpen)); }
  refreshDoll() { const key = ensureDoll(this, { look: { ...this.look }, equip: STARTER[this.voc] }); this.doll.setTexture(key, [0, 3, 9, 6][this.dirIdx]); }
  change(d: number) {
    const r = this.rows[this.sel]; if (!r.opts) return; const n = r.opts.length; r.set((r.get() + d + n) % n); Audio.sfx('cursor');
    this.buildRows(); this.refreshDoll();
    this.tweens.add({ targets: this.doll, scaleY: 12.2, yoyo: true, duration: 80 });
  }
  onAction(a: Action) {
    if (this.nameEntry) return;
    if (a === 'up') { this.sel = (this.sel + this.rows.length - 1) % this.rows.length; Audio.sfx('cursor'); this.buildRows(); }
    if (a === 'down') { this.sel = (this.sel + 1) % this.rows.length; Audio.sfx('cursor'); this.buildRows(); }
    if (a === 'left') this.change(-1); if (a === 'right') this.change(1);
    if (a === 'cancel' && this.mode === 'companion') { this.finish(null); }
    if (a === 'cancel' && this.mode === 'hero') { Input.pop(this); Audio.sfx('cancel'); this.cameras.main.fadeOut(300); this.time.delayedCall(320, () => this.scene.start('Title')); return; }
    if (a === 'ok') {
      const r = this.rows[this.sel];
      if (r.key === 'name') { Audio.sfx('confirm'); this.nameEntry = new NameEntry(this, this.name, n => { this.nameEntry = undefined; if (n) this.name = n; this.buildRows(); }); }
      else if (r.key === 'random') { Audio.sfx('confirm'); this.look = randomLook(); if (this.mode === 'companion') this.name = NAMES[Math.floor(Math.random() * NAMES.length)]; this.buildRows(); this.refreshDoll(); }
      else if (r.key === 'done') {
        Audio.sfx('join');
        if (this.mode === 'hero') {
          Input.pop(this); Game.newGame(this.name, this.voc, { ...this.look }, this.slot); Game.hero.equip = { ...STARTER[this.voc] } as any;
          this.cameras.main.fadeOut(900, 255, 255, 255);
          this.time.delayedCall(950, () => this.scene.start('World', { map: 'spire', x: 7, y: 13, dir: 3, script: 'prologue' }));
        } else {
          const m = newMember('c' + Date.now(), this.name, this.voc, { ...this.look }, Math.max(1, Game.hero.level - 1));
          m.equip = { ...STARTER[this.voc] } as any; const s = stats(m); m.hp = s.hp; m.mp = s.mp; this.finish(m);
        }
      } else this.change(1);
    }
  }
  finish(m: Member | null) { Input.pop(this); const cb = this.onDone; this.scene.stop(); cb?.(m); }
}

/** On-screen keyboard (also accepts physical typing). */
class NameEntry implements Focus {
  canBack = true;
  c: Phaser.GameObjects.Container; value: string; t: Phaser.GameObjects.Text; keyH: (e: KeyboardEvent) => void;
  constructor(public s: Phaser.Scene, init: string, public done: (v: string | null) => void) {
    this.value = init; this.c = s.add.container(0, 0).setDepth(100);
    this.c.add(s.add.rectangle(0, 0, W, H, 0, 0.7).setOrigin(0).setInteractive());
    this.c.add(panel(s, 30, 300, W - 60, 720));
    this.c.add(txt(s, W / 2, 340, 'Enter a name', 32, COL.accent).setOrigin(0.5));
    this.t = txt(s, W / 2, 410, '', 46).setOrigin(0.5); this.c.add(this.t);
    const keys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').concat(['-', "'", ' ']);
    keys.forEach((k, i) => {
      const x = 90 + (i % 7) * 90, y = 500 + Math.floor(i / 7) * 90;
      const b = txt(s, x, y, k === ' ' ? '␣' : k, 40).setOrigin(0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => this.type(k)); this.c.add(b);
    });
    const del = txt(s, 200, 960, '⌫ Delete', 32, COL.goldS).setOrigin(0.5).setInteractive(); del.on('pointerdown', () => this.back());
    const ok = txt(s, 520, 960, '✔ OK', 32, COL.accent).setOrigin(0.5).setInteractive(); ok.on('pointerdown', () => this.ok());
    this.c.add([del, ok]);
    this.keyH = (e: KeyboardEvent) => { if (e.key.length === 1 && /[a-zA-Z' -]/.test(e.key)) { this.type(e.key); e.stopImmediatePropagation(); e.preventDefault(); } else if (e.key === 'Backspace') { this.back(); e.stopImmediatePropagation(); } };
    window.addEventListener('keydown', this.keyH, true); Input.push(this); this.render();
  }
  type(k: string) { if (this.value.length >= 10) return; this.value = this.value.length === 0 ? k.toUpperCase() : this.value + k.toLowerCase(); Audio.sfx('cursor'); this.render(); }
  back() { this.value = this.value.slice(0, -1); Audio.sfx('cancel'); this.render(); }
  render() { this.t.setText(this.value + '_'); }
  ok() { if (!this.value.trim()) return; this.close(this.value.trim()); }
  close(v: string | null) { window.removeEventListener('keydown', this.keyH, true); Input.pop(this); this.c.destroy(); Audio.sfx('confirm'); this.done(v); }
  onAction(a: Action) { if (a === 'ok') this.ok(); if (a === 'cancel') this.close(null); }
}
