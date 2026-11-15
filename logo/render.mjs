import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const svg = readFileSync(new URL('./lazy-king.svg', import.meta.url), 'utf8');
mkdirSync('out', { recursive: true });
for (const [file, width] of [['logo/lazy-king.png', 1024], ['out/thumb-64.png', 64], ['out/thumb-128.png', 128]]) {
  writeFileSync(file, new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng());
  console.log(file, width);
}
