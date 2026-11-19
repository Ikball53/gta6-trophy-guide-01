// Entry point: copies the static app and screenshots into the output
// directory, then writes a deterministic dossier.json for the grader.
import { existsSync, mkdirSync, cpSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });

const appSrc = join(process.cwd(), 'app');
const shotsSrc = join(process.cwd(), 'screenshots');
const appDst = join(outDir, 'app');
const shotsDst = join(outDir, 'screenshots');

if (existsSync(appSrc)) {
  cpSync(appSrc, appDst, { recursive: true, force: true });
}
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, shotsDst, { recursive: true, force: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

writeFileSync(join(outDir, 'dossier.json'), dossier);
