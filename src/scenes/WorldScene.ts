import Phaser from 'phaser';
import { MAPS, LEGEND, MapDef, NpcDef } from '../data/maps';
import { T, T2, Pix } from '../systems/art';
import { W, H } from '../ui/widgets';
/** Scale4x + re-shaded copy of one prop tile ('props' sheet), cached as prop_hd_<idx>. */
function ensurePropHd(scene: Phaser.Scene, idx: number): string | null {
  const key = 'prop_hd_' + idx; if (scene.textures.exists(key)) return key;
  const src = scene.textures.get('props').getSourceImage() as HTMLCanvasElement; const d = src.getContext('2d')!.getImageData(idx * 16, 0, 16, 16).data;
  const p = new Pix(16, 16); let any = false;
  for (let i = 0; i < 256; i++) if (d[i * 4 + 3] > 200) { p.d[i] = (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]; any = true; }
  if (!any) return null; p.toHd4(scene, key); return key;
}
import { propTiles } from '../systems/props';
import { Game, stats } from '../systems/state';
import { ensureDollHd as ensureDoll, specOf, FH } from '../systems/paperdoll';
import { Audio } from '../systems/audio';
import { Input, Action } from '../ui/input';
import { ENCOUNTERS, ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { evalCond } from '../systems/cond';
import { ScriptRunner } from '../systems/script';
import type { UIScene } from './UIScene';
import { diorama } from '../fx/diorama';
import { paintGround, HD, STRUCT } from '../gfx/ground';
import { buildStructures, OH, ensureTallGrass } from '../gfx/structures';
import { DioramaFX } from '../fx/diorama';
import { WaterFX } from '../fx/water';

const TS = 16; const DX = [0, -1, 1, 0], DY = [1, 0, 0, -1]; // dir: 0 down 1 left 2 right 3 up
const OCT: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
/** 4-way sprite facing for any step vector (diagonals face sideways, like DQ). */
const dirOf = (dx: number, dy: number) => (dx < 0 ? 1 : dx > 0 ? 2 : dy < 0 ? 3 : 0);
export interface Actor { id: string; spr: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image; tx: number; ty: number; dir: number; moving: boolean; doll: boolean; def?: NpcDef; step: number; hidden?: boolean;
  /** in-flight step (driven per frame by stepActors for perfectly smooth, stall-free motion) */ mv?: { x0: number; y0: number; x1: number; y1: number; t: number; ms: number; res: () => void }; over?: number; phase?: number; bob?: number }
interface Symbol { spr: Phaser.GameObjects.Sprite; shadow: Phaser.GameObjects.Image; tx: number; ty: number; type: string; moving: boolean; next: number; alive: boolean }

export class WorldScene extends Phaser.Scene {
  def!: MapDef; grid!: string[]; hero!: Actor; followers: Actor[] = []; npcs: Actor[] = []; chests: { id: string; x: number; y: number; spr: Phaser.GameObjects.Sprite; item?: string; gold?: number }[] = [];
  symbols: Symbol[] = []; history: { x: number; y: number; dir: number }[] = []; busy = false; ui!: UIScene; script!: ScriptRunner;
  layer!: Phaser.Tilemaps.TilemapLayer; waterTiles: [number, number, number, number][] = []; dark?: Phaser.GameObjects.RenderTexture; lightImgs: { x: number; y: number; r: number; img?: Phaser.GameObjects.Image; flick: number }[] = [];
  eraser!: Phaser.GameObjects.Image; heroLight = 0; extraSolid = new Set<string>(); initData: any; offInput?: () => void; aura?: Phaser.GameObjects.Container; fxObjs: Record<string, Phaser.GameObjects.GameObject> = {};
  fx?: any; hdOn = false; hdg?: ReturnType<typeof paintGround>; water?: Phaser.GameObjects.Image; hdStruct = false; trees: Phaser.GameObjects.Image[] = []; nightWindows: [number, number][] = []; tall = new Map<string, Phaser.GameObjects.Image>();
  constructor() { super('World'); }
  init(d: any) { this.initData = d; }
  create() {
    const d = this.initData; this.def = MAPS[d.map]; this.grid = this.def.grid;
    this.nightK = 1; this.trees = []; this.nightWindows = []; this.tall = new Map(); this.followers = []; this.npcs = []; this.chests = []; this.symbols = []; this.history = []; this.lightImgs = []; this.extraSolid.clear(); this.waterTiles = []; this.busy = false; this.fxObjs = {};
    Game.s.map = d.map; Game.s.x = d.x; Game.s.y = d.y; Game.s.dir = d.dir ?? 0;
    if (!this.scene.isActive('Overlay')) this.scene.launch('Overlay');
    if (!this.scene.isActive('UI')) this.scene.launch('UI'); this.ui = this.scene.get('UI') as UIScene; this.scene.bringToTop('UI');
    if (!this.script) this.script = new ScriptRunner(this);
    this.buildTiles();
    this.buildEntities();
    this.buildLighting();
    this.buildAmbient();
    const cam = this.cameras.main; cam.setZoom(4); cam.setRoundPixels(false);
    const mw = this.grid[0].length * TS, mh = this.grid.length * TS;
    const vw = W / 4, vh = H / 4;
    cam.setBounds(mw < vw ? (mw - vw) / 2 : 0, mh < vh ? (mh - vh) / 2 : 0, Math.max(mw, vw), Math.max(mh, vh));
    cam.startFollow(this.hero.spr, false, 0.1, 0.1, 0, 36); cam.centerOn(this.hero.spr.x, this.hero.spr.y - 36);
    cam.setBackgroundColor(this.def.outdoor ? '#1b2a1a' : '#05040a');
    const preset = this.def.id === 'spire' ? 'sky' : this.def.outdoor ? (this.isNight() ? 'night' : 'outdoor') : (this.def.dark ?? 0) > 0.5 ? 'dungeon' : 'indoor';
    this.fx = diorama(cam, preset);
    if (d.wiped) { const ov: any = this.scene.get('Overlay'); this.time.delayedCall(60, () => ov?.reveal?.(380)); } else if (!d.noFade) cam.fadeIn(450);
    if (this.def.music && !d.script) Audio.play(this.def.music === 'village' && Game.flag('night') ? 'hearth' : this.def.music);
    this.offInput = Input.on(a => this.onAction(a));
    Input.backFallback = () => { if (this.scene.isActive() && this.canAutosave()) this.ui.openMenu(); };
    if (this.def.id !== 'spire') Game.markDirty('map:' + this.def.id);
    this.events.once('shutdown', () => { this.offInput?.(); });
    this.time.addEvent({ delay: 550, loop: true, callback: () => this.animWater() });
    this.time.addEvent({ delay: 2200, loop: true, callback: () => this.wanderNpcs() });
    this.time.delayedCall(40, () => this.ui.setLocation(this.def.name, !d.script && !d.noBanner));
    (window as any).__EMBER.world = this;
    if (d.script === '__continue') this.busy = true;
    else if (d.script) this.time.delayedCall(60, () => this.runScript(d.script));
    else this.time.delayedCall(500, () => this.checkTriggers());
  }
  // ------------------------------------------------------------------ build
  buildTiles() {
    this.hdOn = true;
    const h = this.grid.length, w = this.grid[0].length;
    const ground: number[][] = [], over: number[][] = [];
    for (let y = 0; y < h; y++) { ground.push([]); over.push(Array(w).fill(-1)); }
    const PT = propTiles(); const props: number[][] = []; let anyProp = false;
    for (let y = 0; y < h; y++) props.push(Array(w).fill(-1));
    const isProp = (ch?: string) => !!ch && !!LEGEND[ch] && PT[LEGEND[ch].t] !== undefined;
    const groundLike = (ch?: string) => !!ch && !!LEGEND[ch] && !isProp(ch) && (!LEGEND[ch].solid || !!LEGEND[ch].anim) && LEGEND[ch].over === undefined;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let ch = this.grid[y][x];
      const L0 = LEGEND[ch] || LEGEND['.'];
      if (PT[L0.t] !== undefined) {
        // prop: draw it on an overlay, and put the most common neighbouring ground underneath
        props[y][x] = L0.t; anyProp = true;
        const cnt: Record<string, number> = {};
        for (const [dx, dy, wt] of [[0, 1, 3], [0, -1, 2], [-1, 0, 2], [1, 0, 2], [-1, -1, 1], [1, -1, 1], [-1, 1, 1], [1, 1, 1]]) { const n = this.grid[y + dy]?.[x + dx]; if (groundLike(n)) cnt[n!] = (cnt[n!] || 0) + wt; }
        const best = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
        ch = best ? best[0] : PT[L0.t][1];
      }
      const L = LEGEND[ch] || LEGEND['.']; ground[y][x] = L.t;
      if (L.anim) this.waterTiles.push([x, y, L.t, L.anim]);
      if (L0.over !== undefined && y > 0 && !(this.hdOn && STRUCT.has(this.grid[y][x]))) over[y - 1][x] = L0.over;
    }
    // ---- round 3: HD painted ground (classic tiles stay only where the painter has no art yet)
    if (this.hdOn) {
      const propChars = new Set(Object.keys(LEGEND).filter(k => PT[LEGEND[k].t] !== undefined));
      const g = paintGround(this, this.def.id, this.grid, propChars, this.def.outdoor); this.hdg = g;
      this.add.image(0, 0, g.key).setOrigin(0).setScale(1 / HD).setDepth(-2);
      if (g.waterKey) {
        this.water = this.add.image(0, 0, g.waterKey).setOrigin(0).setScale(1 / HD).setDepth(-1);
        if (DioramaFX.quality > 0 && this.game.renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer) { this.water.setPostPipeline(WaterFX); const wf = this.water.getPostPipeline(WaterFX) as any; const n = this.isNight() || !this.def.outdoor; if (wf) { wf.night = n ? 1 : 0; wf.sky = n ? 0x203060 : 0xd8ecff; } }
      }
      this.hdStruct = true;
      const st = buildStructures(this, this.def.id, this.grid, this.isNight(), g.key, !!g.fresh);
      for (const hs of st.houses) {
        this.add.image(hs.x0 * TS - OH / HD, (hs.y1 + 1) * TS, hs.key).setOrigin(0, 1).setScale(1 / HD).setDepth(10 + (hs.y1 + 1) * TS - 1);
        if (hs.chimney) this.add.particles(hs.x0 * TS - OH / HD + hs.chimney[0] / HD, (hs.y1 + 1) * TS - this.textures.get(hs.key).source[0].height / HD + 1, 'light', { lifespan: 3600, speedY: { min: -9, max: -5 }, speedX: { min: 2, max: 6 }, scale: { start: 0.03, end: 0.16 }, alpha: { start: 0.35, end: 0 }, tint: this.isNight() ? 0x8890b0 : 0xe8e4f0, frequency: 260 }).setDepth(7100);
        if (this.isNight()) for (const [wx, wy] of hs.windows) { const X = hs.x0 * TS - OH / HD + wx / HD, Y = (hs.y1 + 1) * TS - this.textures.get(hs.key).source[0].height / HD + wy / HD; (this.def.lights = this.def.lights || []); this.nightWindows.push([X, Y]); }
      }
      for (const t of st.trees) {
        const im = this.add.image(t.x * TS + 8, t.y * TS + 17, 'hdtrees', t.kind + t.v).setOrigin(0.5, 1).setScale(1 / HD).setDepth(10 + t.y * TS + 16).setFlipX(((t.x * 7 + t.y * 3) % 5) < 2);
        this.trees.push(im); im.setData('ph', (t.x * 0.7 + t.y * 0.3));
      }
      ensureTallGrass(this);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = this.grid[y][x]; if (c !== '"' && c !== '&') continue;
        const im = this.add.image(x * TS + 8 + ((x * 5 + y * 3) % 3 - 1), y * TS + 16 + 1 + ((x * 11 + y * 7) % 5) - 2, 'hdtall', (c === '&' ? 'a' : 'g') + ((x * 7 + y * 13) % 4)).setOrigin(0.5, 1).setScale(1 / HD).setDepth(10 + y * TS + 16.5).setFlipX((x + y) % 2 === 0);
        this.tall.set(x + ',' + y, im); }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g.blank[y][x] && (!STRUCT.has(this.grid[y][x]) || this.hdStruct)) ground[y][x] = -1;
      this.waterTiles = this.waterTiles.filter(([x, y]) => ground[y][x] >= 0);
    }
    const m = this.make.tilemap({ data: ground, tileWidth: TS, tileHeight: TS });
    const ts = m.addTilesetImage('tiles', 'tiles', TS, TS, 0, 0)!;
    this.layer = m.createLayer(0, ts, 0, 0)!.setDepth(0);
    // edge decoration layers (path fringes, shorelines, sea foam, leaf litter)
    const grassy = new Set(['.', ',', '*', '"', 'T', 'P', 'b']); const autumn = new Set(['5', '6', '&', '@', 'A', '$', '8', '9']); const sandy = new Set(['1', '2', 'z']);
    const grassG = new Set(['.', ',', '*', '"']), autumnG = new Set(['5', '6', '&', '@']); // natural ground only (no props/trees)
    const rules: { me: (c: string) => boolean; nb: (c?: string) => boolean; tiles: number[] }[] = [
      { me: c => c === ':', nb: c => !!c && grassy.has(c), tiles: [T.edgeN, T.edgeS, T.edgeW, T.edgeE] },
      { me: c => c === '~', nb: c => !!c && grassy.has(c), tiles: [T.shoreN, T.shoreS, T.shoreW, T.shoreE] },
      { me: c => c === '4', nb: c => !!c && sandy.has(c), tiles: [T2.foamN, T2.foamS, T2.foamW, T2.foamE] },
      { me: c => c === '0', nb: c => !!c && sandy.has(c), tiles: [T2.foamN, T2.foamS, T2.foamW, T2.foamE] },
      { me: c => c === '7', nb: c => !!c && autumn.has(c), tiles: [T2.lfN, T2.lfS, T2.lfW, T2.lfE] },
      { me: c => c === 'Z', nb: c => !!c && grassG.has(c), tiles: [T.edgeN, T.edgeS, T.edgeW, T.edgeE] },
      { me: c => c === 'Z', nb: c => !!c && autumnG.has(c), tiles: [T2.lfN, T2.lfS, T2.lfW, T2.lfE] },
      { me: c => c === '1' || c === '2', nb: c => !!c && grassG.has(c), tiles: [T.edgeN, T.edgeS, T.edgeW, T.edgeE] },
    ];
    const sides: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    sides.forEach(([dx, dy], si) => {
      const data: number[][] = []; let any = false;
      for (let y = 0; y < h; y++) { data.push([]); for (let x = 0; x < w; x++) { const c = this.grid[y][x], n = this.grid[y + dy]?.[x + dx]; let v = -1; if (!(this.hdg?.blank[y][x])) for (const r of rules) if (r.me(c) && r.nb(n)) { v = r.tiles[si]; break; } if (v >= 0) any = true; data[y].push(v); } }
      if (!any) return;
      const me = this.make.tilemap({ data, tileWidth: TS, tileHeight: TS }); const tse = me.addTilesetImage('tiles', 'tiles', TS, TS, 0, 0)!; me.createLayer(0, tse, 0, 0)!.setDepth(0.5);
    });
    if (anyProp) {
      // HD props (round 3): each prop tile Scale4x + re-shaded, y-sorted with the characters, with a soft contact shadow
      const flat = new Set<number>([T2.net, T2.rocks, T2.log, T2.boat, T2.dockCrates].filter(v => v !== undefined));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = props[y][x]; if (t < 0) continue;
        const key = ensurePropHd(this, t);
        if (!key) continue;
        const im = this.add.image(x * TS - 0.5, y * TS - 0.5, key).setOrigin(0).setScale(0.25);
        im.setDepth(flat.has(t) ? 0.6 : 10 + y * TS + 14);
        if (!flat.has(t)) this.add.image(x * TS + 8, y * TS + 15, 'shadow').setScale(0.9, 0.9).setAlpha(0.55).setDepth(0.55);
      }
    }
    const m2 = this.make.tilemap({ data: over, tileWidth: TS, tileHeight: TS });
    const ts2 = m2.addTilesetImage('tiles', 'tiles', TS, TS, 0, 0)!;
    m2.createLayer(0, ts2, 0, 0)!.setDepth(5000);
  }
  animWater() { if (!this.waterTiles.length) return; const f = Math.floor(this.time.now / 550) % 2; for (const [x, y, a, b] of this.waterTiles) this.layer.putTileAt(f ? b : a, x, y); }
  makeActor(id: string, tex: string, x: number, y: number, dir: number, doll = true): Actor {
    const shadow = this.add.image(x * TS + 8, y * TS + 15, 'shadow').setDepth(1);
    const spr = this.add.sprite(x * TS + 8, y * TS + 16, tex, doll ? dir * 3 : undefined).setOrigin(0.5, 1);
    if (doll) spr.setScale(0.5);
    if (!doll) spr.setScale(tex === 'm_warden' || tex === 'm_cantor' ? 0.75 : tex.startsWith('npc_') ? 1 : spr.width > 32 ? 0.42 : 0.6);
    const a: Actor = { id, spr, shadow, tx: x, ty: y, dir, moving: false, doll, step: 0 };
    this.depthOf(a); return a;
  }
  depthOf(a: Actor) { const y = a.spr.y + (a.bob || 0); a.spr.setDepth(10 + y); a.shadow.setPosition(a.spr.x, y - 1); }
  buildEntities() {
    const d = this.initData;
    // hero + followers
    const party = Game.s.party;
    this.hero = this.makeActor('hero', ensureDoll(this, specOf(party[0])), d.x, d.y, d.dir ?? 0);
    for (let i = 1; i < party.length; i++) { const f = this.makeActor('f' + i, ensureDoll(this, specOf(party[i])), d.x, d.y, d.dir ?? 0); this.followers.push(f); }
    for (let i = 0; i < 8; i++) this.history.push({ x: d.x, y: d.y, dir: d.dir ?? 0 });
    // NPCs
    for (const n of this.def.npcs) {
      if (!evalCond(n.cond) || (n.notCond && evalCond(n.notCond))) continue;
      const tex = n.sprite || ensureDoll(this, { look: n.look!, equip: n.equip || {} });
      const a = this.makeActor(n.id, tex, n.x, n.y, n.dir ?? 0, !n.sprite); a.def = n;
      if (n.hidden && !Game.flag('show_' + n.id)) { a.hidden = true; a.spr.setVisible(false); a.shadow.setVisible(false); }
      if (n.sprite && !n.noGlow) { this.tweens.add({ targets: a.spr, scaleY: a.spr.scaleY * 1.04, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' }); const gl = this.add.image(a.spr.x, a.spr.y - 20, 'light').setTint(0xff5010).setBlendMode(Phaser.BlendModes.ADD).setScale(1.2).setAlpha(0.35).setDepth(a.spr.depth - 1); this.tweens.add({ targets: gl, alpha: 0.15, yoyo: true, repeat: -1, duration: 700 }); this.fxObjs['bossGlow'] = gl; }
      this.npcs.push(a);
    }
    // Inactive roster waiting in the Hearth
    const spots = this.def.id === 'hearth' ? [[6, 6], [10, 6], [9, 8], [3, 6], [11, 9], [5, 5]] : this.def.rosterSpots;
    if (spots?.length) Game.s.roster.forEach((m, i) => {
      const [x, y] = spots[i % spots.length];
      const a = this.makeActor('r' + i, ensureDoll(this, specOf(m)), x, y, i % 4); a.def = { id: 'r' + i, name: m.name, x, y, script: 'roster' } as any; this.npcs.push(a);
    });
    // chests
    for (const c of this.def.chests) {
      const open = Game.flag('chest_' + c.id);
      const spr = this.add.sprite(c.x * TS + 8, c.y * TS + 8, 'chest', open ? 1 : 0).setDepth(10 + c.y * TS + 16);
      this.chests.push({ ...c, spr }); this.extraSolid.add(c.x + ',' + c.y);
      if (!open) { const sp = this.add.particles(c.x * TS + 8, c.y * TS + 4, 'px', { lifespan: 900, speed: { min: 4, max: 12 }, scale: { start: 0.8, end: 0 }, tint: 0xffe8a0, frequency: 600, blendMode: 'ADD' }).setDepth(5001); (c as any).sp = sp; this.chests[this.chests.length - 1] = { ...this.chests[this.chests.length - 1], sp } as any; }
    }
    // save crystals
    for (const s of this.def.saves) {
      const onStatue = this.grid[s.y][s.x] === 'x';
      const cr = this.add.image(s.x * TS + 8, s.y * TS + (onStatue ? -2 : 6), 'crystal').setDepth(10 + s.y * TS + 17);
      this.tweens.add({ targets: cr, y: cr.y - 3, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.inOut' });
      this.add.particles(s.x * TS + 8, s.y * TS + 6, 'px', { lifespan: 1400, speedY: { min: -14, max: -6 }, speedX: { min: -4, max: 4 }, scale: { start: 1, end: 0 }, tint: [0x9ae6ff, 0xffffff], frequency: 160, blendMode: 'ADD' }).setDepth(5001);
      this.extraSolid.add(s.x + ',' + s.y);
      this.def.lights = this.def.lights || []; if (!this.def.lights.some(l => l.x === s.x && l.y === s.y)) this.def.lights.push({ x: s.x, y: s.y, c: 0x9ad0ff, r: 3 });
    }
    // spire heartstar
    if (this.def.id === 'spire') {
      const hs = this.add.image(7 * TS + 8, 2.4 * TS, 'star').setScale(1.3).setTint(0xfff0b0).setDepth(4000).setAlpha(0.85).setBlendMode(Phaser.BlendModes.ADD);
      const hg = this.add.image(7 * TS + 8, 2.4 * TS, 'light').setScale(0.75).setTint(0xffc860).setAlpha(0.55).setDepth(3999).setBlendMode(Phaser.BlendModes.ADD); // keep the Archon readable below it
      this.tweens.add({ targets: hs, angle: 360, duration: 8000, repeat: -1 }); this.tweens.add({ targets: [hs, hg], scale: '*=1.12', yoyo: true, repeat: -1, duration: 1200 });
      this.fxObjs.heart = hs; this.fxObjs.heartGlow = hg;
    }
    // map-specific set pieces
    if (this.def.id === 'saltmere') {
      const lh = this.add.image(36 * TS + 8, 5 * TS - 2, 'lighthouse').setOrigin(0.5, 1).setDepth(10 + 5 * TS);
      this.add.image(lh.x, lh.y - 1, 'shadow').setScale(1.6, 1.4).setDepth(1);
      if (Game.flag('relit')) {
        const core = this.add.image(lh.x, lh.y - 49, 'light').setScale(0.5).setTint(0xfff4c0).setBlendMode(Phaser.BlendModes.ADD).setDepth(9600);
        this.tweens.add({ targets: core, scale: 0.65, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
        const beam = this.add.image(lh.x, lh.y - 49, 'light').setOrigin(0, 0.5).setScale(5, 0.3).setTint(0xfff0b0).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(9601);
        this.tweens.add({ targets: beam, angle: 360, duration: 7000, repeat: -1 });
        (this.def.lights = this.def.lights || []);
      }
    }
    // roaming monsters
    if (this.def.encounters && !this.initData.noMonsters) this.spawnSymbols();
    this.updateFollowers(true);
  }
  spawnSymbols() {
    const enc = this.def.encounters!; const table = ENCOUNTERS[enc.table];
    const cand: [number, number][] = [];
    for (let y = 2; y < this.grid.length - 2; y++) for (let x = 2; x < this.grid[0].length - 2; x++) {
      const ch = this.grid[y][x]; if (LEGEND[ch]?.solid || ch === ':' || ch === 'v' || ch === '^') continue;
      if (Math.abs(x - this.hero.tx) + Math.abs(y - this.hero.ty) < 7) continue;
      if (enc.table === 'fields' && y < 5) continue; cand.push([x, y]);
    }
    const tall = cand.filter(([x, y]) => this.grid[y][x] === '"' || this.grid[y][x] === '&');
    let s = 77 + Game.s.steps; const r = () => ((s = (s * 16807 + 11) % 2147483647) / 2147483647);
    for (let i = 0; i < enc.count; i++) {
      const pool = tall.length && r() < 0.7 ? tall : cand; const [x, y] = pool[Math.floor(r() * pool.length)];
      const tot = table.reduce((a, e) => a + e.w, 0); let k = r() * tot; let g = table[0]; for (const e of table) { k -= e.w; if (k <= 0) { g = e; break; } }
      const type = g.group[0];
      const spr = this.add.sprite(x * TS + 8, y * TS + 15, ENEMIES[type].sprite).setOrigin(0.5, 1); const sc = spr.width > 32 ? 0.4 : 0.5; spr.setScale(sc);
      const shadow = this.add.image(x * TS + 8, y * TS + 14, 'shadow');
      this.tweens.add({ targets: spr, scaleY: sc * 0.88, scaleX: sc * 1.1, yoyo: true, repeat: -1, duration: 380 + r() * 200, ease: 'Sine.inOut' });
      const sym: Symbol = { spr, shadow, tx: x, ty: y, type, moving: false, next: this.time.now + 1000 + r() * 1500, alive: true };
      spr.setDepth(10 + spr.y); this.symbols.push(sym);
    }
  }
  buildLighting() {
    const mw = this.grid[0].length * TS, mh = this.grid.length * TS;
    this.dark = this.add.renderTexture(0, 0, mw, mh).setOrigin(0).setDepth(8000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.eraser = this.make.image({ key: 'light', add: false });
    const lights = [...(this.def.lights || [])];
    if (this.def.torches) {
      let k = 0;
      for (let y = 1; y < this.grid.length - 1; y++) for (let x = 0; x < this.grid[0].length; x++) {
        if (this.grid[y][x] !== 'M' || LEGEND[this.grid[y + 1][x]]?.solid) continue;
        if ((k++ % 4) !== 1) continue;
        const tx = x * TS + 8, ty = y * TS + 8;
        this.add.rectangle(tx, ty + 3, 2, 6, 0x5a3818).setDepth(2);
        this.add.particles(tx, ty - 1, 'px', { lifespan: 380, speedY: { min: -22, max: -10 }, speedX: { min: -3, max: 3 }, scale: { start: 1.3, end: 0 }, tint: [0xffe080, 0xff8030, 0xff4010], blendMode: 'ADD', frequency: 45 }).setDepth(8002);
        lights.push({ x, y, c: 0xff8a3a, r: 2.6 });
      }
    }
    // glowing coral lights itself (sea caves)
    { let k = 0; for (let y = 0; y < this.grid.length; y++) for (let x = 0; x < this.grid[0].length; x++) if (this.grid[y][x] === 'j' && (k++ % 2) === 0) lights.push({ x, y, c: k % 4 ? 0x50f0d0 : 0xff80c0, r: 2.2 }); }
    for (const [X, Y] of this.nightWindows) {
      const img = this.add.image(X, Y + 2, 'light').setTint(0xffb050).setBlendMode(Phaser.BlendModes.ADD).setDepth(8001).setScale(0.5).setAlpha(0.5);
      this.lightImgs.push({ x: X, y: Y + 6, r: 1.6, img, flick: Math.random() * 10 });
    }
    for (const l of lights) {
      const img = this.add.image(l.x * TS + 8, l.y * TS + 8, 'light').setTint(l.c).setBlendMode(Phaser.BlendModes.ADD).setDepth(8001).setScale(l.r * 0.28).setAlpha(0.5);
      this.lightImgs.push({ x: l.x * TS + 8, y: l.y * TS + 8, r: l.r, img, flick: Math.random() * 10 });
    }
  }
  nightK = 1;
  /** Story night: the global 'night' flag, or a per-map condition (e.g. Saltmere after the abduction). */
  isNight() { return !!Game.flag('night') || (!!this.def.night && evalCond(this.def.night)); }
  darkness(): { c: number; a: number } {
    if (!this.def.outdoor) return { c: 0x05030c, a: this.def.dark ?? 0 };
    if (this.isNight()) return { c: 0x06062a, a: 0.72 * this.nightK };
    // day-night cycle: 8 real minutes
    const t = ((Game.s.playTime + 60) % 480) / 480; // 0..1
    const n = (Math.cos(t * Math.PI * 2) * -0.5 + 0.5); // 0 day -> 1 night at t=.5
    const a = Phaser.Math.Clamp((n - 0.35) * 1.1, 0, 0.55);
    const c = n < 0.6 ? 0x40183a : 0x0a0a32;
    return { c, a };
  }
  drawLighting() {
    if (!this.dark) return; const { c, a } = this.darkness();
    this.dark.clear(); if (a <= 0.01) { this.dark.setVisible(false); this.lightImgs.forEach(l => l.img?.setAlpha(0)); return; }
    this.dark.setVisible(true);
    // colour light map, multiplied over the scene: ambient tint + additive coloured point lights (with flicker)
    const k = Math.min(0.86, a * 1.1), cr = (c >> 16) & 255, cg = (c >> 8) & 255, cb = c & 255;
    const amb = (Math.round(255 + (cr * 1.6 - 255) * k) << 16) | (Math.round(255 + (cg * 1.6 - 255) * k) << 8) | Math.round(255 + (Math.min(255, cb * 2.2) - 255) * k);
    this.dark.fill(amb, 1);
    const t = this.time.now / 1000; const e = this.eraser;
    e.setBlendMode(Phaser.BlendModes.ADD);
    for (const l of this.lightImgs) {
      const f = 1 + Math.sin(t * 7 + l.flick) * 0.05 + Math.sin(t * 13.3 + l.flick) * 0.04 + (Math.sin(t * 31 + l.flick * 3) > 0.92 ? -0.06 : 0);
      e.setScale(l.r * 0.27 * f).setTint(l.img ? l.img.tintTopLeft : 0xffe0b0).setAlpha(Math.min(1, 0.45 + a * 0.6));
      this.dark.draw(e, l.x, l.y);
      e.setScale(l.r * 0.12 * f).setTint(0xfff0d0).setAlpha(0.45); this.dark.draw(e, l.x, l.y);
      l.img?.setAlpha(Math.min(0.4, a * 0.6) * f).setScale(l.r * 0.28 * f);
    }
    const hr = this.def.outdoor ? 2.2 : (this.def.dark ?? 0) > 0.5 ? 4.6 : 1.8;
    e.setScale(hr * 0.33).setTint(this.def.outdoor ? 0x8090c0 : 0xc8b090).setAlpha(0.9); this.dark.draw(e, this.hero.spr.x, this.hero.spr.y - 10);
  }
  buildAmbient() {
    const mw = this.grid[0].length * TS, mh = this.grid.length * TS; const amb = this.def.ambient;
    if (amb === 'petals') this.add.particles(0, 0, 'px', { x: { min: 0, max: mw }, y: -4, lifespan: 9000, speedY: { min: 8, max: 16 }, speedX: { min: 4, max: 14 }, scale: { start: 1, end: 0.6 }, tint: [0xffb0c8, 0xffffff, 0xffd8e0], frequency: 260, rotate: { min: 0, max: 360 } }).setDepth(7000);
    if (amb === 'fireflies') this.add.particles(0, 0, 'px', { x: { min: 0, max: mw }, y: { min: 0, max: mh }, lifespan: 4000, speed: { min: 2, max: 8 }, scale: { start: 0.9, end: 0 }, alpha: { start: 0, end: 1, ease: 'Sine.inOut' }, tint: [0xd8ff80, 0xffe080], frequency: 140, blendMode: 'ADD' }).setDepth(8100);
    if (amb === 'embers') this.add.particles(0, 0, 'px', { x: { min: 0, max: mw }, y: { min: 0, max: mh }, lifespan: 3000, speedY: { min: -14, max: -4 }, speedX: { min: -3, max: 3 }, scale: { start: 1, end: 0 }, tint: [0xff8040, 0xffc060, 0xff4020], frequency: 70, blendMode: 'ADD' }).setDepth(8100);
    if (amb === 'stars') this.add.particles(0, 0, 'px', { x: { min: -40, max: mw + 40 }, y: { min: -40, max: mh + 40 }, lifespan: 2500, scale: { start: 0, end: 1.2, ease: 'Sine.inOut' }, alpha: { start: 1, end: 0 }, tint: [0xffffff, 0xb0c0ff, 0xffe8a0], frequency: 40, blendMode: 'ADD' }).setDepth(-1);
    if (amb === 'leaves') {
      this.add.particles(0, 0, 'px', { x: { min: -20, max: mw }, y: { min: -10, max: mh }, lifespan: 7000, speedX: { min: 6, max: 18 }, speedY: { min: 5, max: 12 }, scale: { start: 1.4, end: 0.8 }, rotate: { min: 0, max: 360 }, alpha: { start: 0, end: 1, ease: (t: number) => Math.sin(t * Math.PI) }, tint: [0xe06a2a, 0xf0a030, 0xc8402a, 0xffd060], frequency: 180 }).setDepth(5002);
      this.add.particles(0, 0, 'px', { x: { min: 0, max: mw }, y: { min: 0, max: mh }, lifespan: 3000, speed: { min: 1, max: 4 }, scale: { start: 0.7, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: [0xfff0b0], blendMode: 'ADD', frequency: 260 }).setDepth(5002);
    }
    if (amb === 'gulls') {
      this.add.particles(0, 0, 'px', { x: { min: 0, max: mw }, y: { min: mh * 0.7, max: mh }, lifespan: 1600, speedX: { min: -4, max: 4 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.8, end: 0 }, tint: [0xffffff, 0xd0f0ff], blendMode: 'ADD', frequency: 120 }).setDepth(5002);
      const gull = () => { const y = 10 + Math.random() * mh * 0.6, dir = Math.random() < 0.5 ? 1 : -1; const g = this.add.text(dir > 0 ? -10 : mw + 10, y, 'v', { fontSize: '7px', color: '#f8f8ff', fontFamily: 'monospace' }).setDepth(5003).setAlpha(0.9); this.tweens.add({ targets: g, x: dir > 0 ? mw + 10 : -10, y: y + (Math.random() - 0.5) * 40, duration: 9000 + Math.random() * 6000, onComplete: () => g.destroy() }); this.tweens.add({ targets: g, scaleY: 0.4, yoyo: true, repeat: -1, duration: 260 }); };
      this.time.addEvent({ delay: 2600, loop: true, callback: gull }); gull();
    }
    if (amb === 'bubbles') {
      this.add.particles(0, 0, 'px', { x: { min: 0, max: mw }, y: { min: 0, max: mh }, lifespan: 3200, speedY: { min: -12, max: -4 }, speedX: { min: -2, max: 2 }, scale: { start: 0.5, end: 1.1 }, alpha: { start: 0.7, end: 0 }, tint: [0xa0f0ff, 0x60f0d0], blendMode: 'ADD', frequency: 90 }).setDepth(8003);
      this.add.particles(0, 0, 'light', { x: { min: 0, max: mw }, y: { min: 0, max: mh }, lifespan: 5000, scale: { start: 0.05, end: 0.25 }, alpha: { start: 0.0, end: 0.25, ease: (t: number) => Math.sin(t * Math.PI) }, tint: [0x40e0d0, 0x60a0ff], blendMode: 'ADD', frequency: 400 }).setDepth(8003);
    }
    // ---- HD-2D atmosphere: drifting cloud shadows, sun shafts and water glints
    const water: [number, number][] = [];
    for (let y = 0; y < this.grid.length; y++) for (let x = 0; x < this.grid[0].length; x++) if (LEGEND[this.grid[y][x]]?.anim) water.push([x, y]);
    if (this.def.outdoor && !this.isNight() && this.def.id !== 'spire') {
      for (let i = 0; i < Math.ceil(mw * mh / 60000); i++) {
        const c = this.add.image(Math.random() * mw, Math.random() * mh, 'light').setTint(0x10182a).setAlpha(0.13).setScale(1.3 + Math.random() * 0.8, 0.9 + Math.random() * 0.5).setDepth(4990);
        const drift = () => { const sp = 6 + Math.random() * 4; this.tweens.add({ targets: c, x: mw + 220, duration: ((mw + 220 - c.x) / sp) * 1000, onComplete: () => { c.x = -220; c.y = Math.random() * mh; drift(); } }); };
        drift();
      }
      for (let i = 0; i < 3; i++) {
        const r = this.add.image(0, 0, 'light').setTint(0xfff0c0).setBlendMode(Phaser.BlendModes.ADD).setScale(0.16, 1.7).setRotation(-0.45).setAlpha(0).setScrollFactor(0).setDepth(8090);
        r.setPosition(300 + i * 55, 540 + i * 12); // screen-space (camera zoom 4 around the centre)
        this.tweens.add({ targets: r, alpha: 0.07 + i * 0.015, yoyo: true, repeat: -1, duration: 4200 + i * 1300, delay: i * 900, ease: 'Sine.inOut' });
      }
    }
    if (water.length) {
      const glintC = this.isNight() ? [0x9ab0ff] : [0xffffff, 0xfff0c0, 0xc0f0ff];
      this.time.addEvent({ delay: Math.max(40, 2400 / Math.min(60, water.length)), loop: true, callback: () => {
        const [x, y] = water[Math.floor(Math.random() * water.length)]; const cam = this.cameras.main.worldView;
        const px = x * TS + 2 + Math.random() * 12, py = y * TS + 2 + Math.random() * 12; if (!cam.contains(px, py)) return;
        const g = this.add.image(px, py, 'px').setTint(glintC[Math.floor(Math.random() * glintC.length)]).setBlendMode(Phaser.BlendModes.ADD).setScale(2, 1).setAlpha(0).setDepth(2);
        this.tweens.add({ targets: g, alpha: 0.9, scaleX: 3, yoyo: true, duration: 380, onComplete: () => g.destroy() });
      } });
    }
  }
  // ------------------------------------------------------------------ movement
  solidAt(x: number, y: number, ignoreActor?: Actor) {
    if (y < 0 || x < 0 || y >= this.grid.length || x >= this.grid[0].length) return !this.warpAt(x, y);
    if (LEGEND[this.grid[y][x]]?.solid) return true;
    if (this.extraSolid.has(x + ',' + y)) return true;
    for (const n of this.npcs) if (n !== ignoreActor && !n.hidden && n.tx === x && n.ty === y) return true;
    if (this.def.id === 'lair' && Game.flag('lairDone') === undefined) { /* boss is npc */ }
    return false;
  }
  warpAt(x: number, y: number) { return this.def.warps.find(w => w.x === x && w.y === y); }
  /** Safe moment to write a save: exploring freely, nothing pending. */
  canAutosave() {
    return !!this.hero && !this.busy && !Input.busy && !this.ui?.modal && !this.hero.moving && !this.script?.running && !this.scene.isPaused() && !this.scene.manager.isActive('Battle') && this.def.id !== 'spire' && !!Game.s;
  }
  autosave(force = false) {
    if (!this.canAutosave()) return false;
    const ok = Game.save('auto:' + (Game.dirty || 'tick')); Game.dirty = ''; Game.lastAuto = this.time.now;
    const ov: any = this.scene.get('Overlay'); if (force || !ok) ov?.flashSaved?.(ok); else ov?.flashSaved?.(true);
    return ok;
  }
  update(time: number, dt: number) {
    if (DioramaFX.quality > 0 && this.def.outdoor) { const wv = time * 0.0011; for (const tr of this.trees) tr.angle = Math.sin(wv + tr.getData('ph')) * 0.9 + Math.sin(wv * 2.3 + tr.getData('ph') * 1.7) * 0.3; }
    if (Game.dirty && time - Game.lastAuto > 900 && this.canAutosave()) this.autosave();
    else if (!Game.dirty && time - Game.lastAuto > 60000 && this.canAutosave()) { Game.markDirty('periodic'); }
    this.drawLighting();
    if (this.aura) this.aura.setPosition(this.hero.spr.x, this.hero.spr.y);
    this.updateSymbols(time);
    this.handleMoveInput();
    this.stepActors(dt);
    if (this.fx) { const cam = this.cameras.main; const sy = (this.hero.spr.y - 12 - cam.worldView.y) / cam.worldView.height; this.fx.p.focus += ((1 - sy) - this.fx.p.focus) * Math.min(1, dt / 250); }
  }
  handleMoveInput() {
    if (this.busy || Input.busy || this.hero.moving || this.ui.modal) return;
    const d = Input.dir();
    if (Math.hypot(d.x, d.y) < 0.3) { if (this.hero.step) { this.hero.step = 0; this.hero.phase = 0; this.setFrame(this.hero); } this.hero.over = 0; return; }
    // 8-directional: snap the stick to the nearest of 8 octants
    const oct = (Math.round(Math.atan2(d.y, d.x) / (Math.PI / 4)) + 8) % 8;
    const [vx, vy] = OCT[oct];
    this.tryStep(vx, vy);
  }
  /** Advance every walking actor by dt. Frames follow the stride (L, stand, R, stand per two tiles) with a soft bob. */
  stepActors(dt: number) {
    const all = [this.hero, ...this.followers, ...this.npcs];
    for (const a of all) {
      const m = a.mv; if (!m) continue;
      m.t += dt / m.ms;
      const k = Math.min(1, m.t);
      a.spr.x = m.x0 + (m.x1 - m.x0) * k; const by = m.y0 + (m.y1 - m.y0) * k;
      if (a.doll) {
        const ph = ((a.phase || 0) + Math.min(dt / m.ms, 1)) % 2; a.phase = ph;
        const q = Math.floor(ph * 2) % 4; const f = [1, 0, 2, 0][q];
        a.spr.setFrame(a.dir * 3 + f);
        a.bob = k >= 1 ? 0 : Math.abs(Math.sin(ph * Math.PI)) * 0.75; a.spr.y = by - a.bob;
      } else a.spr.y = by;
      this.depthOf(a);
      if (m.t >= 1) { a.bob = 0; a.spr.setPosition(m.x1, m.y1); this.depthOf(a); a.over = Math.min((m.t - 1) * m.ms, 34); a.mv = undefined; a.moving = false; m.res(); }
    }
  }
  setFrame(a: Actor) { if (a.doll) a.spr.setFrame(a.dir * 3 + (a.step ? (a.step % 2 ? 1 : 2) : 0)); }
  /** Step the hero by (dx,dy) — orthogonal or diagonal. Diagonals never cut corners; blocked diagonals slide along walls. */
  async tryStep(dx: number, dy = 0) {
    const h = this.hero;
    const free = (x: number, y: number) => !this.solidAt(x, y) && !this.warpAt(x, y);
    if (dx && dy && !(free(h.tx + dx, h.ty + dy) && free(h.tx + dx, h.ty) && free(h.tx, h.ty + dy))) {
      const hx = !this.solidAt(h.tx + dx, h.ty) || !!this.warpAt(h.tx + dx, h.ty), vy = !this.solidAt(h.tx, h.ty + dy) || !!this.warpAt(h.tx, h.ty + dy);
      const horizFirst = Math.abs(Input.dir().x) >= Math.abs(Input.dir().y);
      if (horizFirst ? hx : !vy && hx) dy = 0; else if (vy) dx = 0; else { h.dir = dirOf(dx, dy); this.setFrame(h); return; }
    }
    const dir = dirOf(dx, dy); h.dir = dir; this.setFrame(h);
    const nx = h.tx + dx, ny = h.ty + dy;
    const w = this.warpAt(nx, ny);
    if (this.solidAt(nx, ny)) { if (!w) return; }
    if (w && w.cond && !evalCond(w.cond)) { if (w.blockScript) { this.runScript(w.blockScript); } return; }
    this.history.unshift({ x: h.tx, y: h.ty, dir }); this.history.length = 8;
    const p = this.walkTo(h, nx, ny, dx && dy ? 205 : 150);
    this.updateFollowers(false);
    await p; Game.s.steps++; Game.s.x = h.tx; Game.s.y = h.ty; Game.s.dir = h.dir;
    const ch = this.grid[h.ty]?.[h.tx];
    { const tg = this.tall.get(h.tx + ',' + h.ty); if (tg) this.tweens.add({ targets: tg, scaleY: (1 / HD) * 0.72, scaleX: (1 / HD) * 1.08, yoyo: true, duration: 140, ease: 'Sine.out' }); }
    if (ch === '"') this.add.particles(h.spr.x, h.spr.y - 3, 'px', { lifespan: 400, speed: { min: 10, max: 30 }, angle: { min: 200, max: 340 }, gravityY: 60, tint: [0x7fd068, 0x4f9a46], quantity: 4, emitting: false }).setDepth(9000).explode(4);
    if (ch === ':' && Game.s.steps % 2) this.add.particles(h.spr.x, h.spr.y - 1, 'px', { lifespan: 300, speed: { min: 4, max: 10 }, angle: { min: 180, max: 360 }, tint: 0xd8c090, alpha: { start: 0.6, end: 0 }, emitting: false }).setDepth(9).explode(2);
    if (Game.s.party.some(m => m.poisoned) && Game.s.steps % 4 === 0) { for (const m of Game.s.party) if (m.poisoned && m.hp > 1) m.hp -= 1; this.cameras.main.flash(80, 120, 0, 160); Audio.sfx('poison'); }
    const wp = this.warpAt(h.tx, h.ty) || (h.ty < 0 || h.tx < 0 || h.ty >= this.grid.length ? w : undefined);
    if (wp) { this.doWarp(wp.to, wp.tx, wp.ty, wp.dir ?? h.dir); return; }
    this.checkTriggers(); this.checkSymbolContact(false);
  }
  walk(a: Actor, dir: number, ms: number): Promise<void> { a.dir = dir; return this.walkTo(a, a.tx + DX[dir], a.ty + DY[dir], ms, dir); }
  walkTo(a: Actor, nx: number, ny: number, ms: number, dir = dirOf(nx - a.tx, ny - a.ty)): Promise<void> {
    a.dir = dir; a.moving = true; a.tx = nx; a.ty = ny;
    a.step = (a.step % 4) + 1; if (!a.doll) this.setFrame(a);
    if (a === this.hero && Game.s.steps % 2 === 0) Audio.sfx('step');
    // carry the overshoot of the previous step so chained steps never stall for a frame
    const carry = a.over || 0; a.over = 0;
    return new Promise(res => { a.mv = { x0: a.spr.x, y0: a.spr.y + (a.bob || 0), x1: nx * TS + 8, y1: ny * TS + 16, t: carry / ms, ms, res }; });
  }
  updateFollowers(instant: boolean) {
    this.followers.forEach((f, i) => {
      const p = this.history[i]; if (!p) return;
      if (instant || (p.x === f.tx && p.y === f.ty)) { f.tx = p.x; f.ty = p.y; f.spr.setPosition(p.x * TS + 8, p.y * TS + 16); f.dir = this.hero.dir; this.setFrame(f); this.depthOf(f); return; }
      const dx = p.x - f.tx, dy = p.y - f.ty;
      this.walkTo(f, p.x, p.y, dx && dy ? 205 : 150);
    });
  }
  async doWarp(to: string, x: number, y: number, dir: number) {
    this.busy = true; Audio.sfx('door');
    const ov: any = this.scene.get('Overlay');
    if (ov?.cover && ov.sys.isActive()) { await Promise.race([ov.cover(300), this.wait(450)]); this.scene.restart({ map: to, x, y, dir, wiped: true }); return; }
    this.cameras.main.fadeOut(260, 0, 0, 0); await this.wait(280); this.scene.restart({ map: to, x, y, dir });
  }
  wait(ms: number) { return new Promise<void>(r => this.time.delayedCall(ms, r)); }
  wanderNpcs() {
    if (this.busy || Input.busy) return;
    for (const n of this.npcs) {
      if (!n.def?.wander || n.moving || n.hidden || Math.random() < 0.4) continue;
      const dir = Math.floor(Math.random() * 4), nx = n.tx + DX[dir], ny = n.ty + DY[dir];
      if (Math.abs(nx - n.def.x) > 3 || Math.abs(ny - n.def.y) > 3) continue;
      if (this.solidAt(nx, ny, n) || (nx === this.hero.tx && ny === this.hero.ty) || this.warpAt(nx, ny) || this.followers.some(f => f.tx === nx && f.ty === ny)) continue;
      this.walk(n, dir, 300);
    }
  }
  updateSymbols(time: number) {
    if (this.busy || this.ui.modal || Input.busy) return;
    for (const s of this.symbols) {
      if (!s.alive || s.moving || time < s.next) continue;
      const dx = this.hero.tx - s.tx, dy = this.hero.ty - s.ty; const dist = Math.abs(dx) + Math.abs(dy);
      let dir: number; const chase = dist <= 4;
      if (chase) dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 1 : 2) : dy < 0 ? 3 : 0; else dir = Math.floor(Math.random() * 4);
      s.next = time + (chase ? 420 : 900 + Math.random() * 1400);
      const nx = s.tx + DX[dir], ny = s.ty + DY[dir];
      const ch = this.grid[ny]?.[nx];
      if (!ch || LEGEND[ch]?.solid || this.extraSolid.has(nx + ',' + ny) || this.warpAt(nx, ny) || ch === 'v' || ch === '^' || (this.def.id === 'fields' && ny < 5)) continue;
      if (this.symbols.some(o => o !== s && o.alive && o.tx === nx && o.ty === ny)) continue;
      s.moving = true; s.tx = nx; s.ty = ny; s.spr.setFlipX(dir === 2);
      this.tweens.add({ targets: [s.spr], x: nx * TS + 8, y: ny * TS + 15, duration: chase ? 260 : 400, onUpdate: () => { s.spr.setDepth(10 + s.spr.y); s.shadow.setPosition(s.spr.x, s.spr.y - 1); }, onComplete: () => { s.moving = false; this.checkSymbolContact(true); } });
    }
  }
  checkSymbolContact(byMonster: boolean) {
    if (this.busy) return;
    const s = this.symbols.find(s => s.alive && s.tx === this.hero.tx && s.ty === this.hero.ty);
    if (!s) return;
    const table = ENCOUNTERS[this.def.encounters!.table].filter(e => e.group[0] === s.type);
    const g = table[Math.floor(Math.random() * table.length)] || { group: [s.type] };
    this.startBattle(g.group, { bg: this.def.bg, first: byMonster ? 'enemy' : 'party' }).then(r => { if (r === 'win' || r === 'flee') { s.alive = false; this.tweens.add({ targets: [s.spr, s.shadow], alpha: 0, duration: 300, onComplete: () => { s.spr.destroy(); s.shadow.destroy(); } }); } });
  }
  async startBattle(group: string[], o: { bg?: string; music?: string; boss?: boolean; noFlee?: boolean; first?: 'party' | 'enemy' } = {}): Promise<string> {
    this.busy = true; Audio.stopMusic(); Audio.sfx('encounter');
    if (!Game.flag('tut_battle')) { /* shown inside battle */ }
    // shatter-style transition
    const cam = this.cameras.main; const ov: any = this.scene.get('Overlay');
    // quick push-in + flash on the world, then freeze-frame and shatter into the battle
    this.tweens.add({ targets: cam, zoom: 4.6, duration: 260, ease: 'Cubic.in' }); cam.flash(140, 255, 240, 220);
    await this.wait(270);
    if (ov?.shatter && ov.sys.isActive()) await ov.shatter(); else { cam.fadeOut(300, 0, 0, 0); await this.wait(320); }
    return new Promise(res => {
      this.scene.pause(); this.ui.scene.setVisible(false);
      this.scene.launch('Battle', { group, bg: o.bg || this.def.bg || 'bg_fields', music: o.music, boss: o.boss, noFlee: o.noFlee, first: o.first, onEnd: async (r: string) => {
        this.scene.resume(); this.tweens.killTweensOf(cam); this.ui.scene.setVisible(true); cam.setZoom(4); cam.setRotation(0); cam.resetFX(); cam.fadeIn(350);
        if (r === 'lose') { await this.defeat(); res(r); return; }
        Audio.play(Game.flag('night') && this.def.id === 'village' ? 'hearth' : this.def.music); this.ui.refreshHud(); Game.markDirty('battle');
        await this.wait(300); this.busy = this.script.running; res(r);
      } });
    });
  }
  async defeat() {
    this.busy = true;
    await this.ui.narr('Your party has been wiped out…');
    const lost = Math.floor(Game.s.gold / 2); Game.s.gold -= lost; Game.healAll();
    await this.ui.narr(`A gentle light carries you back to the last Star-Shrine.\nYou lost ${lost} gold.`);
    const sp = Game.s.savePoint; this.scene.restart({ map: sp.map, x: sp.x, y: sp.y + 1, dir: 0 });
  }
  checkTriggers() {
    const h = this.hero;
    for (const t of this.def.triggers) {
      if (h.tx < t.x || h.ty < t.y || h.tx >= t.x + (t.w || 1) || h.ty >= t.y + (t.h || 1)) continue;
      if (t.once && Game.flag('trig_' + t.once)) continue; if (!evalCond(t.cond)) continue;
      if (t.once) Game.set('trig_' + t.once); this.runScript(t.script); return;
    }
  }
  // ------------------------------------------------------------------ interaction
  onAction(a: Action) {
    if (this.busy || this.ui.modal || this.hero.moving) return;
    if (a === 'menu') { this.ui.openMenu(); return; }
    if (a !== 'ok') return;
    this.interact();
  }
  facing() { return { x: this.hero.tx + DX[this.hero.dir], y: this.hero.ty + DY[this.hero.dir] }; }
  async interact() {
    const f = this.facing(); const h = this.hero;
    let npc = this.npcs.find(n => !n.hidden && n.tx === f.x && n.ty === f.y);
    const tile = this.grid[f.y]?.[f.x];
    if (!npc && tile === 'k') { const bx = f.x + DX[h.dir], by = f.y + DY[h.dir]; npc = this.npcs.find(n => n.tx === bx && n.ty === by); }
    if (npc) {
      if (npc.def?.script === 'roster') { this.ui.say(`${npc.def.name}: Ready when you are! Talk to Dahlia to change the party.`); return; }
      if (npc.doll && !npc.def?.counter) { npc.dir = 3 - h.dir; this.setFrame(npc); }
      this.runScript(npc.def!.script); return;
    }
    const chest = this.chests.find(c => c.x === f.x && c.y === f.y);
    if (chest) { this.openChest(chest); return; }
    if (this.def.saves.some(s => s.x === f.x && s.y === f.y)) { this.busy = true; await this.ui.saveShrine(); this.busy = false; return; }
    const sign = this.def.signs?.find(s => s.x === f.x && s.y === f.y);
    if (sign) { this.busy = true; await this.ui.narr(sign.text); this.busy = false; return; }
    if (tile === 'W') { this.busy = true; await this.ui.narr('You peer into the well. Your reflection stares back — no halo, no light. Just you.'); this.busy = false; return; }
    if (tile === 'K') { this.busy = true; await this.ui.narr(['Dusty books. "A Field Guide to Slimes, Vol. III."', '"The Song of the Twelve Wardens" — the last pages are torn out.', 'A cookbook. Page 12: Turnip Stew. Heavily annotated.'][(f.x + f.y) % 3]); this.busy = false; return; }
    if (tile === 'O' || tile === 'X') { this.busy = true; const k = 'pot_' + this.def.id + f.x + '_' + f.y; if (!Game.flag(k) && (f.x + f.y) % 2 === 0) { Game.set(k); Game.addItem('herb'); Audio.sfx('chest'); await this.ui.narr('You rummage around… and find a Medicinal Herb!'); } else await this.ui.narr('Nothing but dust and old turnips.'); this.busy = false; return; }
  }
  async openChest(c: any) {
    if (Game.flag('chest_' + c.id)) { this.busy = true; await this.ui.narr('The chest is empty.'); this.busy = false; return; }
    this.busy = true; Game.set('chest_' + c.id); c.spr.setFrame(1); c.sp?.destroy(); Audio.sfx('chest');
    this.add.particles(c.spr.x, c.spr.y - 4, 'spark', { lifespan: 700, speed: { min: 20, max: 60 }, scale: { start: 0.5, end: 0 }, tint: [0xffe8a0, 0xffffff], blendMode: 'ADD', emitting: false }).setDepth(9000).explode(14);
    let msg = '';
    if (c.item) { Game.addItem(c.item); msg = `You found ${/^[AEIOU]/.test(ITEMS[c.item].name) ? 'an' : 'a'} ${ITEMS[c.item].name}!`; }
    if (c.gold) { Game.s.gold += c.gold; msg = `You found ${c.gold} gold!`; }
    await this.ui.narr(msg);
    if (!Game.flag('tut_chest')) { Game.set('tut_chest'); await this.ui.tutorial('chest'); }
    if (c.item && ITEMS[c.item].kind === 'equip' && !Game.flag('tut_equip')) { Game.set('tut_equip'); await this.ui.tutorial('equip'); }
    this.ui.refreshHud(); this.busy = false; Game.markDirty('chest');
  }
  async runScript(name: string) {
    { const e = (window as any).__EMBER; (e.scriptLog = e.scriptLog || []).push(name); if (e.scriptLog.length > 50) e.scriptLog.shift(); }
    this.busy = true; await this.script.run(name); this.busy = false; this.refreshNpcs(); Game.markDirty('script:' + name);
  }
  refreshNpcs() {
    // spawn/despawn NPCs whose conditions changed
    for (const n of this.def.npcs) {
      const want = evalCond(n.cond) && !(n.notCond && evalCond(n.notCond));
      const have = this.npcs.find(a => a.id === n.id);
      if (want && !have) { const tex = n.sprite || ensureDoll(this, { look: n.look!, equip: n.equip || {} }); const a = this.makeActor(n.id, tex, n.x, n.y, n.dir ?? 0, !n.sprite); a.def = n; if (n.hidden && !Game.flag('show_' + n.id)) { a.hidden = true; a.spr.setVisible(false); a.shadow.setVisible(false); } this.npcs.push(a); }
      if (!want && have) { have.spr.destroy(); have.shadow.destroy(); this.npcs = this.npcs.filter(a => a !== have); if (n.sprite) (this.fxObjs.bossGlow as any)?.destroy(); }
    }
  }
  /** Rebuild hero/follower sprites after equipment or party changes. */
  refreshParty() {
    const p = Game.s.party; this.hero.spr.setTexture(ensureDoll(this, specOf(p[0]))); this.setFrame(this.hero);
    this.followers.forEach(f => { f.spr.destroy(); f.shadow.destroy(); }); this.followers = [];
    for (let i = 1; i < p.length; i++) { const hp = this.history[i - 1]; const f = this.makeActor('f' + i, ensureDoll(this, specOf(p[i])), hp.x, hp.y, this.hero.dir); this.followers.push(f); }
    this.updateFollowers(true);
    if (this.def.id === 'hearth') { // rebuild roster idlers
      this.npcs.filter(n => n.def?.script === 'roster').forEach(n => { n.spr.destroy(); n.shadow.destroy(); });
      this.npcs = this.npcs.filter(n => n.def?.script !== 'roster');
      Game.s.roster.forEach((m, i) => { const spots = [[6, 6], [10, 6], [9, 8], [3, 6], [11, 9], [5, 5]]; const [x, y] = spots[i % spots.length]; const a = this.makeActor('r' + i, ensureDoll(this, specOf(m)), x, y, i % 4); a.def = { id: 'r' + i, name: m.name, x, y, script: 'roster' } as any; this.npcs.push(a); });
    }
  }
  actor(id: string) { return id === 'hero' ? this.hero : this.npcs.find(n => n.id === id); }
  /** Pathfinding helper used by tests and scripted moves (BFS over walkable tiles). */
  findPath(tx: number, ty: number, adjacent = false): number[] | null {
    const W = this.grid[0].length, H = this.grid.length; const start = this.hero.tx + ',' + this.hero.ty;
    const prev = new Map<string, [string, number]>(); const q = [[this.hero.tx, this.hero.ty]]; prev.set(start, ['', -1]);
    while (q.length) {
      const [x, y] = q.shift()!;
      if ((adjacent && Math.abs(x - tx) + Math.abs(y - ty) === 1) || (!adjacent && x === tx && y === ty)) {
        const path: number[] = []; let k = x + ',' + y; while (k !== start) { const [p, d] = prev.get(k)!; path.unshift(d); k = p; } return path;
      }
      for (let d = 0; d < 4; d++) { const nx = x + DX[d], ny = y + DY[d], k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k)) continue; if (this.solidAt(nx, ny) && !(nx === tx && ny === ty && this.warpAt(nx, ny))) continue; if (this.warpAt(nx, ny) && !(nx === tx && ny === ty)) continue; prev.set(k, [x + ',' + y, d]); q.push([nx, ny]); }
    }
    return null;
  }
}
export { TS, DX, DY, FH };
