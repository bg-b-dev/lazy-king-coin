// Usage: node coin/make-metadata.mjs <commit sha that holds logo/lazy-king.png>
import { readFileSync, writeFileSync } from 'node:fs';

const sha = process.argv[2];
if (!/^[0-9a-f]{40}$/.test(sha ?? '')) throw new Error('pass a full commit sha');
const meta = {
  name: 'Lazy King',
  symbol: 'LAZY',
  description: readFileSync(new URL('./description.txt', import.meta.url), 'utf8').trim(),
  image: `https://raw.githubusercontent.com/bg-b-dev/lazy-king-coin/${sha}/logo/lazy-king.png`,
  showName: true,
  website: 'https://make.fun/bounty/makefun-coin-promo-01',
};
writeFileSync(new URL('./metadata.json', import.meta.url), JSON.stringify(meta, null, 2) + '\n');
console.log(meta.image);
