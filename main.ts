// StatAtlas hand-in program (Node 22, standard library only).
//
// The site is plain static files in app/ (HTML, CSS, ES modules, no build
// step), and its screenshots live in screenshots/. This program copies both
// into the output directory and writes dossier.json there with the vendored
// make.fun library, which is the summary the judge reads (screenshots, the
// first load's files and bytes, and the site's source).
//
// The grader runs it twice and both runs must write the same bytes. Outside
// the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's caps: at most 4 screenshots, each at most 256 KiB; app/ at
// most 993 files and directories and 16 MiB in all. The dossier text is
// capped at 160 KiB by the library.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
