import { chromium } from 'playwright';
const [,, out, ...steps] = process.argv;
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto('http://localhost:5173/');
for (const s of steps) { if (/^\d+$/.test(s)) await p.waitForTimeout(+s); else if (s.startsWith('js:')) console.log(await p.evaluate(s.slice(3))); else await p.keyboard.press(s); }
await p.screenshot({ path: out });
console.log('errors:', errs.slice(0, 5).join('\n'));
await b.close();
