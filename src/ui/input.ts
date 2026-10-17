import { App } from '@capacitor/app';
/** Unified input: keyboard + touch joystick + on-screen buttons, with a focus stack for menus. */
export type Action = 'up' | 'down' | 'left' | 'right' | 'ok' | 'cancel' | 'menu';
/** A focus receives actions while it is on top of the stack. `canBack` = shows the unified Back button. */
export interface Focus { onAction(a: Action): void; canBack?: boolean }
const KEYMAP: Record<string, Action> = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Enter: 'ok', Space: 'ok', KeyZ: 'ok', KeyE: 'ok', Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel', KeyM: 'menu', Tab: 'menu', KeyC: 'menu',
};
class InputHub {
  held = new Set<Action>(); stack: Focus[] = []; joy = { x: 0, y: 0 }; listeners: ((a: Action) => void)[] = []; lastDir?: Action; repeatT = 0;
  /** What the hardware/OS back button does when no focus can go back (set by the active top-level scene). */
  backFallback?: () => void;
  constructor() {
    window.addEventListener('keydown', e => {
      const a = KEYMAP[e.code]; if (!a) return; e.preventDefault();
      if (!e.repeat) { this.held.add(a); if (a === 'cancel') this.back(); else this.fire(a); } else if (['up', 'down', 'left', 'right'].includes(a) && this.stack.length) this.fire(a);
    });
    window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) this.held.delete(a); });
    window.addEventListener('blur', () => this.held.clear());
  }
  get top(): Focus | undefined { return this.stack[this.stack.length - 1]; }
  fire(a: Action) {
    const top = this.top;
    if (top) top.onAction(a); else this.listeners.forEach(l => l(a));
  }
  /** True when the top focus accepts "back". */
  canBack() { const t = this.top; return !!t && !!t.canBack; }
  /** Unified Back: on-screen button, Esc key and Android back all route here. */
  back() { if (this.canBack()) { this.top!.onAction('cancel'); return true; } if (this.top) { this.top.onAction('cancel'); return true; } this.listeners.forEach(l => l('cancel')); return false; }
  hardwareBack() { if (this.canBack()) { this.top!.onAction('cancel'); return; } if (this.top) return; /* dialog / cutscene: ignore */ this.backFallback?.(); }
  push(f: Focus) { this.stack.push(f); }
  pop(f: Focus) { const i = this.stack.lastIndexOf(f); if (i >= 0) this.stack.splice(i, 1); }
  get busy() { return this.stack.length > 0; }
  on(l: (a: Action) => void) { this.listeners.push(l); return () => { this.listeners = this.listeners.filter(x => x !== l); }; }
  /** movement vector (-1..1) */
  dir() {
    let x = this.joy.x, y = this.joy.y;
    if (this.held.has('left')) x = -1; if (this.held.has('right')) x = 1; if (this.held.has('up')) y = -1; if (this.held.has('down')) y = 1;
    return { x, y };
  }
}
export const Input = new InputHub();
/** Root-screen behaviour for the OS back button: background the app (never kill it, never lose progress). */
export const minimizeApp = () => { App.minimizeApp().catch(() => {}); };
