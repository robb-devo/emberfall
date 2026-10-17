import Phaser from 'phaser';
import { Audio } from '../systems/audio';
import { Input, Action, Focus } from './input';

export const FONT = '"Trebuchet MS", "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
export const SERIF = 'Georgia, "Times New Roman", serif';
export const W = 720, H = 1280;
export const COL = { gold: 0xf0d9a0, goldS: '#f0d9a0', text: '#fdf6e3', dim: '#9a94b8', hp: 0x6fe08a, mp: 0x6fb3ff, red: '#ff6b6b', bg1: 0x1a1d44, bg2: 0x0b0c22, accent: '#ffcf6e' };

export function txt(s: Phaser.Scene, x: number, y: number, str: string, size = 30, color = COL.text, o: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}) {
  const t = s.add.text(x, y, str, { fontFamily: FONT, fontSize: size + 'px', color, stroke: '#0a0818', strokeThickness: Math.max(3, size / 7), ...o });
  t.setShadow(0, 3, '#000', 2, true, true); t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); return t;
}
export function panel(s: Phaser.Scene, x: number, y: number, w: number, h: number, alpha = 0.95) {
  const g = s.add.graphics({ x, y });
  g.fillStyle(0x000000, 0.35); g.fillRoundedRect(4, 8, w, h, 16);
  g.fillGradientStyle(COL.bg1, COL.bg1, COL.bg2, COL.bg2, alpha); g.fillRoundedRect(0, 0, w, h, 16);
  g.lineStyle(4, COL.gold, 1); g.strokeRoundedRect(2, 2, w - 4, h - 4, 14);
  g.lineStyle(2, 0x5a4a8a, 0.9); g.strokeRoundedRect(9, 9, w - 18, h - 18, 10);
  // corner gems
  for (const [cx, cy] of [[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]]) { g.fillStyle(0xffcf6e, 1); g.fillCircle(cx, cy, 4); }
  return g;
}

export interface MenuItem { label: string; sub?: string; disabled?: boolean; icon?: string; color?: string; data?: any }
/** Touch + keyboard list menu with scrolling. */
export class ListMenu extends Phaser.GameObjects.Container implements Focus {
  items: MenuItem[]; idx = 0; top = 0; rows: Phaser.GameObjects.Container[] = []; cursor: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Graphics;
  onSelect?: (i: number, it: MenuItem) => void; onCancel?: () => void; onChange?: (i: number, it: MenuItem) => void;
  cols: number; itemH: number; visible_: number; w: number; h: number; active = true; fontSize: number;
  constructor(s: Phaser.Scene, x: number, y: number, w: number, items: MenuItem[], o: { cols?: number; itemH?: number; rows?: number; title?: string; fontSize?: number; noPanel?: boolean } = {}) {
    super(s, x, y);
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
  bodyT: Phaser.GameObjects.Text; nameTag: Phaser.GameObjects.Container; arrow: Phaser.GameObjects.Text;
  full = ''; shown = 0; resolve?: () => void; typing = false; timer?: Phaser.Time.TimerEvent; auto = false;
  constructor(s: Phaser.Scene) {
    super(s, 0, 0); s.add.existing(this);
    const y = H - 360;
    this.add(panel(s, 20, y, W - 40, 300));
    this.bodyT = txt(s, 56, y + 46, '', 33, COL.text, { wordWrap: { width: W - 120 }, lineSpacing: 12 }); this.add(this.bodyT);
    this.nameTag = s.add.container(40, y - 34); this.add(this.nameTag);
    this.arrow = txt(s, W - 80, y + 240, '▼', 28, COL.accent); this.add(this.arrow);
    s.tweens.add({ targets: this.arrow, y: '+=10', yoyo: true, repeat: -1, duration: 400 });
    const z = s.add.zone(0, 0, W, H).setOrigin(0).setInteractive(); this.add(z); this.sendToBack(z);
    z.on('pointerdown', () => this.onAction('ok'));
    this.setDepth(1000).setVisible(false);
  }
  show(text: string, name?: string): Promise<void> {
    this.setVisible(true); this.nameTag.removeAll(true);
    if (name) { const t = txt(this.scene, 26, 10, name, 28, COL.accent); const g = panel(this.scene, 0, 0, t.width + 52, 58); this.nameTag.add([g, t]); }
    this.full = text; this.shown = 0; this.bodyT.setText(''); this.typing = true; this.arrow.setVisible(false);
    Input.push(this);
    this.timer?.remove();
    this.timer = this.scene.time.addEvent({ delay: 18, loop: true, callback: () => {
      this.shown += 1; this.bodyT.setText(this.full.slice(0, this.shown));
      if (this.shown % 3 === 0 && this.full[this.shown] !== ' ') Audio.sfx('talk');
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
  hide() { this.setVisible(false); }
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
    const f: Focus = { onAction: a => { if (a === 'ok' || a === 'cancel') done(); } };
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
