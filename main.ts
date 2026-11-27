// Gobble Getaway — the hand-in program (Node 22, standard library only).
// It copies this repository's game/ and screenshots/ into /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function requireDir(path, label) {
  if (!existsSync(path)) throw new Error('missing ' + label + ': ' + path);
  return path;
}

requireDir(join(here, 'game'), 'game/');
requireDir(join(here, 'game', 'index.html'), 'game/index.html');
requireDir(join(here, 'screenshots'), 'screenshots/');

const shots = readdirSync(join(here, 'screenshots')).filter((n) => !n.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  throw new Error('expected 3 or 4 screenshots, found ' + shots.length);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log('wrote', out, 'with', shots.length, 'screenshots');

// Confirm the dossier actually landed before the grader ever sees it.
const dossierPath = join(out, 'dossier.json');
if (!existsSync(dossierPath)) throw new Error('dossier.json was not written');
const dossierBytes = statSync(dossierPath).size;
if (dossierBytes < 100) throw new Error('dossier.json looks empty');
console.log('dossier.json:', dossierBytes, 'bytes');
