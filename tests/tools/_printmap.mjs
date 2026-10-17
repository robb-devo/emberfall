import { createServer } from 'vite';
const vite = await createServer({ root: '/workspace/emberfall', server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { MAPS } = await vite.ssrLoadModule('/src/data/maps.ts'); await vite.close();
for (const id of process.argv.slice(2)) { console.log(id); MAPS[id].grid.forEach((r, y) => console.log(String(y).padStart(2), r)); }
