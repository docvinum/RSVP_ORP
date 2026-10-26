// Copie l'artefact distribué (dist/) dans chaque démonstrateur, comme le ferait
// une application hôte : examples/<demo>/vendor/universal-rsvp-reader/.
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('dist/ absent : exécutez « npm run build » au préalable.');
  process.exit(1);
}
const { version } = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'));
for (const demo of ['vanilla', 'vue', 'angular']) {
  const target = join(root, 'examples', demo, 'vendor', 'universal-rsvp-reader');
  rmSync(target, { recursive: true, force: true });
  cpSync(dist, target, { recursive: true });
  console.log(`examples/${demo}/vendor/universal-rsvp-reader ← v${version}`);
}
