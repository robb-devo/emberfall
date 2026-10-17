import { DioramaFX, diorama } from '../fx/diorama';
import Phaser from 'phaser';
import { txt, panel, W, H, COL, ListMenu, drawBar, card, MenuItem, SERIF } from '../ui/widgets';
import { Input } from '../ui/input';
import { Audio } from '../systems/audio';
import { Game, stats, Member, skillsOf, gainXp } from '../systems/state';
import { ENEMIES, EnemyDef } from '../data/enemies';
import { SKILLS, Skill } from '../data/skills';
import { ITEMS } from '../data/items';
import { ensureDoll, ensureDollHd, specOf } from '../systems/paperdoll';
import { TUTORIALS } from '../data/story';

interface Foe { def: EnemyDef; name: string; hp: number; mp: number; spr: Phaser.GameObjects.Sprite; x: number; y: number; alive: boolean; buffDef: number; buffAtk: number; poisoned: boolean; charged: boolean; stolen?: boolean; asleep?: number; chargeAct?: any }
interface Act { who: 'p' | 'e'; idx: number; kind: 'attack' | 'skill' | 'item' | 'defend' | 'flee'; skill?: string; item?: string; target?: number; spd: number }
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const fast = () => !!(window as any).__EMBER?.fast;

export class BattleScene extends Phaser.Scene {
  d: any; foes: Foe[] = []; party: Member[] = []; pSpr: Phaser.GameObjects.Sprite[] = []; cards: Phaser.GameObjects.Container[] = [];
  msgT!: Phaser.GameObjects.Text; buffs: { atk: number; def: number; defending: boolean; turns: number; cover?: boolean; asleep?: number }[] = []; turn = 0; over = false; boss = false; bossMoment = false;
  constructor() { super('Battle'); }
  init(d: any) { this.d = d; this.foes = []; this.pSpr = []; this.cards = []; this.turn = 0; this.over = false; this.bossMoment = false; }
  create() {
    const d = this.d; this.boss = !!d.boss; this.party = Game.s.party;
    this.buffs = this.party.map(() => ({ atk: 1, def: 1, defending: false, turns: 0 }));
    Audio.play(d.music || (this.boss ? 'boss' : 'battle'), true);
    this.cameras.main.fadeIn(300); diorama(this.cameras.main, 'battle', ({ bg_boss: { warm: 0xff7040, bloom: 1.3 }, bg_hollow: { warm: 0xc0a0ff }, bg_road: { warm: 0xffb060, bloom: 1.15 }, bg_coast: { warm: 0xfff0d0 }, bg_grotto: { warm: 0x60e0e0, bloom: 1.25 }, bg_choir: { warm: 0xff5a8a, bloom: 1.3 } } as any)[this.d.bg] ?? {});
    this.add.rectangle(0, 0, W, H, 0x07060f).setOrigin(0);
    // cinematic backdrop: far layer blurred for depth of field, slow camera drift
    const bg = this.add.image(W / 2, 0, d.bg || 'bg_fields').setOrigin(0.5, 0); const bs = 936 / bg.width; bg.setScale(bs);
    const webgl = this.game.renderer.type === Phaser.WEBGL;
    if (webgl && DioramaFX.quality > 0) bg.preFX?.addBlur(1, 1.2, 1.2, 1);
    this.tweens.add({ targets: bg, scale: bs * 1.02, x: W / 2 - 12, yoyo: true, repeat: -1, duration: 7000, ease: 'Sine.inOut' });
    const gc = ({ bg_fields: 0x3f7f3a, bg_hollow: 0x3a3048, bg_boss: 0x3a2430, bg_road: 0x8a6a30, bg_coast: 0xc8b07a, bg_grotto: 0x245050, bg_choir: 0x34243a } as any)[d.bg || 'bg_fields'] ?? 0x3f7f3a;
    const ground = this.add.graphics(); ground.fillGradientStyle(gc, gc, 0x07060f, 0x07060f, 0, 0, 1, 1); ground.fillRect(0, 540, W, 60); ground.fillGradientStyle(gc, gc, 0x07060f, 0x07060f, 1, 1, 1, 1); ground.fillRect(0, 600, W, 220);
    for (let i = 0; i < 60; i++) { ground.fillStyle(Phaser.Display.Color.ValueToColor(gc).darken(20).color, 0.8); ground.fillRect(Math.random() * W, 600 + Math.random() * 180, 8 + Math.random() * 12, 4); }
    // volumetric light shafts + floating motes + foreground blur silhouettes
    const outdoor = ['bg_fields', 'bg_road', 'bg_coast'].includes(d.bg || 'bg_fields');
    const shaftC = outdoor ? 0xfff0c0 : this.boss ? 0xff8040 : 0x9a80ff;
    for (let i = 0; i < 4; i++) {
      const sh = this.add.image(120 + i * 170, -40, 'light').setOrigin(0.5, 0).setScale(0.9, 9).setAngle(-24).setTint(shaftC).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.10 + (i % 2) * 0.05);
      this.tweens.add({ targets: sh, alpha: 0.03, duration: 2600 + i * 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.add.particles(0, 0, 'dot', { x: { min: 0, max: W }, y: { min: 120, max: 780 }, lifespan: 4000, speedX: { min: -12, max: 12 }, speedY: { min: -20, max: -4 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: outdoor ? [0xfff4c0, 0xc8ffb0] : [0xb0a0ff, 0xff9a60], blendMode: 'ADD', frequency: 140 }).setDepth(70);
    for (const [fx, fy, sc] of [[-30, 820, 7], [W + 30, 800, 8]] as const) {
      const fg = this.add.image(fx, fy, 'light').setTint(outdoor ? 0x0c2410 : 0x07040c).setScale(sc, sc * 0.55).setDepth(72).setAlpha(0.95);
      if (webgl && DioramaFX.quality > 0) fg.preFX?.addBlur(1, 2, 2, 1.5);
    }
    this.add.image(W / 2, 760, 'vignette').setDisplaySize(W * 1.6, 900).setAlpha(0.7);
    if (this.boss) this.add.particles(0, 0, 'dot', { x: { min: 0, max: W }, y: 620, lifespan: 2500, speedY: { min: -80, max: -30 }, scale: { start: 1.2, end: 0 }, tint: [0xff7a2a, 0xffc860], blendMode: 'ADD', frequency: 50 });
    // foes
    const counts: Record<string, number> = {};
    const n = d.group.length;
    d.group.forEach((id: string, i: number) => {
      const def = ENEMIES[id]; counts[id] = (counts[id] || 0) + 1;
      const L = [[[250, 640]], [[170, 560], [330, 700]], [[140, 540], [330, 600], [200, 720]], [[120, 520], [300, 560], [160, 700], [350, 730]]][Math.min(n, 4) - 1];
      const hasBoss = d.group.some((g: string) => ENEMIES[g].boss);
      const minion = d.group.slice(0, i).filter((g: string) => !ENEMIES[g].boss).length;
      const [x, y] = def.boss ? [hasBoss && n > 1 ? 240 : 230, n > 1 ? 650 : 690] : hasBoss ? ([[80, 590], [400, 745], [70, 760]][minion % 3] as number[]) : L[i % L.length];
      if (def.boss || n === 1) this.add.image(x, y - 160, 'light').setTint(def.boss ? 0xff5020 : 0xffe0b0).setScale(def.boss ? 3.4 : 2).setAlpha(def.boss ? 0.35 : 0.18).setBlendMode(Phaser.BlendModes.ADD);
      const spr = this.add.sprite(x, y, def.sprite + '_hd').setOrigin(0.5, 1).setScale((def.boss ? 2.7 : 2.6) * (def.scale ?? 1)).setDepth(y / 100);
      this.add.image(x, y - 4, 'shadow').setScale(def.boss ? 16 : 8, 4.5).setDepth(-0.5).setAlpha(0.8);
      this.tweens.add({ targets: spr, scaleY: spr.scaleY * 1.04, yoyo: true, repeat: -1, duration: 700 + i * 90, ease: 'Sine.inOut' });
      spr.setAlpha(0).setY(y + 30); this.tweens.add({ targets: spr, alpha: 1, y, duration: 400, delay: i * 120, ease: 'Back.out' });
      this.foes.push({ def, name: def.name, hp: def.hp, mp: def.mp, spr, x, y, alive: true, buffDef: 1, buffAtk: 1, poisoned: false, charged: false });
    });
    const dup: Record<string, number> = {}; for (const f of this.foes) if (counts[f.def.id] > 1) { dup[f.def.id] = (dup[f.def.id] || 0) + 1; f.name += ' ' + 'ABCD'[dup[f.def.id] - 1]; }
    // party (OT2-style side view on the right, facing the foes)
    const pn = this.party.length;
    this.party.forEach((m, i) => {
      const x = pn === 1 ? 590 : 540 + i * 44, y = pn === 1 ? 640 : 500 + i * 85;
      const spr = this.add.sprite(x, y, ensureDollHd(this, specOf(m)), 3).setOrigin(0.5, 1).setScale(3.5).setDepth(y / 100);
      spr.setData('hx', x);
      this.tweens.add({ targets: spr, scaleY: 7.14, yoyo: true, repeat: -1, duration: 900 + i * 120, ease: 'Sine.inOut' });
      this.add.image(x, y - 4, 'shadow').setScale(6, 3).setDepth(-0.4);
      if (m.hp <= 0) spr.setTint(0x553355).setAngle(90);
      this.pSpr.push(spr);
    });
    this.buildCards();
    this.add.existing(panel(this, 16, 810, W - 32, 150));
    this.msgT = txt(this, 46, 836, '', 30, COL.text, { wordWrap: { width: W - 100 }, lineSpacing: 8 });
    this.add.zone(0, 0, W, 960).setOrigin(0).setInteractive().on('pointerdown', () => (this.skip = true));
    this.run();
  }
  skip = false;
  buildCards() {
    this.cards.forEach(c => c.destroy()); this.cards = [];
    const n = this.party.length; const X0 = 150; const cw = (W - X0 - 16 - (n - 1) * 8) / n;
    this.party.forEach((m, i) => {
      const s = stats(m); const c = this.add.container(X0 + i * (cw + 8), 12);
      const g = this.add.graphics(); g.fillStyle(m.hp <= 0 ? 0x3a0a1a : 0x0b0c22, 0.88); g.fillRoundedRect(0, 0, cw, 100, 12); g.lineStyle(3, m.hp <= 0 ? 0xff6b6b : m.hp < s.hp / 4 ? 0xffb050 : COL.gold); g.strokeRoundedRect(1, 1, cw - 2, 98, 12);
      c.add(g); c.add(txt(this, 12, 6, m.name, n > 3 ? 20 : 24, m.hp <= 0 ? COL.red : COL.text)); c.add(txt(this, cw - 10, 8, 'Lv' + m.level, 18, COL.goldS).setOrigin(1, 0));
      c.add(txt(this, 12, 38, `HP ${m.hp}`, 20)); const hb = this.add.graphics({ x: 12, y: 62 }); drawBar(hb, cw - 24, 12, m.hp / s.hp, COL.hp); c.add(hb);
      c.add(txt(this, cw - 12, 38, `MP ${m.mp}`, 20, '#a8d0ff').setOrigin(1, 0)); const mb = this.add.graphics({ x: 12, y: 80 }); drawBar(mb, cw - 24, 10, s.mp ? m.mp / s.mp : 0, COL.mp); c.add(mb);
      if (m.poisoned) c.add(txt(this, cw / 2, 6, '☠', 20, '#c070ff').setOrigin(0.5, 0));
      this.cards.push(c);
    });
  }
  wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(fast() ? Math.min(ms, 30) : ms, r)); }
  async msg(t: string, hold = 650) {
    this.skip = false; this.msgT.setText('');
    for (let i = 1; i <= t.length; i++) { if (this.skip || fast()) { this.msgT.setText(t); break; } this.msgT.setText(t.slice(0, i)); if (i % 2 === 0) await this.wait(12); }
    this.skip = false; const end = this.time.now + (fast() ? 20 : hold);
    while (this.time.now < end && !this.skip) await this.wait(16);
  }
  popNum(x: number, y: number, v: string, color: string, big = false) {
    const t = txt(this, x, y, v, big ? 64 : 48, color, { fontStyle: 'bold' }).setOrigin(0.5).setDepth(100);
    t.setScale(0.3); this.tweens.add({ targets: t, scale: 1, duration: 180, ease: 'Back.out' });
    this.tweens.add({ targets: t, y: y - 70, duration: 400, ease: 'Quad.out' });
    this.tweens.add({ targets: t, alpha: 0, delay: 800, duration: 300, onComplete: () => t.destroy() });
  }
  burst(x: number, y: number, tint: number[], n = 24, speed = 220, tex = 'spark') {
    this.add.particles(x, y, tex, { lifespan: 600, speed: { min: speed * 0.3, max: speed }, scale: { start: 2.2, end: 0 }, tint, blendMode: 'ADD', emitting: false }).setDepth(90).explode(n);
  }
  aliveFoes() { return this.foes.filter(f => f.alive); }
  aliveParty() { return this.party.map((m, i) => ({ m, i })).filter(o => o.m.hp > 0); }
  // ------------------------------------------------------------------ main loop
  async run() {
    const names = this.groupName();
    await this.msg(this.boss ? `${names} blocks your path!` : `${names} ${this.foes.length > 1 ? 'appear' : 'appears'}!`, 800);
    if (!Game.flag('tut_battle')) { Game.set('tut_battle'); await card(this, TUTORIALS.battle.title, TUTORIALS.battle.body); }
    let first = this.d.first as string | undefined; if (this.boss) first = undefined;
    if (first === 'party' && Math.random() < 0.5) { await this.msg('You caught them off guard!'); }
    else if (first === 'enemy' && Math.random() < 0.3) { await this.msg('You were ambushed!'); await this.execute(this.enemyActs()); }
    while (!this.over) {
      const acts = await this.commandPhase(); if (this.over) break;
      await this.execute([...acts, ...this.enemyActs()]);
      this.turn++;
      // end of turn: poison, buff decay
      for (const f of this.aliveFoes()) if (f.poisoned) { const dmg = Math.max(1, Math.floor(f.def.hp / 12)); f.hp -= dmg; this.popNum(f.x, f.y - 120, String(dmg), '#c070ff'); await this.msg(`${f.name} suffers from poison!`, 400); if (f.hp <= 0) await this.killFoe(f); }
      for (const o of this.aliveParty()) if (o.m.poisoned) { const dmg = Math.max(1, Math.floor(stats(o.m).hp / 16)); o.m.hp = Math.max(0, o.m.hp - dmg); this.buildCards(); await this.msg(`${o.m.name} suffers from poison!`, 400); if (o.m.hp <= 0) await this.downMember(o.i); }
      this.buffs.forEach(b => { b.defending = false; b.cover = false; if (b.turns > 0 && --b.turns === 0) { b.atk = 1; b.def = 1; } });
      await this.checkEnd();
    }
  }
  groupName() {
    const f = this.foes; const art = (n: string) => (/^[AEIOU]/.test(n) ? 'An ' : 'A ') + n;
    const ids = [...new Set(f.map(x => x.def.id))];
    const parts = ids.map(id => { const c = f.filter(x => x.def.id === id).length; const d = ENEMIES[id]; if (c > 1) return `${c} ${d.name}s`; return this.boss && d.boss ? d.name : art(d.name); });
    if (this.boss) { const bi = ids.findIndex(id => ENEMIES[id].boss); if (bi > 0) parts.unshift(parts.splice(bi, 1)[0]); }
    for (let i = 1; i < parts.length; i++) parts[i] = parts[i].replace(/^An? /, m => m.toLowerCase());
    return parts.length < 3 ? parts.join(' and ') : parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }
  async commandPhase(): Promise<Act[]> {
    const acts: Act[] = []; const alive = this.aliveParty(); let k = 0;
    while (k < alive.length) {
      const { m, i } = alive[k];
      if ((this.buffs[i].asleep || 0) > 0) { acts.push({ who: 'p', idx: i, kind: 'defend', spd: -1, skill: 'sleep' }); k++; continue; }
      this.tweens.add({ targets: this.pSpr[i], x: this.pSpr[i].getData('hx') - 40, duration: 140 }); this.cards[i].setScale(1.03);
      const a = await this.chooseAction(m, i, k > 0);
      this.tweens.add({ targets: this.pSpr[i], x: this.pSpr[i].getData('hx'), duration: 140 }); this.cards[i].setScale(1);
      if (a === 'back') { if (k > 0) { k--; acts.pop(); } continue; }
      if (a.kind === 'flee') return [a];
      acts.push(a); k++;
    }
    return acts;
  }
  chooseAction(m: Member, i: number, canBack = false): Promise<Act | 'back'> {
    return new Promise(async res => {
      this.msgT.setText(`What will ${m.name} do?`);
      const s = stats(m); const spd = s.agi * rand(0.75, 1.25);
      const sk = skillsOf(m); const spells = sk.filter(id => SKILLS[id].kind === 'spell'), skills = sk.filter(id => SKILLS[id].kind === 'skill');
      const items: MenuItem[] = [{ label: 'Attack' }, { label: 'Spells', disabled: !spells.length }, { label: 'Skills', disabled: !skills.length }, { label: 'Items' }, { label: 'Defend' }, { label: 'Flee', disabled: !!this.d.noFlee }];
      const menu = new ListMenu(this, 16, 968, W - 32, items, { cols: 2, itemH: 72, fontSize: 34, back: canBack, title: m.name + `  —  Lv${m.level} ${m.voc[0].toUpperCase() + m.voc.slice(1)}` });
      (this as any).cmd = { menu, member: i, hpFrac: m.hp / s.hp, spells, skills };
      menu.onCancel = () => { menu.close(); res('back'); };
      menu.onSelect = async c => {
        menu.setActive(false); (this as any).cmd = null;
        const done = (a: Act | null) => { if (a) { menu.close(); res(a); } else { menu.setActive(true); this.msgT.setText(`What will ${m.name} do?`); } };
        if (c === 0) { const t = await this.pickFoe(); done(t < 0 ? null : { who: 'p', idx: i, kind: 'attack', target: t, spd }); }
        if (c === 1 || c === 2) {
          const list = c === 1 ? spells : skills; const sm = new ListMenu(this, 16, 680, W - 32, list.map(id => ({ label: SKILLS[id].name, sub: SKILLS[id].mp + ' MP', disabled: SKILLS[id].mp > m.mp })), { rows: 6, title: c === 1 ? 'Spells' : 'Skills' });
          const desc = (k: number) => this.msgT.setText(SKILLS[list[k]].desc); desc(0); sm.onChange = desc;
          const k = await new Promise<number>(r => { sm.onSelect = x => r(x); sm.onCancel = () => r(-1); }); sm.close();
          if (k < 0) return done(null);
          const sp = SKILLS[list[k]]; const t = await this.pickTarget(sp.target);
          done(t === -2 ? null : { who: 'p', idx: i, kind: 'skill', skill: sp.id, target: t, spd });
        }
        if (c === 3) {
          const ids = Object.keys(Game.s.inv).filter(id => Game.s.inv[id] > 0 && ITEMS[id].kind === 'consumable');
          if (!ids.length) { this.msgT.setText('You have no usable items!'); Audio.sfx('cancel'); await this.wait(600); return done(null); }
          const im = new ListMenu(this, 16, 680, W - 32, ids.map(id => ({ label: ITEMS[id].name, sub: '×' + Game.s.inv[id], icon: 'ic_' + ITEMS[id].icon })), { rows: 6, title: 'Items' });
          const desc = (k: number) => this.msgT.setText(ITEMS[ids[k]].desc); desc(0); im.onChange = desc;
          const k = await new Promise<number>(r => { im.onSelect = x => r(x); im.onCancel = () => r(-1); }); im.close();
          if (k < 0) return done(null);
          const it = ITEMS[ids[k]]; const t = await this.pickTarget(it.use!.target === 'enemy' ? 'enemy' : 'ally', true);
          done(t === -2 ? null : { who: 'p', idx: i, kind: 'item', item: it.id, target: t, spd: spd + 5 });
        }
        if (c === 4) done({ who: 'p', idx: i, kind: 'defend', spd: 999 });
        if (c === 5) done({ who: 'p', idx: i, kind: 'flee', spd: 999 });
      };
    });
  }
  async pickFoe(): Promise<number> {
    const alive = this.foes.map((f, i) => ({ f, i })).filter(o => o.f.alive);
    if (alive.length === 1) return alive[0].i;
    const arrow = txt(this, 0, 0, '▼', 48, COL.accent).setOrigin(0.5).setDepth(50);
    const place = (k: number) => { const f = alive[k].f; arrow.setPosition(f.x, f.y - f.spr.displayHeight - 30); };
    const m = new ListMenu(this, 16, 975, W - 32, alive.map(o => ({ label: o.f.name })), { rows: 3, title: 'Target' }); place(0); m.onChange = place;
    const zones = alive.map((o, k) => this.add.zone(o.f.x, o.f.y - o.f.spr.displayHeight / 2, o.f.spr.displayWidth, o.f.spr.displayHeight).setInteractive().on('pointerdown', () => { m.idx = k; m.refresh(); place(k); m.confirm(); }));
    const k = await new Promise<number>(r => { m.onSelect = x => r(x); m.onCancel = () => r(-1); });
    m.close(); arrow.destroy(); zones.forEach(z => z.destroy());
    return k < 0 ? -1 : alive[k].i;
  }
  async pickTarget(t: string, item = false): Promise<number> {
    if (t === 'enemy') { const k = await this.pickFoe(); return k < 0 ? -2 : k; }
    if (t === 'ally') {
      const m = new ListMenu(this, 16, 975, W - 32, this.party.map(p => ({ label: p.name, sub: `HP ${p.hp}/${stats(p).hp}` })), { rows: 4, title: 'On whom?' });
      const k = await new Promise<number>(r => { m.onSelect = x => r(x); m.onCancel = () => r(-2); }); m.close(); return k;
    }
    return -1;
  }
  enemyActs(): Act[] {
    return this.foes.map((f, i) => ({ f, i })).filter(o => o.f.alive).flatMap(o => {
      const n = o.f.def.boss && o.f.hp < o.f.def.hp * 0.5 && this.turn % 3 === 2 ? 2 : 1; // enraged boss acts twice every 3rd turn
      return Array.from({ length: n }, () => ({ who: 'e' as const, idx: o.i, kind: 'attack' as const, spd: o.f.def.agi * rand(0.75, 1.25) }));
    });
  }
  async execute(acts: Act[]) {
    acts.sort((a, b) => b.spd - a.spd);
    for (const a of acts) {
      if (this.over) return;
      if (a.who === 'p') { const m = this.party[a.idx]; if (m.hp <= 0) continue; await this.partyAct(a, m); }
      else { const f = this.foes[a.idx]; if (!f.alive) continue; if ((f.asleep || 0) > 0) { f.asleep!--; if (!f.asleep) { f.spr.clearTint(); await this.msg(`${f.name} wakes up!`, 450); } else await this.msg(`${f.name} is sound asleep. Zzz…`, 450); } else await this.foeAct(f); }
      await this.checkEnd(); if (this.over) return;
      if (this.boss && !this.bossMoment) { const b = this.foes.find(f => f.def.boss); if (b && b.alive && b.hp < b.def.hp * 0.4) { if (b.def.id === 'warden') await this.bossShardMoment(); else if (b.def.id === 'cantor') await this.ioneMoment(b); else this.bossMoment = true; } }
    }
  }
  async bossShardMoment() {
    this.bossMoment = true; const b = this.foes[0]; const hero = this.party[0];
    this.cameras.main.flash(500, 255, 230, 160); Audio.sfx('star');
    this.burst(b.x, b.y - 160, [0xffe8a0, 0xffffff], 40, 300);
    await this.msg('The Star Shard inside the Warden flares with blinding light!', 1000);
    await this.msg(`It calls out to ${hero.name}… and something long-forgotten answers.`, 1100);
    if (!hero.extraSkills.includes('starfall')) hero.extraSkills.push('starfall');
    Audio.sfx('levelup'); await this.msg(`${hero.name} remembered STARFALL! (Spells)`, 1200);
  }
  /** Chapter II: halfway through the Requiem, Ione's song answers from the depths. */
  async ioneMoment(b: Foe) {
    this.bossMoment = true; this.cameras.main.flash(500, 120, 240, 255); Audio.sfx('heal');
    this.burst(W / 2, 300, [0x6af0d0, 0xffffff, 0x9ad0ff], 50, 260);
    await this.msg('From somewhere deep below, a voice rises against the Requiem…', 1100);
    await this.msg('Ione\'s song! Mordane\'s hymn falters as the sea itself sings back!', 1100);
    for (const o of this.aliveParty()) { const s = stats(o.m); const h = Math.round(s.hp * 0.35); o.m.hp = Math.min(s.hp, o.m.hp + h); this.buffs[o.i].asleep = 0; this.healFx(o.i); }
    b.buffDef = 0.75; this.buildCards(); await this.msg('Your party is restored — and the Cantor\'s guard is broken!', 1100);
  }
  // ------------------------------------------------------------------ actions
  async partyAct(a: Act, m: Member) {
    const s = stats(m); const b = this.buffs[a.idx]; const spr = this.pSpr[a.idx];
    if (a.skill === 'sleep') { if ((b.asleep || 0) > 0) { b.asleep!--; if (b.asleep! <= 0 || Math.random() < 0.35) { b.asleep = 0; spr.clearTint(); await this.msg(`${m.name} wakes up!`, 500); } else await this.msg(`${m.name} is fast asleep… Zzz`, 500); } return; }
    if (a.kind === 'defend') { b.defending = true; await this.msg(`${m.name} is on guard.`, 400); return; }
    if (a.kind === 'flee') {
      await this.msg(`${this.party[0].name} and co. try to run…`, 500);
      const pa = this.aliveParty().reduce((t, o) => t + stats(o.m).agi, 0) / this.aliveParty().length; const ea = this.aliveFoes().reduce((t, f) => t + f.def.agi, 0) / this.aliveFoes().length;
      if (Math.random() < Phaser.Math.Clamp(0.45 + (pa - ea) * 0.03, 0.25, 0.9) || this.turn > 2) { Audio.sfx('miss'); await this.msg('You got away safely!'); this.end('flee'); return; }
      await this.msg('But the monsters block the way!'); return;
    }
    // hop
    this.tweens.add({ targets: spr, x: spr.getData('hx') - 90, yoyo: true, duration: 140, ease: 'Quad.out' });
    if (a.kind === 'attack') {
      let t = this.retarget(a.target!); if (!t) return;
      await this.msg(`${m.name} attacks!`, 250);
      await this.physHit(m, s.atk * b.atk, t, 1, m.voc === 'thief' ? 1 / 14 : 1 / 28, 'slash');
      return;
    }
    if (a.kind === 'item') {
      const it = ITEMS[a.item!]; Game.addItem(it.id, -1);
      await this.msg(`${m.name} uses ${it.name}!`, 350);
      if (it.use!.target === 'enemy') { const t = this.retarget(a.target!); if (!t) return; Audio.sfx('fire'); this.burst(t.x, t.y - 60, [0xff7a2a, 0xffc860], 30); await this.damageFoe(t, Math.round(it.use!.damage! * rand(0.9, 1.1)), false); return; }
      const tm = this.party[a.target!]; const ts = stats(tm);
      if (it.use!.revive) { if (tm.hp > 0) { await this.msg('But it has no effect.'); return; } tm.hp = Math.floor(ts.hp / 2); this.pSpr[a.target!].clearTint().setAngle(0); Audio.sfx('heal'); this.healFx(a.target!); await this.msg(`${tm.name} is revived!`); this.buildCards(); return; }
      if (tm.hp <= 0) { await this.msg('But it has no effect on the fallen.'); return; }
      if (it.use!.cure) { tm.poisoned = false; Audio.sfx('heal'); this.healFx(a.target!); this.buildCards(); await this.msg(`${tm.name} is cured!`); return; }
      if (it.use!.heal) { const h = Math.min(ts.hp - tm.hp, it.use!.heal); tm.hp += h; Audio.sfx('heal'); this.healFx(a.target!); this.popNum(this.pSpr[a.target!].x, this.pSpr[a.target!].y - 100, String(h), '#8affa0'); this.buildCards(); await this.msg(`${tm.name} recovers ${h} HP!`); return; }
      if (it.use!.mp) { const h = Math.min(ts.mp - tm.mp, it.use!.mp); tm.mp += h; Audio.sfx('heal'); this.healFx(a.target!); this.buildCards(); await this.msg(`${tm.name} recovers ${h} MP!`); return; }
      return;
    }
    if (a.kind === 'skill') {
      const sk = SKILLS[a.skill!]; if (m.mp < sk.mp) { await this.msg(`${m.name} doesn't have enough MP!`); return; }
      m.mp -= sk.mp; this.buildCards();
      await this.msg(`${m.name} ${sk.kind === 'spell' ? 'casts' : 'uses'} ${sk.name}!`, 300);
      if (sk.id === 'starfall') { m.extraSkills = m.extraSkills.filter(x => x !== 'starfall'); await this.starfall(m); return; }
      await this.useSkill(sk, m, s, a.target!, b);
    }
  }
  retarget(i: number) { const f = this.foes[i]; if (f && f.alive) return f; return this.aliveFoes()[0]; }
  async useSkill(sk: Skill, m: Member, s: any, target: number, b: any) {
    const targets = sk.target === 'allEnemies' ? this.aliveFoes() : sk.target === 'enemy' ? [this.retarget(target)!].filter(Boolean) : [];
    switch (sk.effect) {
      case 'phys': for (const t of targets) { if (!t.alive) continue; let p = sk.power; if (sk.element && t.def.weak?.includes(sk.element)) p *= 1.5; if (sk.element) this.spellFx(sk.fx, t.x, t.y - 70); await this.physHit(m, s.atk * b.atk * p, t, 1, sk.crit ?? 1 / 20, sk.fx); } return;
      case 'multi': { const t0 = targets[0]; for (let h = 0; h < (sk.hits || 2); h++) { const t = t0 && t0.alive ? t0 : this.aliveFoes()[0]; if (!t) return; await this.physHit(m, s.atk * b.atk * sk.power, t, 1, 1 / 16, sk.fx); } return; }
      case 'healAll': { Audio.sfx('heal'); for (const o of this.aliveParty()) { const h = Math.min(stats(o.m).hp - o.m.hp, Math.round((sk.power + s.mag * 0.4) * rand(0.9, 1.1))); o.m.hp += h; this.healFx(o.i); this.popNum(this.pSpr[o.i].x, this.pSpr[o.i].y - 100, String(h), '#8affa0'); } this.buildCards(); await this.msg('The party\'s wounds close!'); return; }
      case 'sleep': { Audio.sfx('dark'); let n = 0; for (const t of targets) { this.spellFx('dark', t.x, t.y - 60); if (!t.def.boss && Math.random() < sk.power) { t.asleep = 2 + (Math.random() < 0.5 ? 1 : 0); t.spr.setTint(0x9a9ad8); n++; } } await this.msg(n ? (n > 1 ? `${n} foes drift off to sleep!` : `${targets.find(t => t.asleep)?.name} falls asleep!`) : 'But the foes resist!'); return; }
      case 'debuffFoe': { Audio.sfx('dark'); for (const t of targets) { t.buffDef = Math.min(t.buffDef, sk.power); this.burst(t.x, t.y - 80, [0xff60c0, 0xa040ff], 16, 160); } await this.msg('The foes\' guard crumbles!'); return; }
      case 'cover': { const i = this.party.indexOf(m); this.buffs[i].cover = true; Audio.sfx('buff'); this.burst(this.pSpr[i].x, this.pSpr[i].y - 100, [0xffe8a0, 0xffffff], 18, 140); await this.msg(`${m.name} stands guard over the party!`); return; }
      case 'magic': Audio.sfx(sk.fx === 'ice' ? 'ice' : sk.fx === 'light' ? 'heal' : sk.fx === 'dark' ? 'dark' : 'fire');
        for (const t of targets) { this.spellFx(sk.fx, t.x, t.y - 70); await this.wait(250); let dmg = (sk.power + s.mag * 0.35) * rand(0.9, 1.1); const el = sk.element; if (el && t.def.weak?.includes(el)) dmg *= 1.5; if (el && t.def.resist?.includes(el)) dmg *= 0.5; await this.damageFoe(t, Math.round(dmg), false, el && t.def.weak?.includes(el)); }
        return;
      case 'drainMp': { const t = targets[0]; if (!t) return; Audio.sfx('dark'); this.spellFx('dark', t.x, t.y - 60); const v = Math.min(t.mp, Math.round(sk.power * rand(0.8, 1.2))); t.mp -= v; m.mp = Math.min(s.mp, m.mp + v); this.buildCards(); await this.msg(v ? `${m.name} absorbs ${v} MP!` : `${t.name} has no MP to steal!`); return; }
      case 'heal': { const tm = this.party[target]; if (!tm || tm.hp <= 0) { await this.msg('But nothing happens.'); return; } const h = Math.min(stats(tm).hp - tm.hp, Math.round((sk.power + s.mag * 0.6) * rand(0.9, 1.1))); tm.hp += h; Audio.sfx('heal'); this.healFx(target); this.popNum(this.pSpr[target].x, this.pSpr[target].y - 100, String(h), '#8affa0'); this.buildCards(); await this.msg(`${tm.name} recovers ${h} HP!`); return; }
      case 'buffDef': case 'buffAtk': {
        Audio.sfx('buff'); const idxs = sk.target === 'self' ? [this.party.indexOf(m)] : this.aliveParty().map(o => o.i);
        for (const i of idxs) { const bb = this.buffs[i]; if (sk.effect === 'buffDef') bb.def = sk.power; else bb.atk = sk.power; bb.turns = 4; this.burst(this.pSpr[i].x, this.pSpr[i].y - 100, [0x9ad0ff, 0xffffff], 14, 120); }
        await this.msg(sk.effect === 'buffDef' ? 'Defence rises!' : 'Attack power surges!'); return;
      }
      case 'steal': { const t = targets[0]; if (!t) return; await this.physHit(m, s.atk * b.atk * 0.8, t, 1, 0, 'slash'); if (t.def.drop && !t.stolen && Math.random() < 0.6) { t.stolen = true; Game.addItem(t.def.drop.item); Audio.sfx('coin'); await this.msg(`${m.name} pilfered a ${ITEMS[t.def.drop.item].name}!`); } else await this.msg('Couldn\'t steal anything.'); return; }
      case 'poison': { const t = targets[0]; if (!t) return; await this.physHit(m, s.atk * b.atk, t, 1, 0, 'dark'); if (t.alive && Math.random() < 0.7) { t.poisoned = true; Audio.sfx('poison'); await this.msg(`${t.name} is poisoned!`); } return; }
    }
  }
  async physHit(m: Member, atk: number, t: Foe, _: number, critChance: number, fx: string) {
    if (Math.random() < 0.04) { Audio.sfx('miss'); this.tweens.add({ targets: t.spr, x: t.x + 40, yoyo: true, duration: 120 }); await this.msg(`${t.name} dodges!`, 400); return; }
    const crit = Math.random() < critChance;
    let dmg = crit ? atk * rand(0.95, 1.1) : (atk / 2 - (t.def.def * t.buffDef) / 4) * rand(0.85, 1.15);
    dmg = dmg < 1 ? (Math.random() < 0.5 ? 0 : 1) : Math.round(dmg);
    const sl = this.add.image(t.x, t.y - t.spr.displayHeight / 2, 'slash').setScale(crit ? 4 : 3).setTint(crit ? 0xffd070 : 0xffffff).setBlendMode(Phaser.BlendModes.ADD).setAngle(Phaser.Math.Between(-30, 30)).setDepth(80);
    this.tweens.add({ targets: sl, alpha: 0, scale: crit ? 5 : 3.6, duration: 260, onComplete: () => sl.destroy() });
    if (fx === 'dark') this.spellFx('dark', t.x, t.y - 60);
    if (crit) { Audio.sfx('crit'); this.cameras.main.flash(150, 255, 240, 200); this.cameras.main.shake(300, 0.02); await this.msg('A critical hit!!', 300); }
    else Audio.sfx('hit');
    await this.damageFoe(t, dmg, crit);
  }
  async damageFoe(t: Foe, dmg: number, crit: boolean, weak = false) {
    t.hp -= dmg; if (t.asleep && dmg > 0 && Math.random() < 0.5) { t.asleep = 0; this.time.delayedCall(120, () => t.spr.clearTint()); } t.spr.setTintFill(0xffffff); this.time.delayedCall(90, () => t.spr.clearTint());
    this.tweens.add({ targets: t.spr, x: t.x + 14, yoyo: true, repeat: 2, duration: 40, onComplete: () => t.spr.setX(t.x) });
    this.burst(t.x, t.y - t.spr.displayHeight / 2, [0xffffff, 0xffe8a0], crit ? 30 : 10, crit ? 300 : 160, 'px');
    if (dmg > 0) this.cameras.main.shake(120, 0.005 + (crit ? 0.01 : 0));
    if (crit || weak) this.punch(t.x, t.y - t.spr.displayHeight / 2, crit ? 1.4 : 1);
    this.popNum(t.x, t.y - t.spr.displayHeight - 10, String(dmg), crit ? '#ffd070' : '#ffffff', crit);
    await this.msg(dmg > 0 ? `${t.name} takes ${dmg} damage!${weak ? ' It\'s super effective!' : ''}` : `${t.name} takes no damage!`, 450);
    if (t.hp <= 0) await this.killFoe(t);
  }
  /** Hit-stop + camera punch: a few frames of freeze, then a quick zoom toward the impact. */
  punch(x: number, y: number, k = 1) {
    if (fast()) return;
    const cam = this.cameras.main; this.tweens.timeScale = 0.04; setTimeout(() => { if (this.sys.isActive()) this.tweens.timeScale = 1; }, 70 * k);
    const z0 = cam.zoom; cam.zoomTo(z0 * (1 + 0.05 * k), 90, 'Quad.out', true);
    cam.pan(W / 2 + (x - W / 2) * 0.06 * k, H / 2 + (y - H / 2) * 0.06 * k, 90, 'Quad.out', true);
    this.time.delayedCall(170 * k, () => { cam.zoomTo(z0, 260, 'Sine.inOut', true); cam.pan(W / 2, H / 2, 260, 'Sine.inOut', true); });
  }
  async killFoe(t: Foe) {
    t.alive = false; t.hp = 0; Audio.sfx('die'); this.punch(t.x, t.y - t.spr.displayHeight / 2, t.def.boss ? 2 : 0.8);
    this.tweens.killTweensOf(t.spr); t.spr.setTint(0xff4060);
    this.burst(t.x, t.y - t.spr.displayHeight / 2, [0xff6080, 0xffd070, 0xffffff], t.def.boss ? 120 : 30, t.def.boss ? 400 : 200);
    if (t.def.boss) { this.cameras.main.shake(1500, 0.03); this.cameras.main.flash(800, 255, 200, 140); Audio.sfx('quake'); }
    this.tweens.add({ targets: t.spr, alpha: 0, scaleX: t.spr.scaleX * 1.4, scaleY: 0, duration: t.def.boss ? 1600 : 450, ease: 'Cubic.in' });
    await this.msg(`${t.name} is defeated!`, t.def.boss ? 1600 : 450);
  }
  async starfall(m: Member) {
    Audio.sfx('star'); this.cameras.main.flash(600, 255, 255, 220);
    const ov = this.add.rectangle(0, 0, W, H, 0x000010, 0).setOrigin(0).setDepth(70); this.tweens.add({ targets: ov, fillAlpha: 0.6, duration: 300 });
    for (let i = 0; i < 22; i++) this.time.delayedCall(i * 50, () => { const x = rand(0, W), st = this.add.image(x + 200, -40, 'star').setScale(rand(2, 4)).setTint(0xffe8a0).setBlendMode(Phaser.BlendModes.ADD).setDepth(85); this.tweens.add({ targets: st, x: x - 100, y: rand(400, 600), duration: 450, ease: 'Quad.in', onComplete: () => { this.burst(st.x, st.y, [0xffe8a0, 0xffffff, 0x9ad0ff], 12, 260); st.destroy(); Audio.sfx('hit'); } }); });
    await this.wait(1400); this.cameras.main.shake(600, 0.03); this.tweens.add({ targets: ov, fillAlpha: 0, duration: 500, onComplete: () => ov.destroy() });
    for (const t of this.aliveFoes()) await this.damageFoe(t, Math.round((SKILLS.starfall.power + stats(m).mag * 0.5 + m.level * 4) * rand(0.95, 1.05)), true);
  }
  healFx(i: number) { const x = this.pSpr[i].x; this.add.particles(x, this.pSpr[i].y - 20, 'spark', { lifespan: 800, speedY: { min: -160, max: -60 }, speedX: { min: -40, max: 40 }, scale: { start: 1.6, end: 0 }, tint: [0x8affa0, 0xffffff], blendMode: 'ADD', emitting: false }).setDepth(90).explode(22); }
  spellFx(kind: string, x: number, y: number) {
    const tints: Record<string, number[]> = { fire: [0xff7a2a, 0xffc860, 0xff3020], ice: [0x9ae6ff, 0xffffff, 0x4fa0ff], light: [0xffffff, 0xffe8a0], dark: [0xa040ff, 0x501070, 0xff60c0], heal: [0x8affa0], slash: [0xffffff], buff: [0x9ad0ff] };
    const tt = tints[kind] || [0xffffff];
    const glow = this.add.image(x, y, 'light').setTint(tt[0]).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setDepth(85);
    this.tweens.add({ targets: glow, scale: 2.4, alpha: 0, duration: 500, onComplete: () => glow.destroy() });
    if (kind === 'ice') for (let i = 0; i < 6; i++) { const s = this.add.image(x + rand(-60, 60), y - 160, 'spark').setScale(3, 6).setTint(0xd0f4ff).setBlendMode(Phaser.BlendModes.ADD).setDepth(86); this.tweens.add({ targets: s, y: y + rand(-20, 30), duration: 220 + i * 30, onComplete: () => { this.burst(s.x, s.y, tt, 6, 120); s.destroy(); } }); }
    else this.burst(x, y, tt, 40, 260);
  }
  // ------------------------------------------------------------------ enemies
  async foeAct(f: Foe) {
    const alive = this.aliveParty(); if (!alive.length) return;
    if (f.charged) { f.charged = false; const ca = f.chargeAct; f.chargeAct = undefined; f.spr.clearTint(); if (ca) { await this.foeQuake(f, ca.power || 1.3, `${f.name}'s ${ca.name} crescendos!`); return; } await this.foeQuake(f, 1.8); return; }
    const pool = f.def.actions.filter(a => !a.below || f.hp < f.def.hp * a.below);
    const tot = pool.reduce((t, a) => t + a.w, 0); let r = Math.random() * tot; let act = pool[0];
    for (const a of pool) { r -= a.w; if (r <= 0) { act = a; break; } }
    if (act.kind && await this.foeSpecial(f, act, alive)) return;
    const lunge = () => this.tweens.add({ targets: f.spr, scaleX: f.spr.scaleX * 1.15, scaleY: f.spr.scaleY * 1.15, y: f.y + 30, yoyo: true, duration: 140 });
    if (act.type === 'skill' && act.name === 'Smoulder') { f.charged = true; this.tweens.add({ targets: f.spr, tint: 0xff8040, duration: 300 }); this.burst(f.x, f.y - 150, [0xff7a2a, 0xffc860], 30); Audio.sfx('fire'); await this.msg(`${f.name} ${act.msg}`, 700); if (!Game.flag('tut_defendHint')) { Game.set('tut_defendHint'); await this.msg('(Its next attack will be devastating — DEFEND!)', 1000); } return; }
    if (act.type === 'skill' && act.name === 'Cinder Quake') { await this.foeQuake(f, act.power || 0.85); return; }
    if (act.type === 'skill' && act.skill) {
      const sk = SKILLS[act.skill]; if (f.mp < sk.mp) { act = f.def.actions[0]; } else {
        f.mp -= sk.mp; lunge(); await this.msg(`${f.name} ${act.msg}`, 400);
        const targets = sk.target === 'allEnemies' ? alive : [alive[Math.floor(Math.random() * alive.length)]];
        Audio.sfx('fire'); for (const o of targets) { this.spellFx(sk.fx, this.pSpr[o.i].x, this.pSpr[o.i].y - 80); const dmg = Math.round((sk.power + f.def.mag * 0.35) * rand(0.9, 1.1) * (this.buffs[o.i].defending ? 0.5 : 1)); await this.damageMember(o.i, dmg); }
        return;
      }
    }
    if (act.type === 'skill' && !act.power && !act.skill) { await this.msg(`${f.name} ${act.msg}`, 500); return; }
    const t = this.pickMemberTarget(alive);
    lunge(); await this.msg(act.type === 'skill' ? `${f.name} ${act.msg}` : `${f.name} attacks!`, 300);
    const s = stats(this.party[t]); const b = this.buffs[t];
    if (Math.random() < Math.min(0.15, s.agi / 400)) { Audio.sfx('miss'); this.tweens.add({ targets: this.pSpr[t], x: this.pSpr[t].x + 40, yoyo: true, duration: 120 }); await this.msg(`${this.party[t].name} dodges!`, 400); return; }
    let dmg = (f.def.atk * f.buffAtk * (act.power || 1) / 2 - (s.def * b.def) / 4) * rand(0.85, 1.15); if (b.defending || b.cover) dmg /= 2;
    dmg = dmg < 1 ? (Math.random() < 0.5 ? 0 : 1) : Math.round(dmg);
    await this.damageMember(t, dmg);
  }
  /** Data-driven enemy behaviours (see EnemyDef.actions.kind). Returns true if the action was handled. */
  async foeSpecial(f: Foe, act: any, alive: { m: Member; i: number }[]): Promise<boolean> {
    const lunge = () => this.tweens.add({ targets: f.spr, scaleX: f.spr.scaleX * 1.15, scaleY: f.spr.scaleY * 1.15, y: f.y + 30, yoyo: true, duration: 140 });
    switch (act.kind) {
      case 'all': await this.foeQuake(f, act.power || 0.8, `${f.name} ${act.msg}`); return true;
      case 'charge': f.charged = true; f.chargeAct = act; this.tweens.add({ targets: f.spr, tint: 0xff80c0, duration: 300 }); this.burst(f.x, f.y - 150, [0xff80c0, 0xffffff], 30); Audio.sfx('dark'); await this.msg(`${f.name} ${act.msg}`, 800); if (!Game.flag('tut_defendHint2')) { Game.set('tut_defendHint2'); await this.msg('(Something terrible is coming — DEFEND or heal up!)', 900); } return true;
      case 'heal': { const h = Math.round(f.def.hp * (act.power || 0.2)); f.hp = Math.min(f.def.hp, f.hp + h); Audio.sfx('heal'); this.burst(f.x, f.y - 100, [0x8affa0, 0xffffff], 24, 160); this.popNum(f.x, f.y - f.spr.displayHeight - 10, String(h), '#8affa0'); await this.msg(`${f.name} ${act.msg}`, 600); return true; }
      case 'weaken': case 'soften': { Audio.sfx('dark'); lunge(); for (const o of alive) { const b = this.buffs[o.i]; if (act.kind === 'weaken') b.atk = Math.min(b.atk, act.power || 0.8); else b.def = Math.min(b.def, act.power || 0.8); b.turns = Math.max(b.turns, 3); this.burst(this.pSpr[o.i].x, this.pSpr[o.i].y - 100, [0xa040ff, 0x501070], 12, 120); } await this.msg(`${f.name} ${act.msg}`, 800); return true; }
      case 'sleep': { const t = this.pickMemberTarget(alive); lunge(); await this.msg(`${f.name} ${act.msg}`, 500); Audio.sfx('dark'); this.spellFx('dark', this.pSpr[t].x, this.pSpr[t].y - 80); if (Math.random() < 0.6 && !this.buffs[t].defending) { this.buffs[t].asleep = 2; this.pSpr[t].setTint(0x9a9ad8); await this.msg(`${this.party[t].name} falls asleep!`, 600); } else await this.msg(`${this.party[t].name} shakes it off!`, 500); return true; }
      case 'venom': case 'drain': {
        const t = this.pickMemberTarget(alive); lunge(); await this.msg(`${f.name} ${act.msg}`, 300);
        const s = stats(this.party[t]); const b = this.buffs[t]; let dmg = (f.def.atk * f.buffAtk * (act.power || 1) / 2 - (s.def * b.def) / 4) * rand(0.85, 1.15); if (b.defending || b.cover) dmg /= 2; dmg = Math.max(1, Math.round(dmg));
        await this.damageMember(t, dmg);
        if (act.kind === 'venom' && this.party[t].hp > 0 && Math.random() < 0.45) { this.party[t].poisoned = true; Audio.sfx('poison'); this.buildCards(); await this.msg(`${this.party[t].name} is poisoned!`, 500); }
        if (act.kind === 'drain' && f.alive) { f.hp = Math.min(f.def.hp, f.hp + dmg); this.popNum(f.x, f.y - f.spr.displayHeight - 10, String(dmg), '#8affa0'); }
        return true;
      }
    }
    return false;
  }
  pickMemberTarget(alive: { m: Member; i: number }[]) { // front-liners draw more aggro; a covering Paladin draws everything
    const cov = alive.find(o => this.buffs[o.i].cover); if (cov) return cov.i;
    const w = alive.map(o => (['warrior', 'paladin'].includes(o.m.voc) ? 3 : 2)); let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let k = 0; k < alive.length; k++) { r -= w[k]; if (r <= 0) return alive[k].i; } return alive[0].i;
  }
  async foeQuake(f: Foe, power: number, msg?: string) {
    this.tweens.add({ targets: f.spr, y: f.y - 60, yoyo: true, duration: 220, ease: 'Quad.out' });
    await this.msg(msg ?? `${f.name} slams the ground! The cavern quakes!`, 300); Audio.sfx('quake'); this.cameras.main.shake(700, 0.03);
    f.spr.clearTint();
    for (const o of this.aliveParty()) { const s = stats(o.m); let dmg = (f.def.atk * power / 2 - s.def * this.buffs[o.i].def / 4) * rand(0.85, 1.1); if (this.buffs[o.i].defending || this.buffs[o.i].cover) dmg /= 2; await this.damageMember(o.i, Math.max(1, Math.round(dmg))); }
  }
  async damageMember(i: number, dmg: number) {
    const m = this.party[i]; m.hp = Math.max(0, m.hp - dmg); Audio.sfx('enemyHit'); if (this.buffs[i].asleep && dmg > 0 && Math.random() < 0.5) this.buffs[i].asleep = 0;
    const spr = this.pSpr[i]; spr.setTintFill(0xff4040); this.time.delayedCall(100, () => spr.clearTint());
    this.cameras.main.shake(180, 0.012); this.cameras.main.flash(80, 120, 0, 0);
    this.tweens.add({ targets: this.cards[i], y: 22, yoyo: true, duration: 60, repeat: 1 });
    this.popNum(spr.x, spr.y - 140, String(dmg), '#ff8080'); this.buildCards();
    await this.msg(dmg ? `${m.name} takes ${dmg} damage!` : `${m.name} takes no damage!`, 450);
    if (m.hp <= 0) await this.downMember(i);
  }
  async downMember(i: number) { const m = this.party[i]; this.pSpr[i].setTint(0x553355); this.tweens.add({ targets: this.pSpr[i], angle: 90, duration: 300 }); Audio.sfx('die'); await this.msg(`${m.name} falls!`, 600); this.buildCards(); }
  // ------------------------------------------------------------------ end
  async checkEnd() {
    if (this.over) return;
    if (!this.aliveParty().length) { this.over = true; Audio.stopMusic(); await this.msg('Your party has fallen…', 1400); this.end('lose'); return; }
    if (this.aliveFoes().length) return;
    this.over = true; Audio.play('victory', true);
    const xp = this.foes.reduce((t, f) => t + f.def.xp, 0), gold = this.foes.reduce((t, f) => t + f.def.gold, 0);
    await this.msg(this.boss ? `${this.foes.find(f => f.def.boss)?.def.name ?? 'The foe'} has been vanquished!` : 'Victory!', 700);
    const living = this.aliveParty();
    await this.msg(`Each survivor gains ${xp} EXP. Found ${gold} gold.`, 1000); Game.s.gold += gold;
    for (const f of this.foes) if (f.def.drop && Math.random() < f.def.drop.chance) { Game.addItem(f.def.drop.item); Audio.sfx('chest'); await this.msg(`The ${f.def.name} dropped a ${ITEMS[f.def.drop.item].name}!`, 800); }
    for (const { m, i } of living) {
      const ev = gainXp(m, xp);
      for (const e of ev) {
        Audio.sfx('star'); this.buildCards();
        const lt = txt(this, this.pSpr[i].x, this.pSpr[i].y - 200, 'LEVEL UP!', 44, '#ffe080', { fontFamily: SERIF }).setOrigin(0.5).setDepth(100); this.tweens.add({ targets: lt, y: 500, alpha: 0, delay: 900, duration: 700, onComplete: () => lt.destroy() });
        this.burst(this.pSpr[i].x, this.pSpr[i].y - 100, [0xffe080, 0xffffff], 30, 220);
        const g = e.gains as any; await this.msg(`${m.name} is now level ${e.level}!  HP+${g.hp} MP+${g.mp} ATK+${g.atk} DEF+${g.def}`, 1200);
        for (const s of e.learned) await this.msg(`${m.name} learned ${SKILLS[s].name}!`, 1000);
      }
    }
    if (!Game.flag('tut_victory')) { Game.set('tut_victory'); await card(this, TUTORIALS.victory.title, TUTORIALS.victory.body, 'ic_star'); }
    this.end('win');
  }
  end(r: string) {
    this.over = true; for (const m of this.party) { if (m.hp < 0) m.hp = 0; m.extraSkills = m.extraSkills.filter(s => s !== 'starfall'); }
    while (Input.stack.length) Input.stack.pop();
    this.cameras.main.fadeOut(fast() ? 50 : 450);
    this.time.delayedCall(fast() ? 60 : 480, () => { const cb = this.d.onEnd; this.scene.stop(); cb?.(r); });
  }
}
