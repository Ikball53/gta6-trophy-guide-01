// Leonida Platinum Ledger — make.fun entry program.
// Copies app/ and screenshots/ from this repository into the output
// directory, then writes dossier.json there with the kit's buildDossier.
// Deterministic: no timestamps, no randomness, no network.
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(outDir, { recursive: true });
// Copy in a fixed order and from a clean slate so two runs hand in
// byte-identical trees: no stale files can ride along from an old run.
for (const part of ['app', 'screenshots']) {
  const dest = join(outDir, part);
  rmSync(dest, { recursive: true, force: true });
  cpSync(join(repoRoot, part), dest, { recursive: true });
}

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
