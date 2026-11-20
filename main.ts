// Leonida Ledger hand-in program.
//
// Copies the static guide (app/) and its screenshots (screenshots/) from this
// repository into the output directory, then writes dossier.json there with
// the kit library's buildDossier. The grader runs this file twice with no
// network; both runs must produce byte-identical output, so the copy below
// walks the trees in sorted order and writes nothing time-based.

import { buildDossier } from "./vendor/makefun-frontend.ts";
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = import.meta.dirname;
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Fail loudly rather than hand in an empty guide if the app tree is missing.
if (!existsSync(join(repoRoot, "app", "index.html"))) {
  throw new Error("app/index.html is missing from the repository");
}
if (!existsSync(join(repoRoot, "screenshots"))) {
  throw new Error("screenshots/ is missing from the repository");
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), {
  recursive: true,
});

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

writeFileSync(join(outDir, "dossier.json"), dossier);
