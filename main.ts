import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });

const appSrc = join(here, 'app');
const shotsSrc = join(here, 'screenshots');

if (existsSync(appSrc)) {
  cpSync(appSrc, join(outDir, 'app'), { recursive: true });
} else {
  throw new Error('Missing required folder: app/');
}
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, join(outDir, 'screenshots'), { recursive: true });
} else {
  throw new Error('Missing required folder: screenshots/');
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, 'dossier.json'), JSON.stringify(dossier, null, 2) + '\n', 'utf8');
