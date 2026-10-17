import { DioramaFX } from '../fx/diorama';
import Phaser from 'phaser';
import { txt, panel, W, H, COL, ListMenu, DialogBox, card, drawBar, SERIF, MenuItem } from '../ui/widgets';
import { Input, Focus, Action } from '../ui/input';
import { Audio } from '../systems/audio';
import { Game, stats, Member, skillsOf, canEquip, baseStats, changeVocation } from '../systems/state';
import { TUTORIALS, QUESTS } from '../data/story';
import { ITEMS, SLOTS, SLOT_NAMES, Slot } from '../data/items';
import { SKILLS } from '../data/skills';
import { VOCATIONS, xpFor } from '../data/vocations';
import { ensureDollHd as ensureDoll, specOf } from '../systems/paperdoll';
import type { WorldScene } from './WorldScene';
import { MAPS } from '../data/maps';
import type { DollSpec } from '../systems/paperdoll';
import { ensurePortrait } from '../gfx/portrait';

const SHOPS: Record<string, string[]> = {
  weapons: ['stick', 'dagger', 'shortsword', 'mace', 'wand', 'bronzeAxe', 'ironsword'],
  armor: ['tunic', 'leather', 'robe', 'scale', 'pot', 'buckler', 'kite', 'bandana', 'pointyhat', 'helm', 'cape'],
  items: ['herb', 'antidote', 'ether', 'firebomb', 'feather'],
  peddler: ['herb', 'hiHerb', 'antidote', 'ether', 'feather', 'shortbow', 'lute', 'hood', 'featherCap'],
  tideWeapons: ['steelsword', 'spear', 'warhammer', 'longbow', 'seaStaff', 'lute', 'shortbow'],
  tideArmor: ['chain', 'sailorCoat', 'silkRobe', 'towerShield', 'shellBuckler', 'knightHelm', 'hood', 'featherCap', 'pearlRing'],
  tideItems: ['herb', 'hiHerb', 'antidote', 'ether', 'feather', 'firebomb'],
};

export class UIScene extends Phaser.Scene {
  dialog!: DialogBox; modal = false; hud!: Phaser.GameObjects.Container; partyHud!: Phaser.GameObjects.Container; locT?: Phaser.GameObjects.Container;
  joyBase!: Phaser.GameObjects.Image; joyKnob!: Phaser.GameObjects.Image; joyId = -1; joyOrigin = { x: 0, y: 0 }; fadeRect!: Phaser.GameObjects.Rectangle; actBtn!: Phaser.GameObjects.Container;
  constructor() { super('UI'); }
  get world() { return this.scene.get('World') as WorldScene; }
  create() {
    this.hud = this.add.container(0, 0);
    this.partyHud = this.add.container(0, 0); this.hud.add(this.partyHud);
    // menu button
    const mb = this.add.container(W - 70, 70); const mg = this.add.graphics(); mg.fillStyle(0x0b0c22, 0.8); mg.fillCircle(0, 0, 46); mg.lineStyle(4, COL.gold); mg.strokeCircle(0, 0, 44);
    mb.add([mg, txt(this, 0, 0, '☰', 44, COL.goldS).setOrigin(0.5)]); mb.setSize(100, 100).setInteractive();
    mb.on('pointerdown', () => { if (!this.modal && !this.world.busy && !Input.busy) { Audio.sfx('confirm'); this.openMenu(); } });
    this.hud.add(mb);
    // action button
    this.actBtn = this.add.container(W - 120, H - 190); const ag = this.add.graphics(); ag.fillStyle(0xffcf6e, 0.25); ag.fillCircle(0, 0, 86); ag.lineStyle(5, COL.gold, 0.9); ag.strokeCircle(0, 0, 84);
    this.actBtn.add([ag, txt(this, 0, 0, '✦', 64, COL.goldS).setOrigin(0.5)]); this.actBtn.setSize(180, 180).setInteractive();
    this.actBtn.on('pointerdown', () => { this.tweens.add({ targets: this.actBtn, scale: 0.88, yoyo: true, duration: 70 }); Input.fire('ok'); });
    this.hud.add(this.actBtn);
    // joystick
    this.joyBase = this.add.image(0, 0, 'joyBase').setVisible(false).setAlpha(0.9); this.joyKnob = this.add.image(0, 0, 'joyKnob').setVisible(false);
    this.input.on('pointerdown', (p: Phaser.Input.Pointer, over: any[]) => {
      if (over.length || this.modal || Input.busy || this.joyId >= 0) return;
      this.joyId = p.id; this.joyOrigin = { x: p.x, y: p.y }; this.joyBase.setPosition(p.x, p.y).setVisible(true); this.joyKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.joyId) return; let dx = p.x - this.joyOrigin.x, dy = p.y - this.joyOrigin.y; const d = Math.hypot(dx, dy), max = 70;
      if (d > max) { dx = dx / d * max; dy = dy / d * max; } this.joyKnob.setPosition(this.joyOrigin.x + dx, this.joyOrigin.y + dy);
      Input.joy.x = d > 16 ? dx / max : 0; Input.joy.y = d > 16 ? dy / max : 0;
    });
    const up = (p: Phaser.Input.Pointer) => { if (p.id !== this.joyId) return; this.joyId = -1; Input.joy.x = 0; Input.joy.y = 0; this.joyBase.setVisible(false); this.joyKnob.setVisible(false); };
    this.input.on('pointerup', up); this.input.on('pointerupoutside', up);
    this.dialog = new DialogBox(this);
    this.fadeRect = this.add.rectangle(0, 0, W, H, 0, 0).setOrigin(0).setDepth(5000);
    this.refreshHud();
  }
  update() { if (this.modal || Input.busy) { if (this.joyId >= 0) { this.joyId = -1; Input.joy.x = Input.joy.y = 0; this.joyBase.setVisible(false); this.joyKnob.setVisible(false); } } const tgt = this.world?.def?.id === 'spire' ? 0 : this.world?.busy && !this.modal ? 0.3 : 1; this.hud.setAlpha(this.hud.alpha + (tgt - this.hud.alpha) * 0.18); }
  refreshHud() {
    if (!this.partyHud) return;
    this.partyHud.removeAll(true);
    Game.s.party.forEach((m, i) => {
      const s = stats(m); const x = 16 + i * 150, y = 16;
      const c = this.add.container(x, y); const g = this.add.graphics(); g.fillStyle(0x0b0c22, 0.75); g.fillRoundedRect(0, 0, 142, 74, 10); g.lineStyle(2, COL.gold, 0.7); g.strokeRoundedRect(0, 0, 142, 74, 10);
      c.add(g); c.add(txt(this, 10, 6, m.name, 20, m.hp <= 0 ? COL.red : COL.text));
      c.add(txt(this, 132, 8, 'Lv' + m.level, 16, COL.goldS).setOrigin(1, 0));
      const hb = this.add.graphics({ x: 10, y: 36 }); drawBar(hb, 122, 14, m.hp / s.hp, COL.hp); c.add(hb);
      const mbar = this.add.graphics({ x: 10, y: 54 }); drawBar(mbar, 122, 10, s.mp ? m.mp / s.mp : 0, COL.mp); c.add(mbar);
      this.partyHud.add(c);
    });
    const gx = 16, gy = 98; this.partyHud.add(txt(this, gx, gy, `◈ ${Game.s.gold} G`, 22, COL.goldS));
  }
  setLocation(name: string, show: boolean) {
    this.refreshHud(); if (!show) return; this.locT?.destroy();
    const c = this.add.container(W / 2, 220).setDepth(50); const t = txt(this, 0, 0, name, 42, '#fff6d8', { fontFamily: SERIF }).setOrigin(0.5);
    const ln = this.add.graphics(); ln.lineStyle(2, COL.gold, 1); ln.lineBetween(-t.width / 2 - 40, 34, t.width / 2 + 40, 34); ln.lineBetween(-t.width / 2 - 40, -34, t.width / 2 + 40, -34);
    c.add([ln, t]); c.setAlpha(0); this.locT = c;
    this.tweens.add({ targets: c, alpha: 1, y: 200, duration: 600, hold: 1600, yoyo: true, onComplete: () => c.destroy() });
  }
  // ------------------------------------------------------------- dialog
  async say(t: string, name?: string) { await this.dialog.show(t, name, name ? this.speaker(name) : undefined); }
  /** find the look of whoever is speaking (party member or any named NPC) for the dialogue bust */
  speaker(name: string): DollSpec | undefined {
    const n = name.trim().toLowerCase(); if (!n || Game.s?.party == null) return;
    const m = Game.s.party.find(p => p.name.toLowerCase() === n) || (Game.s as any).roster?.find?.((p: Member) => p.name.toLowerCase() === n);
    if (m) return specOf(m);
    if (!UIScene.npcIdx) { UIScene.npcIdx = new Map(); for (const md of Object.values(MAPS)) for (const np of (md as any).npcs || []) if (np.look && !np.sprite) { const k = np.name.toLowerCase(); if (!UIScene.npcIdx.has(k)) UIScene.npcIdx.set(k, { look: np.look, equip: np.equip || {} }); } }
    return UIScene.npcIdx.get(n) || [...UIScene.npcIdx.entries()].find(([k]) => k.split(' ').pop() === n || n.split(' ').pop() === k.split(' ').pop())?.[1];
  }
  static npcIdx?: Map<string, DollSpec>;
  async narr(t: string) { await this.dialog.show(t); this.hideDialog(); }
  hideDialog() { this.dialog.hide(); }
  /** Choice list. `cancelIdx` makes it backable (Back/Esc picks that option); story choices have none. */
  async choice(opts: string[], cancelIdx?: number): Promise<number> {
    return new Promise(res => {
      const m = new ListMenu(this, W - 460, H - 380 - opts.length * 76 - 50, 440, opts.map(label => ({ label })), { itemH: 76, fontSize: 30 }).setDepth(1100);
      m.onSelect = i => { m.close(); res(i); };
      if (cancelIdx !== undefined) m.onCancel = () => { m.close(); res(cancelIdx); };
    });
  }
  async caption(title: string, sub?: string) {
    return new Promise<void>(res => {
      const c = this.add.container(0, 0).setDepth(4000);
      const bg = this.add.rectangle(0, 0, W, H, 0, 0.55).setOrigin(0).setInteractive(); c.add(bg);
      const big = title === 'EMBERFALL';
      const t = txt(this, W / 2, H / 2 - (sub ? 30 : 0), title, big ? 104 : 46, big ? '#ffd890' : '#fff6d8', { fontFamily: SERIF, align: 'center', wordWrap: { width: W - 80 } }).setOrigin(0.5); c.add(t);
      if (big) t.setShadow(0, 0, '#ff7030', 30, true, true);
      if (sub) c.add(txt(this, W / 2, H / 2 + (big ? 80 : 40), sub, big ? 32 : 28, '#d8d0f0', { align: 'center', wordWrap: { width: W - 100 } }).setOrigin(0.5, 0));
      c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 900 });
      let done = false; const f: Focus = { onAction: () => end() };
      const end = () => { if (done) return; done = true; Input.pop(f); this.tweens.add({ targets: c, alpha: 0, duration: 700, onComplete: () => { c.destroy(); res(); } }); };
      Input.push(f); bg.on('pointerdown', end); this.time.delayedCall(big ? 4200 : 2600, end);
    });
  }
  async tutorial(key: string) { const t = TUTORIALS[key]; if (!t) return; Game.set('tut_' + key); await card(this, t.title, t.body, t.icon); }
  async questToast(name: string, state: string) {
    Audio.sfx(state === 'done' ? 'join' : 'buff');
    const c = this.add.container(W / 2, 300).setDepth(3000); const g = panel(this, -300, -50, 600, 100);
    c.add([g, txt(this, 0, -20, state === 'done' ? 'QUEST COMPLETE' : 'NEW QUEST', 22, COL.accent).setOrigin(0.5), txt(this, 0, 16, name, 30).setOrigin(0.5)]);
    c.setScale(0.6).setAlpha(0); this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 300, ease: 'Back.out', hold: 1500, yoyo: true, onComplete: () => c.destroy() });
    await new Promise(r => this.time.delayedCall(700, r));
  }
  fade(dir: 'in' | 'out', ms: number, color: number) {
    return new Promise<void>(res => { this.fadeRect.setFillStyle(color, 1); this.fadeRect.setAlpha(dir === 'in' ? 1 : this.fadeRect.alpha); this.tweens.add({ targets: this.fadeRect, alpha: dir === 'in' ? 0 : 1, duration: ms, onComplete: () => res() }); });
  }
  // ------------------------------------------------------------- inn / save
  async inn(price: number, who = 'Berta') {
    const cost = price * Game.s.party.length;
    const i = await this.choice([`Stay (${cost} G)`, 'No thanks'], 1);
    if (i === 1) { await this.say('Safe travels, then!', who); return false; }
    if (Game.s.gold < cost) { await this.say('Oh dear, you\'re a bit short. Come back when your purse is heavier, love.', who); return false; }
    Game.s.gold -= cost; this.hideDialog(); await this.fade('out', 700, 0); Audio.stopMusic(); Audio.sfx('inn');
    await new Promise(r => this.time.delayedCall(1800, r)); Game.healAll(); this.refreshHud();
    Audio.play(this.world.def.music); await this.fade('in', 700, 0);
    await this.say('Good morning! You look much better. HP and MP fully restored!', who);
    if (!Game.flag('tut_heal')) await this.tutorial('heal');
    Game.markDirty('inn'); return true;
  }
  async saveShrine() {
    await this.dialog.show('A Star-Shrine glimmers softly. Its light feels… familiar.');
    if (!Game.flag('tut_save')) await this.tutorial('save');
    const i = await this.choice(['Save adventure', 'Leave'], 1);
    if (i === 0) {
      const w = this.world; Game.s.savePoint = { map: w.def.id, x: w.hero.tx, y: w.hero.ty - 1 };
      Game.s.x = w.hero.tx; Game.s.y = w.hero.ty; Game.s.dir = w.hero.dir; Game.healAll(); this.refreshHud();
      const ok = Game.save('shrine'); Audio.sfx(ok ? 'save' : 'cancel');
      this.cameras.main.flash(300, 180, 230, 255);
      await this.dialog.show(ok ? `Your adventure has been recorded in the stars. (Adventure Log ${Game.slot + 1})\nThe shrine's light restores your party.` : 'The stars could not record your adventure. (Storage unavailable — your previous record is safe.)');
    }
    this.hideDialog();
  }
  // ------------------------------------------------------------- menus
  modalWrap<T>(fn: () => Promise<T>): Promise<T> { this.modal = true; this.partyHud?.setVisible(false); return fn().finally(() => { this.modal = false; if (!this.sys.isActive()) return; this.partyHud?.setVisible(true); this.refreshHud(); Game.markDirty('menu'); }); }
  memberPicker(title: string, sub?: (m: Member) => string, list = Game.s.party): Promise<number> {
    return new Promise(res => {
      const m = new ListMenu(this, 60, 360, W - 120, list.map(p => ({ label: p.name, sub: sub ? sub(p) : `HP ${p.hp}/${stats(p).hp}` })), { title, itemH: 80 }).setDepth(1300);
      m.onSelect = i => { m.close(); res(i); }; m.onCancel = () => { m.close(); res(-1); };
    });
  }
  openMenu() {
    if (this.modal) return;
    this.modalWrap(async () => {
      const root = this.add.container(0, 0).setDepth(1200);
      root.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.45).setOrigin(0).setInteractive());
      const info = panel(this, 380, 160, 320, 210); root.add(info);
      root.add(txt(this, 400, 180, `◈ ${Game.s.gold} Gold`, 28, COL.goldS));
      const pt = Game.s.playTime; root.add(txt(this, 400, 222, `Time ${Math.floor(pt / 3600)}:${String(Math.floor(pt / 60) % 60).padStart(2, '0')}`, 24));
      root.add(txt(this, 400, 258, this.world.def.name, 22, COL.dim, { wordWrap: { width: 280 } }));
      while (true) {
        const items: MenuItem[] = ['Items', 'Equipment', 'Spells', 'Status', 'Quests', 'Save', 'Settings', 'Close'].map(label => ({ label }));
        const m = new ListMenu(this, 20, 160, 340, items, { itemH: 74, rows: 8 }).setDepth(1201);
        const i = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(items.length - 1); });
        m.close();
        const pick = items[i].label;
        if (pick === 'Close') break;
        root.setVisible(false);
        if (pick === 'Items') await this.itemsMenu(); if (pick === 'Equipment') await this.equipMenu(); if (pick === 'Spells') await this.spellsMenu();
        if (pick === 'Status') await this.statusMenu(); if (pick === 'Quests') await this.questMenu(); if (pick === 'Settings') await this.settingsMenu();
        if (pick === 'Save') { const quit = await this.saveMenu(); if (quit) { root.destroy(); return; } }
        root.setVisible(true);
      }
      root.destroy();
    });
  }
  async itemsMenu() {
    while (true) {
      const ids = Object.keys(Game.s.inv).filter(k => Game.s.inv[k] > 0);
      if (!ids.length) { await card(this, 'Items', 'Your bag is empty.'); return; }
      const desc = txt(this, 50, 1110, '', 26, COL.text, { wordWrap: { width: W - 100 } }).setDepth(1302); const dp = panel(this, 20, 1090, W - 40, 170).setDepth(1301);
      const m = new ListMenu(this, 20, 140, W - 40, ids.map(id => ({ label: ITEMS[id].name, sub: '×' + Game.s.inv[id], icon: 'ic_' + ITEMS[id].icon })), { title: 'Items', rows: 11, itemH: 74 }).setDepth(1300);
      const upd = (k: number) => desc.setText(ITEMS[ids[k]].desc + (ITEMS[ids[k]].kind === 'equip' ? '  (Equip via Equipment)' : '')); upd(0); m.onChange = k => upd(k);
      const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(-1); });
      m.close(); desc.destroy(); dp.destroy();
      if (k < 0) return;
      const it = ITEMS[ids[k]]; if (it.kind !== 'consumable' || !it.use || it.use.target === 'enemy') { Audio.sfx('cancel'); continue; }
      const t = await this.memberPicker('Use on whom?');
      if (t < 0) continue;
      const msg = useItemOn(it.id, Game.s.party[t]); Audio.sfx(msg.ok ? 'heal' : 'cancel'); this.refreshHud(); await card(this, it.name, msg.text);
    }
  }
  async spellsMenu() {
    const c = await this.memberPicker('Whose spells?', p => `MP ${p.mp}/${stats(p).mp}`); if (c < 0) return;
    const m0 = Game.s.party[c]; const sk = skillsOf(m0);
    if (!sk.length) { await card(this, 'Spells', `${m0.name} knows no spells or skills yet.`); return; }
    while (true) {
      const m = new ListMenu(this, 20, 140, W - 40, sk.map(id => ({ label: SKILLS[id].name, sub: SKILLS[id].mp + ' MP', disabled: !SKILLS[id].usableInField || m0.mp < SKILLS[id].mp })), { title: `${m0.name}'s abilities`, rows: 10 }).setDepth(1300);
      const desc = txt(this, 50, 1110, '', 26, COL.text, { wordWrap: { width: W - 100 } }).setDepth(1302); const dp = panel(this, 20, 1090, W - 40, 170).setDepth(1301);
      const upd = (k: number) => desc.setText(SKILLS[sk[k]].desc + (SKILLS[sk[k]].usableInField ? '' : ' (Battle only)')); upd(0); m.onChange = upd;
      const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(-1); });
      m.close(); desc.destroy(); dp.destroy(); if (k < 0) return;
      const s = SKILLS[sk[k]];
      if (s.effect === 'healAll') { m0.mp -= s.mp; let tot = 0; for (const p of Game.s.party) if (p.hp > 0) { const b = p.hp; p.hp = Math.min(stats(p).hp, p.hp + Math.round(s.power + stats(m0).mag * 0.4)); tot += p.hp - b; } Audio.sfx('heal'); this.refreshHud(); await card(this, s.name, `The party recovers ${tot} HP in total!`); continue; }
      const t = await this.memberPicker(`Cast ${s.name} on…`); if (t < 0) continue;
      const tgt = Game.s.party[t]; if (tgt.hp <= 0) { await card(this, s.name, 'It has no effect on the fallen.'); continue; }
      m0.mp -= s.mp; const before = tgt.hp; tgt.hp = Math.min(stats(tgt).hp, tgt.hp + Math.round(s.power + stats(m0).mag * 0.6)); Audio.sfx('heal'); this.refreshHud();
      await card(this, s.name, `${tgt.name} recovers ${tgt.hp - before} HP!`);
    }
  }
  async statusMenu() {
    let idx = 0;
    while (true) {
      const mm = Game.s.party[idx]; const s = stats(mm); const v = VOCATIONS[mm.voc];
      const c = this.add.container(0, 0).setDepth(1300);
      c.add(this.add.rectangle(0, 0, W, H, 0x05040c, 0.9).setOrigin(0).setInteractive());
      c.add(panel(this, 20, 120, W - 40, 1040));
      { const pk = ensurePortrait(this, specOf(mm)); const bg = this.add.graphics(); bg.fillStyle(0x0a0b1e, 0.8); bg.fillRect(44, 146, 252, 282); bg.lineStyle(2, 0xe8cc84, 1); bg.strokeRect(44, 146, 252, 282); c.add(bg); c.add(this.add.image(50, 152, pk).setOrigin(0).setCrop(0, 0, 240, 270)); }
      const key = ensureDoll(this, specOf(mm)); const d = this.add.sprite(230, 600, key, 0).setOrigin(0.5, 1).setScale(3.4); c.add(d);
      c.add(this.add.image(230, 598, 'shadow').setScale(5, 2).setAlpha(0.6)); c.bringToTop(d);
      this.time.addEvent({ delay: 250, repeat: 40, callback: () => d.active && d.setFrame([0, 1, 0, 2][Math.floor(this.time.now / 250) % 4]) });
      c.add(txt(this, 330, 160, mm.name, 44, COL.accent, { fontFamily: SERIF }));
      c.add(txt(this, 330, 220, `${v.name}  ·  Level ${mm.level}`, 28));
      c.add(txt(this, 330, 262, `EXP ${mm.xp}  (next: ${xpFor(mm.level + 1) - mm.xp})`, 24, COL.dim));
      const rows = [['HP', `${mm.hp} / ${s.hp}`], ['MP', `${mm.mp} / ${s.mp}`], ['Attack', s.atk], ['Defence', s.def], ['Agility', s.agi], ['Magic', s.mag]];
      rows.forEach(([k, val], i) => { c.add(txt(this, 330, 320 + i * 44, String(k), 28, COL.goldS)); c.add(txt(this, 660, 320 + i * 44, String(val), 28).setOrigin(1, 0)); });
      SLOTS.forEach((sl, i) => { const id = mm.equip[sl]; c.add(txt(this, 60, 620 + i * 48, SLOT_NAMES[sl], 26, COL.goldS)); c.add(txt(this, 260, 620 + i * 48, id ? ITEMS[id].name : '—', 26)); });
      c.add(txt(this, 60, 880, 'Abilities: ' + (skillsOf(mm).map(k => SKILLS[k].name).join(', ') || '—'), 24, COL.text, { wordWrap: { width: W - 120 } }));
      c.add(txt(this, W / 2, 1110, Game.s.party.length > 1 ? '◀ ▶ change member   ·   ✦ close' : '✦ close', 24, COL.dim).setOrigin(0.5));
      const a = await new Promise<string>(r => { const f: Focus = { canBack: true, onAction: x => { if (x === 'left' || x === 'right' || x === 'ok' || x === 'cancel') { Input.pop(f); r(x); } } }; Input.push(f); c.list[0].on('pointerdown', (p: Phaser.Input.Pointer) => { Input.pop(f); r(p.y > 1000 ? 'ok' : p.x < W / 2 ? 'left' : 'right'); }); });
      c.destroy(); Audio.sfx('cursor');
      if (a === 'ok' || a === 'cancel' || Game.s.party.length === 1) return;
      idx = (idx + (a === 'left' ? -1 : 1) + Game.s.party.length) % Game.s.party.length;
    }
  }
  async questMenu() {
    const ids = Object.keys(Game.s.quests);
    const body = ids.length ? ids.map(id => `${Game.s.quests[id] === 'done' ? '✔' : '◆'} ${QUESTS[id].name}\n${Game.s.quests[id] === 'done' ? QUESTS[id].done : QUESTS[id].desc}`).join('\n\n') : 'No quests yet.';
    await card(this, 'Quest Log', body);
  }
  async settingsMenu() {
    while (true) {
      const lv = (v: number) => '■'.repeat(Math.round(v * 5)) + '□'.repeat(5 - Math.round(v * 5));
      const m = new ListMenu(this, 60, 360, W - 120, [{ label: 'Music', sub: lv(Audio.musicVol) }, { label: 'Sound FX', sub: lv(Audio.sfxVol) }, { label: 'Graphics', sub: DioramaFX.quality ? 'HD-2D' : 'Fast' }, { label: 'Back' }], { title: 'Settings' }).setDepth(1300);
      const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(3); }); m.close();
      if (k === 3) return;
      if (k === 2) { DioramaFX.quality = DioramaFX.quality ? 0 : 1; localStorage.setItem('ember_gfx', String(DioramaFX.quality)); continue; }
      if (k === 0) Audio.setMusicVol(((Math.round(Audio.musicVol * 5) + 1) % 6) / 5); else Audio.setSfxVol(((Math.round(Audio.sfxVol * 5) + 1) % 6) / 5);
    }
  }
  /** Menu → Save: manual save to the current Adventure Log, optionally return to title. Returns true when quitting. */
  async saveMenu(): Promise<boolean> {
    const w = this.world; const inf = Game.slotInfo(Game.slot);
    const m = new ListMenu(this, 60, 360, W - 120, [{ label: 'Save now', sub: `Log ${Game.slot + 1}` }, { label: 'Save & return to title' }, { label: 'Back' }], { title: inf ? `Last saved: ${new Date(inf.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Not saved yet' }).setDepth(1300);
    const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(2); }); m.close();
    if (k === 2) return false;
    Game.s.x = w.hero.tx; Game.s.y = w.hero.ty; Game.s.dir = w.hero.dir;
    const ok = Game.save('manual'); Game.dirty = ''; Audio.sfx(ok ? 'save' : 'cancel');
    (this.scene.get('Overlay') as any)?.flashSaved?.(ok);
    if (!ok) { await card(this, 'Save failed', 'Your adventure could not be written (storage unavailable). Your previous record has not been touched.'); return false; }
    if (k === 0) { await card(this, 'Saved', `Your adventure has been recorded in Adventure Log ${Game.slot + 1}.`, 'crystal'); return false; }
    this.modal = false; Audio.stopMusic(); this.cameras.main.fadeOut(400);
    this.time.delayedCall(420, () => { w.scene.stop(); this.scene.start('Title'); });
    return true;
  }
  // ------------------------------------------------------------- equipment (with live paper-doll preview)
  async equipMenu() {
    const c = await (Game.s.party.length > 1 ? this.memberPicker('Equip whom?', p => VOCATIONS[p.voc].name) : Promise.resolve(0)); if (c < 0) return;
    const mem = Game.s.party[c];
    const view = this.add.container(0, 0).setDepth(1300);
    view.add(this.add.rectangle(0, 0, W, H, 0x05040c, 0.88).setOrigin(0).setInteractive());
    view.add(panel(this, 20, 120, W - 40, 420));
    const doll = this.add.sprite(170, 500, '__DEFAULT').setOrigin(0.5, 1).setScale(7); view.add(doll);
    const statT = txt(this, 320, 150, '', 28, COL.text, { lineSpacing: 10 }); view.add(statT);
    view.add(txt(this, 170, 140, mem.name, 30, COL.accent).setOrigin(0.5, 0));
    let dir = 0; const anim = this.time.addEvent({ delay: 220, loop: true, callback: () => { const f = [0, 1, 0, 2][Math.floor(this.time.now / 220) % 4]; doll.setFrame(dir * 3 + f); } });
    const tap = this.add.zone(40, 160, 260, 360).setOrigin(0).setInteractive(); view.add(tap); tap.on('pointerdown', () => { dir = [1, 3, 2, 0][dir]; });
    const show = (equip: any) => {
      doll.setTexture(ensureDoll(this, { look: mem.look, equip })); const cur = stats(mem); const nx = stats({ ...mem, equip });
      statT.setText(['atk', 'def', 'agi', 'mag', 'hp', 'mp'].map(k => { const a = (cur as any)[k], b = (nx as any)[k]; const d = b - a; return `${k.toUpperCase().padEnd(4)} ${String(a).padStart(3)} ${d ? (d > 0 ? '→ ' + b + ' ▲' : '→ ' + b + ' ▼') : ''}`; }).join('\n'));
    };
    show(mem.equip);
    while (true) {
      const m = new ListMenu(this, 20, 560, W - 40, SLOTS.map(s => ({ label: SLOT_NAMES[s], sub: mem.equip[s] ? ITEMS[mem.equip[s]!].name : '—' })), { title: 'Choose a slot', itemH: 72 }).setDepth(1301);
      const si = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(-1); }); m.close();
      if (si < 0) break;
      const slot = SLOTS[si] as Slot;
      const opts = Object.keys(Game.s.inv).filter(id => Game.s.inv[id] > 0 && ITEMS[id].slot === slot);
      const list: MenuItem[] = [{ label: '(Remove)', data: null }, ...opts.map(id => ({ label: ITEMS[id].name, sub: '×' + Game.s.inv[id], disabled: !canEquip(mem, id), icon: 'ic_' + ITEMS[id].icon, data: id }))];
      const m2 = new ListMenu(this, 20, 560, W - 40, list, { title: SLOT_NAMES[slot], itemH: 72, rows: 8 }).setDepth(1301);
      const prev = (k: number) => { const id = list[k].data; show({ ...mem.equip, [slot]: id && canEquip(mem, id) ? id : k === 0 ? undefined : mem.equip[slot] }); };
      m2.onChange = prev; prev(0); m2.idx = 0;
      const k = await new Promise<number>(r => { m2.onSelect = i => r(i); m2.onCancel = () => r(-1); }); m2.close();
      if (k >= 0) {
        const id = list[k].data as string | null; const old = mem.equip[slot];
        if (old) Game.addItem(old); if (id) { Game.addItem(id, -1); mem.equip[slot] = id; } else delete mem.equip[slot];
        const s = stats(mem); mem.hp = Math.min(mem.hp, s.hp); mem.mp = Math.min(mem.mp, s.mp); Audio.sfx('buff');
        this.world.refreshParty();
      }
      show(mem.equip);
    }
    anim.remove(); view.destroy();
  }
  // ------------------------------------------------------------- shop (with live try-on)
  async shop(kind: string) {
    await this.modalWrap(async () => {
      while (true) {
        const i = await this.choice(['Buy', 'Sell', 'Leave'], 2);
        if (i === 2) { await this.say('Come again!'); this.hideDialog(); return; }
        if (i === 0) await this.shopBuy(kind); else await this.shopSell();
      }
    });
  }
  async shopBuy(kind: string) {
    const goods = SHOPS[kind];
    const view = this.add.container(0, 0).setDepth(1300);
    view.add(this.add.rectangle(0, 0, W, H, 0x05040c, 0.85).setOrigin(0).setInteractive());
    view.add(panel(this, 20, 110, W - 40, 400));
    const goldT = txt(this, W - 50, 130, '', 26, COL.goldS).setOrigin(1, 0); view.add(goldT);
    const desc = txt(this, 50, 450, '', 24, COL.text, { wordWrap: { width: W - 100 } }); view.add(desc);
    const dolls: Phaser.GameObjects.GameObject[] = [];
    const preview = (id: string) => {
      dolls.forEach(d => d.destroy()); dolls.length = 0; goldT.setText(`◈ ${Game.s.gold} G`);
      const it = ITEMS[id]; desc.setText(it.desc);
      if (it.kind !== 'equip') { const own = txt(this, W / 2, 280, `You have: ${Game.s.inv[id] || 0}`, 32).setOrigin(0.5); const ic = this.add.image(W / 2, 200, 'ic_' + it.icon).setScale(6); view.add([own, ic]); dolls.push(own, ic); return; }
      const n = Game.s.party.length; const sp = (W - 80) / n;
      Game.s.party.forEach((m, i) => {
        const ok = canEquip(m, id); const x = 40 + sp * i + sp / 2;
        const eq = ok ? { ...m.equip, [it.slot!]: id } : m.equip;
        const d = this.add.sprite(x, 380, ensureDoll(this, { look: m.look, equip: eq }), 0).setOrigin(0.5, 1).setScale(n > 2 ? 4 : 5).setAlpha(ok ? 1 : 0.35);
        this.tweens.add({ targets: d, y: 374, yoyo: true, repeat: -1, duration: 400 });
        const cur = stats(m), nx = stats({ ...m, equip: eq }); const k = Object.keys(it.mods || {})[0] || 'def';
        const diff = (nx as any)[k] - (cur as any)[k];
        const lab = txt(this, x, 395, ok ? `${m.name}\n${k.toUpperCase()} ${diff >= 0 ? '+' : ''}${diff}` : `${m.name}\ncan't equip`, 22, ok ? (diff > 0 ? '#8affa0' : diff < 0 ? COL.red : COL.text) : COL.dim, { align: 'center' }).setOrigin(0.5, 0);
        view.add([d, lab]); dolls.push(d, lab);
      });
    };
    while (true) {
      const m = new ListMenu(this, 20, 530, W - 40, goods.map(id => ({ label: ITEMS[id].name, sub: ITEMS[id].price + ' G', icon: 'ic_' + ITEMS[id].icon, disabled: ITEMS[id].price > Game.s.gold })), { title: 'What would you like?', rows: 9, itemH: 72 }).setDepth(1301);
      m.onChange = k => preview(goods[k]); preview(goods[0]);
      const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(-1); }); m.close();
      if (k < 0) break;
      const id = goods[k]; const it = ITEMS[id];
      if (Game.s.gold < it.price) { Audio.sfx('cancel'); continue; }
      Game.s.gold -= it.price; Game.addItem(id); Audio.sfx('coin'); this.refreshHud();
      if (it.kind === 'equip') {
        const who = Game.s.party.map((p, i) => ({ p, i })).filter(o => canEquip(o.p, id));
        if (who.length) {
          view.setVisible(false);
          const ans = await this.choice([...who.map(o => `Equip on ${o.p.name}`), 'Keep in bag'], who.length);
          view.setVisible(true);
          if (ans < who.length) { const mem = who[ans].p; const old = mem.equip[it.slot!]; if (old) Game.addItem(old); Game.addItem(id, -1); mem.equip[it.slot!] = id; Audio.sfx('buff'); this.world.refreshParty(); }
        }
      }
      preview(id);
    }
    view.destroy();
  }
  async shopSell() {
    const ids = Object.keys(Game.s.inv).filter(k => Game.s.inv[k] > 0 && ITEMS[k].kind !== 'key');
    if (!ids.length) { await this.say('You\'ve nothing I can buy, friend.'); return; }
    const m = new ListMenu(this, 20, 300, W - 40, ids.map(id => ({ label: `${ITEMS[id].name} ×${Game.s.inv[id]}`, sub: Math.floor(ITEMS[id].price / 2) + ' G' })), { title: 'Sell what?', rows: 9 }).setDepth(1301);
    const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(-1); }); m.close();
    if (k < 0) return; const id = ids[k]; Game.addItem(id, -1); Game.s.gold += Math.floor(ITEMS[id].price / 2); Audio.sfx('coin'); this.refreshHud();
  }
  // ------------------------------------------------------------- recruitment
  async recruit(who = 'Dahlia') {
    await this.modalWrap(async () => {
      while (true) {
        const i = await this.choice(['Create a companion', 'Change party', 'Leave'], 2);
        if (i === 2) { await this.say('Whenever you need me, I\'ll be here.', who); this.hideDialog(); return; }
        if (i === 0) {
          if (Game.s.roster.length + Game.s.party.length >= 10) { await this.say('My Ledger is full, sweetheart.', 'Dahlia'); continue; }
          this.hideDialog(); this.scene.setVisible(false);
          const m = await new Promise<Member | null>(r => { this.scene.launch('Create', { mode: 'companion', onDone: r }); this.scene.bringToTop('Create'); });
          this.scene.setVisible(true);
          if (m) {
            if (Game.s.party.length < 4) { Game.s.party.push(m); Audio.sfx('join'); await this.say(`${m.name} the ${VOCATIONS[m.voc].name} joined the party!`, who); }
            else { Game.s.roster.push(m); await this.say(`${m.name} signed the Ledger and will wait at any Party Ledger.`, who); }
            this.world.refreshParty(); this.refreshHud();
          }
        }
        if (i === 1) await this.changeParty();
      }
    });
  }
  /** Chapter II: the Chapel of Alltrades. Change a party member's vocation; each vocation keeps its own level and learned abilities stay. */
  async vocationMenu(who = 'Abbess Maren') {
    await this.modalWrap(async () => {
      while (true) {
        const c = await this.memberPicker('Who will change vocation?', p => `${VOCATIONS[p.voc].name} Lv${p.level}`); if (c < 0) { this.hideDialog(); return; }
        const mem = Game.s.party[c]; const keys = Object.keys(VOCATIONS);
        const lv = (k: string) => k === mem.voc ? mem.level : mem.vocs?.[k]?.level ?? 1;
        const view = this.add.container(0, 0).setDepth(1300);
        view.add(this.add.rectangle(0, 0, W, H, 0x05040c, 0.86).setOrigin(0).setInteractive());
        view.add(panel(this, 20, 120, W - 40, 330));
        const doll = this.add.sprite(150, 420, ensureDoll(this, specOf(mem)), 0).setOrigin(0.5, 1).setScale(5.5); view.add(doll);
        const dt = txt(this, 290, 150, '', 25, COL.text, { wordWrap: { width: W - 330 }, lineSpacing: 6 }); view.add(dt);
        const m = new ListMenu(this, 20, 470, W - 40, keys.map(k => ({ label: VOCATIONS[k].name, sub: k === mem.voc ? `Lv${lv(k)} (current)` : `Lv${lv(k)}`, color: k === mem.voc ? COL.accent : undefined })), { title: `${mem.name}'s vocation`, rows: 7, itemH: 72 }).setDepth(1301);
        const upd = (k: number) => { const v = VOCATIONS[keys[k]]; const st = stats({ ...mem, voc: keys[k], level: lv(keys[k]) } as any); dt.setText(`${v.name}\n${v.desc.replace(/ \(Unlocked.*\)/, '')}\n\nHP ${st.hp}  MP ${st.mp}  ATK ${st.atk}\nDEF ${st.def}  AGI ${st.agi}  MAG ${st.mag}`); };
        upd(Math.max(0, keys.indexOf(mem.voc))); m.idx = Math.max(0, keys.indexOf(mem.voc)); m.refresh(); m.onChange = upd;
        const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(-1); }); m.close(); view.destroy();
        if (k < 0 || keys[k] === mem.voc) continue;
        const ans = await this.choice([`Become a ${VOCATIONS[keys[k]].name}`, 'Not yet'], 1);
        if (ans !== 0) continue;
        changeVocation(mem, keys[k], id => Game.addItem(id)); Audio.sfx('star'); this.cameras.main.flash(400, 255, 240, 200);
        this.world.refreshParty(); this.refreshHud(); Game.markDirty('vocation');
        await this.say(`By the light of the Alltrades, ${mem.name} walks the path of the ${VOCATIONS[keys[k]].name}! (Lv${mem.level}) Gear that no longer fits was returned to your bag; every ability learned still remains.`, who);
      }
    });
  }
  async changeParty() {
    while (true) {
      const all = [...Game.s.party.map(m => ({ m, inP: true })), ...Game.s.roster.map(m => ({ m, inP: false }))];
      const items: MenuItem[] = all.map(o => ({ label: `${o.inP ? '★ ' : '   '}${o.m.name}`, sub: `${VOCATIONS[o.m.voc].name} Lv${o.m.level}`, disabled: o.m.id === 'hero', color: o.inP ? COL.accent : COL.text }));
      items.push({ label: 'Done' });
      const m = new ListMenu(this, 20, 200, W - 40, items, { title: '★ = in party (max 4). Tap to swap.', rows: 11 }).setDepth(1301);
      const k = await new Promise<number>(r => { m.onSelect = i => r(i); m.onCancel = () => r(items.length - 1); }); m.close();
      if (k === items.length - 1) return;
      const o = all[k];
      if (o.inP) { Game.s.party = Game.s.party.filter(x => x !== o.m); Game.s.roster.push(o.m); }
      else if (Game.s.party.length < 4) { Game.s.roster = Game.s.roster.filter(x => x !== o.m); Game.s.party.push(o.m); Audio.sfx('join'); }
      else { Audio.sfx('cancel'); }
      this.world.refreshParty(); this.refreshHud();
    }
  }
}

export function useItemOn(id: string, m: Member): { ok: boolean; text: string } {
  const it = ITEMS[id]; const u = it.use!; const s = stats(m);
  if (u.revive) { if (m.hp > 0) return { ok: false, text: `${m.name} is not knocked out.` }; m.hp = Math.floor(s.hp * (u.heal || 0.5)); Game.addItem(id, -1); return { ok: true, text: `${m.name} is revived!` }; }
  if (m.hp <= 0) return { ok: false, text: `${m.name} has fallen. Only an Ember Feather can help.` };
  if (u.cure) { if (!m.poisoned) return { ok: false, text: `${m.name} isn't poisoned.` }; m.poisoned = false; Game.addItem(id, -1); return { ok: true, text: `${m.name} is cured of poison!` }; }
  if (u.heal) { if (m.hp >= s.hp) return { ok: false, text: `${m.name}'s HP is already full.` }; const b = m.hp; m.hp = Math.min(s.hp, m.hp + u.heal); Game.addItem(id, -1); return { ok: true, text: `${m.name} recovers ${m.hp - b} HP!` }; }
  if (u.mp) { if (m.mp >= s.mp) return { ok: false, text: `${m.name}'s MP is already full.` }; const b = m.mp; m.mp = Math.min(s.mp, m.mp + u.mp); Game.addItem(id, -1); return { ok: true, text: `${m.name} recovers ${m.mp - b} MP!` }; }
  return { ok: false, text: 'Nothing happens.' };
}
export { baseStats };
