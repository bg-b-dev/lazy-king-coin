import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const base58 = (s: unknown, min: number, max: number) =>
  typeof s === 'string' && s.length >= min && s.length <= max && /^[1-9A-HJ-NP-Za-km-z]+$/.test(s);

mkdirSync(outDir, { recursive: true });
try {
  const launch = JSON.parse(readFileSync(join(botDir, 'LAUNCH.json'), 'utf8'));
  if (!base58(launch.mint, 32, 44)) throw new Error('mint is not a base58 address');
  if (!base58(launch.create_signature, 64, 88)) throw new Error('create_signature is not a base58 signature');
  copyFileSync(join(botDir, 'LAUNCH.json'), join(outDir, 'LAUNCH.json'));
} catch (err) {
  console.error(`$LAZY: LAUNCH.json not copied from ${botDir}: ${(err as Error).message}`);
  process.exit(1);
}
