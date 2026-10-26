// Vérifie une copie de dist/ dans une application hôte : version et empreintes SHA-256.
// Usage : node scripts/verify-copy.mjs <dossier-copié>
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? '');
const manifestPath = join(dir, 'manifest.json');
if (!process.argv[2] || !existsSync(manifestPath)) {
  console.error('Usage : node scripts/verify-copy.mjs <dossier contenant manifest.json>');
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
let errors = 0;
for (const [file, expected] of Object.entries(manifest.files)) {
  const path = join(dir, file);
  if (!existsSync(path)) {
    console.error(`manquant : ${file}`);
    errors++;
    continue;
  }
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (actual !== expected) {
    console.error(`modifié : ${file}`);
    errors++;
  }
}
console.log(`${manifest.name} v${manifest.version} — ${Object.keys(manifest.files).length} fichiers, ${errors} erreur(s)`);
process.exit(errors ? 1 : 0);
