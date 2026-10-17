/** Unified input: keyboard + touch joystick + on-screen buttons, with a focus stack for menus. */
export type Action = 'up' | 'down' | 'left' | 'right' | 'ok' | 'cancel' | 'menu';
export interface Focus { onAction(a: Action): void }
const KEYMAP: Record<string, Action> = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Enter: 'ok', Space: 'ok', KeyZ: 'ok', KeyE: 'ok', Escape: 'cancel', KeyX: 'cancel', Backspace: 'cancel', KeyM: 'menu', Tab: 'menu', KeyC: 'menu',
};
class InputHub {
  held = new Set<Action>(); stack: Focus[] = []; joy = { x: 0, y: 0 }; listeners: ((a: Action) => void)[] = []; lastDir?: Action; repeatT = 0;
  constructor() {
    window.addEventListener('keydown', e => {
      const a = KEYMAP[e.code]; if (!a) return; e.preventDefault();
      if (!e.repeat) { this.held.add(a); this.fire(a); } else if (['up', 'down', 'left', 'right'].includes(a) && this.stack.length) this.fire(a);
    });
    window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) this.held.delete(a); });
    window.addEventListener('blur', () => this.held.clear());
  }
  fire(a: Action) {
    const top = this.stack[this.stack.length - 1];
    if (top) top.onAction(a); else this.listeners.forEach(l => l(a));
  }
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
