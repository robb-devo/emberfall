import Phaser from 'phaser';
import { Audio } from '../systems/audio';
import { Input, Action, Focus } from './input';
import { ensurePortrait, PW } from '../gfx/portrait';
import type { DollSpec } from '../systems/paperdoll';

export const FONT = '"Alegreya Sans", "Trebuchet MS", "Segoe UI", Roboto, sans-serif';
export const SERIF = 'Cinzel, Georgia, "Times New Roman", serif';
export const DECO = '"Cinzel Decorative", Cinzel, Georgia, serif';
export const W = 720, H = 1280;
export const COL = { gold: 0xf0d9a0, goldS: '#f0d9a0', text: '#fdf6e3', dim: '#9a94b8', hp: 0x6fe08a, mp: 0x6fb3ff, red: '#ff6b6b', bg1: 0x1a1d44, bg2: 0x0b0c22, accent: '#ffcf6e' };

export function txt(s: Phaser.Scene, x: number, y: number, str: string, size = 30, color = COL.text, o: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) {
  const t = s.add.text(x, y, str, { fontFamily: FONT, fontStyle: o.fontFamily === SERIF || o.fontFamily === DECO ? '700' : '500', fontSize: Math.round(size * (o.fontFamily ? 1 : 1.06)) + 'px', color, stroke: '#0a0818', strokeThickness: Math.max(3, size / 7), resolution: 1, ...o });
  t.setShadow(0, 3, '#000', 2, true, true); t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); return t;
}
/** Octopath-style ornate window: translucent deep-indigo glass, double gold frame with bevel, filigree corners. */
export function panel(s: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.95) {
  const g = s.add.graphics({ x, y });
  drawPanel(g, w, h, alpha); return g;
}
export function drawPanel(g: Phaser.GameObjects.Graphics, w: number, h: number, alpha = 0.95) {
  const small = Math.min(w, h) < 90;
  // soft drop shadow
  for (let i = 3; i >= 1; i--) { g.fillStyle(0x000000, 0.12); g.fillRoundedRect(-i * 2 + 4, -i + 8, w + i * 4, h + i * 2, 12 + i * 2); }
  // glass body: vertical gradient + subtle top sheen
  g.fillGradientStyle(0x1f2350, 0x1f2350, 0x0a0b1e, 0x0a0b1e, alpha * 0.92); g.fillRect(3, 3, w - 6, h - 6);
  g.fillGradientStyle(0xffffff, 0xffffff, 0xffffff, 0xffffff, 0.07, 0.07, 0, 0); g.fillRect(3, 3, w - 6, Math.min(h * 0.45, 70));
  // inner vignette edge
  g.lineStyle(6, 0x05050f, 0.35); g.strokeRect(8, 8, w - 16, h - 16);
  // outer frame: dark core + gold bevel (light top-left, deeper bottom-right)
  g.lineStyle(5, 0x2a1d0c, 1); g.strokeRect(2.5, 2.5, w - 5, h - 5);
  g.lineStyle(2, 0xf6e2a6, 1); g.beginPath(); g.moveTo(2, h - 3); g.lineTo(2, 2); g.lineTo(w - 3, 2); g.strokePath();
  g.lineStyle(2, 0xb08a42, 1); g.beginPath(); g.moveTo(w - 2, 3); g.lineTo(w - 2, h - 2); g.lineTo(3, h - 2); g.strokePath();
  g.lineStyle(1, 0xd8b868, 1); g.strokeRect(4.5, 4.5, w - 9, h - 9);
  if (small) return;
  // thin inner rule
  g.lineStyle(1, 0xc9a65a, 0.55); g.strokeRect(11.5, 11.5, w - 23, h - 23);
  // filigree corners
  const corner = (cx: number, cy: number, sx: number, sy: number) => {
    g.fillStyle(0x2a1d0c, 1); g.fillTriangle(cx, cy, cx + sx * 26, cy, cx, cy + sy * 26);
    g.lineStyle(2, 0xe8cc84, 1);
    g.beginPath(); g.moveTo(cx + sx * 30, cy + sy * 2); g.lineTo(cx + sx * 2, cy + sy * 2); g.lineTo(cx + sx * 2, cy + sy * 30); g.strokePath();
    g.lineStyle(1.5, 0xe8cc84, 0.95);
    // two scrolls curling inward
    g.beginPath(); g.arc(cx + sx * 16, cy + sy * 9, 5, 0, Math.PI * 2); g.strokePath();
    g.beginPath(); g.arc(cx + sx * 9, cy + sy * 16, 5, 0, Math.PI * 2); g.strokePath();
    g.beginPath(); g.moveTo(cx + sx * 21, cy + sy * 9); g.lineTo(cx + sx * 44, cy + sy * 9); g.strokePath();
    g.beginPath(); g.moveTo(cx + sx * 9, cy + sy * 21); g.lineTo(cx + sx * 9, cy + sy * 44); g.strokePath();
    // gem
    g.fillStyle(0x7a1420, 1); g.fillCircle(cx + sx * 8, cy + sy * 8, 5);
    g.fillStyle(0xff7a6a, 1); g.fillCircle(cx + sx * 7, cy + sy * 7, 2.2);
    g.lineStyle(1.5, 0xf6e2a6, 1); g.strokeCircle(cx + sx * 8, cy + sy * 8, 5.5);
  };
  corner(0, 0, 1, 1); corner(w, 0, -1, 1); corner(0, h, 1, -1); corner(w, h, -1, -1);
  // centre crest ornaments on long edges
  if (w > 220) for (const yy of [2, h - 2]) {
    const cx = w / 2, d = yy < h / 2 ? 1 : -1;
    g.fillStyle(0x2a1d0c, 1); g.fillTriangle(cx - 14, yy, cx + 14, yy, cx, yy + d * 9);
    g.fillStyle(0xe8cc84, 1); g.fillTriangle(cx - 9, yy, cx + 9, yy, cx, yy + d * 6);
    g.lineStyle(1.5, 0xe8cc84, 0.9); g.beginPath(); g.moveTo(cx - 60, yy + d * 4); g.lineTo(cx - 18, yy + d * 4); g.moveTo(cx + 18, yy + d * 4); g.lineTo(cx + 60, yy + d * 4); g.strokePath();
  }
}

export interface MenuItem { label: string; sub?: string; disabled?: boolean; icon?: string; color?: string; data?: any }
/** Touch + keyboard list menu with scrolling. */
export class ListMenu extends Phaser.GameObjects.Container implements Focus {
  items: MenuItem[]; idx = 0; top = 0; rows: Phaser.GameObjects.Container[] = []; cursor: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Graphics;
  onSelect?: (i: number, it: MenuItem) => void; onCancel?: () => void; onChange?: (i: number, it: MenuItem) => void;
  cols: number; itemH: number; visible_: number; w: number; h: number; active = true; fontSize: number;
  backOverride?: boolean; title = '';
  /** Unified Back button shows whenever the menu can be cancelled (override with o.back). */
  get canBack() { return this.active && (this.backOverride ?? !!this.onCancel); }
  constructor(s: Phaser.Scene, x: number, y: number, w: number, items: MenuItem[], o: { cols?: number; itemH?: number; rows?: number; title?: string; fontSize?: number; noPanel?: boolean; back?: boolean } = {}) {
    super(s, x, y); this.backOverride = o.back; this.title = o.title || '';
    this.items = items; this.cols = o.cols || 1; this.itemH = o.itemH || 76; this.fontSize = o.fontSize || 32;
    this.visible_ = Math.min(o.rows || 8, Math.ceil(items.length / this.cols)); this.w = w;
    const titleH = o.title ? 56 : 0;
    this.h = this.visible_ * this.itemH + 36 + titleH;
    this.bg = o.noPanel ? s.add.graphics() : panel(s, 0, 0, w, this.h); this.add(this.bg);
    if (o.title) this.add(txt(s, 30, 22, o.title, 28, COL.accent));
    this.cursor = txt(s, 0, 0, '▶', this.fontSize, COL.accent); this.add(this.cursor);
    s.tweens.add({ targets: this.cursor, x: '+=8', yoyo: true, repeat: -1, duration: 320, ease: 'Sine.inOut' });
    const zone = s.add.zone(0, titleH, w, this.h - titleH).setOrigin(0).setInteractive(); this.add(zone);
    let dragY: number | null = null, moved = false;
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => { dragY = p.y; moved = false; });
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (dragY === null || !p.isDown) return; const dy = p.y - dragY;
      if (Math.abs(dy) > this.itemH * 0.7) { moved = true; this.scroll(dy < 0 ? 1 : -1); dragY = p.y; }
    });
    zone.on('pointerup', (p: Phaser.Input.Pointer) => {
      dragY = null; if (moved || !this.active) return;
      const lx = p.x - this.x - (this.parentContainer?.x || 0), ly = p.y - this.y - (this.parentContainer?.y || 0) - 18 - titleH;
      const r = Math.floor(ly / this.itemH), c = Math.floor((lx - 10) / ((this.w - 20) / this.cols));
      const i = (this.top + r) * this.cols + Math.max(0, Math.min(this.cols - 1, c));
      if (r < 0 || r >= this.visible_ || i >= this.items.length) return;
      if (i !== this.idx) { this.idx = i; this.refresh(); Audio.sfx('cursor'); this.onChange?.(i, this.items[i]); }
      this.confirm();
    });
    this.titleH = titleH;
    s.add.existing(this); this.build(); Input.push(this);
  }
  titleH = 0;
  scroll(d: number) { const maxTop = Math.max(0, Math.ceil(this.items.length / this.cols) - this.visible_); this.top = Phaser.Math.Clamp(this.top + d, 0, maxTop); this.build(); }
  setItems(items: MenuItem[]) { this.items = items; this.idx = Math.min(this.idx, items.length - 1); this.build(); }
  build() {
    this.rows.forEach(r => r.destroy()); this.rows = [];
    const cw = (this.w - 20) / this.cols;
    for (let r = 0; r < this.visible_; r++) for (let c = 0; c < this.cols; c++) {
      const i = (this.top + r) * this.cols + c; const it = this.items[i]; if (!it) continue;
      const row = this.scene.add.container(10 + c * cw, 18 + this.titleH + r * this.itemH);
      let tx = 44;
      if (it.icon && this.scene.textures.exists(it.icon)) { row.add(this.scene.add.image(60, this.itemH / 2, it.icon).setScale(3)); tx = 90; }
      row.add(txt(this.scene, tx, this.itemH / 2, it.label, this.fontSize, it.disabled ? COL.dim : (it.color || COL.text)).setOrigin(0, 0.5));
      if (it.sub) row.add(txt(this.scene, cw - 24, this.itemH / 2, it.sub, this.fontSize - 4, it.disabled ? COL.dim : COL.goldS).setOrigin(1, 0.5));
      this.add(row); this.rows.push(row);
    }
    if (this.items.length > this.visible_ * this.cols) {
      if (this.top > 0) this.rows.push(this.add(txt(this.scene, this.w / 2, 4 + this.titleH, '▲', 22, COL.accent).setOrigin(0.5, 0)) as any);
      if ((this.top + this.visible_) * this.cols < this.items.length) this.rows.push(this.add(txt(this.scene, this.w / 2, this.h - 8, '▼', 22, COL.accent).setOrigin(0.5, 1)) as any);
    }
    this.refresh();
  }
  refresh() {
    const cw = (this.w - 20) / this.cols; const r = Math.floor(this.idx / this.cols) - this.top, c = this.idx % this.cols;
    this.cursor.setVisible(r >= 0 && r < this.visible_ && this.active);
    this.cursor.y = 18 + this.titleH + r * this.itemH + this.itemH / 2 - this.cursor.height / 2; this.cursor.x = 10 + c * cw + 8;
    this.bringToTop(this.cursor);
  }
  move(d: number) {
    const n = this.items.length; if (!n) return;
    let i = this.idx + d; if (i < 0) i = (d === -1 ? n - 1 : this.idx); if (i >= n) i = d === 1 ? 0 : this.idx; if (i < 0 || i >= n) return;
    this.idx = i; const r = Math.floor(i / this.cols);
    if (r < this.top) { this.top = r; this.build(); } else if (r >= this.top + this.visible_) { this.top = r - this.visible_ + 1; this.build(); } else this.refresh();
    Audio.sfx('cursor'); this.onChange?.(i, this.items[i]);
  }
  confirm() { const it = this.items[this.idx]; if (!it) return; if (it.disabled) { Audio.sfx('cancel'); return; } Audio.sfx('confirm'); this.onSelect?.(this.idx, it); }
  onAction(a: Action) {
    if (!this.active) return;
    if (a === 'up') this.move(-this.cols); else if (a === 'down') this.move(this.cols);
    else if (a === 'left' && this.cols > 1) this.move(-1); else if (a === 'right' && this.cols > 1) this.move(1);
    else if (a === 'ok') this.confirm(); else if (a === 'cancel' && this.onCancel) { Audio.sfx('cancel'); this.onCancel(); }
  }
  setActive(v: boolean) { this.active = v; this.refresh(); this.setAlpha(v ? 1 : 0.75); return this; }
  close() { Input.pop(this); this.destroy(); }
}

/** Typewriter dialog box. */
export class DialogBox extends Phaser.GameObjects.Container implements Focus {
  bodyT: Phaser.GameObjects.Text; nameTag: Phaser.GameObjects.Container; arrow: Phaser.GameObjects.Text; bust: Phaser.GameObjects.Image; bustBg: Phaser.GameObjects.Image; bustKey = '';
  full = ''; shown = 0; resolve?: () => void; typing = false; timer?: Phaser.Time.TimerEvent; auto = false;
  constructor(s: Phaser.Scene) {
    super(s, 0, 0); s.add.existing(this);
    const y = H - 360;
    if (!s.textures.exists('bustglow')) { const t = s.textures.createCanvas('bustglow', 300, 200)!; const c = t.getContext(); const g = c.createRadialGradient(150, 130, 10, 150, 130, 150); g.addColorStop(0, 'rgba(20,18,50,0.85)'); g.addColorStop(0.6, 'rgba(20,18,50,0.5)'); g.addColorStop(1, 'rgba(20,18,50,0)'); c.fillStyle = g; c.fillRect(0, 0, 300, 200); t.refresh(); }
    this.bustBg = s.add.image(PW / 2 + 24, y + 30, 'bustglow').setOrigin(0.5, 1).setScale(1.1, 1.5).setVisible(false); this.add(this.bustBg);
    this.bust = s.add.image(24, y + 26, '__DEFAULT').setOrigin(0, 1).setVisible(false); this.add(this.bust);
    this.add(panel(s, 20, y, W - 40, 300));
    this.bodyT = txt(s, 56, y + 46, '', 33, COL.text, { wordWrap: { width: W - 120 }, lineSpacing: 12 }); this.add(this.bodyT);
    this.nameTag = s.add.container(40, y - 34); this.add(this.nameTag);
    this.arrow = txt(s, W - 80, y + 240, '▼', 28, COL.accent); this.add(this.arrow);
    s.tweens.add({ targets: this.arrow, y: '+=10', yoyo: true, repeat: -1, duration: 400 });
    const z = s.add.zone(0, 0, W, H).setOrigin(0).setInteractive(); this.add(z); this.sendToBack(z);
    z.on('pointerdown', () => this.onAction('ok'));
    this.setDepth(1000).setVisible(false);
  }
  show(text: string, name?: string, who?: DollSpec): Promise<void> {
    this.setVisible(true); this.nameTag.removeAll(true);
    const key = who ? ensurePortrait(this.scene, who) : '';
    this.nameTag.x = key ? 40 + PW - 30 : 40;
    if (key) {
      const fresh = key !== this.bustKey || !this.bust.visible; this.bustKey = key;
      this.bust.setTexture(key).setVisible(true); this.bustBg.setVisible(true);
      if (fresh) { this.bust.setAlpha(0); this.bust.x = 4; this.scene.tweens.add({ targets: this.bust, alpha: 1, x: 24, duration: 260, ease: 'Cubic.out' }); }
    } else { this.bust.setVisible(false); this.bustBg.setVisible(false); this.bustKey = ''; }
    if (name) { const t = txt(this.scene, 26, 10, name, 28, COL.accent, { fontFamily: SERIF }); const g = panel(this.scene, 0, 0, t.width + 52, 58); this.nameTag.add([g, t]); }
    this.full = this.bodyT.getWrappedText(text).join('\n'); /* pre-wrap so words never jump lines while typing */ this.shown = 0; this.bodyT.setText(''); this.typing = true; this.arrow.setVisible(false);
    Input.push(this);
    this.timer?.remove();
    const t0 = this.scene.time.now; let lastBlip = 0;
    this.timer = this.scene.time.addEvent({ delay: 16, loop: true, callback: () => {
      // time-based (~55 chars/s): frame drops never slow the dialogue
      this.shown = Math.min(this.full.length, 1 + Math.floor((this.scene.time.now - t0) / 18)); this.bodyT.setText(this.full.slice(0, this.shown));
      if (this.shown - lastBlip >= 3 && this.full[this.shown] !== ' ') { lastBlip = this.shown; Audio.sfx('talk'); }
      if (this.shown >= this.full.length) this.finishType();
    } });
    return new Promise(r => (this.resolve = r));
  }
  finishType() { this.timer?.remove(); this.typing = false; this.bodyT.setText(this.full); this.arrow.setVisible(true); if (this.auto) this.scene.time.delayedCall(10, () => this.onAction('ok')); }
  onAction(a: Action) {
    if (a !== 'ok' && a !== 'cancel') return;
    if (this.typing) { this.finishType(); return; }
    Input.pop(this); const r = this.resolve; this.resolve = undefined; r?.();
  }
  hide() { this.setVisible(false); this.bust.setVisible(false); this.bustBg.setVisible(false); this.bustKey = ''; }
}

/** Large centered tutorial / info card. */
export function card(s: Phaser.Scene, title: string, body: string, icon?: string): Promise<void> {
  return new Promise(res => {
    const c = s.add.container(0, 0).setDepth(2000);
    const dim = s.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive(); c.add(dim);
    const bodyT = txt(s, W / 2, 0, body, 30, COL.text, { wordWrap: { width: W - 160 }, align: 'center', lineSpacing: 10 }).setOrigin(0.5, 0);
    const h = bodyT.height + 230; const y0 = H / 2 - h / 2;
    c.add(panel(s, 40, y0, W - 80, h));
    if (icon) c.add(s.add.image(W / 2, y0 + 10, icon).setScale(4));
    c.add(txt(s, W / 2, y0 + 50, title, 38, COL.accent, { fontFamily: SERIF }).setOrigin(0.5, 0));
    bodyT.y = y0 + 115; c.add(bodyT);
    const ok = txt(s, W / 2, y0 + h - 60, '[ OK ]', 32, COL.goldS).setOrigin(0.5); c.add(ok);
    s.tweens.add({ targets: ok, alpha: 0.4, yoyo: true, repeat: -1, duration: 500 });
    c.setScale(0.8).setAlpha(0); s.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
    c.x = (W - W * 0.8) / 2; c.y = (H - H * 0.8) / 2; s.tweens.add({ targets: c, x: 0, y: 0, duration: 220, ease: 'Back.out' });
    Audio.sfx('chest');
    const f: Focus = { canBack: true, onAction: a => { if (a === 'ok' || a === 'cancel') done(); } };
    let closed = false;
    const done = () => { if (closed) return; closed = true; Input.pop(f); Audio.sfx('confirm'); s.tweens.add({ targets: c, alpha: 0, duration: 150, onComplete: () => { c.destroy(); res(); } }); };
    s.time.delayedCall(250, () => { Input.push(f); dim.on('pointerdown', done); });
  });
}

export function bar(s: Phaser.Scene, x: number, y: number, w: number, h: number, frac: number, color: number) {
  const g = s.add.graphics({ x, y }); drawBar(g, w, h, frac, color); return g;
}
export function drawBar(g: Phaser.GameObjects.Graphics, w: number, h: number, frac: number, color: number) {
  g.clear(); g.fillStyle(0x05040c, 1); g.fillRoundedRect(0, 0, w, h, h / 2);
  const f = Math.max(0, Math.min(1, frac));
  if (f > 0) { g.fillStyle(frac < 0.25 && color === COL.hp ? 0xff6b6b : color, 1); g.fillRoundedRect(2, 2, Math.max(h - 4, (w - 4) * f), h - 4, (h - 4) / 2); g.fillStyle(0xffffff, 0.3); g.fillRect(6, 3, Math.max(0, (w - 12) * f), 2); }
}
