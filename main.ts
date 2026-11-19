// Leonida Trophy Tracker — entrypoint for the make.fun grader.
// Copies app/ and screenshots/ into the output folder, then writes
// dossier.json with the vendored dossier builder. Standard library only.
import { buildDossier } from "./vendor/makefun-frontend.ts";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TEXT_MAX_BYTES = 163840;
const SHOT_MAX_COUNT = 4;
const SHOT_MAX_BYTES = 262144;

function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function copyTree(sourceDir: string, targetDir: string): void {
  mkdirSync(targetDir, { recursive: true });
  const entries = readdirSync(sourceDir, { withFileTypes: true }).sort((a, b) =>
    byCodeUnit(a.name, b.name),
  );
  for (const entry of entries) {
    const from = join(sourceDir, entry.name);
    const to = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      copyFileSync(from, to);
    }
  }
}

function outputDirOf(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  return fromEnv && fromEnv.length > 0 ? fromEnv : "/output";
}

function main(): void {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoDir = process.env.MAKEFUN_BOT_DIR ?? here;
  const outDir = outputDirOf();
  mkdirSync(outDir, { recursive: true });
  copyTree(join(repoDir, "app"), join(outDir, "app"));
  copyTree(join(repoDir, "screenshots"), join(outDir, "screenshots"));
  const dossier = buildDossier(outDir, {
    text_max_bytes: TEXT_MAX_BYTES,
    screenshots: { max: SHOT_MAX_COUNT, max_bytes: SHOT_MAX_BYTES },
  });
  writeFileSync(join(outDir, "dossier.json"), dossier);
}

main();
