import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
try {
  copyFileSync(join(botDir, 'LAUNCH.json'), join(outDir, 'LAUNCH.json'));
} catch (err) {
  console.error(`$LAZY: LAUNCH.json not copied from ${botDir}: ${(err as Error).message}`);
  process.exit(1);
}
