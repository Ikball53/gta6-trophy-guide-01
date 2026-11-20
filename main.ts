// Leonida Trophy Companion — entry program for gta6-trophy-guide-01.
// Copies app/ and screenshots/ from this repository to the output directory
// (MAKEFUN_OUTPUT_DIR when set, otherwise /output) and writes dossier.json
// with buildDossier from the vendored makefun-frontend library.
// Deterministic: copies are sorted, the dossier bytes come from the library
// alone, and nothing here reads the clock or the network.

import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : "/output";

// Gate caps for this competition: dossier text at most 163,840 bytes,
// at most 4 screenshots of at most 256 KiB each.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
};

function copyTree(sourceDir: string, targetDir: string): number {
  let copied = 0;
  const entries = readdirSync(sourceDir, { withFileTypes: true })
    .slice()
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  for (const entry of entries) {
    const from = join(sourceDir, entry.name);
    const to = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      mkdirSync(to, { recursive: true });
      copied += copyTree(from, to);
    } else if (entry.isFile()) {
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

function requireDir(path: string, label: string): void {
  if (!existsSync(path) || !statSync(path).isDirectory()) {
    throw new Error(`missing ${label} directory: ${relative(repoRoot, path)}`);
  }
}

function main(): void {
  const appDir = join(repoRoot, "app");
  const shotsDir = join(repoRoot, "screenshots");
  requireDir(appDir, "app");
  requireDir(shotsDir, "screenshots");

  // Fail loudly before copying anything if the two files the gate always
  // needs are absent, so a broken repo never produces a half-written output.
  const indexHtml = join(appDir, "index.html");
  if (!existsSync(indexHtml) || !statSync(indexHtml).isFile()) {
    throw new Error("missing app/index.html: the app page must sit at the app root");
  }
  const trophyData = join(appDir, "data", "trophies.json");
  if (!existsSync(trophyData) || !statSync(trophyData).isFile()) {
    throw new Error("missing app/data/trophies.json: the trophy list must ship with the app");
  }

  mkdirSync(outputDir, { recursive: true });
  const appFiles = copyTree(appDir, join(outputDir, "app"));
  const shotFiles = copyTree(shotsDir, join(outputDir, "screenshots"));

  const dossier = buildDossier(repoRoot, CAPS);
  writeFileSync(join(outputDir, "dossier.json"), dossier);

  console.log(`app files copied: ${appFiles}`);
  console.log(`screenshots copied: ${shotFiles}`);
  console.log(`dossier.json written: ${dossier.byteLength} bytes`);
  console.log(`output: ${outputDir}`);
}

main();
