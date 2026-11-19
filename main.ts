// Leonida Platinum — entrypoint: hands the guide in.
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from the
// kit's library. The output directory itself is never removed: in the
// grader it is a bind-mount, and removing a mount point fails. Only the
// files inside it are cleared, so a stale file from an earlier run can
// never survive into a new one.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear what is inside the output directory, leaving the directory itself
// in place: the grader mounts it, so it must not be removed.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const marker = existsSync(join(outDir, 'app', 'index.html')) ? 'ok' : 'missing app';
const dossierBytes = dossier.length;
console.log(`Leonida Platinum: wrote ${outDir} (${marker}, dossier ${dossierBytes} bytes)`);
