// Leonida Platinum — entrypoint: copies app/ and screenshots/ to the output
// directory and writes /output/dossier.json with buildDossier from the kit's
// library. It never removes the output directory itself: in the grader the
// output directory is a bind-mount, and removing a mount point fails with
// EBUSY, which killed round 1 (run_completes, exit 1). So it clears only the
// directory's contents, then writes into it.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Make sure the output directory exists, then empty it WITHOUT removing it.
// The grader mounts /output: entries inside it can be deleted, the mount
// point itself cannot. The grader hands us an empty /output, so this is
// only a safety net for re-runs.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
}));
console.log('Leonida Platinum: wrote', outDir);
