// Leonida Trophy Companion entry point (Node 22+, standard library only).
// The deliverable is the static offline app under app/ plus the screenshots
// folder. This program stages both into the output directory and asks the
// vendored make.fun library to build dossier.json from them. The grader
// compares that dossier byte for byte against its own library copy, so the
// vendor file must stay untouched. Locally, MAKEFUN_OUTPUT_DIR replaces the
// grader's /output path. Runs are deterministic: same inputs, same bytes.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(rootDir, 'app'), join(outputDir, 'app'), { recursive: true });
cpSync(join(rootDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
console.log('dossier written:', dossierBytes.length, 'bytes');
